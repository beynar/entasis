import { withOptions } from '$lib/utils/state.svelte.js';
import { onDestroy, tick, untrack } from 'svelte';
import type {
	TableOfContentsActivationThresholds,
	TableOfContentsItem,
	TableOfContentsLevel,
	TableOfContentsTarget
} from './tableOfContents.props.js';
import { normalizeTableOfContentsItems } from './tableOfContents.items.js';
import {
	getTableOfContentsActiveRange,
	measureTableOfContentsRail,
	normalizeTableOfContentsLevels,
	type TableOfContentsActiveRange,
	type TableOfContentsRailGeometry
} from './tableOfContents.rail.js';

type TableOfContentsStateOptions = {
	target: TableOfContentsTarget | undefined;
	providedItems: readonly TableOfContentsItem[] | undefined;
	levels: readonly TableOfContentsLevel[];
	activationThresholds: TableOfContentsActivationThresholds | undefined;
	scrollOffset: number | undefined;
	indentSize: number;
	indentRadius: number;
	sizeScale: number;
};

type HeadingScrollMargin = {
	value: string;
	priority: string;
	appliedValue: string;
};

const DEFAULT_ACTIVATION_THRESHOLDS = {
	viewportInset: 96,
	scrollRootInset: 16,
	currentOffset: 48
} satisfies Required<TableOfContentsActivationThresholds>;

const SCROLL_MARGIN_PROPERTY = 'scroll-margin-block-start';

// Internal bookkeeping collections are rebuilt wholesale and published through `$state` fields, so
// they stay plain Map/Set; these factories keep that intent explicit instead of reaching for the
// per-entry reactive wrappers in `svelte/reactivity`.
const plainMap = <K, V>(entries?: Iterable<readonly [K, V]>): Map<K, V> => new Map(entries);
const plainSet = <T>(values?: Iterable<T>): Set<T> => new Set(values);

export class TableOfContentsState extends withOptions<TableOfContentsStateOptions>() {
	items = $state<TableOfContentsItem[]>([]);
	currentId = $state<string | null>(null);
	highlightedIds = $state<Set<string>>(plainSet());
	geometry = $state<TableOfContentsRailGeometry | null>(null);

	private targetElement: HTMLElement | null = null;
	private rootElement: HTMLElement | null = null;
	private listElement: HTMLOListElement | null = null;
	private headingElements = plainMap<string, HTMLHeadingElement>();
	private headingScrollMargins = plainMap<HTMLHeadingElement, HeadingScrollMargin>();
	private targetScrollElements: HTMLElement[] = [];
	private resolvedLevels: TableOfContentsLevel[] = [];
	private resolvedProvidedItems: TableOfContentsItem[] | null = null;
	private sourceSignature = '';
	private targetMutationObserver: MutationObserver | null = null;
	private targetResizeObserver: ResizeObserver | null = null;
	private listResizeObserver: ResizeObserver | null = null;
	private visibilityFrame = 0;
	private railFrame = 0;
	private linkScrollFrame = 0;
	private restoredHash = '';

	constructor(options: TableOfContentsStateOptions) {
		super(options);

		$effect(() => {
			const target = this.target;
			const levels = normalizeTableOfContentsLevels(this.levels);
			const providedItems = normalizeTableOfContentsItems(this.providedItems, levels);
			const itemSignature =
				providedItems === null
					? 'auto'
					: providedItems.map((item) => `${item.id}:${item.level}:${item.title}`).join('|');
			const signature = `${levels.join(',')}::${itemSignature}`;

			untrack(() => this.connectTarget(target, levels, providedItems, signature));
		});

		$effect(() => {
			const thresholds = this.activationThresholds;
			void thresholds?.viewportInset;
			void thresholds?.scrollRootInset;
			void thresholds?.currentOffset;
			untrack(this.scheduleVisibilitySync);
		});

		$effect(() => {
			const scrollOffset = this.scrollOffset;
			untrack(() => this.syncHeadingScrollMargins(this.headingElements, scrollOffset));
		});

		$effect(() => {
			const itemSignature = this.items
				.map((item) => `${item.id}:${item.level}:${item.title}`)
				.join('|');
			const indentSize = this.indentSize;
			const indentRadius = this.indentRadius;
			const sizeScale = this.sizeScale;

			untrack(() => {
				void itemSignature;
				void indentSize;
				void indentRadius;
				void sizeScale;
				void tick().then(this.scheduleRailMeasure);
			});
		});

		onDestroy(() => this.destroy());
	}

