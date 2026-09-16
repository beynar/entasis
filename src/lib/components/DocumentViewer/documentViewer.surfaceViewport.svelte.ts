import { untrack } from 'svelte';
import { getDocumentUnitAtReadingPosition } from './documentPageTracking.js';
import type {
	DocumentFitMode,
	DocumentOrientation,
	DocumentUnit,
	DocumentViewMode
} from './documentViewer.props.js';

/** Natural (unscaled) size of the unit a surface fits into its viewport. */
export interface DocumentSurfaceFitSize {
	width: number;
	height: number;
}

/** The slice of `DocumentViewerState` a paged surface viewport reads and drives. */
export interface DocumentSurfaceViewportHost {
	readonly unit: DocumentUnit | null;
	readonly fit: DocumentFitMode;
	readonly mode: DocumentViewMode;
	readonly orientation: DocumentOrientation;
	readonly page: number;
	goTo(page: number): void;
	setScaleFromSurface(scale: number): void;
}

export interface DocumentSurfaceViewportOptions {
	/** Natural size of the unit to fit, `null` while there is nothing to measure. Read reactively. */
	getFitSize: () => DocumentSurfaceFitSize | null | undefined;
	/** Document identity: a change re-anchors the scroll position without animating. Read reactively. */
	getDocumentKey: () => unknown;
	/** Whether a height change re-fits. Defaults to always; OOXML only cares while fitting a page. */
	observesHeight?: () => boolean;
}

/** Viewport padding removed before fitting a unit, matching the `p-4` surface gutter. */
const surfacePadding = 32;

/** Reads its arguments so an effect subscribes to them without acting on the values. */
const track = (...values: unknown[]) => values;

/**
 * Scroll/fit plumbing shared by the paged document surfaces: it fits the active unit to the
 * viewport on resize, reports the unit at the reading position back to the viewer while the
 * user scrolls, and scrolls the requested page into view without fighting a manual scroll.
 */
