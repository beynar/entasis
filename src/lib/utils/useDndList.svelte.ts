import {
	autoScrollForElements,
	combine,
	draggable,
	dropTargetForElements,
	monitorForElements,
	pointerOutsideOfPreview,
	reorder,
	setCustomNativeDragPreview
} from '$lib/utils/pragmaticDragAndDrop.js';
import type { Attachment } from 'svelte/attachments';

export type DndAxis = 'vertical' | 'horizontal';
export type DndAutoScrollAxis = DndAxis | 'all';
export type DndEdge = 'top' | 'bottom' | 'left' | 'right';
export type DndIndicatorMode = boolean | 'custom';

/** What a drag carries — enough for any list to decide and act on a drop. */
export type DndSource<T = unknown> = {
	/** Id of the list the item is dragged FROM. */
	listId: string;
	/** Stable id of the dragged item. */
	itemId: string;
	/** Index of the item in its source list at drag start. */
	index: number;
	/** The item itself (by reference, not serialized). */
	item: T;
};

export type UseDndListOptions<T> = {
	/**
	 * Unique id of this list. Other lists receive it in `accepts`/`onReceive`
	 * and use it to accept or reject the drag. Drop attribution itself uses a
	 * private per-instance token, so two lists accidentally sharing an id can
	 * not corrupt each other — but keep ids unique for `accepts` to be useful.
	 */
	id: string;
	/** Reactive getter for the list's items. */
	items: () => T[];
	/** Stable id for an item. Defaults to `item.id`. */
	itemId?: (item: T) => string;
	/**
	 * Called after a same-list drag with the reordered array — assign it to
	 * your state. `detail` carries the moved item, both indices, and the exact
	 * hovered item edge (resolved at drop time, so mid-drag list changes stay
	 * consistent).
	 */
	onReorder?: (
		items: T[],
		detail: {
			item: T;
			from: number;
			to: number;
			targetItemId: string | null;
			targetEdge: DndEdge | null;
		}
	) => void;
	/**
	 * Accept (or reject) items dragged from OTHER lists, based on the source
	 * list id and/or the item. Rejected drags show no indicator and cannot
	 * drop. Defaults to rejecting everything external.
	 */
	accepts?: (source: DndSource) => boolean;
	/** An accepted external item was dropped here at `index` — insert it. */
	onReceive?: (payload: { item: unknown; index: number; from: DndSource }) => void;
	/**
	 * One of THIS list's items was dropped into another accepting list —
	 * remove it. `index` is resolved at drop time. Note: the source list must
	 * stay mounted for the duration of drags it originates, otherwise the
	 * destination receives but nobody removes.
	 */
	onRemove?: (payload: { item: T; index: number; to: { listId: string } }) => void;
	/** Orientation; drives the closest-edge math and the indicator. Pass a
	 * function to make it reactive. @default 'vertical' */
	axis?: DndAxis | (() => DndAxis);
	/**
	 * Axes that overflow ancestors may auto-scroll during this list's drags.
	 * This is independent from list orientation because nested boards can need
	 * cross-axis scrolling. The nearest scroll container is also locked on the
	 * other axis during the native drag. Pass a function to make it reactive.
	 * @default 'all'
	 */
	autoScrollAxis?: DndAutoScrollAxis | (() => DndAutoScrollAxis);
	/**
	 * When true, items only drag from a descendant marked `data-dnd-handle`
	 * (resolved per drag attempt, so late-rendered handles work). With no
	 * handle present the row is not draggable. Pass a function to make it
	 * reactive.
	 */
	handle?: boolean | (() => boolean);
	/** Reactive kill-switch — checked per drag attempt and per drop-target
	 * evaluation, so flipping it mid-drag is safe. */
	disabled?: () => boolean;
	/** Per-item drag gate, checked per drag attempt on top of `disabled` and
	 * `handle`. Return false to keep the row in place. */
	canDrag?: (item: T) => boolean;
	/** A drag of one of THIS list's items started. */
	onDragStart?: (payload: { item: T; index: number }) => void;
	/**
	 * The drag of one of THIS list's items ended (drop or cancel), after any
	 * state callbacks ran. `dropped` is true when it landed on an accepting
	 * list — including no-op drops back onto its own position.
	 */
	onDragEnd?: (payload: { item: T; dropped: boolean }) => void;
	/**
	 * Draw the shared drop-indicator line while a drag hovers this list.
	 * Set false for live-preview UIs that render the prospective order from
	 * `over` instead (the gap IS the indicator there). Set `custom` to keep
	 * indicator-style ordering semantics while rendering feedback from `over`
	 * yourself. A getter makes the feedback mode reactive.
	 * @default true
	 */
	indicator?: DndIndicatorMode | (() => DndIndicatorMode);
};

/** Live hover state of a list: where the dragged item would land if dropped
 * now. `index` is the insertion index in the list's FINAL array (same-list:
 * after removal of the dragged item — directly usable to build a preview). */
export type DndOver = {
	index: number;
	source: DndSource;
	targetItemId: string | null;
	targetEdge: DndEdge | null;
};

// Marks data as belonging to this utility. Symbol.for keeps the mark stable
// across HMR module re-evaluations.
const DND_MARK = Symbol.for('svelai-dnd');
const DND_OWNER = Symbol.for('svelai-dnd-owner');

