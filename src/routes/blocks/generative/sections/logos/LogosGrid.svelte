<script lang="ts">
	import { resolve } from '$app/paths';
	import { Avatar } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { testimonials } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';
	import { logoMarks, markForRole, type LogoMark } from './marks.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const layout = $derived(params.layout as 'grid' | 'brick' | 'spotlight');
	const side = $derived(params.header === 'side');
	const center = $derived(!side && params.align === 'center');
	const columns = $derived(Number(params.columns));
	const cards = $derived(params.cards as 'ghost' | 'outline' | 'soft' | 'solid');
	// The featured customer is the one whose quote it carries; the other cells skip its mark.
	const featured = testimonials[0];
	const featuredMark = markForRole(featured.role) ?? logoMarks[0];
	const others = logoMarks.filter((logo) => logo !== featuredMark);
	// A wall fills its cells; bricks drop one from the offset row; the featured cell takes four.
	const marks = $derived(
		layout === 'brick'
			? logoMarks.slice(0, columns * 2 - 1)
			: layout === 'spotlight'
				? others.slice(0, columns * Number(params.rows) - 4)
				: logoMarks.slice(0, columns * Number(params.rows))
	);
	// Two cells across on a phone; the full count only once each cell can hold a wordmark.
	const columnClasses: Record<number, string> = {
		3: '@min-[36rem]/section:grid-cols-3',
		4: '@min-[48rem]/section:grid-cols-4',
		6: '@min-[36rem]/section:grid-cols-3 @min-[56rem]/section:grid-cols-6'
	};
	// The featured cell spans two rows only once a third column sits beside it.
	const spotlightClasses: Record<number, string> = {
		3: 'col-span-2 @min-[36rem]/section:row-span-2',
		4: 'col-span-2 @min-[48rem]/section:row-span-2'
	};
	// Bricks lay every cell over two half-tracks, so a row can sit half a cell in. The phone
	// brick alternates two cells and one; the wide brick alternates the full count and one less.
	const brickTracks: Record<number, string> = {
		3: 'grid-cols-4 @min-[36rem]/section:grid-cols-6',
		4: 'grid-cols-4 @min-[48rem]/section:grid-cols-8',
		6: 'grid-cols-4 @min-[36rem]/section:grid-cols-6 @min-[56rem]/section:grid-cols-12'
	};
	const brickCell: Record<number, string> = {
		3: 'col-[var(--brick-sm)/span_2] @min-[36rem]/section:col-[var(--brick-lg)/span_2]',
		4: 'col-[var(--brick-sm)/span_2] @min-[48rem]/section:col-[var(--brick-lg)/span_2]',
		6: 'col-[var(--brick-sm)/span_2] @min-[36rem]/section:col-[var(--brick-md)/span_2] @min-[56rem]/section:col-[var(--brick-lg)/span_2]'
	};

	/** Start half-track of each cell when rows alternate `wide` and `wide - 1` cells, centring a short last row. */
	function brickStarts(count: number, wide: number) {
		const starts: number[] = [];
		for (let placed = 0, row = 0; placed < count; row += 1) {
			const inRow = Math.min(row % 2 === 0 ? wide : wide - 1, count - placed);
			for (let cell = 0; cell < inRow; cell += 1) starts.push(wide - inRow + cell * 2 + 1);
			placed += inRow;
		}
		return starts;
	}
	const bricks = $derived({
		sm: brickStarts(marks.length, 2),
		md: brickStarts(marks.length, 3),
		lg: brickStarts(marks.length, columns)
	});
</script>

{#snippet mark(logo: LogoMark, large = false)}
	<span
		class="gap-sm text-neutral/70 inline-flex items-center whitespace-nowrap {logo.type} {large
			? 'text-2xl'
			: columns === 6
				? 'text-base'
				: 'text-lg'}"
	>
		<span class="leading-none" aria-hidden="true">{@render logo.icon()}</span>
		{logo.name}
	</span>
{/snippet}

{#snippet cell(logo: LogoMark)}
	{#if cards === 'ghost'}
		<div class="flex min-h-16 items-center justify-center">{@render mark(logo)}</div>
	{:else}
		<Card variant={cards} {density} class="h-full justify-center">
			<div class="flex items-center justify-center">{@render mark(logo)}</div>
		</Card>
	{/if}
{/snippet}

{#snippet wall()}
	<div class="gap-xl flex flex-col {center ? 'items-center' : 'items-start'}">
		{#if layout === 'brick'}
			<ul aria-label="Customers" class="gap-md grid w-full {brickTracks[columns]}">
				{#each marks as logo, index (logo.name)}
					<li
						class="min-w-0 {brickCell[columns]}"
						style:--brick-sm={bricks.sm[index]}
						style:--brick-md={bricks.md[index]}
						style:--brick-lg={bricks.lg[index]}
					>
						{@render cell(logo)}
					</li>
				{/each}
			</ul>
		{:else}
			<ul aria-label="Customers" class="gap-md grid w-full grid-cols-2 {columnClasses[columns]}">
				{#if layout === 'spotlight'}
					<li class="min-w-0 {spotlightClasses[columns]}">
						<Card
							variant={cards}
							{density}
							class="h-full"
							theme={{ content: { base: 'flex flex-1 flex-col' } }}
						>
							<figure class="gap-lg flex flex-1 flex-col">
								{@render mark(featuredMark, true)}
								<blockquote class="text-base text-pretty">
									<p>“{featured.quote}”</p>
								</blockquote>
								<figcaption class="gap-md mt-auto flex items-center">
									<Avatar name={featured.name} size={kit.size} />
									<div class="flex min-w-0 flex-col">
										<span class="text-sm font-semibold">{featured.name}</span>
										<span class="text-neutral/70 text-sm">{featured.role}</span>
									</div>
								</figcaption>
							</figure>
						</Card>
					</li>
				{/if}
				{#each marks as logo (logo.name)}
					<li class="min-w-0">{@render cell(logo)}</li>
				{/each}
			</ul>
		{/if}
		{#if params.caption}
			<p class="text-neutral/70 text-sm text-pretty {center ? 'text-center' : ''}">
				And 9,800 more teams plan in Meridian.
				<a
					href={resolve('/blocks/generative')}
					class="text-primary-readable gap-xs inline-flex items-center font-medium hover:underline"
					>Read their stories {@render arrowRightIcon()}</a
				>
			</p>
		{/if}
	</div>
{/snippet}

<SectionShell {tone} {density} label="Customers">
	{#if side}
		<div class="gen-grid items-center">
			<div class="gen-col" style:--gen-span={4}>
				<SectionHeader
					headline={params.headline as Headline}
					title="Trusted by teams who ship on schedule."
					body="From ten-person studios to four-hundred-person product orgs, teams plan their work in Meridian."
				/>
			</div>
			<div class="gen-col" style:--gen-span={8} style:--gen-start={5}>
				{@render wall()}
			</div>
		</div>
	{:else}
		<div class="gen-flow">
			<SectionHeader
				align={center ? 'center' : 'start'}
				headline={params.headline as Headline}
				title="Trusted by teams who ship on schedule."
				body="From ten-person studios to four-hundred-person product orgs, teams plan their work in Meridian."
			/>
			{@render wall()}
		</div>
	{/if}
</SectionShell>
