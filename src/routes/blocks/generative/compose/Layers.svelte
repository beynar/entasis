<script lang="ts">
	import { Button } from 'entasis/button';
	import { dotsSixVerticalIcon } from 'entasis/icons/dotsSixVertical';
	import { lockSimpleIcon } from 'entasis/icons/lockSimple';
	import { lockSimpleOpenIcon } from 'entasis/icons/lockSimpleOpen';
	import { warningCircleIcon } from 'entasis/icons/warningCircle';
	import { useDndList } from '$lib/utils/useDndList.svelte.js';
	import type { PageSlot } from '../engine/types.js';
	import { findCategory, lookupSection } from '../registry.js';
	import type { Composer } from './composer.svelte.js';

	/** The page outline: the same slots as the canvas, as a sortable list you can reach by keyboard. */
	interface Props {
		composer: Composer;
		onFocusSection: (id: string) => void;
	}

	let { composer, onFocusSection }: Props = $props();

	const flagged = $derived(new Set(composer.violations.flatMap((violation) => violation.indices)));
	const dnd = useDndList<PageSlot>({
		id: 'layers',
		items: () => composer.spec.sections,
		onReorder: (next) => composer.reorder(next),
		handle: true
	});

	function move(index: number, delta: number) {
		const target = index + delta;
		const sections = composer.spec.sections;
		if (target < 0 || target >= sections.length) return;
		const next = [...sections];
		const [slot] = next.splice(index, 1);
		next.splice(target, 0, slot);
		composer.reorder(next);
	}
</script>

<ol class="gap-xs flex flex-col" aria-label="Page outline" {@attach dnd.list}>
	{#each composer.spec.sections as slot, index (slot.id)}
		{@const type = lookupSection(slot.type)}
		{@const selected = composer.selectedId === slot.id}
		<li
			class="gap-xs py-micro pe-micro ps-xs flex items-center rounded-md border transition-colors {selected
				? 'border-primary bg-primary-muted'
				: 'bg-surface border-neutral-muted hover:bg-surface-raised'}"
			{@attach dnd.item(slot)}
		>
			<span
				data-dnd-handle
				class="text-neutral/45 cursor-grab active:cursor-grabbing"
				aria-hidden="true">{@render dotsSixVerticalIcon()}</span
			>
			<button
				type="button"
				class="gap-xs flex min-w-0 flex-1 items-baseline text-start"
				aria-pressed={selected}
				onclick={() => {
					composer.selectedId = selected ? null : slot.id;
					if (!selected) onFocusSection(slot.id);
				}}
				onkeydown={(event) => {
					if (event.altKey && event.key === 'ArrowUp') {
						event.preventDefault();
						move(index, -1);
					} else if (event.altKey && event.key === 'ArrowDown') {
						event.preventDefault();
						move(index, 1);
					}
				}}
			>
				<span class="text-neutral/65 w-4 shrink-0 text-xs tabular-nums">{index + 1}</span>
				<span class="text-neutral truncate text-sm">{type?.title ?? slot.type}</span>
				<span class="text-neutral/65 truncate text-xs"
					>{type ? findCategory(type.category)?.title : ''}</span
				>
			</button>
			{#if flagged.has(index)}
				<span class="text-warning-readable" title="Breaks a page rule"
					>{@render warningCircleIcon()}</span
				>
			{/if}
			<Button
				size="small"
				variant="ghost"
				squared
				prefix={slot.locked ? lockSimpleIcon : lockSimpleOpenIcon}
				label={slot.locked ? `Unlock ${type?.title}` : `Lock ${type?.title}`}
				pressed={slot.locked}
				class={slot.locked ? 'text-primary-readable' : 'text-neutral/65'}
				onclick={() => composer.toggleLock(slot.id)}
			/>
		</li>
	{/each}
</ol>
<p class="text-neutral/65 px-xs pt-sm text-xs">
	Drag the grip, or Alt + ↑ / ↓ on a row, to reorder.
</p>
