<script lang="ts">
	import Button from '../Button/Button.svelte';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import { useHoverAction } from '$lib/utils/useHoverAction.svelte.js';
	import { popupTriggerAttributes, presence } from '$lib/utils/stateAttributes.js';
	import { getNavigationMenuState } from './navigationMenu.state.svelte.js';
	import type { NavigationMenuPanel } from './navigationMenu.props.js';
	import type { useNavigationMenuTheme } from './navigationMenu.theme.js';

	type Classes = ReturnType<typeof useNavigationMenuTheme>;

	let {
		item,
		size,
		color,
		classes
	}: {
		item: NavigationMenuPanel<string>;
		size: Sizes;
		color: Colors;
		classes: Classes;
	} = $props();

	const menu = getNavigationMenuState();
	const open = $derived(menu.isOpenFor(item.value));

	// Resting the pointer on the trigger opens its panel; once a panel is open, moving on to
	// another trigger switches at once. A touch tap and a disabled trigger never hover.
	const hover = useHoverAction({
		isActive: () => menu.openOnHover && !menu.isOpenFor(item.value),
		onMouseEnter: (event) => menu.hoverTrigger(item.value, event),
		delay: () => (menu.isOpen ? 0 : menu.delay)
	});
</script>

{#snippet caret()}
	<span aria-hidden="true" class={classes.caret({ open })}
		>{@render caretDownIcon({ size: 16 })}</span
	>
{/snippet}

<Button
	id={menu.triggerId(item.value)}
	variant="ghost"
	{size}
	{color}
	disabled={item.disabled}
	label={item.ariaLabel}
	prefix={item.prefix}
	children={item.label}
	suffix={caret}
	expanded={open}
	controls={menu.hasPanel(item.value) ? menu.panelId(item.value) : undefined}
	data-slot="navigation-menu-trigger"
	{...popupTriggerAttributes(open)}
	data-disabled={presence(item.disabled)}
	class={classes.trigger({ open })}
	onclick={(event) => menu.pressTrigger(item.value, event)}
	{@attach menu.trigger(item.value)}
	{@attach hover.reference}
	{@attach open ? menu.safeArea.anchorReference : undefined}
/>
