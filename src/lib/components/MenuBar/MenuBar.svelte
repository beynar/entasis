<script lang="ts">
	import Button from '../Button/Button.svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import type { MenuBarProps } from './menuBar.props.js';
	import { useMenuBarState } from './menuBar.state.svelte.js';
	import { useMenuBarTheme } from './menuBar.theme.js';
	import { useDirection } from '$lib/utils/useDirection.svelte.js';

	let {
		menus,
		size = 'normal',
		dir,
		closeOnItemClick = true,
		class: className = '',
		theme,
		...attachments
	}: MenuBarProps = $props();

	const id = $props.id();
	const classes = $derived(useMenuBarTheme(theme));
	let root = $state<HTMLElement | null>(null);
	// Explicit `dir` wins; otherwise follow the i18n context or the element's computed direction.
	const getDirection = useDirection(
		() => root,
		() => dir
	);
	const menuBar = useMenuBarState(() => menus, getDirection, id);
</script>

<div
	role="menubar"
	aria-orientation="horizontal"
	{dir}
	tabindex="-1"
	data-size={size}
	class={classes.root({ size, className })}
	bind:this={root}
	{@attach menuBar.navigation.containerReference}
	{...attachments}
>
	{#each menus as menu, index (index)}
		<PopupMenu
			id={`${id}-menu-${index}`}
			bind:open={menuBar.openStates[index]}
			position="bottom-start"
			offset={4}
			lockScroll={false}
			{closeOnItemClick}
			menu={{
				...menuBar.getMenuProps(menu, index),
				// Last, and read off `menu` explicitly: `getMenuProps` builds from `{ ...menu }`,
				// so a MenuBarMenu written or spread with `size: undefined` still carries that as
				// an own key. Spreading the bar's `size` first would let that undefined win, and
				// MenuFloating's `size = 'normal'` default would replace the bar's size instead
				// of the menu inheriting it.
				size: menu.size ?? size
			}}
			onAfterClose={() => menuBar.handleMenuClose(index)}
		>
			{#snippet trigger(popover)}
				<Button
					type="button"
					role="menuitem"
					variant="ghost"
					color="neutral"
					{size}
					prefix={menu.prefix}
					suffix={menu.suffix}
					children={menu.label}
					disabled={menu.disabled}
					expanded={menuBar.activeIndex === index}
					controls={`${id}-menu-${index}`}
					data-active={menuBar.activeIndex === index ? 'true' : undefined}
					class={classes.trigger({ active: menuBar.activeIndex === index })}
					onclick={() => menuBar.handleTriggerClick(index)}
					{@attach popover.reference}
					{@attach menuBar.navigation.itemReference}
					{@attach menuBar.attachTrigger(index)}
				/>
			{/snippet}
		</PopupMenu>
	{/each}
</div>
