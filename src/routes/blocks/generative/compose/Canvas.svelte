<script lang="ts">
	import { Button } from 'entasis/button';
	import { arrowsClockwiseIcon } from 'entasis/icons/arrowsClockwise';
	import { copyIcon } from 'entasis/icons/copy';
	import { dotsSixVerticalIcon } from 'entasis/icons/dotsSixVertical';
	import { lockSimpleIcon } from 'entasis/icons/lockSimple';
	import { lockSimpleOpenIcon } from 'entasis/icons/lockSimpleOpen';
	import { trashIcon } from 'entasis/icons/trash';
	import { warningCircleIcon } from 'entasis/icons/warningCircle';
	import { useDndList } from '$lib/utils/useDndList.svelte.js';
	import { directedSpace, variantIndex } from '../engine/space.js';
	import type { PageSlot, SectionType } from '../engine/types.js';
	import { lookupSection } from '../registry.js';
	import KitScope from '../sections/KitScope.svelte';
	import SectionView from '../ui/SectionView.svelte';
	import type { Composer } from './composer.svelte.js';

	/**
	 * The page, zoomed out on a canvas. The artboard lays out at its real width (container queries
	 * see 1280px or 390px) and is scaled as a whole, so what you compose is exactly what ships.
	 * Sections drag to reorder; library rows drop in between them.
	 */
	interface Props {
		composer: Composer;
		width: number;
		zoom: number;
		onZoomChange: (zoom: number, anchor?: { x: number; y: number }) => void;
		scroller?: HTMLElement | null;
	}

	let { composer, width, zoom, onZoomChange, scroller = $bindable(null) }: Props = $props();
	let natural = $state(0);

	const sections = $derived(composer.spec.sections);
	const flagged = $derived(new Set(composer.violations.flatMap((violation) => violation.indices)));

	const dnd = useDndList<PageSlot>({
		id: 'canvas',
		items: () => composer.spec.sections,
		onReorder: (next) => composer.reorder(next),
		accepts: (source) => source.listId.startsWith('library:'),
		onReceive: ({ item, index }) => composer.insert((item as SectionType).id, index)
	});

	function wheel(event: WheelEvent) {
		// Pinch (and ctrl/⌘ + wheel) zooms around the pointer; a plain wheel pans as usual.
		if (!event.ctrlKey && !event.metaKey) return;
		event.preventDefault();
		const factor = Math.exp(-event.deltaY * 0.01);
		onZoomChange(zoom * factor, { x: event.clientX, y: event.clientY });
	}

	function select(slot: PageSlot) {
		composer.selectedId = composer.selectedId === slot.id ? null : slot.id;
	}

	function variantLabel(slot: PageSlot) {
		const type = lookupSection(slot.type);
		if (!type) return '';
		const directed = directedSpace(type, composer.direction);
		const index = variantIndex(directed, slot.params);
		return index >= 0
			? `${(index + 1).toLocaleString('en-US')} / ${directed.indices.length.toLocaleString('en-US')}`
			: 'outside list';
	}
</script>

<div
	bind:this={scroller}
	class="canvas dotted-grid bg-surface-recessed relative size-full overflow-auto"
	onwheel={wheel}
	role="region"
	aria-label="Page canvas"
