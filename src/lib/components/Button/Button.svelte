<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { spinnerOverlay } from '$lib/attachments/spinnerOverlay.svelte.js';
	import Slot from '../Slot/Slot.svelte';
	import type { ButtonInternalProps } from './button.props.js';
	import { useButtonTheme } from './button.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';

	let {
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
		focusableWhenDisabled = false,
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
	const isAnchor = $derived(!!href);
	// Only a disabled <button> uses the native attribute, and only when it may leave the tab order.
	// A loading button, or one that is `focusableWhenDisabled`, stays focusable, so a keyboard user
	// keeps their place, and refuses activation through `aria-disabled` instead.
	const nativeDisabled = $derived(!isAnchor && disabled && !focusableWhenDisabled);
	const inactive = $derived(disabled || loading);
	// A disabled anchor has no `href`, so only an explicit tabindex keeps it focusable.
	const anchorTabindex = $derived(
		isAnchor && disabled ? (focusableWhenDisabled ? (tabindex ?? 0) : -1) : tabindex
	);

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
			focusable: focusableWhenDisabled,
			fullWidth
		})
	);

	// Enter and Space still dispatch `click` on a focusable loading button. A capture listener on
	// the element cancels that click before anything else sees it: listeners attached to the
	// button itself (`{@attach popover.trigger}`), Svelte's delegated `onclick` handlers, and a
	// router listening on <html>, which runs before them for content portaled outside the app
	// root. Cancelling it also stops a submit button from submitting and an anchor from
	// navigating. The listener is registered once and reads `inactive` on each click.
	const refuseInactiveActivation: Attachment<HTMLElement> = (node) => {
		const refuse = (event: MouseEvent) => {
			if (!inactive) return;
			event.preventDefault();
			event.stopImmediatePropagation();
		};
		node.addEventListener('click', refuse, { capture: true });
		return () => node.removeEventListener('click', refuse, { capture: true });
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
	aria-disabled={inactive && !nativeDisabled ? true : undefined}
	aria-busy={loading ? true : undefined}
	role={role ?? (isAnchor ? 'link' : 'button')}
	href={isAnchor && !disabled ? href : undefined}
	{rel}
	{target}
	{download}
	{type}
	tabindex={anchorTabindex}
	bind:this={ref}
	data-active={dataActive}
	data-highlighted={dataHighlighted}
	data-slot={dataSlot}
	data-color={resolvedColor}
	disabled={nativeDisabled ? true : undefined}
	class={slots.root({ className })}
	{@attach refuseInactiveActivation}
	{@attach spinnerOverlay({ loading, size })}
	{onclick}
	onpointerenter={onpointerenter ? handlePointerEnter : undefined}
	onpointerleave={onpointerleave ? handlePointerLeave : undefined}
	{...attachments}
>
	<Slot render={prefix} as="span" class={slots.prefix()} />
	<Slot render={children} />
	<Slot render={suffix} as="span" class={slots.suffix()} />
</svelte:element>
