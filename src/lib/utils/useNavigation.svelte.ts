/* eslint-disable svelte/prefer-svelte-reactivity -- the item registry and its index are DOM bookkeeping, not reactive state; `revision` publishes their changes. */
import { useKeyDown } from './useKeyDown.svelte.js';
import { on } from 'svelte/events';
import { onDestroy, untrack } from 'svelte';
import { usePointerDown } from './usePointerDown.svelte.js';
import { useDirection } from './useDirection.svelte.js';
import { createTypeahead, isTextEntry } from './typeahead.js';
import { createId } from './id.js';
import { prefersReducedMotion } from './motion.svelte.js';
import { clampRovingKey, createRovingRestoreVersion } from './useRovingRegistry.svelte.js';

/**
 * The axis the arrow keys move along. `both` (radio groups) moves with all four arrows: Right and
 * Down go to the next item, Left and Up to the previous one.
 */
export type NavigationOrientation = 'horizontal' | 'vertical' | 'both';

type NavigationOptions = {
	enabled?: () => boolean;
	orientation?: NavigationOrientation | (() => NavigationOrientation);
	loop?: boolean;
	id?: string;
	enableHoverFocus?: boolean;
	/** The highlighted item changed: keyboard focus, a pointer highlight or a programmatic move. */
	onChange?: (index: number | null) => void;
	/**
	 * Fired only when a key (an arrow, Home, End or type-ahead) moves focus to another item; never
	 * on Tab, a click, a programmatic move or the restore after a removal. Groups where selection
	 * follows the keyboard (radio groups) select from here.
	 */
	onKeyboardMove?: (index: number) => void;
	defaultFocusedIndex?: () => number | null;
	preventKeyboardDefault?: boolean;
	/**
	 * Combobox-style navigation: keep DOM focus where it is (e.g. a search input) and
	 * only move the visual highlight + aria-activedescendant. Items never receive
	 * roving tabindex or DOM focus.
	 */
	virtualFocus?: boolean;
	/**
	 * Swap ArrowLeft/ArrowRight in right-to-left contexts: they move between items of a horizontal
	 * list, and in a vertical list ArrowLeft opens a level (`onNext`) and ArrowRight leaves it
	 * (`onPrevious`). Default `true`; direction comes from the i18n context, then the container's
	 * computed style.
	 */
	rtl?: boolean;
	/**
	 * Type-to-focus: printable keys move focus to the next item whose text starts with the
	 * typed buffer. `true` reads `data-typeahead` then the item's text content.
	 */
	typeahead?: boolean | { getText: (item: HTMLElement) => string };
	/**
	 * The container is never a Tab stop: the roving tab stop sits on one item. By default it gets
	 * `tabindex="-1"` so a popup can focus it and name the highlighted item through
	 * `aria-activedescendant`; `false` leaves it unfocusable (radio groups).
	 */
	focusableContainer?: boolean;
	/**
	 * Items marked `aria-disabled` or `data-disabled` stay in the arrow-key order and can hold the
	 * tab stop (the APG pattern for disabled menu items and toolbar buttons). They are still never
	 * activated. Natively `disabled` items are always skipped. Default `false`.
	 */
	disabledItemsFocusable?: boolean;
	/** `false` is the toolbar spelling of `disabledItemsFocusable: true`. Default `true`. */
	skipDisabled?: boolean;
};

/**
 * Set on an item node by consumers whose rows open (`onNext`) or leave (`onPrevious`) a level.
 * Returning `false` means the row had no level to open or leave, so the key stays unhandled.
 */
type LevelHandlers = { onNext?: () => boolean | void; onPrevious?: () => boolean | void };

// Every live navigation container, so a list ignores keys that a list nested inside it owns.
const containers = new WeakSet<Element>();

const byDocumentPosition = (a: HTMLElement, b: HTMLElement) => {
	const position = a.compareDocumentPosition(b);
	if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
	if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
	return 0;
};

// A keyed reorder moves nodes: each moved node is removed and added again in one batch.
const hasMovedNode = (records: MutationRecord[]) => {
	const removed = new Set<Node>();
	for (const record of records) record.removedNodes.forEach((node) => removed.add(node));
	if (removed.size === 0) return false;
	return records.some((record) => Array.from(record.addedNodes).some((node) => removed.has(node)));
};

/** An attribute record whose attribute holds the value it had before the write. */
const isUnchangedAttribute = (record: MutationRecord) =>
	record.type === 'attributes' &&
	record.attributeName !== null &&
	record.target instanceof Element &&
	record.oldValue === record.target.getAttribute(record.attributeName);

