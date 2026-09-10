<script lang="ts">
	import { spinnerOverlay } from '$lib/attachments/spinnerOverlay.svelte.js';
	import Slot from '../Slot/Slot.svelte';
	import type { ButtonPrimitiveProps } from './button.props.js';
	import { useButtonTheme } from './button.theme.js';

	let {
		as,
		loading = false,
		onclick = null,
		onpointerenter = null,
		onpointerleave = null,
		href,
		squared,
		class: className,
		color = 'primary',
		prefix,
		suffix,
		children,
		variant = 'solid',
		type,
		tabindex,
		size = 'normal',
		ref = $bindable(),
		fullWidth = false,
		disabled = false,
		theme,
		rel,
		target,
		download,
		label,
		role,
		'aria-haspopup': ariaHaspopup,
		'aria-expanded': ariaExpanded,
		'aria-controls': ariaControls,
		'aria-selected': ariaSelected,
		'aria-pressed': ariaPressed,
		'data-active': dataActive,
		'data-highlighted': dataHighlighted,
		'data-slot': dataSlot,
		...attachments
	}: ButtonPrimitiveProps = $props();

	const isSquared = $derived(
		squared ?? !!((!children && prefix && !suffix) || (!children && !prefix && suffix))
	);
	const isAnchor = $derived(!!(as || href));

	const classes = $derived(useButtonTheme(theme));

	const handleClick: NonNullable<ButtonPrimitiveProps['onclick']> = (event) => {
		if (disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		onclick?.(event);
	};

	const handlePointerEnter: NonNullable<ButtonPrimitiveProps['onpointerenter']> = (event) => {
		if (!disabled) onpointerenter?.(event);
	};

	const handlePointerLeave: NonNullable<ButtonPrimitiveProps['onpointerleave']> = (event) => {
		if (!disabled) onpointerleave?.(event);
	};
</script>

<svelte:element
	this={isAnchor ? 'a' : 'button'}
	aria-label={label}
	aria-haspopup={ariaHaspopup}
	aria-expanded={ariaExpanded}
	aria-controls={ariaControls}
	aria-selected={ariaSelected}
	aria-pressed={ariaPressed}
	aria-disabled={isAnchor && disabled ? true : undefined}
	role={role ?? (isAnchor ? 'link' : 'button')}
	href={isAnchor && !disabled ? href : undefined}
	{rel}
	{target}
	{download}
	{type}
	tabindex={isAnchor && disabled ? -1 : tabindex}
	bind:this={ref}
	data-active={dataActive}
	data-highlighted={dataHighlighted}
	data-slot={dataSlot}
	data-color={color}
	disabled={!isAnchor && disabled ? true : undefined}
	class={classes.root({
		color,
		squared: isSquared,
		variant,
		size,
		loading,
		disabled,
		className,
		fullWidth
	})}
	{@attach spinnerOverlay({ loading, size })}
	onclick={disabled || onclick ? handleClick : undefined}
	onpointerenter={onpointerenter ? handlePointerEnter : undefined}
	onpointerleave={onpointerleave ? handlePointerLeave : undefined}
	{...attachments}
>
	<Slot render={prefix} as="span" class={classes.prefix({ size })} />
	<Slot render={children} />
	<Slot render={suffix} as="span" class={classes.suffix({ size })} />
</svelte:element>
