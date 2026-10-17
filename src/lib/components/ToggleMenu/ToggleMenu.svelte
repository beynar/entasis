<script lang="ts">
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import Button from '../Button/Button.svelte';
	import { dotsThreeIcon } from '../Icons/dotsThree.js';
	import type { MenuItem } from '../Menu/index.js';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import ToggleButton from '../ToggleButton/ToggleButton.svelte';
	import { tooltip } from '../Tooltip/tooltip.attachment.svelte.js';
	import ToggleMenuGroup from './ToggleMenuGroup.svelte';
	import ToggleMenuMenu from './ToggleMenuMenu.svelte';
	import ToggleMenuRadioGroup from './ToggleMenuRadioGroup.svelte';
	import type {
		ToggleMenuCustomItem,
		ToggleMenuGroupButton,
		ToggleMenuGroupItem,
		ToggleMenuItem,
		ToggleMenuMenuItem,
		ToggleMenuProps,
		ToggleMenuRadioGroupItem,
		ToggleMenuToggleItem
	} from './toggleMenu.props.js';
	import { useToggleMenuOverflow } from './toggleMenu.state.svelte.js';
	import { useToggleMenuTheme } from './toggleMenu.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		items = $bindable(),
		label,
		size,
		color,
		variant,
		disabled = false,
		onItemsChange,
		class: className,
		theme,
		...attachments
	}: ToggleMenuProps = $props();
	const t = $derived(useI18n());

	const classes = $derived(useToggleMenuTheme(theme));
	// A disabled item stays in the arrow-key order and can hold the tab stop (the APG toolbar
	// pattern), so a fully disabled toolbar keeps one tab stop and a screen reader can reach what
	// is unavailable. Items refuse activation themselves.
	const navigation = useNavigation({
		orientation: 'horizontal',
		loop: true,
		enableHoverFocus: false,
		skipDisabled: false
	});
	const overflow = useToggleMenuOverflow();

	function getToggleProps(item: ToggleMenuToggleItem): Omit<ToggleMenuToggleItem, 'type'> {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Remove the menu discriminant before forwarding native button props.
		const { type: _type, ...props } = item;
		return props;
	}

	function replaceItem(index: number, item: ToggleMenuItem): void {
		const nextItems = items.map((currentItem, currentIndex) =>
			currentIndex === index ? item : currentItem
		);
		items = nextItems;
		onItemsChange?.(nextItems);
	}

	function getGroupValue(item: ToggleMenuGroupItem): string[] {
		return item.value ?? item.defaultValue ?? [];
	}

	function updateToggle(index: number, item: ToggleMenuToggleItem, nextValue: boolean): void {
		replaceItem(index, { ...item, value: nextValue });
		item.onValueChange?.(nextValue);
	}

	function updateGroup(
		index: number,
		item: ToggleMenuGroupItem,
		buttonValue: string,
		checked: boolean
	): void {
		const pressed = getGroupValue(item);
		const nextValue = item.items
			.filter((button) => (button.value === buttonValue ? checked : pressed.includes(button.value)))
			.map((button) => button.value);
		replaceItem(index, { ...item, value: nextValue });
		item.items.find((button) => button.value === buttonValue)?.onValueChange?.(checked);
		item.onValueChange?.(nextValue);
	}

	function updateRadioGroup(index: number, selectedValue: string): void {
		const item = items[index];
		if (item?.type !== 'radio-group' || (item.value ?? item.defaultValue) === selectedValue) return;
		replaceItem(index, { ...item, value: selectedValue });
		item.onValueChange?.(selectedValue);
	}

	function getCustomOverflowItems(item: ToggleMenuCustomItem): MenuItem[] {
		const overflowItems =
			typeof item.overflowItems === 'function' ? item.overflowItems() : item.overflowItems;
		if (!disabled && !item.disabled) return overflowItems;

		return overflowItems.map((overflowItem) =>
			overflowItem.type === 'separator' ? overflowItem : { ...overflowItem, disabled: true }
		);
	}

	function getMenuItems(item: ToggleMenuMenuItem): MenuItem[] {
		return typeof item.menu === 'function' ? item.menu() : item.menu;
	}

	function createOverflowMenu(item: ToggleMenuMenuItem): MenuItem {
		return {
			type: 'submenu',
			children: item.children ?? item.label,
			prefix: item.prefix ?? item.suffix,
			menu: getMenuItems(item),
			size: item.size ?? size,
			color: item.color ?? color,
			disabled: disabled || !!item.disabled,
			attrs: item.label ? { 'aria-label': item.label } : undefined
		};
	}

	function overflowLabel(button: ToggleMenuGroupButton | ToggleMenuToggleItem) {
		return typeof button.children === 'string' ? button.children : button.label;
	}

	function createOverflowCheckbox(
		itemIndex: number,
		button: ToggleMenuGroupButton | ToggleMenuToggleItem,
		checked: boolean,
		group?: ToggleMenuGroupItem,
		groupButtonValue?: string
	): MenuItem {
		return {
			type: 'checkbox',
			key:
				groupButtonValue === undefined
					? `toggle-${itemIndex}`
					: `group-${itemIndex}-${groupButtonValue}`,
			attrs: { 'aria-label': overflowLabel(button) },
			children: button.children ?? button.label,
			prefix: button.prefix,
			size: group?.size ?? size,
			color: group?.color ?? color,
			disabled: disabled || !!group?.disabled || !!button.disabled,
			value: checked,
			onValueChange: (next) => {
				if (group && groupButtonValue !== undefined) {
					updateGroup(itemIndex, group, groupButtonValue, next);
					return;
				}
				const item = items[itemIndex];
				if (item?.type === 'toggle') updateToggle(itemIndex, item, next);
			}
		};
	}

	function createOverflowRadioGroup(itemIndex: number, group: ToggleMenuRadioGroupItem): MenuItem {
		return {
			type: 'radio-group',
			key: `radio-${itemIndex}`,
			label: group.label,
			value: group.value ?? group.defaultValue ?? '',
			onValueChange: (next) => updateRadioGroup(itemIndex, next),
			disabled: disabled || !!group.disabled,
			items: group.items.map((button) => ({
				value: button.value,
				attrs: { 'aria-label': overflowLabel(button) },
				children: button.children ?? button.label,
				prefix: button.prefix,
				size: group.size ?? size,
				color: group.color ?? color,
				disabled: disabled || !!group.disabled || !!button.disabled
			}))
		};
	}

	// Overflowed toolbar items become one menu. Single entries (a toggle, a menu, one custom item)
	// sit together like any menu rows; a separator only sets apart a multi-option unit (a button
	// group, a radio group, several custom entries), as a toolbar's grouping does.
	// A small toolbar opens compact menus: menu rows take their height from density, not size.
	const overflowMenuItems = $derived.by(() => {
		const menuItems: MenuItem[] = [];
		let previousIsSet = false;

		items.slice(overflow.visibleCount).forEach((item, overflowIndex) => {
			const itemIndex = overflow.visibleCount + overflowIndex;
			const unitItems: MenuItem[] = [];

			if (item.type === 'toggle') {
				unitItems.push(
					createOverflowCheckbox(itemIndex, item, item.value ?? item.defaultValue ?? false)
				);
			} else if (item.type === 'group') {
				const pressed = getGroupValue(item);
				unitItems.push({
					type: 'group',
					key: `group-${itemIndex}`,
					label: item.label,
					items: item.items.map((button) =>
						createOverflowCheckbox(
							itemIndex,
							button,
							pressed.includes(button.value),
							item,
							button.value
						)
					)
				});
			} else if (item.type === 'radio-group') {
				unitItems.push(createOverflowRadioGroup(itemIndex, item));
			} else if (item.type === 'menu') {
				unitItems.push(createOverflowMenu(item));
			} else {
				unitItems.push(...getCustomOverflowItems(item));
			}

			if (unitItems.length === 0) return;
			const isSet = item.type === 'group' || item.type === 'radio-group' || unitItems.length > 1;
			if (menuItems.length > 0 && (isSet || previousIsSet)) menuItems.push({ type: 'separator' });
			menuItems.push(...unitItems);
			previousIsSet = isSet;
		});

		return menuItems;
	});

	$effect(() => {
		void items;
		void size;
		void color;
		void variant;
		overflow.scheduleMeasure();
	});