	get activeRange(): TableOfContentsActiveRange | null {
		return this.geometry
			? getTableOfContentsActiveRange(this.geometry.positions, this.highlightedIds)
			: null;
	}

	rootAttachment = (node: HTMLElement) => {
		this.rootElement = node;

		return () => {
			if (this.rootElement === node) this.rootElement = null;
		};
	};

	listAttachment = (node: HTMLOListElement) => {
		return untrack(() => {
			this.listElement = node;
			this.listResizeObserver?.disconnect();
			this.listResizeObserver =
				typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(this.scheduleRailMeasure);
			this.listResizeObserver?.observe(node);
			this.scheduleRailMeasure();

			return () => {
				this.listResizeObserver?.disconnect();
				this.listResizeObserver = null;
				if (this.listElement === node) this.listElement = null;
			};
		});
	};

	private connectTarget(
		target: TableOfContentsTarget | undefined,
		levels: TableOfContentsLevel[],
		providedItems: TableOfContentsItem[] | null,
		signature: string
	): void {
		const targetElement = resolveTarget(target);
		if (targetElement === this.targetElement && signature === this.sourceSignature) return;

		this.disconnectTarget();
		this.targetElement = targetElement;
		this.resolvedLevels = levels;
		this.resolvedProvidedItems = providedItems;
		this.sourceSignature = signature;

		if (!levels.length || (providedItems === null && !targetElement)) {
			this.setItems([], plainMap());
			return;
		}

		this.syncHeadings();
		this.targetScrollElements = getSourceScrollableAncestors(targetElement, this.headingElements);
		for (const scrollElement of this.targetScrollElements) {
			scrollElement.addEventListener('scroll', this.scheduleVisibilitySync, { passive: true });
		}
		window.addEventListener('scroll', this.scheduleVisibilitySync, { passive: true });
		window.addEventListener('resize', this.scheduleVisibilitySync, { passive: true });
		window.addEventListener('hashchange', this.scheduleVisibilitySync);

		if (targetElement && typeof MutationObserver !== 'undefined') {
			this.targetMutationObserver = new MutationObserver(this.scheduleHeadingSync);
			this.targetMutationObserver.observe(targetElement, {
				subtree: true,
				childList: true,
				characterData: true,
				attributes: true,
				attributeFilter: ['id', 'hidden', 'aria-hidden', 'inert']
			});
		}

		if (typeof ResizeObserver !== 'undefined') {
			this.targetResizeObserver = new ResizeObserver(this.scheduleVisibilitySync);
			for (const observedElement of getSourceResizeElements(targetElement, this.headingElements)) {
				this.targetResizeObserver.observe(observedElement);
			}
		}
	}

	private disconnectTarget(): void {
		this.restoreHeadingScrollMargins();
		this.targetMutationObserver?.disconnect();
		this.targetResizeObserver?.disconnect();
		this.targetMutationObserver = null;
		this.targetResizeObserver = null;
		for (const scrollElement of this.targetScrollElements) {
			scrollElement.removeEventListener('scroll', this.scheduleVisibilitySync);
		}
		this.targetScrollElements = [];
		if (typeof window !== 'undefined') {
			window.removeEventListener('scroll', this.scheduleVisibilitySync);
			window.removeEventListener('resize', this.scheduleVisibilitySync);
			window.removeEventListener('hashchange', this.scheduleVisibilitySync);
		}
		cancelFrame(this.visibilityFrame);
		this.visibilityFrame = 0;
		this.targetElement = null;
		this.restoredHash = '';
	}

