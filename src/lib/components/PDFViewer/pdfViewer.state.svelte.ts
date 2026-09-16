import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { BROWSER } from 'esm-env';
import { onDestroy, untrack } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import {
	documentViewerAssets,
	loadDocumentViewerRuntime,
	type DocumentViewerAssets
} from '../DocumentViewer/documentViewer.assets.js';
import { getDocumentUnitAtReadingPosition } from '../DocumentViewer/documentPageTracking.js';

export interface PDFViewport {
	width: number;
	height: number;
	convertToViewportRectangle(rect: number[]): number[];
}
interface RenderTask {
	promise: Promise<void>;
	cancel(): void;
}
interface TextItem {
	str: string;
}
interface TextContent {
	items: TextItem[];
}
export interface PDFAnnotation {
	subtype: string;
	url?: string;
	rect: number[];
}
export interface PDFPageProxy {
	rotate: number;
	getViewport(options: { scale: number; rotation?: number }): PDFViewport;
	render(options: {
		canvasContext: CanvasRenderingContext2D;
		viewport: PDFViewport;
		transform?: number[];
	}): RenderTask;
	getTextContent(): Promise<TextContent>;
	getAnnotations(): Promise<PDFAnnotation[]>;
}
interface PDFDocumentProxy {
	numPages: number;
	getPage(pageNumber: number): Promise<PDFPageProxy>;
	getData(): Promise<Uint8Array>;
	loadingTask: { destroy(): Promise<void> };
}
export interface TextLayerInstance {
	render(): Promise<void>;
	cancel(): void;
	textContentItemsStr: string[];
	textDivs: HTMLElement[];
}
export interface PDFJSModule {
	version: string;
	GlobalWorkerOptions: { workerSrc: string; workerPort: unknown };
	getDocument(src: object): { promise: Promise<PDFDocumentProxy> };
	TextLayer: new (options: {
		textContentSource: TextContent;
		container: HTMLElement;
		viewport: PDFViewport;
	}) => TextLayerInstance;
	setLayerDimensions(element: HTMLElement, viewport: { width: number; height: number }): void;
}

export interface PDFLink {
	url: string;
	left: number;
	top: number;
	width: number;
	height: number;
}

/** A single search hit: the page it lives on and its character range in that page's text. */
export interface SearchMatch {
	page: number;
	start: number;
	end: number;
}

export type FitMode = 'width' | 'page' | null;
/** Continuous scrolling of every page, or one page at a time. */
export type PDFViewMode = 'scroll' | 'single';
/** Direction pages flow and scroll. */
export type PDFOrientation = 'vertical' | 'horizontal';

const ZOOM_STEP = 0.25;

/** Reads the given values so the enclosing `$effect` depends on them. */
const track = (...values: unknown[]) => values;

interface PDFViewerOptions {
	src: string | URL | Uint8Array | ArrayBuffer;
	password?: string;
	downloadFileName?: string;
	onLoad?: (payload: PDFViewerState) => void;
	onError?: (error: Error) => void;
	onPageChange?: (page: number) => void;
	page: number;
	scale: number;
	rotation: number;
	totalPages: number;
	minScale: number;
	maxScale: number;
	fit: FitMode;
	mode: PDFViewMode;
	orientation: PDFOrientation;
	runtimeAssets?: DocumentViewerAssets['pdf'];
}

export class PDFViewerState extends createBindableStateClass<PDFViewerOptions>() {
	// Reactive state
	pdfjs: PDFJSModule | null = $state.raw(null);
	doc: PDFDocumentProxy | null = $state.raw(null);
	loading = $state(true);
	error: Error | null = $state(null);

	/** Unscaled dimensions of page 1, used to size placeholders and compute fit. */
	baseWidth = $state(0);
	baseHeight = $state(0);

	/** Pages currently within the render band (virtualization). */
	renderPages = new SvelteSet<number>();

	// Search
	query = $state('');
	matches = $state<SearchMatch[]>([]);
	activeMatch = $state(-1);

