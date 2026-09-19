<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import Button from '../Button/Button.svelte';
	import { caretRightIcon } from '../Icons/caretRight.js';
	import MenuOption from '../MenuOption/MenuOption.svelte';
	import Separator from '../Separator/Separator.svelte';
	import Slot from '../Slot/Slot.svelte';
	import Stepper from '../Stepper/Stepper.svelte';
	import MenuStackedBackHeader from './MenuStackedBackHeader.svelte';
	import type { MenuItem, MenuProps } from './menu.props.js';
	import { useMenuTheme } from './menu.theme.js';
	import { getMenuMaxDepth } from './menuTree.js';

	type SubmenuItem = Extract<MenuItem, { type: 'submenu' }>;
	type SubmenuItemWithPopoverClass = SubmenuItem & { popoverClass?: string };

	type MenuPathEntry = {
		item: SubmenuItem;
		parentNavigationIndex: number;
	};

	/** Copy without the listed keys, so spread props exclude them without unused destructured bindings. */
	const omitKeys = <T extends object, K extends keyof T>(
		source: T,
		keys: readonly K[]
	): Omit<T, K> => {
		const result = { ...source } as Record<string, unknown>;
		for (const key of keys) delete result[key as string];
		return result as Omit<T, K>;
	};

	let {
		items,
		class: className = '',
		theme,
		density = 'normal',
		size = 'normal',
		color,
		header,
		footer,
		focusOnMount,
		...attachments
	}: MenuProps = $props();

	const id = $props.id();
	const classes = $derived(useMenuTheme(theme));
	const t = $derived(useI18n());
	const maxDepth = $derived(getMenuMaxDepth(items));
	const panels = $derived(Array.from({ length: maxDepth + 1 }, (_, depth) => depth));

	let path = $state<MenuPathEntry[]>([]);
	const activeStep = $derived(path.length);

	const navigation = useNavigation({
		typeahead: true,
		orientation: () => 'vertical',
		loop: true,
		id,
		enableHoverFocus: true,
		defaultFocusedIndex: () => navigation.lastFocusedIndex ?? 0,
		preventKeyboardDefault: false
	});

	$effect(() => {
		if (path.length <= maxDepth) return;
		path = path.slice(0, maxDepth);
	});

	onMount(() => {
		void (async () => {
			await tick();
			if (focusOnMount === 'container') navigation.focusContainer();
			else if (focusOnMount) navigation.focusFirst();
		})();
	});

	const getPanelItems = (depth: number): MenuItem[] => {
		if (depth === 0) return items;
		return path[depth - 1]?.item.menu ?? [];
	};

	const getPanelEntry = (depth: number) => path[depth - 1] ?? null;

	const isDisabledMenuItem = (menuItem: MenuItem) =>
		menuItem.type !== 'separator' && menuItem.disabled === true;

	const getNavigationIndex = (
		panelItems: MenuItem[],
		itemIndex: number,
		hasBackControl: boolean
	) => {
		let navigationIndex = hasBackControl ? 1 : 0;
		for (let index = 0; index < itemIndex; index += 1) {
			if (panelItems[index]?.type !== 'separator') navigationIndex += 1;
		}
		return navigationIndex;
	};

	const getFirstEnabledChildNavigationIndex = (panelItems: MenuItem[]) => {
		let navigationIndex = 1;
		for (const menuItem of panelItems) {
			if (menuItem.type === 'separator') continue;
			if (!isDisabledMenuItem(menuItem)) return navigationIndex;
			navigationIndex += 1;
		}
		return 0;
	};

	const openSubmenu = async (depth: number, itemIndex: number, item: SubmenuItem) => {
		const panelItems = getPanelItems(depth);
		const parentNavigationIndex = getNavigationIndex(panelItems, itemIndex, depth > 0);
		path = [
			...path.slice(0, depth),
			{
				item,
				parentNavigationIndex
			}
		];
		await tick();
		navigation.focusItem(getFirstEnabledChildNavigationIndex(item.menu));
	};

	const closeSubmenu = async () => {
		const currentEntry = path.at(-1);
		if (!currentEntry) return;
		path = path.slice(0, -1);
		await tick();
		navigation.focusItem(currentEntry.parentNavigationIndex);
	};

	const getBackControlLabel = (entry: MenuPathEntry | null) => {
		const title = entry?.item.title;
		return typeof title === 'string' ? `${t.back}: ${title}` : t.back;
	};

	const attachItemReference = (isActivePanel: boolean) => (node: HTMLElement) => {
		if (!isActivePanel) return;
		return navigation.itemReference(node);
	};

	const attachPrevious = (node: HTMLElement) => {
		Object.assign(node, {
			onPrevious: () => {
				void closeSubmenu();
			}
		});
	};
