<script lang="ts">
	import { AvatarGroup } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Meter } from 'entasis/meter';
	import { checkCircleIcon } from 'entasis/icons/checkCircle';
	import { circleIcon } from 'entasis/icons/circle';
	import type { Tone } from '../engine/levers.js';
	import { photos } from './content.js';
	import { useSectionKit } from './sectionKit.js';

	/**
	 * Media is a lever, not an asset: a product mock composed from Entasis components, a photo from
	 * the catalog's own set, or a token pattern. All three sit in the same frame and corner radius,
	 * so swapping one for another never moves the grid.
	 */
	interface Props {
		kind: 'product' | 'photo' | 'pattern';
		ratio?: 'landscape' | 'square' | 'portrait' | 'wide';
		tone: Tone;
		/** Which catalog photo to show; any integer, wrapped. */
		variant?: number;
		class?: string;
	}

	let { kind, ratio = 'landscape', tone, variant = 0, class: className = '' }: Props = $props();
	const kit = useSectionKit();

	const ratioClasses = {
		landscape: 'aspect-4/3',
		square: 'aspect-square',
		portrait: 'aspect-4/5',
		wide: 'aspect-video'
	};
	// The frame steps off whatever surface the section paints, never onto the same rung.
	const frameClass = $derived(
		tone === 'tint' || tone === 'brand' ? 'bg-surface-recessed' : 'bg-primary-muted'
	);
	const tasks = [
		{ title: 'Research the audience', done: true, status: 'Done' },
		{ title: 'Draft the first release', done: true, status: 'Done' },
		{ title: 'Review with design', done: false, status: 'In review' }
	];
</script>

{#if kind === 'photo'}
	<div class="overflow-hidden rounded-lg {ratioClasses[ratio]} {frameClass} {className}">
		<img
			src={photos[Math.abs(variant) % photos.length]}
			alt="Landscape photograph"
			loading="lazy"
			class="size-full object-cover"
		/>
	</div>
{:else if kind === 'pattern'}
	<div
		aria-hidden="true"
		class="dotted-grid relative overflow-hidden rounded-lg {ratioClasses[
			ratio
		]} {frameClass} {className}"
	>
		<div class="p-layout-md gap-md absolute inset-0 grid grid-cols-6 grid-rows-6">
			<div class="bg-primary col-span-3 row-span-4 rounded-lg"></div>
			<div class="bg-primary/40 col-span-3 row-span-2 rounded-full"></div>
			<div class="bg-surface col-span-2 row-span-2 rounded-md"></div>
			<div class="bg-primary/70 col-span-1 row-span-2 rounded-full"></div>
			<div class="bg-surface col-span-4 row-span-2 rounded-md"></div>
			<div class="bg-primary/25 col-span-2 row-span-2 rounded-lg"></div>
		</div>
	</div>
{:else}
	<!-- A product mock keeps its natural height; a wide frame centres it at a readable width. -->
	<div class="p-layout-md flex items-center justify-center rounded-lg {frameClass} {className}">
		<Card
			class="w-full {ratio === 'wide' ? 'max-w-xl' : ''}"
			title="Q3 roadmap"
			description="Launch plan · Shared with 12 people"
			elevation={2}
		>
			<div class="gap-lg flex flex-col">
				<div class="gap-sm flex flex-col">
					{#each tasks as task (task.title)}
						<div class="gap-md bg-surface-recessed px-md py-sm flex items-center rounded-md">
							<span class={task.done ? 'text-success-readable' : 'text-neutral/50'}
								>{@render (task.done ? checkCircleIcon : circleIcon)()}</span
							>
							<span class="min-w-0 flex-1 truncate text-sm">{task.title}</span>
							<Chip size="small" variant="soft" color={task.done ? 'success' : 'warning'}
								>{task.status}</Chip
							>
						</div>
					{/each}
				</div>
				<Meter
					value={68}
					color={kit.accent === 'neutral' ? 'neutral' : 'primary'}
					label="Milestone progress"
					showIndicatorAs="percentage"
				/>
				<div class="gap-md flex items-center justify-between">
					<AvatarGroup
						size={kit.stack(-1)}
						items={[{ name: 'Maya Chen' }, { name: 'Theo Park' }, { name: 'Nora Ellis' }]}
					/>
					<span class="text-neutral/65 text-xs">Next review · Friday</span>
				</div>
			</div>
		</Card>
	</div>
{/if}
