import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { Registry } from '$lib/utils/registry.svelte.js';
import { createPointerDrag } from '$lib/utils/pointerDrag.js';
import { createVelocityTracker } from '$lib/utils/swipeVelocity.js';
// import { useTheme } from '$lib/utils/theme.svelte.js';
import { getContext, onMount, setContext, untrack } from 'svelte';
import { useTheme } from '../Theme/theme.state.svelte.js';
import type { DialogProps, DialogSnapPoint } from './dialog.props.js';
import { isTextField } from '$lib/utils/focus.js';
import { resolveSnapPoints, settleSnapIndex, snapPointHeight } from './dialog.snap.js';
import { useFocusScope } from '$lib/utils/useFocusScope.svelte.js';
import { useOpenLifecycle } from '$lib/utils/openLifecycle.svelte.js';
import {
	applyStateAttributes,
	openStateAttributes,
	transitionStatusAttributes
} from '$lib/utils/stateAttributes.js';
import { claimPopupOpen } from '../Popover/popover.claims.js';
import {
	getInteractionType,
	isOpenChangeDetails,
	requestOpenChange,
	resolveOpenChangeDetails,
	type OpenChangeDetails,
	type OpenChangeHandler,
	type OpenChangeInit
} from '$lib/utils/openChange.js';
import {
	triggerActivation,
	triggerFocusTarget,
	writePopupAria,
	type PopupTriggerProps
} from '$lib/utils/trigger.js';
import { useDialogMotion, type DialogThemeProps } from './dialog.theme.js';
import type { DialogApi } from './dialog.api.js';

export { DIALOG_Z_BASE, DIALOG_Z_STEP } from '../Theme/theme.layers.js';

// Stacked dialogs sit above a single shared backdrop (at DIALOG_Z_BASE - 1),
// each open dialog getting a z-index bump by its open order.

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
interface DialogOptions extends MakeRequired<
	Pick<
		DialogProps,
		| 'id'
		| 'type'
		| 'size'
		| 'scroll'
		| 'transition'
		| 'closeOnEscape'
		| 'closeOnClickOutside'
		| 'closable'
		| 'swipeToDismiss'
		| 'swipeFrom'
		| 'responsive'
		| 'focusOnClose'
		| 'modal'
		| 'snapPoints'
		| 'defaultSnapPoint'
		| 'onSnapPointChange'
	>,
	'id' | 'closeOnEscape' | 'closable' | 'modal'
> {
	isOpen: boolean;
	/** The resting snap point; `undefined` until one is chosen (the default point applies). */
	snapPoint?: DialogSnapPoint;
	onOpenChange?: OpenChangeHandler;
	onAfterOpen?: (payload: DialogApi) => void;
	onAfterClose?: (payload: DialogApi) => void;
	/** The instance `theme.motion` slot; the `transition` prop still wins over it. */
	motion?: DialogThemeProps['motion'];
}

/** What `open`, `close`, `toggle` and `setOpen` accept: details, a partial, or the DOM event. */
export type DialogOpenChangeInput = OpenChangeDetails | OpenChangeInit | Event;

