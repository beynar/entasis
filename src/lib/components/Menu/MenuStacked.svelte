<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { useDirection } from '$lib/utils/useDirection.svelte.js';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import Button from '../Button/Button.svelte';
	import { caretRightIcon } from '../Icons/caretRight.js';
	import MenuOption from '../MenuOption/MenuOption.svelte';
	import { usePopoverContext } from '../Popover/popover.state.svelte.js';
	import Separator from '../Separator/Separator.svelte';
	import Slot from '../Slot/Slot.svelte';
	import Stepper from '../Stepper/Stepper.svelte';
	import MenuCheckboxItem from './MenuCheckboxItem.svelte';
	import MenuMirroredIcon from './MenuMirroredIcon.svelte';
	import MenuRadioGroup from './MenuRadioGroup.svelte';
	import MenuSearchField from './MenuSearchField.svelte';
	import MenuStackedBackHeader from './MenuStackedBackHeader.svelte';
	import {
		HIGHLIGHT_VALUE_ATTRIBUTE,
		createSearchKeys,
		rowValue,
		useMenuSearch,
		watchHighlight
	} from './menu.filter.svelte.js';
	import type { MenuFilterOptions, MenuItem, MenuProps } from './menu.props.js';
	import { useMenuTheme } from './menu.theme.js';
	import {
		createMenuKeys,
		filterMenuItems,
		getMenuMaxDepth,
		hasMenuRows,
		menuItemKeys,
		menuItemValue
	} from './menuTree.js';

	type SubmenuItem = Extract<MenuItem, { type: 'submenu' }>;
	type SubmenuItemWithPopoverClass = SubmenuItem & { popoverClass?: string };

	type MenuPathEntry = {
		item: SubmenuItem;
		/** The row that opened the level, which takes focus back when the level closes. */
		trigger: HTMLElement | null;
	};

	/** Copy without the listed keys, so spread props exclude them without unused destructured bindings. */
	const omitKeys = <T extends object, K extends string>(
		source: T,
		keys: readonly K[]
	): Omit<T, K> => {
		const result = { ...source } as Record<string, unknown>;
		for (const key of keys) delete result[key];
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
		filter,
		search = $bindable(),
		defaultSearch,
		onSearchChange,
		onHighlightChange,
		empty,
		...attachments
	}: MenuProps = $props();

	const id = $props.id();
	const parentPopover = usePopoverContext();
	const classes = $derived(useMenuTheme(theme));
	const t = $derived(useI18n());
	const maxDepth = $derived(getMenuMaxDepth(items));
	const panels = $derived(Array.from({ length: maxDepth + 1 }, (_, depth) => depth));

	// The sheet is portaled out of the trigger's subtree, so it does not inherit a `dir` set there:
	// a menu opened from a right-to-left subtree carries that direction itself, which keeps the
	// carets, the back arrow and the arrow keys reading the way the trigger does.
	const anchorElement = () => {
		const reference = parentPopover?.referenceElement;
		return reference instanceof HTMLElement ? reference : null;
	};
	const getDirection = useDirection(anchorElement);
	const panelDir = $derived.by(() => {
		if (!parentPopover || typeof document === 'undefined') return undefined;
		const direction = getDirection();
		const inherited = getComputedStyle(document.body).direction === 'rtl' ? 'rtl' : 'ltr';
		return direction === inherited ? undefined : direction;
	});

	let path = $state<MenuPathEntry[]>([]);
	const activeStep = $derived(path.length);
	let listElement: HTMLElement | null = null;

	// The search text of the root level is the menu's own `search`; a submenu level keeps its text
	// here while it is open, and starts empty each time it opens.
	const rootQuery = useMenuSearch({
		filter: () => filter,
		search: () => search,
		write: (next) => {
			search = next;
		},
		defaultSearch: () => defaultSearch,
		onSearchChange: () => onSearchChange
	});
	let levelSearches = $state<string[]>([]);

	/** The filter of a level, `null` when it has none. */
	const levelFilter = (depth: number): MenuFilterOptions | null => {
		const option = depth === 0 ? filter : path[depth - 1]?.item.filter;
		if (option === undefined || option === false) return null;
		return option === true ? {} : option;
	};
	const levelSearch = (depth: number) =>
		depth === 0 ? rootQuery.search : (levelSearches[depth] ?? '');
	const activeFilter = $derived(levelFilter(activeStep));

	const navigation = useNavigation({
		typeahead: true,
		// A level with a search field keeps focus in the field: its rows are only highlighted.
		get virtualFocus() {
			return activeFilter !== null;
		},
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

	let searchField = $state<HTMLInputElement | null>(null);

	onMount(() => {
		void (async () => {
			await tick();
			if (activeFilter) {
				// A hover open (`false`) leaves focus where it was, even when the field could take it.
				if (focusOnMount === false) return;
				searchField?.focus({ preventScroll: true });
				if (focusOnMount === 'last') navigation.focusLast();
				else if (focusOnMount === true) navigation.focusFirst();
				return;
			}
			if (focusOnMount === 'container') navigation.focusContainer();
			else if (focusOnMount === 'last') navigation.focusLast();
			else if (focusOnMount) navigation.focusFirst();
		})();
	});

	const getPanelItems = (depth: number): MenuItem[] => {
		const level = depth === 0 ? items : (path[depth - 1]?.item.menu ?? []);
		const options = levelFilter(depth);
		if (!options) return level;
		return depth === 0
			? rootQuery.visible(level)
			: filterMenuItems(level, levelSearch(depth), options);
	};

	const getPanelEntry = (depth: number) => path[depth - 1] ?? null;

	/** The first row of a level a key can land on: after its back control, skipping disabled rows. */
	const focusFirstRowOf = (depth: number) => {
		if (levelFilter(depth)) {
			searchField?.focus({ preventScroll: true });
			return;
		}
		const panel = listElement?.querySelector<HTMLElement>(`[data-menu-depth="${depth}"]`);
		const rows = Array.from(panel?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);
		const first = rows.find(
			(row, index) =>
				index > 0 && !row.matches(':disabled') && row.getAttribute('aria-disabled') !== 'true'
		);
		(first ?? rows[0])?.focus();
	};

	const openSubmenu = async (depth: number, trigger: HTMLElement, item: SubmenuItem) => {
		levelSearches = levelSearches.slice(0, depth + 1);
		path = [...path.slice(0, depth), { item, trigger }];
		await tick();
		focusFirstRowOf(depth + 1);
	};

	const closeSubmenu = async () => {
		const currentEntry = path.at(-1);
		if (!currentEntry) return;
		levelSearches = levelSearches.slice(0, path.length);
		path = path.slice(0, -1);
		await tick();
		if (searchField) searchField.focus({ preventScroll: true });
		else if (currentEntry.trigger?.isConnected) currentEntry.trigger.focus();
	};

	/** Edits the text of the active level; the first match is highlighted so Enter presses it. */
	const editSearch = (next: string) => {
		const depth = activeStep;
		if (depth === 0) rootQuery.set(next);
		else levelSearches[depth] = next;
		void tick().then(() => {
			if (next.trim() === '') navigation.clearFocus();
			else navigation.focusFirst();
		});
	};

	// The rows of the level on show, for the search field's arrow keys.
	const activePanel = () =>
		listElement?.querySelector<HTMLElement>(`[data-menu-depth="${activeStep}"]`) ?? null;
	const searchKeys = createSearchKeys({
		navigation,
		list: activePanel,
		rtl: () => getComputedStyle(listElement ?? document.body).direction === 'rtl',
		leave: () => leaveSubmenu()
	});

	// The highlighted row names the field's active descendant and goes to `onHighlightChange`.
	let activeId = $state<string | undefined>();
	const trackHighlight = $derived(
		!!onHighlightChange || path.some((entry) => !!entry.item.onHighlightChange)
	);
	const watchList = (node: HTMLElement) =>
		watchHighlight(node, (row) => {
			activeId = row?.id || undefined;
			const report =
				activeStep === 0 ? onHighlightChange : path[activeStep - 1]?.item.onHighlightChange;
			report?.(rowValue(row));
		});

	const valueAttrs = (item: MenuItem) => {
		const value = trackHighlight ? menuItemValue(item) : undefined;
		return value === undefined ? {} : { [HIGHLIGHT_VALUE_ATTRIBUTE]: value };
	};
	const withValue = <T extends { attrs?: Record<string, unknown> }>(
		attrs: Record<string, unknown>,
		row: T
	): T => (trackHighlight ? { ...row, attrs: { ...row.attrs, ...attrs } } : row);
	const radioValueAttrs = (radio: { value: string }) =>
		trackHighlight ? { [HIGHLIGHT_VALUE_ATTRIBUTE]: radio.value } : {};

	// A press on a row keeps focus in the search field.
	const keepFocusInField = (event: MouseEvent) => {
		if (activeFilter) event.preventDefault();
	};

	const getBackControlLabel = (entry: MenuPathEntry | null) => {
		const title = entry?.item.title;
		return typeof title === 'string' ? `${t.back}: ${title}` : t.back;
	};

	const attachItemReference = (isActivePanel: boolean) => (node: HTMLElement) => {
		if (!isActivePanel) return;
		return navigation.itemReference(node);
	};

	// Returns whether there was a level to leave: on a root row ArrowLeft stays unhandled.
	const leaveSubmenu = () => {
		if (path.length === 0) return false;
		void closeSubmenu();
		return true;
	};

	const attachPrevious = (node: HTMLElement) => {
		Object.assign(node, { onPrevious: leaveSubmenu });
	};

	/** Registers a row (checkbox, radio) of the active level with this menu's navigation. */
	const rowAttach = (isActivePanel: boolean): Attachment<HTMLElement> => {
		const register = attachItemReference(isActivePanel);
		return (node) => {
			const off = register(node);
			attachPrevious(node);
			return off;
		};
	};

	const keepOpen = (closeOnClick: boolean | undefined) =>
		closeOnClick === false ? { 'data-menu-keep-open': 'true' } : {};

	// The root level's keys follow a row whose text changes; the levels below it are lists that
	// come and go as the path changes, so they keep the plain keys.
	const trackRootKeys = createMenuKeys();
	const rootKeys = $derived(trackRootKeys(getPanelItems(0)));
</script>

{#snippet caret()}
	<MenuMirroredIcon icon={caretRightIcon} />
{/snippet}

{#snippet rows(list: MenuItem[], depth: number, isActivePanel: boolean, scope: string)}
	{@const keys = scope === '' && depth === 0 ? rootKeys : menuItemKeys(list)}
	{#each list as item, index (keys[index])}
		{@const rowPath = `${depth}-${scope}${index}`}
		{#if item.type === 'button'}
			{@const buttonProps = omitKeys(item, ['type', 'key', 'value', 'closeOnClick'])}
			<Button
				role="menuitem"
				{...buttonProps}
				{...keepOpen(item.closeOnClick)}
				{...valueAttrs(item)}
				theme={theme?.button}
				{@attach attachItemReference(isActivePanel)}
				{@attach attachPrevious}
			/>
		{:else if item.type === 'option'}
			{@const optionProps = omitKeys(item, ['type', 'key', 'value'])}
			<MenuOption
				role={optionProps.selected !== undefined ? 'menuitemradio' : 'menuitem'}
				{density}
				{size}
				{...color ? { color } : {}}
				{...optionProps}
				attrs={{ ...optionProps.attrs, ...valueAttrs(item) }}
				theme={theme?.option}
				{@attach attachItemReference(isActivePanel)}
				{@attach attachPrevious}
			/>
		{:else if item.type === 'checkbox'}
			<MenuCheckboxItem
				item={withValue(valueAttrs(item), item)}
				{density}
				{size}
				{color}
				{theme}
				rowAttach={rowAttach(isActivePanel)}
			/>
		{:else if item.type === 'radio-group'}
			<MenuRadioGroup
				item={trackHighlight
					? { ...item, items: item.items.map((radio) => withValue(radioValueAttrs(radio), radio)) }
					: item}
				id={`${id}-group-${rowPath}`}
				{density}
				{size}
				{color}
				{theme}
				rowAttach={rowAttach(isActivePanel)}
			/>
		{:else if item.type === 'group'}
			<div
				role="group"
				aria-labelledby={item.label ? `${id}-group-${rowPath}` : undefined}
				class={classes.group({ density })}
			>
				{#if item.label}
					<div
						id={`${id}-group-${rowPath}`}
						aria-hidden="true"
						class={classes.groupLabel({ density })}
					>
						<Slot render={item.label} />
					</div>
				{/if}
				{@render rows(item.items, depth, isActivePanel, `${scope}${keys[index]}/`)}
			</div>
		{:else if item.type === 'separator'}
			{@const separatorProps = omitKeys(item, ['key'])}
			<Separator {...separatorProps} theme={theme?.separator} />
		{:else if item.type === 'submenu'}
			{@const submenuItem = item as SubmenuItemWithPopoverClass}
			{@const itemProps = omitKeys(submenuItem, [
				'type',
				'key',
				'value',
				'menu',
				'openOnHover',
				'openOnClick',
				'delay',
				'closeOnMouseLeave',
				'debugSafeArea',
				'filter',
				'onHighlightChange',
				'popoverClass',
				'closeOnClick',
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
				suffix={suffix ?? caret}
				theme={theme?.submenu}
				attrs={{
					...attrs,
					...valueAttrs(item),
					'aria-haspopup': 'menu',
					'aria-expanded': 'false',
					'data-menu-keep-open': 'true'
				}}
				onclick={(event) => {
					itemOnClick?.(event);
					if (openOnClick) void openSubmenu(depth, event.currentTarget as HTMLElement, item);
				}}
				{@attach attachItemReference(isActivePanel)}
				{@attach (node) => {
					Object.assign(node, {
						onNext: () => {
							void openSubmenu(depth, node, item);
						},
						onPrevious: leaveSubmenu
					});
				}}
			/>
		{/if}
	{/each}
{/snippet}

<div
	class={classes.root({ density, className })}
	data-size={size}
	data-density={density}
	data-color={color}
	{...panelDir ? { dir: panelDir } : {}}
	{...attachments}
>
	{#if activeStep === 0}
		<Slot render={header} renderIf={!!header} class={classes.header()} />
	{/if}

	<!-- The search field of the level on show; keyed by level, so each level starts on a field of its own. -->
	{#key activeStep}
		{#if activeFilter}
			<MenuSearchField
				bind:input={searchField}
				value={levelSearch(activeStep)}
				placeholder={activeFilter.placeholder ?? t.searchEllipsis}
				label={activeFilter.label ?? activeFilter.placeholder ?? t.search}
				{size}
				{theme}
				listId={`${id}-list`}
				{activeId}
				oninput={editSearch}
				onkeydown={searchKeys}
			/>
		{/if}
	{/key}

	<div
		id={`${id}-list`}
		class={classes.list({ density })}
		role="menu"
		tabindex="-1"
		data-size={size}
		data-density={density}
		data-color={color}
		bind:this={listElement}
		onmousedown={keepFocusInField}
		{@attach navigation.containerReference}
		{@attach trackHighlight || activeFilter ? watchList : undefined}
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
					<div class={classes.list({ density })} data-menu-depth={depth}>
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
						{/if}

						{@render rows(panelItems, depth, isActivePanel, '')}
					</div>
				{/if}
			{/snippet}
		</Stepper>
	</div>

	{#if activeFilter && !hasMenuRows(getPanelItems(activeStep))}
		<!-- Outside the menu: it may only own rows. A status region, so the message is announced. -->
		<div role="status" class={classes.empty({ density })}>
			{#if empty}
				{@render empty()}
			{:else}
				{t.noResults}
			{/if}
		</div>
	{/if}

	{#if activeStep === 0}
		<Slot render={footer} renderIf={!!footer} class={classes.footer()} />
	{/if}
</div>
