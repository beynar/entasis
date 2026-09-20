<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import Diff from '$lib/components/Diff/Diff.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import type { DiffFiles } from '$lib/components/Diff/diff.props.js';
	import type { SelectedLineRange } from '@pierre/diffs';

	const oldGreet = `export function greet(name) {
	return 'Hello ' + name;
}

export const LOCALE = 'en-US';
`;

	const newGreet = `export function greet(name: string): string {
	return \`Hello, \${name}!\`;
}

export const LOCALE = 'en-GB';
`;

	const greetFiles: DiffFiles = [
		{ name: 'greet.ts', contents: oldGreet },
		{ name: 'greet.ts', contents: newGreet }
	];

	const oldConfig = `{
	"name": "entasis",
	"version": "1.0.0"
}
`;

	const newConfig = `{
	"name": "entasis",
	"version": "1.1.0",
	"private": true
}
`;

	const configFiles: DiffFiles = [
		{ name: 'config.json', contents: oldConfig },
		{ name: 'config.json', contents: newConfig }
	];

	// A unified patch string spanning a single file. Built as an array so the blank context
	// line keeps its required single leading space (a bare empty line is an invalid hunk line),
	// and the <script> tags are split so Svelte doesn't parse them.
	const unifiedPatch = [
		'diff --git a/counter.svelte b/counter.svelte',
		'index 1111111..2222222 100644',
		'--- a/counter.svelte',
		'+++ b/counter.svelte',
		'@@ -1,6 +1,6 @@',
		' <' + 'script lang="ts">',
		'-\tlet count = 0;',
		'-\tconst double = count * 2;',
		'+\tlet count = $state(0);',
		'+\tconst double = $derived(count * 2);',
		' </' + 'script>',
		' ',
		' <button onclick={() => count++}>clicked {count}</button>'
	].join('\n');

	// Rich intra-line changes so word vs char granularity read very differently: the long
	// identifier shares "Total" in the middle (char keeps it, word replaces the whole token),
	// plus renamed params and a changed number.
	const granularityFiles: DiffFiles = [
		{
			name: 'pricing.ts',
			contents: `export function calculateTotalPrice(items, taxRate) {
	return items.length * taxRate * 1.20;
}
`
		},
		{
			name: 'pricing.ts',
			contents: `export function computeTotalAmount(products, vatRate) {
	return products.length * vatRate * 1.25;
}
`
		}
	];

	// A diff with a long line, to show wrapping vs horizontal scroll.
	const longFiles: DiffFiles = [
		{ name: 'message.ts', contents: `export const message = 'short';\n` },
		{
			name: 'message.ts',
			contents: `export const message = 'a deliberately very long string that overflows the diff container horizontally so the difference between scrolling and wrapping is obvious when toggled';\n`
		}
	];

	let selection = $state<SelectedLineRange | null>(null);
	let diffStyle = $state<'split' | 'unified'>('split');
	let wrap = $state<'scroll' | 'wrap'>('scroll');
	let gutter = $state<'on' | 'off'>('on');
	let backgrounds = $state<'on' | 'off'>('on');
	let indicators = $state<'classic' | 'bars' | 'none'>('classic');
	let granularity = $state<'word' | 'char' | 'none'>('word');
	const controls = createComponentControls([
		{
			name: 'diffStyle',
			type: 'segmented',
			label: 'Layout',
			value: 'split',
			options: ['split', 'unified']
		},
		{ name: 'lineNumbers', type: 'switch', label: 'Line numbers', value: true },
		{ name: 'wrapping', type: 'switch', label: 'Wrap', value: false }
	]);
</script>

