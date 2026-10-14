<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import type { Colors, Density, Sizes } from '$lib/types/theme.js';
	import { checkIcon } from '../Icons/check.js';
	import MenuOption from '../MenuOption/MenuOption.svelte';
	import { useMenuOptionTheme } from '../MenuOption/menuOption.theme.js';
	import Slot from '../Slot/Slot.svelte';
	import type { MenuRadioGroupItem, MenuRadioItem } from './menu.props.js';
	import { useMenuTheme, type MenuThemeProps } from './menu.theme.js';

	let {
		item,
		id,
		density,
		size,
		color,
		theme,
		rowAttach
	}: {
		item: MenuRadioGroupItem;
		/** A unique id for the group's label. */
		id: string;
		density: Density;
		size: Sizes;
		color?: Colors;
		theme?: MenuThemeProps;
		/** Registers each radio row with the menu's keyboard navigation. */
		rowAttach?: Attachment<HTMLElement>;
	} = $props();

	const menuClasses = $derived(useMenuTheme(theme));
	const optionClasses = $derived(useMenuOptionTheme(theme?.option));
	// A `value` makes the group controlled: the parent decides what a press changes.
	const current = createBindableValue<string | undefined>(
		() => item.value,
		() => {},
		() => item.defaultValue
	);

	// Choosing the checked radio changes nothing. The consumer's `onclick` runs first, and
	// `preventDefault()` there refuses the choice.
	const choose = (radio: MenuRadioItem, event: MouseEvent) => {
		radio.onclick?.(event);
		if (event.defaultPrevented || current.value === radio.value) return;
		current.value = radio.value;
		item.onValueChange?.(radio.value);
	};

	const rowProps = (radio: MenuRadioItem) => {
		/* eslint-disable @typescript-eslint/no-unused-vars -- Remove the menu fields before forwarding the rest to the row. */
		const {
			key: _key,
			value: _value,
			onclick: _onclick,
			closeOnClick: _closeOnClick,
			suffix: _suffix,
			...rest
		} = radio;
		/* eslint-enable @typescript-eslint/no-unused-vars */
		return rest;
	};
</script>

<div
	role="group"
	aria-labelledby={item.label ? id : undefined}
	class={menuClasses.group({ density })}
>
	{#if item.label}
		<div {id} aria-hidden="true" class={menuClasses.groupLabel({ density })}>
			<Slot render={item.label} />
		</div>
	{/if}
	{#each item.items as radio (radio.key ?? radio.value)}
		{@const checked = current.value === radio.value}
		{#snippet suffix()}
			<Slot render={radio.suffix} />
			<span
				class={optionClasses.indicator({ checked })}
				data-checked={checked ? 'true' : 'false'}
				aria-hidden="true"
			>
				{@render checkIcon()}
			</span>
		{/snippet}
		<MenuOption
			role="menuitemradio"
			{density}
			{size}
			{...color ? { color } : {}}
			{...rowProps(radio)}
			{suffix}
			disabled={item.disabled || radio.disabled}
			selected={checked}
			closeOnClick={radio.closeOnClick ?? item.closeOnClick ?? false}
			theme={theme?.option}
			onclick={(event) => choose(radio, event)}
			{@attach rowAttach}
		/>
	{/each}
</div>