</script>

<div
	class={classes.root({ density, className })}
	role="menu"
	data-size={size}
	data-density={density}
	data-color={color}
	{...attachments}
	{@attach navigation.containerReference}
>
	<Stepper
		items={panels}
		value={activeStep}
		panelRole={null}
		panelAriaLabelledby={false}
		transition={{
			in: { duration: 240, easing: 'quintOut' },
			out: { duration: 240, easing: 'quintOut' }
		}}
	>
		{#snippet children({ item: depth })}
			{@const isActivePanel = depth === activeStep}
			{@const panelItems = getPanelItems(depth)}
			{@const panelEntry = getPanelEntry(depth)}
			{@const hasBackControl = depth > 0}

			{#if depth <= activeStep}
				<div class={classes.root({ density })}>
					{#if hasBackControl}
						<MenuStackedBackHeader
							opener={panelEntry?.item ?? null}
							label={getBackControlLabel(panelEntry)}
							{density}
							{size}
							{color}
							{theme}
							onBack={() => {
								void closeSubmenu();
							}}
							itemReference={attachItemReference(isActivePanel)}
							backReference={attachPrevious}
						/>
						<Separator theme={theme?.separator} />
					{:else}
						<Slot render={header} renderIf={!!header} class={classes.header()} />
					{/if}

					{#each panelItems as item, index (index)}
						{#if item.type === 'button'}
							<Button
								role="menuitem"
								{...item}
								theme={theme?.button}
								{@attach attachItemReference(isActivePanel)}
								{@attach attachPrevious}
							/>
						{:else if item.type === 'option'}
							{@const optionProps = omitKeys(item, ['type'])}
							<MenuOption
								role={optionProps.selected !== undefined ? 'menuitemradio' : 'menuitem'}
								{density}
								{size}
								{...color ? { color } : {}}
								{...optionProps}
								theme={theme?.option}
								{@attach attachItemReference(isActivePanel)}
								{@attach attachPrevious}
							/>
						{:else if item.type === 'separator'}
							<Separator {...item} theme={theme?.separator} />
						{:else if item.type === 'submenu'}
							{@const submenuItem = item as SubmenuItemWithPopoverClass}
							{@const itemProps = omitKeys(submenuItem, [
								'type',
								'menu',
								'openOnHover',
								'openOnClick',
								'delay',
								'closeOnMouseLeave',
								'popoverClass',
								'onclick',
								'suffix',
								'attrs'
							])}
							{@const openOnClick = submenuItem.openOnClick ?? true}
							{@const itemOnClick = submenuItem.onclick}
							{@const suffix = submenuItem.suffix}
							{@const attrs = submenuItem.attrs}
							<MenuOption
								role="menuitem"
								{density}
								{size}
								{...color ? { color } : {}}
								{...itemProps}
								suffix={suffix ?? caretRightIcon}
								theme={theme?.submenu}
								attrs={{
									...attrs,
									'aria-haspopup': 'menu',
									'aria-expanded': 'false',
									'data-menu-keep-open': 'true'
								}}
								onclick={(event) => {
									itemOnClick?.(event);
									if (openOnClick) void openSubmenu(depth, index, item);
								}}
								{@attach attachItemReference(isActivePanel)}
								{@attach (node) => {
									Object.assign(node, {
										onNext: () => {
											void openSubmenu(depth, index, item);
										},
										onPrevious: () => {
											void closeSubmenu();
										}
									});
								}}
							/>
						{/if}
					{/each}

					{#if !hasBackControl}
						<Slot render={footer} renderIf={!!footer} class={classes.footer()} />
					{/if}
				</div>
			{/if}
		{/snippet}
	</Stepper>
</div>
