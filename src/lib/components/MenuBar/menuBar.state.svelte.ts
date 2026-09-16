import { tick, untrack } from 'svelte';
import { createAttachmentKey, type Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
import type { MenuProps } from '../Menu/menu.props.js';
import type { MenuBarMenu } from './menuBar.props.js';

/** Keys of a `MenuBarMenu` that drive the trigger button and must not reach the `<Menu />`. */
type MenuBarTriggerKeys = 'label' | 'prefix' | 'suffix' | 'disabled';

export function useMenuBarState(
	getMenus: () => MenuBarMenu[],
	getDirection: () => 'ltr' | 'rtl',
	id: string
) {
	const menuAttachmentKey = createAttachmentKey();
	const navigation = useNavigation({
		typeahead: true,
		orientation: 'horizontal',
		loop: true,
		id,
		enableHoverFocus: false
	});

	const openStates = $state(untrack(() => getMenus().map(() => false)));
	let keyboardOpen = $state(false);
	let openedByTrigger = $state(false);
	let lastActiveIndex = $state<number | null>(null);
	const triggerElements = $state<Array<HTMLElement | undefined>>([]);
	const activeIndex = $derived.by(() => {
		const index = openStates.findIndex(Boolean);
		return index === -1 ? null : index;
	});
	const nextKey = $derived(getDirection() === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
	const previousKey = $derived(getDirection() === 'rtl' ? 'ArrowRight' : 'ArrowLeft');

	$effect(() => {
		const menuCount = getMenus().length;
		untrack(() => {
			openStates.length = menuCount;
			for (let index = 0; index < menuCount; index++) {
				openStates[index] ??= false;
			}
		});
	});

	function findEnabledIndex(from: number, direction: 1 | -1) {
		const menus = getMenus();
		if (menus.length === 0) return -1;

		for (let offset = 1; offset <= menus.length; offset++) {
			const index = (from + direction * offset + menus.length * 2) % menus.length;
			if (!menus[index]?.disabled) return index;
		}

		return -1;
	}

	function openMenu(index: number, source: 'keyboard' | 'pointer', isTriggerActivation = false) {
		const menus = getMenus();
		if (menus[index]?.disabled) return;
		for (let menuIndex = 0; menuIndex < menus.length; menuIndex++) {
			openStates[menuIndex] = menuIndex === index;
		}
		keyboardOpen = source === 'keyboard';
		openedByTrigger = isTriggerActivation;
		lastActiveIndex = index;
	}

	async function focusOpenMenu(index: number) {
		await tick();
		document
			.getElementById(`${id}-menu-${index}`)
			?.querySelector<HTMLElement>('[role="menu"]')
			?.focus();
	}

	function moveOpenMenu(from: number, direction: 1 | -1) {
		const nextIndex = findEnabledIndex(from, direction);
		if (nextIndex !== -1) openMenu(nextIndex, 'keyboard');
	}

	function handleTriggerClick(index: number, source: 'keyboard' | 'pointer' = 'pointer') {
		if (activeIndex !== index) {
			openMenu(index, source, true);
			return;
		}

		if (openedByTrigger) {
			openStates[index] = false;
		} else {
			openedByTrigger = true;
		}
	}

	function handleTriggerEnter(index: number) {
		if (activeIndex !== null && activeIndex !== index) openMenu(index, 'pointer');
	}

	function handleTriggerFocus(index: number) {
		if (navigation.focusedIndex !== index) navigation.focusItem(index);
		if (activeIndex !== null && activeIndex !== index) openMenu(index, 'keyboard');
	}

	function handleMenuClose(index: number) {
		if (openStates.some(Boolean) || lastActiveIndex !== index) return;
		triggerElements[index]?.focus();
	}

	const attachTrigger =
		(index: number): Attachment<HTMLElement> =>
		(node) =>
			untrack(() => {
				triggerElements[index] = node;
				const focusCleanup = on(node, 'focus', () => handleTriggerFocus(index));
				const pointerEnterCleanup = on(node, 'pointerenter', () => handleTriggerEnter(index));
				const keydownCleanup = on(node, 'keydown', (event) => {
					const opensMenu =
						event.key === 'ArrowDown' ||
						event.key === 'ArrowUp' ||
						event.key === 'Enter' ||
						event.key === ' ';
					if (!opensMenu) return;
					event.preventDefault();
					event.stopPropagation();
					if (event.key === 'Enter' || event.key === ' ') {
						handleTriggerClick(index, 'keyboard');
						return;
					}

					if (activeIndex === index) {
						void focusOpenMenu(index);
						return;
					}

					openMenu(index, 'keyboard', true);
				});

				return () => {
					focusCleanup();
					pointerEnterCleanup();
					keydownCleanup();
					if (triggerElements[index] === node) triggerElements[index] = undefined;
				};
			});

	const attachMenuNavigation =
		(index: number): Attachment<HTMLElement> =>
		(node) =>
			on(
				node,
				'keydown',
				(event) => {
					if (event.key !== nextKey && event.key !== previousKey) return;

					const target = event.target as HTMLElement & { onNext?: () => void };
					if (event.key === nextKey && typeof target.onNext === 'function') return;

					event.preventDefault();
					event.stopPropagation();
					moveOpenMenu(index, event.key === nextKey ? 1 : -1);
				},
				{ capture: true }
			);

	function getMenuProps(menu: MenuBarMenu, index: number): MenuProps {
		// `label`, `prefix`, `suffix` and `disabled` belong to the trigger button, not the menu.
		const props: Omit<MenuBarMenu, MenuBarTriggerKeys> &
			Partial<Pick<MenuBarMenu, MenuBarTriggerKeys>> = { ...menu };
		delete props.label;
		delete props.prefix;
		delete props.suffix;
		delete props.disabled;
		return {
			...props,
			focusOnMount: keyboardOpen && activeIndex === index ? true : 'container',
			[menuAttachmentKey]: attachMenuNavigation(index)
		};
	}

	return {
		openStates,
		navigation,
		get activeIndex() {
			return activeIndex;
		},
		attachTrigger,
		getMenuProps,
		handleMenuClose,
		handleTriggerClick
	};
}
