export const documentViewerDescription = `
# DocumentViewer Component

A client-only, read-only viewer for PDF, DOCX/DOC, XLSX/XLS, CSV, and PPTX/PPT. It provides one capability-driven toolbar, thumbnail navigation for paged formats, and horizontally scrollable sheet tabs for workbooks. Apple Pages files produce an explicit unsupported-format error.

## Basic usage

\`\`\`svelte
<script lang="ts">
	import { DocumentViewer } from 'entasis/document-viewer';

	let file: File | undefined = $state();
</script>

<div class="h-[600px]">
	<DocumentViewer src="/report.pdf" />
</div>

{#if file}
	<div class="h-[600px]">
		<DocumentViewer src={file} fileName={file.name} />
	</div>
{/if}
\`\`\`

## Source and format

- **src**: string | URL | Blob | Uint8Array | ArrayBuffer (required).
- **format**: 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'csv' | 'pptx' | 'ppt' | 'pages'. Optional explicit override.
- **fileName**: Used for type detection and the default download name when binary input has no name.
- Detection precedence is explicit format, filename/URL extension, MIME type, then binary signature.

The viewer fills its nearest sized parent. Give that parent a definite height; percentage height cannot resolve through an auto-height ancestor.

## Navigation and display

- **page**: one-based current page or slide (bindable).
- **sheet**: one-based current workbook sheet (bindable).
- **mode**: 'scroll' renders continuous pages/slides; 'single' renders only the current page/slide. It is bindable for PDF, DOCX/DOC, and PPTX/PPT.
- **orientation**: 'vertical' or 'horizontal' continuous layout for PDF and DOCX/DOC.
- **scale**, **rotation**, **fit**, **orientation**, and **totalPages** are bindable. Controls that do not apply to the active format are omitted.
- **sidebar**: Show the thumbnail pager for paged documents. Default true.
- **sheetTabs**: Show the bottom workbook tab rail. Default true.
- **controls**: A subset of sidebar, navigation, pageInfo, zoom, fit, mode, orientation, rotate, search, download, and print; false hides the toolbar.
- **DocumentViewerState** exposes format, unit, unitCount, sheetNames, warnings, capabilities, and navigation/search/zoom methods.

## Runtime assets

Heavy parsers are not package dependencies. The active format loads its pinned module, worker, and WASM from the default CDN manifest only after mount. Override individual URLs with the grouped **assets** prop for self-hosting or CSP requirements.

With the defaults, CSP must allow cdnjs.cloudflare.com, cdn.jsdelivr.net, and cdn.sheetjs.com in **script-src** and **connect-src**, add \`worker-src blob:\`, and add \`'wasm-unsafe-eval'\` to **script-src**. When assets are self-hosted, allow their configured origins instead.

Only the active format's assets load: a PDF never reaches the Office, spreadsheet, or CSV runtimes.

### PDF without a CDN

Give pdf.js from your own bundle with **assets.pdf.load**, and its worker from your own origin. Nothing is imported from a URL, so a strict CSP needs no CDN origin: \`script-src 'self'\` and \`worker-src 'self'\` are enough (no \`blob:\`, no \`'wasm-unsafe-eval'\` for PDF).

\`\`\`svelte nocheck
<script lang="ts">
  import { DocumentViewer } from 'entasis/document-viewer';
  // pdfjs-dist is your dependency; Vite serves the worker from your origin.
  import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

  let { src }: { src: string } = $props();
</script>

<DocumentViewer
  {src}
  format="pdf"
  assets={{ pdf: { load: () => import('pdfjs-dist'), workerUrl } }}
/>
\`\`\`

Dynamic \`import()\` cannot carry Subresource Integrity, so CDN URLs cannot be pinned by hash: bundling (above) or self-hosting the files is how a nonce/SRI policy stays strict.

## Events and snippets

- **onLoad**, **onError**, **onWarning**, **onPageChange**, and **onSheetChange** report lifecycle and navigation changes.
- **toolbar** and **error** snippets receive DocumentViewerState.
- **thumbnail** receives { viewer, index } and replaces each default thumbnail preview.

## Fidelity

- PDF preserves the existing selectable text layer, search highlights, links, rotation, view modes, download, and print.
- DOCX and PPTX render in worker mode through headless OOXML canvases with selectable text and sanitized links.
- XLSX/XLS/CSV use a read-only, two-axis virtualized grid. Formulae show cached values; no formula recalculation occurs.
- DOC and PPT are normalized best-effort previews and always show a visible fidelity warning.
`;
