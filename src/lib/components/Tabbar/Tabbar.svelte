<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import { caretUpIcon } from '../Icons/caretUp.js';
	import { checkIcon } from '../Icons/check.js';
	import { getTabValue, type TabbarProps } from './tabbar.props.js';
	import { useTabbarTheme } from './tabbar.theme.js';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import { useOverflowObserver } from '$lib/utils/useOverflowObserver.svelte.js';
	import { useSlidingIndicator } from '$lib/utils/useSlidingIndicator.svelte.js';
	import type { Snippet } from 'svelte';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';

	let {
		ref = $bindable(null),
		items,
		defaultValue,
		value = $bindable(),
		id: customId,
		label,
		controlsPanels = false,
		onValueChange,
		size = 'normal',
		orientation = 'horizontal',
		color,
		alignment = 'start',
		position = 'top',
		variant = 'underline',
		class: className = '',
		theme,
		fullWidth = false,
		scrollFade = true,
		...attachments
	}: TabbarProps = $props();
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue ?? (items[0] === undefined ? '' : getTabValue(items[0], 0))
	);

	const generatedId = $props.id();
	const id = $derived(customId ?? generatedId);
	const classes = $derived(useTabbarTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));
	const tabValues = $derived(items.map(getTabValue));
	/** Index of the active tab; -1 when `value` matches no tab. */
	const selectedValue = $derived(tabValues.indexOf(valueState.value));
	const tabId = (index: number) => `${id}-tab-${index}`;
	const panelId = (index: number) => (controlsPanels ? `${id}-panel-${index}` : undefined);
	const select = (index: number) => {
		if (selectedValue === index) return;
		const next = tabValues[index];
		valueState.value = next;
		onValueChange?.(next);
	};

	type NormalizedTab = {
		label: string | Snippet;
		prefix?: Snippet;
		suffix?: Snippet;
		href?: string;
		disabled: boolean;
		target?: string;
		rel?: string;
		menu?: string[];
		onSelect?: (menuIndex: number) => void;
	};

	// Normalize tab items to always work with objects
	const normalizedTabs = $derived(
		items.map((tab): NormalizedTab =>
			typeof tab === 'string'
				? { label: tab, prefix: undefined, suffix: undefined, href: undefined, disabled: false }
				: {
						label: tab.label,
						prefix: tab.prefix,
						suffix: tab.suffix,
						href: tab.href,
						disabled: tab.disabled ?? false,
						target: tab.target,
						rel: tab.rel,
						menu: tab.menu,
						onSelect: tab.onSelect
					}
		)
	);

	// Selected entry per menu tab (index into tab.menu). The trigger shows the
	// selected entry's label; until one is picked it shows the tab's own label.
	let menuSelections = $state<Record<number, number>>({});
	const overflow = useOverflowObserver({
		axis: () => (orientation === 'horizontal' ? 'x' : 'y'),
		selector: '[role="tab"]'
	});
	const isOverflowing = $derived(overflow.overflowing);
	const scrollFadeAxis = $derived(
		scrollFade && isOverflowing ? (orientation === 'horizontal' ? 'x' : 'y') : 'none'
	);

	const selectMenuEntry = (index: number, tab: NormalizedTab, menuIndex: number) => {
		menuSelections[index] = menuIndex;
		select(index);
		tab.onSelect?.(menuIndex);
		navigation.focusItem(index);
	};

	const menuItemsFor = (index: number, tab: NormalizedTab) =>
		(tab.menu ?? []).map((label, menuIndex) => ({
			type: 'option' as const,
			title: label,
			suffix: menuSelections[index] === menuIndex ? checkIcon : undefined,
			onclick: () => selectMenuEntry(index, tab, menuIndex)
		}));

	// Navigation hook for keyboard support
	const navigation = useNavigation({
		orientation: () => orientation,
		loop: true,
		id: generatedId,
		enableHoverFocus: false,
		onChange: (index) => {
			// Menu tabs activate manually (via entry selection), never by focus alone —
			// arrowing onto the trigger must not slide the indicator to it.
			if (index !== null && index !== selectedValue && !normalizedTabs[index]?.menu) {
				select(index);
			}
		},
		defaultFocusedIndex: () => selectedValue
	});

	function handleTabClick(event: MouseEvent, index: number, tab: NormalizedTab) {
		if (tab.disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		if (!tab.href) {
			select(index);
			navigation.focusItem(index);
		}
	}

	const indicator = useSlidingIndicator({
		activeIndex: () => selectedValue,
		observe: () => [
			items,
			size,
			variant,
			position,
			orientation,
			alignment,
			fullWidth,
			// A menu selection swaps the trigger label, changing the tab's width.
			Object.values(menuSelections)
		],
		getStyle: (element) => {
			const x = element.offsetLeft;
			const y = element.offsetTop;
			const width = element.offsetWidth;
			const height = element.offsetHeight;

			if (variant === 'pill') {
				return `transform:translate(${x}px, ${y}px);width:${width}px;height:${height}px`;
			}
			if (position === 'bottom') {
				return `transform:translate(${x}px, ${y}px);width:${width}px;height:2px`;
			}
			if (position === 'left') {
				return `transform:translate(${x + width - 2}px, ${y}px);width:2px;height:${height}px`;
			}
			if (position === 'right') {
				return `transform:translate(${x}px, ${y}px);width:2px;height:${height}px`;
			}
			return `transform:translate(${x}px, ${y + height - 2}px);width:${width}px;height:2px`;
		}
	});
</script>

<div
	bind:this={ref}
	data-slot="tabbar"
	data-overflowing={isOverflowing ? 'true' : 'false'}
	data-scroll-fade={scrollFadeAxis === 'none' ? undefined : scrollFadeAxis}
	class={classes.root({
		orientation,
		alignment,
		size,
		variant,
		className,
		fullWidth,
		scrollFade: scrollFadeAxis
	})}
	{id}
	role="tablist"
	aria-label={label}
	aria-orientation={orientation}
	{@attach overflow.attachment}
	{@attach navigation.containerReference}
	{@attach indicator.containerReference}
	{...attachments}
>
	{#if indicator.isHydrated}
		<!-- Measured, animated indicator (client only). -->
		<div
			data-slot="tabbar-indicator"
			class={classes.indicator({ variant })}
			style={indicator.style}
			data-color={resolvedColor}
			data-ready={indicator.isReady ? 'true' : 'false'}
			aria-hidden="true"
		></div>
	{/if}
	{#each normalizedTabs as tab, index (index)}
		{@const isActive = selectedValue === index}
		{@const isFocused = navigation.focusedIndex === index}
		{@const elementType = tab.href ? 'a' : 'button'}

		{#if tab.menu}
			{#snippet menuHeader()}
				{#if typeof tab.label === 'string'}
					<span class="text-neutral/50 px-2 py-1 text-sm">{tab.label}</span>
				{/if}
			{/snippet}
			<PopupMenu
				position="bottom-start"
				menu={{ items: menuItemsFor(index, tab), header: menuHeader }}
			>
				{#snippet trigger(popover)}
					<button
						data-slot="tabbar-tab"
						type="button"
						role="tab"
						id={tabId(index)}
						aria-selected={isActive}
						aria-controls={panelId(index)}
						aria-disabled={tab.disabled}
						disabled={tab.disabled}
						tabindex={isFocused ? 0 : -1}
						data-color={resolvedColor}
						data-active={isActive ? 'true' : 'false'}
						data-focused={isFocused ? 'true' : 'false'}
						data-orientation={orientation}
						class={classes.tab({
							size,
							color: resolvedColor,
							active: isActive,
							focused: isFocused,
							disabled: tab.disabled,
							orientation,
							position,
							variant,
							fullWidth
						})}
						onclick={() => !tab.disabled && popover.toggle()}
						{@attach popover.reference}
						{@attach navigation.itemReference}
						{@attach indicator.itemReference(index)}
					>
						{#if !indicator.isHydrated && isActive}
							<span
								data-slot="tabbar-indicator"
								class={classes.staticIndicator({ variant, position })}
								aria-hidden="true"
							></span>
						{/if}
						<Slot render={tab.prefix} class={classes.prefix({ size })} />

						{#if menuSelections[index] != null}
							{tab.menu?.[menuSelections[index]]}
						{:else if typeof tab.label === 'string'}
							{tab.label}
						{:else}
							<Slot render={tab.label} />
						{/if}

						<Slot
							render={popover.isOpen ? caretUpIcon : caretDownIcon}
							class={classes.suffix({ size })}
						/>
					</button>
				{/snippet}
			</PopupMenu>
		{:else}
			<svelte:element
				this={elementType}
				data-slot="tabbar-tab"
				role="tab"
				id={tabId(index)}
				aria-selected={isActive}
				aria-controls={panelId(index)}
				aria-disabled={tab.disabled}
				disabled={!tab.href && tab.disabled ? true : undefined}
				href={tab.disabled ? undefined : tab.href}
				target={tab.target}
				tabindex={!tab.disabled && isFocused ? 0 : -1}
				rel={tab.rel}
				data-color={resolvedColor}
				data-active={isActive ? 'true' : 'false'}
				data-focused={isFocused ? 'true' : 'false'}
				data-orientation={orientation}
				class={classes.tab({
					size,
					color: resolvedColor,
					active: isActive,
					focused: isFocused,
					disabled: tab.disabled,
					orientation,
					position,
					variant,
					fullWidth
				})}
				onclick={(event: MouseEvent) => handleTabClick(event, index, tab)}
				{@attach navigation.itemReference}
				{@attach indicator.itemReference(index)}
			>
				{#if !indicator.isHydrated && isActive}
					<!-- CSS-only indicator for SSR / pre-hydration, positioned by layout. -->
					<span
						data-slot="tabbar-indicator"
						class={classes.staticIndicator({ variant, position })}
						aria-hidden="true"
					></span>
				{/if}
				<Slot render={tab.prefix} class={classes.prefix({ size })} />

				{#if typeof tab.label === 'string'}
					{tab.label}
				{:else}
					<Slot render={tab.label} />
				{/if}

				<Slot render={tab.suffix} class={classes.suffix({ size })} />
			</svelte:element>
		{/if}
	{/each}
</div>