>
	<div class="p-layout-xl relative mx-auto w-max" style:--canvas-zoom={zoom}>
		<div
			class="relative"
			style:width="{width * zoom}px"
			style:height="{Math.max(natural, 320) * zoom}px"
		>
			<div
				bind:offsetHeight={natural}
				class="bg-surface raised-lg absolute top-0 left-0 origin-top-left"
				style:width="{width}px"
				style:transform="scale({zoom})"
				data-artboard
			>
				<KitScope params={composer.spec.kit?.params}>
					<div class="flex min-h-80 flex-col" {@attach dnd.list}>
						{#each sections as slot (slot.id)}
							{@const type = lookupSection(slot.type)}
							{@const selected = composer.selectedId === slot.id}
							{@const index = sections.indexOf(slot)}
							<!-- Pointer selection on the canvas; the Layers list is the keyboard path to the
						     same selection, so the section itself is not a second focus stop. -->
							<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
							<div
								class="section group/section relative cursor-pointer"
								data-selected={selected || undefined}
								data-flagged={flagged.has(index) || undefined}
								data-slot-id={slot.id}
								data-section-type={slot.type}
								{@attach dnd.item(slot)}
								onclick={() => select(slot)}
							>
								<!-- The section itself is inert on the canvas: clicks select, drags move. -->
								<div class="pointer-events-none" inert>
									{#if type}
										<SectionView {type} params={slot.params} />
									{:else}
										<div class="bg-danger-muted text-danger-muted-readable p-xl text-sm">
											Unknown section type “{slot.type}”.
										</div>
									{/if}
								</div>
								<div
									class="section-ring pointer-events-none absolute inset-0"
									aria-hidden="true"
								></div>
								<!-- Chrome stays legible at any zoom: it is counter-scaled. -->
								<div class="chrome absolute top-0 left-0 z-10 origin-top-left">
									<div
										class="bg-surface-floating border-neutral-muted raised-sm gap-xs py-micro ps-xs pe-micro flex items-center rounded-md border text-xs whitespace-nowrap"
									>
										<span class="text-neutral/50" aria-hidden="true"
											>{@render dotsSixVerticalIcon()}</span
										>
										<span class="text-neutral font-medium">{type?.title ?? slot.type}</span>
										<span class="text-neutral/65 tabular-nums">{variantLabel(slot)}</span>
										{#if flagged.has(index)}
											<span class="text-warning-readable" title="Breaks a page rule"
												>{@render warningCircleIcon()}</span
											>
										{/if}
										<span class="actions gap-micro flex items-center">
											<Button
												size="small"
												variant="ghost"
												squared
												prefix={arrowsClockwiseIcon}
												label="Reroll this section"
												disabled={slot.locked}
												onclick={(event) => {
													event.stopPropagation();
													composer.reroll(slot.id);
												}}
											/>
											<Button
												size="small"
												variant="ghost"
												squared
												prefix={slot.locked ? lockSimpleIcon : lockSimpleOpenIcon}
												label={slot.locked ? 'Unlock this section' : 'Lock this section'}
												pressed={slot.locked}
												onclick={(event) => {
													event.stopPropagation();
													composer.toggleLock(slot.id);
												}}
											/>
											<Button
												size="small"
												variant="ghost"
												squared
												prefix={copyIcon}
												label="Duplicate this section"
												onclick={(event) => {
													event.stopPropagation();
													composer.duplicate(slot.id);
												}}
											/>
											<Button
												size="small"
												variant="ghost"
												squared
												color="danger"
												prefix={trashIcon}
												label="Remove this section"
												onclick={(event) => {
													event.stopPropagation();
													composer.remove(slot.id);
												}}
											/>
										</span>
									</div>
								</div>
								{#if slot.locked}
									<div
										class="lock-badge bg-primary text-primary-contrast absolute top-0 right-0 z-10 grid place-items-center rounded-full"
										aria-hidden="true"
									>
										{@render lockSimpleIcon()}
									</div>
								{/if}
							</div>
						{:else}
							<div
								class="text-neutral/65 gap-md p-layout-xl flex min-h-80 flex-col items-center justify-center text-center text-2xl"
							>
								<p class="text-neutral font-semibold">An empty page</p>
								<p class="text-lg">Drag sections from the library, or pick an outline above.</p>
							</div>
						{/each}
					</div>
				</KitScope>
			</div>
		</div>
	</div>
</div>

<style>
	.canvas {
		overscroll-behavior: contain;
	}
	/* Overlays live inside the scaled artboard, so their sizes divide by the zoom to stay crisp. */
	.chrome {
		transform: translate(calc(8px / var(--canvas-zoom)), calc(8px / var(--canvas-zoom)))
			scale(calc(1 / var(--canvas-zoom)));
		opacity: 0;
		transition: opacity var(--duration-fast);
	}
	.lock-badge {
		width: calc(24px / var(--canvas-zoom));
		height: calc(24px / var(--canvas-zoom));
		margin: calc(8px / var(--canvas-zoom));
		font-size: calc(12px / var(--canvas-zoom));
	}
	.section:hover .chrome,
	.section:focus-within .chrome,
	.section[data-selected] .chrome {
		opacity: 1;
	}
	.section-ring {
		box-shadow: inset 0 0 0 calc(1px / var(--canvas-zoom)) transparent;
		transition: box-shadow var(--duration-fast);
	}
	.section:hover .section-ring {
		box-shadow: inset 0 0 0 calc(1px / var(--canvas-zoom))
			color-mix(in oklab, var(--color-primary) 55%, transparent);
	}
	.section[data-flagged] .section-ring {
		box-shadow: inset 0 0 0 calc(2px / var(--canvas-zoom))
			color-mix(in oklab, var(--color-warning) 70%, transparent);
	}
	.section[data-selected] .section-ring {
		box-shadow: inset 0 0 0 calc(2px / var(--canvas-zoom)) var(--color-primary);
	}
	.section :global([data-dnd-dragging='true']) {
		opacity: 0.4;
	}
</style>
