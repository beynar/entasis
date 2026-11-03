// pdf.js from the app's own bundle: with `assets.pdf.load`, the viewer imports nothing from a URL,
// so a strict CSP needs no CDN origin, only the app's own worker URL.
import { render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

const runtimeImports = vi.hoisted(() => vi.fn());
vi.mock('../DocumentViewer/documentViewer.assets.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('../DocumentViewer/documentViewer.assets.js')>()),
	loadDocumentViewerRuntime: runtimeImports
}));

const { default: Harness } = await import('./PDFViewerLoadHarness.test.svelte');

describe('PDFViewer runtime loading', () => {
	test('assets.pdf.load supplies pdf.js and the worker URL is the app own', async () => {
		const getDocument = vi.fn(() => ({ promise: Promise.reject(new Error('no document')) }));
		const pdfjs = {
			version: 'test',
			GlobalWorkerOptions: { workerSrc: '', workerPort: null },
			getDocument
		};
		const load = vi.fn(async () => pdfjs);
		const onError = vi.fn();
		render(Harness, {
			options: {
				src: new Uint8Array([37, 80, 68, 70]),
				page: 1,
				scale: 1,
				rotation: 0,
				totalPages: 0,
				minScale: 0.25,
				maxScale: 3,
				fit: 'width',
				mode: 'scroll',
				orientation: 'vertical',
				onError,
				runtimeAssets: {
					moduleUrl: 'https://cdn.example.com/pdf.min.mjs',
					workerUrl: '/pdfjs/pdf.worker.min.mjs',
					load
				}
			},
			onReady: () => {}
		});
		// The viewer loads its document on mount.
		await vi.waitFor(() => expect(getDocument).toHaveBeenCalledOnce());
		expect(load).toHaveBeenCalledOnce();
		expect(runtimeImports).not.toHaveBeenCalled();
		expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/pdfjs/pdf.worker.min.mjs');
	});
});
