<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import type { ToggleButtonProps } from './toggleButton.props.js';
	import { useToggleButtonTheme } from './toggleButton.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	let {
		onValueChange = null,
		class: className,
		label,
		role,
		type = 'button',
		color,
		prefix,
		suffix,
		children,
		size = 'normal',
		ref = $bindable(),
		disabled = false,
		theme,
		defaultValue = false,
		value = $bindable(),
		variant = 'ghost',
		...attachments
	}: ToggleButtonProps = $props();
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	const isSquared = $derived(
		!!((!children && prefix && !suffix) || (!children && !prefix && suffix))
	);

	const classes = $derived(useToggleButtonTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));
</script>

<button
	{type}
	bind:this={ref}
	data-color={resolvedColor}
	data-checked={valueState.value}
	aria-label={label}
	{role}
	aria-pressed={role === 'radio' ? undefined : valueState.value}
	aria-checked={role === 'radio' ? valueState.value : undefined}
	{disabled}
	class={classes.root({
		color: resolvedColor,
		checked: valueState.value,
		squared: isSquared,
		variant,
		size,
		disabled,
		className
	})}
	onclick={() => {
		if (!disabled) {
			valueState.value = !valueState.value;
			onValueChange?.(valueState.value);
		}
	}}
	{...attachments}
>
	<Slot render={prefix} class={classes.prefix({ size, checked: valueState.value })} />
	<Slot render={children} />
	<Slot render={suffix} class={classes.suffix({ size, checked: valueState.value })} />
</button>
