import { bind } from '$lib/utils/state.svelte.js';
import { Registry } from '$lib/utils/registry.svelte.js';
import { getContext, hasContext, onDestroy, onMount, setContext, untrack } from 'svelte';
import { useTheme } from '../Theme/theme.state.svelte.js';
import type { PopoverProps } from './popover.props.js';
import type { Placement, VirtualElement } from '@floating-ui/dom';
import { useScrollLock } from '$lib/utils/useScrollLock.svelte.js';
import { useFocusScope } from '$lib/utils/useFocusScope.svelte.js';
import { useSafeArea } from '$lib/utils/safeArea.svelte.js';
import { useHoverAction } from '$lib/utils/useHoverAction.svelte.js';
import { usePopoverMotion, type PopoverThemeProps } from './popover.theme.js';
import { createPanelPositioner, directedMotion, releasePanelPosition } from './popover.position.js';

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
interface PopoverOptions extends MakeRequired<
	Pick<
		PopoverProps,
		| 'id'
		| 'size'
		| 'position'
		| 'transition'
		| 'onOpenChange'
		| 'offset'
		| 'directedTransition'
		| 'closeOnEscape'
		| 'lockScroll'
		| 'closeOnMouseLeave'
		| 'debugSafeArea'
		| 'closeOnClickOutside'
		| 'openOnHover'
		| 'delay'
		| 'openOnClick'
		| 'mobileSheet'
		| 'inline'
		| 'focusOnOpen'
		| 'haspopup'
		| 'positionPanel'
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
> {
	isOpen: boolean;
	// An HTMLElement, or a floating-ui virtual element (e.g. a point at the cursor for context menus).
	externalRef?: HTMLElement | VirtualElement | null;
	fitTrigger: boolean;
	/** The instance `theme.motion` slot; the `transition` prop still wins over it. */
	motion?: PopoverThemeProps['motion'];
}

// `bind(this, options)` installs the option properties on the instance; this type-only base
// class is what declares them to TypeScript. (Merging an empty `interface` into the class
// would be unsafe declaration merging: the interface promises members the class never defines.)
const PopoverOptionsBase = class {} as unknown as new () => PopoverOptions;
// The one place the trigger's semantic state becomes ARIA, for triggers the library cannot
// pass props to (a snippet trigger carrying `{@attach popover.reference}`).
/** Elements that may carry popup ARIA state. */
const POPUP_CONTROL =
	'button, a[href], input, select, textarea, summary, [role="button"], [role="link"], [role="combobox"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="tab"], [role="option"], [role="treeitem"], [role="gridcell"], [role="switch"], [role="checkbox"]';
/** Elements the browser already focuses and activates from the keyboard. */
const NATIVE_CONTROL = 'button, a[href], input, select, textarea, summary';
const TRIGGER_ARIA = {
	haspopup: 'aria-haspopup',
	expanded: 'aria-expanded',
	controls: 'aria-controls'
} as const;

export class PopoverState extends PopoverOptionsBase {
	triggerReference: HTMLElement | null = $state(null);
	referenceElement: HTMLElement | VirtualElement | null = $derived(
		this.triggerReference || this.externalRef || null
	);
	dialogElement: HTMLElement | null = $state(null);
	// Applied to the animated panel (not the portaled positioning wrapper) so the scale/fly
	// transition originates from the edge nearest the trigger.
	transformOrigin = $state('center center');
	// Trigger-matched width (fitTrigger), applied to the panel.
	triggerWidth = $state<number | null>(null);
	parent = getContext<PopoverState | null>('popover');
	// Nested popovers join while they mount and leave when torn down; see `Registry`.
	readonly #children = new Registry<PopoverState>();
	get children(): readonly PopoverState[] {
		return this.#children.items;
	}
	hasChildOpen = $derived(this.children.some((d) => d.isOpen));
	hasTransitioned = $state(false);
	theme = useTheme();
	// The mobile sheet delegates to a Dialog, which registers its own layer.
	// An inline panel sits in the flow and is not dismissed by an outside press; Escape still
	// reaches it while it is the top layer.
	layer = this.theme.layers.register({
		kind: 'popover',
		isOpen: () => this.isOpen && !this.isMobileSheet,
		isModal: () => false,
		dismissOnEscape: () => this.closeOnEscape,
		dismissOnOutside: () => !this.inline && this.closeOnClickOutside && this.hasTransitioned,
		onDismiss: () => this.close(),
		state: this
	});
	computedSize = $derived(this.theme.resolveResponsiveProps(this.size, 'normal'));
	// `inline` wins over `mobileSheet`: an in-flow panel never becomes a sheet.
	isMobileSheet = $derived(!this.inline && !!this.mobileSheet && this.theme.isMobile);
	computedMode: 'floating' | 'inline' | 'mobileSheet' = $derived(
		this.inline ? 'inline' : this.isMobileSheet ? 'mobileSheet' : 'floating'
	);
	/**
	 * Trigger state in the library's semantic vocabulary: spread on the built-in Button, and
	 * written as the matching ARIA attributes by `reference` for a snippet trigger.
	 */
	triggerProps = $derived({
		haspopup: this.haspopup ?? 'dialog',
		expanded: this.isOpen,
		controls: this.isOpen && !this.isMobileSheet ? this.id : undefined
	});
	// Non-modal: no Tab containment or `inert`; optional initial focus, always restores.
	focusScope = useFocusScope({
		isActive: () => this.isOpen && !this.isMobileSheet && this.layer.isTop,
		trap: () => false,
		initialFocus: () => this.focusOnOpen ?? false,
		returnTo: () => this.triggerReference
	});
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
	safeArea = useSafeArea({
		isActive: () =>
			this.isOpen && this.closeOnMouseLeave && this.children.filter((d) => d.isOpen).length === 0,
		callback: () => this.close(),
		offset: 15,
		debug: () => this.debugSafeArea
	});

