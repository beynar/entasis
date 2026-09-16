import { bind } from '$lib/utils/state.svelte.js';
import { onDestroy, untrack } from 'svelte';
import { SvelteURL } from 'svelte/reactivity';
import {
	resolveDocumentViewerAssets,
	type DocumentViewerAssets,
	type DocumentViewerAssetsOverride
} from './documentViewer.assets.js';
import type {
	DocumentFitMode,
	DocumentFormat,
	DocumentOrientation,
	DocumentSearchMatch,
	DocumentUnit,
	DocumentViewerCapabilities,
	DocumentViewerProps,
	DocumentViewMode
} from './documentViewer.props.js';
import { DocumentLoading } from './documentLoading.svelte.js';
import { DocumentSearch } from './documentSearch.svelte.js';
import { DocumentOutput } from './documentOutput.js';
import {
	buildOoxmlTextLayer,
	getOoxmlNaturalSize,
	renderOoxmlUnit,
	resolveOoxmlInternalLink,
	type OoxmlHyperlinkTarget,
	type OoxmlModel,
	type OoxmlTextRun
} from './ooxmlAdapter.js';
import type { SpreadsheetModel } from './spreadsheetAdapter.js';
import type { LegacyOfficeModel } from './legacyOfficeAdapter.js';

export interface PdfDocumentModel {
	kind: 'pdf';
	format: 'pdf';
	id: number;
	bytes: Uint8Array;
}

export type DocumentViewerModel =
	PdfDocumentModel | OoxmlModel | SpreadsheetModel | LegacyOfficeModel;

export interface SurfaceSearchState {
	matches: DocumentSearchMatch[];
	activeMatch: number;
}

export interface DocumentSurfaceController {
	search?(query: string): Promise<SurfaceSearchState>;
	nextMatch?(): SurfaceSearchState;
	previousMatch?(): SurfaceSearchState;
	clearSearch?(): void;
	print?(): Promise<void>;
	renderThumbnail?(canvas: HTMLCanvasElement, index: number, width: number): Promise<void>;
}

interface DocumentViewerOptions extends Pick<
	DocumentViewerProps,
	| 'src'
	| 'fileName'
	| 'password'
	| 'downloadFileName'
	| 'onLoad'
	| 'onError'
	| 'onWarning'
	| 'onPageChange'
	| 'onSheetChange'
> {
	requestedFormat?: DocumentFormat;
	assets?: DocumentViewerAssetsOverride;
	page: number;
	sheet: number;
	scale: number;
	rotation: number;
	totalPages: number;
	minScale: number;
	maxScale: number;
	fit: DocumentFitMode;
	mode: DocumentViewMode;
	orientation: DocumentOrientation;
}

const noCapabilities: DocumentViewerCapabilities = {
	sidebar: false,
	navigation: false,
	pageInfo: false,
	zoom: false,
	fit: false,
	mode: false,
	orientation: false,
	rotate: false,
	search: false,
	download: false,
	print: false,
	sheetTabs: false
};

const pagedCapabilities: DocumentViewerCapabilities = {
	...noCapabilities,
	sidebar: true,
	navigation: true,
	pageInfo: true,
	zoom: true,
	fit: true,
	mode: true,
	search: true,
	download: true,
	print: true
};

const pdfCapabilities: DocumentViewerCapabilities = {
	...pagedCapabilities,
	orientation: true,
	rotate: true
};

const wordCapabilities: DocumentViewerCapabilities = {
	...pagedCapabilities,
	orientation: true
};

const spreadsheetCapabilities: DocumentViewerCapabilities = {
	...noCapabilities,
	zoom: true,
	search: true,
	download: true,
	sheetTabs: true
};

// `bind(this, options)` installs the option properties on the instance; this type-only base
// class is what declares them to TypeScript. (Merging an empty `interface` into the class
// would be unsafe declaration merging: the interface promises members the class never defines.)
const DocumentViewerOptionsBase = class {} as unknown as new () => DocumentViewerOptions;

export class DocumentViewerState extends DocumentViewerOptionsBase {
	model: DocumentViewerModel | null = $state.raw(null);
	format: DocumentFormat | null = $state(null);
	loading = $state(true);
	error: Error | null = $state(null);
	warning: string | null = $state(null);
	warnings = $state<string[]>([]);
	sheetNames = $state<string[]>([]);
	surfaceRevision = $state(0);

	private surface: DocumentSurfaceController | null = null;
	private readonly documentLoading = new DocumentLoading(this);
	private readonly documentSearch = new DocumentSearch(this);
	private readonly documentOutput = new DocumentOutput(this, this.documentLoading);

	get query() {
		return this.documentSearch.query;
	}

	get matches(): DocumentSearchMatch[] {
		return this.documentSearch.matches;
	}

	get activeMatch() {
		return this.documentSearch.activeMatch;
	}

	get unit(): DocumentUnit | null {
		switch (this.format) {
			case 'pdf':
			case 'docx':
			case 'doc':
				return 'page';
			case 'pptx':
			case 'ppt':
				return 'slide';
			case 'xlsx':
			case 'xls':
			case 'csv':
				return 'sheet';
			default:
				return null;
		}
	}

	get capabilities(): DocumentViewerCapabilities {
		switch (this.format) {
			case 'pdf':
				return pdfCapabilities;
			case 'docx':
			case 'doc':
				return wordCapabilities;
			case 'pptx':
			case 'ppt':
				return pagedCapabilities;
			case 'xlsx':
			case 'xls':
				return spreadsheetCapabilities;
			case 'csv':
				return { ...spreadsheetCapabilities, sheetTabs: false };
			default:
				return noCapabilities;
		}
	}

	get unitCount() {
		return this.unit === 'sheet' ? this.sheetNames.length : this.totalPages;
	}

