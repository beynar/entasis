import { untrack, type Snippet } from 'svelte';
import type { TransitionConfig } from 'svelte/transition';
import { easingFunctions } from '$lib/transitions/easingFunctions.js';
import type { ResolvedMotion } from '$lib/utils/motion/index.js';
import { createPointerDrag } from '$lib/utils/pointerDrag.js';
import { createBindableValue } from '$lib/utils/state.svelte.js';
import type {
	SidebarApi,
	SidebarGroup,
	SidebarMenuButtonItem,
	SidebarMenuEntry,
	SidebarSearch,
	SidebarSide,
	SidebarView
} from './sidebar.props.js';

/** What the panel renders for a view: the Sidebar's own props, or a view's resolved over its parents. */
export type SidebarSlotValues = {
	items?: SidebarGroup[];
	content?: Snippet<[SidebarApi]>;
	headerButton?: SidebarMenuButtonItem;
	search?: SidebarSearch;
	headerMenu?: SidebarMenuEntry[];
	header?: Snippet<[SidebarApi]>;
	footerButton?: SidebarMenuButtonItem;
	footerMenu?: SidebarMenuEntry[];
	footer?: Snippet<[SidebarApi]>;
};

/** The header and footer props a view can set; together they are the panel's chrome. */
const chromeProps = [
	'header',
	'headerButton',
	'search',
	'headerMenu',
	'footerButton',
	'footerMenu',
	'footer'
] as const;

/**
 * What slides on a view change. `body` is the menu alone; `panel` is the whole panel (header,
 * menu, footer), which only swaps when the two views do not share the same chrome.
 */
export type SidebarViewKind = 'panel' | 'body';

type Views = Record<string, SidebarView>;
type PropSlot = (typeof chromeProps)[number];

/** The view and its ancestors, nearest first. A missing parent or a parent cycle ends the chain. */
export const viewChain = (views: Views, id: string): string[] => {
	const chain: string[] = [];
	for (let key: string | undefined = id; key !== undefined && key in views;) {
		if (chain.includes(key)) break;
		chain.push(key);
		key = views[key].parent;
	}
	return chain;
};

/**
 * Resolves one header or footer prop for a view: the nearest view in the chain that sets it
 * (`null` counts, and clears it), else the Sidebar. `owner` names where it came from, so two
 * views share the slot exactly when it resolves to the same owner.
 */
export const resolveSlot = <S extends PropSlot>(
	views: Views,
	id: string,
	slot: S,
	root: SidebarSlotValues
): { owner: string | null; value: SidebarSlotValues[S] } => {
	const owner = viewChain(views, id).find((key) => views[key][slot] !== undefined);
	const value = owner === undefined ? root[slot] : views[owner][slot];
	return { owner: owner ?? null, value: (value ?? undefined) as SidebarSlotValues[S] };
};

export type SidebarViewDirection = 'forward' | 'back' | 'none';

/** Which half of a back swipe a layer plays: the view leaving (`over`) or its parent (`under`). */
export type SidebarSwipeRole = 'over' | 'under';

export type SidebarViewLayer = { key: string; view: string; role?: SidebarSwipeRole };

type Swipe = {
	from: string;
	to: string;
	/** `drag` follows the finger; `commit` / `cancel` animate to rest, then the swipe ends. */
	phase: 'drag' | 'commit' | 'cancel';
	/** Distance travelled toward the inline end, in px. */
	offset: number;
	width: number;
	/** The commit has finished moving and waits for the view change to land (a route, say). */
	settled?: boolean;
};