type DragLifecycle = {
	isCancelled: boolean;
	hasEnded: boolean;
	hasResolvedDrop: boolean;
	onEnd: (dropped: boolean) => void;
};
type ListDropOwner = {
	getOver: () => DndOver | null;
	clearDropState: () => void;
	applyDrop: (
		source: DragData,
		target: TargetData | ContainerData,
		overAtDrop: DndOver | null
	) => void;
};
type ItemData = DndSource & {
	[DND_MARK]: true;
	[DND_OWNER]: ListDropOwner;
	instance: symbol;
};
type DragData = ItemData & {
	autoScrollAxis: DndAutoScrollAxis;
	lifecycle: DragLifecycle;
};
type TargetData = ItemData & {
	edge: DndEdge;
	physicalEdge: DndEdge;
};
type ContainerData = {
	[DND_MARK]: true;
	[DND_OWNER]: ListDropOwner;
	instance: symbol;
	listId: string;
	container: true;
};
type DragCancellationSignal = Readonly<{
	instance: symbol;
	itemId: string;
	lifecycle: DragLifecycle;
}>;

const isMine = (data: Record<string | symbol, unknown>): boolean => data[DND_MARK] === true;
const isCancelled = (data: DragData): boolean => data.lifecycle.isCancelled;

const endDrag = (lifecycle: DragLifecycle, dropped: boolean): void => {
	if (lifecycle.hasEnded) return;
	lifecycle.hasEnded = true;
	lifecycle.onEnd(dropped);
};

const runDropSteps = (steps: ReadonlyArray<() => void>): void => {
	const errors: unknown[] = [];
	for (const step of steps) {
		try {
			step();
		} catch (error) {
			errors.push(error);
		}
	}
	if (errors.length === 1) throw errors[0];
	if (errors.length > 1) {
		throw new AggregateError(errors, 'Multiple drag-and-drop steps failed.');
	}
};

const executeCrossListDrop = (source: DragData, target: TargetData | ContainerData): void => {
	const lifecycle = source.lifecycle;
	if (lifecycle.hasResolvedDrop) return;
	lifecycle.hasResolvedDrop = true;

	const sourceOwner = source[DND_OWNER];
	const targetOwner = target[DND_OWNER];
	const destinationOver = targetOwner.getOver();
	runDropSteps([
		sourceOwner.clearDropState,
		targetOwner.clearDropState,
		() => sourceOwner.applyDrop(source, target, null),
		() => targetOwner.applyDrop(source, target, destinationOver),
		() => endDrag(lifecycle, true)
	]);
};

// getComputedStyle is a forced style resolution and this runs per dragover in
// the closest-edge hot path, so the answer is cached per element. Stale only
// if an element's direction flips at runtime, which we accept.
const rtlCache = new WeakMap<Element, boolean>();
const isRtl = (element: Element): boolean => {
	let value = rtlCache.get(element);
	if (value === undefined) {
		value = getComputedStyle(element).direction === 'rtl';
		rtlCache.set(element, value);
	}
	return value;
};

/**
 * Physical (visual) closest edge — which side of the element the pointer is on.
 */
const physicalClosestEdge = (
	element: Element,
	input: { clientX: number; clientY: number },
	axis: DndAxis
): DndEdge => {
	const rect = element.getBoundingClientRect();
	return axis === 'vertical'
		? input.clientY < rect.top + rect.height / 2
			? 'top'
			: 'bottom'
		: input.clientX < rect.left + rect.width / 2
			? 'left'
			: 'right';
};

/**
 * Logical edge for index math: in RTL horizontal lists the array runs
 * right-to-left, so the physical side flips ('left' of an item means AFTER it).
 * The indicator always draws at the physical side; the math always uses the
 * logical one.
 */
const toLogicalEdge = (physical: DndEdge, element: Element, axis: DndAxis): DndEdge => {
	if (axis !== 'horizontal' || !isRtl(element)) return physical;
	return physical === 'left' ? 'right' : physical === 'right' ? 'left' : physical;
};

// ---------------------------------------------------------------------------
// Drop indicator + default dragging style: one fixed-position line and one
// tiny stylesheet for the whole app, managed imperatively. Override via the
// [data-dnd-indicator] / [data-dnd-dragging] selectors.
// ---------------------------------------------------------------------------
let indicatorEl: HTMLElement | null = null;

// Injected once per document, from the list attachment — indicator-less
// (preview) lists need the data-dnd-dragging default and the empty-list tint
// too, not just lists that ever draw the line.
const ensureBaseStyles = () => {
	if (document.querySelector('style[data-dnd-styles]')) return;
	const style = document.createElement('style');
	style.setAttribute('data-dnd-styles', '');
	// The empty-list rule is wrapped in :where() (zero specificity) so any
	// consumer class on the container wins over the default tint.
	style.textContent =
		'[data-dnd-dragging]{opacity:.4;}' +
		':where([data-dnd-over="true"]:not(:has([data-dnd-item]))){' +
		'background-color:color-mix(in oklab, var(--color-primary, currentColor) 6%, transparent);}';
	document.head.appendChild(style);
};