{#snippet segmented(current: string, options: string[], onSelect: (value: string) => void)}
	<div class="flex gap-1">
		{#each options as option (option)}
			<Button
				size="small"
				variant={current === option ? 'solid' : 'ghost'}
				color="neutral"
				onclick={() => onSelect(option)}
			>
				{option}
			</Button>
		{/each}
	</div>
{/snippet}

<DocPage
	title="Diff"
	subtitle="Rich split or unified code diffs with syntax highlighting, powered by @pierre/diffs. Colors are shared with the Code component's syntax theme, so they adapt to light and dark automatically."
	component="Diff"
	features={[
		'@pierre/diffs split & unified views',
		'Shared Shiki syntax theme with Code',
		'SSR pre-render via shadow DOM',
		'bind:selection for gutter line selection',
		'role=alert surfaces render errors'
	]}
>
	<ComponentCard
		{controls}
		description="Pass a [oldFile, newFile] tuple to diff raw file contents."
		class="!min-h-fit"
		code={`<Diff
	files={[
		{
			name: 'greet.ts',
			contents: \`export function greet(name) {
	return 'Hello ' + name;
}

export const LOCALE = 'en-US';
\`
		},
		{
			name: 'greet.ts',
			contents: \`export function greet(name: string): string {
	return \`Hello, \${name}!\`;
}

export const LOCALE = 'en-GB';
\`
		}
	]}
	diffStyle="${controls.value.diffStyle}"
	lineNumbers={${controls.value.lineNumbers}}
	wrapping={${controls.value.wrapping}}
/>`}
	>
		<div class="w-full max-w-3xl">
			<Diff
				files={greetFiles}
				diffStyle={controls.value.diffStyle}
				lineNumbers={controls.value.lineNumbers}
				wrapping={controls.value.wrapping}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Pass a [oldFile, newFile] tuple to diff raw file contents. The default is a side-by-side split view."
			class="!min-h-fit"
		>
			<div class="w-full max-w-3xl">
				<Diff files={greetFiles} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Render a unified diff / patch string directly. A single patch can span multiple files."
			class="!min-h-fit"
		>
			<div class="w-full max-w-3xl">
				<Diff patch={unifiedPatch} diffStyle="unified" />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Toggle between side-by-side (split) and inline (unified) layouts with diffStyle."
			class="!min-h-fit"
		>
			<div class="grid w-full max-w-3xl gap-3">
				{@render segmented(
					diffStyle,
					['split', 'unified'],
					(v) => (diffStyle = v as typeof diffStyle)
				)}
				<Diff files={configFiles} {diffStyle} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Long lines scroll horizontally by default; set wrapping to soft-wrap them instead."
			class="!min-h-fit"
		>
			<div class="grid w-full max-w-3xl gap-3">
				{@render segmented(wrap, ['scroll', 'wrap'], (v) => (wrap = v as typeof wrap))}
				<Diff files={longFiles} wrapping={wrap === 'wrap'} />
			</div>
		</ComponentCard>

		<ComponentCard description="Toggle the line-number gutter with lineNumbers." class="!min-h-fit">
			<div class="grid w-full max-w-3xl gap-3">
				{@render segmented(gutter, ['on', 'off'], (v) => (gutter = v as typeof gutter))}
				<Diff files={greetFiles} lineNumbers={gutter === 'on'} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="The tinted added/removed line backgrounds can be turned off for a flatter look with backgrounds."
			class="!min-h-fit"
		>
			<div class="grid w-full max-w-3xl gap-3">
				{@render segmented(
					backgrounds,
					['on', 'off'],
					(v) => (backgrounds = v as typeof backgrounds)
				)}
				<Diff files={configFiles} backgrounds={backgrounds === 'on'} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="The gutter change markers can be classic +/− glyphs, colored bars, or hidden, via diffIndicators."
			class="!min-h-fit"
		>
			<div class="grid w-full max-w-3xl gap-3">
				{@render segmented(
					indicators,
					['classic', 'bars', 'none'],
					(v) => (indicators = v as typeof indicators)
				)}
				<Diff files={configFiles} diffIndicators={indicators} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Highlight what changed within a line by word or character, or disable it, with lineDiffType."
			class="!min-h-fit"
		>
			<div class="grid w-full max-w-3xl gap-3">
				{@render segmented(
					granularity,
					['word', 'char', 'none'],
					(v) => (granularity = v as typeof granularity)
				)}
				<Diff files={granularityFiles} diffStyle="unified" lineDiffType={granularity} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Attach annotations to specific diff lines and render their content with a renderAnnotation snippet."
			class="!min-h-fit"
		>
			<div class="w-full max-w-3xl">
				<Diff
					files={greetFiles}
					lineAnnotations={[{ side: 'additions', lineNumber: 1 }]}
					renderAnnotationClass="block px-3 py-1.5 text-xs text-info bg-info-muted"
				>
					{#snippet renderAnnotation(annotation)}
						Now typed and using a template literal (line {annotation.lineNumber}).
					{/snippet}
				</Diff>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Bind selection to track the user's line selection. Colors auto-adapt to the active light/dark theme via the shared Code syntax palette."
			class="!min-h-fit"
		>
			<div class="grid w-full max-w-3xl gap-2">
				<Diff files={greetFiles} bind:selection />
				<p class="text-neutral/70 text-xs">
					Selection: {selection
						? `${selection.start}–${selection.end}`
						: 'none — drag across the gutter to select lines'}
				</p>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
