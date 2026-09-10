<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import type { ChipProps } from './chip.props.js';
	import { useChipTheme } from './chip.theme.js';
	const {
		color = 'primary',
		variant = 'solid',
		children,
		size = 'normal',
		position,
		class: className = '',
		onclick,
		onpointerenter,
		onpointerleave,
		suffix,
		target,
		rel,
		prefix,
		href,
		type = 'button',
		disabled,
		'aria-pressed': ariaPressed,
		'aria-disabled': ariaDisabled,
		theme,
		...attachments
	}: ChipProps = $props();

	const classes = $derived(useChipTheme(theme));
	const as = $derived(href ? 'a' : onclick || onpointerenter || onpointerleave ? 'button' : 'div');
	const isEmpty = $derived(!children && !prefix && !suffix);
</script>

<svelte:element
	this={as}
	role={as === 'button' ? 'button' : as === 'a' ? 'link' : 'none'}
	data-variant={variant}
	data-color={color}
	data-size={size}
	data-position={position}
	data-chip-position={position}
	{rel}
	{target}
	{href}
	type={as === 'button' ? type : undefined}
	disabled={as === 'button' ? disabled : undefined}
	aria-pressed={ariaPressed}
	aria-disabled={ariaDisabled}
	{onclick}
	{onpointerenter}
	{onpointerleave}
	class={classes.root({ color, variant, size, position, className, isLink: as === 'a', isEmpty })}
	{...attachments}
>
	<Slot render={prefix} class={classes.prefix({ size })} />
	<Slot render={children} />
	<Slot render={suffix} class={classes.suffix({ size })} />
</svelte:element>