	get isReady() {
		return !!this.model && !this.loading && !this.error;
	}

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

	get resolvedAssets(): DocumentViewerAssets {
		return resolveDocumentViewerAssets(this.assets);
	}

	constructor(options: DocumentViewerOptions) {
		super();
		bind(this, options);

		$effect(() => {
			void [this.src, this.requestedFormat, this.fileName, this.password, this.assets];
			untrack(() => void this.documentLoading.load());
		});

		let currentPage = this.page;
		$effect(() => {
			const page = this.page;
			untrack(() => {
				if (page === currentPage) return;
				currentPage = page;
				this.onPageChange?.(page);
			});
		});

		let currentSheet = this.sheet;
		$effect(() => {
			const sheet = this.sheet;
			untrack(() => {
				if (sheet === currentSheet) return;
				currentSheet = sheet;
				this.onSheetChange?.(sheet);
			});
		});

		onDestroy(() => {
			this.documentSearch.cancel();
			this.documentLoading.dispose();
			this.documentOutput.dispose();
		});
	}

	reportWarning = (warning: string) => {
		const message = warning.trim();
		if (!message || this.warnings.includes(message)) return;
		this.warnings = [...this.warnings, message];
		this.warning = this.warnings.join(' ');
		this.onWarning?.(message);
	};

	resetDocument = () => {
		this.totalPages = 0;
		this.sheetNames = [];
		this.sheet = 1;
		this.warning = null;
		this.warnings = [];
		this.documentSearch.clear();
		this.error = null;
		this.loading = true;
	};

	resetSurface = () => {
		this.surface = null;
		this.surfaceRevision++;
	};

	reportLoadError = (error: Error) => {
		this.loading = false;
		this.error = error;
		this.onError?.(error);
	};

	setSurfaceController = (surface: DocumentSurfaceController | null) => {
		this.surface = surface;
		this.surfaceRevision++;
	};

	getSurfaceController = () => this.surface;

	completePdfLoad = (totalPages: number) => {
		if (this.model?.kind !== 'pdf') return;
		this.totalPages = totalPages;
		this.documentLoading.finishLoad();
	};

	reportSurfaceError = (error: Error) => {
		this.loading = false;
		this.error = error;
		this.onError?.(error);
	};

	previous = () => {
		if (this.canGoPrevious) this.page -= 1;
	};

	next = () => {
		if (this.canGoNext) this.page += 1;
	};

	goTo = (page: number) => {
		this.page = Math.min(Math.max(Math.floor(page), 1), this.totalPages || 1);
	};

	setSheet = (sheet: number) => {
		this.sheet = Math.min(Math.max(Math.floor(sheet), 1), this.sheetNames.length || 1);
	};

	private setScale = (scale: number, minimum = this.minScale) => {
		this.scale = Math.min(Math.max(Math.round(scale * 100) / 100, minimum), this.maxScale);
	};

	private setManualScale = (scale: number) => {
		this.fit = null;
		this.setScale(scale);
	};

	setScaleFromSurface = (scale: number) => this.setScale(scale, 0.01);

	zoomIn = () => this.setManualScale(this.scale + 0.25);

	zoomOut = () => this.setManualScale(this.scale - 0.25);

	setZoom = (scale: number) => this.setManualScale(scale);

	zoomBy = (factor: number) => this.setZoom(this.scale * factor);

	setFit = (fit: DocumentFitMode) => {
		this.fit = fit;
	};

	rotate = (degrees = 90) => {
		this.rotation = (((this.rotation + degrees) % 360) + 360) % 360;
	};

	toggleMode = () => {
		this.mode = this.mode === 'scroll' ? 'single' : 'scroll';
	};

	toggleOrientation = () => {
		this.orientation = this.orientation === 'vertical' ? 'horizontal' : 'vertical';
	};

	search = this.documentSearch.search;
	nextMatch = this.documentSearch.next;
	previousMatch = this.documentSearch.previous;
	clearSearch = this.documentSearch.clear;

	renderThumbnail = async (canvas: HTMLCanvasElement, index: number, width: number) => {
		void this.surfaceRevision;
		if (this.surface?.renderThumbnail) {
			await this.surface.renderThumbnail(canvas, index, width);
			return;
		}
		if (this.model?.kind !== 'ooxml') return;
		const size = getOoxmlNaturalSize(this.model, index - 1);
		const bitmap = await renderOoxmlUnit(this.model, index - 1, width, 1);
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		canvas.style.width = `${width}px`;
		canvas.style.height = `${Math.round((width * size.height) / size.width)}px`;
		const context = canvas.getContext('2d');
		if (!context) {
			bitmap.close();
			throw new Error('The browser could not create a thumbnail canvas context.');
		}
		context.drawImage(bitmap, 0, 0);
		bitmap.close();
	};

	handleOoxmlLink = (target: OoxmlHyperlinkTarget) => {
		const model = this.model;
		if (model?.kind !== 'ooxml') return;
		if (target.kind === 'internal') {
			const index = resolveOoxmlInternalLink(model, target, this.page - 1);
			if (index !== undefined) this.goTo(index + 1);
			return;
		}
		let url: SvelteURL;
		try {
			url = new SvelteURL(target.url, window.location.href);
		} catch {
			return;
		}
		if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return;
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	buildOoxmlTextLayer = (
		layer: HTMLDivElement,
		runs: OoxmlTextRun[],
		width: number,
		height: number
	) => {
		if (this.model?.kind !== 'ooxml') return;
		buildOoxmlTextLayer(this.model, layer, runs, width, height, this.handleOoxmlLink);
	};

	download = this.documentOutput.download;
	print = this.documentOutput.print;
}

export { getOoxmlNaturalSize, renderOoxmlUnit };