export const createDocumentSurfaceViewport = (
	getViewer: () => DocumentSurfaceViewportHost,
	options: DocumentSurfaceViewportOptions
) => {
	const viewer = $derived(getViewer());
	let container = $state<HTMLDivElement | null>(null);
	let fitFrame = 0;
	let pageSyncFrame = 0;
	let pageScrollFrame = 0;
	let observedWidth = 0;
	let observedHeight = 0;
	let visiblePage = 0;
	let navigationTarget = 0;
	let previousMode: DocumentViewMode | null = null;
	let previousOrientation: DocumentOrientation | null = null;
	let previousDocumentKey: unknown;

	const isHorizontal = $derived(
		viewer.mode === 'scroll' && viewer.unit === 'page' && viewer.orientation === 'horizontal'
	);

	const applyFit = () => {
		const size = options.getFitSize();
		if (!container || !size || !viewer.fit || size.width <= 0) return;
		const widthScale = Math.max(1, container.clientWidth - surfacePadding) / size.width;
		if (viewer.fit === 'width' || size.height <= 0) {
			viewer.setScaleFromSurface(widthScale);
			return;
		}
		const heightScale = Math.max(1, container.clientHeight - surfacePadding) / size.height;
		viewer.setScaleFromSurface(Math.min(widthScale, heightScale));
	};

	const scheduleFit = () => {
		if (fitFrame) return;
		fitFrame = requestAnimationFrame(() => {
			fitFrame = 0;
			applyFit();
		});
	};

	const syncPageFromScroll = () => {
		pageSyncFrame = 0;
		if (!container || viewer.mode !== 'scroll') return;
		const viewport = container.getBoundingClientRect();
		const closestPage = getDocumentUnitAtReadingPosition(
			visiblePage,
			isHorizontal ? viewport.left : viewport.top,
			isHorizontal ? viewport.width : viewport.height,
			Array.from(container.querySelectorAll<HTMLElement>('[data-document-unit]'), (unit) => {
				const bounds = unit.getBoundingClientRect();
				return {
					unit: Number(unit.dataset.documentUnit),
					start: isHorizontal ? bounds.left : bounds.top,
					end: isHorizontal ? bounds.right : bounds.bottom
				};
			})
		);
		if (!closestPage) return;
		if (navigationTarget) {
			if (closestPage !== navigationTarget) return;
			navigationTarget = 0;
		}
		if (closestPage === visiblePage) return;
		visiblePage = closestPage;
		viewer.goTo(closestPage);
	};

	const schedulePageSync = () => {
		if (pageSyncFrame) return;
		pageSyncFrame = requestAnimationFrame(syncPageFromScroll);
	};

	const scrollToPage = (page: number, behavior: ScrollBehavior) => {
		if (!container) return;
		const target = container.querySelector<HTMLElement>(`[data-document-unit="${page}"]`);
		if (!target) return;
		const viewport = container.getBoundingClientRect();
		const bounds = target.getBoundingClientRect();
		if (isHorizontal) {
			const left = bounds.left - viewport.left + container.scrollLeft;
			const targetLeft = Math.max(0, left - (container.clientWidth - bounds.width) / 2);
			if (Math.abs(container.scrollLeft - targetLeft) < 0.5) return;
			navigationTarget = page;
			container.scrollTo({ left: targetLeft, behavior });
			return;
		}
		const top = bounds.top - viewport.top + container.scrollTop;
		const targetTop = Math.max(0, top - (container.clientHeight - bounds.height) / 2);
		if (Math.abs(container.scrollTop - targetTop) < 0.5) return;
		navigationTarget = page;
		container.scrollTo({ top: targetTop, behavior });
	};

	$effect(() => {
		const node = container;
		if (!node) return;
		const observer = new ResizeObserver(([entry]) => {
			const width = entry?.contentRect.width ?? 0;
			const height = entry?.contentRect.height ?? 0;
			const hasWidthChange = Math.abs(width - observedWidth) >= 0.5;
			const hasHeightChange =
				(options.observesHeight?.() ?? true) && Math.abs(height - observedHeight) >= 0.5;
			if (!hasWidthChange && !hasHeightChange) return;
			observedWidth = width;
			observedHeight = height;
			scheduleFit();
		});
		observer.observe(node);
		const cancelNavigation = () => {
			navigationTarget = 0;
		};
		node.addEventListener('wheel', cancelNavigation, { passive: true });
		node.addEventListener('pointerdown', cancelNavigation);
		node.addEventListener('keydown', cancelNavigation);
		scheduleFit();
		return () => {
			cancelAnimationFrame(fitFrame);
			cancelAnimationFrame(pageSyncFrame);
			cancelAnimationFrame(pageScrollFrame);
			fitFrame = 0;
			pageSyncFrame = 0;
			pageScrollFrame = 0;
			observedWidth = 0;
			observedHeight = 0;
			navigationTarget = 0;
			node.removeEventListener('wheel', cancelNavigation);
			node.removeEventListener('pointerdown', cancelNavigation);
			node.removeEventListener('keydown', cancelNavigation);
			observer.disconnect();
		};
	});

	$effect(() => {
		// applyFit re-reads these untracked, so fitting never re-triggers itself.
		track(viewer.fit, viewer.orientation, options.getFitSize());
		untrack(applyFit);
	});

	$effect(() => {
		const mode = viewer.mode;
		const page = viewer.page;
		const orientation = viewer.orientation;
		const documentKey = options.getDocumentKey();
		const hasModeChanged = mode !== previousMode;
		const hasOrientationChanged = orientation !== previousOrientation;
		const hasDocumentChanged = documentKey !== previousDocumentKey;
		previousMode = mode;
		previousOrientation = orientation;
		previousDocumentKey = documentKey;
		if (mode !== 'scroll') {
			navigationTarget = 0;
			visiblePage = page;
			return;
		}
		if (!hasModeChanged && !hasOrientationChanged && !hasDocumentChanged && page === visiblePage) {
			return;
		}
		visiblePage = page;
		cancelAnimationFrame(pageScrollFrame);
		pageScrollFrame = requestAnimationFrame(() => {
			pageScrollFrame = 0;
			scrollToPage(
				page,
				hasModeChanged || hasOrientationChanged || hasDocumentChanged ? 'auto' : 'smooth'
			);
		});
	});

	return {
		/** Scroll viewport element, bound by the surface through `bind:viewportRef`. */
		get container() {
			return container;
		},
		set container(node: HTMLDivElement | null) {
			container = node;
		},
		/** Whether units flow left to right, so scroll maths follow the inline axis. */
		get isHorizontal() {
			return isHorizontal;
		},
		/** `onscroll` handler: reports the unit at the reading position, once per frame. */
		schedulePageSync
	};
};