	private scheduleHeadingSync = () => {
		this.scheduleVisibilitySync();
		void tick().then(() => this.syncHeadings());
	};

	private syncHeadings = (): void => {
		if (this.resolvedProvidedItems !== null) {
			this.syncProvidedItems();
			return;
		}

		if (!this.targetElement || !this.resolvedLevels.length) {
			this.setItems([], plainMap());
			return;
		}

		const selector = this.resolvedLevels.map((level) => `h${level}`).join(',');
		const usedIds = plainSet<string>();
		const headingElements = plainMap<string, HTMLHeadingElement>();
		const items: TableOfContentsItem[] = [];

		for (const heading of this.targetElement.querySelectorAll<HTMLHeadingElement>(selector)) {
			const title = normalizeTitle(heading.textContent);
			if (!title || isSemanticallyHidden(heading)) continue;

			const id = getHeadingId(heading, title, usedIds);
			if (!id) continue;

			const level = Number(heading.tagName.slice(1)) as TableOfContentsLevel;
			usedIds.add(id);
			headingElements.set(id, heading);
			items.push({ id, level, title });
		}

		this.setItems(items, headingElements);
		this.restoreHashTarget();
	};

	private syncProvidedItems(): void {
		const headingElements = plainMap<string, HTMLHeadingElement>();
		const targetHeadings = this.targetElement ? getHeadingElementsById(this.targetElement) : null;

		for (const item of this.resolvedProvidedItems ?? []) {
			const heading = targetHeadings ? targetHeadings.get(item.id) : getHeadingElementById(item.id);
			if (heading) headingElements.set(item.id, heading);
		}

		this.setItems(this.resolvedProvidedItems ?? [], headingElements);
		this.restoreHashTarget();
	}

	private setItems(
		items: TableOfContentsItem[],
		headingElements: Map<string, HTMLHeadingElement>
	): void {
		this.syncHeadingScrollMargins(headingElements, this.scrollOffset);
		this.headingElements = headingElements;
		if (!areSameItems(this.items, items)) this.items = items;
		this.scheduleVisibilitySync();
		void tick().then(this.scheduleRailMeasure);
	}

	private syncHeadingScrollMargins(
		headingElements: Map<string, HTMLHeadingElement>,
		scrollOffset: number | undefined
	): void {
		const offset = normalizeScrollOffset(scrollOffset);
		const currentHeadings = plainSet(headingElements.values());

		for (const heading of [...this.headingScrollMargins.keys()]) {
			if (offset !== null && currentHeadings.has(heading)) continue;
			this.restoreHeadingScrollMargin(heading);
		}
		if (offset === null) return;

		const appliedValue = `${offset}px`;
		for (const heading of currentHeadings) {
			let scrollMargin = this.headingScrollMargins.get(heading);
			if (!scrollMargin) {
				scrollMargin = {
					value: heading.style.getPropertyValue(SCROLL_MARGIN_PROPERTY),
					priority: heading.style.getPropertyPriority(SCROLL_MARGIN_PROPERTY),
					appliedValue
				};
				this.headingScrollMargins.set(heading, scrollMargin);
			} else if (
				heading.style.getPropertyValue(SCROLL_MARGIN_PROPERTY) !== scrollMargin.appliedValue ||
				heading.style.getPropertyPriority(SCROLL_MARGIN_PROPERTY) !== ''
			) {
				scrollMargin.value = heading.style.getPropertyValue(SCROLL_MARGIN_PROPERTY);
				scrollMargin.priority = heading.style.getPropertyPriority(SCROLL_MARGIN_PROPERTY);
			}

			scrollMargin.appliedValue = appliedValue;
			heading.style.setProperty(SCROLL_MARGIN_PROPERTY, appliedValue);
		}
	}

