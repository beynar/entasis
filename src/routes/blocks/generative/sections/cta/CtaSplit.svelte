<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { TextInput } from 'entasis/text-input';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { envelopeSimpleIcon } from 'entasis/icons/envelopeSimple';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import Media from '../Media.svelte';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { heroCopy } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const density = $derived(params.density as SectionDensity);
	const stacked = $derived(params.layout === 'stacked');
	const textCols = $derived(Number(params.textCols));
	const mediaCols = $derived(12 - textCols);
	// Stacked, pitch and media share one centred column of `textCols`.
	const offset = $derived((12 - textCols) / 2);
	const mediaFirst = $derived(params.mediaSide === 'start');
	const media = $derived(params.media as 'product' | 'photo' | 'pattern');
	// The card pads one step above the section, so the pitch never sits tight against its edge.
	const cardDensity = $derived(density === 'compact' ? 'normal' : 'comfortable');
	const innerPad = {
		compact: '',
		normal: '@min-[48rem]/section:p-md',
		comfortable: '@min-[48rem]/section:p-lg'
	};
	let submitted = $state(false);

	const copy = {
		title: 'See the whole plan in one view.',
		body: 'Import your roadmap, invite the team, and run your first review this week. Meridian keeps everyone on the same page.'
	};
</script>

{#snippet pitch(center: boolean)}
	<SectionHeader
		align={center ? 'center' : 'start'}
		headline={params.headline as Headline}
		title={copy.title}
		body={copy.body}
	>
		{#if params.input}
			<form
				class="gap-md pt-sm flex w-full max-w-md flex-col {center ? 'items-center' : 'items-start'}"
				onsubmit={(event) => {
					event.preventDefault();
					submitted = true;
				}}
			>
				<div class="gap-sm flex w-full">
					<TextInput
						type="email"
						placeholder="you@company.com"
						prefix={envelopeSimpleIcon}
						size={kit.step(1)}
						class="min-w-0 flex-1"
						inputAttrs={{ 'aria-label': 'Work email', autocomplete: 'email' }}
					/>
					<Button type="submit" size={kit.step(1)} {...kit.action()}>{heroCopy.primary}</Button>
				</div>
				<p role="status" class="text-neutral/70 text-xs">
					{submitted
						? 'Check your inbox for your workspace link.'
						: 'Free 14-day trial. No card required.'}
				</p>
			</form>
		{:else}
			<div class="gap-md pt-sm flex flex-wrap {center ? 'justify-center' : ''}">
				<Button
					href={resolve('/blocks/generative')}
					size={kit.step(1)}
					suffix={arrowRightIcon}
					{...kit.action()}>{heroCopy.primary}</Button
				>
				{#if params.buttons === 2}
					<Button href={resolve('/blocks/generative')} size={kit.step(1)} {...kit.quiet()}
						>{heroCopy.secondary}</Button
					>
				{/if}
			</div>
		{/if}
	</SectionHeader>
{/snippet}

<SectionShell tone={params.tone as Tone} {density} label="Call to action">
	<!-- The card is its own raised surface, so the pitch reads the same on every section tone. -->
	<Card variant="solid" elevation={2} density={cardDensity}>
		<div class={innerPad[density]}>
			{#if stacked}
				<!-- Stacked: the pitch centred on the grid, the media below it at the same width. -->
				<div class="gen-grid">
					<div class="gen-col" style:--gen-span={textCols} style:--gen-start={offset + 1}>
						{@render pitch(true)}
					</div>
					<div class="gen-col" style:--gen-span={textCols} style:--gen-start={offset + 1}>
						<Media kind={media} ratio="wide" tone="plain" variant={textCols + 2} />
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
						{@render pitch(false)}
					</div>
					<div
						class="gen-col"
						style:--gen-span={mediaCols}
						style:--gen-start={mediaFirst ? 1 : textCols + 1}
						style:--gen-row={1}
					>
						<Media
							kind={media}
							ratio={mediaCols >= 6 ? 'wide' : 'landscape'}
							tone="plain"
							variant={textCols + 2}
						/>
					</div>
				</div>
			{/if}
		</div>
	</Card>
</SectionShell>