	hoverAction = useHoverAction({
		isActive: () => this.openOnHover && !this.isOpen,
		onMouseEnter: () => {
			this.open();
		},
		// A function, read on each enter: field initialisers run before `bind(this, options)`
		// installs the options, so a plain `this.delay` here would be `undefined` (no delay).
		delay: () => this.delay
	});

	addChild = (child: PopoverState) => () => this.#children.add(child);

	constructor(options: PopoverOptions) {
		super();
		bind(this, options);
		setContext('popover', this);
		if (this.parent) onMount(this.parent.addChild(this));
		onDestroy(() => {
			this.#destroyed = true;
		});

		useScrollLock({
			isActive: () =>
				this.lockScroll && !this.inline && !this.isMobileSheet && !this.parent && this.isOpen
		});
	}

	toggle = () => {
		this.setOpen(!this.isOpen);
	};
	open = () => {
		this.setOpen(true);
	};

	close = () => {
		this.setOpen(false);
	};

	/** Calls to `setOpen`, direct or through `open`, `close` and `toggle`, unchanged state included. */
	#openRequests = 0;
	/**
	 * The element attached through `reference` (or `trigger`). A plain field, not `$state`: the
	 * detach teardown compares against it, and a `$state` read in teardown can return the value
	 * from before the change that triggered it.
	 */
	#triggerNode: HTMLElement | null = null;
	#destroyed = false;