	// Internals
	private mounted = false;
	private loadToken = 0;
	private printFrame: HTMLIFrameElement | null = null;
	private printUrl: string | null = null;
	private viewport: HTMLElement | null = null;
	private content: HTMLElement | null = null;
	private io: IntersectionObserver | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private pageEls = new SvelteMap<number, HTMLElement>();
	/** Per-page text items, keyed by page number. Plain object: never read reactively. */
	private textCache: Record<number, string[]> = {};
	private scrollRaf = 0;
	private searchToken = 0;
	/** True when `page` was updated by scrolling, so the effect must not scroll back. */
	private pageFromScroll = false;

	get canGoPrevious() {
		return this.page > 1;
	}
	get canGoNext() {
		return this.page < this.totalPages;
	}
	get canZoomIn() {
		return this.scale < this.maxScale;
	}
	get canZoomOut() {
		return this.scale > this.minScale;
	}
	/** Effective rotation applied to a page = its intrinsic /Rotate plus the prop. */
	rotationFor(pageRotate: number) {
		return (((pageRotate + this.rotation) % 360) + 360) % 360;
	}

	/** The scroll axis: horizontal orientation scrolls along x, vertical along y. */
	get axis(): 'x' | 'y' {
		return this.orientation === 'horizontal' ? 'x' : 'y';
	}
	private startOf(r: DOMRect) {
		return this.axis === 'x' ? r.left : r.top;
	}
	private sizeOf(r: DOMRect) {
		return this.axis === 'x' ? r.width : r.height;
	}
	private get scrollPos() {
		const viewport = this.viewport;
		if (!viewport) return 0;
		return this.axis === 'x' ? viewport.scrollLeft : viewport.scrollTop;
	}
	// Instant, not smooth: the ScrollArea viewport is overflow:hidden, where
	// scrollTo({behavior:'smooth'}) is an unreliable no-op in some browsers.
	private setScrollPos(value: number) {
		const viewport = this.viewport;
		if (!viewport) return;
		if (this.axis === 'x') viewport.scrollLeft = value;
		else viewport.scrollTop = value;
	}

	constructor(options: PDFViewerOptions) {
		super(options);

		// Reload when the source or password changes
		$effect(() => {
			track(this.src, this.password);
			untrack(() => void this.load());
		});

		// Re-render all visible pages when scale or rotation changes; keep the
		// current page anchored so zoom doesn't scroll away.
		$effect(() => {
			track(this.scale, this.rotation);
			untrack(() => this.anchorAfterReflow());
		});

		// Scroll to the current page when it changes from outside (bind:page,
		// prev/next, search) — but not when the change came from scrolling.
		$effect(() => {
			const page = this.page;
			untrack(() => {
				this.ensureRendered(page);
				if (!this.mounted) {
					this.mounted = true;
				} else {
					this.onPageChange?.(page);
					// Only scroll for explicit navigation (buttons, bind:page, search);
					// a page change that came from scrolling must not scroll back.
					if (this.pageFromScroll) this.pageFromScroll = false;
					else this.scrollToPage(page);
				}
			});
		});

		// Re-apply fit when the fit mode or rotation changes (resize is handled
		// by the ResizeObserver in viewportAttachment).
		$effect(() => {
			track(this.fit, this.rotation);
			untrack(() => this.applyFit());
		});

		// When the view mode or orientation changes the scroller is swapped and
		// scroll resets — keep the current page rendered and scrolled into view.
		$effect(() => {
			track(this.mode, this.orientation);
			untrack(() => {
				this.ensureRendered(this.page);
				// Re-fit after the layout settles (single mode fits differently).
				queueMicrotask(() => {
					this.applyFit();
					if (this.mounted) this.scrollToPage(this.page);
				});
			});
		});

		onDestroy(() => {
			this.loadToken++;
			this.io?.disconnect();
			this.resizeObserver?.disconnect();
			if (this.scrollRaf) cancelAnimationFrame(this.scrollRaf);
			void this.doc?.loadingTask.destroy();
			this.printFrame?.remove();
			if (this.printUrl) URL.revokeObjectURL(this.printUrl);
		});
	}

