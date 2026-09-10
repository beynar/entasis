import type { Slot, WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Sizes } from '../../types/index.js';
import type { DocumentViewerAssetsOverride } from './documentViewer.assets.js';
import type { DocumentViewerState } from './documentViewer.state.svelte.js';
import type { DocumentViewerThemeProps } from './documentViewer.theme.js';

export type DocumentFormat =
	'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'csv' | 'pptx' | 'ppt' | 'pages';

export type DocumentSource = string | URL | Blob | Uint8Array | ArrayBuffer;
export type DocumentUnit = 'page' | 'slide' | 'sheet' | 'flow';
export type DocumentFitMode = 'width' | 'page' | null;
export type DocumentViewMode = 'scroll' | 'single';
export type DocumentOrientation = 'vertical' | 'horizontal';
export type DocumentToolbarPosition = 'top' | 'bottom' | 'left' | 'right';

export type DocumentViewerControl =
	| 'sidebar'
	| 'navigation'
	| 'pageInfo'
	| 'zoom'
	| 'fit'
	| 'mode'
	| 'orientation'
	| 'rotate'
	| 'search'
	| 'download'
	| 'print';

export interface DocumentViewerCapabilities {
	sidebar: boolean;
	navigation: boolean;
	pageInfo: boolean;
	zoom: boolean;
	fit: boolean;
	mode: boolean;
	orientation: boolean;
	rotate: boolean;
	search: boolean;
	download: boolean;
	print: boolean;
	sheetTabs: boolean;
}

export interface DocumentSearchMatch {
	/** One-based page, slide, or sheet number. */
	unit: number;
	text: string;
	row?: number;
	column?: number;
}

export interface DocumentThumbnailPayload {
	viewer: DocumentViewerState;
	index: number;
}

export type DocumentViewerProps = WithAttachments<
	WithSlot<
		{
			/** Bindable reference to the root viewer element. Defaults to `null`. */
			ref?: HTMLElement | null;
			/** Document URL, blob, or binary data to load in the browser. */
			src: DocumentSource;
			/** Explicit format override; otherwise detected from name, MIME type, then bytes. */
			format?: DocumentFormat;
			/** Name used for format detection and as the default download filename. */
			fileName?: string;
			/** Bindable one-based current page or slide. Defaults to `1`. */
			page?: number;
			/** Bindable one-based current workbook sheet. Defaults to `1`. */
			sheet?: number;
			/** Bindable document zoom multiplier. Defaults to `1`. */
			scale?: number;
			/** Bindable clockwise PDF rotation in degrees. Defaults to `0`. */
			rotation?: number;
			/** Bindable loaded page or slide count. Defaults to `0`. */
			totalPages?: number;
			/** Minimum manual zoom multiplier. Defaults to `0.5`. */
			minScale?: number;
			/** Maximum zoom multiplier. Defaults to `3`. */
			maxScale?: number;
			/** Bindable automatic sizing mode; `null` preserves manual zoom. Defaults to `'width'`. */
			fit?: DocumentFitMode;
			/** Bindable paged-document layout mode. Defaults to `'scroll'`. */
			mode?: DocumentViewMode;
			/** Bindable continuous page layout direction. Defaults to `'vertical'`. */
			orientation?: DocumentOrientation;
			/** Animates PDF page changes in single-page mode. Defaults to `true`. */
			pageTransition?: boolean;
			/** Password supplied to PDF, DOCX, or PPTX parsers. */
			password?: string;
			/** Download filename override. Defaults to the source name or `download.<format>`. */
			downloadFileName?: string;
			/** Ordered toolbar controls; unsupported controls are omitted. `false` hides the toolbar. */
			controls?: DocumentViewerControl[] | false;
			/** Toolbar edge. Defaults to `'top'`. */
			toolbarPosition?: DocumentToolbarPosition;
			/** Enables thumbnail navigation for paged formats. Defaults to `true`. */
			sidebar?: boolean;
			/** Shows workbook sheet tabs when available. Defaults to `true`. */
			sheetTabs?: boolean;
			/** Per-format runtime asset URL overrides merged with the pinned defaults. */
			assets?: DocumentViewerAssetsOverride;
			/** Viewer and toolbar sizing scale. Defaults to `'normal'`. */
			size?: Sizes;
			/** Toolbar control color. Defaults to `'neutral'`. */
			color?: Colors;
			/** Called after the active document model is ready. */
			onLoad?: (viewer: DocumentViewerState) => void;
			/** Called when document loading or rendering fails. */
			onError?: (error: Error) => void;
			/** Called once for each distinct non-fatal fidelity warning. */
			onWarning?: (warning: string) => void;
			/** Called when the one-based current page or slide changes. */
			onPageChange?: (page: number) => void;
			/** Called when the one-based current workbook sheet changes. */
			onSheetChange?: (sheet: number) => void;
			/** Replaces each thumbnail preview; receives the viewer and one-based index. */
			thumbnail?: Slot<DocumentThumbnailPayload>;
			/** Classes added to the root viewer element. */
			class?: string;
			/** Per-instance stable-part theme overrides. */
			theme?: DocumentViewerThemeProps;
		},
		'toolbar' | 'error',
		DocumentViewerState
	>
>;
