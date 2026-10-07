<script lang="ts">
	import { resolve } from '$app/paths';
	import { Avatar } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { Carousel } from 'entasis/carousel';
	import { linkedinLogoIcon } from 'entasis/icons/linkedinLogo';
	import { xLogoIcon } from 'entasis/icons/xLogo';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { team } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	type Person = (typeof team)[number];
	/** One line about each person, shown where a list gives them the room. */
	const bios: Record<string, string> = {
		'Maya Chen': 'Ran planning for three product orgs before starting Meridian.',
		'Theo Park': 'Built the sync engine and still reviews every migration.',
		'Nora Ellis': 'Keeps the interface calm, one careful default at a time.',
		'Idris Okafor': 'Works on importers, search, and anything that has to be fast.',
		'Lena Marsh': 'Talks to teams every week and turns it into the roadmap.',
		'Ravi Shah': 'Runs hiring, finance, and the yearly offsite.',
		'Ana Ruiz': 'Moves teams in, usually in a single afternoon.',
		'Jonas Berg': 'Owns the API and the integrations built on it.'
	};

	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const layout = $derived(params.layout as 'grid' | 'list' | 'carousel');
	// Centred profiles stack the avatar over the name; start-aligned ones set it beside the name.
	const center = $derived(params.align === 'center' && layout !== 'list');
	const cards = $derived(params.cards as 'ghost' | 'outline' | 'soft' | 'solid');
	const columns = $derived(Number(params.columns));
	// The avatar lever steps from the kit size, so a page's kit moves every portrait together.
	const avatar = $derived(
		kit.step(params.avatar === 'small' ? -1 : params.avatar === 'large' ? 1 : 0)
	);
	const people = $derived(team.slice(0, Number(params.count)));
	// The Avatar keeps its own size step; a tinted disc around it gives each person a portrait's
	// presence, scaled with the same step.
	const portraitSize = { small: 'size-10', normal: 'size-14', large: 'size-20' };
	// The disc steps off whatever it sits on: a soft card or a tint seen through the card already
	// paints the muted rung, so the disc lifts to the base surface there.
	const portraitClass = $derived(
		cards === 'soft' || (tone === 'tint' && cards !== 'solid') ? 'bg-surface' : 'bg-primary-muted'
	);
	// Each line of a list pads by the density lever, on the spacing scale.
	const linePad = $derived(
		density === 'compact' ? 'py-md' : density === 'comfortable' ? 'py-xl' : 'py-lg'
	);
	const socials = [
		{ network: 'LinkedIn', icon: linkedinLogoIcon },
		{ network: 'X', icon: xLogoIcon }
	];
</script>

{#snippet portrait(person: Person)}
	<span
		class="grid shrink-0 place-items-center rounded-full {portraitSize[avatar]} {portraitClass}"
	>
		<Avatar name={person.name} size={avatar} />
	</span>
{/snippet}

{#snippet links(person: Person)}
	<div class="gap-md flex items-center">
		{#each socials as social (social.network)}
			<a
				href={resolve('/blocks/generative')}
				aria-label="{person.name} on {social.network}"
				class="text-neutral/60 hover:text-neutral flex transition-colors">{@render social.icon()}</a
			>
		{/each}
	</div>
{/snippet}

{#snippet profile(person: Person)}
	<div
		class="gap-md flex {center
			? 'flex-col items-center text-center'
			: params.socials
				? 'items-start'
				: 'items-center'}"
	>
		{@render portrait(person)}
		<div class="gap-xs flex min-w-0 flex-col {center ? 'items-center' : 'items-start'}">
			<h3 class="text-base font-semibold">{person.name}</h3>
			<p class="text-neutral/70 text-sm">{person.role}</p>
			{#if params.socials}
				<div class="pt-xs">{@render links(person)}</div>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet member(person: Person, fill: boolean)}
	{#if cards === 'ghost'}
		{@render profile(person)}
	{:else}
		<Card variant={cards} {density} class={fill ? 'h-full' : ''}>
			{@render profile(person)}
		</Card>
	{/if}
{/snippet}

{#snippet line(person: Person)}
	<!-- Name and role on the start side, a line about them, then their links at the end. -->
	<div
		class="gap-x-layout-lg gap-y-md grid items-center @min-[48rem]/section:grid-cols-12 {cards ===
		'ghost'
			? `${linePad} border-neutral-muted border-t`
			: ''}"
	>
		<div class="gap-md flex min-w-0 items-center @min-[48rem]/section:col-span-4">
			{@render portrait(person)}
			<div class="gap-xs flex min-w-0 flex-col">
				<h3 class="text-base font-semibold">{person.name}</h3>
				<p class="text-neutral/70 text-sm">{person.role}</p>
			</div>
		</div>
		<p
			class="text-neutral/70 text-base text-pretty {params.socials
				? '@min-[48rem]/section:col-span-6'
				: '@min-[48rem]/section:col-span-8'}"
		>
			{bios[person.name]}
		</p>
		{#if params.socials}
			<div class="flex @min-[48rem]/section:col-span-2 @min-[48rem]/section:justify-end">
				{@render links(person)}
			</div>
		{/if}
	</div>
{/snippet}

<SectionShell {tone} {density} label="Team">
	<div class="gen-flow">
		<SectionHeader
			align={center ? 'center' : 'start'}
			headline={params.headline as Headline}
			title="The people behind Meridian."
			body="A small team of builders, designers, and operators who would rather ship than sync."
		/>
		{#if layout === 'list'}
			{#if cards === 'ghost'}
				<div class="flex flex-col">
					{#each people as entry (entry.name)}
						{@render line(entry)}
					{/each}
				</div>
			{:else}
				<div class="gen-items" data-cols="1">
					{#each people as entry (entry.name)}
						<Card variant={cards} {density}>{@render line(entry)}</Card>
					{/each}
				</div>
			{/if}
		{:else if layout === 'carousel'}
			<!-- Slides per view follow the carousel's own width: one, two, then the columns lever. -->
			<Carousel
				items={people}
				snapAlign="start"
				layout={columns === 4 ? { xs: 1, sm: 2, lg: 3, xl: 4 } : { xs: 1, sm: 2, lg: 3 }}
				navigationButton={{ color: 'neutral', size: kit.size }}
				pagination={{ variant: 'line', color: kit.accent }}
			>
				{#snippet children({ item })}
					{@render member(item, true)}
				{/snippet}
			</Carousel>
		{:else}
			<div class="gen-items" data-cols={columns}>
				{#each people as entry (entry.name)}
					{@render member(entry, true)}
				{/each}
			</div>
		{/if}
	</div>
</SectionShell>