	load = async () => {
		if (!BROWSER) return;
		const token = ++this.loadToken;
		void this.doc?.loadingTask.destroy();
		this.doc = null;
		this.totalPages = 0;
		this.baseWidth = 0;
		this.baseHeight = 0;
		this.renderPages.clear();
		this.textCache = {};
		this.clearSearch();
		this.loading = true;
		this.error = null;

		try {
			const runtimeAssets = this.runtimeAssets ?? documentViewerAssets.pdf;
			const pdfjs: PDFJSModule =
				this.pdfjs ?? (await loadDocumentViewerRuntime<PDFJSModule>(runtimeAssets.moduleUrl));
			if (
				!pdfjs.GlobalWorkerOptions.workerPort &&
				pdfjs.GlobalWorkerOptions.workerSrc !== runtimeAssets.workerUrl
			) {
				pdfjs.GlobalWorkerOptions.workerSrc = runtimeAssets.workerUrl;
			}
			if (token !== this.loadToken) return;
			this.pdfjs = pdfjs;

			const src = this.src;
			let source: { url: string | URL } | { data: Uint8Array | ArrayBuffer };
			if (typeof src === 'string' || src instanceof URL) {
				source = { url: src };
			} else {
				// pdf.js transfers binary input to its worker, so preserve caller-owned buffers.
				source = { data: src instanceof Uint8Array ? src.slice() : src.slice(0) };
			}
			const doc = await pdfjs.getDocument({
				...source,
				...(this.password ? { password: this.password } : {})
			}).promise;

			if (token !== this.loadToken) {
				void doc.loadingTask.destroy();
				return;
			}

			// Measure page 1 (at its intrinsic rotation) so placeholders reserve
			// the right size before render; the `rotation` prop is applied on top.
			const first = await doc.getPage(1);
			const dims = first.getViewport({ scale: 1 });
			if (token !== this.loadToken) {
				void doc.loadingTask.destroy();
				return;
			}

			this.baseWidth = dims.width;
			this.baseHeight = dims.height;
			this.doc = doc;
			this.totalPages = doc.numPages;
			if (this.page < 1 || this.page > doc.numPages) this.page = 1;
			this.ensureRendered(this.page);
			this.loading = false;
			this.applyFit();
			this.onLoad?.(this);
		} catch (e) {
			if (token !== this.loadToken) return;
			this.loading = false;
			this.error = e instanceof Error ? e : new Error(String(e));
			this.onError?.(this.error);
		}
	};

	// --- Virtualization + current-page tracking -------------------------------

	// Attached to the pages container; derives the shared ScrollArea viewport and
	// wires up the virtualization observer, scroll sync and resize-driven fit.
	attach = (content: HTMLElement) => {
		return untrack(() => {
			const scroller =
				(content.closest('[data-scroll-area-viewport]') as HTMLElement | null) ??
				content.parentElement;
			if (!scroller) return;
			this.viewport = scroller;
			this.content = content;

			if (typeof IntersectionObserver !== 'undefined') {
				this.io = new IntersectionObserver((entries) => this.onIntersect(entries), {
					root: scroller,
					// Render pages within ~1.5 viewports along the scroll axis; discard beyond.
					rootMargin: this.axis === 'x' ? '0px 150%' : '150% 0px',
					threshold: [0, 0.01]
				});
				for (const el of this.pageEls.values()) this.io.observe(el);
			}

			// Coalesce scroll events to one current-page recompute per frame.
			const onScroll = () => {
				if (this.scrollRaf || typeof requestAnimationFrame === 'undefined') {
					if (typeof requestAnimationFrame === 'undefined') this.updateCurrentPage();
					return;
				}
				this.scrollRaf = requestAnimationFrame(() => {
					this.scrollRaf = 0;
					this.updateCurrentPage();
				});
			};
			scroller.addEventListener('scroll', onScroll, { passive: true });

			if (typeof ResizeObserver !== 'undefined') {
				this.resizeObserver = new ResizeObserver(() => this.applyFit());
				this.resizeObserver.observe(scroller);
			}

			// Now that the scroller + content padding are known, fit.
			this.applyFit();

			return () => {
				scroller.removeEventListener('scroll', onScroll);
				this.io?.disconnect();
				this.io = null;
				this.resizeObserver?.disconnect();
				this.resizeObserver = null;
				this.viewport = null;
				this.content = null;
			};
		});
	};