	/** Whether the panel still has an anchor in the document: the trigger, else the `ref` prop. */
	#hasAnchor = () => {
		const anchor = this.#triggerNode ?? this.externalRef;
		if (!anchor) return false;
		// A floating-ui virtual element (a cursor point) has no DOM presence to lose.
		return !(anchor instanceof Element) || anchor.isConnected;
	};

	/**
	 * Closes an open popover whose anchor left the document, through `close()` so `onOpenChange`
	 * reports it. Skipped while the component itself is being destroyed.
	 */
	#closeIfAnchorLost = () => {
		if (this.#destroyed || !this.isOpen || this.#hasAnchor()) return;
		this.close();
	};

	setOpen = (nextOpen: boolean) => {
		this.#openRequests += 1;
		if (this.isOpen === nextOpen) return;
		// A hover open still waiting on its delay belongs to the state before this change: left
		// pending, it would reopen a popover the user just closed by click or Escape.
		this.hoverAction.cancel();
		this.isOpen = nextOpen;
		this.onOpenChange?.(nextOpen);
	};

	/** Starts the panel's motion from the side facing the reference, for the resolved placement. */
	applyDirectedTransition = (node: HTMLElement, placement: Placement) => {
		const { transformOrigin, axis, distance } = directedMotion(placement);
		this.transformOrigin = transformOrigin;
		Object.assign(this.computedTransition.in, {
			[axis]: distance
		});
		Object.assign(this.computedTransition.out, {
			[axis]: distance
		});
	};

	// floating-ui placement lives in `popover.position.ts`. Its inputs are read when a placement
	// runs: the mount placement runs inside the `dialog` attachment, so a change to any of them
	// re-places an open panel.
	#positioner = createPanelPositioner({
		reference: () => this.referenceElement,
		// Inline panels and mobile sheets are laid out by the document, never by floating-ui.
		floating: () => !this.inline && !this.isMobileSheet,
		settled: () => this.hasTransitioned,
		placement: () => this.computedPosition,
		offset: () => this.offset,
		fitTrigger: () => this.fitTrigger,
		positionPanel: () => this.positionPanel,
		setMinWidth: (width) => {
			this.triggerWidth = width;
		},
		onPlace: ({ panel, placement, mount }) => {
			this.safeArea.updateAreas();
			if (placement && mount && !this.hasTransitioned && this.directedTransition) {
				this.applyDirectedTransition(panel, placement);
			}
		}
	});

	/** Places the floating panel against its reference once; see `PanelPositioner.place`. */
	place = (node: HTMLElement, mount = false) => this.#positioner.place(node, mount);

	dialog = (node: HTMLDialogElement) => {
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
		return () => {
			cleanup();
			this.dialogElement = null;
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
			cleanups.push(this.layer.node(node));
			cleanups.push(this.focusScope.attachment(node));
			cleanups.push(this.safeArea.floatingReference?.(node));
			return () => {
				cleanups.forEach((cleanup) => cleanup?.());
			};
		});
	};
	reference = (node: HTMLElement) => {
		// Keep the trigger's ARIA in sync whichever way it was rendered (snippet or Button).
		// Only real controls carry aria-haspopup/aria-expanded; a wrapper div or a
		// presentational span used as the anchor must not (axe: aria-allowed-attr).
		const canCarryPopupState = node.matches(POPUP_CONTROL);
		$effect(() => {
			if (!canCarryPopupState) return;
			for (const [prop, value] of Object.entries(this.triggerProps)) {
				const name = TRIGGER_ARIA[prop as keyof typeof TRIGGER_ARIA];
				if (value === undefined) node.removeAttribute(name);
				else node.setAttribute(name, String(value));
			}
		});
		return untrack(() => {
			this.#triggerNode = node;
			this.triggerReference = node;

			// Gather all cleanup callbacks
			const cleanups: Array<(() => void) | null | void> = [];
			cleanups.push(this.layer.node(node));
			cleanups.push(this.safeArea.anchorReference?.(node));
			cleanups.push(this.hoverAction.reference?.(node));

			// Return combined cleanup function
			return () => {
				cleanups.forEach((cleanup) => cleanup?.());
				// A newer trigger already took over; this one leaving changes nothing.
				if (this.#triggerNode !== node) return;
				this.#triggerNode = null;
				this.triggerReference = null;
				// A trigger swapped for another (a re-rendered snippet, a responsive branch)
				// attaches in the same flush, so judge once it has settled: only a trigger that is
				// gone for good closes the popover instead of leaving it on a detached node.
				queueMicrotask(this.#closeIfAnchorLost);
			};
		});
	};
	/**
	 * Makes any element a complete trigger: it anchors the panel (as \`reference\` does), toggles
	 * it on click when \`openOnClick\` allows, and keeps \`aria-expanded\` and friends in sync.
	 * An element that is not already a control also gets \`role="button"\`, \`tabindex="0"\` and
	 * Enter/Space activation, so a card or an avatar opens the panel from the keyboard too.
	 */
	trigger = (node: HTMLElement) => {
		const nativeControl = node.matches(NATIVE_CONTROL);
		if (!node.matches(POPUP_CONTROL) && !node.hasAttribute('role')) {
			node.setAttribute('role', 'button');
		}
		if (!nativeControl && !node.hasAttribute('tabindex')) node.tabIndex = 0;
		// The element's own handler wins. One that still opens, closes or toggles the popover
		// (`onclick={popover.toggle}` kept from before this attachment existed) has acted by the
		// time the event finishes dispatching, so the default toggle waits until then and runs only
		// if nothing asked for an open state meanwhile; toggling regardless would undo that call.
		let pending: ReturnType<typeof setTimeout> | undefined;
		const activate = () => {
			if (!this.openOnClick) return;
			const requests = this.#openRequests;
			clearTimeout(pending);
			pending = setTimeout(() => {
				if (this.#openRequests === requests) this.toggle();
			});
		};
		const onKeydown = (event: KeyboardEvent) => {
			if (nativeControl || event.target !== node) return;
			if (event.key !== 'Enter' && event.key !== ' ') return;
			event.preventDefault();
			activate();
		};
		node.addEventListener('click', activate);
		node.addEventListener('keydown', onKeydown);
		const offReference = this.reference(node);
		return () => {
			clearTimeout(pending);
			node.removeEventListener('click', activate);
			node.removeEventListener('keydown', onKeydown);
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
