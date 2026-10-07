<script lang="ts">
	import { Button } from 'entasis/button';
	import { dotsSixVerticalIcon } from 'entasis/icons/dotsSixVertical';
	import { plusIcon } from 'entasis/icons/plus';
	import { useDndList } from '$lib/utils/useDndList.svelte.js';
	import { directedSpace } from '../engine/space.js';
	import type { Direction, SectionType } from '../engine/types.js';
	import { sectionCategories, typesInCategory } from '../registry.js';

	/**
	 * The section library: every type, grouped by category. Rows drag onto the canvas (the canvas
	 * accepts the `library` list) or append with the plus button. The library never loses a row —
	 * it has no `onRemove`.
	 */
	interface Props {
		direction: Direction;
		onAdd: (typeId: string) => void;
	}

	let { direction, onAdd }: Props = $props();

	const groups = sectionCategories.map((category) => ({
		category,
		types: typesInCategory(category.slug)
	}));

	// One dnd list per category keeps each group's rows a plain list; all share the `library` id
	// prefix the canvas accepts.
	const lists = groups.map(({ category, types }) =>
		useDndList<SectionType>({
			id: `library:${category.slug}`,
			items: () => types,
			indicator: false
		})
	);
</script>

<div class="gap-lg flex flex-col">
	{#each groups as group, groupIndex (group.category.slug)}
		{@const dnd = lists[groupIndex]}
		<section class="gap-xs flex flex-col" aria-labelledby={`library-${group.category.slug}`}>
			<h3
				id={`library-${group.category.slug}`}
				class="text-neutral/65 px-xs text-xs font-medium tracking-wide uppercase"
			>
				{group.category.title}
			</h3>
			<ul class="gap-xs flex flex-col" {@attach dnd.list}>
				{#each group.types as type (type.id)}
					<li
						class="group/row bg-surface hover:bg-surface-raised border-neutral-muted gap-sm py-xs pe-xs ps-sm flex cursor-grab items-center rounded-md border transition-colors active:cursor-grabbing"
						{@attach dnd.item(type)}
					>
						<span class="text-neutral/40" aria-hidden="true">{@render dotsSixVerticalIcon()}</span>
						<span class="gap-micro flex min-w-0 flex-1 flex-col">
							<span class="text-neutral truncate text-sm">{type.title}</span>
							<span class="text-neutral/65 text-xs tabular-nums"
								>{directedSpace(type, direction).indices.length.toLocaleString('en-US')} variants</span
							>
						</span>
						<Button
							size="small"
							variant="ghost"
							squared
							prefix={plusIcon}
							label={`Add ${type.title} to the page`}
							onclick={() => onAdd(type.id)}
						/>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
