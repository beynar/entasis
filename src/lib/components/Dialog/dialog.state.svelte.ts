import { createBindableStateClass } from '$lib/utils/state.svelte.js';
// import { useTheme } from '$lib/utils/theme.svelte.js';
import { getContext, onMount, setContext, untrack } from 'svelte';
import { useTheme } from '../Theme/theme.state.svelte.js';
import type { DialogProps } from './dialog.props.js';
import { useKeyDown } from '$lib/utils/useKeyDown.svelte.js';
import { useClickOutside } from '$lib/utils/useClickOutside.svelte.js';
import { useFocusTrap } from '$lib/utils/useFocusTrap.svelte.js';
import { DIALOG_Z_BASE, DIALOG_Z_STEP } from '../Theme/theme.layers.js';

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
	'closeOnEscape' | 'closeOnClickOutside' | 'closable'
> {
	isOpen: boolean;
	onOpenChange?: (open: boolean) => void;
}

const defaultTransition = {
	modal: {
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
	},
	fullScreen: {
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
	},
	drawerRight: {
		in: {
			x: '100%',
			y: 0,
			scale: 0.98,
			opacity: 0
		},
		out: {
			x: '100%',
			y: 0,
			scale: 0.98,
			opacity: 0
		}
	},
	drawerLeft: {
		in: {
			x: '-100%',
			y: 0,
			scale: 0.98,
			opacity: 0
		},
		out: {
			x: '-100%',
			y: 0,
			scale: 0.98,
			opacity: 0
		}
	},
	drawerBottom: {
		in: {
			x: 0,
			y: '100%',
			scale: 0.98,
			opacity: 0
		},
		out: {
			x: 0,
			y: '100%',
			scale: 0.98,
			opacity: 0
		}
	},
	drawerTop: {
		in: {
			x: 0,
			y: '-100%',
			scale: 0.98,
			opacity: 0
		},
		out: {
			x: 0,
			y: '-100%',
			scale: 0.98,
			opacity: 0
		}
	},
	alert: {
		in: {
			x: 0,
			y: -100,
			scale: 0.98,
			opacity: 0
		},
		out: {
			x: 0,
			y: -100,
			scale: 0.98,
			opacity: 0
		}
	}
} as const;

export class DialogState extends createBindableStateClass<DialogOptions>() {
	parent = getContext<DialogState | null>('dialog');
	children = $state<DialogState[]>([]);
	hasTransitioned = $state(false);
	theme = useTheme();
	openOrder = $state(0);

	// Position of this dialog within the globally-ordered open stack.
	stackIndex = $derived(this.theme.openDialogs.indexOf(this));
	stackDepth = $derived(
		this.stackIndex < 0 ? 0 : this.theme.openDialogs.length - 1 - this.stackIndex
	);
	isTop = $derived(this.isOpen && this.stackIndex === this.theme.openDialogs.length - 1);

	// Topmost dialog renders at full size; parents scale down and fade behind it.
	zIndex = $derived(DIALOG_Z_BASE + this.openOrder * DIALOG_Z_STEP);
	stackScale = $derived(Math.max(0, 1 - this.stackDepth * 0.06));
	stackOpacity = $derived(this.stackDepth === 0 ? 1 : Math.max(0.4, 1 - this.stackDepth * 0.35));

	computedSize = $derived(this.theme.resolveResponsiveProps(this.size, 'normal'));
	// A `modal` collapses into a bottom sheet on mobile unless `responsive` is off. This
	// runs after `resolveResponsiveProps`, so an explicit responsive `type` function still
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

