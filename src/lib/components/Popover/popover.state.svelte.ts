import { bind } from '$lib/utils/state.svelte.js';
import { Registry } from '$lib/utils/registry.svelte.js';
import { getContext, hasContext, onDestroy, onMount, setContext, untrack } from 'svelte';
import { on } from 'svelte/events';
import { useTheme } from '../Theme/theme.state.svelte.js';
import type { PopoverOpenReason, PopoverProps } from './popover.props.js';
import type { Placement, VirtualElement } from '@floating-ui/dom';
import { useScrollLock } from '$lib/utils/useScrollLock.svelte.js';
import { useFocusScope } from '$lib/utils/useFocusScope.svelte.js';
import { useTabBridge } from '$lib/utils/useTabBridge.svelte.js';
import { composedContains, getDeepActiveElement, isTextField } from '$lib/utils/focus.js';
import type { LayerHandle } from '$lib/utils/layers.svelte.js';
import type { Attachment } from 'svelte/attachments';
import { useSafeArea } from '$lib/utils/safeArea.svelte.js';
import { useHoverAction } from '$lib/utils/useHoverAction.svelte.js';
import { useOpenLifecycle, type OpenLifecycle } from '$lib/utils/openLifecycle.svelte.js';
import {
	getInteractionType,
	isOpenChangeDetails,
	requestOpenChange,
	resolveOpenChangeDetails,
	type OpenChangeDetails,
	type OpenChangeInit,
	type OpenChangeReason
} from '$lib/utils/openChange.js';
import {
	focusedElement,
	triggerActivation,
	triggerFocusTarget,
	writePopupAria,
	type PopupTriggerProps
} from '$lib/utils/trigger.js';
import { useDirection } from '$lib/utils/useDirection.svelte.js';
import { placementAttributes, popupSideAttributes } from '$lib/utils/stateAttributes.js';
import { usePopoverMotion, type PopoverThemeProps } from './popover.theme.js';
import {
	applyDirectedOffset,
	claimPopupSide,
	createPanelPositioner,
	directedMotion,
	releasePanelPosition,
	type PanelDirection,
	type PanelPlacement
} from './popover.position.js';

/** Where a floating panel was last placed; see `PopoverState.placement`. */
export type PopoverPlacementState = Pick<PanelPlacement, 'side' | 'align' | 'anchorHidden'>;

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
interface PopoverOptions<Payload = unknown> extends MakeRequired<
	Pick<
		PopoverProps<Payload>,
		| 'id'
		| 'size'
		| 'position'
		| 'transition'
		| 'onOpenChange'
		| 'onAfterOpen'
		| 'onAfterClose'
		| 'offset'
		| 'directedTransition'
		| 'closeOnEscape'
		| 'lockScroll'
		| 'closeOnMouseLeave'
		| 'debugSafeArea'
		| 'closeOnClickOutside'
		| 'openOnHover'
		| 'delay'
		| 'closeDelay'
		| 'openOnClick'
		| 'mobileSheet'
		| 'inline'
		| 'focusOnOpen'
		| 'focusOnClose'
		| 'haspopup'
		| 'positionPanel'
		| 'collisionBoundary'
		| 'fallbackAxisSide'
		| 'anchorTo'
		| 'modal'
		| 'label'
		| 'labelledBy'
		| 'tabBridge'
		| 'closeOnFocusOut'
		| 'arrow'
	>,
	| 'directedTransition'
	| 'closeOnEscape'
	| 'lockScroll'
	| 'closeOnMouseLeave'
	| 'debugSafeArea'
	| 'closeOnClickOutside'
	| 'openOnHover'
	| 'delay'
	| 'openOnClick'
	| 'inline'
	| 'modal'
	| 'tabBridge'
	| 'arrow'
> {
	isOpen: boolean;
	// An HTMLElement, or a floating-ui virtual element (e.g. a point at the cursor for context menus).
	externalRef?: HTMLElement | VirtualElement | null;
	fitTrigger: boolean;
	/** The instance `theme.motion` slot; the `transition` prop still wins over it. */
	motion?: PopoverThemeProps['motion'];
}

/** What `open`, `close`, `toggle` and `setOpen` accept: details, a partial, or the DOM event. */
export type PopoverOpenChangeInput = OpenChangeDetails | OpenChangeInit | Event;

// `bind(this, options)` installs the option properties on the instance; this type-only base
// class is what declares them to TypeScript. (Merging an empty `interface` into the class
// would be unsafe declaration merging: the interface promises members the class never defines.)
const PopoverOptionsBase = class {} as unknown as new <Payload>() => PopoverOptions<Payload>;

/** The role a non-dialog popup's content element carries, by `haspopup`. */
const POPUP_ROLE = {
	menu: 'menu',
	listbox: 'listbox',
	tree: 'tree',
	grid: 'grid'
} as const;

/** How the open state was reached, from the change that opened it. */
const openReasonOf = (details: OpenChangeDetails): PopoverOpenReason => {
	if (details.reason === 'trigger-hover') return 'hover';
	const fromTrigger: OpenChangeReason[] = ['trigger-press', 'trigger-focus', 'list-navigation'];
	if (fromTrigger.includes(details.reason)) {
		return details.interaction === 'keyboard' ? 'keyboard' : 'press';
	}
	return 'programmatic';
};

/** How close to the viewport's width a touch-opened panel must be to lock page scroll, in px. */
const TOUCH_LOCK_MARGIN = 20;

/** A press on a trigger, remembered while its event dispatches. */
type TriggerPress = { node: HTMLElement; event: Event; reason: OpenChangeReason };

