<script lang="ts">
	import { spinnerOverlay } from '$lib/attachments/spinnerOverlay.svelte.js';
	import Slot from '../Slot/Slot.svelte';
	import type { ButtonInternalProps } from './button.props.js';
	import { useButtonTheme } from './button.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';

	let {
		as,
		loading = false,
		onclick = null,
		onpointerenter = null,
		onpointerleave = null,
		href,
		squared,
		class: className,
		color,
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
		haspopup,
		expanded,
		controls,
		selected,
		pressed,
		'data-active': dataActive,
		'data-highlighted': dataHighlighted,
		'data-slot': dataSlot,
		...attachments
	}: ButtonInternalProps = $props();

	const isSquared = $derived(
		squared ?? !!((!children && prefix && !suffix) || (!children && !prefix && suffix))
	);
	const isAnchor = $derived(!!(as || href));

	const resolvedColor = $derived(useDefaultColor(color));
	// One set of variant values for every slot; the template reads `slots.x()`.
	const slots = $derived(
		useButtonTheme(theme, {
			color: resolvedColor,
			squared: isSquared,
			variant,
			size,
			loading,
			disabled,
			fullWidth
		})
	);

	const handleClick: NonNullable<ButtonInternalProps['onclick']> = (event) => {
		if (disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		onclick?.(event);
	};

	const handlePointerEnter: NonNullable<ButtonInternalProps['onpointerenter']> = (event) => {
		if (!disabled) onpointerenter?.(event);
	};

	const handlePointerLeave: NonNullable<ButtonInternalProps['onpointerleave']> = (event) => {
		if (!disabled) onpointerleave?.(event);
	};
</script>

<svelte:element
	this={isAnchor ? 'a' : 'button'}
	aria-label={label}
	aria-haspopup={haspopup}
	aria-expanded={expanded}
	aria-controls={controls}
	aria-selected={selected}
	aria-pressed={pressed}
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
	data-color={resolvedColor}
	disabled={!isAnchor && disabled ? true : undefined}
	class={slots.root({ className })}
	{@attach spinnerOverlay({ loading, size })}
	onclick={disabled || onclick ? handleClick : undefined}
	onpointerenter={onpointerenter ? handlePointerEnter : undefined}
	onpointerleave={onpointerleave ? handlePointerLeave : undefined}
	{...attachments}
>
	<Slot render={prefix} as="span" class={slots.prefix()} />
	<Slot render={children} />
	<Slot render={suffix} as="span" class={slots.suffix()} />
</svelte:element>