const ensureIndicator = (): HTMLElement => {
	// Query the DOM (not just the module variable) so HMR re-evaluations reuse
	// the existing node instead of orphaning it.
	indicatorEl ??= document.querySelector<HTMLElement>('[data-dnd-indicator]');
	if (indicatorEl && indicatorEl.isConnected) return indicatorEl;
	indicatorEl = document.createElement('div');
	indicatorEl.setAttribute('data-dnd-indicator', '');
	Object.assign(indicatorEl.style, {
		position: 'fixed',
		zIndex: '2147483647',
		pointerEvents: 'none',
		background: 'var(--color-primary)',
		borderRadius: '9999px',
		display: 'none'
	});
	document.body.appendChild(indicatorEl);
	ensureBaseStyles();
	return indicatorEl;
};

const THICKNESS = 2;
const clippingAncestorsCache = new WeakMap<
	Element,
	{ horizontal: readonly Element[]; vertical: readonly Element[] }
>();

/** Where a gap-centered line goes: its cross-axis `center` plus the union
 * extent of the two rows flanking the gap, so hovering either side of the
 * same gap draws the exact same line (position AND length). */
type GapLine = { center: number; start: number; extent: number };

/**
 * Without `gap` the line hugs the hovered row's edge (terminal positions,
 * wrapped lines, anything the gap math can't vouch for).
 */
const showIndicator = (rect: DOMRect, edge: DndEdge, gap?: GapLine) => {
	const el = ensureIndicator();
	el.style.display = 'block';
	if (edge === 'top' || edge === 'bottom') {
		el.style.left = `${gap?.start ?? rect.left}px`;
		el.style.width = `${gap?.extent ?? rect.width}px`;
		el.style.height = `${THICKNESS}px`;
		el.style.top = `${(gap?.center ?? (edge === 'top' ? rect.top : rect.bottom)) - THICKNESS / 2}px`;
	} else {
		el.style.top = `${gap?.start ?? rect.top}px`;
		el.style.height = `${gap?.extent ?? rect.height}px`;
		el.style.width = `${THICKNESS}px`;
		el.style.left = `${(gap?.center ?? (edge === 'left' ? rect.left : rect.right)) - THICKNESS / 2}px`;
	}
};

const getClippedIndicatorLine = (
	element: Element,
	edge: DndEdge,
	elementRect: DOMRect,
	gap?: GapLine
): GapLine | null => {
	const isHorizontalLine = edge === 'top' || edge === 'bottom';
	const line =
		gap ??
		(isHorizontalLine
			? {
					center: edge === 'top' ? elementRect.top : elementRect.bottom,
					start: elementRect.left,
					extent: elementRect.width
				}
			: {
					center: edge === 'left' ? elementRect.left : elementRect.right,
					start: elementRect.top,
					extent: elementRect.height
				});
	let start = line.start;
	let end = line.start + line.extent;

	let clippingAncestors = clippingAncestorsCache.get(element);
	if (!clippingAncestors) {
		const horizontal: Element[] = [];
		const vertical: Element[] = [];
		for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
			const style = getComputedStyle(ancestor);
			if (/auto|clip|hidden|scroll|overlay/.test(style.overflowX)) horizontal.push(ancestor);
			if (/auto|clip|hidden|scroll|overlay/.test(style.overflowY)) vertical.push(ancestor);
		}
		clippingAncestors = { horizontal, vertical };
		clippingAncestorsCache.set(element, clippingAncestors);
	}

	for (const ancestor of isHorizontalLine
		? clippingAncestors.horizontal
		: clippingAncestors.vertical) {
		const rect = ancestor.getBoundingClientRect();
		const clipStart = isHorizontalLine ? rect.left : rect.top;
		const clipEnd = isHorizontalLine ? rect.right : rect.bottom;
		start = Math.max(start, clipStart);
		end = Math.min(end, clipEnd);
	}

	if (end <= start) return null;
	return {
		center: line.center,
		start,
		extent: end - start
	};
};

const hideIndicator = () => {
	if (indicatorEl) indicatorEl.style.display = 'none';
};

// ---------------------------------------------------------------------------
// Auto-scroll: Atlaskit scrolls the allowed axes near container edges. Browsers
// can independently scroll overflow containers during native drags, so the
// disallowed axis is also locked for the duration of the gesture. Registrations
// are refcounted so lists sharing one container never stack scroll speed.
// ---------------------------------------------------------------------------
const nearestScrollable = (el: Element): Element | null => {
	for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
		const style = getComputedStyle(node);
		if (/auto|scroll|overlay/.test(style.overflowY + style.overflowX)) return node;
	}
	return null;
};

const lockNativeScrollAxis = (listEl: Element, allowedAxis: DndAutoScrollAxis): (() => void) => {
	if (allowedAxis === 'all') return () => {};
	const scrollable = nearestScrollable(listEl);
	if (!(scrollable instanceof HTMLElement)) return () => {};

	const property = allowedAxis === 'horizontal' ? 'overflow-y' : 'overflow-x';
	const previousValue = scrollable.style.getPropertyValue(property);
	const previousPriority = scrollable.style.getPropertyPriority(property);
	scrollable.style.setProperty(property, 'hidden');

	return () => {
		if (previousValue) {
			scrollable.style.setProperty(property, previousValue, previousPriority);
			return;
		}
		scrollable.style.removeProperty(property);
	};
};

