<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { useTheme } from 'entasis/theme';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { checkCircleIcon } from 'entasis/icons/checkCircle';
	import { isOnColor, type Headline, type SectionDensity, type Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { useSectionScope } from '../sectionScope.js';
	import { heroCopy } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const theme = useTheme();
	const scope = useSectionScope();
	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const inPanel = $derived(params.container === 'panel');
	const panel = $derived(params.panel as 'tint' | 'brand' | 'inverse');
	// The copy sits on the panel when there is one, on the section otherwise.
	const onBrand = $derived(isOnColor(inPanel ? panel : tone));
	const inline = $derived(params.layout === 'inline');
	const split = $derived(params.arrangement === 'split');
	// The quiet action lifts off a brand surface as a soft neutral; elsewhere it follows the kit.
	const secondary = $derived(
		onBrand ? ({ color: 'neutral', variant: 'soft' } as const) : kit.quiet()
	);
	// The action card pads one step above the section, like every card in the catalog.
	const cardDensity = $derived(density === 'compact' ? 'normal' : 'comfortable');
	const center = $derived(!inline && params.align === 'center');
	// An inverse panel flips the colour scheme for its subtree, exactly as an inverse section does.
	// Panels only sit on quiet sections, so the global scheme is the one to flip.
	const flipped = $derived(
		inPanel && panel === 'inverse' ? (theme.resolvedTheme === 'dark' ? 'light' : 'dark') : undefined
	);
	const panelSurface = {
		tint: 'bg-primary-muted text-neutral',
		brand: 'bg-primary text-primary-contrast',
		inverse: 'bg-surface text-neutral'
	};
	const panelPad: Record<SectionDensity, string> = {
		compact: 'p-layout-md @min-[48rem]/section:p-layout-lg',
		normal: 'p-layout-md @min-[48rem]/section:p-layout-xl',
		comfortable: 'p-layout-md @min-[48rem]/section:p-layout-xl'
	};

	const copy = {
		title: 'Ready to plan the next quarter together?',
		body: 'Bring your roadmap over in an afternoon. Your team will feel the difference by the first review.',
		note: 'Free for up to 5 members · No credit card required'
	};
	const checklist = [
		'Import from Jira, Linear, or a spreadsheet',
		'Unlimited plans for up to 5 members',
		'Cancel anytime and keep your data'
	];
</script>

{#snippet actions(justify: string)}
	<div class="gap-md flex flex-wrap {justify}">
		<Button
			href={resolve('/blocks/generative')}
			size={kit.step(1)}
			suffix={arrowRightIcon}
			{...kit.action(onBrand)}>{heroCopy.primary}</Button
		>
		{#if params.buttons === 2}
			<Button href={resolve('/blocks/generative')} size={kit.step(1)} {...secondary}
				>{heroCopy.secondary}</Button
			>
		{/if}
	</div>
	{#if params.note}
		<p class="text-xs {onBrand ? 'text-primary-contrast/85' : 'text-neutral/70'}">{copy.note}</p>
	{/if}
{/snippet}

{#snippet body()}
	{#if split}
		<!-- The copy on the section, the actions boxed in a card with what the trial includes. -->
		<div class="gen-grid items-center">
			<div class="gen-col" style:--gen-span={7} style:--gen-row={1}>
				<SectionHeader
					headline={params.headline as Headline}
					title={copy.title}
					body={copy.body}
					{onBrand}
				/>
			</div>
			<div class="gen-col" style:--gen-span={5} style:--gen-start={8} style:--gen-row={1}>
				<Card variant="solid" elevation={2} density={cardDensity}>
					<div class="gap-lg flex flex-col">
						<ul class="gap-sm flex flex-col text-sm">
							{#each checklist as point (point)}
								<li class="gap-sm flex items-start">
									<span class="text-primary-readable" aria-hidden="true"
										>{@render checkCircleIcon()}</span
									>
									{point}
								</li>
							{/each}
						</ul>
						<div class="gap-sm flex flex-col">
							<Button
								href={resolve('/blocks/generative')}
								size={kit.step(1)}
								suffix={arrowRightIcon}
								class="w-full"
								{...kit.action()}>{heroCopy.primary}</Button
							>
							{#if params.buttons === 2}
								<Button
									href={resolve('/blocks/generative')}
									size={kit.step(1)}
									class="w-full"
									{...kit.quiet()}>{heroCopy.secondary}</Button
								>
							{/if}
						</div>
						{#if params.note}
							<p class="text-neutral/70 text-center text-xs">{copy.note}</p>
						{/if}
					</div>
				</Card>
			</div>
		</div>
	{:else if inline}
		<div class="gen-grid items-center">
			<div class="gen-col" style:--gen-span={7} style:--gen-row={1}>
				<SectionHeader
					headline={params.headline as Headline}
					title={copy.title}
					body={copy.body}
					{onBrand}
				/>
			</div>
			<div class="gen-col" style:--gen-span={5} style:--gen-start={8} style:--gen-row={1}>
				<div class="gap-md flex flex-col items-start @min-[48rem]/section:items-end">
					{@render actions('@min-[48rem]/section:justify-end')}
				</div>
			</div>
		</div>
	{:else}
		<SectionHeader
			align={center ? 'center' : 'start'}
			headline={params.headline as Headline}
			title={copy.title}
			body={copy.body}
			{onBrand}
		>
			<div class="gap-md pt-sm flex flex-col {center ? 'items-center' : 'items-start'}">
				{@render actions(center ? 'justify-center' : '')}
			</div>
		</SectionHeader>
	{/if}
{/snippet}

<SectionShell {tone} {density} label="Call to action">
	{#if inPanel}
		<div
			data-panel={panel}
			class="rounded-lg {flipped ?? ''} {panelSurface[panel]} {panelPad[density]}"
			style={flipped ? scope.inverseStyle?.() : undefined}
			style:color-scheme={flipped}
		>
			{@render body()}
		</div>
	{:else}
		{@render body()}
	{/if}
</SectionShell>
