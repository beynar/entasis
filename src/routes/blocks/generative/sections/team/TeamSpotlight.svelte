<script lang="ts">
	import { resolve } from '$app/paths';
	import { Avatar, AvatarGroup } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { team } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const headcount = 24;
	const figures = [
		{ value: String(headcount), label: 'people' },
		{ value: '9', label: 'countries' },
		{ value: '4', label: 'open roles' }
	];
	const stack = team.map((person) => ({ name: person.name }));
	const shown = 5;
	const lead = team[0];
	const others = team.slice(1, shown);

	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const mosaic = $derived(params.layout === 'mosaic');
	const textCols = $derived(Number(params.textCols));
	const panelCols = $derived(12 - textCols);
	const panelFirst = $derived(params.mediaSide === 'start');
	const cards = $derived(params.cards as 'solid' | 'outline' | 'soft');
	const withRoles = $derived(params.roster === 'list');
	// Portrait discs step off the tile: a soft tile already paints the muted rung.
	const discClass = $derived(cards === 'soft' ? 'bg-surface' : 'bg-primary-muted');
	// Discs scale with the avatar's kit step, so every kit size keeps the portrait's margin.
	const discSize = { small: 'size-10', normal: 'size-14', large: 'size-20' };
</script>

{#snippet more()}
	+{headcount - shown}
{/snippet}

{#snippet meetEveryone()}
	<a
		href={resolve('/blocks/generative')}
		class="text-primary-readable gap-xs inline-flex items-center text-sm font-medium hover:underline"
		>Meet all {headcount} of us {@render arrowRightIcon()}</a
	>
{/snippet}

{#snippet panel()}
	<Card
		variant={cards}
		elevation={2}
		{density}
		title="Who you will work with"
		description="Product, design, and engineering, across nine countries."
		footer={meetEveryone}
	>
		{#if withRoles}
			<ul class="flex flex-col">
				{#each team.slice(0, shown) as person, index (person.name)}
					<li
						class="gap-md py-md flex items-center {index > 0
							? 'border-neutral-muted border-t'
							: ''}"
					>
						<Avatar name={person.name} size={kit.size} class="shrink-0" />
						<div class="flex min-w-0 flex-1 flex-col">
							<span class="truncate text-sm font-medium">{person.name}</span>
							<span class="text-neutral/70 truncate text-xs">{person.role}</span>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="gap-lg flex flex-col items-start">
				<AvatarGroup size={kit.stack(1)} items={stack} max={shown} remainingCount={more} />
				<p class="text-neutral/70 text-sm text-pretty">
					{team[0].name}, {team[1].name}, {team[2].name}, and {headcount - 3} more people who write things
					down and ship every week.
				</p>
			</div>
		{/if}
	</Card>
{/snippet}

{#snippet mosaicTiles()}
	<!-- A lead portrait over two rows, a tile per person, and a tile that opens the whole team. -->
	<div
		class="gap-md grid grid-cols-2 @min-[36rem]/section:auto-rows-fr @min-[36rem]/section:grid-cols-3"
	>
		<Card
			variant={cards}
			elevation={2}
			{density}
			class="col-span-2 justify-center @min-[36rem]/section:row-span-2"
		>
			<div class="gap-lg flex flex-col items-start">
				<span
					class="grid shrink-0 place-items-center rounded-full {discSize[kit.step(1)]} {discClass}"
				>
					<Avatar name={lead.name} size={kit.step(1)} />
				</span>
				{#if withRoles}
					<div class="gap-xs flex flex-col">
						<h3 class="text-lg font-semibold">{lead.name}</h3>
						<p class="text-neutral/70 text-sm">{lead.role}</p>
						<p class="pt-sm text-sm text-pretty">
							“We write decisions down, so nobody has to be in the room to know why.”
						</p>
					</div>
				{:else}
					<p class="text-neutral/70 text-sm text-pretty">
						{team[0].name}, {team[1].name}, {team[2].name}, and {headcount - 3} more people who write
						things down and ship every week.
					</p>
				{/if}
			</div>
		</Card>
		{#each others as person (person.name)}
			<Card variant={cards} elevation={1} density="compact" class="justify-center">
				<div class="gap-sm flex flex-col items-center text-center">
					<span
						class="grid shrink-0 place-items-center rounded-full {discSize[kit.size]} {discClass}"
						title={withRoles ? undefined : person.name}
					>
						<Avatar name={person.name} size={kit.size} />
					</span>
					{#if withRoles}
						<div class="flex min-w-0 flex-col">
							<h3 class="text-sm font-semibold">{person.name}</h3>
							<p class="text-neutral/70 text-xs">{person.role}</p>
						</div>
					{/if}
				</div>
			</Card>
		{/each}
		<Card
			variant={cards}
			elevation={1}
			density="compact"
			href={resolve('/blocks/generative')}
			class="col-span-2 justify-center @min-[36rem]/section:col-span-1"
		>
			<div class="gap-xs flex flex-col items-center text-center">
				<span class="text-2xl font-semibold tracking-tight tabular-nums">+{headcount - shown}</span>
				<span class="text-primary-readable gap-xs inline-flex items-center text-xs font-medium"
					>Meet all {headcount} {@render arrowRightIcon()}</span
				>
			</div>
		</Card>
	</div>
{/snippet}

<SectionShell {tone} {density} label="Team">
	<div class="gen-grid items-center">
		<div
			class="gen-col"
			style:--gen-span={textCols}
			style:--gen-start={panelFirst ? panelCols + 1 : 1}
			style:--gen-row={1}
		>
			<SectionHeader
				headline={params.headline as Headline}
				title="A small team with a long view."
				body="We are building the planning tool we always wanted. We work in the open, write our decisions down, and ship every week — and we are hiring."
			>
				{#if params.stats}
					<dl class="gap-lg py-sm grid w-full max-w-md grid-cols-3">
						{#each figures as figure (figure.label)}
							<div class="gap-xs flex flex-col-reverse">
								<dt class="text-neutral/70 text-sm">{figure.label}</dt>
								<dd class="text-3xl font-semibold tracking-tight tabular-nums">{figure.value}</dd>
							</div>
						{/each}
					</dl>
				{/if}
				<div class="gap-md pt-sm flex flex-wrap">
					<Button
						href={resolve('/blocks/generative')}
						size={kit.step(1)}
						{...kit.action()}
						suffix={arrowRightIcon}>See open roles</Button
					>
					{#if params.buttons === 2}
						<Button href={resolve('/blocks/generative')} size={kit.step(1)} {...kit.quiet()}
							>Read our story</Button
						>
					{/if}
				</div>
			</SectionHeader>
		</div>
		<div
			class="gen-col"
			style:--gen-span={panelCols}
			style:--gen-start={panelFirst ? 1 : textCols + 1}
			style:--gen-row={1}
		>
			{#if mosaic}
				{@render mosaicTiles()}
			{:else}
				{@render panel()}
			{/if}
		</div>
	</div>
</SectionShell>
