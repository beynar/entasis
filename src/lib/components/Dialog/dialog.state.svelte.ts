import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { Registry } from '$lib/utils/registry.svelte.js';
import { createPointerDrag } from '$lib/utils/pointerDrag.js';
import { createVelocityTracker } from '$lib/utils/swipeVelocity.js';
// import { useTheme } from '$lib/utils/theme.svelte.js';
import { getContext, onMount, setContext, untrack } from 'svelte';
import { useTheme } from '../Theme/theme.state.svelte.js';
import type { DialogProps } from './dialog.props.js';
import { useFocusScope } from '$lib/utils/useFocusScope.svelte.js';
import { useOpenLifecycle } from '$lib/utils/openLifecycle.svelte.js';
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
	>,
	'closeOnEscape' | 'closable'
> {
	isOpen: boolean;
	onOpenChange?: OpenChangeHandler;
	onAfterOpen?: (payload: DialogState) => void;
	onAfterClose?: (payload: DialogState) => void;
	/** The instance `theme.motion` slot; the `transition` prop still wins over it. */
	motion?: DialogThemeProps['motion'];
}

/** What `open`, `close`, `toggle` and `setOpen` accept: details, a partial, or the DOM event. */
export type DialogOpenChangeInput = OpenChangeDetails | OpenChangeInit | Event;

export class DialogState extends createBindableStateClass<DialogOptions>() {
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
	/** @deprecated Read `lifecycle.status === 'open'`; kept for one minor. */
	get hasTransitioned() {
		return this.lifecycle.status === 'open';
	}
	/** The details of the last change that was applied, kept until the next one. */
	lastOpenChange = $state.raw<OpenChangeDetails | null>(null);
	// Registered in the shared layer stack, which owns Escape / outside-press / close-request
	// dismissal, open ordering and z-index for every overlay kind.
	layer = this.theme.layers.register({
		kind: 'dialog',
		isOpen: () => this.isOpen,
		isModal: () => true,
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

	/** How many open dialogs sit above this one. */
	stackDepth = $derived(this.layer.kindDepth);
	/** Topmost dialog (popovers opened above it do not count). */
	isTop = $derived(this.layer.isTopOfKind);

	// Topmost dialog renders at full size; parents scale down and fade behind it.
	zIndex = $derived(this.layer.zIndex);
	stackScale = $derived(Math.max(0, 1 - this.stackDepth * 0.06));
	stackOpacity = $derived(this.stackDepth === 0 ? 1 : Math.max(0.4, 1 - this.stackDepth * 0.35));

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
	computedScroll = $derived(this.theme.resolveResponsiveProps(this.scroll, 'inner'));
	/** Whether the resolved type is `alert`: an interruption that needs an explicit answer. */
	isAlert = $derived(this.computedType === 'alert');
	/** `alertdialog` for an alert, so assistive technology announces it as one. */
	role: 'dialog' | 'alertdialog' = $derived(this.isAlert ? 'alertdialog' : 'dialog');
	/** `closeOnClickOutside` when set; otherwise an outside press dismisses anything but an alert. */
	computedCloseOnClickOutside = $derived(this.closeOnClickOutside ?? !this.isAlert);

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
	dragOffset = $state(0); // px along the dismiss axis (0 = resting open position)
	dragSize = $state(0); // panel extent along the axis, measured at drag start
	dragProgress = $derived(
		this.dragSize > 0 ? Math.min(Math.abs(this.dragOffset) / this.dragSize, 1) : 0
	);
	contentTransform = $derived.by(() => {
		if (this.dragOffset === 0 && this.stackDepth === 0) {
			return undefined;
		}
		return `translate3d(${this.swipeAxis === 'x' ? this.dragOffset : 0}px, ${this.swipeAxis === 'y' ? this.dragOffset : 0}px, 0) scale(${this.stackScale})`;
	});

	// Initial focus, Tab containment, `inert` page behind, focus restore to the opener: the
	// trigger that opened it, else whatever had focus when it opened.
	focusScope = useFocusScope({
		isActive: () => this.isTop,
		inertSiblings: () => true,
		returnTo: () => (this.#opener?.isConnected ? this.#opener : null)
	});

	addChild = (child: DialogState) => () => this.#children.add(child);

	constructor(options: DialogOptions) {
		super(options);
		setContext('dialog', this);
		if (this.parent) onMount(this.parent.addChild(this));
		onMount(() => {
			this.#mounted = true;
		});
	}

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
			cleanups.push(this.focusScope.attachment(node));
			cleanups.push(this.layer.node(node));
			cleanups.push(this.swipeAttachment(node));
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

	// Vaul-style drag-to-dismiss for drawer types. Pointer-event driven so it works for
	// mouse and touch; inner scroll wins over the swipe (see swipeOwnsGesture).
	private swipeAttachment = (node: HTMLElement) => {
		let candidate = false;
		let startPos = 0;
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
						// ponytail: LTR scroll math; RTL flips scrollLeft — handle if RTL drawers land
						if (this.swipeSign > 0 && el.scrollLeft > 0) return true;
						if (this.swipeSign < 0 && el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
							return true;
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
			const shouldClose =
				!cancelled &&
				this.isOpen &&
				(Math.abs(this.dragOffset) > this.dragSize * 0.25 || velocity > 0.4);
			// Closing keeps dragOffset so the out transition starts from the dragged position.
			// Snap-back waits a frame so the re-enabled CSS transition animates the return — and
			// yields to a drag that started in the meantime, or it would zero that drag's offset.
			// A close that `onOpenChange` cancels snaps back the same way.
			if (shouldClose && this.setOpen(false, { reason: 'swipe', event })) return;
			requestAnimationFrame(() => {
				if (!this.dragging) this.dragOffset = 0;
			});
		};

		const drag = createPointerDrag({
			disabled: () => !this.swipeEnabled || !this.isTop,
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
				tracker.reset();
				tracker.add(startPos, event.timeStamp);
				this.dragSize = this.swipeAxis === 'y' ? node.offsetHeight : node.offsetWidth;
			},
			// The press becomes a drag once it has moved past 4px toward the dismissing edge.
			shouldActivate: ({ event, startTarget }) => {
				if (!candidate || !this.isOpen) return false;
				const pos = axisPos(event);
				const delta = (pos - startPos) * this.swipeSign; // + = dismiss direction
				// Handles (thumb, header) always drag — even when a scrolled body would own the
				// gesture. The body only drags in `panel` mode, and never over a region that can
				// still scroll along the axis. The intent is fixed to where the press started.
				const onHandle =
					startTarget instanceof Element && !!startTarget.closest('[data-drag-handle]');
				const eligible =
					onHandle || ((this.swipeFrom ?? 'panel') === 'panel' && !ownsGesture(startTarget));
				if (delta > 4 && eligible) return true;
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
				this.dragOffset = this.swipeSign * Math.max(0, (pos - startPos) * this.swipeSign); // clamp: can't drag past open
				tracker.add(pos, event.timeStamp);
			},
			onEnd: ({ event }) => endDrag(event, false),
			onCancel: ({ event }) => endDrag(event, true)
		});

		// Fresh mount = fresh open: clear any offset left over from a drag-dismiss.
		this.dragOffset = 0;
		this.dragging = false;
		return drag(node);
	};
}