	private restoreHeadingScrollMargin(heading: HTMLHeadingElement): void {
		const scrollMargin = this.headingScrollMargins.get(heading);
		if (!scrollMargin) return;

		const stillOwned =
			heading.style.getPropertyValue(SCROLL_MARGIN_PROPERTY) === scrollMargin.appliedValue &&
			heading.style.getPropertyPriority(SCROLL_MARGIN_PROPERTY) === '';
		if (stillOwned) {
			if (scrollMargin.value) {
				heading.style.setProperty(
					SCROLL_MARGIN_PROPERTY,
					scrollMargin.value,
					scrollMargin.priority
				);
			} else {
				heading.style.removeProperty(SCROLL_MARGIN_PROPERTY);
			}
		}

		this.headingScrollMargins.delete(heading);
	}

	private restoreHeadingScrollMargins(): void {
		for (const heading of [...this.headingScrollMargins.keys()]) {
			this.restoreHeadingScrollMargin(heading);
		}
	}

	private scheduleVisibilitySync = () => {
		cancelFrame(this.visibilityFrame);
		if (typeof requestAnimationFrame === 'undefined') {
			this.syncVisibility();
			return;
		}
		this.visibilityFrame = requestAnimationFrame(this.syncVisibility);
	};

	private syncVisibility = (): void => {
		this.visibilityFrame = 0;
		if (!this.items.length) {
			this.updateActiveState([], null);
			return;
		}

		const firstHeading = this.headingElements.values().next().value ?? null;
		const thresholds = resolveActivationThresholds(this.activationThresholds);
		const bounds = getVisibilityBounds(this.targetElement ?? firstHeading, thresholds);
		if (bounds.bottom <= bounds.top) {
			this.updateActiveState([], null);
			return;
		}

		const headings = this.items.flatMap((item) => {
			const heading = this.headingElements.get(item.id);
			if (!heading || isSemanticallyHidden(heading) || heading.getClientRects().length === 0) {
				return [];
			}
			const rect = heading.getBoundingClientRect();
			return [{ id: item.id, top: rect.top, bottom: rect.bottom }];
		});
		const visibleIds = headings
			.filter((heading) => heading.bottom >= bounds.top && heading.top <= bounds.bottom)
			.map((heading) => heading.id);

		let fallbackId = headings[0]?.id ?? null;
		for (const heading of headings) {
			if (heading.top > bounds.top + thresholds.currentOffset) break;
			fallbackId = heading.id;
		}

		this.updateActiveState(visibleIds, visibleIds.at(-1) ?? fallbackId);
	};

	private updateActiveState(visibleIds: string[], currentId: string | null): void {
		const highlightedIds = plainSet(visibleIds.length ? visibleIds : currentId ? [currentId] : []);
		if (!areSameIds(this.highlightedIds, highlightedIds)) this.highlightedIds = highlightedIds;

		if (this.currentId !== currentId) {
			this.currentId = currentId;
			this.scheduleCurrentLinkScroll();
		}
	}

	private scheduleRailMeasure = () => {
		cancelFrame(this.railFrame);
		if (typeof requestAnimationFrame === 'undefined') {
			this.measureRail();
			return;
		}
		this.railFrame = requestAnimationFrame(this.measureRail);
	};

	private measureRail = (): void => {
		this.railFrame = 0;
		this.geometry = this.listElement
			? measureTableOfContentsRail(
					this.listElement,
					this.items,
					this.resolvedLevels,
					this.indentSize,
					this.indentRadius,
					this.sizeScale
				)
			: null;
	};

