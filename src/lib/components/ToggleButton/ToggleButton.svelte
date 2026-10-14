<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
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
		focusableWhenDisabled = false,
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

	// A disabled button leaves the tab order through the native attribute, unless it is
	// `focusableWhenDisabled`: then it keeps focus and announces `aria-disabled` instead.
	const nativeDisabled = $derived(disabled && !focusableWhenDisabled);

	// A focusable disabled button still receives clicks (and Enter or Space), so a capture listener
	// cancels them before the group's or the consumer's own handlers see them. It is registered
	// once and reads `disabled` on each click.
	const refuseDisabledActivation: Attachment<HTMLElement> = (node) => {
		const refuse = (event: MouseEvent) => {
			if (!disabled) return;
			event.preventDefault();
			event.stopImmediatePropagation();
		};
		node.addEventListener('click', refuse, { capture: true });
		return () => node.removeEventListener('click', refuse, { capture: true });
	};

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
	disabled={nativeDisabled ? true : undefined}
	aria-disabled={disabled && !nativeDisabled ? true : undefined}
	class={classes.root({
		color: resolvedColor,
		checked: valueState.value,
		squared: isSquared,
		variant,
		size,
		disabled,
		focusable: focusableWhenDisabled,
		className
	})}
	{@attach refuseDisabledActivation}
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
