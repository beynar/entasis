<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { on } from 'svelte/events';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { composedContains, getDeepActiveElement } from '$lib/utils/focus.js';
	import { getInteractionType } from '$lib/utils/openChange.js';
	import { useDirection } from '$lib/utils/useDirection.svelte.js';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import Button from '../Button/Button.svelte';
	import { arrowLeftIcon } from '../Icons/arrowLeft.js';
	import { caretRightIcon } from '../Icons/caretRight.js';
	import MenuOption from '../MenuOption/MenuOption.svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import {
		usePopupMenuPanelSize,
		usePopupMenuRoot,
		usePopupMenuSubmenu
	} from '../PopupMenu/popupMenu.context.js';
	import {
		popoverInternals,
		usePopoverContext,
		type PopoverState
	} from '../Popover/popover.state.svelte.js';
	import type { PopoverApi } from '../Popover/popover.api.js';
	import type { PopoverPlacement } from '../Popover/popover.props.js';
	import Separator from '../Separator/Separator.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { ResponsiveProps } from '../Theme/theme.js';
	import MenuCheckboxItem from './MenuCheckboxItem.svelte';
	import MenuMirroredIcon from './MenuMirroredIcon.svelte';
	import MenuRadioGroup from './MenuRadioGroup.svelte';
	import MenuSearchField from './MenuSearchField.svelte';
	import {
		HIGHLIGHT_VALUE_ATTRIBUTE,
		createSearchKeys,
		rowValue,
		useMenuSearch,
		watchHighlight
	} from './menu.filter.svelte.js';
	import type { MenuItem, MenuProps } from './menu.props.js';
	import { isApplePlatform } from './menu.platform.js';
	import { useMenuTheme } from './menu.theme.js';
	import { createMenuKeys, hasMenuRows, menuItemValue } from './menuTree.js';

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
	// The panel size of the PopupMenu this menu sits in, so a submenu opens in the same panel.
	const panelSize = usePopupMenuPanelSize();
	// The menu tree this menu belongs to, which its submenus join.
	const menuTree = usePopupMenuRoot();
	// Whether this menu is a level below the root: ArrowLeft (ArrowRight in right-to-left text)
	// leaves it, whatever hosts the root.
	const hasParentMenu = usePopupMenuSubmenu();

	const id = $props.id();
	const parentPopover = usePopoverContext();
	const classes = $derived(useMenuTheme(theme));
	const t = $derived(useI18n());
	const isInMobileSheet = $derived(parentPopover?.isMobileSheet ?? false);
	const showBackControl = $derived(isInMobileSheet && hasParentMenu);
	// Narrow viewports have no room beside the parent panel, so the submenu drops below it
	// instead; `md` up it flies out on the reading direction's end side. The nearest-below cascade
	// covers `sm` from `xs`. When neither side of the parent has room, the submenu falls back to
	// the cross axis (`fallbackAxisSide`) and opens below its row instead of covering the menu.
	const submenuPosition: ResponsiveProps<PopoverPlacement> = {
		xs: 'bottom-start',
		md: 'inline-end-start'
	};

	// The panel is portaled out of the trigger's subtree, so it does not inherit a `dir` set there:
	// a menu opened from a right-to-left subtree carries that direction itself, which also keeps
	// the arrow keys, the carets and the text of its rows reading the way the trigger does.
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

	const apple = isApplePlatform();

	// Keyed by row key, so a row keeps its popover registration while rows around it come and go.
	let submenuPopovers = $state<Record<string, PopoverState>>({});
	// Derived from the popovers' own isOpen (which flips the instant open()/close()
	// is called), not from onAfterOpen/onAfterClose callbacks, which only fire after the
	// intro/outro transitions and would keep the parent nav frozen during the fade.
	const anySubmenuOpen = $derived(Object.values(submenuPopovers).some((p) => p.isOpen));

	// Keys belong to the submenu that holds focus: while one does, this menu's keys stay with it.
	const submenuHoldsFocus = () => {
		const active = getDeepActiveElement();
		if (!active) return false;
		return Object.values(submenuPopovers).some(
			(popover) =>
				popover.isOpen && !!popover.panelElement && composedContains(popover.panelElement, active)
		);
	};

	// A menu with a search field keeps focus in the field: the rows are only highlighted (virtual
	// focus), and typing belongs to the field rather than to type-ahead.
	const query = useMenuSearch({
		filter: () => filter,
		search: () => search,
		write: (next) => {
			search = next;
		},
		defaultSearch: () => defaultSearch,
		onSearchChange: () => onSearchChange
	});
	const filterable = untrack(() => query.enabled);

	const navigation = useNavigation({
		typeahead: !filterable,
		virtualFocus: filterable,
		enabled: () => !submenuHoldsFocus(),
		orientation: () => 'vertical',
		loop: true,
		id,
		enableHoverFocus: true,
		defaultFocusedIndex: () => navigation.lastFocusedIndex ?? 0,
		preventKeyboardDefault: false
	});

	let list = $state<HTMLElement | null>(null);
	let searchField = $state<HTMLInputElement | null>(null);
	const listId = `${id}-list`;

	onMount(() => {
		void (async () => {
			await tick();
			if (filterable) {
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

	// The highlighted row is named by the search field (`aria-activedescendant`) and reported to
	// `onHighlightChange` by value, whether the keyboard, the pointer or the filter moved it.
	let activeId = $state<string | undefined>();
	const trackHighlight = $derived(!!onHighlightChange);
	const watchList = (node: HTMLElement) =>
		watchHighlight(node, (row) => {
			activeId = row?.id || undefined;
			onHighlightChange?.(rowValue(row));
		});

	const visibleItems = $derived(query.visible(items));

	// Typing narrows the rows; the first match is highlighted so Enter presses it, and an empty
	// field clears the highlight.
	const editSearch = (next: string) => {
		query.set(next);
		void tick().then(() => {
			if (query.search.trim() === '') navigation.clearFocus();
			else navigation.focusFirst();
		});
	};

	const searchKeys = createSearchKeys({
		navigation,
		list: () => list,
		rtl: () => getDirection() === 'rtl',
		leave: () => goUp()
	});

	// A press on a row keeps focus in the search field.
	const keepFocusInField = (event: MouseEvent) => {
		if (filterable) event.preventDefault();
	};

	const closeParentMenu = () => {
		if (!parentPopover) return;
		const trigger = parentPopover.referenceElement;
		parentPopover.close({ reason: 'list-navigation', interaction: 'keyboard' });
		if (!(trigger instanceof HTMLElement)) return;
		// A parent with a search field keeps focus in the field (its rows are only highlighted), so
		// that is where focus returns; typing then goes on filtering the parent.
		const parentList = trigger.closest('[role="menu"]');
		const parentField = parentList?.id
			? trigger.ownerDocument.querySelector<HTMLInputElement>(
					`input[aria-controls="${CSS.escape(parentList.id)}"]`
				)
			: null;
		(parentField ?? trigger).focus();
	};

	const goBack = () => {
		closeParentMenu();
	};

	// Returns whether there was a level to leave: on a root row ArrowLeft stays unhandled.
	const goUp = () => {
		if (!hasParentMenu) return false;
		goBack();
		return true;
	};

	const attachPrevious = (node: HTMLElement) => {
		Object.assign(node, { onPrevious: goUp });
	};

	const attachBackControl = (node: HTMLElement) => {
		Object.assign(node, { onPrevious: goBack });
	};

	const pointerFrom = (e: MouseEvent) => ({ x: e.clientX, y: e.clientY });

	const closeSubmenus = (exceptKey?: string, pointer?: { x: number; y: number }) => {
		for (const [key, popover] of Object.entries(submenuPopovers)) {
			if (key === exceptKey) continue;
			// Don't close a submenu the pointer is still travelling toward: its safe
			// area (the trigger→panel corridor) has authority during the diagonal
			// transit, so a sibling row you merely cross doesn't slam it shut.
			if (pointer && popover.safeArea.containsPoint(pointer.x, pointer.y)) continue;
			popover.close();
		}
	};

	// Focus moving onto a row of this menu (a screen reader's cursor, a click, Shift+Tab from a
	// submenu that stayed open) ends every submenu that row does not own, so the arrow keys work
	// here again.
	const closeSubmenusOnFocus = (event: FocusEvent) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		// Focus inside a submenu belongs to that submenu, even in the moment before its panel has
		// been moved out of this menu's subtree. The header, footer and search field count as this
		// menu's own.
		const owner = target.closest('[role="menu"]');
		if (owner && owner !== list) return;
		// The menu itself taking focus (its mount focus, a press on its padding) names no row.
		if (target === list) return;
		for (const popover of Object.values(submenuPopovers)) {
			if (!popover.isOpen) continue;
			const trigger = popover.triggerReference;
			if (trigger && composedContains(trigger, target)) continue;
			if (popover.panelElement && composedContains(popover.panelElement, target)) continue;
			popover.close({ reason: 'focus-out', event, interaction: 'keyboard' });
		}
	};

	// The moment every submenu is closed (isOpen, not transition end), hand the
	// hover highlight to the row actually under the mouse — the parent nav was
	// disabled while a submenu was open, so the highlight froze on the trigger.
	let hadSubmenuOpen = false;
	$effect(() => {
		const open = anySubmenuOpen;
		untrack(() => {
			if (hadSubmenuOpen && !open) navigation.syncPointerFocus();
			hadSubmenuOpen = open;
		});
	});

	/** Moves focus into an open submenu, onto its first row. */
	const focusSubmenu = (popover: PopoverState) => {
		popover.panelElement?.querySelector<HTMLElement>('[role="menu"]')?.focus();
	};

	/** Registers a row (checkbox, radio) with this menu's navigation, hover and ArrowLeft. */
	const rowAttach: Attachment<HTMLElement> = (node) => {
		const off = navigation.itemReference(node);
		attachPrevious(node);
		const offEnter = on(node, 'pointerenter', (event) =>
			closeSubmenus(undefined, pointerFrom(event))
		);
		return () => {
			off?.();
			offEnter();
		};
	};

	/** What a row passes to the element it renders, without the fields the menu itself reads. */
	const withoutMenuFields = <T extends object, K extends string>(source: T, keys: readonly K[]) => {
		const result: Record<string, unknown> = { ...(source as Record<string, unknown>) };
		for (const key of keys) delete result[key];
		return result as Omit<T, K>;
	};

	const keepOpen = (closeOnClick: boolean | undefined) =>
		closeOnClick === false ? { 'data-menu-keep-open': 'true' } : {};

	// The value a row reports to `onHighlightChange`, written on the row only when something reads it.
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

	// One key tracker per list of rows (the root, each group), so a row that changes its own text
	// keeps its node.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- plain memo of the previous render; nothing reads it reactively
	const keyTrackers = new Map<string, ReturnType<typeof createMenuKeys>>();
	const keysFor = (scope: string, entries: readonly MenuItem[]) => {
		let track = keyTrackers.get(scope);
		if (!track) keyTrackers.set(scope, (track = createMenuKeys()));
		return track(entries);
	};
	const rowKeys = $derived(keysFor('', visibleItems));

	/** Wires a submenu trigger row: its popover registration, ArrowRight and ArrowLeft. */
	const registerSubmenu = (node: HTMLElement, key: string, api: PopoverApi) => {
		const popover = popoverInternals(api);
		// VoiceOver announces the trigger's state again when focus lands in the submenu it opened;
		// leaving `aria-expanded` off while the submenu is open avoids that.
		// The popover writes the attribute from its own effect, so this watches the attribute and
		// removes it after each write, whichever effect ran first.
		let offExpanded: (() => void) | undefined;
		if (apple && typeof MutationObserver !== 'undefined') {
			const observer = new MutationObserver(() => {
				if (popover.isOpen && node.hasAttribute('aria-expanded'))
					node.removeAttribute('aria-expanded');
			});
			observer.observe(node, { attributes: true, attributeFilter: ['aria-expanded'] });
			offExpanded = () => observer.disconnect();
		}
		submenuPopovers[key] = popover;
		Object.assign(node, {
			onNext: () => {
				closeSubmenus(key);
				if (popover.isOpen) focusSubmenu(popover);
				else popover.open({ reason: 'list-navigation', interaction: 'keyboard' });
			},
			onPrevious: goUp
		});
		return () => {
			offExpanded?.();
			delete submenuPopovers[key];
		};
	};
</script>

{#snippet caret()}
	<MenuMirroredIcon icon={caretRightIcon} />
{/snippet}

{#snippet backIcon()}
	<MenuMirroredIcon icon={arrowLeftIcon} />
{/snippet}

{#snippet rows(entries: MenuItem[], scope: string)}
	{@const keys = scope === '' ? rowKeys : keysFor(scope, entries)}
	{#each entries as item, index (keys[index])}
		{@const path = `${scope}${index}`}
		{#if item.type === 'button'}
			{@const buttonProps = withoutMenuFields(item, ['type', 'key', 'value', 'closeOnClick'])}
			<Button
				role="menuitem"
				{...buttonProps}
				{...keepOpen(item.closeOnClick)}
				{...valueAttrs(item)}
				data-disabled={item.disabled ? '' : undefined}
				theme={theme?.button}
				{@attach navigation.itemReference}
				{@attach attachPrevious}
				{@attach (node) =>
					on(node, 'pointerenter', (e) => closeSubmenus(undefined, pointerFrom(e)))}
			/>
		{:else if item.type === 'option'}
			{@const optionProps = withoutMenuFields(item, ['type', 'key', 'value'])}
			<MenuOption
				role={optionProps.selected !== undefined ? 'menuitemradio' : 'menuitem'}
				{density}
				{size}
				{...color ? { color } : {}}
				{...optionProps}
				attrs={{ ...optionProps.attrs, ...valueAttrs(item) }}
				theme={theme?.option}
				onpointerenter={(event) => {
					item.onpointerenter?.(event);
					closeSubmenus(undefined, pointerFrom(event));
				}}
				{@attach navigation.itemReference}
				{@attach attachPrevious}
			/>
		{:else if item.type === 'checkbox'}
			<MenuCheckboxItem
				item={withValue(valueAttrs(item), item)}
				{density}
				{size}
				{color}
				{theme}
				{rowAttach}
			/>
		{:else if item.type === 'radio-group'}
			<MenuRadioGroup
				item={trackHighlight
					? { ...item, items: item.items.map((radio) => withValue(radioValueAttrs(radio), radio)) }
					: item}
				id={`${id}-group-${path}`}
				{density}
				{size}
				{color}
				{theme}
				{rowAttach}
			/>
		{:else if item.type === 'group'}
			<div
				role="group"
				aria-labelledby={item.label ? `${id}-group-${path}` : undefined}
				class={classes.group({ density })}
			>
				{#if item.label}
					<div
						id={`${id}-group-${path}`}
						aria-hidden="true"
						class={classes.groupLabel({ density })}
					>
						<Slot render={item.label} />
					</div>
				{/if}
				{@render rows(item.items, `${scope}${keys[index]}/`)}
			</div>
		{:else if item.type === 'separator'}
			{@const separatorProps = withoutMenuFields(item, ['key'])}
			<Separator {...separatorProps} theme={theme?.separator} />
		{:else if item.type === 'submenu'}
			{@const submenuItem = item as typeof item & { popoverClass?: string }}
			{@const submenuKey = `${scope}${keys[index]}`}
			<!-- eslint-disable @typescript-eslint/no-unused-vars -- Remove the submenu discriminant before forwarding native element props. -->
			{@const {
				type: _type,
				key: _key,
				value: _value,
				menu,
				openOnHover = true,
				openOnClick = true,
				delay = 100,
				closeOnMouseLeave = true,
				debugSafeArea = false,
				filter: submenuFilter,
				onHighlightChange: submenuHighlight,
				popoverClass,
				closeOnClick: _closeOnClick,
				onclick: itemOnClick,
				onpointerenter: itemOnPointerEnter,
				suffix,
				attrs,
				...itemProps
			} = submenuItem}
			<!-- eslint-enable @typescript-eslint/no-unused-vars -->
			<!-- Inside a PopupMenu (or another tree host) the submenu joins that menu's tree: the
			     root's closeOnItemClick applies, and choosing an item closes every level. In an
			     inline Menu with no host the submenu roots its own tree and closes on item press. -->
			<PopupMenu
				submenuOf={menuTree}
				isSubmenu
				size={panelSize?.() ?? 'small'}
				position={submenuPosition}
				fallbackAxisSide="end"
				openOnHover={openOnHover && !item.disabled && !isInMobileSheet}
				{openOnClick}
				{delay}
				{closeOnMouseLeave}
				{debugSafeArea}
				closeOnEscape={true}
				mobileSheet={false}
				class={popoverClass}
				menu={{
					items: menu,
					submenuMode: 'popover',
					// A submenu is the same menu one level down, so every axis the parent was
					// given rides along: without this a `size="small"` menu opened a
					// normal-sized submenu beside itself.
					density,
					size,
					...(color ? { color } : {}),
					...(submenuFilter ? { filter: submenuFilter } : {}),
					...(submenuHighlight ? { onHighlightChange: submenuHighlight } : {}),
					theme
				}}
			>
				{#snippet trigger(popover)}
					<MenuOption
						role="menuitem"
						{density}
						{size}
						{...color ? { color } : {}}
						{...itemProps}
						suffix={suffix ?? caret}
						theme={theme?.submenu}
						active={popover.isOpen}
						attrs={{
							...attrs,
							...valueAttrs(item),
							'data-menu-keep-open': 'true'
						}}
						onclick={(event) => {
							itemOnClick?.(event);
							closeSubmenus(submenuKey);
							if (!openOnClick) return;
							if (!popover.isOpen) {
								popover.open(event);
								return;
							}
							// A mouse click on a submenu the pointer opened keeps it open; any other repeated
							// press (the keyboard, assistive technology, a second click) closes it.
							const interaction = getInteractionType(event);
							const byPointer = interaction !== 'keyboard' && interaction !== 'programmatic';
							if (popover.openReason === 'hover' && byPointer) popover.open(event);
							else popover.close(event);
						}}
						onpointerenter={(event) => {
							itemOnPointerEnter?.(event);
							closeSubmenus(submenuKey, pointerFrom(event));
						}}
						{@attach popover.reference}
						{@attach navigation.itemReference}
						{@attach (node) => registerSubmenu(node, submenuKey, popover)}
					/>
				{/snippet}
			</PopupMenu>
		{/if}
	{/each}
{/snippet}

<div
	class={classes.root({ density, className })}
	data-size={size}
	data-density={density}
	data-color={color}
	onfocusin={closeSubmenusOnFocus}
	{...panelDir ? { dir: panelDir } : {}}
	{...attachments}
>
	{#if !showBackControl}
		<Slot render={header} renderIf={!!header} class={classes.header()} />
	{/if}

	{#if filterable}
		<MenuSearchField
			bind:input={searchField}
			value={query.search}
			placeholder={query.options?.placeholder ?? t.searchEllipsis}
			label={query.options?.label ?? query.options?.placeholder ?? t.search}
			{size}
			{theme}
			{listId}
			{activeId}
			oninput={editSearch}
			onkeydown={searchKeys}
		/>
	{/if}

	<div
		id={listId}
		class={classes.list({ density })}
		role="menu"
		tabindex="-1"
		data-size={size}
		data-density={density}
		data-color={color}
		bind:this={list}
		onmousedown={keepFocusInField}
		{@attach navigation.containerReference}
		{@attach trackHighlight || filterable ? watchList : undefined}
	>
		{#if showBackControl}
			<MenuOption
				role="menuitem"
				title={t.back}
				prefix={backIcon}
				{density}
				{size}
				color={color ?? 'neutral'}
				theme={theme?.option}
				attrs={{ 'data-menu-keep-open': 'true' }}
				onclick={() => {
					goBack();
				}}
				{@attach navigation.itemReference}
				{@attach attachBackControl}
			/>
			<Separator theme={theme?.separator} />
		{/if}

		{@render rows(visibleItems, '')}
	</div>

	{#if filterable && !hasMenuRows(visibleItems)}
		<!-- Outside the menu: it may only own rows. A status region, so the message is announced. -->
		<div role="status" class={classes.empty({ density })}>
			{#if empty}
				{@render empty()}
			{:else}
				{t.noResults}
			{/if}
		</div>
	{/if}

	{#if !showBackControl}
		<Slot render={footer} renderIf={!!footer} class={classes.footer()} />
	{/if}
</div>
