<script lang="ts" generics="Value extends string = string">
	import type { Attachment } from 'svelte/attachments';
	import Button from '../Button/Button.svelte';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import { transitionSize } from '$lib/attachments/transitionSize.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { composeHandlers } from '$lib/utils/handlers.js';
	import {
		openStateAttributes,
		transitionStatusAttributes,
		presence
	} from '$lib/utils/stateAttributes.js';
	import NavigationMenuContent from './NavigationMenuContent.svelte';
	import NavigationMenuTrigger from './NavigationMenuTrigger.svelte';
	import type { NavigationMenuProps } from './navigationMenu.props.js';
	import {
		setNavigationMenuState,
		useNavigationMenuState,
		type NavigationMenuState
	} from './navigationMenu.state.svelte.js';
	import { useNavigationMenuTheme } from './navigationMenu.theme.js';

	let {
		items,
		label,
		ref = $bindable(null),
		value = $bindable(),
		defaultValue = null,
		onValueChange,
		openOnHover = true,
		delay = 50,
		closeDelay = 100,
		keepMounted = false,
		onAfterOpen,
		onAfterClose,
		size = 'normal',
		density = 'normal',
		color,
		dir,
		transition,
		class: className = '',
		theme,
		...attachments
	}: NavigationMenuProps<Value> = $props();

	const id = $props.id();
	const classes = $derived(useNavigationMenuTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));

	const valueState = createBindableValue<Value | null>(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	const menu = useNavigationMenuState<Value>({
		id,
		items: () => items,
		value: () => valueState.value,
		setValue: (next) => {
			valueState.value = next;
		},
		onValueChange: () => onValueChange,
		openOnHover: () => openOnHover,
		delay: () => delay,
		closeDelay: () => closeDelay,
		keepMounted: () => keepMounted,
		dir: () => dir,
		transition: () => transition,
		motion: () => theme?.motion,
		onAfterOpen: () => onAfterOpen,
		onAfterClose: () => onAfterClose
	});
	setNavigationMenuState(menu as unknown as NavigationMenuState<string>);

	// The current page: `aria-current` is not a Button prop, so it is written on the element.
	const ariaCurrent =
		(current: boolean): Attachment<HTMLElement> =>
		(node) => {
			if (!current) return;
			node.setAttribute('aria-current', 'page');
			return () => node.removeAttribute('aria-current');
		};

	// Keys that matter for a stable list: panels by value, links by position.
	const itemKey = (item: (typeof items)[number], index: number) =>
		item.type === 'panel' ? `panel:${item.value}` : `link:${index}`;
</script>

<nav
	bind:this={ref}
	aria-label={label}
	{dir}
	data-color={resolvedColor}
	data-size={size}
	data-density={density}
	{...openStateAttributes(menu.isOpen)}
	class={classes.root({ size, className })}
	onfocusout={menu.handleFocusOut}
	{@attach menu.root}
	{...attachments}
>
	<ul class={classes.list({ size })} {@attach menu.list}>
		{#each items as item, index (itemKey(item, index))}
			<li class={classes.item()}>
				{#if item.type === 'panel'}
					<NavigationMenuTrigger {item} {size} color={resolvedColor} {classes} />
				{:else}
					{@const link = item}
					<Button
						href={link.href}
						target={link.target}
						rel={link.rel}
						variant="ghost"
						{size}
						color={resolvedColor}
						disabled={link.disabled}
						label={link.ariaLabel}
						prefix={link.prefix}
						children={link.label}
						data-slot="navigation-menu-link"
						data-selected={presence(link.active)}
						data-disabled={presence(link.disabled)}
						class={classes.link({ active: !!link.active })}
						onclick={composeHandlers(link.onclick, menu.pressLink)}
						{@attach ariaCurrent(!!link.active)}
					/>
				{/if}
			</li>
		{/each}
	</ul>

	{#if menu.rendered}
		<div
			{@attach menu.viewport}
			hidden={!menu.visible}
			data-side="bottom"
			data-align="start"
			{...openStateAttributes(menu.isOpen)}
			class={classes.viewport({ switching: menu.activationDirection !== null })}
			style:top="var(--navigation-menu-anchor-bottom, 100%)"
			style:z-index={menu.layer.zIndex}
			style:translate={menu.direction === 'rtl'
				? 'clamp(var(--navigation-menu-min-x), calc(var(--navigation-menu-anchor-end) - 100%), calc(var(--navigation-menu-max-x) - 100%))'
				: 'clamp(var(--navigation-menu-min-x), var(--navigation-menu-anchor-start), calc(var(--navigation-menu-max-x) - 100%))'}
		>
			<div
				{@attach menu.popup}
				{@attach transitionSize({ axis: 'both', isActive: () => menu.isSwitching() })}
				data-side="bottom"
				data-align="start"
				{...openStateAttributes(menu.isOpen)}
				{...transitionStatusAttributes(menu.status)}
				class={classes.popup({ density })}
			>
				{#each menu.panels as panel (panel.value)}
					{#if keepMounted || panel.value === menu.displayValue}
						{@const active = panel.value === menu.displayValue && menu.isOpen}
						<div
							id={menu.panelId(panel.value)}
							hidden={!active}
							data-activation-direction={active
								? (menu.activationDirection ?? undefined)
								: undefined}
							{...openStateAttributes(active)}
							class={classes.panel({ density })}
							{@attach menu.panel(panel.value)}
						>
							<NavigationMenuContent item={panel} {size} {density} {classes} />
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</nav>
