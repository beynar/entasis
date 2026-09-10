<script lang="ts">
	import DocumentViewer from '$lib/components/DocumentViewer/DocumentViewer.svelte';
	import type {
		DocumentFormat,
		DocumentViewMode
	} from '$lib/components/DocumentViewer/documentViewer.props.js';
	import { Select } from '$lib/components/Form/Select/index.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { colors, sizes } from '$lib/utils/tokens.js';

	type DemoFormat = Exclude<DocumentFormat, 'pages'>;
	type DemoDocument = {
		format: DemoFormat;
		label: string;
		src: string;
		description: string;
	};

	const pdfDocument: DemoDocument = {
		format: 'pdf',
		label: 'PDF',
		src: '/sample.pdf',
		description: 'Continuous pages, rotation, search, links, thumbnails, download, and print.'
	};
	const demoDocuments: DemoDocument[] = [
		pdfDocument,
		{
			format: 'docx',
			label: 'Word — DOCX',
			src: '/document-viewer/sample.docx',
			description: 'Rendered Word pages with selectable text, search, zoom, and thumbnails.'
		},
		{
			format: 'doc',
			label: 'Word — DOC',
			src: '/document-viewer/sample.doc',
			description: 'Best-effort legacy Word preview with explicit fidelity guidance.'
		},
		{
			format: 'xlsx',
			label: 'Excel — XLSX',
			src: '/document-viewer/sample.xlsx',
			description:
				'Virtualized workbook grid with merged cells and three keyboard-accessible sheets.'
		},
		{
			format: 'xls',
			label: 'Excel — XLS',
			src: '/document-viewer/sample.xls',
			description: 'Legacy workbook parsing with dimensions, formats, and bottom sheet tabs.'
		},
		{
			format: 'csv',
			label: 'CSV',
			src: '/document-viewer/sample.csv',
			description: 'A virtualized grid parsed in its own worker, without workbook tabs.'
		},
		{
			format: 'pptx',
			label: 'PowerPoint — PPTX',
			src: '/document-viewer/sample.pptx',
			description: 'Rendered slides with search, paging, thumbnails, zoom, download, and print.'
		},
		{
			format: 'ppt',
			label: 'PowerPoint — PPT',
			src: '/document-viewer/sample.ppt',
			description: 'Best-effort legacy slide extraction with a persistent fidelity warning.'
		}
	];
	const demoItems = demoDocuments.map(({ format, label }) => ({ value: format, label }));
	const modeItems = [
		{ value: 'single', label: 'Single page' },
		{ value: 'scroll', label: 'Scroll' }
	] as const;
	let selectedFormat = $state<string | null>('pdf');
	let mode = $state<DocumentViewMode>('scroll');
	let page = $state(1);
	let sheet = $state(1);

	const toolbarPositions = ['top', 'bottom', 'left', 'right'] as const;
	const orientations = ['vertical', 'horizontal'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		},
		{
			name: 'orientation',
			type: 'segmented',
			label: 'Orientation',
			value: 'vertical',
			options: orientations
		},
		{
			name: 'toolbarPosition',
			type: 'segmented',
			label: 'Toolbar',
			value: 'top',
			options: toolbarPositions
		},
		{ name: 'sidebar', type: 'switch', label: 'Sidebar', value: true }
	]);
	const activeDocument = $derived(
		demoDocuments.find(({ format }) => format === selectedFormat) ?? pdfDocument
	);

	$effect(() => {
		activeDocument.format;
		page = 1;
		sheet = 1;
	});
</script>

<DocPage
	title="DocumentViewer"
	subtitle="One read-only viewer for PDF, Word, Excel, CSV, and PowerPoint documents, with controls that adapt to the active format."
	component="DocumentViewer"
	features={[
		'Heavy engines load by format from pinned CDN assets',
		'Thumbnail pager for documents and presentations',
		'Virtualized spreadsheet grid with bottom sheet tabs',
		'Bindable one-based page and sheet navigation',
		'No React runtime or upload UI'
	]}
>
	<ComponentCard
		{controls}
		class="!min-h-fit !items-stretch !justify-start max-w-[90vw]"
		code={`<div class="h-[720px]">
  <DocumentViewer
    src="${activeDocument.src}"
    format="${activeDocument.format}"
    mode="${mode}"
    size="${controls.value.size}"
    color="${controls.value.color}"
    orientation="${controls.value.orientation}"
    toolbarPosition="${controls.value.toolbarPosition}"
    sidebar={${controls.value.sidebar}}
  />
</div>`}
	>
		<div class="mx-auto flex w-full max-w-[960px] min-w-0 flex-col gap-4">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
				<div class="w-full shrink-0 sm:max-w-72">
					<Select label="Preview format" items={demoItems} bind:value={selectedFormat} />
				</div>
				<div class="flex shrink-0 flex-col gap-1.5">
					<span class="text-sm font-medium text-neutral">Navigation</span>
					<SegmentedControl
						items={modeItems}
						bind:value={mode}
						size="small"
						ariaLabel="Document navigation mode"
					/>
				</div>
				<p class="text-neutral/65 pb-2 text-sm sm:min-w-0 sm:flex-1">
					<span class="font-semibold text-neutral">{activeDocument.label}</span>
					— {activeDocument.description}
				</p>
			</div>
			<div class="h-[720px] w-full">
				<DocumentViewer
					src={activeDocument.src}
					format={activeDocument.format}
					fileName={activeDocument.src.split('/').pop()}
					bind:page
					bind:sheet
					bind:mode
					size={controls.value.size}
					color={controls.value.color}
					orientation={controls.value.orientation}
					toolbarPosition={controls.value.toolbarPosition}
					sidebar={controls.value.sidebar}
				/>
			</div>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="The filename can provide the format when the source is an anonymous Blob or byte buffer."
			class="!min-h-fit !items-stretch !justify-start max-w-[90vw]"
			code={`<div class="h-[600px]">
  <DocumentViewer
    src={bytes}
    fileName="quarterly-report.xlsx"
    bind:sheet
  />
</div>`}
		>
			<div class="mx-auto h-[600px] w-full max-w-[960px]">
				<DocumentViewer
					src="/sample.pdf"
					fileName="sample.pdf"
					controls={['sidebar', 'navigation', 'pageInfo', 'zoom', 'search', 'download']}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Self-host every runtime asset by overriding only the relevant URLs."
			class="!min-h-fit !items-stretch !justify-start max-w-[90vw]"
			code={`<DocumentViewer
  src="/deck.pptx"
  assets={{
    pptx: {
      moduleUrl: '/document-runtime/pptx.mjs',
      wasmUrl: '/document-runtime/pptx_parser_bg.wasm'
    }
  }}
/>`}
		>
			<div class="text-neutral/70 max-w-2xl space-y-2 text-sm">
				<p>
					The default manifest is version-pinned. Override it when your Content Security Policy
					requires self-hosted JavaScript, workers, or WebAssembly.
				</p>
				<p>
					With the default manifest, allow <code>cdnjs.cloudflare.com</code>,
					<code>cdn.jsdelivr.net</code>, and <code>cdn.sheetjs.com</code> in
					<code>script-src</code> and <code>connect-src</code>; add <code>worker-src blob:</code>
					and <code>'wasm-unsafe-eval'</code> to <code>script-src</code>. Self-hosted URLs need
					their own origins instead.
				</p>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
