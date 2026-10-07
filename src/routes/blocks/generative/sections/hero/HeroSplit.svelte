<script lang="ts">
	import { resolve } from '$app/paths';
	import { AvatarGroup } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Rating } from 'entasis/rating';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import Media from '../Media.svelte';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { heroCopy } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const layout = $derived(params.layout as 'split' | 'overlap' | 'stacked');
	const headline = $derived(params.headline as Headline);
	const textCols = $derived(Number(params.textCols));
	// An overlapping panel reaches 2 columns into the media; stacked media spans the full grid.
	const mediaCols = $derived(
		layout === 'stacked' ? 12 : 12 - textCols + (layout === 'overlap' ? 2 : 0)
	);
	const mediaFirst = $derived(params.mediaSide === 'start');
	const mediaKind = $derived(params.media as 'product' | 'photo' | 'pattern');
	const ratio = $derived(
		layout === 'stacked'
			? 'wide'
			: mediaCols >= 7
				? 'landscape'
				: mediaCols === 6
					? 'square'
					: 'portrait'
	);
	const people = [
		{ name: 'Maya Chen' },
		{ name: 'Theo Park' },
		{ name: 'Nora Ellis' },
		{ name: 'Ravi Shah' }
	];
</script>

{#snippet actions()}
	<div class="gap-md pt-sm flex flex-wrap">
		<Button
			href={resolve('/blocks/generative')}
			size={kit.step(1)}
			{...kit.action()}
			suffix={arrowRightIcon}>{heroCopy.primary}</Button
		>
		{#if params.buttons === 2}
			<Button href={resolve('/blocks/generative')} size={kit.step(1)} {...kit.quiet()}
				>{heroCopy.secondary}</Button
			>
		{/if}
	</div>
	{#if params.proof === 'avatars'}
		<div class="gap-md flex items-center">
			<AvatarGroup size={kit.stack(-1)} items={people} />
			<span class="text-neutral/70 text-sm">Trusted by 9,800 teams</span>
		</div>
	{:else if params.proof === 'rating'}
		<div class="gap-md flex items-center">
			<Rating value={4.9} size={kit.step(-1)} color="warning" />
			<span class="text-neutral/70 text-sm">4.9 from 1,200 reviews</span>
		</div>
	{/if}
{/snippet}

{#snippet header()}
	<SectionHeader
		as="h1"
		lead
		{headline}
		eyebrow={params.eyebrow ? heroCopy.eyebrow : undefined}
		title={heroCopy.title}
		body={heroCopy.body}
	>
		{@render actions()}
	</SectionHeader>
{/snippet}

<SectionShell {tone} {density} label="Introduction">
	{#if layout === 'stacked'}
		<!-- The headline takes its own columns; body and actions sit beside it, over wide media. -->
		<div class="gen-grid items-end">
			<div class="gen-col" style:--gen-span={textCols}>
				<SectionHeader
					as="h1"
					{headline}
					eyebrow={params.eyebrow ? heroCopy.eyebrow : undefined}
					title={heroCopy.title}
				/>
			</div>
			<div
				class="gen-col gap-lg flex flex-col items-start"
				style:--gen-span={12 - textCols}
				style:--gen-start={textCols + 1}
			>
				<p class="text-neutral/70 max-w-2xl text-lg text-pretty">{heroCopy.body}</p>
				{@render actions()}
			</div>
			<div class="gen-col">
				<Media kind={mediaKind} {ratio} {tone} variant={textCols} />
			</div>
		</div>
	{:else if layout === 'overlap'}
		<!-- The panel and the media share a grid row; the panel paints above the 2 shared columns. -->
		<div class="gen-grid items-center">
			<div
				class="gen-col relative z-10"
				style:--gen-span={textCols}
				style:--gen-start={mediaFirst ? 13 - textCols : 1}
				style:--gen-row={1}
			>
				<Card elevation={3} {density}>
					{@render header()}
				</Card>
			</div>
			<div
				class="gen-col"
				style:--gen-span={mediaCols}
				style:--gen-start={mediaFirst ? 1 : textCols - 1}
				style:--gen-row={1}
			>
				<Media kind={mediaKind} {ratio} {tone} variant={textCols} />
			</div>
		</div>
	{:else}
		<div class="gen-grid items-center">
			<div
				class="gen-col"
				style:--gen-span={textCols}
				style:--gen-start={mediaFirst ? mediaCols + 1 : 1}
				style:--gen-row={1}
			>
				{@render header()}
			</div>
			<div
				class="gen-col"
				style:--gen-span={mediaCols}
				style:--gen-start={mediaFirst ? 1 : textCols + 1}
				style:--gen-row={1}
			>
				<Media kind={mediaKind} {ratio} {tone} variant={textCols} />
			</div>
		</div>
	{/if}
</SectionShell>