export class DialogState extends createBindableStateClass<DialogOptions>() implements DialogApi {
	parent = getContext<DialogState | null>('dialog');
	// Nested dialogs join while they mount and leave when torn down; see `Registry`.
	readonly #children = new Registry<DialogState>();
	get children(): readonly DialogState[] {
		return this.#children.items;
	}
	theme = useTheme();
	// Svelte plays no intro for a block that is already true when it is created, so a Dialog
	// created open renders once it has mounted: it animates in like any other open (and is not
	// part of the server render, where it could only sit in the page flow).
	#mounted = $state(false);
	/** Whether the dialog is rendered: open, and mounted. */
	isRendered = $derived(this.isOpen && this.#mounted);
	// Open → entering → open → exiting → closed; completes even when no transition plays.
	lifecycle = useOpenLifecycle({
		isOpen: () => this.isRendered,
		onAfterOpen: () => this.onAfterOpen?.(this),
		onAfterClose: () => {
			this.focusScope.restore();
			this.onAfterClose?.(this);
			this.#opener = null;
		}
	});
	/** Where the dialog is in its open/close lifecycle; see `DialogApi.status`. */
	get status() {
		return this.lifecycle.status;
	}
	/** @deprecated Read `status === 'open'`; kept for one minor. */
	get hasTransitioned() {
		return this.lifecycle.status === 'open';
	}
	/**
	 * `data-open` / `data-closed` and `data-entering` / `data-exiting` for the root and the panel
	 * (see `dialogDataAttributes`). Closed, they render only while the exit transition plays.
	 */
	stateAttributes = $derived({
		...openStateAttributes(this.isOpen),
		...transitionStatusAttributes(this.lifecycle.status)
	});
	/** The details of the last change that was applied, kept until the next one. */
	lastOpenChange = $state.raw<OpenChangeDetails | null>(null);
	/** The open state `setOpen` last applied, to tell a change made from outside. */
	#appliedOpen: boolean | undefined;
	// Registered in the shared layer stack, which owns Escape / outside-press / close-request
	// dismissal, open ordering and z-index for every overlay kind.
	layer = this.theme.layers.register({
		kind: 'dialog',
		isOpen: () => this.isOpen,
		isModal: () => this.modal,
		dismissOnEscape: () => this.closeOnEscape && this.closable,
		dismissOnOutside: () => this.computedCloseOnClickOutside,
		onDismiss: (request) => this.setOpen(false, request),
		state: this
	});
	/**
	 * Trigger state in the library's semantic vocabulary: spread on the built-in Button, and
	 * written as ARIA attributes by `reference` / `trigger` on a snippet trigger.
	 */
	triggerProps: PopupTriggerProps = $derived({
		haspopup: 'dialog',
		expanded: this.isOpen,
		controls: this.isOpen ? this.id : undefined
	});

	/**
	 * How many open modal dialogs sit above this one. A non-modal dialog leaves the page usable, so
	 * it does not push the ones beneath it back.
	 */
	stackDepth = $derived.by(() => {
		const dialogs = this.theme.layers.ofKind('dialog');
		const index = dialogs.indexOf(this.layer);
		return index < 0 ? 0 : dialogs.slice(index + 1).filter((layer) => layer.isModal).length;
	});
	/** The dialog directly above this one, whose swipe this one follows. */
	childAbove = $derived.by((): DialogState | undefined => {
		const dialogs = this.theme.layers.ofKind('dialog');
		const index = dialogs.indexOf(this.layer);
		const child = index < 0 ? undefined : dialogs[index + 1]?.state;
		return child instanceof DialogState && child.modal ? child : undefined;
	});
	/** Whether the dialog above is being dragged, so this one tracks it without easing. */
	followsChild = $derived(!!this.childAbove?.dragging);
	/** The stack depth as the dialog above is dismissed: it shrinks toward the next level as it is dragged away. */
	effectiveDepth = $derived(
		Math.max(0, this.stackDepth - (this.childAbove ? this.childAbove.dragProgress : 0))
	);
	/** Topmost dialog (popovers opened above it do not count). */
	isTop = $derived(this.layer.isTopOfKind);

	// Topmost dialog renders at full size; parents scale down and fade behind it.
	zIndex = $derived(this.layer.zIndex);
	stackScale = $derived(Math.max(0, 1 - this.effectiveDepth * 0.06));
	stackOpacity = $derived(
		this.effectiveDepth === 0 ? 1 : Math.max(0.4, 1 - this.effectiveDepth * 0.35)
	);

	computedSize = $derived(this.theme.resolveResponsiveProps(this.size, 'normal'));
	// A `modal` collapses into a bottom sheet on mobile unless `responsive` is off. This
	// runs after `resolveResponsiveProps`, so an explicit responsive `type` record still
	// wins for every band it names — only a resolved `modal` is rebound. The sheet then
	// inherits swipe-to-dismiss + the thumb for free (see `isDrawer`).
	computedType = $derived.by(() => {
		const resolved = this.theme.resolveResponsiveProps(this.type, 'modal');
		if ((this.responsive ?? true) && resolved === 'modal' && this.theme.isMobile) {
			return 'drawerBottom';
		}
		return resolved;
	});
	// A non-modal dialog lets the page behind take pointer events, so the positioner cannot be
	// the scroller: it scrolls inside its card.
	computedScroll = $derived(
		this.modal ? this.theme.resolveResponsiveProps(this.scroll, 'inner') : 'inner'
	);
	/** Whether the resolved type is `alert`: an interruption that needs an explicit answer. */
	isAlert = $derived(this.computedType === 'alert');
	/** `alertdialog` for an alert, so assistive technology announces it as one. */
	role: 'dialog' | 'alertdialog' = $derived(this.isAlert ? 'alertdialog' : 'dialog');
	/**
	 * `closeOnClickOutside` when set; otherwise an outside press dismisses a modal that is not an
	 * alert. A non-modal dialog stays open while the page is used.
	 */
	computedCloseOnClickOutside = $derived(this.closeOnClickOutside ?? (this.modal && !this.isAlert));

	// Per-type preset from `dialogTheme.motion`, through the override ladder
	// (registry → `setDialogTheme` → instance `theme.motion` → `transition` prop).
	private resolveMotion = useDialogMotion();
	computedTransition = $derived(
		this.resolveMotion(
			{ type: this.computedType },
			{ motion: this.motion, transition: this.transition }
		)
	);

	// --- Swipe to dismiss (drawer types) ---
	isDrawer = $derived(this.computedType.startsWith('drawer'));
	swipeEnabled = $derived(this.isDrawer && this.closable && (this.swipeToDismiss ?? true));
	swipeAxis: 'x' | 'y' = $derived(
		this.computedType === 'drawerTop' || this.computedType === 'drawerBottom' ? 'y' : 'x'
	);
	// Dismiss direction sign along the axis: bottom/right drag toward +; top/left toward −.
	swipeSign = $derived(
		this.computedType === 'drawerBottom' || this.computedType === 'drawerRight' ? 1 : -1
	);
	dragging = $state(false);
	/**
	 * Where the panel sits along the dismiss axis, in px (0 = fully open). Follows the finger while
	 * dragging and otherwise rests at 0, or at the active snap point's offset.
	 */
	dragOffset = $state(0);
	dragSize = $state(0); // panel extent along the axis, measured at drag start
	/** Drag progress toward dismissal, 0 while resting at the open position or any snap point. */
	dragProgress = $derived.by(() => {
		const floor = this.snapFloor;
		return this.dragSize > floor
			? Math.min(Math.max(Math.abs(this.dragOffset) - floor, 0) / (this.dragSize - floor), 1)
			: 0;
	});
	contentTransform = $derived.by(() => {
		if (this.dragOffset === 0 && this.effectiveDepth === 0) {
			return undefined;
		}
		return `translate3d(${this.swipeAxis === 'x' ? this.dragOffset : 0}px, ${this.swipeAxis === 'y' ? this.dragOffset : 0}px, 0) scale(${this.stackScale})`;
	});

	// --- Snap points (bottom and top drawers) ---
	/** Whether the drawer rests at snap points: a bottom or top drawer with `snapPoints`. */
	snapEnabled = $derived(
		!!this.snapPoints?.length &&
			(this.computedType === 'drawerBottom' || this.computedType === 'drawerTop')
	);
	/** Room in px the drawer may use, measured from the positioner; 0 until it is laid out. */
	availableSize = $state(0);
	#viewportSize = $state(0);
	#rootFontSize = $state(16);
	/** The snap points as px heights, lowest first. */
	snapHeights = $derived(
		this.snapEnabled
			? resolveSnapPoints(this.snapPoints, {
					available: this.availableSize,
					viewport: this.#viewportSize,
					rem: this.#rootFontSize
				})
			: []
	);
	/** The point the drawer rests at: `snapPoint`, else `defaultSnapPoint`, else the largest. */
	activeSnap = $derived.by(() => {
		const heights = this.snapHeights;
		const wanted = this.snapPoint ?? this.defaultSnapPoint;
		if (wanted === undefined) return heights.at(-1);
		const exact = heights.find((snap) => snap.point === wanted);
		return exact ?? this.#nearestSnap(wanted) ?? heights.at(-1);
	});
	/** The value of `snapPoint` right now, as the consumer wrote it. */
	currentSnapPoint = $derived(this.activeSnap?.point);
	/** Whether the drawer rests at its largest point, the only one where its body scrolls. */
	atLargestSnap = $derived(!this.activeSnap || this.activeSnap === this.snapHeights.at(-1));
	/** The panel's height in px: the largest snap point. */
	snapPanelHeight = $derived(this.snapHeights.at(-1)?.height);
	/** The panel offset in px (signed along the dismiss axis) at the active point. */
	restOffset = $derived.by(() => {
		const largest = this.snapHeights.at(-1);
		if (!largest || !this.activeSnap) return 0;
		return this.swipeSign * (largest.height - this.activeSnap.height);
	});
	/** Offset in px at the lowest point: dragging beyond it moves toward dismissal. */
	snapFloor = $derived.by(() => {
		const largest = this.snapHeights.at(-1);
		const lowest = this.snapHeights[0];
		return largest && lowest ? largest.height - lowest.height : 0;
	});
	/** Whether the panel can be dragged: to dismiss it, or between snap points. */
	gestureEnabled = $derived(this.swipeEnabled || (this.snapEnabled && this.isDrawer));
	/** The panel scrolls only while it shows in full. */
	bodyScrollLocked = $derived(
		this.snapEnabled && this.snapHeights.length > 0 && !this.atLargestSnap
	);

	#nearestSnap(point: DialogSnapPoint) {
		const height = snapPointHeight(point, {
			available: this.availableSize,
			viewport: this.#viewportSize,
			rem: this.#rootFontSize
		});
		if (!Number.isFinite(height)) return undefined;
		let nearest: (typeof this.snapHeights)[number] | undefined;
		for (const snap of this.snapHeights) {
			if (!nearest || Math.abs(snap.height - height) < Math.abs(nearest.height - height)) {
				nearest = snap;
			}
		}
		return nearest;
	}

