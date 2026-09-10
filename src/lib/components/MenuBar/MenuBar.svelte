<script lang="ts">
	import Button from '../Button/Button.svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import type { MenuBarProps } from './menuBar.props.js';
	import { useMenuBarState } from './menuBar.state.svelte.js';
	import { useMenuBarTheme } from './menuBar.theme.js';

	let {
		menus,
		size = 'normal',
		dir = 'ltr',
		closeOnItemClick = true,
		class: className = '',
		theme,
		...attachments
	}: MenuBarProps = $props();

	const id = $props.id();
	const classes = $derived(useMenuBarTheme(theme));
	const state = useMenuBarState(
		() => menus,
		() => dir,
		id
	);
</script>

<div
	role="menubar"
	aria-orientation="horizontal"
	{dir}
	tabindex="-1"
	data-size={size}
	class={classes.root({ size, className })}
	{@attach state.navigation.containerReference}
	{...attachments}
>
	{#each menus as menu, index}
		<PopupMenu
			id={`${id}-menu-${index}`}
			bind:open={state.openStates[index]}
			position="bottom-start"
			offset={4}
			lockScroll={false}
			{closeOnItemClick}
			menu={state.getMenuProps(menu, index)}
			onAfterClose={() => state.handleMenuClose(index)}
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
					aria-haspopup="menu"
					aria-expanded={state.activeIndex === index}
					aria-controls={`${id}-menu-${index}`}
					data-active={state.activeIndex === index ? 'true' : undefined}
					class={classes.trigger({ active: state.activeIndex === index })}
					onclick={() => state.handleTriggerClick(index)}
					{@attach popover.reference}
					{@attach state.navigation.itemReference}
					{@attach state.attachTrigger(index)}
				/>
			{/snippet}
		</PopupMenu>
	{/each}
</div>