	// Eagerly render the current page and its neighbours so navigation is
	// instant instead of waiting for the IntersectionObserver to catch up (it
	// also covers environments where IO never fires). The observer manages the
	// rest of the set as the user scrolls.
	private ensureRendered = (page: number) => {
		for (let p = page - 1; p <= page + 1; p++) {
			if (p >= 1 && p <= this.totalPages) this.renderPages.add(p);
		}
	};

	registerPage = (pageNumber: number, node: HTMLElement) => {
		this.pageEls.set(pageNumber, node);
		node.dataset.page = String(pageNumber);
		this.io?.observe(node);
		return () => {
			this.io?.unobserve(node);
			this.pageEls.delete(pageNumber);
			this.renderPages.delete(pageNumber);
		};
	};

	/** Scroll the viewport (along the current axis) so `el` is centered. Works
	 * with the overflow:hidden ScrollArea viewport where scrollIntoView is a no-op. */
	scrollElementIntoView = (el: HTMLElement) => {
		const vp = this.viewport;
		if (!vp) return;
		const vr = vp.getBoundingClientRect();
		const er = el.getBoundingClientRect();
		const target =
			this.scrollPos +
			(this.startOf(er) - this.startOf(vr)) -
			(this.sizeOf(vr) - this.sizeOf(er)) / 2;
		this.setScrollPos(Math.max(0, target));
	};

	private onIntersect = (entries: IntersectionObserverEntry[]) => {
		for (const entry of entries) {
			const n = Number((entry.target as HTMLElement).dataset.page);
			if (entry.isIntersecting) this.renderPages.add(n);
			else this.renderPages.delete(n);
		}
		this.updateCurrentPage();
	};

	private updateCurrentPage = () => {
		const vp = this.viewport;
		// In single mode the page is explicit (navigation only); scroll/observer
		// position must never override it, or it fights the slide transition.
		if (!vp || !this.doc || this.mode === 'single') return;
		const vr = vp.getBoundingClientRect();
		const best = getDocumentUnitAtReadingPosition(
			this.page,
			this.startOf(vr),
			this.sizeOf(vr),
			Array.from(this.pageEls, ([unit, element]) => {
				const bounds = element.getBoundingClientRect();
				const start = this.startOf(bounds);
				return { unit, start, end: start + this.sizeOf(bounds) };
			})
		);
		if (best !== this.page) {
			// Scroll-driven change: update the indicator but don't scroll back
			// (that would snap the page into alignment while the user scrolls).
			this.pageFromScroll = true;
			this.page = best;
		}
	};

	private scrollToPage = (pageNumber: number) => {
		const vp = this.viewport;
		const el = this.pageEls.get(pageNumber);
		if (!vp || !el) return;
		const vr = vp.getBoundingClientRect();
		const er = el.getBoundingClientRect();
		const vStart = this.startOf(vr);
		const vSize = this.sizeOf(vr);
		const eStart = this.startOf(er);
		const eSize = this.sizeOf(er);
		// Already substantially visible → don't fight the user's scroll.
		if (eStart >= vStart - 4 && eStart <= vStart + vSize - Math.min(eSize, vSize) / 2) return;
		this.setScrollPos(this.scrollPos + (eStart - vStart));
	};

	private anchorAfterReflow = () => {
		// Keep the current page in view after a scale/rotation reflow.
		const page = this.page;
		queueMicrotask(() => {
			const vp = this.viewport;
			const el = this.pageEls.get(page);
			if (!vp || !el) return;
			const vr = vp.getBoundingClientRect();
			const er = el.getBoundingClientRect();
			this.setScrollPos(this.scrollPos + (this.startOf(er) - this.startOf(vr)));
		});
	};

	// --- Navigation -----------------------------------------------------------

	/** Direction of the last navigation (1 = forward, -1 = back): drives the
	 * single-page slide transition. Set synchronously before `page` changes so
	 * the transition reads the correct value. */
	direction = $state(0);

