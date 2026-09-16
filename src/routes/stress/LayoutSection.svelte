<script lang="ts">
	import { AspectRatio } from '$lib/components/AspectRatio/index.js';
	import { Grid, GridSpan } from '$lib/components/Grid/index.js';
	import { Resizable } from '$lib/components/Resizable/index.js';
	import { ScrollArea } from '$lib/components/ScrollArea/index.js';
	import { Stack } from '$lib/components/Stack/index.js';
	import Matrix from './Matrix.svelte';
	import Section from './Section.svelte';

	const ratios = ['1x1', '4x3', '16x9', '3x4', '9x16', '2x1'] as const;
	const blocks = ['A', 'B', 'C', 'D'];
	const justifies = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;
</script>

{#snippet tile(label: string, klass = 'h-12')}
	<div
		class="grid {klass} bg-neutral-muted text-neutral/70 min-w-16 place-items-center rounded-md text-xs"
	>
		{label}
	</div>
{/snippet}

<Section
	id="layout"
	title="Layout"
	description="Stack (horizontal + vertical), Grid, GridSpan, AspectRatio, ScrollArea, Resizable."
>
	<Matrix caption="Stack — horizontal" varies="justify, align, gap" layout="stack">
		{#each justifies as justify (justify)}
			<Stack
				orientation="horizontal"
				{justify}
				gap="sm"
				class="border-neutral-muted p-xs rounded-md border"
			>
				{#each blocks as block (block)}
					{@render tile(block)}
				{/each}
			</Stack>
		{/each}
	</Matrix>

	<Matrix caption="Stack — vertical" varies="align, gap" layout="grid">
		{#each ['start', 'center', 'end', 'stretch'] as const as align (align)}
			<Stack
				orientation="vertical"
				{align}
				gap="xs"
				class="border-neutral-muted p-xs rounded-md border"
			>
				{#each blocks.slice(0, 3) as block (block)}
					{@render tile(align + ' ' + block, 'h-8 w-24')}
				{/each}
			</Stack>
		{/each}
	</Matrix>

	<Matrix
		caption="Grid + GridSpan"
		varies="columns (number, auto-fit minWidth), gap, span"
		layout="stack"
	>
		<Grid columns={4} gap="sm">
			{#each blocks as block (block)}
				{@render tile(block)}
			{/each}
		</Grid>
		<Grid columns={{ minWidth: 160, repeat: 'fit' }} gap="sm">
			{#each blocks as block (block)}
				{@render tile('auto-fit ' + block)}
			{/each}
		</Grid>
		<Grid columns={4} gap="sm">
			<GridSpan columns={2}>{@render tile('span 2')}</GridSpan>
			{@render tile('1')}
			{@render tile('1')}
			<GridSpan columns="full">{@render tile('span full')}</GridSpan>
		</Grid>
	</Matrix>

	<Matrix caption="AspectRatio" varies="ratio" layout="grid">
		{#each ratios as ratio (ratio)}
			<AspectRatio {ratio} class="bg-neutral-muted w-40 overflow-hidden rounded-md">
				<div class="text-neutral/70 grid h-full place-items-center text-xs">{ratio}</div>
			</AspectRatio>
		{/each}
	</Matrix>

	<Matrix caption="ScrollArea" varies="type (auto, always, hover), scrollFade" layout="grid">
		{#each ['auto', 'always', 'hover'] as const as type (type)}
			<ScrollArea
				{type}
				class="border-neutral-muted h-32 rounded-md border"
				label="Scroll area {type}"
			>
				<div class="gap-xs p-sm grid">
					{#each Array.from({ length: 14 }, (_, index) => index) as row (row)}
						<p class="text-neutral/70 text-xs">Row {row + 1} — type {type}</p>
					{/each}
				</div>
			</ScrollArea>
		{/each}
		<ScrollArea scrollFade class="border-neutral-muted h-32 rounded-md border" label="Scroll fade">
			<div class="gap-xs p-sm grid">
				{#each Array.from({ length: 14 }, (_, index) => index) as row (row)}
					<p class="text-neutral/70 text-xs">Row {row + 1} — scroll fade</p>
				{/each}
			</div>
		</ScrollArea>
	</Matrix>

	<Matrix caption="Resizable" varies="orientation, variant, handleVariant" layout="stack">
		{#each ['default', 'splitted'] as const as variant (variant)}
			<Resizable
				{variant}
				handle
				class="border-neutral-muted h-40 rounded-lg border"
				panels={[
					{ id: `${variant}-left`, defaultSize: 30, minSize: 15, content: leftPanel },
					{ id: `${variant}-main`, defaultSize: 45, minSize: 25, content: mainPanel },
					{ id: `${variant}-right`, defaultSize: 25, minSize: 15, content: rightPanel }
				]}
			/>
		{/each}
		<Resizable
			orientation="vertical"
			handle
			handleVariant="thumb"
			class="border-neutral-muted h-48 rounded-lg border"
			panels={[
				{ id: 'vertical-top', defaultSize: 50, content: mainPanel },
				{ id: 'vertical-bottom', defaultSize: 50, content: rightPanel }
			]}
		/>
	</Matrix>
</Section>

{#snippet leftPanel()}
	<div class="bg-surface p-sm text-neutral/60 grid h-full place-items-center text-xs">Explorer</div>
{/snippet}
{#snippet mainPanel()}
	<div class="bg-surface p-sm text-neutral/60 grid h-full place-items-center text-xs">Editor</div>
{/snippet}
{#snippet rightPanel()}
	<div class="bg-surface p-sm text-neutral/60 grid h-full place-items-center text-xs">
		Inspector
	</div>
{/snippet}
