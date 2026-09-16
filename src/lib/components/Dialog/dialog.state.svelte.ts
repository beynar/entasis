import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { createPointerDrag } from '$lib/utils/pointerDrag.js';
// import { useTheme } from '$lib/utils/theme.svelte.js';
import { getContext, onMount, setContext, untrack } from 'svelte';
import { useTheme } from '../Theme/theme.state.svelte.js';
import type { DialogProps } from './dialog.props.js';
import { useFocusScope } from '$lib/utils/useFocusScope.svelte.js';
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
	'closeOnEscape' | 'closeOnClickOutside' | 'closable'
> {
	isOpen: boolean;
	onOpenChange?: (open: boolean) => void;
	/** The instance `theme.motion` slot; the `transition` prop still wins over it. */
	motion?: DialogThemeProps['motion'];
}

export class DialogState extends createBindableStateClass<DialogOptions>() {
	parent = getContext<DialogState | null>('dialog');
	children = $state<DialogState[]>([]);
	hasTransitioned = $state(false);
	theme = useTheme();
	// Registered in the shared layer stack, which owns Escape / outside-press dismissal,
	// open ordering and z-index for every overlay kind.
	layer = this.theme.layers.register({
		kind: 'dialog',
		isOpen: () => this.isOpen,
		isModal: () => true,
		dismissOnEscape: () => this.closeOnEscape && this.closable,
		dismissOnOutside: () => this.closeOnClickOutside && this.hasTransitioned,
		onDismiss: () => this.close(),
		state: this
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

	// Initial focus, Tab containment, `inert` page behind, focus restore to the opener.
	focusScope = useFocusScope({
		isActive: () => this.isTop,
		inertSiblings: () => true
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
		if (this.parent) onMount(this.parent.addChild(this));
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

		const endDrag = (event: PointerEvent, cancelled: boolean) => {
			candidate = false;
			if (!this.dragging) return;
			this.dragging = false;
			// A long stationary hold is not a flick — the last velocity sample may be old.
			if (event.timeStamp - lastTime > 100) velocity = 0;
			const shouldClose =
				!cancelled &&
				this.isOpen &&
				(Math.abs(this.dragOffset) > this.dragSize * 0.25 || velocity > 0.4);
			// Closing keeps dragOffset so the out transition starts from the dragged position.
			// Snap-back waits a frame so the re-enabled CSS transition animates the return.
			if (shouldClose) this.close();
			else requestAnimationFrame(() => (this.dragOffset = 0));
		};

		const drag = createPointerDrag({
			disabled: () => !this.swipeEnabled || !this.isTop,
			// The panel is the whole drawer, not a handle: capturing every press would retarget the
			// compatibility mouse events and steal clicks from the buttons and inputs inside it.
			capture: 'on-activate',
			// Touch panning is already governed by `touch-action` on the handles and by `ownsGesture`,
			// which only promotes where nothing else can still scroll along the axis.
			preventTouchMove: false,
			onDown: ({ event }) => {
				candidate = true;
				startPos = lastPos = axisPos(event);
				lastTime = event.timeStamp;
				velocity = 0;
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
				// Resample velocity on ~frame intervals so a single sub-frame move can't spike it.
				const dt = event.timeStamp - lastTime;
				if (dt >= 8) {
					velocity = ((pos - lastPos) * this.swipeSign) / dt;
					lastPos = pos;
					lastTime = event.timeStamp;
				}
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
