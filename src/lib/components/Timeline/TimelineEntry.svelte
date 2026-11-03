<script lang="ts" generics="Item extends TimelineItem = TimelineItem">
	import { checkIcon } from '../Icons/check.js';
	import Slot from '../Slot/Slot.svelte';
	import Spinner from '../Spinner/Spinner.svelte';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import { presence } from '$lib/utils/stateAttributes.js';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { ResolvedTimelineItem } from './timeline.items.js';
	import type {
		TimelineItem,
		TimelineItemPayload,
		TimelinePlacement,
		TimelineVariant
	} from './timeline.props.js';
	import type { TimelineClasses } from './timeline.theme.js';

	let {
		entry,
		placement,
		variant,
		size,
		density,
		showConnectors,
		selectable,
		selected,
		onSelect,
		navigationItem,
		loadingLabel,
		classes,
		itemRenderer,
		markerRenderer,
		oppositeRenderer
	}: {
		entry: ResolvedTimelineItem<Item>;
		placement: TimelinePlacement;
		variant: TimelineVariant;
		size: Sizes;
		density: Density;
		showConnectors: boolean;
		selectable: boolean;
		selected: boolean;
		onSelect: () => void;
		navigationItem: Attachment<HTMLElement>;
		loadingLabel: string;
		classes: TimelineClasses;
		itemRenderer?: Snippet<[TimelineItemPayload<Item>]>;
		markerRenderer?: Snippet<[TimelineItemPayload<Item>]>;
		oppositeRenderer?: Snippet<[TimelineItemPayload<Item>]>;
	} = $props();

	const uid = $props.id();
	const titleId = `${uid}-title`;
	const disabled = $derived(selectable && entry.item.disabled === true);
	const interactive = $derived(selectable && !disabled);

	const payload = $derived<TimelineItemPayload<Item>>({
		item: entry.item,
		index: entry.index,
		side: entry.side,
		orientation: entry.orientation,
		color: entry.color,
		connectorColor: entry.connectorColor,
		isFirst: entry.isFirst,
		isLast: entry.isLast,
		value: entry.value,
		selectable,
		selected,
		disabled,
		select: onSelect,
		titleId,
		defaultContent,
		defaultMarker,
		defaultOpposite
	});
</script>

<li
	data-slot="timeline-item"
	data-orientation={entry.orientation}
	data-placement={placement}
	data-side={entry.side}
	data-color={entry.color}
	data-variant={variant}
	data-size={size}
	data-density={density}
	data-first={entry.isFirst ? 'true' : undefined}
	data-last={entry.isLast ? 'true' : undefined}
	data-progress={entry.item.progress}
	data-selected={selectable ? presence(selected) : undefined}
	data-disabled={presence(disabled)}
	aria-current={entry.item.progress === 'current' ? 'step' : undefined}
	class={classes.item({
		orientation: entry.orientation,
		placement,
		side: entry.side,
		variant,
		density,
		isLast: entry.isLast
	})}
>
	{#if selectable}
		<!-- The selection target spans the item. It is empty and lies under the item's parts, so it
		     takes its name from the title rather than wrapping content that may hold its own links. -->
		<button
			type="button"
			data-slot="timeline-item-button"
			aria-pressed={selected}
			aria-labelledby={titleId}
			aria-label={typeof entry.item.title === 'string' ? entry.item.title : undefined}
			aria-current={entry.item.progress === 'current' ? 'step' : undefined}
			{disabled}
			class={classes.itemButton()}
			onclick={onSelect}
			{@attach navigationItem}
		></button>
	{/if}

	{#if placement === 'alternate'}
		<div
			data-slot="timeline-opposite"
			data-color={entry.color}
			class={classes.opposite({
				orientation: entry.orientation,
				side: entry.side,
				density,
				selectable
			})}
		>
			<Slot render={oppositeRenderer} {payload}>
				{@render defaultOpposite()}
			</Slot>
		</div>
	{/if}

	<div
		data-slot="timeline-axis"
		data-color={entry.color}
		class={classes.axis({
			orientation: entry.orientation,
			placement,
			variant,
			density,
			hasDate: Boolean(entry.item.date),
			isLast: entry.isLast,
			selectable
		})}
		aria-hidden="true"
		inert
	>
		{#if showConnectors && !entry.isLast}
			<span
				data-slot="timeline-connector"
				data-color={entry.connectorColor}
				data-progress={entry.item.progress}
				class={classes.connector({
					orientation: entry.orientation,
					color: entry.connectorColor,
					progress: entry.item.progress ?? 'none'
				})}
			></span>
		{/if}

		<Slot render={markerRenderer} {payload}>
			{@render defaultMarker()}
		</Slot>
	</div>

	<div
		data-slot="timeline-content"
		data-color={entry.color}
		class={classes.content({
			orientation: entry.orientation,
			placement,
			side: entry.side,
			variant,
			density,
			color: entry.color,
			selectable,
			interactive,
			selected
		})}
	>
		<Slot render={itemRenderer} {payload}>
			{@render defaultContent()}
		</Slot>
		{#if entry.item.loading}
			<span data-slot="timeline-loading-status" class="sr-only" role="status" aria-live="polite">
				{loadingLabel}
			</span>
		{/if}
	</div>
</li>

{#snippet dateContent()}
	{#if entry.item.date}
		{#if entry.item.datetime}
			<time
				data-slot="timeline-date"
				datetime={entry.item.datetime}
				class={classes.date({ size, density, placement, variant, selected })}
			>
				<Slot render={entry.item.date} />
			</time>
		{:else}
			<div
				data-slot="timeline-date"
				class={classes.date({ size, density, placement, variant, selected })}
			>
				<Slot render={entry.item.date} />
			</div>
		{/if}
	{/if}
{/snippet}

{#snippet defaultContent()}
	{#if placement !== 'alternate'}
		{@render dateContent()}
	{/if}

	<div data-slot="timeline-title-row" class={classes.titleRow()}>
		<Slot
			as="div"
			render={entry.item.title}
			attrs={selectable ? { id: titleId } : undefined}
			class={classes.title({ size, variant, selected })}
		/>
	</div>

	{#if entry.item.description}
		<Slot
			as="div"
			render={entry.item.description}
			class={classes.description({ size, density, variant, selected })}
		/>
	{/if}
{/snippet}

{#snippet defaultMarker()}
	<span
		data-slot="timeline-marker"
		data-color={entry.color}
		data-progress={entry.item.loading ? undefined : entry.item.progress}
		class={classes.marker({
			size,
			color: entry.color,
			progress: entry.item.loading ? 'none' : (entry.item.progress ?? 'none')
		})}
	>
		{#if entry.item.loading}
			<span data-slot="timeline-loading" class={classes.loading({ size })}>
				<Spinner color={entry.color} {size} decorative />
			</span>
		{:else if entry.item.icon}
			<Slot render={entry.item.icon} />
		{:else if entry.item.progress === 'done'}
			{@render checkIcon()}
		{:else if entry.item.progress === 'upcoming'}
			<span data-slot="timeline-step-number">{entry.index + 1}</span>
		{:else}
			<span data-slot="timeline-dot"></span>
		{/if}
	</span>
{/snippet}

{#snippet defaultOpposite()}
	{@render dateContent()}
{/snippet}
