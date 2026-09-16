<script lang="ts" generics="T">
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import { useDndList } from '$lib/utils/useDndList.svelte.js';
	import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import Slot from '../Slot/Slot.svelte';
	import { dotsSixVerticalIcon } from '../Icons/dotsSixVertical.js';
	import type { SortableListProps } from './sortableList.props.js';
	import { useSortableListTheme } from './sortableList.theme.js';

	let {
		items = $bindable([]),
		handle = false,
		disabled = false,
		indicator = false,
		size = 'normal',
		orientation = 'vertical',
		group,
		name,
		accepts,
		onReorder,
		onReceive,
		onRemove,
		onDragStart,
		onDragEnd,
		empty,
		i18n,
		class: className,
		ref = $bindable(null),
		theme,
		item,
		...attachments
	}: SortableListProps<T> = $props();

	const t = $derived(useI18n(i18n));
	const classes = $derived(useSortableListTheme(theme));

	// Rows are matched by object `id`, primitives by value.
	const idOf = (value: T): string =>
		String(
			typeof value === 'object' && value != null
				? (value as unknown as { id: string | number }).id
				: (value as unknown as string | number)
		);

	// Any truthy `handle` turns on handle mode; a snippet/string additionally
	// customizes the grip.
	const handleMode = $derived(Boolean(handle));
	const handleContent = $derived(typeof handle === 'boolean' ? undefined : handle);

	// Primitive-friendly default row label, used only when no `item` snippet is
	// supplied.
	const defaultLabel = (value: T): string => {
		if (value == null) return '';
		if (typeof value !== 'object') return String(value);
		const record = value as Record<string, unknown>;
		return String(record.label ?? record.title ?? idOf(value));
	};

	const uid = $props.id();
	// Cross-list: lists sharing a `group` accept each other's rows. The dnd id
	// is namespaced `${group}::${name}` so `accepts` can match on the group;
	// group/name are captured at mount (the dnd id must stay stable).
	// svelte-ignore state_referenced_locally
	const listName = name ?? uid;
	// svelte-ignore state_referenced_locally
	const listGroup = group;
	const peerName = (dndListId: string) =>
		listGroup ? dndListId.slice(listGroup.length + 2) : dndListId;

	const dnd = useDndList<T>({
		id: listGroup ? `${listGroup}::${listName}` : `${uid}-sortable`,
		items: () => items,
		itemId: idOf,
		indicator: () => indicator,
		// Both horizontal and grid resolve before/after on the horizontal axis;
		// the engine's wrapped-line handling covers the grid's row breaks.
		axis: () => (orientation === 'vertical' ? 'vertical' : 'horizontal'),
		handle: () => handleMode,
		disabled: () => disabled,
		accepts: (source) =>
			!!listGroup &&
			source.listId.startsWith(`${listGroup}::`) &&
			(accepts?.({ item: source.item as T, from: peerName(source.listId) }) ?? true),
		onReorder: (next, detail) => {
			items = next;
			onReorder?.({ items: next, from: detail.from, to: detail.to, item: detail.item });
		},
		onReceive: ({ item: received, index, from }) => {
			const value = received as T;
			items = [...items.slice(0, index), value, ...items.slice(index)];
			onReceive?.({
				item: value,
				index,
				from: { list: peerName(from.listId), index: from.index }
			});
		},
		onRemove: ({ item: removed, index, to }) => {
			items = items.filter((value) => idOf(value) !== idOf(removed));
			onRemove?.({ item: removed, index, to: { list: peerName(to.listId) } });
		},
		onDragStart: (detail) => onDragStart?.(detail),
		onDragEnd: (detail) => onDragEnd?.(detail)
	});

	// Default feedback derives a prospective order without mutating `items`.
	// Indicator feedback renders `items` unchanged and lets the DnD utility draw
	// the insertion edge. Both modes commit from the same `over` state at drop.
	const previewItems = $derived.by(() => {
		const over = dnd.over;
		if (!over) return dnd.dragging ? items.filter((value) => idOf(value) !== dnd.dragging) : items;
		const rest = items.filter((value) => idOf(value) !== over.source.itemId);
		const index = Math.min(over.index, rest.length);
		return [...rest.slice(0, index), over.source.item as T, ...rest.slice(index)];
	});
	const renderedItems = $derived(indicator ? items : previewItems);
	const draggingId = $derived(indicator ? dnd.dragging : (dnd.over?.source.itemId ?? null));

	const flipParams = $derived({ duration: prefersReducedMotion() ? 0 : 180, easing: cubicOut });

	// Grip glyph size per token.
	const gripClass = $derived(size === 'large' ? 'size-5' : 'size-4');
</script>

<ul
	bind:this={ref}
	class={classes.root({ size, orientation, className })}
	{...attachments}
	{@attach dnd.list}
>
	{#each renderedItems as value, index (idOf(value))}
		{@const payload = { item: value, index, isDragging: idOf(value) === draggingId }}
		<li
			animate:flip={flipParams}
			class={classes.item({ size, handle: handleMode, dragging: payload.isDragging, disabled })}
			{@attach dnd.item(value)}
		>
			{#if handleMode}
				<button
					type="button"
					data-dnd-handle
					{disabled}
					aria-label={t.dragToReorder}
					class={classes.handle({ size })}
				>
					<Slot render={handleContent} {payload}>
						{@render dotsSixVerticalIcon({ class: gripClass })}
					</Slot>
				</button>
			{/if}

			<Slot render={item} {payload} class={classes.content()}>
				{defaultLabel(value)}
			</Slot>
		</li>
	{/each}
	{#if empty !== undefined && renderedItems.length === 0}
		<!-- Not a dnd row — drops onto it resolve through the list container. -->
		<li class={classes.empty()}>
			<Slot render={empty} />
		</li>
	{/if}
</ul>