	computedTransition = $derived(
		this.theme.resolveTransitionProps(this.transition, defaultTransition[this.computedType])
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

	// Hook instances
	clickOutside = useClickOutside({
		isActive: () => this.closeOnClickOutside && this.isTop && this.hasTransitioned,
		callback: () => this.close()
	});

	focusTrap = useFocusTrap({
		isActive: () => this.isTop
	});

	addChild = (child: DialogState) => () => {
		this.children.push(child);
		return () => {
			this.children = this.children.filter((d) => d.id !== child.id);
		};
	};

	constructor(options: DialogOptions) {
		super(options);
		setContext('dialog', this);
		onMount(this.theme.addDialog(this));
		if (this.parent) onMount(this.parent.addChild(this));

		// Assign a fresh open-order each time the dialog opens so it stacks on top.
		$effect(() => {
			if (this.isOpen) {
				untrack(() => {
					this.openOrder = ++this.theme.dialogSeq;
				});
			}
		});

		// Initialize hooks that don't return references
		useKeyDown({
			isActive: () => this.isOpen,
			onWindow: () => true,
			keys: ['Escape'],
			callback: (e) => {
				if (this.isOpen) {
					e.preventDefault();
				}
				if (this.closeOnEscape && this.closable && this.isTop) {
					this.close();
				}
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

	private setOpen(nextOpen: boolean) {
		if (this.isOpen === nextOpen) return;
		this.isOpen = nextOpen;
		this.onOpenChange?.(nextOpen);
	}

	contentAttachment = (node: HTMLElement) => {
		return untrack(() => {
			const cleanups: Array<(() => void) | void> = [];
			cleanups.push(this.focusTrap.attachment?.(node));
			cleanups.push(this.clickOutside.reference?.(node));
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
		let pointerId: number | null = null;
		let candidate = false;
		let downTarget: EventTarget | null = null;
		let startPos = 0;
		let lastPos = 0;
		let lastTime = 0;
		let velocity = 0;

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

		// Gesture termination listens on `window`: before promotion there's no pointer
		// capture, so a press released outside the panel would otherwise strand the gesture.
		const addEndListeners = () => {
			window.addEventListener('pointerup', onUp);
			window.addEventListener('pointercancel', onCancel);
		};
		const removeEndListeners = () => {
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onCancel);
		};

		const onDown = (e: PointerEvent) => {
			// Primary button only; a second concurrent pointer must not hijack a drag in flight.
			if (!this.swipeEnabled || !this.isTop || e.button !== 0 || pointerId !== null) return;
			pointerId = e.pointerId;
			candidate = true;
			downTarget = e.target; // fix the gesture's intent to where it started
			startPos = lastPos = axisPos(e);
			lastTime = e.timeStamp;
			velocity = 0;
			this.dragSize = this.swipeAxis === 'y' ? node.offsetHeight : node.offsetWidth;
			addEndListeners();
		};

		const onMove = (e: PointerEvent) => {
			if (pointerId !== e.pointerId) return;
			const pos = axisPos(e);
			const delta = (pos - startPos) * this.swipeSign; // + = dismiss direction
			if (!this.dragging) {
				if (!candidate || !this.isOpen) return;
				// Handles (thumb, header) always drag — even when a scrolled body would own
				// the gesture. The body only drags in `panel` mode, and never over a region
				// that can still scroll along the axis.
				const onHandle =
					downTarget instanceof Element && !!downTarget.closest('[data-drag-handle]');
				const eligible =
					onHandle || ((this.swipeFrom ?? 'panel') === 'panel' && !ownsGesture(downTarget));
				if (delta > 4 && eligible) {
					this.dragging = true;
					try {
						node.setPointerCapture(e.pointerId);
					} catch {
						/* pointer may be inactive (synthetic events) — capture is best-effort */
					}
				} else if (Math.abs(pos - startPos) > 4) {
					candidate = false; // wrong direction or the target owns the gesture
					return;
				} else {
					return;
				}
			}
			e.preventDefault();
			this.dragOffset = this.swipeSign * Math.max(0, delta); // clamp: can't drag past open
			// Resample velocity on ~frame intervals so a single sub-frame move can't spike it.
			const dt = e.timeStamp - lastTime;
			if (dt >= 8) {
				velocity = ((pos - lastPos) * this.swipeSign) / dt;
				lastPos = pos;
				lastTime = e.timeStamp;
			}
		};

		const endDrag = (e: PointerEvent, cancelled: boolean) => {
			if (pointerId !== e.pointerId) return;
			removeEndListeners();
			pointerId = null;
			candidate = false;
			downTarget = null;
			if (!this.dragging) return;
			this.dragging = false;
			// A long stationary hold is not a flick — the last velocity sample may be old.
			if (e.timeStamp - lastTime > 100) velocity = 0;
			const shouldClose =
				!cancelled &&
				this.isOpen &&
				(Math.abs(this.dragOffset) > this.dragSize * 0.25 || velocity > 0.4);
			// Closing keeps dragOffset so the out transition starts from the dragged position.
			// Snap-back waits a frame so the re-enabled CSS transition animates the return.
			if (shouldClose) this.close();
			else requestAnimationFrame(() => (this.dragOffset = 0));
		};
		const onUp = (e: PointerEvent) => endDrag(e, false);
		const onCancel = (e: PointerEvent) => endDrag(e, true);

		// Fresh mount = fresh open: clear any offset left over from a drag-dismiss.
		this.dragOffset = 0;
		this.dragging = false;
		node.addEventListener('pointerdown', onDown);
		node.addEventListener('pointermove', onMove);
		return () => {
			node.removeEventListener('pointerdown', onDown);
			node.removeEventListener('pointermove', onMove);
			removeEndListeners();
		};
	};
}