type SidebarViewsOptions = {
	readonly views: Views | undefined;
	readonly view: string | undefined;
	readonly defaultView: string | undefined;
	readonly onViewChange: ((view: string) => void) | undefined;
	readonly isMobile: boolean;
	readonly side: SidebarSide;
	readonly root: SidebarSlotValues;
	setViewProp: (view: string | undefined) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const cssLength = (value: number | string | undefined) =>
	typeof value === 'number' ? `${value}px` : (value ?? '0px');

export class SidebarViewsState {
	swipe = $state<Swipe | null>(null);
	rtl = $state(false);
	#selected: { value: string | undefined };
	#shown: string | undefined;
	#lastChange: { from?: string; to?: string; direction: SidebarViewDirection } = {
		direction: 'none'
	};

	constructor(private options: SidebarViewsOptions) {
		this.#selected = createBindableValue<string | undefined>(
			() => options.view,
			(view) => options.setViewProp(view),
			() => options.defaultView
		);
		// A committed swipe lets go once the view it asked for is on screen; any other view change
		// (a route, a parent update) ends the swipe on the spot.
		$effect(() => {
			const swipe = this.swipe;
			if (!swipe) return;
			const current = this.current;
			if (
				(swipe.settled && current === swipe.to) ||
				(current !== swipe.from && current !== swipe.to)
			)
				this.swipe = null;
		});
		this.#shown = untrack(() => this.current);
	}

	get enabled() {
		return !!this.options.views && Object.keys(this.options.views).length > 0;
	}

	/** The view on screen: the selected one when it exists, else `defaultView`, else the first. */
	get current(): string | undefined {
		const views = this.options.views;
		if (!views) return undefined;
		const selected = this.#selected.value;
		if (selected !== undefined && selected in views) return selected;
		const fallback = this.options.defaultView;
		return fallback !== undefined && fallback in views ? fallback : Object.keys(views)[0];
	}

	depth(id: string) {
		return this.options.views ? viewChain(this.options.views, id).length - 1 : 0;
	}

	parentOf(id: string) {
		const parent = this.options.views?.[id]?.parent;
		return parent !== undefined && parent in (this.options.views ?? {}) ? parent : undefined;
	}

	labelOf(id: string) {
		return this.options.views?.[id]?.label;
	}

	/**
	 * The last change of the current view and its direction, read by the layer transitions when
	 * they start. Deeper slides forward and shallower slides back; at one depth (sections), the
	 * later view in `views` is forward, like pages in order.
	 */
	get lastChange() {
		const to = this.current;
		if (to === this.#shown) return this.#lastChange;
		const from = this.#shown;
		this.#shown = to;
		if (from === undefined || to === undefined) {
			this.#lastChange = { from, to, direction: 'none' };
			return this.#lastChange;
		}
		const order = Object.keys(this.options.views ?? {});
		const delta = this.depth(to) - this.depth(from) || order.indexOf(to) - order.indexOf(from);
		this.#lastChange = { from, to, direction: delta < 0 ? 'back' : 'forward' };
		return this.#lastChange;
	}

	setView = (view: string) => {
		if (!this.options.views || !(view in this.options.views) || view === this.current) return;
		this.#selected.value = view;
		this.options.onViewChange?.(view);
	};

	/** A view's body. */
	body(view: string) {
		const entry = this.options.views?.[view];
		return { items: entry?.items, content: entry?.content };
	}

	/** A view's header and footer props, each from the nearest view that sets it, else the Sidebar. */
	chrome(view: string): SidebarSlotValues {
		const chrome: SidebarSlotValues = {};
		for (const prop of chromeProps) {
			const { value } = resolveSlot(this.options.views ?? {}, view, prop, this.options.root);
			if (value != null) Object.assign(chrome, { [prop]: value });
		}
		return chrome;
	}

	/**
	 * The layers a stage renders, bottom first. Outside a swipe that is the current view alone;
	 * during one it is the parent under the view being swiped away. Two views that share a layer
	 * key collapse to one layer that never moves: the panel's key is where its chrome comes from,
	 * so views with the same header and footer keep one panel and only their bodies slide.
	 */
	layers(kind: SidebarViewKind): SidebarViewLayer[] {
		const current = this.current;
		if (current === undefined) return [];
		const swipe = this.swipe;
		const entries: { view: string; role?: SidebarSwipeRole }[] = swipe
			? [
					{ view: swipe.to, role: 'under' },
					{ view: swipe.from, role: 'over' }
				]
			: [{ view: current }];
		const layers: SidebarViewLayer[] = [];
		for (const entry of entries) {
			const key = kind === 'body' ? entry.view : this.#chromeKey(entry.view);
			const shared = layers.find((layer) => layer.key === key);
			if (shared) shared.role = undefined;
			else layers.push({ key, ...entry });
		}
		return layers;
	}

	#chromeKey(view: string) {
		const views = this.options.views ?? {};
		return chromeProps
			.map((prop) => resolveSlot(views, view, prop, this.options.root).owner ?? '')
			.join('|');
	}

	/**
	 * A swipe layer's drag position, as `translate` / `opacity` styles; empty at rest. The view
	 * under the finger stays opaque and follows it; its parent comes from `travel` toward the
	 * start and from `opacity`, the same way the view motion brings a view in.
	 */
	swipeStyle(role: SidebarSwipeRole | undefined, travel: number | string, opacity: number) {
		const swipe = this.swipe;
		if (!swipe || !role) return {};
		const sign = this.rtl ? -1 : 1;
		const rest = `calc(${cssLength(travel)} * ${-sign})`;
		const progress = swipe.width ? swipe.offset / swipe.width : 0;
		if (swipe.phase === 'drag') {
			if (role === 'over')
				return {
					translate: `${swipe.offset * sign}px`,
					opacity: 1 - (1 - opacity) * progress
				};
			return {
				translate: `calc(${cssLength(travel)} * ${-sign * (1 - progress)})`,
				opacity: opacity + (1 - opacity) * progress
			};
		}
		// Settling: a committed view leaves to the inline end; a cancelled parent returns under it.
		if (role === 'over')
			return swipe.phase === 'commit' ? { translate: `${100 * sign}%`, opacity } : {};
		return swipe.phase === 'cancel' ? { translate: rest, opacity } : {};
	}

	get canSwipeBack() {
		const current = this.current;
		return this.options.isMobile && current !== undefined && !!this.parentOf(current);
	}

	/**
	 * The mobile drawer dismisses on a swipe toward its own edge. When going back points the same
	 * way (a right drawer in LTR, a left one in RTL), the view body keeps the gesture.
	 */
	get ownsDrawerSwipe() {
		return this.canSwipeBack && (this.rtl ? -1 : 1) === (this.options.side === 'right' ? 1 : -1);
	}

	/** Called by the body stage once a settling swipe has had its motion duration. */
	settleSwipe() {
		const swipe = this.swipe;
		if (!swipe || swipe.phase === 'drag') return;
		if (swipe.phase === 'cancel' || this.current === swipe.to) this.swipe = null;
		else swipe.settled = true;
		// ponytail: a controlled `view` that ignores `onViewChange` leaves the swipe parked off
		// screen until some view change lands; fine for a consumer bug, revisit if one shows up.
	}

	/** Back swipe on the view body: toward the inline end, anywhere on the body, mobile only. */
	swipeAttachment = (node: HTMLElement) => {
		this.rtl = getComputedStyle(node).direction === 'rtl';
		let candidate = false;
		let sign = 1;
		let lastX = 0;
		let lastTime = 0;
		let velocity = 0;

		const release = (cancelled: boolean, timeStamp: number) => {
			candidate = false;
			const swipe = this.swipe;
			if (swipe?.phase !== 'drag') return;
			// A long stationary hold is not a flick: the last velocity sample may be stale.
			if (timeStamp - lastTime > 100) velocity = 0;
			const commit =
				!cancelled && (velocity > 0.4 || (swipe.offset > swipe.width * 0.35 && velocity > -0.2));
			swipe.phase = commit ? 'commit' : 'cancel';
			if (commit) this.setView(swipe.to);
		};

		return createPointerDrag({
			disabled: () => !this.canSwipeBack || this.swipe !== null,
			// The body is a region full of rows, not a handle: a press that never travels keeps its click.
			capture: 'on-activate',
			onDown: ({ event }) => {
				candidate = true;
				this.rtl = getComputedStyle(node).direction === 'rtl';
				sign = this.rtl ? -1 : 1;
				lastX = event.clientX;
				lastTime = event.timeStamp;
				velocity = 0;
			},
			// Horizontal toward the inline end, clearly more than vertical: anything else is a scroll.
			shouldActivate: ({ deltaX, deltaY }) => {
				if (!candidate) return false;
				const forward = deltaX * sign;
				if (forward > 8 && forward > Math.abs(deltaY) * 1.5) return true;
				if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) candidate = false;
				return false;
			},
			onStart: () => {
				const from = this.current;
				const to = from === undefined ? undefined : this.parentOf(from);
				if (from === undefined || to === undefined) return false;
				this.swipe = { from, to, phase: 'drag', offset: 0, width: node.offsetWidth };
			},
			onMove: ({ event, deltaX }) => {
				const swipe = this.swipe;
				if (swipe?.phase !== 'drag') return;
				swipe.offset = clamp(deltaX * sign, 0, swipe.width);
				const elapsed = event.timeStamp - lastTime;
				if (elapsed >= 8) {
					velocity = ((event.clientX - lastX) * sign) / elapsed;
					lastX = event.clientX;
					lastTime = event.timeStamp;
				}
			},
			onEnd: ({ event }) => release(false, event.timeStamp),
			onCancel: ({ event }) => release(true, event.timeStamp)
		})(node);
	};
}

