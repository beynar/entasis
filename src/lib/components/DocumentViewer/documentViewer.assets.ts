export interface DocumentViewerAssets {
	pdf: {
		moduleUrl: string;
		workerUrl: string;
		/**
		 * Loads pdf.js from your own bundle instead of `moduleUrl` (`() => import('pdfjs-dist')`),
		 * so no CDN is reached: pair it with a same-origin `workerUrl`
		 * (`import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'`).
		 */
		load?: () => Promise<unknown>;
	};
	docx: {
		moduleUrl: string;
		wasmUrl?: string;
	};
	pptx: {
		moduleUrl: string;
		wasmUrl?: string;
	};
	spreadsheet: {
		moduleUrl: string;
		codepageUrl: string;
	};
	csv: {
		moduleUrl: string;
	};
	legacy: {
		moduleUrl: string;
		wasmUrl?: string;
	};
}

export type DocumentViewerAssetsOverride = {
	[K in keyof DocumentViewerAssets]?: Partial<DocumentViewerAssets[K]>;
};

const PDFJS_VERSION = '5.4.149';
const PDFJS_BASE_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;
const OOXML_BASE_URL = 'https://cdn.jsdelivr.net/npm/@silurus/ooxml@0.72.2/dist';
const SHEETJS_BASE_URL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package';
const OFFICE_OXIDE_BASE_URL = 'https://cdn.jsdelivr.net/npm/office-oxide-wasm@0.1.8/web';

export const documentViewerAssets: DocumentViewerAssets = {
	pdf: {
		moduleUrl: `${PDFJS_BASE_URL}/pdf.min.mjs`,
		workerUrl: `${PDFJS_BASE_URL}/pdf.worker.min.mjs`
	},
	docx: {
		moduleUrl: `${OOXML_BASE_URL}/docx.mjs`,
		wasmUrl: `${OOXML_BASE_URL}/docx_parser_bg.wasm`
	},
	pptx: {
		moduleUrl: `${OOXML_BASE_URL}/pptx.mjs`,
		wasmUrl: `${OOXML_BASE_URL}/pptx_parser_bg.wasm`
	},
	spreadsheet: {
		moduleUrl: `${SHEETJS_BASE_URL}/xlsx.mjs`,
		codepageUrl: `${SHEETJS_BASE_URL}/dist/cpexcel.full.mjs`
	},
	csv: {
		moduleUrl: 'https://cdn.jsdelivr.net/npm/papaparse@5.5.4/+esm'
	},
	legacy: {
		moduleUrl: `${OFFICE_OXIDE_BASE_URL}/office_oxide.js`,
		wasmUrl: `${OFFICE_OXIDE_BASE_URL}/office_oxide_bg.wasm`
	}
};

export const resolveDocumentViewerAssets = (
	overrides?: DocumentViewerAssetsOverride
): DocumentViewerAssets => ({
	pdf: { ...documentViewerAssets.pdf, ...overrides?.pdf },
	docx: { ...documentViewerAssets.docx, ...overrides?.docx },
	pptx: { ...documentViewerAssets.pptx, ...overrides?.pptx },
	spreadsheet: { ...documentViewerAssets.spreadsheet, ...overrides?.spreadsheet },
	csv: { ...documentViewerAssets.csv, ...overrides?.csv },
	legacy: { ...documentViewerAssets.legacy, ...overrides?.legacy }
});

const runtimeModules = new Map<string, Promise<unknown>>();

/** Load one pinned remote runtime, deduplicating concurrent viewers by URL. */
export const loadDocumentViewerRuntime = <Runtime>(url: string): Promise<Runtime> => {
	const cached = runtimeModules.get(url);
	// The cache is URL-keyed across runtime shapes; each adapter validates the exports it consumes.
	if (cached) return cached as Promise<Runtime>;

	const pending = import(/* @vite-ignore */ url).catch((error: unknown) => {
		runtimeModules.delete(url);
		throw error;
	});
	runtimeModules.set(url, pending);
	return pending as Promise<Runtime>;
};

export const clearDocumentViewerRuntimeCache = () => runtimeModules.clear();