/** Writes an attribute only when its value differs, so unchanged items cost a read, not a write. */
const setAttribute = (node: Element, name: string, value: string) => {
	if (node.getAttribute(name) !== value) node.setAttribute(name, value);
};

const removeAttribute = (node: Element, name: string) => {
	if (node.hasAttribute(name)) node.removeAttribute(name);
};

// The caret sits at the start or end of a field with nothing selected, so an arrow pointing past
// that edge has no text left to move through.
const isCaretAtEdge = (event: KeyboardEvent, edge: 'start' | 'end') => {
	if (event.shiftKey) return false; // Shift+arrow extends a selection.
	const field = event.target;
	if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
		const { selectionStart, selectionEnd, value } = field;
		// Fields without a caret API (number, date) keep their arrows.
		if (selectionStart === null || selectionEnd === null || selectionStart !== selectionEnd) {
			return false;
		}
		return edge === 'start' ? selectionStart === 0 : selectionEnd === value.length;
	}
	if (!(field instanceof HTMLElement)) return false;
	const selection = field.ownerDocument.getSelection();
	if (!selection?.isCollapsed || selection.rangeCount === 0) return false;
	const caret = selection.getRangeAt(0);
	const rest = field.ownerDocument.createRange();
	rest.selectNodeContents(field);
	if (edge === 'start') rest.setEnd(caret.startContainer, caret.startOffset);
	else rest.setStart(caret.endContainer, caret.endOffset);
	return rest.toString().length === 0;
};