// Module-owned registry state is intentionally non-reactive; entries never drive rendering.
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const autoScrollRegistry = new Map<Element, { refs: number; cleanup: () => void }>();
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const dragCancellationListeners = new Set<(signal: DragCancellationSignal) => void>();

const notifyDragCancelled = (signal: DragCancellationSignal): void => {
	for (const listener of dragCancellationListeners) listener(signal);
};

const registerAutoScroll = (listEl: Element): (() => void) => {
	const scrollable = nearestScrollable(listEl);
	if (!scrollable) return () => {};
	let entry = autoScrollRegistry.get(scrollable);
	if (!entry) {
		entry = {
			refs: 0,
			cleanup: autoScrollForElements({
				element: scrollable,
				canScroll: ({ source }) => isMine(source.data) && !isCancelled(source.data as DragData),
				getAllowedAxis: ({ source }) =>
					isMine(source.data) ? (source.data as DragData).autoScrollAxis : 'all'
			})
		};
		autoScrollRegistry.set(scrollable, entry);
	}
	entry.refs += 1;
	return () => {
		entry.refs -= 1;
		if (entry.refs === 0) {
			entry.cleanup();
			autoScrollRegistry.delete(scrollable);
		}
	};
};

/**
 * List drag-and-drop as two attachments, built on Pragmatic drag and drop.
 *
 * ```svelte
 * const dnd = useDndList({ id: 'todo', items: () => items, onReorder: (next) => (items = next) });
 *
 * <ul {@attach dnd.list}>
 *   {#each items as item, index (item.id)}
 *     <li {@attach dnd.item(item, index)}>{item.title}</li>
 *   {/each}
 * </ul>
 * ```
 *
 * Cross-list moves: give each list its own `useDndList`, let the destination
 * opt in with `accepts`, insert in `onReceive`, and remove from the source in
 * `onRemove`. The drop indicator, edge math (RTL-aware), and no-op suppression
 * are handled internally.
 *
 * Scrolling: if the list (or an ancestor) is a scroll container, dragging near
 * its edges auto-scrolls it — the native drag gesture can't scroll overflow
 * containers on its own.
 *
 * Styling hooks: `data-dnd-dragging` on the dragged item (default 0.4 opacity
 * via an injected rule), `data-dnd-over` on a hovered container (an EMPTY
 * hovered list gets a default primary tint instead of an indicator line —
 * there is no index to point at; override via your own `data-dnd-over`
 * styles), `data-dnd-indicator` on the shared indicator line,
 * `data-dnd-handle` marks a drag handle when `handle` is set.
 */
