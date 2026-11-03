<script lang="ts" generics="Item extends TimelineItem = TimelineItem">
	import TimelineEntry from './TimelineEntry.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import { useOverflowObserver } from '$lib/utils/useOverflowObserver.svelte.js';
	import { resolveTimelineItems, type ResolvedTimelineItem } from './timeline.items.js';
	import type { TimelineItem, TimelineProps, TimelineValue } from './timeline.props.js';
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
		connectorColor,
		showConnectors = true,
		scrollFade = true,
		selectable = false,
		value = $bindable(),
		defaultValue,
		onValueChange,
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
		resolveTimelineItems(items, orientation, placement, color, connectorColor, selectable)
	);

	const valueState = createBindableValue<TimelineValue | undefined>(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);
	const selectedValue = $derived(selectable ? valueState.value : undefined);
	const isSelectable = (entry: ResolvedTimelineItem<Item>) =>
		selectable && entry.item.disabled !== true;

	function select(entry: ResolvedTimelineItem<Item>) {
		if (!isSelectable(entry) || entry.value === valueState.value) return;
		valueState.value = entry.value;
		onValueChange?.({ value: entry.value, item: entry.item, index: entry.index });
	}

	// One tab stop for the list, on the selected item, else the current step, else the first enabled
	// item. Arrows along the axis and Home/End move it; Enter and Space click the focused button,
	// which selects. Focus never selects by itself. The registry is keyed by the button elements,
	// which the keyed `#each` moves with their items, so the tab stop survives inserts, removals and
	// reorders.
	const navigation = useNavigation({
		enabled: () => selectable,
		orientation: () => orientation,
		enableHoverFocus: false,
		focusableContainer: false,
		// Escape stays with whatever contains the timeline (a dialog closes on it).
		preventKeyboardDefault: false,
		defaultFocusedIndex: () => {
			let index = resolvedItems.findIndex(
				(entry) => entry.value === selectedValue && isSelectable(entry)
			);
			if (index === -1) {
				index = resolvedItems.findIndex(
					(entry) => entry.item.progress === 'current' && isSelectable(entry)
				);
			}
			return index === -1 ? null : index;
		}
	});

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
		// A selectable timeline scrolls by moving focus between its buttons, so it needs no scroll stop.
		tabindex ?? (!selectable && orientation === 'horizontal' && isOverflowing ? 0 : undefined)
	);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<ol
	{...rootAttributes}
	bind:this={ref}
	tabindex={resolvedTabindex}
	{@attach overflow.attachment}
	{@attach selectable ? navigation.containerReference : undefined}
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
		selectable,
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
			{selectable}
			selected={selectable && entry.value === selectedValue}
			onSelect={() => select(entry)}
			navigationItem={navigation.itemReference}
			loadingLabel={messages.loading}
			{classes}
			{itemRenderer}
			{markerRenderer}
			{oppositeRenderer}
		/>
	{/each}
</ol>
