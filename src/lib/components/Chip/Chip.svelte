<script lang="ts">
	import { safeHref } from '$lib/utils/safeHref.js';
	import Slot from '../Slot/Slot.svelte';
	import type { ChipProps } from './chip.props.js';
	import { useChipTheme } from './chip.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	const {
		color,
		variant = 'outline',
		selected,
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
		label,
		title,
		theme,
		...attachments
	}: ChipProps = $props();

	const classes = $derived(useChipTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));
	const link = $derived(safeHref(href));
	// A static chip is a `<span>`, like its prefix and suffix wrappers: a chip sits in running text
	// (a paragraph, a button, a link), where only phrasing content is valid.
	const as = $derived(link ? 'a' : onclick || onpointerenter || onpointerleave ? 'button' : 'span');
	const isEmpty = $derived(!children && !prefix && !suffix);
</script>

<svelte:element
	this={as}
	role={as === 'button' ? 'button' : as === 'a' ? 'link' : 'none'}
	data-variant={variant}
	data-selected={selected || undefined}
	data-color={resolvedColor}
	data-size={size}
	data-position={position}
	data-chip-position={position}
	{rel}
	{target}
	href={link}
	type={as === 'button' ? type : undefined}
	disabled={as === 'button' ? disabled : undefined}
	aria-pressed={as === 'button' ? selected : undefined}
	aria-current={as === 'a' && selected ? true : undefined}
	aria-disabled={as !== 'button' && disabled ? true : undefined}
	aria-label={as === 'span' ? undefined : label}
	{title}
	{onclick}
	{onpointerenter}
	{onpointerleave}
	class={classes.root({
		color: resolvedColor,
		variant,
		selected,
		size,
		position,
		className,
		isLink: as === 'a',
		isEmpty
	})}
	{...attachments}
>
	<Slot as="span" render={prefix} class={classes.prefix({ size })} />
	<Slot render={children} />
	<Slot as="span" render={suffix} class={classes.suffix({ size })} />
</svelte:element>