	/**
	 * Moves the drawer to a snap point (one of `snapPoints`, or the nearest to it). `onSnapPointChange`
	 * runs first with the change details; cancelling keeps the current point. Returns `false` when
	 * the change did not happen.
	 */
	setSnapPoint(point: DialogSnapPoint, input?: DialogOpenChangeInput): boolean {
		const target =
			this.snapHeights.find((snap) => snap.point === point) ?? this.#nearestSnap(point);
		if (!target) return false;
		if (target === this.activeSnap) return true;
		const details = this.#details(input);
		this.onSnapPointChange?.({ snapPoint: target.point, details });
		if (details.isCanceled) return false;
		this.snapPoint = target.point;
		return true;
	}

	/** Reads the layout the snap points are measured against. */
	#measureLayout(node: HTMLElement) {
		const positioner = node.parentElement;
		if (!positioner) return;
		const view = node.ownerDocument.defaultView;
		const style = view?.getComputedStyle(positioner);
		const padding =
			(parseFloat(style?.paddingTop ?? '') || 0) + (parseFloat(style?.paddingBottom ?? '') || 0);
		this.availableSize = Math.max(0, positioner.clientHeight - padding);
		this.#viewportSize = view?.innerHeight ?? 0;
		this.#rootFontSize =
			parseFloat(view?.getComputedStyle(node.ownerDocument.documentElement).fontSize ?? '') || 16;
	}

	// --- Keyboard (bottom sheets) ---
	/** Whether a text field inside the panel has focus, so the on-screen keyboard may be up. */
	fieldFocused = $state(false);
	/** A bottom sheet gives room to the keyboard while one of its fields has focus. */
	keyboardAvoiding = $derived(this.fieldFocused && this.computedType === 'drawerBottom');

	// Initial focus, Tab containment, `inert` page behind, focus restore to the opener: the
	// trigger that opened it, else whatever had focus when it opened.
	focusScope = useFocusScope({
		isActive: () => this.isTop,
		trap: () => this.modal && this.isTop,
		inertSiblings: () => this.modal,
		returnTo: () => (this.#opener?.isConnected ? this.#opener : null),
		focusOnClose: () => this.focusOnClose,
		closeDetails: () => this.lastOpenChange
	});

	addChild = (child: DialogState) => () => this.#children.add(child);

	constructor(options: DialogOptions) {
		super(options);
		setContext('dialog', this);
		// Details describe the change `setOpen` made: an open state moved from outside (the bound
		// `open` prop) leaves none, so a later close does not read the one that opened it.
		$effect.pre(() => {
			const open = this.isOpen;
			untrack(() => {
				if (this.#appliedOpen !== open) this.lastOpenChange = null;
				this.#appliedOpen = open;
			});
		});
		if (this.parent) onMount(this.parent.addChild(this));
		onMount(() => {
			this.#mounted = true;
		});
		// The root's and the panel's open state and transition phase, written from here rather than
		// only by the template: Svelte pauses the effects of a block while its out-transition plays,
		// so the template would leave a closing dialog marked `data-open` until it is gone.
		$effect(() => {
			const content = this.#contentElement;
			if (!content) return;
			const attributes = this.stateAttributes;
			applyStateAttributes(content, attributes);
			const root = content.closest('[data-layer-root]');
			if (root) applyStateAttributes(root, attributes);
		});
	}

	/** The panel element while it is rendered, closing transition included. */
	#contentElement = $state<HTMLElement | null>(null);

	/** Calls to `setOpen`, direct or through `open`, `close` and `toggle`, unchanged state included. */
	#openRequests = 0;
	/** The element focus returns to: the control of the trigger that opened the dialog. */
	#opener: HTMLElement | null = null;
	/** A press on a trigger, remembered while its event dispatches. */
	#press: { node: HTMLElement; event: Event } | null = null;

	toggle = (input?: DialogOpenChangeInput) => {
		this.setOpen(!this.isOpen, input);
	};
	open = (input?: DialogOpenChangeInput) => {
		this.setOpen(true, input);
	};

	close = (input?: DialogOpenChangeInput) => {
		this.setOpen(false, input);
	};

	/** The details for a request, filled in from the trigger press it happens during. */
	#details(input?: DialogOpenChangeInput): OpenChangeDetails {
		if (isOpenChangeDetails(input)) return input;
		const event = input instanceof Event ? input : input?.event;
		const press = this.#press && (!event || event === this.#press.event) ? this.#press : null;
		return resolveOpenChangeDetails(
			input,
			press
				? { reason: 'trigger-press', event: press.event, trigger: press.node }
				: { interaction: getInteractionType(event) }
		);
	}

	/**
	 * Requests an open-state change. `onOpenChange(nextOpen, details)` runs first; when it calls
	 * `details.cancel()` nothing changes. Returns `false` when the change was cancelled.
	 */
	setOpen(nextOpen: boolean, input?: DialogOpenChangeInput): boolean {
		this.#openRequests += 1;
		if (this.isOpen === nextOpen) return true;
		const details = this.#details(input);
		if (!requestOpenChange(this.onOpenChange, nextOpen, details)) return false;
		if (nextOpen) {
			this.#opener = details.trigger ? triggerFocusTarget(details.trigger, details.event) : null;
		}
		this.lastOpenChange = details;
		this.#appliedOpen = nextOpen;
		this.isOpen = nextOpen;
		return true;
	}

	/**
	 * Attachment for a custom trigger element (`{@attach dialog.reference}`): keeps its
	 * `aria-haspopup`, `aria-expanded` and `aria-controls` in sync and makes it the element focus
	 * returns to, leaving clicks and keys to the element.
	 */
	reference = (node: HTMLElement) => {
		$effect(() => {
			writePopupAria(node, this.triggerProps);
		});
		// Claimed, not written: a tooltip on the same trigger closing while the dialog is open
		// must leave `data-popup-open` in place.
		$effect(() => {
			claimPopupOpen(node, this, this.isOpen);
			return () => claimPopupOpen(node, this, false);
		});
		return untrack(() => {
			// Capture phase: runs before the element's own (delegated) handlers, so a
			// `dialog.open()` called from `onclick` knows the press it belongs to.
			const notePress = (event: Event) => {
				const press = { node, event };
				this.#press = press;
				setTimeout(() => {
					if (this.#press === press) this.#press = null;
				});
			};
			node.addEventListener('click', notePress, true);
			return () => {
				node.removeEventListener('click', notePress, true);
				if (this.#press?.node === node) this.#press = null;
			};
		});
	};

	/**
	 * Makes any element the dialog's trigger (`{@attach dialog.trigger}`): `reference`, plus a
	 * click that opens the dialog, and on an element that is not already a control
	 * `role="button"`, `tabindex="0"` and Enter/Space activation. The element's own handler runs
	 * first: calling `event.preventDefault()` there, or opening the dialog itself, stops it.
	 */
	trigger = (node: HTMLElement) => {
		const offActivation = triggerActivation(node, {
			requests: () => this.#openRequests,
			activate: (event) => this.open({ reason: 'trigger-press', event, trigger: node })
		});
		const offReference = this.reference(node);
		return () => {
			offActivation();
			offReference();
		};
	};

	contentAttachment = (node: HTMLElement) => {
		return untrack(() => {
			const cleanups: Array<(() => void) | void> = [];
			this.#contentElement = node;
			cleanups.push(() => {
				if (this.#contentElement === node) this.#contentElement = null;
			});
			cleanups.push(this.focusScope.attachment(node));
			cleanups.push(this.layer.node(node));
			cleanups.push(this.swipeAttachment(node));
			cleanups.push(this.keyboardAttachment(node));
			return () => {
				cleanups.forEach((cleanup) => cleanup?.());
			};
		});
	};

	// Native controls that own their own pointer gesture — a drag starting on one of
	// these must never become a drawer dismiss.
	static readonly NO_SWIPE_TAGS: readonly string[] = [
		'INPUT',
		'TEXTAREA',
		'SELECT',
		'BUTTON',
		'A',
		'VIDEO',
		'AUDIO'
	];

	/** Whether text inside `panel` is selected: a drag there is meant to extend the selection. */
	static hasSelectionIn(panel: HTMLElement): boolean {
		const selection = panel.ownerDocument.getSelection?.();
		if (!selection || selection.isCollapsed || selection.rangeCount === 0) return false;
		return panel.contains(selection.anchorNode) || panel.contains(selection.focusNode);
	}

	// While a text field inside the panel has focus the on-screen keyboard may be up. A bottom sheet
	// then makes room for it (`keyboardAvoiding`, see `--keyboard-inset`), and the field is brought
	// into view once the visual viewport has stopped moving. The flag is released a frame late, so
	// a tap that moves focus from one field to the next never lets the sheet drop in between.
	private keyboardAttachment = (node: HTMLElement) => {
		const view = node.ownerDocument.defaultView;
		if (!view) return;
		let release = 0;
		let reveal: ReturnType<typeof setTimeout> | undefined;
		let revealing: (() => void) | undefined;

		const insetNow = () =>
			parseFloat(
				view
					.getComputedStyle(node.ownerDocument.documentElement)
					.getPropertyValue('--keyboard-inset')
			) || 0;

		const stopRevealing = () => {
			clearTimeout(reveal);
			reveal = undefined;
			revealing?.();
			revealing = undefined;
		};

		const revealWhenSettled = (field: HTMLElement) => {
			stopRevealing();
			const viewport = view.visualViewport;
			const show = () => {
				stopRevealing();
				if (field.isConnected && field.ownerDocument.activeElement === field && insetNow() > 0) {
					field.scrollIntoView({ block: 'center', inline: 'nearest' });
				}
			};
			// The keyboard animates for a few hundred ms: wait for the viewport to stop resizing, and
			// give up waiting after a short while in case it never moves (a hardware keyboard).
			const settle = () => {
				clearTimeout(reveal);
				reveal = setTimeout(show, 120);
			};
			viewport?.addEventListener('resize', settle);
			revealing = () => viewport?.removeEventListener('resize', settle);
			reveal = setTimeout(show, 400);
		};

		const onFocusIn = (event: FocusEvent) => {
			const field = event.target;
			if (!isTextField(field instanceof Element ? field : null)) return;
			cancelAnimationFrame(release);
			this.fieldFocused = true;
			revealWhenSettled(field as HTMLElement);
		};
		const onFocusOut = () => {
			cancelAnimationFrame(release);
			release = requestAnimationFrame(() => {
				const active = node.ownerDocument.activeElement;
				if (!isTextField(active) || !node.contains(active)) {
					this.fieldFocused = false;
					stopRevealing();
				}
			});
		};

		node.addEventListener('focusin', onFocusIn);
		node.addEventListener('focusout', onFocusOut);
		return () => {
			node.removeEventListener('focusin', onFocusIn);
			node.removeEventListener('focusout', onFocusOut);
			cancelAnimationFrame(release);
			stopRevealing();
			this.fieldFocused = false;
		};
	};

	// Vaul-style drag-to-dismiss for drawer types. Pointer-event driven so it works for
	// mouse and touch; inner scroll wins over the swipe (see swipeOwnsGesture). With snap points
	// the same drag moves the panel between them.
	private swipeAttachment = (node: HTMLElement) => {
		let candidate = false;
		let startPos = 0;
		/** How far from fully open the panel was when the press began, in px (magnitude). */
		let startOffset = 0;
		let pointerType = 'mouse';
		let selectionBlocks = false;
		// Release speed over a short window: a trailing stationary sample or a 120 Hz input
		// keeps a flick a flick, and a pointer that rested before release has none left.
		const tracker = createVelocityTracker();

		const axisPos = (e: PointerEvent) => (this.swipeAxis === 'y' ? e.clientY : e.clientX);

		// True when the press landed on something that owns the gesture: a `data-no-swipe`
		// opt-out, a native control, or a scrollable region (the panel itself included) that
		// can still consume movement along the dismiss direction — dragging toward the edge
		// scrolls it the other way, so it keeps the gesture unless already at that boundary.
		const ownsGesture = (target: EventTarget | null): boolean => {
			let el = target instanceof Element ? target : null;
			while (el) {
				if (el.hasAttribute('data-no-swipe')) return true;
				if (DialogState.NO_SWIPE_TAGS.includes(el.tagName) || (el as HTMLElement).isContentEditable)
					return true;
				const style = getComputedStyle(el);
				const overflow = this.swipeAxis === 'y' ? style.overflowY : style.overflowX;
				if (overflow === 'auto' || overflow === 'scroll') {
					if (this.swipeAxis === 'y') {
						if (this.swipeSign > 0 && el.scrollTop > 0) return true;
						if (this.swipeSign < 0 && el.scrollTop < el.scrollHeight - el.clientHeight - 1)
							return true;
					} else {
						// `scrollLeft` counts from the start edge: negative in a right-to-left scroller.
						// Read as the distance from the physical left edge, dragging right (+) can scroll
						// back while it is past 0, and dragging left (−) while the far end is out of reach.
						const maxScroll = el.scrollWidth - el.clientWidth;
						const fromLeft = style.direction === 'rtl' ? el.scrollLeft + maxScroll : el.scrollLeft;
						if (this.swipeSign > 0 && fromLeft > 0) return true;
						if (this.swipeSign < 0 && fromLeft < maxScroll - 1) return true;
					}
				}
				if (el === node) break;
				el = el.parentElement;
			}
			return false;
		};

		const endDrag = (event: PointerEvent, cancelled: boolean) => {
			candidate = false;
			if (!this.dragging) return;
			this.dragging = false;
			tracker.add(axisPos(event), event.timeStamp);
			const velocity = tracker.velocity(event.timeStamp) * this.swipeSign;
			let shouldClose = false;
			let snapTo: DialogSnapPoint | undefined;
			if (!cancelled && this.isOpen) {
				if (this.snapHeights.length > 0) {
					// Between snap points: the nearest one to where the drag is heading, or dismissal below
					// the lowest when swipe-to-dismiss is on.
					const largest = this.snapHeights[this.snapHeights.length - 1];
					const index = settleSnapIndex(
						this.snapHeights.map((snap) => snap.height),
						largest.height - Math.abs(this.dragOffset),
						velocity,
						this.swipeEnabled
					);
					if (index < 0) shouldClose = true;
					else snapTo = this.snapHeights[index].point;
				} else {
					// Without usable snap points the drag only dismisses where swiping to dismiss is on.
					shouldClose =
						this.swipeEnabled &&
						(Math.abs(this.dragOffset) > this.dragSize * 0.25 || velocity > 0.4);
				}
			}
			// Closing keeps dragOffset so the out transition starts from the dragged position.
			// Snap-back waits a frame so the re-enabled CSS transition animates the return — and
			// yields to a drag that started in the meantime, or it would zero that drag's offset.
			// A close that `onOpenChange` cancels snaps back the same way.
			if (shouldClose && this.setOpen(false, { reason: 'swipe', event })) return;
			if (snapTo !== undefined) this.setSnapPoint(snapTo, { reason: 'swipe', event });
			requestAnimationFrame(() => {
				if (!this.dragging) this.dragOffset = this.restOffset;
			});
		};

		const drag = createPointerDrag({
			disabled: () => !this.gestureEnabled || !this.isTop,
			// The panel is the whole drawer, not a handle: capturing every press would retarget the
			// compatibility mouse events and steal clicks from the buttons and inputs inside it.
			capture: 'on-activate',
			// Touch panning is already governed by `touch-action` on the handles and by `ownsGesture`,
			// which only promotes where nothing else can still scroll along the axis.
			preventTouchMove: false,
			// A press that travels mostly across the dismiss axis is spent before the drawer can take
			// it, so a sideways drag (a carousel in the drawer) never starts dismissing it.
			axis: () => this.swipeAxis,
			onDown: ({ event }) => {
				candidate = true;
				startPos = axisPos(event);
				pointerType = event.pointerType;
				selectionBlocks = DialogState.hasSelectionIn(node);
				tracker.reset();
				tracker.add(startPos, event.timeStamp);
				this.#measureLayout(node);
				const largest = this.snapHeights.at(-1);
				this.dragSize =
					this.snapEnabled && largest
						? largest.height
						: this.swipeAxis === 'y'
							? node.offsetHeight
							: node.offsetWidth;
				// From the resting place, not from an offset still easing back from the last drag.
				startOffset = Math.abs(this.restOffset);
			},
			// The press becomes a drag once it has moved past 4px toward the dismissing edge, or,
			// resting below the largest snap point, toward the opposite edge to open further.
			shouldActivate: ({ event, startTarget }) => {
				if (!candidate || !this.isOpen) return false;
				const pos = axisPos(event);
				const delta = (pos - startPos) * this.swipeSign; // + = dismiss direction
				// Handles (thumb, header) always drag — even when a scrolled body would own the
				// gesture. The body drags only under a finger, in `panel` mode, never with a text
				// selection to extend, and never over a region that can still scroll along the axis.
				// A mouse or pen press on the body selects text instead. The intent is fixed to where
				// the press started.
				const onHandle =
					startTarget instanceof Element && !!startTarget.closest('[data-drag-handle]');
				const eligible =
					onHandle ||
					((this.swipeFrom ?? 'panel') === 'panel' &&
						pointerType === 'touch' &&
						!selectionBlocks &&
						!ownsGesture(startTarget));
				const opening = this.snapHeights.length > 0 && !this.atLargestSnap && delta < -4;
				if ((delta > 4 || opening) && eligible) return true;
				// Wrong direction, or the target owns the gesture: the press is spent. The session
				// itself stays until the pointer lifts, so a second finger cannot take over mid-press.
				if (Math.abs(pos - startPos) > 4) candidate = false;
				return false;
			},
			onStart: () => {
				this.dragging = true;
			},
			onMove: ({ event }) => {
				const pos = axisPos(event);
				// Clamped: it can't be dragged past open, nor past its own extent.
				const travelled = startOffset + (pos - startPos) * this.swipeSign;
				const magnitude = Math.max(
					0,
					this.dragSize > 0 ? Math.min(travelled, this.dragSize) : travelled
				);
				this.dragOffset = this.swipeSign * magnitude;
				tracker.add(pos, event.timeStamp);
			},
			onEnd: ({ event }) => endDrag(event, false),
			onCancel: ({ event }) => endDrag(event, true)
		});

		// Fresh mount = fresh open: start from the resting position (open, or the active snap point)
		// rather than any offset left over from a drag-dismiss. The layout is read first, so snap
		// points have heights; a change in it (rotation, a keyboard) moves the panel with it.
		this.#measureLayout(node);
		this.dragging = false;
		this.dragOffset = this.restOffset;
		const positioner = node.parentElement;
		const observer =
			positioner && typeof ResizeObserver !== 'undefined'
				? new ResizeObserver(() => this.#measureLayout(node))
				: undefined;
		if (positioner) observer?.observe(positioner);
		$effect(() => {
			const offset = this.restOffset;
			untrack(() => {
				if (!this.dragging) this.dragOffset = offset;
			});
		});
		const stopDrag = drag(node);
		return () => {
			stopDrag?.();
			observer?.disconnect();
		};
	};
}

/**
 * The state behind the `DialogApi` a Dialog hands its snippets and callbacks. For library code
 * and tests that read a dialog's internals; consumers get the narrow API.
 */
export const dialogInternals = (dialog: DialogApi): DialogState => dialog as DialogState;
