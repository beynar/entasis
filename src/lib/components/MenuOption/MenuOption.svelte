<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import type { MenuOptionProps } from './menuOption.props.js';
	import { useMenuOptionTheme } from './menuOption.theme.js';

	let {
		color = 'neutral',
		size = 'normal',
		density = 'normal',
		class: className = '',
		onclick,
		onpointerenter,
		onpointerleave,
		href,
		target,
		rel,
		as,
		role,
		highlighted,
		selected,
		active = false,
		disabled = false,
		title,
		description,
		children,
		prefix,
		suffix,
		attrs,
		theme,
		...attachments
	}: MenuOptionProps = $props();

	const classes = $derived(useMenuOptionTheme(theme));

	// Determine element type: custom 'as', link if href, button if interactive, otherwise div
	const elementType = $derived(as || (href ? 'a' : 'button'));

	// Explicit role wins (the listbox family passes 'option'); otherwise derive from the element.
	const resolvedRole = $derived(
		role ?? (elementType === 'button' ? 'button' : elementType === 'a' ? 'link' : 'menuitem')
	);

	// Attributes assembled conditionally so the menu family (which sets data-highlighted
	// imperatively via useNavigation) is never clobbered by a reactive `undefined` binding — the
	// key is simply absent unless a `highlighted` prop is passed (listbox/combobox family).
	const dynamicAttrs = $derived({
		...attrs,
		...(highlighted !== undefined ? { 'data-highlighted': highlighted ? 'true' : undefined } : {}),
		...(selected !== undefined
			? { 'aria-selected': selected, 'data-selected': selected || undefined }
			: {}),
		...(disabled ? { 'aria-disabled': true, onclick: handleClick } : {}),
		...(disabled && elementType === 'button' ? { disabled: true } : {}),
		...(disabled && elementType === 'a' ? { tabindex: -1, href: undefined } : {})
	});

	function handleClick(event: MouseEvent) {
		if (disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		onclick?.(event);
	}
</script>

<svelte:element
	this={elementType}
	type={elementType === 'button' ? 'button' : undefined}
	role={resolvedRole}
	href={elementType === 'a' && disabled ? undefined : href}
	{target}
	{rel}
	data-color={color}
	data-size={size}
	data-density={density}
	onclick={disabled || onclick ? handleClick : undefined}
	onpointerenter={disabled ? undefined : onpointerenter}
	onpointerleave={disabled ? undefined : onpointerleave}
	class={classes.root({
		color,
		size,
		density,
		disabled,
		highlighted,
		active,
		className
	})}
	{...dynamicAttrs}
	{...attachments}
>
	<Slot
		render={prefix}
		class={classes.prefix({ size, align: title && description ? 'start' : 'center' })}
	/>

	{#if children}
		<Slot render={children} />
	{:else if title || description}
		<div class={classes.content({ density })}>
			<Slot renderIf={!!title} render={title} class="{classes.title({ size })} leading-none" />

			<Slot renderIf={!!description} render={description} class={classes.description({ size })} />
		</div>
	{/if}

	<Slot render={suffix} class={classes.suffix({ size })} />
</svelte:element>