</script>

<div
	role="toolbar"
	aria-label={label}
	aria-orientation="horizontal"
	tabindex="-1"
	class={classes.root({ className })}
	{@attach navigation.containerReference}
	{@attach overflow.rootReference}
	{...attachments}
>
	<div class={classes.rail()} {@attach overflow.railReference}>
		{#each items as item, index (index)}
			{@const overflowed = overflow.isOverflowed(index)}
			{#if item.type === 'group'}
				<ToggleMenuGroup
					{item}
					{size}
					{color}
					{variant}
					{disabled}
					{overflowed}
					unitClass={classes.unit()}
					unitReference={overflow.unitReference(index)}
					buttonReference={navigation.itemReference}
					onToggle={({ value, checked }) => updateGroup(index, item, value, checked)}
				/>
			{:else if item.type === 'radio-group'}
				<ToggleMenuRadioGroup
					{item}
					{size}
					{color}
					{variant}
					{disabled}
					{overflowed}
					unitClass={classes.unit()}
					unitReference={overflow.unitReference(index)}
					buttonReference={navigation.itemReference}
					onValueChange={(value) => updateRadioGroup(index, value)}
				/>
			{:else if item.type === 'menu'}
				<ToggleMenuMenu
					{item}
					menuItems={getMenuItems(item)}
					{size}
					{color}
					{variant}
					{disabled}
					{overflowed}
					unitClass={classes.unit()}
					unitReference={overflow.unitReference(index)}
					buttonReference={navigation.itemReference}
				/>
			{:else if item.type === 'custom'}
				<span
					aria-hidden={overflowed || undefined}
					inert={overflowed || undefined}
					data-overflowed={overflowed || undefined}
					class={classes.unit({ className: item.class })}
					{@attach overflow.unitReference(index)}
				>
					{@render item.children({
						reference: overflowed ? undefined : navigation.itemReference,
						size: item.size ?? size,
						color: item.color ?? color,
						variant: item.variant ?? variant,
						disabled: disabled || !!item.disabled,
						overflowed
					})}
				</span>
			{:else}
				<span
					aria-hidden={overflowed || undefined}
					inert={overflowed || undefined}
					data-overflowed={overflowed || undefined}
					class={classes.unit()}
					{@attach overflow.unitReference(index)}
				>
					<ToggleButton
						{...getToggleProps(item)}
						size={item.size ?? size}
						color={item.color ?? color}
						variant={item.variant ?? variant}
						disabled={disabled || !!item.disabled}
						focusableWhenDisabled
						value={item.value ?? item.defaultValue ?? false}
						onValueChange={(checked) => updateToggle(index, item, checked)}
						{@attach overflowed ? undefined : navigation.itemReference}
						{@attach !item.children && item.label && !overflowed
							? tooltip({ content: item.label, delay: 350 })
							: undefined}
					/>
				</span>
			{/if}
		{/each}
	</div>

	<span
		data-overflow={overflow.hasOverflow}
		aria-hidden={!overflow.hasOverflow || undefined}
		inert={!overflow.hasOverflow || undefined}
		class={classes.more()}
		{@attach overflow.moreReference}
	>
		<PopupMenu
			{size}
			menu={{ items: overflowMenuItems, density: size === 'small' ? 'compact' : 'normal' }}
			closeOnItemClick={false}
			position="bottom-end"
			fitTrigger={false}
		>
			{#snippet trigger(popover)}
				<Button
					variant="ghost"
					color="neutral"
					{size}
					{disabled}
					focusableWhenDisabled
					squared
					label={t.moreTools}
					prefix={dotsThreeIcon}
					{@attach overflow.hasOverflow ? navigation.itemReference : undefined}
					{@attach popover.reference}
					onclick={() => popover.toggle()}
				/>
			{/snippet}
		</PopupMenu>
	</span>
</div>