type ViewTransitionParams = {
	phase: 'in' | 'out';
	direction: SidebarViewDirection;
	motion: ResolvedMotion;
};

/**
 * Pager motion between views. Forward, the new view comes from the inline end and the old one
 * leaves to the start, side by side, each travelling the motion's `x` and fading along the whole
 * way; back mirrors it. A layer a swipe put in place is already where it belongs, so it enters
 * and leaves without motion.
 */
export const sidebarViewTransition = (
	node: HTMLElement,
	{ phase, direction, motion }: ViewTransitionParams
): TransitionConfig => {
	if (phase === 'out') node.style.pointerEvents = 'none';
	const side = phase === 'in' ? motion.in : motion.out;
	const duration = side.duration ?? 0;
	if (node.dataset.swipe || direction === 'none' || duration === 0) return { duration: 0 };
	const travel = cssLength(side.x);
	const rest = side.opacity ?? 0;
	const rtl = getComputedStyle(node).direction === 'rtl' ? -1 : 1;
	const sign = rtl * (direction === 'back' ? -1 : 1) * (phase === 'in' ? 1 : -1);
	return {
		duration,
		easing: easingFunctions[side.easing ?? 'cubicOut'],
		css: (t, u) =>
			`transform: translateX(calc(${travel} * ${u * sign})); opacity: ${rest + (1 - rest) * t}`
	};
};