export const useDndList = <T>(options: UseDndListOptions<T>) => {
	const listId = options.id;
	// Private identity: drop attribution compares tokens, never id strings, so
	// duplicate list ids across component instances cannot cross-talk.
	const token = Symbol(listId);
	const axis = (): DndAxis =>
		typeof options.axis === 'function' ? options.axis() : (options.axis ?? 'vertical');
	const autoScrollAxis = (): DndAutoScrollAxis =>
		typeof options.autoScrollAxis === 'function'
			? options.autoScrollAxis()
			: (options.autoScrollAxis ?? 'all');
	const getId = (item: T): string =>
		options.itemId ? options.itemId(item) : String((item as { id: string | number }).id);

	let activeDrag = $state.raw<Readonly<{
		id: string;
		item: T;
		lifecycle: DragLifecycle;
		element: Element;
	}> | null>(null);
	let isOver = $state(false);
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- mounted list elements only support cancellation cleanup
	const listElements = new Set<Element>();
	// Prospective drop position, kept fresh by the same handlers that draw the
	// indicator. Drop resolution reads it too, so a preview built from `over`
	// can never disagree with where the item actually lands.
	let over = $state.raw<DndOver | null>(null);
	const getIndicatorMode = (): DndIndicatorMode =>
		typeof options.indicator === 'function' ? options.indicator() : (options.indicator ?? true);
	const usesIndicatorFeedback = () => getIndicatorMode() !== false;
	const drawsSharedIndicator = () => getIndicatorMode() === true;
	// Identity-stable: dragover fires continuously — reassigning `over` per
	// event (even with the same index) would recompute every preview derived
	// from it and reconcile the DOM every frame.
	const setOver = (
		index: number,
		source: DragData,
		targetItemId: string | null = null,
		targetEdge: DndEdge | null = null
	) => {
		if (
			over &&
			over.index === index &&
			over.source.itemId === source.itemId &&
			over.targetItemId === targetItemId &&
			over.targetEdge === targetEdge
		) {
			return;
		}
		over = { index, source, targetItemId, targetEdge };
	};

	// The monitor is registered once per instance regardless of how many times
	// the list attachment runs (re-attach, transitions keeping old trees alive),
	// so a drop can never be double-applied.
	let monitorRefs = 0;
	let monitorCleanup: (() => void) | null = null;
	let nativeScrollUnlock: (() => void) | null = null;
	const clearCancelledHover = (signal: DragCancellationSignal): void => {
		const source = over?.source as DragData | undefined;
		if (
			!source ||
			source.instance !== signal.instance ||
			source.itemId !== signal.itemId ||
			source.lifecycle !== signal.lifecycle
		) {
			return;
		}
		isOver = false;
		over = null;
		for (const element of listElements) element.removeAttribute('data-dnd-over');
		hideIndicator();
	};
	const unlockNativeScroll = () => {
		nativeScrollUnlock?.();
		nativeScrollUnlock = null;
	};
	const clearDropState = () => {
		hideIndicator();
		unlockNativeScroll();
		isOver = false;
		over = null;
		activeDrag?.element.removeAttribute('data-dnd-dragging');
		activeDrag = null;
		for (const element of listElements) element.removeAttribute('data-dnd-over');
	};

	const canAccept = (data: Record<string | symbol, unknown>): boolean => {
		if (!isMine(data) || options.disabled?.()) return false;
		const source = data as DragData;
		if (isCancelled(source)) return false;
		if (source.instance === token) return true;
		return options.accepts?.(source) ?? false;
	};

	/** Same-list finish index for a drop on `index`/`edge`; null when a no-op. */
	const resolveReorder = (from: number, index: number, edge: DndEdge): number | null => {
		let to = index + (edge === 'bottom' || edge === 'right' ? 1 : 0);
		if (from < to) to -= 1;
		return to === from ? null : to;
	};

	/** Fresh index of the dragged item — drag-start indices go stale when the
	 * list changes mid-drag. */
	const freshIndex = (items: T[], itemId: string): number =>
		items.findIndex((candidate) => getId(candidate) === itemId);

	// Each monitor can see the whole private source/target ownership pair. The
	// first one resolves an external move as one transaction; later monitors
	// observe the completed lifecycle and do nothing.
	const handleDrop = ({
		source,
		location
	}: {
		source: { data: Record<string | symbol, unknown> };
		location: { current: { dropTargets: Array<{ data: Record<string | symbol, unknown> }> } };
	}) => {
		if (!isMine(source.data)) return;
		const src = source.data as DragData;
		if (isCancelled(src)) {
			if (src.instance === token) {
				clearDropState();
				endDrag(src.lifecycle, false);
			}
			return;
		}

		const target = location.current.dropTargets.find((t) => isMine(t.data));
		const targetData = target?.data as TargetData | ContainerData | undefined;
		if (targetData && src[DND_OWNER] !== targetData[DND_OWNER]) {
			executeCrossListDrop(src, targetData);
			return;
		}
		if (src.instance !== token) return;

		const overAtDrop = over;
		runDropSteps([
			clearDropState,
			() => {
				if (targetData) applyDrop(src, targetData, overAtDrop);
			},
			() => endDrag(src.lifecycle, targetData !== undefined)
		]);
	};
	const handleMonitorDrop: typeof handleDrop = (event) => {
		try {
			handleDrop(event);
		} catch (error) {
			// Pragmatic DnD must finish its synchronous lifecycle before a
			// consumer callback error returns to the host environment.
			queueMicrotask(() => {
				throw error;
			});
		}
	};

	const applyDrop = (
		src: DragData,
		targetData: TargetData | ContainerData,
		overAtDrop: DndOver | null
	) => {
		if (src.instance !== token && targetData.instance !== token) return;

		const items = options.items();

		if (targetData.instance === token) {
			// Dropped into this list — either a reorder or a receive. `over` is
			// the source of truth when present (it is exactly what any preview
			// showed); the geometric fallback covers drops without a prior
			// enter (defensive).
			if (src.instance === token) {
				const from = freshIndex(items, src.itemId);
				if (from === -1) return;
				let finish: number | null;
				if (overAtDrop) {
					finish = Math.min(overAtDrop.index, items.length - 1);
				} else if ('container' in targetData) {
					finish = resolveReorder(from, items.length - 1, 'bottom');
				} else {
					const targetIndex = freshIndex(items, (targetData as TargetData).itemId);
					if (targetIndex === -1) return;
					finish = resolveReorder(from, targetIndex, (targetData as TargetData).edge);
				}
				if (finish === null || finish === from) return;
				const next = reorder({ list: [...items], startIndex: from, finishIndex: finish });
				let targetItemId = overAtDrop?.targetItemId ?? null;
				let targetEdge = overAtDrop?.targetEdge ?? null;
				if (!overAtDrop && !('container' in targetData)) {
					targetItemId = targetData.itemId;
					targetEdge = targetData.edge;
				}
				options.onReorder?.(next, {
					item: items[from],
					from,
					to: finish,
					targetItemId,
					targetEdge
				});
			} else {
				let to: number;
				if (overAtDrop) {
					to = Math.min(overAtDrop.index, items.length);
				} else if ('container' in targetData) {
					to = items.length;
				} else {
					const targetIndex = freshIndex(items, (targetData as TargetData).itemId);
					if (targetIndex === -1) return;
					const edge = (targetData as TargetData).edge;
					to = Math.min(
						targetIndex + (edge === 'bottom' || edge === 'right' ? 1 : 0),
						items.length
					);
				}
				options.onReceive?.({ item: src.item, index: to, from: src });
			}
		} else if (src.instance === token) {
			// One of ours landed somewhere else.
			const index = freshIndex(items, src.itemId);
			if (index === -1) return;
			options.onRemove?.({ item: items[index], index, to: { listId: targetData.listId } });
		}
	};

	const owner: ListDropOwner = {
		getOver: () => over,
		clearDropState,
		applyDrop
	};

	/** Attachment for the list container (drop zone + central monitor). */
	const list: Attachment = (element) => {
		element.setAttribute('data-dnd-list', listId);
		listElements.add(element);
		ensureBaseStyles();

		/** Rows belonging to THIS list only — nested lists' rows don't count. */
		const ownRows = () =>
			[...element.querySelectorAll('[data-dnd-item]')].filter(
				(row) => row.closest('[data-dnd-list]') === element
			);

		const terminalEdge = (): DndEdge => {
			if (axis() === 'vertical') return 'bottom';
			return isRtl(element) ? 'left' : 'right';
		};

		const terminalIndicator = () => {
			const rows = ownRows();
			const last = rows[rows.length - 1];
			if (last) {
				const edge = terminalEdge();
				const rect = last.getBoundingClientRect();
				const line = getClippedIndicatorLine(last, edge, rect);
				if (line) showIndicator(rect, edge, line);
				else hideIndicator();
			} else {
				// Empty list: there is no index to point at, so no line — the
				// container itself signals via [data-dnd-over] (default tint from
				// the injected stylesheet, override with your own styles).
				hideIndicator();
			}
		};

		const drawContainerIndicator = (
			location: { current: { dropTargets: Array<{ element: Element }> } },
			source: { data: Record<string | symbol, unknown> }
		) => {
			// Only when hovering the container's own empty space — when an item
			// is the innermost target (sticky ones included), the item owns the
			// indicator.
			if (location.current.dropTargets[0]?.element !== element) return;
			const drawEnabled = drawsSharedIndicator();
			if (!drawEnabled) hideIndicator();
			const src = source.data as DragData;
			const items = options.items();
			if (src.instance === token) {
				const from = freshIndex(items, src.itemId);
				if (from !== -1) {
					const finish = resolveReorder(from, items.length - 1, 'bottom');
					// Terminal drop that would change nothing: the item stays
					// (previews show it at its own position), no indicator.
					if (finish === null) {
						setOver(from, src);
						if (drawEnabled) hideIndicator();
						return;
					}
					setOver(finish, src);
				}
			} else {
				setOver(items.length, src);
			}
			if (drawEnabled) terminalIndicator();
		};

		if (monitorRefs === 0) {
			monitorCleanup = monitorForElements({
				canMonitor: ({ source }) => isMine(source.data),
				onDrop: handleMonitorDrop
			});
			dragCancellationListeners.add(clearCancelledHover);
		}
		monitorRefs += 1;

		const unregisterAutoScroll = registerAutoScroll(element);

		const cleanup = combine(
			dropTargetForElements({
				element: element as HTMLElement,
				canDrop: ({ source }) => canAccept(source.data),
				// Sticky container: overshooting the list bounds by a few pixels
				// keeps the whole target chain (and `over`) alive — the preview
				// stays at the last position and the drop still lands there.
				// The chain hands over as soon as another drop target is entered;
				// onDragLeave then fires and clears the state.
				getIsSticky: () => true,
				getData: (): ContainerData => ({
					[DND_MARK]: true,
					[DND_OWNER]: owner,
					instance: token,
					listId,
					container: true
				}),
				// onDrag is rAF-throttled; onDragEnter dispatches synchronously at
				// target change — drawing in both keeps the indicator immediate.
				onDragEnter: ({ location, source }) => {
					isOver = true;
					element.setAttribute('data-dnd-over', 'true');
					drawContainerIndicator(location, source);
				},
				onDrag: ({ location, source }) => {
					drawContainerIndicator(location, source);
				},
				onDragLeave: () => {
					isOver = false;
					over = null;
					element.removeAttribute('data-dnd-over');
					hideIndicator();
				},
				onDrop: () => {
					isOver = false;
					element.removeAttribute('data-dnd-over');
				}
			})
		);

		return () => {
			cleanup();
			unregisterAutoScroll();
			unlockNativeScroll();
			monitorRefs -= 1;
			const isLastList = monitorRefs === 0;
			if (isLastList) {
				monitorCleanup?.();
				monitorCleanup = null;
				dragCancellationListeners.delete(clearCancelledHover);
			}
			listElements.delete(element);
			// A list unmounting mid-drag must not strand the shared indicator.
			hideIndicator();
			element.removeAttribute('data-dnd-over');
			element.removeAttribute('data-dnd-list');
			if (isLastList) cancelActiveDrag(true);
		};
	};

	/** Attachment for one list item. The index parameter is optional and
	 * unused — indices are resolved fresh at event time, so the attachment
	 * identity never depends on a position that shifts mid-drag (re-running
	 * attachments during a drag is supported but wasteful). */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- keeps the documented call signature
	const item = (itemData: T, _index?: number): Attachment => {
		return (element) => {
			const id = getId(itemData);
			element.setAttribute('data-dnd-item', id);

			const itemPayload = (): ItemData => ({
				[DND_MARK]: true,
				[DND_OWNER]: owner,
				instance: token,
				listId,
				itemId: id,
				index: freshIndex(options.items(), id),
				item: itemData
			});
			const dragPayload = (): DragData => ({
				...itemPayload(),
				autoScrollAxis: autoScrollAxis(),
				lifecycle: {
					isCancelled: false,
					hasEnded: false,
					hasResolvedDrop: false,
					onEnd: (dropped) => options.onDragEnd?.({ item: itemData, dropped })
				}
			});

			const drawItemIndicator = ({
				self,
				source,
				location
			}: {
				self: { data: Record<string | symbol, unknown> };
				source: { data: Record<string | symbol, unknown> };
				location: { current: { dropTargets: Array<{ element: Element }> } };
			}) => {
				// Only the innermost target draws — nested accepted lists would
				// otherwise overdraw the inner indicator with the outer row's.
				if (location.current.dropTargets[0]?.element !== element) return;
				const drawEnabled = drawsSharedIndicator();
				const indicatorFeedback = usesIndicatorFeedback();
				if (!drawEnabled) hideIndicator();
				const src = source.data as DragData;
				const data = self.data as TargetData;
				const items = options.items();
				// The dragged row itself: no indicator. In a live preview
				// (indicator off) this row is the placeholder sitting at `over`,
				// so hovering it must preserve `over` — moving anything would
				// make the placeholder flee the pointer. In indicator mode the
				// row sits at its ORIGINAL index, so `over` must reset to it:
				// dropping on your own row is a no-op, and a stale `over` from
				// an earlier hover must not silently reorder.
				if (src.instance === token && src.itemId === id) {
					if (indicatorFeedback || !over) {
						const from = freshIndex(items, src.itemId);
						if (from !== -1) setOver(from, src, id, data.edge);
					}
					if (drawEnabled) hideIndicator();
					return;
				}
				if (src.instance === token) {
					const from = freshIndex(items, src.itemId);
					const targetIndex = freshIndex(items, id);
					if (from === -1 || targetIndex === -1) return;
					const finish = resolveReorder(from, targetIndex, data.edge);
					// A drop that would put the item right back where it is:
					// preview shows it at its own position, no indicator.
					if (finish === null) {
						setOver(from, src, id, data.edge);
						if (drawEnabled) hideIndicator();
						return;
					}
					setOver(finish, src, id, data.edge);
				} else {
					const targetIndex = freshIndex(items, id);
					if (targetIndex !== -1) {
						setOver(
							Math.min(
								targetIndex + (data.edge === 'bottom' || data.edge === 'right' ? 1 : 0),
								items.length
							),
							src,
							id,
							data.edge
						);
					}
				}
				if (drawEnabled) {
					const gap = gapCenter(data.edge);
					const rect = element.getBoundingClientRect();
					const line = getClippedIndicatorLine(element, data.physicalEdge, rect, gap);
					if (line) showIndicator(rect, data.physicalEdge, line);
					else hideIndicator();
				}
			};

			/**
			 * The gap line between this row and its neighbor on the given logical
			 * side. Hovering the bottom half of row A and the top half of row B
			 * resolve to the same drop index, so they must draw the same line —
			 * centered in the gap, spanning the union of both rows — instead of
			 * hugging whichever row is hovered. Undefined (edge fallback) when
			 * there is no neighbor or the two rows aren't cleanly facing each
			 * other across a gap (wrapped line, overlap).
			 */
			const gapCenter = (edge: DndEdge): GapLine | undefined => {
				const items = options.items();
				const targetIndex = freshIndex(items, id);
				if (targetIndex === -1) return undefined;
				const neighborItem = items[targetIndex + (edge === 'top' || edge === 'left' ? -1 : 1)];
				if (neighborItem === undefined) return undefined;
				const listEl = element.closest('[data-dnd-list]');
				if (!listEl) return undefined;
				// Scoped like ownRows(): nested lists may hold rows with the same
				// id, and a first-match query would find those and bail.
				const neighbor = [
					...listEl.querySelectorAll(`[data-dnd-item="${CSS.escape(getId(neighborItem))}"]`)
				].find((row) => row.closest('[data-dnd-list]') === listEl);
				if (!neighbor) return undefined;
				const a = element.getBoundingClientRect();
				const b = neighbor.getBoundingClientRect();
				// The axis comes from the edge, not axis(): a sticky target keeps
				// its frozen edge across a reactive axis flip mid-drag, and the
				// draw must stay consistent with that frozen edge.
				if (edge === 'top' || edge === 'bottom') {
					// Facing rows must share most of their cross-axis range —
					// wrapped lines that overlap a little (negative margins) would
					// otherwise midpoint to a spot far from both rows.
					const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
					if (overlap < Math.min(a.width, b.width) / 2) return undefined;
					const [upper, lower] = a.top <= b.top ? [a, b] : [b, a];
					if (lower.top < upper.bottom) return undefined;
					const start = Math.min(a.left, b.left);
					return {
						center: (upper.bottom + lower.top) / 2,
						start,
						extent: Math.max(a.right, b.right) - start
					};
				}
				const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
				if (overlap < Math.min(a.height, b.height) / 2) return undefined;
				const [before, after] = a.left <= b.left ? [a, b] : [b, a];
				if (after.left < before.right) return undefined;
				const start = Math.min(a.top, b.top);
				return {
					center: (before.right + after.left) / 2,
					start,
					extent: Math.max(a.bottom, b.bottom) - start
				};
			};

			const cleanup = combine(
				draggable({
					element: element as HTMLElement,
					// Evaluated per drag attempt: disabling mid-drag stays safe (the
					// registration lives on, pragmatic's supported path), and handles
					// are resolved fresh so late-rendered handles work.
					canDrag: ({ input }) => {
						if (options.disabled?.()) return false;
						if (options.canDrag && !options.canDrag(itemData)) return false;
						const handleOn =
							typeof options.handle === 'function' ? options.handle() : options.handle;
						if (!handleOn) return true;
						const handle = element.querySelector('[data-dnd-handle]');
						const grabbed = document.elementFromPoint(input.clientX, input.clientY);
						return !!handle && !!grabbed && handle.contains(grabbed);
					},
					getInitialData: () => dragPayload(),
					onGenerateDragPreview: ({ nativeSetDragImage }) => {
						// A compact clone pushed in front of the pointer: the default
						// snapshot sits centered under the cursor and hides the drop
						// position. Width capped at 280px — beyond that Windows dims the
						// preview (and it obscures the board). No CSS transform: Safari
						// can't snapshot transformed previews.
						const rect = element.getBoundingClientRect();
						setCustomNativeDragPreview({
							nativeSetDragImage,
							getOffset: pointerOutsideOfPreview({ x: '12px', y: '8px' }),
							render: ({ container }) => {
								const clone = element.cloneNode(true) as HTMLElement;
								Object.assign(clone.style, {
									position: 'relative',
									inset: 'auto',
									transform: 'none',
									width: `${Math.min(rect.width, 280)}px`,
									height: `${rect.height}px`,
									boxSizing: 'border-box',
									margin: '0',
									overflow: 'hidden',
									pointerEvents: 'none'
								});
								container.appendChild(clone);
							}
						});
					},
					onDragStart: ({ source }) => {
						const dragData = source.data as DragData;
						activeDrag = { id, item: itemData, lifecycle: dragData.lifecycle, element };
						unlockNativeScroll();
						nativeScrollUnlock = lockNativeScrollAxis(element, autoScrollAxis());
						clippingAncestorsCache.delete(element);
						// Seed the hover state at the item's own position so a live
						// preview renders unchanged in the same flush (no flash of
						// the row collapsing before the placeholder appears).
						const from = freshIndex(options.items(), id);
						if (from !== -1) setOver(from, dragData);
						element.setAttribute('data-dnd-dragging', 'true');
						options.onDragStart?.({ item: itemData, index: from });
					},
					onDrop: () => {
						unlockNativeScroll();
						if (activeDrag?.id === id) activeDrag = null;
						element.removeAttribute('data-dnd-dragging');
					}
				}),
				dropTargetForElements({
					element: element as HTMLElement,
					canDrop: ({ source }) => canAccept(source.data),
					getIsSticky: () => true,
					getData: ({ input }): TargetData => {
						const physical = physicalClosestEdge(element, input, axis());
						return {
							...itemPayload(),
							edge: toLogicalEdge(physical, element, axis()),
							physicalEdge: physical
						};
					},
					// onDrag is rAF-throttled; onDragEnter dispatches synchronously at
					// target change — drawing in both keeps the indicator immediate.
					onDragEnter: (args) => {
						clippingAncestorsCache.delete(element);
						drawItemIndicator(args);
					},
					onDrag: (args) => drawItemIndicator(args),
					onDragLeave: () => {
						hideIndicator();
					}
				})
			);

			return () => {
				cleanup();
				if (activeDrag?.id === id) unlockNativeScroll();
				clippingAncestorsCache.delete(element);
				element.removeAttribute('data-dnd-item');
				element.removeAttribute('data-dnd-dragging');
			};
		};
	};

	const cancelActiveDrag = (finalize: boolean): boolean => {
		const drag = activeDrag;
		if (!drag) return false;
		const wasCancelled = drag.lifecycle.isCancelled;
		if (!wasCancelled) {
			drag.lifecycle.isCancelled = true;
			notifyDragCancelled({ instance: token, itemId: drag.id, lifecycle: drag.lifecycle });
			activeDrag = { ...drag };
		}
		drag.element.removeAttribute('data-dnd-dragging');
		drag.element.closest('[data-dnd-list]')?.removeAttribute('data-dnd-over');
		over = null;
		isOver = false;
		hideIndicator();
		unlockNativeScroll();
		if (finalize) {
			activeDrag = null;
			endDrag(drag.lifecycle, false);
		}
		return !wasCancelled || finalize;
	};
	const cancel = (): boolean => cancelActiveDrag(false);

	return {
		/** Attach to the list container element. */
		list,
		/** Attach to each item element: `{@attach dnd.item(item, index)}`. */
		item,
		/** Cancel the current logical drag and reject its later native drop. */
		cancel,
		/** Id of the item currently dragged from this list, or null. */
		get dragging() {
			return activeDrag && !activeDrag.lifecycle.isCancelled ? activeDrag.id : null;
		},
		/** True while an accepted drag hovers this list. */
		get isOver() {
			return isOver;
		},
		/**
		 * Where the dragged item would land if dropped now, or null. Drives
		 * live-preview rendering (with `indicator: false`): remove the dragged
		 * item from your items, insert `over.source.item` at `over.index`, and
		 * render that — drop resolution uses the same value, so the preview and
		 * the actual drop always agree.
		 */
		get over() {
			return over;
		}
	};
};