	private scheduleCurrentLinkScroll(): void {
		cancelFrame(this.linkScrollFrame);
		if (!this.currentId || typeof requestAnimationFrame === 'undefined') return;
		this.linkScrollFrame = requestAnimationFrame(() => {
			this.linkScrollFrame = 0;
			this.scrollCurrentLink();
		});
	}

	private scrollCurrentLink(): void {
		if (!this.rootElement || !this.listElement || !this.currentId) return;
		const scrollElement =
			this.rootElement.querySelector<HTMLElement>('[data-scroll-area-viewport]') ??
			this.rootElement;
		const link = Array.from(
			this.listElement.querySelectorAll<HTMLAnchorElement>('a[data-toc-id]')
		).find((candidate) => candidate.dataset.tocId === this.currentId);
		if (!link || scrollElement.scrollHeight <= scrollElement.clientHeight) return;

		const linkRect = link.getBoundingClientRect();
		const scrollRect = scrollElement.getBoundingClientRect();
		if (linkRect.top < scrollRect.top) scrollElement.scrollTop -= scrollRect.top - linkRect.top;
		else if (linkRect.bottom > scrollRect.bottom)
			scrollElement.scrollTop += linkRect.bottom - scrollRect.bottom;
	}

	private restoreHashTarget(): void {
		if (typeof location === 'undefined' || !location.hash) return;
		const id = decodeHash(location.hash);
		const heading = id ? this.headingElements.get(id) : null;
		if (!heading || this.restoredHash === location.hash) return;

		this.restoredHash = location.hash;
		if (typeof requestAnimationFrame === 'undefined') {
			heading.scrollIntoView({ block: 'start' });
			return;
		}
		requestAnimationFrame(() => heading.scrollIntoView({ block: 'start' }));
	}

	private destroy(): void {
		this.disconnectTarget();
		this.listResizeObserver?.disconnect();
		this.listResizeObserver = null;
		cancelFrame(this.railFrame);
		cancelFrame(this.linkScrollFrame);
		this.rootElement = null;
	}
}

function resolveTarget(target: TableOfContentsTarget | undefined): HTMLElement | null {
	if (typeof document === 'undefined' || !target) return null;
	if (typeof target !== 'string') return target;
	const element = document.querySelector(target);
	return element instanceof HTMLElement ? element : null;
}

function getHeadingElementsById(target: HTMLElement): Map<string, HTMLHeadingElement> {
	const headings = plainMap<string, HTMLHeadingElement>();
	for (const heading of target.querySelectorAll<HTMLHeadingElement>(
		'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'
	)) {
		if (heading.id && !headings.has(heading.id)) headings.set(heading.id, heading);
	}
	return headings;
}

function getHeadingElementById(id: string): HTMLHeadingElement | null {
	if (typeof document === 'undefined') return null;
	const element = document.getElementById(id);
	if (!(element instanceof HTMLElement) || !/^H[1-6]$/.test(element.tagName)) return null;
	return element as HTMLHeadingElement;
}

function getHeadingId(
	heading: HTMLHeadingElement,
	title: string,
	usedIds: Set<string>
): string | null {
	const explicitId = heading.id.trim();
	if (explicitId) {
		const owner = document.getElementById(explicitId);
		return !usedIds.has(explicitId) && (!owner || owner === heading) ? explicitId : null;
	}

	const slug = title
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	const baseId = `toc-${slug || 'section'}`;
	let candidate = baseId;
	let suffix = 2;

	while (usedIds.has(candidate) || document.getElementById(candidate)) {
		candidate = `${baseId}-${suffix}`;
		suffix += 1;
	}

	heading.id = candidate;
	return candidate;
}

