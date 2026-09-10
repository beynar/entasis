<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'svelai/button';
	import { Code } from 'svelai/code';
	import { SegmentedControl } from 'svelai/segmented-control';
	import { arrowClockwiseIcon } from 'svelai/icons/arrowClockwise';
	import { arrowUpRightIcon } from 'svelai/icons/arrowUpRight';
	import { desktopIcon } from 'svelai/icons/desktop';
	import { deviceMobileIcon } from 'svelai/icons/deviceMobile';
	import { useClipboard } from '$lib/utils/useClipboard.svelte.js';
	import BlockFrame from './BlockFrame.svelte';
	import type { BlockDefinition } from './catalog/types.js';

	interface Props {
		category: string;
		block: BlockDefinition;
	}

	let { category, block }: Props = $props();
	let view = $state<'preview' | 'source'>('preview');
	let device = $state<'desktop' | 'mobile'>('desktop');
	let revision = $state(0);
	let source = $state<string>();
	let sourceError = $state('');
	let copyError = $state('');
	let copying = $state(false);
	const clipboard = useClipboard();
	const sourceFiles = import.meta.glob<string>('./catalog/*/*.svelte', {
		query: '?raw',
		import: 'default'
	});

	async function loadSource() {
		if (source !== undefined) return source;
		const load = sourceFiles[`./catalog/${block.file}`];
		if (!load) throw new Error(`Source unavailable: ${block.file}`);
		source = await load();
		return source;
	}

	async function showSource(nextView: 'preview' | 'source') {
		view = nextView;
		if (nextView !== 'source') return;
		sourceError = '';
		try {
			await loadSource();
		} catch (error) {
			sourceError = error instanceof Error ? error.message : 'Could not load the source.';
		}
	}

	async function copySource() {
		copying = true;
		copyError = '';
		try {
			const copied = await clipboard.copy(await loadSource());
			if (!copied) copyError = 'Copy was blocked. Open Source to select the code.';
		} catch (error) {
			copyError = error instanceof Error ? error.message : 'Could not copy the source.';
		} finally {
			copying = false;
		}
	}
</script>

<section id={block.id} class="flex min-w-0 scroll-mt-8 flex-col gap-lg">
	<header class="flex flex-wrap items-start justify-between gap-md">
		<div class="flex flex-col gap-xs">
			<a
				href={resolve('/blocks/[category]/[block]', { category, block: block.id })}
				class="w-fit hover:underline"
			>
				<h2 class="text-lg font-semibold tracking-tight text-neutral">{block.title}</h2>
			</a>
			<p class="max-w-3xl text-sm text-neutral/60">{block.description}</p>
		</div>
		<Button
			href={block.reference}
			target="_blank"
			rel="noreferrer"
			variant="link"
			size="small"
			suffix={arrowUpRightIcon}
			class="text-neutral/50"
		>
			Reference
		</Button>
	</header>
	<div class="overflow-hidden rounded-lg border border-neutral-muted bg-surface-canvas">
		<div
			class="flex flex-wrap items-center justify-between gap-md border-b border-neutral-muted p-md"
		>
			<SegmentedControl
				items={[
					{ value: 'preview', label: 'Preview' },
					{ value: 'source', label: 'Source' }
				]}
				value={view}
				onValueChange={showSource}
				ariaLabel={`${block.title} view`}
				size="small"
			/>
			<div class="flex flex-wrap items-center gap-sm">
				{#if view === 'preview'}
					<div class="hidden sm:block">
						<SegmentedControl
							items={[
								{ value: 'desktop', icon: desktopIcon, ariaLabel: 'Desktop preview' },
								{ value: 'mobile', icon: deviceMobileIcon, ariaLabel: 'Mobile preview' }
							] as const}
							bind:value={device}
							ariaLabel={`${block.title} viewport`}
							size="small"
						/>
					</div>
					<Button
						prefix={arrowClockwiseIcon}
						label="Reset preview"
						variant="ghost"
						size="small"
						squared
						onclick={() => (revision += 1)}
					/>
					<Button
						href={`/previews/blocks/${category}/${block.id}`}
						target="_blank"
						label="Open full preview"
						prefix={arrowUpRightIcon}
						variant="ghost"
						size="small"
						squared
					/>
				{/if}
				<Button variant="outline" size="small" loading={copying} onclick={copySource}>
					{clipboard.copied ? 'Copied' : 'Copy code'}
				</Button>
			</div>
		</div>
		{#if copyError}<p role="alert" class="p-lg text-sm text-danger-readable">{copyError}</p>{/if}
		{#if view === 'source'}
			{#if sourceError}
				<div class="flex flex-col items-start gap-md p-xl">
					<p role="alert" class="text-sm text-danger-readable">{sourceError}</p>
					<Button variant="outline" onclick={() => showSource('source')}>Retry</Button>
				</div>
			{:else if source !== undefined}
				<Code code={source} language="svelte" showHeader={false} showLineNumbers maxHeight={640} />
			{:else}
				<p role="status" class="p-xl text-sm text-neutral/60">Loading source…</p>
			{/if}
		{:else}
			<div class="bg-surface-recessed">
				{#key revision}
					<BlockFrame {category} block={block.id} title={block.title} {device} />
				{/key}
			</div>
		{/if}
	</div>
	<p class="text-xs text-neutral/50">Built with {block.components.join(' · ')}</p>
</section>