export class PopoverState<Payload = unknown> extends PopoverOptionsBase<Payload> {
	/** The trigger that opened the popover, while it is open; `null` for a programmatic open. */
	activeTrigger = $state<HTMLElement | null>(null);
	/** The most recently attached `reference` / `trigger` element. */
	#latestTrigger = $state<HTMLElement | null>(null);
	/** The id of the role owner inside a non-dialog popup (the `role="menu"` element). */
	#popupOwnerId = $state<string | null>(null);
	/**
	 * The trigger the panel anchors to: the one that opened it, else the most recently attached
	 * `reference` / `trigger` element.
	 */
	triggerReference: HTMLElement | null = $derived(this.activeTrigger ?? this.#latestTrigger);
	referenceElement: HTMLElement | VirtualElement | null = $derived(
		this.triggerReference || this.externalRef || null
	);
	dialogElement: HTMLElement | null = $state(null);
	/** The arrow inside the panel (`arrow`); `null` while there is none. */
	arrowElement: HTMLElement | null = $state(null);
	/** The panel element focus moves into (inside `dialogElement`); `null` while it is not mounted. */
	panelElement: HTMLElement | null = $state(null);
	// Applied to the animated panel (not the portaled positioning wrapper) so the scale/fly
	// transition originates from the edge nearest the trigger.
	transformOrigin = $state('center center');
	// Trigger-matched width (fitTrigger), applied to the panel.
	triggerWidth = $state<number | null>(null);
	/**
	 * How the popover was opened: `hover`, `press` (pointer), `keyboard`, or `programmatic`
	 * (`open()` from code, the `open` prop, `defaultOpen`). `null` once closed.
	 */
	openReason = $state<PopoverOpenReason | null>(null);
	/** The details of the last change that was applied, kept until the next one. */
	lastOpenChange = $state.raw<OpenChangeDetails | null>(null);
	/** The open state `setOpen` last applied, to tell a change made from outside. */
	#appliedOpen: boolean | undefined;
	/** Whether a finger opened the popover (a programmatic open leaves the last change stale). */
	get #openedByTouch() {
		return this.openReason === 'press' && this.lastOpenChange?.interaction === 'touch';
	}
	/**
	 * Where the floating panel was last placed: the side it sits on (logical when a logical side
	 * was requested, `none` when `positionPanel` placed it), its alignment, and whether its anchor
	 * is scrolled out of view. `null` until the first placement lands and once the panel unmounts.
	 */
	placement = $state<PopoverPlacementState | null>(null);
	/** `data-side`, `data-align` and `data-anchor-hidden` for the panel. */
	panelAttributes = $derived(
		placementAttributes(
			this.placement
				? { side: this.placement.side, align: this.placement.align ?? undefined }
				: undefined,
			{ anchorHidden: this.placement?.anchorHidden }
		)
	);
	parent = getContext<PopoverState | null>('popover');
	// Nested popovers join while they mount and leave when torn down; see `Registry`.
	readonly #children = new Registry<PopoverState>();
	get children(): readonly PopoverState[] {
		return this.#children.items;
	}
	hasChildOpen = $derived(this.children.some((d) => d.isOpen));
	theme = useTheme();
	/**
	 * Open → entering → open → exiting → closed; completes even when no transition plays.
	 * Created in the constructor: it reads the options as it starts, after `bind` installs them.
	 */
	lifecycle: OpenLifecycle;
	/** @deprecated Read `lifecycle.status === 'open'`; kept for one minor. */
	get hasTransitioned() {
		return this.lifecycle.status === 'open';
	}
	// The mobile sheet delegates to a Dialog, which registers its own layer.
	// An inline panel sits in the flow and is not dismissed by an outside press; Escape still
	// reaches it while it is the top layer.
	layer = this.theme.layers.register({
		kind: 'popover',
		isOpen: () => this.isOpen && !this.isMobileSheet,
		isModal: () => this.isModal,
		dismissOnEscape: () => this.closeOnEscape,
		dismissOnOutside: () => !this.inline && this.closeOnClickOutside,
		onDismiss: (request) => this.setOpen(false, request),
		state: this
	});
	/**
	 * Whether no open layer sits above this popover, except a tooltip: a tooltip never takes focus
	 * or holds a control, so one showing over a button in the panel (or over the trigger) must not
	 * count as something that took over from it.
	 */
	isTopLayer = $derived.by(() => {
		const open = this.theme.layers.open;
		const index = open.indexOf(this.layer);
		if (index < 0) return false;
		return open.slice(index + 1).every((layer) => {
			const state = layer.state;
			return (
				state instanceof PopoverState && !!state.panelElement?.querySelector('[role="tooltip"]')
			);
		});
	});
	computedSize = $derived(this.theme.resolveResponsiveProps(this.size, 'normal'));
	// `inline` wins over `mobileSheet`: an in-flow panel never becomes a sheet.
	isMobileSheet = $derived(!this.inline && !!this.mobileSheet && this.theme.isMobile);
	computedMode: 'floating' | 'inline' | 'mobileSheet' = $derived(
		this.inline ? 'inline' : this.isMobileSheet ? 'mobileSheet' : 'floating'
	);
	/**
	 * Whether the panel is modal right now: a floating panel with `modal` contains Tab and makes the
	 * page behind it `inert`. An inline panel sits in the page and never is; the mobile sheet is a
	 * modal Dialog of its own.
	 */
	isModal = $derived(!!this.modal && this.computedMode === 'floating');
	/**
	 * Whether the panel holds dialog content. Menus, listboxes, trees and grids render a plain
	 * wrapper instead of an unnamed `<dialog>`, and their trigger controls the role owner inside.
	 */
	isDialogPopup = $derived((this.haspopup ?? 'dialog') === 'dialog');
	/** The id of the element `aria-controls` points at while open. */
	controlsId = $derived(this.isDialogPopup ? this.id : (this.#popupOwnerId ?? this.id));
	/**
	 * Trigger state in the library's semantic vocabulary: spread on the built-in Button, and
	 * written as the matching ARIA attributes by `reference` for a snippet trigger.
	 */
	triggerProps: PopupTriggerProps = $derived({
		haspopup: this.haspopup ?? 'dialog',
		expanded: this.isOpen,
		controls: this.isOpen && !this.isMobileSheet ? this.controlsId : undefined
	});
	// Non-modal: no Tab containment or `inert`; optional initial focus. Focus goes back when it was
	// inside the panel, or when a trigger opened the popover (Safari does not focus a button on
	// click, so a press and Escape leave focus on <body>). A popover with neither, such as a
	// combobox list, leaves focus alone, even when the control that kept it blurred on purpose.
	// A floating panel is hidden until its first placement lands, and nothing in it can take focus
	// before then, so initial focus waits for that placement.
	focusScope = useFocusScope({
		isActive: () =>
			this.isOpen &&
			!this.isMobileSheet &&
			this.isTopLayer &&
			(this.computedMode !== 'floating' || this.placement !== null),
		trap: () => this.isModal,
		inertSiblings: () => this.isModal,
		initialFocus: () => this.focusOnOpen ?? (this.isModal ? 'first' : false),
		restoreFocus: () => this.#focusEntered || this.activeTrigger !== null,
		returnTo: () => this.#returnTarget(),
		// Focus that moved on by itself (Tab past the end of the panel) is not taken back.
		focusOnClose: () => (this.lastOpenChange?.reason === 'focus-out' ? false : this.focusOnClose),
		closeDetails: () => this.lastOpenChange
	});
	/**
	 * Whether Tab is bridged between the trigger and the portaled panel: a floating dialog popup
	 * opened from a trigger, unless `tabBridge` is off. Menus, listboxes and the like manage focus
	 * themselves, a modal panel contains Tab on its own, and a panel the pointer merely hovered
	 * open is not a Tab destination.
	 */
	get tabBridgeActive(): boolean {
		return (
			this.isOpen &&
			this.tabBridge &&
			!this.isModal &&
			this.computedMode === 'floating' &&
			this.isDialogPopup &&
			this.openReason !== 'hover' &&
			this.isTopLayer &&
			this.placement !== null &&
			this.panelElement !== null &&
			this.#bridgeAnchor() !== null
		);
	}
	/**
	 * Whether focus moving away closes the popover: a floating dialog popup that is not modal (a
	 * modal one keeps focus), not opened by the pointer hovering, and `closeOnFocusOut` (by
	 * default, `closeOnClickOutside`). Menus and lists steer focus themselves.
	 */
	get closesOnFocusOut(): boolean {
		return (
			(this.closeOnFocusOut ?? this.closeOnClickOutside) &&
			!this.isModal &&
			this.computedMode === 'floating' &&
			this.isDialogPopup &&
			this.openReason !== 'hover'
		);
	}
	// Mode preset from `popoverTheme.motion`, through the override ladder
	// (registry → `setPopoverTheme` → instance `theme.motion` → `transition` prop).
	private resolveMotion = usePopoverMotion();
	computedTransition = $derived(
		this.resolveMotion(
			{ mode: this.computedMode },
			{ motion: this.motion, transition: this.transition }
		)
	);
	computedPosition = $derived(this.theme.resolveResponsiveProps(this.position, 'top'));

	// Hook instances
	// The safe area tracks every open popover (menus ask it whether the pointer is on its way to
	// an open submenu), but leaving it closes only a popover the pointer opened by hovering: one
	// opened by a press, the keyboard or code stays until it is dismissed.
	safeArea = useSafeArea({
		isActive: () =>
			this.isOpen && this.closeOnMouseLeave && this.children.filter((d) => d.isOpen).length === 0,
		callback: (event) => {
			if (this.openReason !== 'hover') return;
			this.setOpen(false, { reason: 'trigger-hover', event, interaction: 'mouse' });
		},
		offset: 15,
		debug: () => this.debugSafeArea,
		closeDelay: () => this.closeDelay
	});

	hoverAction = useHoverAction({
		isActive: () => this.openOnHover && !this.modal && !this.isOpen,
		onMouseEnter: (event) => {
			this.setOpen(true, {
				reason: 'trigger-hover',
				event,
				trigger: this.#hoveredTrigger ?? undefined,
				interaction: 'mouse'
			});
		},
		// A function, read on each enter: field initialisers run before `bind(this, options)`
		// installs the options, so a plain `this.delay` here would be `undefined` (no delay).
		delay: () => this.delay,
		// Root hover popovers share the warm-up with tooltips and hover cards. Submenus keep their
		// delay: it is what lets the pointer cross sibling rows on the way to an open submenu.
		group: () => (this.openOnHover && !this.parent ? this.theme.hoverIntent : null),
		isOpen: () => this.isOpen,
		contains: (node) => !!this.dialogElement?.contains(node)
	});

	addChild = (child: PopoverState) => () => this.#children.add(child);

	/** The element the panel is anchored to, for its writing direction. */
	#anchorElement = (): HTMLElement | null => {
		const reference = this.referenceElement;
		if (reference instanceof HTMLElement) return reference;
		const context = reference?.contextElement;
		return context instanceof HTMLElement ? context : null;
	};
	/** The reading direction logical sides and start/end alignment resolve with. */
	#direction = useDirection(this.#anchorElement);

	constructor(options: PopoverOptions<Payload>) {
		super();
		bind(this, options);
		this.lifecycle = useOpenLifecycle({
			isOpen: () => this.isOpen,
			external: () => this.isMobileSheet,
			onAfterOpen: () => this.onAfterOpen?.(this),
			onAfterClose: () => {
				this.focusScope.restore();
				this.onAfterClose?.(this);
				this.openReason = null;
				this.#setActiveTrigger(null);
				this.#opener = null;
			}
		});
		setContext('popover', this);
		// The parent registers its children whatever their payload type.
		if (this.parent) onMount(this.parent.addChild(this as unknown as PopoverState));
		// Details describe the change `setOpen` made: an open state moved from outside (the bound
		// `open` prop) leaves none, so a later close does not read the one that opened it.
		$effect.pre(() => {
			const open = this.isOpen;
			untrack(() => {
				if (this.#appliedOpen !== open) this.lastOpenChange = null;
				this.#appliedOpen = open;
			});
		});
		useTabBridge({
			isActive: () => this.tabBridgeActive,
			anchor: this.#bridgeAnchor,
			panel: () => this.panelElement,
			// A trigger inside another popover's panel tabs on within that panel.
			boundary: () => {
				const anchor = this.#bridgeAnchor();
				const parentPanel = this.parent?.panelElement;
				return anchor && parentPanel && parentPanel.contains(anchor) ? parentPanel : undefined;
			},
			onLeave: (event) =>
				void this.setOpen(false, { reason: 'focus-out', event, interaction: 'keyboard' })
		});
		// Focus that was inside the popover (or on its trigger) moving on closes it. A popover whose
		// panel focus never entered is left to outside presses: Tab, a click or a screen reader's
		// virtual cursor elsewhere on the page only counts once focus has been in the tree. Judged
		// in a microtask, where focus has settled and reactive state is safe to read: `focus()`
		// calls made by a closing popup's teardown dispatch this event in the middle of a flush.
		$effect(() => {
			if (!this.isOpen || !this.closesOnFocusOut) return;
			const doc = this.dialogElement?.ownerDocument;
			if (!doc) return;
			let within = untrack(() => this.#focusInTree(getDeepActiveElement(doc)));
			let scheduled = false;
			return on(doc, 'focusin', (event) => {
				if (scheduled) return;
				scheduled = true;
				queueMicrotask(() => {
					scheduled = false;
					if (!this.isOpen || this.#appliedOpen === false || !this.closesOnFocusOut) return;
					const active = getDeepActiveElement(doc);
					if (!active || active === doc.body) return;
					if (this.#focusInTree(active)) {
						within = true;
						return;
					}
					if (!within) return;
					within = false;
					this.setOpen(false, { reason: 'focus-out', event, interaction: 'keyboard' });
				});
			});
		});
		onDestroy(() => {
			this.#destroyed = true;
		});

		// A touch-opened popover is non-modal and a finger scrolls the page under it, so it locks
		// scroll only when its panel spans the viewport, where there is nothing left to scroll to.
		let panelSpansViewport = $state(false);
		$effect(() => {
			const panel = this.dialogElement;
			if (!panel || !this.#openedByTouch) {
				panelSpansViewport = false;
				return;
			}
			const measure = () => {
				const view = panel.ownerDocument.defaultView;
				panelSpansViewport =
					!!view && panel.getBoundingClientRect().width >= view.innerWidth - TOUCH_LOCK_MARGIN;
			};
			measure();
			const observer = new ResizeObserver(measure);
			observer.observe(panel);
			return () => observer.disconnect();
		});

		// A hover-opened popover is a preview the pointer can leave: the page keeps scrolling.
		useScrollLock({
			isActive: () =>
				this.lockScroll &&
				!this.inline &&
				!this.isMobileSheet &&
				!this.parent &&
				this.isOpen &&
				this.openReason !== 'hover' &&
				(!this.#openedByTouch || panelSpansViewport)
		});

		// An open state that did not come through `setOpen` (the `open` prop, `defaultOpen`) is a
		// programmatic open: focus returns to whatever had it when it opened.
		$effect.pre(() => {
			const open = this.isOpen;
			untrack(() => {
				const committed = this.#committed;
				this.#committed = null;
				if (committed === open || !open) return;
				this.openReason = 'programmatic';
				this.#opener = focusedElement();
			});
		});

		// The point the pointer was at belongs to one opening: a later keyboard open must not reuse it.
		$effect(() => {
			if (!this.isOpen) return;
			return () => {
				this.#anchorOffset = null;
			};
		});

		// The trigger (or `ref` element) reports the side its placed panel sits on, so a theme can
		// flatten the corner the panel attaches to.
		$effect(() => {
			const anchor = this.referenceElement;
			if (!(anchor instanceof HTMLElement)) return;
			const { 'data-popup-side': side } = popupSideAttributes(this.placement?.side);
			claimPopupSide(anchor, this, side ?? null);
			return () => claimPopupSide(anchor, this, null);
		});
	}

	/** Toggles the popover. A press on the trigger of a popover the pointer opened by hovering pins it open instead. */
	toggle = (input?: PopoverOpenChangeInput) => {
		const details = this.#details(input);
		if (this.isOpen && details.reason === 'trigger-press') {
			const anchor = this.triggerReference;
			if (this.openReason === 'hover') {
				// Hovered open, then pressed: the press keeps it open and makes it stay.
				this.#openRequests += 1;
				this.openReason = openReasonOf(details);
				return;
			}
			if (
				details.trigger &&
				anchor &&
				details.trigger !== anchor &&
				this.#triggers.has(details.trigger)
			) {
				// Another trigger of the same popover: the panel moves to it and stays open.
				this.#openRequests += 1;
				this.#setActiveTrigger(details.trigger);
				this.#opener = triggerFocusTarget(details.trigger, details.event);
				return;
			}
		}
		this.setOpen(!this.isOpen, details);
	};
	open = (input?: PopoverOpenChangeInput) => {
		this.setOpen(true, input);
	};

	/** Closes the popover. Returns `false` when `onOpenChange` cancelled the change. */
	close = (input?: PopoverOpenChangeInput): boolean => this.setOpen(false, input);

	/** Calls to `setOpen`, direct or through `open`, `close` and `toggle`, unchanged state included. */
	#openRequests = 0;
	#destroyed = false;
	/** The open state `setOpen` last wrote, until the effect that sees it has run. */
	#committed: boolean | null = null;
	/** Where focus returns when the popover closes; see `#returnTarget`. */
	#opener: HTMLElement | null = null;
	/** Whether focus has been inside the mounted panel. */
	#focusEntered = false;

	// Triggers: every element attached through `reference` (or `trigger`), with the order they
	// attached in. Plain fields, not `$state`: detach teardowns compare against them, and a
	// `$state` read in teardown can return the value from before the change that triggered it.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- teardown bookkeeping, never rendered
	readonly #triggers = new Map<HTMLElement, number>();
	#triggerSequence = 0;
	/** Triggers attached during the current flush: a re-rendered trigger's replacement. */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- teardown bookkeeping, never rendered
	readonly #recentTriggers = new Set<HTMLElement>();
	#latestTriggerNode: HTMLElement | null = null;
	#activeTriggerNode: HTMLElement | null = null;
	#hoveredTrigger: HTMLElement | null = null;
	/** The press dispatching right now on a trigger, so `toggle()` from its handler knows it. */
	#press: TriggerPress | null = null;
	/** The pointer type of the last press on a trigger, for clicks that do not carry one. */
	#pointerType: string | null = null;

	#setActiveTrigger(node: HTMLElement | null) {
		this.#activeTriggerNode = node;
		this.activeTrigger = node;
	}

	#setLatestTrigger(node: HTMLElement | null) {
		this.#latestTriggerNode = node;
		this.#latestTrigger = node;
	}

	/** Whether the panel still has an anchor in the document: a trigger, else the `ref` prop. */
	#hasAnchor = () => {
		const anchor = this.#activeTriggerNode ?? this.#latestTriggerNode ?? this.externalRef;
		if (!anchor) return false;
		// A floating-ui virtual element (a cursor point) has no DOM presence to lose.
		return !(anchor instanceof Element) || anchor.isConnected;
	};

	/**
	 * Closes an open popover whose anchor left the document, so `onOpenChange` reports it with
	 * `reason: 'trigger-unmount'`. Skipped while the component itself is being destroyed.
	 */
	#closeIfAnchorLost = () => {
		if (this.#destroyed || !this.isOpen || this.#hasAnchor()) return;
		this.setOpen(false, { reason: 'trigger-unmount' });
	};

	/**
	 * Focus goes back to the trigger that opened the popover (or the control pressed inside it),
	 * and after a programmatic open to the element that had focus when it opened. `null` lets the
	 * focus scope use the element focused when the panel mounted.
	 */
	#returnTarget = (): HTMLElement | null => {
		if (this.#opener?.isConnected) return this.#opener;
		if (this.openReason === 'programmatic' || this.openReason === null) return null;
		const trigger = this.activeTrigger ?? this.triggerReference;
		return trigger ? triggerFocusTarget(trigger) : null;
	};

	/**
	 * The control Tab starts from and returns to: the one that opened the popover, else the focusable
	 * part of the trigger. `null` without a registered trigger (a popover anchored to a `ref`), and
	 * for a text field (a date or color input): Tab there moves on to the next field of a form.
	 */
	#bridgeAnchor = (): HTMLElement | null => {
		const trigger = this.triggerReference;
		if (!trigger || !this.#triggers.has(trigger)) return null;
		const anchor =
			this.openReason !== 'programmatic' && this.#opener?.isConnected
				? this.#opener
				: triggerFocusTarget(trigger);
		return anchor && !isTextField(anchor) ? anchor : null;
	};

	/**
	 * Whether `target` belongs to this popover: its panel, a trigger, the `ref` element, or a popup
	 * opened from any of them (a nested popover, a dialog the panel opened).
	 */
	#focusInTree = (target: Node | null): boolean => {
		if (!target) return false;
		const external = this.externalRef;
		if (external instanceof Node && composedContains(external, target)) return true;
		return this.theme.layers.open.some((layer) => {
			for (let current: LayerHandle | null = layer; current; current = current.parent) {
				if (current !== this.layer) continue;
				return [...layer.nodes].some((node) => composedContains(node, target));
			}
			return false;
		});
	};

	/** The details for a request, filled in from the trigger press it happens during. */
	#details = (input?: PopoverOpenChangeInput): OpenChangeDetails => {
		if (isOpenChangeDetails(input)) return input;
		const event = input instanceof Event ? input : input?.event;
		const press = this.#press && (!event || event === this.#press.event) ? this.#press : null;
		const fallback: OpenChangeInit = press
			? {
					reason: press.reason,
					event: press.event,
					trigger: press.node,
					interaction: getInteractionType(press.event, this.#pointerType)
				}
			: { interaction: getInteractionType(event, this.#pointerType) };
		return resolveOpenChangeDetails(input, fallback);
	};

	/**
	 * Requests an open-state change. `onOpenChange(nextOpen, details)` runs first; when it calls
	 * `details.cancel()` nothing changes. Returns `false` when the change was cancelled.
	 */
	setOpen = (nextOpen: boolean, input?: PopoverOpenChangeInput): boolean => {
		this.#openRequests += 1;
		if (this.isOpen === nextOpen) {
			// A press on the trigger of a popover the pointer opened by hovering pins it open, the
			// same as `toggle()` does: a menu's submenu trigger opens its submenu with `open()`.
			if (nextOpen && this.openReason === 'hover') {
				const pressed = this.#details(input);
				if (pressed.reason === 'trigger-press') this.openReason = openReasonOf(pressed);
			}
			return true;
		}
		const details = this.#details(input);
		if (!requestOpenChange(this.onOpenChange, nextOpen, details)) return false;
		// A hover open still waiting on its delay belongs to the state before this change: left
		// pending, it would reopen a popover the user just closed by click or Escape.
		this.hoverAction.cancel();
		if (nextOpen) {
			const trigger =
				details.trigger && this.#triggers.has(details.trigger) ? details.trigger : null;
			this.#setActiveTrigger(trigger);
			this.openReason = openReasonOf(details);
			this.#opener =
				this.openReason === 'programmatic'
					? focusedElement()
					: trigger
						? triggerFocusTarget(trigger, details.event)
						: null;
		}
		this.lastOpenChange = details;
		this.#appliedOpen = nextOpen;
		this.#committed = nextOpen;
		this.isOpen = nextOpen;
		return true;
	};

	/**
	 * Points the panel's motion at the side facing the reference, for the resolved placement: the
	 * scale origin and the exit follow every placement (a flip included), the entrance only the
	 * placement made before it plays.
	 */
	applyDirectedTransition = (
		placement: Placement,
		{ direction = 'ltr', intro = true }: { direction?: PanelDirection; intro?: boolean } = {}
	) => {
		const motion = directedMotion(placement, direction);
		this.transformOrigin = motion.transformOrigin;
		if (intro) applyDirectedOffset(this.computedTransition.in, motion);
		applyDirectedOffset(this.computedTransition.out, motion);
	};

	/** Records a placement, reassigning only what changed so styling hooks don't churn on scroll. */
	#setPlacement = ({ side, align, anchorHidden }: PopoverPlacementState) => {
		const current = this.placement;
		if (current?.side === side && current.align === align && current.anchorHidden === anchorHidden)
			return;
		this.placement = { side, align, anchorHidden };
	};

	/**
	 * Where the pointer last was over the trigger while the popover was closed, in viewport
	 * coordinates. Frozen while open: `anchorTo: 'line'` anchors to the line under it.
	 */
	#anchorOffset: { reference: HTMLElement | VirtualElement; dx: number; dy: number } | null = null;

	/**
	 * The captured point resolved against where its reference is now: held as an offset from the
	 * reference's box, it stays on the same line when the page or a scroll ancestor scrolls.
	 */
	#anchorPoint = () => {
		const offset = this.#anchorOffset;
		if (!offset) return null;
		const rect = offset.reference.getBoundingClientRect();
		return { x: rect.left + offset.dx, y: rect.top + offset.dy };
	};

	// floating-ui placement lives in `popover.position.ts`. Its inputs are read when a placement
	// runs: the mount placement runs inside the `dialog` attachment, so a change to any of them
	// re-places an open panel.
	#positioner = createPanelPositioner({
		reference: () => this.referenceElement,
		// Inline panels and mobile sheets are laid out by the document, never by floating-ui.
		floating: () => !this.inline && !this.isMobileSheet,
		// Untracked: floating-ui runs its first observed update synchronously inside the panel
		// attachment, which would otherwise re-run (and re-mount the placement) when the opening
		// transition ends. The catch-up placement in `dialog` covers that moment instead.
		settled: () => untrack(() => this.lifecycle.status === 'open'),
		placement: () => this.computedPosition,
		offset: () => this.offset,
		fitTrigger: () => this.fitTrigger,
		positionPanel: () => this.positionPanel,
		direction: this.#direction,
		collisionBoundary: () => this.collisionBoundary,
		fallbackAxisSide: () => this.fallbackAxisSide,
		anchorTo: () => this.anchorTo,
		anchorPoint: this.#anchorPoint,
		arrow: () => (this.arrow && this.computedMode === 'floating' ? this.arrowElement : null),
		setMinWidth: (width) => {
			this.triggerWidth = width;
		},
		// `positionPanel` places synchronously, inside the panel attachment: nothing read here may
		// become one of its dependencies.
		onPlace: ({ placement, side, align, anchorHidden, direction, mount }) =>
			untrack(() => {
				this.#setPlacement({ side, align, anchorHidden });
				this.safeArea.updateAreas();
				if (placement && this.directedTransition) {
					this.applyDirectedTransition(placement, {
						direction,
						intro: mount && this.lifecycle.status !== 'open'
					});
				}
			})
	});

	/** Places the floating panel against its reference once; see `PanelPositioner.place`. */
	place = (node: HTMLElement, mount = false) => this.#positioner.place(node, mount);

	/** Attachment for the positioning wrapper (`<dialog>`, or a `<div>` for a non-dialog popup). */
	dialog = (node: HTMLElement) => {
		this.dialogElement = node;
		if (this.inline) {
			// No portal, no fixed placement: the wrapper stays where the component is rendered.
			this.triggerWidth = null;
			releasePanelPosition(node, true);
			return () => {
				this.dialogElement = null;
			};
		}
		if (this.isMobileSheet) {
			this.triggerWidth = null;
			releasePanelPosition(node, false);
			return () => {
				this.dialogElement = null;
			};
		}

		const reference = this.referenceElement;
		// The anchor can go while the panel's outro still runs (its trigger unmounted): the panel
		// keeps its last place, since floating-ui cannot observe a missing reference.
		if (!reference) {
			return () => {
				this.dialogElement = null;
				queueMicrotask(this.#closeIfAnchorLost);
			};
		}
		// A reference that leaves the document closes the popover instead of being placed.
		const cleanup = this.#positioner.track(node, reference, this.#closeIfAnchorLost);
		// Changes observed during the opening transition are not placed; catch up once it ends,
		// so content that resized while opening doesn't leave the panel misplaced.
		$effect(() => {
			if (this.lifecycle.status === 'open') untrack(() => void this.place(node));
		});
		return () => {
			cleanup();
			this.dialogElement = null;
			// Forget the placement once the panel is gone, not when it is only placed again (a new
			// `position`), so the styling hooks and the focus gate don't flicker in between.
			queueMicrotask(() => {
				if (!this.dialogElement) this.placement = null;
			});
			// The panel also leaves when its `ref` anchor does (`bind:this` resets it to null),
			// and without an outro that happens before the positioner's observers can report the
			// detached node: judge the anchor once the flush settles, so the popover closes
			// instead of staying open and reappearing when the anchor returns. A no-op when the
			// popover closed or was destroyed, or when another anchor took over.
			queueMicrotask(this.#closeIfAnchorLost);
		};
	};
	panel = (node: HTMLElement) => {
		return untrack(() => {
			const cleanups: Array<(() => void) | null | void> = [];
			this.panelElement = node;
			cleanups.push(() => {
				if (this.panelElement === node) this.panelElement = null;
			});
			this.#focusEntered = node.contains(node.ownerDocument.activeElement);
			cleanups.push(
				on(node, 'focusin', () => {
					this.#focusEntered = true;
				})
			);
			cleanups.push(this.layer.node(node));
			cleanups.push(this.focusScope.attachment(node));
			cleanups.push(this.safeArea.floatingReference?.(node));
			if (!this.isDialogPopup) cleanups.push(this.#labelPopupOwner(node));
			return () => {
				cleanups.forEach((cleanup) => cleanup?.());
			};
		});
	};

	/**
	 * A menu, listbox, tree or grid popup: its trigger's `aria-controls` points at the element
	 * carrying that role (not the wrapper), and that element is labelled by the trigger unless it
	 * has a name of its own. Ids it has to create are removed again when the panel goes.
	 */
	#labelPopupOwner = (panel: HTMLElement) => {
		const haspopup = this.haspopup ?? 'dialog';
		const role = haspopup === true ? 'menu' : POPUP_ROLE[haspopup as keyof typeof POPUP_ROLE];
		const added: Array<[Element, string]> = [];
		const set = (element: Element, name: string, value: string) => {
			if (element.hasAttribute(name)) return;
			element.setAttribute(name, value);
			added.push([element, name]);
		};
		let owner: Element | null = null;
		const resolve = () => {
			const next = panel.querySelector(`[role="${role}"]`);
			if (next === owner) return;
			owner = next;
			if (!owner) {
				this.#popupOwnerId = null;
				return;
			}
			set(owner, 'id', `${this.id}-${role}`);
			this.#popupOwnerId = owner.id;
			// Named by the consumer: `label` / `labelledBy` win over the trigger.
			if (this.labelledBy) set(owner, 'aria-labelledby', this.labelledBy);
			if (this.label) set(owner, 'aria-label', this.label);
			const trigger = this.triggerReference;
			if (trigger && !owner.hasAttribute('aria-label') && !owner.hasAttribute('aria-labelledby')) {
				set(trigger, 'id', `${this.id}-trigger`);
				set(owner, 'aria-labelledby', trigger.id);
			}
		};
		queueMicrotask(resolve);
		const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(resolve);
		observer?.observe(panel, { childList: true, subtree: true });
		return () => {
			observer?.disconnect();
			for (const [element, name] of added.splice(0)) element.removeAttribute(name);
			this.#popupOwnerId = null;
		};
	};

	/** Remembers a press on a trigger until its event has dispatched. */
	#notePress = (node: HTMLElement, event: Event, reason: OpenChangeReason) => {
		const press = { node, event, reason };
		this.#press = press;
		setTimeout(() => {
			if (this.#press === press) this.#press = null;
		});
	};

	reference = (node: HTMLElement) => {
		// Keep the trigger's ARIA in sync whichever way it was rendered (snippet or Button). With
		// several triggers, only the one the panel is anchored to reads as expanded.
		$effect(() => {
			const anchored = this.triggerReference === node || this.triggerReference === null;
			writePopupAria(node, {
				...this.triggerProps,
				expanded: this.triggerProps.expanded && anchored,
				controls: anchored ? this.triggerProps.controls : undefined
			});
		});
		return untrack(() => {
			this.#triggers.set(node, ++this.#triggerSequence);
			this.#recentTriggers.add(node);
			queueMicrotask(() => this.#recentTriggers.delete(node));
			this.#setLatestTrigger(node);

			// Gather all cleanup callbacks
			const cleanups: Array<(() => void) | null | void> = [];
			cleanups.push(this.layer.node(node));
			cleanups.push(this.safeArea.anchorReference?.(node));
			// Before the hover action's own listener, which may open at once (no delay).
			cleanups.push(
				on(node, 'mouseenter', () => {
					this.#hoveredTrigger = node;
				})
			);
			cleanups.push(this.hoverAction.reference?.(node));
			// Capture phase: these run before the element's own (delegated) handlers, so a
			// `popover.toggle()` called from `onclick` knows the press it belongs to.
			cleanups.push(
				on(
					node,
					'pointerdown',
					(event) => {
						this.#pointerType = event.pointerType;
					},
					{ capture: true }
				)
			);
			const notePress = (event: Event) => this.#notePress(node, event, 'trigger-press');
			const noteKey = (event: KeyboardEvent) => {
				if (event.key === 'Enter' || event.key === ' ')
					this.#notePress(node, event, 'trigger-press');
				else if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
					this.#notePress(node, event, 'list-navigation');
			};
			node.addEventListener('click', notePress, true);
			node.addEventListener('keydown', noteKey, true);
			cleanups.push(() => {
				node.removeEventListener('click', notePress, true);
				node.removeEventListener('keydown', noteKey, true);
			});
			cleanups.push(this.#trackAnchorPoint(node));

			// Return combined cleanup function
			return () => {
				cleanups.forEach((cleanup) => cleanup?.());
				this.#triggers.delete(node);
				this.#recentTriggers.delete(node);
				if (this.#hoveredTrigger === node) this.#hoveredTrigger = null;
				const wasActive = this.#activeTriggerNode === node;
				const wasAnchor =
					wasActive || (!this.#activeTriggerNode && this.#latestTriggerNode === node);
				if (wasActive) this.#setActiveTrigger(null);
				if (this.#latestTriggerNode === node) this.#setLatestTrigger(this.#newestTrigger());
				if (!wasAnchor) return;
				// A trigger re-rendered as a new element (a re-rendered snippet, a responsive
				// branch) attaches in the same flush: the panel moves to it. Only a trigger that
				// is gone for good closes the popover instead of leaving it on a detached node.
				const sequence = this.#triggerSequence;
				const replacements = [...this.#recentTriggers];
				queueMicrotask(() => {
					if (this.#destroyed || !this.isOpen) return;
					const successor = [...replacements, ...this.#triggersAfter(sequence)].find(
						(candidate) => this.#triggers.has(candidate) && candidate.isConnected
					);
					if (successor) {
						if (wasActive) this.#setActiveTrigger(successor);
						return;
					}
					// The trigger that opened it is gone: another trigger does not inherit it.
					if (wasActive && !this.externalRef) {
						this.setOpen(false, { reason: 'trigger-unmount' });
						return;
					}
					this.#closeIfAnchorLost();
				});
			};
		});
	};

	#newestTrigger(): HTMLElement | null {
		let newest: HTMLElement | null = null;
		let newestSequence = -1;
		for (const [node, sequence] of this.#triggers) {
			if (sequence > newestSequence) [newest, newestSequence] = [node, sequence];
		}
		return newest;
	}

	#triggersAfter(sequence: number): HTMLElement[] {
		return [...this.#triggers].filter(([, at]) => at > sequence).map(([node]) => node);
	}

	/**
	 * Follows the pointer over the trigger while the popover is closed, so an open anchored to a
	 * line (`anchorTo: 'line'`) uses the line the pointer was on; the point stays put while open.
	 */
	#trackAnchorPoint = (node: HTMLElement) => {
		const follow = (event: PointerEvent) => {
			const reference = this.referenceElement;
			if (this.isOpen || !reference) return;
			const rect = reference.getBoundingClientRect();
			this.#anchorOffset = {
				reference,
				dx: event.clientX - rect.left,
				dy: event.clientY - rect.top
			};
		};
		// A finger lifts (pointerleave) before the click that opens the popover: keep its point.
		const forget = (event: PointerEvent) => {
			if (!this.isOpen && event.pointerType !== 'touch') this.#anchorOffset = null;
		};
		// A keyboard open has no pointer: it takes the first or last line, not a stale hover point.
		const forgetOnKey = () => {
			if (!this.isOpen) this.#anchorOffset = null;
		};
		node.addEventListener('pointerenter', follow);
		node.addEventListener('pointermove', follow);
		node.addEventListener('pointerdown', follow);
		node.addEventListener('pointerleave', forget);
		node.addEventListener('keydown', forgetOnKey);
		return () => {
			node.removeEventListener('pointerenter', follow);
			node.removeEventListener('pointermove', follow);
			node.removeEventListener('pointerdown', follow);
			node.removeEventListener('pointerleave', forget);
			node.removeEventListener('keydown', forgetOnKey);
		};
	};
	/** Attachment for the arrow element inside the panel; see the `arrow` prop. */
	arrowRef = (node: HTMLElement) => {
		this.arrowElement = node;
		return () => {
			if (this.arrowElement === node) this.arrowElement = null;
		};
	};

	/** Payload getters of the triggers made with `triggerFor`. */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- teardown bookkeeping; `#payloadVersion` carries the reactivity
	readonly #payloads = new Map<HTMLElement, () => Payload>();
	#payloadVersion = $state(0);
	/**
	 * The payload of the trigger the panel is anchored to: the one that opened it, else the most
	 * recently attached. `undefined` for a trigger made without one. Several triggers share this one
	 * popup, so a list of rows needs a single popover, not one per row.
	 */
	payload: Payload | undefined = $derived.by(() => {
		void this.#payloadVersion;
		const trigger = this.triggerReference;
		return trigger ? this.#payloads.get(trigger)?.() : undefined;
	});

	/**
	 * A complete trigger (see `trigger`) that carries data for the panel: read it back as
	 * `popover.payload` while this trigger is the one the panel is anchored to. Pass a getter, so
	 * the payload follows its source without re-attaching the trigger:
	 * `{@attach popover.triggerFor(() => row)}`.
	 */
	triggerFor(payload: () => Payload): Attachment<HTMLElement> {
		return (node) => {
			const attached = this.trigger(node);
			untrack(() => {
				this.#payloads.set(node, payload);
				this.#payloadVersion += 1;
			});
			return () => {
				attached?.();
				untrack(() => {
					if (this.#payloads.get(node) !== payload) return;
					this.#payloads.delete(node);
					this.#payloadVersion += 1;
				});
			};
		};
	}

	/**
	 * Makes any element a complete trigger: it anchors the panel (as `reference` does), toggles
	 * it on click when `openOnClick` allows, and keeps `aria-expanded` and friends in sync.
	 * An element that is not already a control also gets `role="button"`, `tabindex="0"` and
	 * Enter/Space activation, so a card or an avatar opens the panel from the keyboard too.
	 * The element's own handler runs first: calling `event.preventDefault()` there, or opening,
	 * closing or toggling the popover itself, stops the default toggle.
	 */
	trigger = (node: HTMLElement) => {
		const offActivation = triggerActivation(node, {
			enabled: () => this.openOnClick,
			requests: () => this.#openRequests,
			activate: (event) => this.toggle({ reason: 'trigger-press', event, trigger: node })
		});
		const offReference = this.reference(node);
		return () => {
			offActivation();
			offReference?.();
		};
	};
}

// Use interface merging to add the properties

export const usePopoverContext = () => {
	const hasPopover = hasContext('popover');
	if (!hasPopover) {
		return null;
	}
	return getContext<PopoverState>('popover');
};
