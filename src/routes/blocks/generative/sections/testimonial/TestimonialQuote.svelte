<script lang="ts">
	import { resolve } from '$app/paths';
	import { Avatar } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { quotesIconFill } from 'entasis/icons/quotes';
	import type { SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import Media from '../Media.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { testimonials } from '../content.js';
	import { markForRole } from '../logos/marks.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const testimonial = testimonials[0];
	const jobTitle = testimonial.role.split(', ')[0];
	const company = markForRole(testimonial.role);

	const tone = $derived(params.tone as Tone);
	const onBrand = $derived(tone === 'brand');
	const portrait = $derived(params.layout === 'portrait');
	const photoFirst = $derived(params.mediaSide === 'start');
	const center = $derived(!portrait && params.align === 'center');
	const width = $derived(Number(params.width));
	const offset = $derived(center ? (12 - width) / 2 : 0);
	const photoCols = $derived(12 - width);
	const large = $derived(params.headline === 'h2');
	const attribution = $derived(params.attribution as 'avatar' | 'inline' | 'card');
	const showLogo = $derived(Boolean(params.logo) && !!company);
	// With the logo beside the name, the role drops the company it would repeat.
	const role = $derived(showLogo ? jobTitle : testimonial.role);
	const softInk = $derived(onBrand ? 'text-primary-contrast/85' : 'text-neutral/70');
	// A hairline sets the logo apart from the name; on a tint the neutral line would match the
	// band, so the gap alone separates them there.
	const logoRule = $derived(
		tone === 'tint'
			? 'ps-sm'
			: `ps-lg border-s ${onBrand ? 'border-primary-contrast/25' : 'border-neutral-muted'}`
	);
	// The mark takes the primary role, stepping to the readable-on-muted ink on a tint.
	const markInk = $derived(
		onBrand
			? 'text-primary-contrast/60'
			: tone === 'tint'
				? 'text-primary-muted-readable'
				: 'text-primary-readable'
	);
</script>

{#snippet logoMark(ink: string)}
	{#if company}
		<span class="gap-sm inline-flex items-center text-lg whitespace-nowrap {company.type} {ink}">
			<span class="leading-none" aria-hidden="true">{@render company.icon()}</span>
			{company.name}
		</span>
	{/if}
{/snippet}

{#snippet person(ink: string)}
	{#if attribution === 'inline'}
		<p class="text-base">
			<span class="font-semibold">{testimonial.name}</span>
			<span class={ink}>· {role}</span>
		</p>
	{:else}
		<div class="gap-md flex items-center text-start">
			<Avatar name={testimonial.name} size={kit.step(1)} />
			<div class="flex flex-col">
				<span class="font-semibold">{testimonial.name}</span>
				<span class="text-sm {ink}">{role}</span>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet quote()}
	{#if params.mark}
		<span class="leading-none {large ? 'text-5xl' : 'text-4xl'} {markInk}" aria-hidden="true"
			>{@render quotesIconFill()}</span
		>
	{/if}
	<blockquote
		class="font-medium tracking-tight {large ? 'text-3xl' : 'text-2xl'} {center
			? 'text-balance'
			: 'text-pretty'}"
	>
		<p>“{testimonial.quote}”</p>
	</blockquote>
{/snippet}

<SectionShell {tone} density={params.density as SectionDensity} label="Customer story">
	{#if portrait}
		<!-- The speaker's portrait: a photo column captioned with who said it, beside the quote. The
		     caption comes last in the figure; the grid places it on either side. -->
		<figure class="gen-grid items-center">
			<div
				class="gen-col gap-xl flex flex-col items-start"
				style:--gen-span={width}
				style:--gen-start={photoFirst ? photoCols + 1 : 1}
				style:--gen-row={1}
			>
				{@render quote()}
			</div>
			<figcaption
				class="gen-col relative"
				style:--gen-span={photoCols}
				style:--gen-start={photoFirst ? 1 : width + 1}
				style:--gen-row={1}
			>
				<Media
					kind="photo"
					ratio="landscape"
					{tone}
					variant={width}
					class="@min-[48rem]/section:aspect-4/5"
				/>
				<div class="right-lg bottom-lg left-lg absolute">
					<Card variant="solid" density="compact">
						<div class="gap-md flex flex-wrap items-center justify-between">
							{@render person('text-neutral/70')}
							{#if showLogo}{@render logoMark('text-neutral/80')}{/if}
						</div>
					</Card>
				</div>
			</figcaption>
		</figure>
	{:else}
		<div class="gen-grid">
			<figure
				class="gen-col gap-xl flex flex-col {center ? 'items-center text-center' : 'items-start'}"
				style:--gen-span={width}
				style:--gen-start={offset + 1}
			>
				{@render quote()}
				<figcaption>
					{#if attribution === 'card'}
						<Card
							href={resolve('/blocks/generative')}
							variant="outline"
							density="compact"
							class="max-w-full"
						>
							<div class="gap-lg flex flex-wrap items-center">
								{@render person('text-neutral/70')}
								{#if showLogo}
									<span class="border-neutral-muted ps-lg border-s"
										>{@render logoMark('text-neutral/80')}</span
									>
								{/if}
								<span class="text-neutral/70" aria-hidden="true">{@render arrowRightIcon()}</span>
							</div>
						</Card>
					{:else}
						<div class="gap-lg flex flex-wrap items-center {center ? 'justify-center' : ''}">
							{@render person(softInk)}
							{#if showLogo}
								<span class={logoRule}
									>{@render logoMark(onBrand ? 'text-primary-contrast' : 'text-neutral/80')}</span
								>
							{/if}
						</div>
					{/if}
				</figcaption>
			</figure>
		</div>
	{/if}
</SectionShell>
