<script lang="ts" generics="Item extends TimelineItem = TimelineItem">
	import TimelineEntry from './TimelineEntry.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { useOverflowObserver } from '$lib/utils/useOverflowObserver.svelte.js';
	import { resolveTimelineItems } from './timeline.items.js';
	import type { TimelineItem, TimelineProps } from './timeline.props.js';
	import { useTimelineTheme } from './timeline.theme.js';

	let {
		ref = $bindable(null),
		items,
		orientation = 'vertical',
		placement = 'end',
		variant = 'ghost',
		size = 'normal',
		density = 'normal',
		color = 'neutral',
		connectorColor = 'neutral',
		showConnectors = true,
		scrollFade = true,
		i18n,
		item: itemRenderer,
		marker: markerRenderer,
		opposite: oppositeRenderer,
		tabindex,
		class: className,
		theme,
		...rootAttributes
	}: TimelineProps<Item> = $props();

	const messages = $derived(useI18n(i18n));
	const classes = $derived(useTimelineTheme(theme));
	const resolvedItems = $derived(
		resolveTimelineItems(items, orientation, placement, color, connectorColor)
	);

	const overflow = useOverflowObserver({
		axis: 'x',
		selector: '[data-slot="timeline-item"]',
		enabled: () => orientation === 'horizontal'
	});
	const isOverflowing = $derived(overflow.overflowing);
	const scrollFadeAxis = $derived(
		scrollFade && orientation === 'horizontal' && isOverflowing ? 'x' : 'none'
	);
	const resolvedTabindex = $derived(
		tabindex ?? (orientation === 'horizontal' && isOverflowing ? 0 : undefined)
	);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<ol
	{...rootAttributes}
	bind:this={ref}
	tabindex={resolvedTabindex}
	{@attach overflow.attachment}
	data-slot="timeline"
	data-orientation={orientation}
	data-placement={placement}
	data-color={color}
	data-variant={variant}
	data-size={size}
	data-density={density}
	data-connectors={showConnectors ? 'true' : 'false'}
	data-overflowing={isOverflowing ? 'true' : undefined}
	data-scroll-fade={scrollFadeAxis === 'none' ? undefined : scrollFadeAxis}
	class={classes.root({
		orientation,
		size,
		density,
		scrollFade: scrollFadeAxis,
		className
	})}
>
	{#each resolvedItems as entry (entry.key)}
		<TimelineEntry
			{entry}
			{placement}
			{variant}
			{size}
			{density}
			{showConnectors}
			loadingLabel={messages.loading}
			{classes}
			{itemRenderer}
			{markerRenderer}
			{oppositeRenderer}
		/>
	{/each}
</ol>
