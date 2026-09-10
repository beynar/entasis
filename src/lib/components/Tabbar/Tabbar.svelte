<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import { caretUpIcon } from '../Icons/caretUp.js';
	import { checkIcon } from '../Icons/check.js';
	import type { TabbarProps } from './tabbar.props.js';
	import { useTabbarTheme } from './tabbar.theme.js';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import { useSlidingIndicator } from '$lib/utils/useSlidingIndicator.svelte.js';
	import type { Snippet } from 'svelte';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

	let {
		ref = $bindable(null),
		items,
		defaultValue = 0,
		value = $bindable(),
		onValueChange,
		size = 'normal',
		orientation = 'horizontal',
		color = 'primary',
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
		() => defaultValue
	);

	const id = $props.id();
	const classes = $derived(useTabbarTheme(theme));
	const selectedValue = $derived(valueState.value);

	type NormalizedTab = {
		label: string | Snippet;
		prefix?: Snippet;
		suffix?: Snippet;
		href?: string;
		disabled: boolean;
		target?: string;
		rel?: string;
		menu?: string[];
		onMenuSelect?: (menuIndex: number) => void;
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
						onMenuSelect: tab.onMenuSelect
					}
		)
	);

	// Selected entry per menu tab (index into tab.menu). The trigger shows the
	// selected entry's label; until one is picked it shows the tab's own label.
	let menuSelections = $state<Record<number, number>>({});
	let isOverflowing = $state(false);
	const scrollFadeAxis = $derived(
		scrollFade && isOverflowing ? (orientation === 'horizontal' ? 'x' : 'y') : 'none'
	);

	$effect(() => {
		const node = ref;
		const axis = orientation;
		if (!node) {
			isOverflowing = false;
			return;
		}

		let frame: number | undefined;
		const measure = () => {
			frame = undefined;
			isOverflowing =
				axis === 'horizontal'
					? node.scrollWidth > node.clientWidth + 1
					: node.scrollHeight > node.clientHeight + 1;
		};
		const schedule = () => {
			if (frame !== undefined) cancelAnimationFrame(frame);
			frame = requestAnimationFrame(measure);
		};
		const resizeObserver = new ResizeObserver(schedule);
		const observeLayout = () => {
			resizeObserver.disconnect();
			resizeObserver.observe(node);
			node
				.querySelectorAll<HTMLElement>('[role="tab"]')
				.forEach((tab) => resizeObserver.observe(tab));
			schedule();
		};
		const mutationObserver = new MutationObserver(observeLayout);

		mutationObserver.observe(node, { childList: true, characterData: true, subtree: true });
		observeLayout();

		return () => {
			if (frame !== undefined) cancelAnimationFrame(frame);
			mutationObserver.disconnect();
			resizeObserver.disconnect();
		};
	});

	const selectMenuEntry = (index: number, tab: NormalizedTab, menuIndex: number) => {
		menuSelections[index] = menuIndex;
		if (selectedValue !== index) {
			valueState.value = index;
			onValueChange?.(index);
		}
		tab.onMenuSelect?.(menuIndex);
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
		id,
		enableHoverFocus: false,
		onChange: (index) => {
			// Menu tabs activate manually (via entry selection), never by focus alone —
			// arrowing onto the trigger must not slide the indicator to it.
			if (index !== null && index !== selectedValue && !normalizedTabs[index]?.menu) {
				valueState.value = index;
				onValueChange?.(index);
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
			if (selectedValue !== index) {
				valueState.value = index;
				onValueChange?.(index);
			}
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
	role="tablist"
	aria-orientation={orientation}
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
			data-color={color}
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
						aria-disabled={tab.disabled}
						disabled={tab.disabled}
						aria-haspopup="menu"
						aria-expanded={popover.isOpen ? 'true' : 'false'}
						tabindex={isFocused ? 0 : -1}
						data-color={color}
						data-active={isActive ? 'true' : 'false'}
						data-focused={isFocused ? 'true' : 'false'}
						data-orientation={orientation}
						class={classes.tab({
							size,
							color,
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
				aria-disabled={tab.disabled}
				disabled={!tab.href && tab.disabled ? true : undefined}
				href={tab.disabled ? undefined : tab.href}
				target={tab.target}
				tabindex={!tab.disabled && isFocused ? 0 : -1}
				rel={tab.rel}
				data-color={color}
				data-active={isActive ? 'true' : 'false'}
				data-focused={isFocused ? 'true' : 'false'}
				data-orientation={orientation}
				class={classes.tab({
					size,
					color,
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
