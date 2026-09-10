import { bind } from '$lib/utils/state.svelte.js';
import { getContext, hasContext, mount, onMount, setContext, untrack } from 'svelte';
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
import { useKeyDown } from '$lib/utils/useKeyDown.svelte.js';
import { useScrollLock } from '$lib/utils/useScrollLock.svelte.js';
import { useSafeArea } from '$lib/utils/safeArea.svelte.js';
import { useClickOutside } from '$lib/utils/useClickOutside.svelte.js';
import { useHoverAction } from '$lib/utils/useHoverAction.svelte.js';

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
		| 'hoverDelay'
		| 'openOnClick'
		| 'mobileSheet'
	>,
	| 'directedTransition'
	| 'closeOnEscape'
	| 'lockScroll'
	| 'closeOnMouseLeave'
	| 'debugSafeArea'
	| 'closeOnClickOutside'
	| 'openOnHover'
	| 'hoverDelay'
	| 'openOnClick'
> {
	isOpen: boolean;
	// An HTMLElement, or a floating-ui virtual element (e.g. a point at the cursor for context menus).
	externalRef?: HTMLElement | VirtualElement | null;
	fitTrigger: boolean;
}

export interface PopoverState extends PopoverOptions {}
export class PopoverState {
	defaultTransition = () =>
		this.isMobileSheet
			? {
					in: {
						x: 0,
						y: '100%' as const,
						scale: 1,
						opacity: 1
					},
					out: {
						x: 0,
						y: '100%' as const,
						scale: 1,
						opacity: 1
					}
				}
			: {
					in: {
						x: 0,
						y: 0,
						scale: 0.98,
						opacity: 0
					},
					out: {
						x: 0,
						y: 0,
						scale: 0.98,
						opacity: 0
					}
				};
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

	isLastOpen = $derived.by(() => {
		const openedPopovers = this.theme.popovers.filter((d) => d.isOpen);
		const openedChildren = this.children.filter((d) => d.isOpen);
		return (
			openedPopovers.length === 1 &&
			openedPopovers.at(0)?.id === this.id &&
			openedChildren.length === 0
		);
	});

	isLastOfStack = $derived(this.parent ? this.parent?.children.at(-1)?.id === this.id : true);
	computedSize = $derived(this.theme.resolveResponsiveProps(this.size, 'normal'));
	isMobileSheet = $derived(!!this.mobileSheet && this.theme.isMobile);
	computedMode: 'floating' | 'mobileSheet' = $derived(
		this.isMobileSheet ? 'mobileSheet' : 'floating'
	);
	computedTransition = $derived(
		this.theme.resolveTransitionProps(this.transition, this.defaultTransition())
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

	clickOutside = useClickOutside({
		isActive: () => {
			if (!this.closeOnClickOutside || this.children.some((d) => d.isOpen)) {
				return false;
			}
			return this.isOpen && this.hasTransitioned;
		},
		callback: () => {
			this.close();
		}
	});

	hoverAction = useHoverAction({
		isActive: () => this.openOnHover && !this.isOpen,
		onMouseEnter: () => {
			this.open();
		},
		delay: this.hoverDelay
	});

	addChild = (child: PopoverState) => () => {
		this.children.push(child);
		return () => {
			this.children = this.children.filter((d) => d.id !== child.id);
		};
	};

	constructor(options: PopoverOptions) {
		bind(this, options);
		setContext('popover', this);
		onMount(this.theme.addPopover(this));
		this.parent && onMount(this.parent.addChild(this));

		// Initialize hooks that don't return references

		useScrollLock({
			isActive: () =>
				this.lockScroll &&
				!this.isMobileSheet &&
				!this.parent &&
				this.isOpen &&
				this.theme.popovers.filter((d) => d.isOpen).length === 1
		});

		useKeyDown({
			isActive: () => {
				const isActive =
					this.closeOnEscape &&
					!this.isMobileSheet &&
					this.isOpen &&
					(this.isLastOfStack || this.isLastOpen);

				return isActive;
			},
			onWindow: () =>
				this.closeOnEscape &&
				!this.isMobileSheet &&
				this.isOpen &&
				(this.isLastOfStack || this.isLastOpen),
			keys: ['Escape'],
			callback: () => {
				this.close();
			}
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
		if (this.isMobileSheet || !this.referenceElement) {
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
			cleanups.push(this.clickOutside.reference?.(node));
			cleanups.push(this.safeArea.floatingReference?.(node));
			return () => {
				cleanups.forEach((cleanup) => cleanup?.());
			};
		});
	};
	reference = (node: HTMLElement) => {
		return untrack(() => {
			this.triggerReference = node;

			// Gather all cleanup callbacks
			const cleanups: Array<(() => void) | null | void> = [];
			cleanups.push(this.clickOutside.reference?.(node));
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
