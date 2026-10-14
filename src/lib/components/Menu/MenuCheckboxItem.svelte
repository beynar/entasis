<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import type { Colors, Density, Sizes } from '$lib/types/theme.js';
	import { checkIcon } from '../Icons/check.js';
	import MenuOption from '../MenuOption/MenuOption.svelte';
	import { useMenuOptionTheme } from '../MenuOption/menuOption.theme.js';
	import Slot from '../Slot/Slot.svelte';
	import type { MenuCheckboxItem } from './menu.props.js';
	import type { MenuThemeProps } from './menu.theme.js';

	let {
		item,
		density,
		size,
		color,
		theme,
		rowAttach
	}: {
		item: MenuCheckboxItem;
		density: Density;
		size: Sizes;
		color?: Colors;
		theme?: MenuThemeProps;
		/** Registers the row with the menu's keyboard navigation. */
		rowAttach?: Attachment<HTMLElement>;
	} = $props();

	const classes = $derived(useMenuOptionTheme(theme?.option));
	// A `value` makes the row controlled: the parent decides what a press changes.
	const checked = createBindableValue<boolean>(
		() => item.value,
		() => {},
		() => item.defaultValue ?? false
	);

	// The consumer's `onclick` runs first, and `preventDefault()` there refuses the toggle.
	const press = (event: MouseEvent) => {
		item.onclick?.(event);
		if (event.defaultPrevented) return;
		const next = !checked.value;
		checked.value = next;
		item.onValueChange?.(next);
	};

	const rowProps = $derived.by(() => {
		/* eslint-disable @typescript-eslint/no-unused-vars -- Remove the menu fields before forwarding the rest to the row. */
		const {
			type: _type,
			key: _key,
			value: _value,
			defaultValue: _defaultValue,
			onValueChange: _onValueChange,
			onclick: _onclick,
			closeOnClick: _closeOnClick,
			suffix: _suffix,
			...rest
		} = item;
		/* eslint-enable @typescript-eslint/no-unused-vars */
		return rest;
	});
</script>

{#snippet suffix()}
	<Slot render={item.suffix} />
	<span
		class={classes.indicator({ checked: checked.value })}
		data-checked={checked.value ? 'true' : 'false'}
		aria-hidden="true"
	>
		{@render checkIcon()}
	</span>
{/snippet}

<MenuOption
	role="menuitemcheckbox"
	{density}
	{size}
	{...color ? { color } : {}}
	{...rowProps}
	{suffix}
	selected={checked.value}
	closeOnClick={item.closeOnClick ?? false}
	theme={theme?.option}
	onclick={press}
	{@attach rowAttach}
/>