	previous = () => {
		if (this.canGoPrevious) {
			this.direction = -1;
			this.page = this.page - 1;
		}
	};
	next = () => {
		if (this.canGoNext) {
			this.direction = 1;
			this.page = this.page + 1;
		}
	};
	goTo = (page: number) => {
		const target = Math.min(Math.max(Math.floor(page), 1), this.totalPages || 1);
		if (target > this.page) this.direction = 1;
		else if (target < this.page) this.direction = -1;
		this.page = target;
	};

	// --- Zoom + fit -----------------------------------------------------------

	private setScale = (value: number) => {
		this.scale = Math.min(Math.max(Math.round(value * 100) / 100, this.minScale), this.maxScale);
	};

	zoomIn = () => {
		this.fit = null;
		this.setScale(this.scale + ZOOM_STEP);
	};
	zoomOut = () => {
		this.fit = null;
		this.setScale(this.scale - ZOOM_STEP);
	};
	/** Set an absolute zoom (clears fit mode). Used by pinch / ctrl-wheel. */
	setZoom = (value: number) => {
		this.fit = null;
		this.setScale(value);
	};
	zoomBy = (factor: number) => this.setZoom(this.scale * factor);

	setFit = (mode: FitMode) => {
		this.fit = mode;
		this.applyFit();
	};

	applyFit = () => {
		const vp = this.viewport;
		const content = this.content;
		if (!vp || !content || !this.fit || !this.baseWidth || !this.baseHeight) {
			return;
		}
		// Account for a 90°/270° rotation swapping the rendered width and height.
		const rotated = ((this.rotation % 180) + 180) % 180 === 90;
		const bw = rotated ? this.baseHeight : this.baseWidth;
		const bh = rotated ? this.baseWidth : this.baseHeight;
		// Subtract the pages container's own padding so the fitted page plus its
		// padding exactly fits the viewport (no phantom horizontal scrollbar).
		const cs = getComputedStyle(content);
		const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
		const availW = vp.clientWidth - padX;
		if (availW <= 0) return;
		// Single mode always fits the whole page (a page at a time, no scroll);
		// scroll mode honours 'width' or 'page'.
		if (this.fit === 'width' && this.mode !== 'single') {
			this.setScale(availW / bw);
		} else {
			const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
			const availH = vp.clientHeight - padY;
			this.setScale(Math.min(availW / bw, availH / bh));
		}
	};

	rotate = (degrees: number = 90) => {
		this.rotation = (((this.rotation + degrees) % 360) + 360) % 360;
	};

	// --- View mode + orientation ----------------------------------------------

	toggleMode = () => {
		this.mode = this.mode === 'scroll' ? 'single' : 'scroll';
	};
	toggleOrientation = () => {
		this.orientation = this.orientation === 'vertical' ? 'horizontal' : 'vertical';
	};

	// --- Search ---------------------------------------------------------------

	/** The text of a page as an array of per-item strings (aligned with the text layer). */
	private async pageText(pageNumber: number): Promise<string[]> {
		const cached = this.textCache[pageNumber];
		if (cached) return cached;
		const document = this.doc;
		if (!document) throw new Error('No PDF document is loaded.');
		const page = await document.getPage(pageNumber);
		const content = await page.getTextContent();
		const strs = content.items.map((i) => i.str);
		this.textCache[pageNumber] = strs;
		return strs;
	}

	search = async (query: string) => {
		this.query = query;
		const trimmed = query.trim();
		if (!this.doc || trimmed.length < 1) {
			this.matches = [];
			this.activeMatch = -1;
			return;
		}
		const docToken = this.loadToken;
		const token = ++this.searchToken;
		const needle = trimmed.toLowerCase();
		const found: SearchMatch[] = [];
		for (let p = 1; p <= this.totalPages; p++) {
			const text = (await this.pageText(p)).join('');
			// Bail if the document reloaded or a newer search superseded this one.
			if (docToken !== this.loadToken || token !== this.searchToken) return;
			const haystack = text.toLowerCase();
			let from = 0;
			for (;;) {
				const idx = haystack.indexOf(needle, from);
				if (idx === -1) break;
				found.push({ page: p, start: idx, end: idx + needle.length });
				from = idx + needle.length;
			}
		}
		if (token !== this.searchToken) return;
		this.matches = found;
		this.activeMatch = found.length ? 0 : -1;
		if (found.length) this.goToMatch(0);
	};

