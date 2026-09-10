<script lang="ts" generics="Items extends ToggleButtonGroupItems = ToggleButtonGroupItems">
	import ToggleButton from '../ToggleButton/ToggleButton.svelte';
	import type {
		ToggleButtonGroupItems,
		ToggleButtonGroupProps
	} from './toggleButtonGroup.props.js';
	import { useToggleButtonGroupTheme } from './toggleButtonGroup.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

	let {
		items,
		ariaLabel,
		size,
		defaultValue = {},
		value = $bindable(),
		color,
		variant,
		disabled,
		joined = false,
		theme,
		class: className,
		onValueChange,
		...attachments
	}: ToggleButtonGroupProps<Items> = $props();
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	const classes = $derived(useToggleButtonGroupTheme(theme));
	const currentValue = $derived(valueState.value);
</script>

<div
	role="group"
	aria-label={ariaLabel}
	data-color={color}
	class={classes.root({ className, joined })}
	{...attachments}
>
	{#each Object.entries(items) as [key, button] (key)}
		<ToggleButton
			{size}
			{color}
			{variant}
			{...button}
			disabled={disabled || button.disabled}
			value={currentValue[key] ?? false}
			onValueChange={(checked) => {
				button.onValueChange?.(checked);
				const nextValue = { ...currentValue, [key]: checked };
				valueState.value = nextValue;
				onValueChange?.(nextValue);
			}}
		/>
	{/each}
</div>