export const useNavigation = (opts: NavigationOptions) => {
	// The registered items in document order, and each one's position in that order. Mounting
	// registers in document order, so registration appends; a registration out of order or a node
	// moved inside the container marks the order stale, and the next read checks it with one pass
	// over adjacent pairs, sorting only when that pass finds a pair out of order.
	const registered: HTMLElement[] = [];
	const positions = new Map<HTMLElement, number>();
	let orderStale = false;
	let positionsStale = false;
	// Bumped whenever membership, order or an item's disabled/hidden state changes; every
	// reactive read of the list (the focused index, the attribute sync) depends on it.
	let revision = $state(0);
	let sequence = 0;

	let containerRef: HTMLElement | null = $state(null);
	// The highlighted item: it has DOM focus, or the pointer rests on it, or it is the item the
	// container's aria-activedescendant names. Tracked by element, so it survives insertions,
	// removals and reorders around it.
	let focusedItem = $state.raw<HTMLElement | null>(null);
	// Focus sits on the container itself with no item highlighted (a popup opened by pointer).
	let containerHighlighted = $state(false);
	let lastFocusedItem = $state.raw<HTMLElement | null>(null);
	let focusSource = $state<'keyboard' | 'pointer' | null>(null);
	let isHovering = $state(false);
	let isFocused = $state(false);
	// The item that holds DOM focus, or held it when focus was lost to nothing during this task
	// (the item was removed). Not reactive: only the removal of that item reads it.
	let focusHolder: HTMLElement | null = null;
	const restoreVersion = createRovingRestoreVersion();

	// The attributes this list last wrote, so a highlight move rewrites only the items it leaves
	// and enters (at most four attribute writes) instead of every item.
	let appliedTabStop: HTMLElement | null = null;
	let appliedHighlight: HTMLElement | null = null;

	// Enabled by default — `enabled` is an opt-out, checked at event time so it stays reactive.
	const isEnabled = () => (opts.enabled ? opts.enabled() : true);
	const keepsDisabledItems = () =>
		opts.disabledItemsFocusable === true || opts.skipDisabled === false;

	// Generate ID if not provided
	const baseId = opts.id ?? createId('nav');

	const getDirection = useDirection(() => containerRef);

	// Get current orientation
	const getOrientation = (): NavigationOrientation => {
		if (typeof opts.orientation === 'function') {
			return opts.orientation();
		}
		return opts.orientation || 'horizontal';
	};

	/** The registered items in document order. */
	const ordered = () => {
		if (orderStale) {
			orderStale = false;
			for (let index = 1; index < registered.length; index += 1) {
				if (byDocumentPosition(registered[index - 1], registered[index]) > 0) {
					registered.sort(byDocumentPosition);
					positionsStale = true;
					break;
				}
			}
		}
		if (positionsStale) {
			positionsStale = false;
			registered.forEach((item, index) => positions.set(item, index));
		}
		return registered;
	};

	const indexOf = (item: HTMLElement | null) => {
		if (!item) return -1;
		ordered();
		return positions.get(item) ?? -1;
	};

	// Natively disabled items (a `disabled` attribute, or inside a disabled fieldset) can never
	// take focus, so they are never targets.
	const isNativelyDisabled = (item: HTMLElement) =>
		item.hasAttribute('disabled') || item.matches(':disabled');

	// Announced as disabled while still able to take focus.
	const isSoftDisabled = (item: HTMLElement) => {
		const dataDisabled = item.getAttribute('data-disabled');
		return (
			item.getAttribute('aria-disabled') === 'true' ||
			(dataDisabled !== null && dataDisabled !== 'false')
		);
	};

	/** Never activated: natively disabled, aria-disabled or data-disabled. */
	const isItemDisabled = (item: HTMLElement) => isNativelyDisabled(item) || isSoftDisabled(item);

	/** Cannot hold focus or the tab stop. */
	const isUnfocusable = (item: HTMLElement) =>
		isNativelyDisabled(item) || (!keepsDisabledItems() && isSoftDisabled(item));

	// CSS-hidden items (`display: none`, a hidden ancestor, inert content) have no box to focus.
	const isRendered = (item: HTMLElement) =>
		item.getClientRects().length > 0 && !item.closest('[inert]');

	/** A target for arrow keys, Home/End and type-ahead. */
	const isNavigable = (item: HTMLElement) => !isUnfocusable(item) && isRendered(item);

	// The registered item that is or contains `node`; the container itself is no item.
	const itemOf = (node: unknown): HTMLElement | null => {
		let element = node instanceof Element ? node : node instanceof Node ? node.parentElement : null;
		while (element && element !== containerRef) {
			if (element instanceof HTMLElement && positions.has(element)) return element;
			element = element.parentElement;
		}
		return null;
	};

	const itemIndexOf = (node: unknown) => indexOf(itemOf(node));

	// A key typed inside a navigation list nested in this one belongs to that list.
	const ownsKeyTarget = (target: EventTarget | null) => {
		for (
			let element = target instanceof Element ? target : null;
			element && element !== containerRef;
			element = element.parentElement
		) {
			if (containers.has(element)) return false;
		}
		return true;
	};

	// The first navigable item from the start (1) or the end (-1). When nothing is rendered yet
	// (the list sits in a hidden panel), the first item that can take focus once it shows.
	const findEdge = (direction: 1 | -1): number => {
		const items = ordered();
		let fallback = -1;
		for (let step = 0; step < items.length; step += 1) {
			const index = direction === 1 ? step : items.length - 1 - step;
			if (isUnfocusable(items[index])) continue;
			if (isRendered(items[index])) return index;
			if (fallback === -1) fallback = index;
		}
		return fallback;
	};

	// The next navigable item after `from` in `direction`, or -1 when there is none (the end of a
	// list that does not loop). `from: null` enters the list at the edge the key points away from.
	const findFrom = (from: number | null, direction: 1 | -1): number => {
		if (from === null) return findEdge(direction);
		const items = ordered();
		const { loop = true } = opts;
		for (let distance = 1; distance <= items.length; distance += 1) {
			let index = from + direction * distance;
			if (loop) {
				index = ((index % items.length) + items.length) % items.length;
			} else if (index < 0 || index >= items.length) {
				return -1;
			}
			if (isNavigable(items[index])) return index;
		}
		return -1;
	};

	// The single item reachable with Tab: the highlighted item when there is one, otherwise the
	// default/active item, otherwise the first navigable one. This makes Tab land on the
	// meaningful item WITHOUT any element being DOM-focused on mount (which would flash a focus
	// ring). Virtual focus keeps every item out of the tab order.
	const resolveTabStop = (): HTMLElement | null => {
		if (opts.virtualFocus) return null;
		if (focusedItem && !isUnfocusable(focusedItem)) return focusedItem;
		const items = ordered();
		const preferredIndex = opts.defaultFocusedIndex?.();
		const preferred = preferredIndex == null ? undefined : items[preferredIndex];
		if (preferred && isNavigable(preferred)) return preferred;
		const edge = findEdge(1);
		if (edge !== -1 && isRendered(items[edge])) return items[edge];
		// Nothing is rendered yet: keep the stop where it belongs once the list shows.
		if (preferred && !isUnfocusable(preferred)) return preferred;
		return items[edge] ?? null;
	};

	/**
	 * Brings `tabindex`, `data-highlighted` and the container's `aria-activedescendant` in line
	 * with the highlighted item and the tab stop, touching only the items that changed role.
	 */
	const sync = () => {
		const tabStop = resolveTabStop();
		if (appliedTabStop && appliedTabStop !== tabStop && positions.has(appliedTabStop)) {
			setAttribute(appliedTabStop, 'tabindex', '-1');
		}
		if (tabStop) setAttribute(tabStop, 'tabindex', '0');
		appliedTabStop = tabStop;

		const highlight = focusedItem;
		if (appliedHighlight && appliedHighlight !== highlight) {
			removeAttribute(appliedHighlight, 'data-highlighted');
		}
		if (highlight) setAttribute(highlight, 'data-highlighted', 'true');
		appliedHighlight = highlight;

		if (!containerRef) return;
		if (highlight?.id) setAttribute(containerRef, 'aria-activedescendant', highlight.id);
		else removeAttribute(containerRef, 'aria-activedescendant');
	};

	const setFocused = (item: HTMLElement | null, source: 'keyboard' | 'pointer' | null) => {
		focusedItem = item;
		focusSource = item ? source : null;
		containerHighlighted = false;
		if (item) lastFocusedItem = item;
	};

	const typeahead = opts.typeahead
		? createTypeahead<HTMLElement>({
				getItems: ordered,
				getText: (item) =>
					typeof opts.typeahead === 'object'
						? opts.typeahead.getText(item)
						: (item.dataset.typeahead ?? item.textContent ?? ''),
				// Search from the focused item, not from the one the pointer highlighted.
				getCurrentIndex: () => {
					const focused = itemIndexOf(document.activeElement);
					return focused !== -1 ? focused : indexOf(focusedItem);
				},
				isItemDisabled: (item) => !isNavigable(item),
				onMatch: (index) => {
					const focused = itemIndexOf(document.activeElement);
					moveFocusTo(index, focused !== -1 ? focused : indexOf(focusedItem));
				}
			})
		: null;

	// The focused element, not its index, is what a change reports: an insertion before it moves
	// its index without changing what has focus.
	$effect(() => {
		const item = focusedItem;
		if (!item) return;
		untrack(() => {
			const index = indexOf(item);
			if (index !== -1) opts.onChange?.(index);
		});
	});

	// Plain functions, not deriveds: a menu switch reads these from sync() while the previous
	// menu's effects are being destroyed, and reading a derived owned by a destroyed effect warns
	// (derived_inert) and may return a stale value. They still track `revision` and the focus
	// state for any reactive caller.
	const readFocusedIndex = () => {
		void revision;
		if (focusedItem) {
			const index = indexOf(focusedItem);
			return index === -1 ? null : index;
		}
		return containerHighlighted ? -1 : null;
	};

	const readLastFocusedIndex = () => {
		void revision;
		const index = indexOf(lastFocusedItem);
		return index === -1 ? null : index;
	};

	let observer: MutationObserver | null = null;

	// A class, style or media-query change can hide an item without touching any watched
	// attribute. Hiding collapses its box, which a ResizeObserver reports; the tab stop then
	// moves to an item that is still rendered. The first report of an item always counts, since an
	// item hidden at mount reports nothing until it shows.
	const renderedItems = new WeakMap<Element, boolean>();
	let resizeObserver: ResizeObserver | null = null;
	const watchRendered = (node: HTMLElement) => {
		if (typeof ResizeObserver === 'undefined') return;
		resizeObserver ??= new ResizeObserver((entries) => {
			let changed = false;
			for (const { target } of entries) {
				if (!(target instanceof HTMLElement) || !positions.has(target)) continue;
				const rendered = target.getClientRects().length > 0;
				if (renderedItems.get(target) !== rendered) changed = true;
				renderedItems.set(target, rendered);
			}
			if (changed) revision += 1;
		});
		resizeObserver.observe(node);
	};

	const cleanUp = () => {
		registered.length = 0;
		positions.clear();
		observer?.disconnect();
		observer = null;
		resizeObserver?.disconnect();
		resizeObserver = null;
		typeahead?.reset();
		restoreVersion.bump();
		containerRef = null;
		focusedItem = null;
		focusSource = null;
		containerHighlighted = false;
		isHovering = false;
		isFocused = false;
		lastFocusedItem = null;
		focusHolder = null;
		appliedTabStop = null;
		appliedHighlight = null;
	};

	onDestroy(() => {
		cleanUp();
	});

	const focusContainer = () => {
		if (containerRef) {
			setFocused(null, null);
			containerHighlighted = true;
			sync();
			containerRef.focus();
		}
	};

	/**
	 * Moves the highlight and DOM focus to `index`. `from` marks a key-driven move (the index the
	 * key started from, `null` when it entered the list), which reports through `onKeyboardMove`.
	 */
	const moveFocusTo = (index: number, from?: number | null) => {
		const item = ordered()[index];
		if (!item || isUnfocusable(item)) return;

		setFocused(item, 'keyboard');
		sync();
		// Virtual focus (combobox pattern): DOM focus stays put, only the highlight moves.
		if (!opts.virtualFocus) {
			item.focus();
		}
		// Scroll the item into view if needed
		item.scrollIntoView({
			block: 'nearest',
			inline: 'nearest',
			behavior: prefersReducedMotion() ? 'auto' : 'smooth'
		});
		if (from !== undefined && from !== index) opts.onKeyboardMove?.(index);
	};

	// Click the currently focused item (Enter/Space key)
	const clickFocused = () => {
		if (!focusedItem || isItemDisabled(focusedItem)) return;
		focusedItem.click();
	};

	// Clear focus state when container loses focus
	const clearFocus = () => {
		setFocused(null, null);
		// Restore the default roving tab stop while removing the active highlight.
		sync();
	};

	// Handle item hover - only set visual focus (no DOM focus yet)
	const handleItemHover = (item: HTMLElement) => {
		if (!positions.has(item) || isItemDisabled(item)) return;

		// Set visual focus on hovered item (don't manipulate DOM focus)
		setFocused(item, 'pointer');
		sync();
	};

	// The navigable item nearest to `from`: `from` itself, then the item before it, the one after,
	// and so on outward (the order a tab list picks the tab that replaces a removed one).
	const findNearest = (from: number): number => {
		const items = ordered();
		for (let distance = 0; distance < items.length; distance += 1) {
			for (const index of [from + distance, from - distance - 1]) {
				if (index >= 0 && index < items.length && isNavigable(items[index])) return index;
			}
		}
		return -1;
	};

	// Removing the item that had DOM focus would drop focus to <body>. Once the change has settled
	// (replacement items registered), focus moves to the item that took the removed one's place,
	// or the nearest navigable item to it — unless focus has already gone somewhere else.
	const scheduleRestore = (previous: readonly HTMLElement[], removed: HTMLElement) => {
		const version = restoreVersion.bump();
		queueMicrotask(() => {
			if (!restoreVersion.isCurrent(version) || !containerRef) return;
			const active = document.activeElement;
			if (active && active !== document.body && active !== document.documentElement) return;
			const neighbour = clampRovingKey(previous, removed, ordered());
			const target = neighbour ? findNearest(indexOf(neighbour)) : -1;
			if (target !== -1) moveFocusTo(target);
		});
	};

	const register = (node: HTMLElement) => {
		const last = registered.at(-1);
		if (last && (!last.isConnected || byDocumentPosition(last, node) > 0)) orderStale = true;
		positions.set(node, registered.length);
		registered.push(node);
		// Ids are assigned once, at registration: aria-activedescendant names them.
		if (!node.id) node.id = `${baseId}-item-${(sequence += 1)}`;
		setAttribute(node, 'tabindex', '-1');
		watchRendered(node);
		revision += 1;
	};

	const unregister = (node: HTMLElement) => {
		if (!positions.has(node)) return;
		const previous = focusHolder === node ? registered.slice() : null;
		const index = registered.indexOf(node);
		if (index !== -1) registered.splice(index, 1);
		positions.delete(node);
		positionsStale = true;
		resizeObserver?.unobserve(node);
		renderedItems.delete(node);
		if (appliedTabStop === node) appliedTabStop = null;
		if (appliedHighlight === node) appliedHighlight = null;
		if (lastFocusedItem === node) lastFocusedItem = null;
		if (focusedItem === node) setFocused(null, null);
		if (previous) {
			focusHolder = null;
			scheduleRestore(previous, node);
		}
		revision += 1;
	};

	// Keep the attributes in line after every change to the list, the highlight or the default
	// item. It runs after the DOM updates, so it also wins over a consumer's own `tabindex`.
	$effect(() => {
		void revision;
		sync();
	});

	const pointerDown = usePointerDown({
		isActive: () => true
	});

	// In RTL the inline arrows are mirrored: in a horizontal list ArrowRight goes to the previous
	// item; in a vertical one ArrowLeft opens a level (onNext) and ArrowRight leaves it (onPrevious).
	const resolveKey = (key: string) => {
		const mirrored = (opts.rtl ?? true) && getDirection() === 'rtl';
		if (mirrored && key === 'ArrowLeft') return 'ArrowRight';
		if (mirrored && key === 'ArrowRight') return 'ArrowLeft';
		return key;
	};

	// Move with an arrow along the list's axis; a key with nowhere to go still counts as handled,
	// so the page does not scroll under the list.
	const step = (from: number | null, direction: 1 | -1) => {
		const index = findFrom(from, direction);
		if (index !== -1) moveFocusTo(index, from);
		return true;
	};

	/**
	 * Move or activate for one (already mirrored) key, starting from `from`: the index of the item
	 * the key acts on, or `null` when it comes from outside the items and enters the list at an
	 * edge. Returns whether the key did anything.
	 */
	const navigate = (key: string, from: number | null): boolean => {
		const orientation = getOrientation();
		switch (key) {
			case 'ArrowLeft':
			case 'ArrowRight': {
				const direction = key === 'ArrowRight' ? 1 : -1;
				if (orientation !== 'vertical') return step(from, direction);
				// Cross axis of a vertical list: the item may open (onNext) or leave (onPrevious) a level.
				const item = from === null ? undefined : ordered()[from];
				if (!item) return false;
				const node = item as HTMLElement & LevelHandlers;
				const handler = direction === 1 ? node.onNext : node.onPrevious;
				if (typeof handler !== 'function') return false;
				return handler.call(node) !== false;
			}
			case 'ArrowUp':
			case 'ArrowDown':
				if (orientation === 'horizontal') return false;
				return step(from, key === 'ArrowDown' ? 1 : -1);
			case 'Home':
			case 'End': {
				const index = findEdge(key === 'Home' ? 1 : -1);
				if (index === -1) return false;
				moveFocusTo(index, from);
				return true;
			}
			case 'Escape':
				if (containerRef?.contains(document.activeElement)) {
					clearFocus();
				}
				return true;
			case 'Enter':
			case ' ':
				clickFocused();
				return true;
		}
		return false;
	};

	// Keys act where keyboard focus is. Hover moves the highlight without moving DOM focus, so a
	// key typed on a focused item starts from that item, not from the one under the pointer. A key
	// typed on the container itself (a popup menu opened by pointer) keeps the highlighted item,
	// which the container's aria-activedescendant names.
	const syncToKeyTarget = (target: EventTarget | null) => {
		const item = itemOf(target);
		if (!item || item === focusedItem) return;
		setFocused(item, 'keyboard');
		sync();
	};

	// The item a key typed on `target` starts from; null enters the list at an edge.
	const keyOrigin = (target: EventTarget | null): number | null => {
		const index = itemIndexOf(target);
		if (index !== -1) return index;
		if (target !== containerRef) return null;
		const highlighted = indexOf(focusedItem);
		return highlighted === -1 ? null : highlighted;
	};

	// A text field keeps its editing keys: Home, End, Space and Enter never leave it. Arrows along
	// the list's axis do, horizontal ones only from the caret edge they point past (a search field
	// in a toolbar), vertical ones from single-line inputs (a filter field above a menu's rows).
	const fieldReleases = (event: KeyboardEvent, key: string) => {
		const orientation = getOrientation();
		switch (key) {
			case 'ArrowLeft':
			case 'ArrowRight':
				return (
					orientation !== 'vertical' && isCaretAtEdge(event, key === 'ArrowRight' ? 'end' : 'start')
				);
			case 'ArrowUp':
			case 'ArrowDown':
				if (orientation === 'horizontal') return false;
				return (
					event.target instanceof HTMLInputElement ||
					isCaretAtEdge(event, key === 'ArrowDown' ? 'end' : 'start')
				);
			default:
				return false;
		}
	};

	// Content inside the container that is no item (a header field or button) keeps Enter, Space
	// and Escape; arrows along the axis and Home/End enter the list at its start or end.
	const contentReleases = (event: KeyboardEvent, key: string) => {
		if (isTextEntry(event.target)) return fieldReleases(event, key);
		const orientation = getOrientation();
		switch (key) {
			case 'Home':
			case 'End':
				return true;
			case 'ArrowLeft':
			case 'ArrowRight':
				return orientation !== 'vertical';
			case 'ArrowUp':
			case 'ArrowDown':
				return orientation !== 'horizontal';
			default:
				return false;
		}
	};

	// Keys typed while focus is inside the container.
	const handleContainerKey = (event: KeyboardEvent) => {
		const target = event.target;
		if (!ownsKeyTarget(target)) return;
		const key = resolveKey(event.key);
		if (target !== containerRef && !itemOf(target)) {
			if (!isEnabled() || !contentReleases(event, key)) return;
			event.preventDefault();
			navigate(key, null);
			return;
		}
		if (isTextEntry(target) && key !== 'Escape' && !fieldReleases(event, key)) return;
		// `preventKeyboardDefault: false` (menus) lets Escape reach the popup that closes on it;
		// every other consumer keeps all of its keys.
		if (opts.preventKeyboardDefault !== false) event.preventDefault();
		if (!isEnabled()) return;
		if (event.key !== 'Escape') event.preventDefault();
		syncToKeyTarget(target);
		navigate(key, keyOrigin(target));
	};

	// Only these keys may pull focus into a container the pointer merely rests on.
	const hoverEntryKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
	// No element has focus: the key was typed on the page itself, not in a field or control.
	const isPageLevel = (node: EventTarget | null) => {
		const pageTargets: unknown[] = [
			null,
			window,
			document,
			document.body,
			document.documentElement
		];
		return pageTargets.includes(node);
	};

	// Hover-to-navigate (`enableHoverFocus`): while the pointer rests on the container and nothing
	// on the page has focus, arrows and Home/End move focus into it, from the item highlighted
	// under the pointer or, with none, at the edge the key points to. A key typed anywhere else (a
	// text field, a button, an open submenu or dialog) belongs to that element, and Enter/Space
	// never activate an item that is only highlighted under the pointer.
	const handleHoverKey = (event: KeyboardEvent) => {
		if (event.defaultPrevented || !hoverEntryKeys.includes(event.key)) return;
		if (!isPageLevel(document.activeElement) || !isPageLevel(event.target)) return;
		const highlighted = indexOf(focusedItem);
		if (navigate(resolveKey(event.key), highlighted === -1 ? null : highlighted)) {
			event.preventDefault();
		}
	};

	// Alt/Ctrl/Meta + a navigation key is a browser or OS shortcut (Alt+← is Back), never a move.
	// useKeyDown leaves those alone; preventDefault is decided per path above.
	const keyDown = useKeyDown({
		isActive: isEnabled,
		preventDefault: false,
		ignoreModifiers: true,
		onWindow: () => isHovering && !isFocused && !!opts.enableHoverFocus,
		callback: (event, source) => {
			if (source === 'window') handleHoverKey(event);
			else handleContainerKey(event);
		},
		keys: ['Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' ']
	});

	return {
		containerReference: (node: HTMLElement) => {
			return untrack(() => {
				containerRef = node;
				containers.add(node);

				// Focusable from script (a popup focuses it and names the highlighted item through
				// aria-activedescendant) but never a Tab stop: the roving tab stop is on an item.
				// Virtual focus keeps DOM focus on the consumer's own element (a combobox input).
				if (
					!node.hasAttribute('tabindex') &&
					!opts.virtualFocus &&
					opts.focusableContainer !== false
				) {
					node.setAttribute('tabindex', '-1');
				}

				// A keyed reorder moves item nodes without re-running their attachments, and an item can
				// become disabled or hidden without registering again: both re-sync the list. Only a
				// move (a node removed and added again in one batch) can break the order; insertions are
				// placed as they register and removals keep it.
				if (typeof MutationObserver !== 'undefined') {
					observer = new MutationObserver((records) => {
						// Writing an attribute with the value it already has still queues a record (a
						// template re-assigning `button.disabled = true`). Counting it would re-run the
						// attribute sync, which re-runs that template: an endless loop.
						if (records.every(isUnchangedAttribute)) return;
						if (hasMovedNode(records)) orderStale = true;
						revision += 1;
					});
					observer.observe(node, {
						childList: true,
						subtree: true,
						attributes: true,
						attributeOldValue: true,
						attributeFilter: ['disabled', 'aria-disabled', 'data-disabled', 'hidden', 'inert']
					});
				}

				// Apply keydown reference
				const keyDownCleanup = keyDown.reference(node);
				const typeaheadCleanup = typeahead
					? on(node, 'keydown', (event) => {
							if (!isEnabled() || event.defaultPrevented || !ownsKeyTarget(event.target)) return;
							if (typeahead.handleKey(event)) event.preventDefault();
						})
					: null;

				// The container itself receiving focus (from script, or a click between items) moves
				// focus to the default item, unless the pointer is down or a popup focused it on purpose.
				// Focus that lands on an item, or on other content inside the list, stays there.
				const handleFocus = (event: FocusEvent) => {
					isFocused = true;
					focusHolder = itemOf(event.target);
					if (event.target !== node) return;
					if (focusedItem === null && !containerHighlighted && !pointerDown.isDown) {
						const preferred = opts.defaultFocusedIndex?.();
						const items = ordered();
						const index =
							preferred != null && items[preferred] && isNavigable(items[preferred])
								? preferred
								: findEdge(1);
						if (index !== -1) {
							moveFocusTo(index);
						}
					}
				};

				const focusCleanup = on(node, 'focusin', handleFocus);

				// Handle blur event - reset focus when container loses focus
				const handleBlur = (event: FocusEvent) => {
					isFocused = false;
					const relatedTarget = event.relatedTarget;
					if (relatedTarget instanceof Node && node.contains(relatedTarget)) return;
					// Focus left the list: the type-ahead buffer starts over next time.
					typeahead?.reset();
					if (relatedTarget === null) {
						// Lost to nothing. Chromium blurs a focused item while removing it (still connected,
						// so this cannot tell yet), and its unregistration later in the same flush restores
						// focus. An item still in the document afterwards lost focus to the page instead.
						const holder = focusHolder;
						queueMicrotask(() => {
							if (focusHolder === holder && holder?.isConnected) focusHolder = null;
						});
					} else {
						focusHolder = null;
					}
					clearFocus();
				};

				const blurCleanup = on(node, 'focusout', handleBlur);

				// Handle container pointer enter - track hovering state
				const handleContainerEnter = () => {
					isHovering = true;
				};

				const containerEnterCleanup = on(node, 'pointerenter', handleContainerEnter);

				// Handle pointer leave - clear focus only if it was set by pointer
				const handlePointerLeave = () => {
					isHovering = false;

					if (focusSource === 'pointer') {
						clearFocus();
					}
				};

				const pointerLeaveCleanup = on(node, 'pointerleave', handlePointerLeave);
				const pointerDownCleanup = pointerDown.reference?.(node);
				// NOTE: we intentionally do NOT move DOM focus to `defaultFocusedIndex`
				// on mount — a tablist/menu must not steal focus just by existing (it
				// caused a focus-visible ring on the first tab on page load). Consumers
				// that want focus-on-mount opt in explicitly (e.g. Menu's `focusOnMount`
				// via onMount). The roving tab-stop (sync) makes the active item directly
				// Tab-reachable.
				return () => {
					containers.delete(node);
					cleanUp();
					keyDownCleanup();
					typeaheadCleanup?.();
					focusCleanup();
					blurCleanup();
					containerEnterCleanup();
					pointerLeaveCleanup();
					pointerDownCleanup?.();
				};
			});
		},
		itemReference: (node: HTMLElement) => {
			return untrack(() => {
				register(node);

				const handleFocus = () => {
					if (!positions.has(node) || isUnfocusable(node)) return;
					setFocused(node, 'keyboard');
					sync();
				};

				const focusCleanup = on(node, 'focus', handleFocus);

				// Handle hover - only move focus if enabled
				const handleHover = () => {
					if (isEnabled() && opts.enableHoverFocus !== false) {
						handleItemHover(node);
					}
				};

				const hoverCleanup = on(node, 'pointerenter', handleHover);

				return () => {
					unregister(node);
					focusCleanup();
					hoverCleanup();
				};
			});
		},
		// Expose focused index for external use
		get focusedIndex() {
			return readFocusedIndex();
		},
		// Expose control methods
		focusItem: (index: number) => {
			if (index >= 0 && index < ordered().length) {
				moveFocusTo(index);
			}
		},
		focusFirst: () => {
			const firstIndex = findEdge(1);
			if (firstIndex !== -1) {
				moveFocusTo(firstIndex);
			}
		},
		focusLast: () => {
			const lastIndex = findEdge(-1);
			if (lastIndex !== -1) {
				moveFocusTo(lastIndex);
			}
		},
		clearFocus: () => {
			clearFocus();
		},
		/**
		 * Re-sync the pointer highlight with the browser's real :hover state. While a
		 * submenu is open the parent nav is disabled, so the highlight freezes on the
		 * trigger row; when the submenu closes, the row actually under the mouse (if
		 * any) should be highlighted instead of the stale trigger.
		 */
		syncPointerFocus: () => {
			const hovered = ordered().find((item) => item.matches(':hover') && !isItemDisabled(item));
			if (hovered) {
				handleItemHover(hovered);
			} else if (focusSource === 'pointer') {
				clearFocus();
			}
		},
		get lastFocusedIndex() {
			return readLastFocusedIndex();
		},
		focusContainer: focusContainer
	};
};