function normalizeTitle(value: string | null): string {
	return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function getVisibilityBounds(
	target: HTMLElement | null,
	thresholds: Required<TableOfContentsActivationThresholds>
): { top: number; bottom: number } {
	if (typeof window === 'undefined') return { top: 0, bottom: 0 };
	const clippingAncestors = getClippingAncestors(target);
	if (!clippingAncestors.length) {
		return {
			top: thresholds.viewportInset,
			bottom: Math.max(thresholds.viewportInset, window.innerHeight - thresholds.viewportInset)
		};
	}

	let top = thresholds.scrollRootInset;
	let bottom = window.innerHeight - thresholds.scrollRootInset;
	for (const clippingAncestor of clippingAncestors) {
		const rect = clippingAncestor.getBoundingClientRect();
		top = Math.max(top, rect.top + thresholds.scrollRootInset);
		bottom = Math.min(bottom, rect.bottom - thresholds.scrollRootInset);
	}
	return { top, bottom };
}

function resolveActivationThresholds(
	thresholds: TableOfContentsActivationThresholds | undefined
): Required<TableOfContentsActivationThresholds> {
	return {
		viewportInset: normalizeActivationThreshold(
			thresholds?.viewportInset,
			DEFAULT_ACTIVATION_THRESHOLDS.viewportInset
		),
		scrollRootInset: normalizeActivationThreshold(
			thresholds?.scrollRootInset,
			DEFAULT_ACTIVATION_THRESHOLDS.scrollRootInset
		),
		currentOffset: normalizeActivationThreshold(
			thresholds?.currentOffset,
			DEFAULT_ACTIVATION_THRESHOLDS.currentOffset
		)
	};
}

function normalizeActivationThreshold(value: number | undefined, fallback: number): number {
	if (value === undefined || !Number.isFinite(value)) return fallback;
	return Math.max(0, value);
}

function normalizeScrollOffset(value: number | undefined): number | null {
	if (value === undefined || !Number.isFinite(value)) return null;
	return Math.max(0, value);
}

function getScrollableAncestors(element: HTMLElement): HTMLElement[] {
	return getAncestorsMatchingOverflow(element, new Set(['auto', 'scroll']));
}

function getSourceScrollableAncestors(
	target: HTMLElement | null,
	headings: Map<string, HTMLHeadingElement>
): HTMLElement[] {
	const sources = target ? [target] : [...headings.values()];
	return [...new Set(sources.flatMap(getScrollableAncestors))];
}

function getSourceResizeElements(
	target: HTMLElement | null,
	headings: Map<string, HTMLHeadingElement>
): HTMLElement[] {
	const sources = target ? [target] : [...headings.values()];
	return [...new Set(sources.flatMap((source) => [source, ...getClippingAncestors(source)]))];
}

function getClippingAncestors(element: HTMLElement | null): HTMLElement[] {
	if (!element) return [];
	return getAncestorsMatchingOverflow(element, new Set(['auto', 'scroll', 'hidden', 'clip']));
}

function getAncestorsMatchingOverflow(element: HTMLElement, values: Set<string>): HTMLElement[] {
	const ancestors: HTMLElement[] = [];
	let current: HTMLElement | null = element;
	while (current && current !== document.documentElement) {
		const overflowY = getComputedStyle(current).overflowY;
		if (values.has(overflowY)) ancestors.push(current);
		current = current.parentElement;
	}
	return ancestors;
}

function isSemanticallyHidden(heading: HTMLHeadingElement): boolean {
	return heading.closest('[hidden], [aria-hidden="true"], [inert]') !== null;
}

function decodeHash(hash: string): string | null {
	try {
		return decodeURIComponent(hash.slice(1));
	} catch {
		return null;
	}
}

function areSameItems(current: TableOfContentsItem[], next: TableOfContentsItem[]): boolean {
	return (
		current.length === next.length &&
		current.every(
			(item, index) =>
				item.id === next[index].id &&
				item.level === next[index].level &&
				item.title === next[index].title
		)
	);
}

function areSameIds(current: Set<string>, next: Set<string>): boolean {
	if (current.size !== next.size) return false;
	return [...current].every((id) => next.has(id));
}

function cancelFrame(frame: number): void {
	if (frame && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(frame);
}
