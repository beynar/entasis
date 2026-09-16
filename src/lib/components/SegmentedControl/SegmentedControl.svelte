<script
	lang="ts"
	generics="Value extends string = string, Items extends readonly SegmentedControlItem<Value>[] = readonly SegmentedControlItem<Value>[]"
>
	import Slot from '../Slot/Slot.svelte';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import { useSlidingIndicator } from '$lib/utils/useSlidingIndicator.svelte.js';
	import type { SegmentedControlItem, SegmentedControlProps } from './segmentedControl.props.js';
	import { useSegmentedControlTheme } from './segmentedControl.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		items,
		defaultValue = items.find((item) => !item.disabled)?.value,
		value = $bindable(),
		onValueChange,
		item: itemRenderer,
		size = 'normal',
		color,
		variant = 'normal',
		disabled = false,
		label,
		class: className,
		theme,
		...attachments
	}: SegmentedControlProps<Items> = $props();
	const t = $derived(useI18n());
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	const id = $props.id();
	const classes = $derived(useSegmentedControlTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));
	const selectedIndex = $derived(items.findIndex((item) => item.value === valueState.value));
	const firstEnabledIndex = $derived(items.findIndex((item) => !item.disabled));
	const tabStopIndex = $derived(
		selectedIndex >= 0 && !items[selectedIndex]?.disabled ? selectedIndex : firstEnabledIndex
	);

	// A painted snippet label names its own segment; a string label is painted and spoken, and an
	// icon-only segment borrows its value.
	function itemLabel(segment: SegmentedControlItem) {
		if (typeof segment.label === 'string') return segment.label;
		return segment.label ? undefined : segment.value;
	}

	function selectItem(index: number) {
		const selectedItem = items[index];
		if (
			!selectedItem ||
			disabled ||
			selectedItem.disabled ||
			selectedItem.value === valueState.value
		)
			return;

		valueState.value = selectedItem.value;
		onValueChange?.(selectedItem.value);
	}

	const navigation = useNavigation({
		orientation: 'horizontal',
		loop: true,
		id,
		enabled: () => !disabled,
		enableHoverFocus: false,
		defaultFocusedIndex: () => (tabStopIndex >= 0 ? tabStopIndex : null),
		onChange: (index) => {
			if (index !== null) selectItem(index);
		}
	});

	const indicator = useSlidingIndicator({
		activeIndex: () => selectedIndex,
		observe: () => [items, size],
		getStyle: (element) =>
			`transform:translate(${element.offsetLeft}px, ${element.offsetTop}px);width:${element.offsetWidth}px;height:${element.offsetHeight}px`
	});
</script>

<div
	role="radiogroup"
	aria-label={label ?? t.segmentedControl}
	aria-orientation="horizontal"
	aria-disabled={disabled || undefined}
	tabindex="-1"
	data-color={resolvedColor}
	class={classes.root({ size, variant, disabled, className })}
	{@attach navigation.containerReference}
	{@attach indicator.containerReference}
	{...attachments}
>
	{#if indicator.isHydrated && selectedIndex >= 0}
		<span
			class={classes.indicator({ variant, color: resolvedColor })}
			style={indicator.style}
			data-ready={indicator.isReady ? 'true' : 'false'}
			aria-hidden="true"
		></span>
	{/if}

	{#each items as controlItem, index (controlItem.value)}
		{@const isSelected = selectedIndex === index}
		{@const isFocused = navigation.focusedIndex === index}
		{@const isDisabled = disabled || !!controlItem.disabled}
		<button
			type="button"
			role="radio"
			aria-checked={isSelected}
			aria-label={itemLabel(controlItem)}
			disabled={isDisabled}
			tabindex={isFocused || (navigation.focusedIndex === null && tabStopIndex === index) ? 0 : -1}
			data-value={controlItem.value}
			data-selected={isSelected ? 'true' : 'false'}
			class={classes.item({
				size,
				variant,
				color: resolvedColor,
				selected: isSelected,
				disabled: isDisabled
			})}
			onclick={() => {
				selectItem(index);
				navigation.focusItem(index);
			}}
			{@attach navigation.itemReference}
			{@attach indicator.itemReference(index)}
		>
			{#if !indicator.isHydrated && isSelected}
				<span class={classes.staticIndicator({ variant, color: resolvedColor })} aria-hidden="true"
				></span>
			{/if}

			{#if itemRenderer}
				{@render itemRenderer(controlItem)}
			{:else}
				<Slot render={controlItem.icon} />
				{#if controlItem.label}
					<Slot render={controlItem.label} />
				{:else if !controlItem.icon}
					{controlItem.value}
				{/if}
			{/if}
		</button>
	{/each}
</div>
