import { bind } from '$lib/utils/state.svelte.js';
import { getContext, hasContext, onMount, setContext, untrack } from 'svelte';
import { useTheme } from '../Theme/theme.state.svelte.js';
import type { PopoverProps } from './popover.props.js';
import {
	computePosition,
	autoUpdate,
	hide,
	offset,
	shift,
	flip,
	type Placement,
	type Alignment,
	type Side,
	type VirtualElement
} from '@floating-ui/dom';
import { useScrollLock } from '$lib/utils/useScrollLock.svelte.js';
import { useFocusScope } from '$lib/utils/useFocusScope.svelte.js';
import { useSafeArea } from '$lib/utils/safeArea.svelte.js';
import { useHoverAction } from '$lib/utils/useHoverAction.svelte.js';
import { usePopoverMotion, type PopoverThemeProps } from './popover.theme.js';

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
	children = $state<PopoverState[]>([]);
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
		delay: this.delay
	});

	addChild = (child: PopoverState) => () => {
		this.children.push(child);
		return () => {
			this.children = this.children.filter((d) => d.id !== child.id);
		};
	};

	constructor(options: PopoverOptions) {
		super();
		bind(this, options);
		setContext('popover', this);
		if (this.parent) onMount(this.parent.addChild(this));

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

	setOpen = (nextOpen: boolean) => {
		if (this.isOpen === nextOpen) return;
		this.isOpen = nextOpen;
		this.onOpenChange?.(nextOpen);
	};

	applyDirectedTransition = (node: HTMLElement, placement: Placement) => {
		const side = placement.split('-')[0] as Side;
		const alignment = placement.split('-')[1] as Alignment;
		const axis = side === 'top' || side === 'bottom' ? 'y' : 'x';
		const value = side === 'top' || side === 'left' ? 10 : -10;
		const transformOriginY = side === 'top' ? 'bottom' : side === 'bottom' ? 'top' : 'center';
		const transformOriginX =
			alignment === 'start' ? 'left' : alignment === 'end' ? 'right' : 'center';

		this.transformOrigin = `${transformOriginX} ${transformOriginY}`;
		Object.assign(this.computedTransition.in, {
			[axis]: value
		});
		Object.assign(this.computedTransition.out, {
			[axis]: value
		});
	};

	place = async (node: HTMLElement, mount = false) => {
		// Inline panels are laid out by the document, never by floating-ui.
		if (this.inline || this.isMobileSheet || !this.referenceElement) {
			this.triggerWidth = null;
			return;
		}
		if (!mount && !this.hasTransitioned) {
			return;
		}
		if (this.fitTrigger) {
			this.triggerWidth = this.referenceElement!.getBoundingClientRect().width;
		}

		const { x, y, strategy, placement } = await computePosition(this.referenceElement!, node, {
			strategy: 'fixed',
			placement: this.computedPosition,

			middleware: [
				offset(this.offset ?? 4),
				flip({
					mainAxis: true,
					crossAxis: true,
					padding: 20
				}),
				shift({
					mainAxis: true,
					crossAxis: true,
					padding: 20
				}),
				hide()
			]
		});

		Object.assign(node.style, {
			position: strategy,
			left: `${x}px`,
			top: `${y}px`,
			// computePosition is async: unhide only once the first placement lands, so the
			// panel never flashes at top-left (0,0) before floating-ui resolves.
			visibility: ''
		});
		this.safeArea.updateAreas();
		if (mount && !this.hasTransitioned && this.directedTransition) {
			this.applyDirectedTransition(node, placement);
		}
	};

	dialog = (node: HTMLDialogElement) => {
		this.dialogElement = node;
		if (this.inline) {
			// No portal, no fixed placement: the wrapper stays where the component is rendered.
			this.triggerWidth = null;
			Object.assign(node.style, {
				position: '',
				left: '',
				top: '',
				visibility: ''
			});
			return () => {
				this.dialogElement = null;
			};
		}
		if (this.isMobileSheet) {
			this.triggerWidth = null;
			Object.assign(node.style, {
				position: '',
				left: '',
				top: ''
			});
			return () => {
				this.dialogElement = null;
			};
		}

		// Hide until place() resolves (async computePosition), preventing the top-left flash.
		node.style.visibility = 'hidden';
		void this.place(node, true);
		const cleanup = autoUpdate(this.referenceElement!, node, () => this.place(node));
		return () => {
			cleanup();
			this.dialogElement = null;
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
		const canCarryPopupState = node.matches(
			'button, a[href], input, select, textarea, summary, [role="button"], [role="link"], [role="combobox"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="tab"], [role="option"], [role="treeitem"], [role="gridcell"], [role="switch"], [role="checkbox"]'
		);
		$effect(() => {
			if (!canCarryPopupState) return;
			for (const [prop, value] of Object.entries(this.triggerProps)) {
				const name = TRIGGER_ARIA[prop as keyof typeof TRIGGER_ARIA];
				if (value === undefined) node.removeAttribute(name);
				else node.setAttribute(name, String(value));
			}
		});
		return untrack(() => {
			this.triggerReference = node;

			// Gather all cleanup callbacks
			const cleanups: Array<(() => void) | null | void> = [];
			cleanups.push(this.layer.node(node));
			cleanups.push(this.safeArea.anchorReference?.(node));
			cleanups.push(this.hoverAction.reference?.(node));

			// Return combined cleanup function
			return () => {
				cleanups.forEach((cleanup) => cleanup?.());
			};
		});
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