	nextMatch = () => {
		if (!this.matches.length) return;
		this.goToMatch((this.activeMatch + 1) % this.matches.length);
	};
	previousMatch = () => {
		if (!this.matches.length) return;
		this.goToMatch((this.activeMatch - 1 + this.matches.length) % this.matches.length);
	};

	private goToMatch = (index: number) => {
		this.activeMatch = index;
		const match = this.matches[index];
		if (match) this.goTo(match.page);
	};

	clearSearch = () => {
		this.query = '';
		this.matches = [];
		this.activeMatch = -1;
		// Invalidate any in-flight search() so it can't repopulate matches (and
		// re-scroll the document) after the search UI has been closed.
		this.searchToken++;
	};

	renderThumbnail = async (canvas: HTMLCanvasElement, pageNumber: number, width: number) => {
		if (!this.doc) throw new Error('No PDF document is loaded.');
		const page = await this.doc.getPage(pageNumber);
		const natural = page.getViewport({ scale: 1, rotation: this.rotationFor(page.rotate) });
		const viewport = page.getViewport({
			scale: width / natural.width,
			rotation: this.rotationFor(page.rotate)
		});
		const context = canvas.getContext('2d');
		if (!context) throw new Error('The browser could not create a PDF thumbnail context.');
		const outputScale = window.devicePixelRatio || 1;
		canvas.width = Math.floor(viewport.width * outputScale);
		canvas.height = Math.floor(viewport.height * outputScale);
		canvas.style.width = `${Math.floor(viewport.width)}px`;
		canvas.style.height = `${Math.floor(viewport.height)}px`;
		await page.render({
			canvasContext: context,
			viewport,
			transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined
		}).promise;
	};

	/** Character ranges (and which is active) to highlight on a given page. */
	matchesForPage(pageNumber: number) {
		const active = this.matches[this.activeMatch];
		const ranges: Array<{ start: number; end: number; active: boolean }> = [];
		for (let i = 0; i < this.matches.length; i++) {
			const m = this.matches[i];
			if (m.page === pageNumber) {
				ranges.push({ start: m.start, end: m.end, active: i === this.activeMatch });
			}
		}
		return { ranges, activeOnPage: active?.page === pageNumber };
	}

	// --- Download + print -----------------------------------------------------

	private getBlob = async (): Promise<Blob> => {
		if (!this.doc) throw new Error('No document loaded');
		const data = await this.doc.getData();
		const copy = new Uint8Array(data.byteLength);
		copy.set(data);
		return new Blob([copy.buffer], { type: 'application/pdf' });
	};

	download = async (name?: string) => {
		const src = this.src;
		let fromUrl: string | undefined;
		if (src instanceof URL) fromUrl = src.pathname.split('/').pop();
		else if (typeof src === 'string') fromUrl = src.split('/').pop()?.split(/[?#]/)[0];
		const fileName = name || this.downloadFileName || fromUrl || 'download.pdf';
		const url = URL.createObjectURL(await this.getBlob());
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileName;
		anchor.rel = 'noopener';
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	};

	// ponytail: prints through the browser's built-in PDF plugin in a hidden
	// iframe (like svelte-pdf); render-to-canvas printing if a plugin-less
	// browser ever matters.
	print = async () => {
		if (this.printUrl) URL.revokeObjectURL(this.printUrl);
		this.printFrame?.remove();
		this.printUrl = URL.createObjectURL(await this.getBlob());
		const iframe = document.createElement('iframe');
		iframe.style.display = 'none';
		iframe.onload = () => {
			setTimeout(() => {
				iframe.focus();
				iframe.contentWindow?.print();
			}, 1);
		};
		iframe.src = this.printUrl;
		document.body.appendChild(iframe);
		this.printFrame = iframe;
	};
}
