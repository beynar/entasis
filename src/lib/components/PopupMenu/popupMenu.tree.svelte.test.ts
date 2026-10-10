// A menu and its submenus are one tree. Submenu panels are portaled out of the root panel, so the
// root's item-press listener never saw a click inside one: choosing a submenu item left every
// level open. The outermost PopupMenu now owns the tree, closes every level once, and focus goes
// back to the root trigger.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import ContextMenu from '../ContextMenu/ContextMenu.svelte';
import Menu from '../Menu/Menu.svelte';
import type { MenuItem } from '../Menu/menu.props.js';
import MenuBar from '../MenuBar/MenuBar.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import PopupMenu from './PopupMenu.svelte';

const zero = { in: { duration: 0 }, out: { duration: 0 } };

const tree = (leaf: Partial<Extract<MenuItem, { type: 'option' }>> = {}): MenuItem[] => [
	{ type: 'option', title: 'New file' },
	{
		type: 'submenu',
		title: 'Share',
		menu: [
			{ type: 'option', title: 'Copy link', ...leaf },
			{ type: 'submenu', title: 'Export', menu: [{ type: 'option', title: 'PDF' }] }
		]
	}
];

const menus = () => screen.queryAllByRole('menu');

/** Opens the submenu behind `title` from the panel that holds its trigger. */
const openSubmenu = async (title: string) => {
	const before = menus().length;
	await fireEvent.click(screen.getByRole('menuitem', { name: title }));
	await waitFor(() => expect(menus()).toHaveLength(before + 1));
	const panel = menus().at(-1) as HTMLElement;
	// The submenu focuses its first item once it mounts.
	await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true));
	return panel;
};

const openPopupMenu = async (props: Record<string, unknown> = {}) => {
	const onOpenChange = vi.fn();
	renderInTheme(PopupMenu, {
		trigger: { content: 'File' },
		menu: { items: tree(), submenuMode: 'popover' },
		onOpenChange,
		...props
	});
	const trigger = screen.getByRole('button', { name: 'File' });
	trigger.focus();
	await fireEvent.click(trigger);
	await waitFor(() => expect(menus()).toHaveLength(1));
	return { trigger, onOpenChange };
};

describe('popup menu tree', () => {
	test('a11y:popup-menu.item-closes-tree choosing a submenu item closes every level and returns focus to the trigger', async () => {
		const onCopy = vi.fn();
		const { trigger, onOpenChange } = await openPopupMenu({
			menu: { items: tree({ onclick: onCopy }), submenuMode: 'popover' }
		});
		const submenu = await openSubmenu('Share');

		await fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Copy link' }));

		expect(onCopy).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(menus()).toHaveLength(0));
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
		expect(document.activeElement).toBe(trigger);
	});

	test('an item two levels down closes all three panels at once', async () => {
		const { trigger, onOpenChange } = await openPopupMenu();
		await openSubmenu('Share');
		const exportPanel = await openSubmenu('Export');
		expect(menus()).toHaveLength(3);

		await fireEvent.click(within(exportPanel).getByRole('menuitem', { name: 'PDF' }));

		await waitFor(() => expect(menus()).toHaveLength(0));
		expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
		expect(document.activeElement).toBe(trigger);
	});

	test('focus still returns to the trigger when the root panel finishes closing first', async () => {
		// No root transition: the root panel leaves at once while the submenu still animates, so
		// the root's focus scope restores before the submenu panel is gone.
		const { trigger } = await openPopupMenu({ transition: zero });
		const submenu = await openSubmenu('Share');

		await fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Copy link' }));

		await waitFor(() => expect(menus()).toHaveLength(0));
		expect(document.activeElement).toBe(trigger);
	});

	test('a submenu item marked data-menu-keep-open keeps every level open', async () => {
		const { onOpenChange } = await openPopupMenu({
			menu: {
				items: tree({ attrs: { 'data-menu-keep-open': 'true' } }),
				submenuMode: 'popover'
			}
		});
		const submenu = await openSubmenu('Share');

		await fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Copy link' }));
		await new Promise((resolve) => setTimeout(resolve, 20));

		expect(menus()).toHaveLength(2);
		expect(onOpenChange.mock.calls).toEqual([[true]]);
	});

	test("the root's closeOnItemClick={false} keeps submenus open too", async () => {
		const { onOpenChange } = await openPopupMenu({ closeOnItemClick: false });
		const submenu = await openSubmenu('Share');

		await fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Copy link' }));
		await new Promise((resolve) => setTimeout(resolve, 20));

		expect(menus()).toHaveLength(2);
		expect(onOpenChange.mock.calls).toEqual([[true]]);
	});

	test('a root item still closes the root and an open submenu with it', async () => {
		const { trigger, onOpenChange } = await openPopupMenu();
		const [root] = menus();
		await openSubmenu('Share');

		await fireEvent.click(within(root).getByRole('menuitem', { name: 'New file' }));

		await waitFor(() => expect(menus()).toHaveLength(0));
		expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
		expect(document.activeElement).toBe(trigger);
	});

	test('in an inline Menu, choosing a flyout item closes the flyout', async () => {
		renderInTheme(Menu, { items: tree(), submenuMode: 'popover' });
		const [inline] = menus();
		const submenu = await openSubmenu('Share');

		await fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Copy link' }));

		await waitFor(() => expect(menus()).toEqual([inline]));
		expect(screen.getByRole('menuitem', { name: 'Share' })).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	});
});

const contextTarget = createRawSnippet(() => ({ render: () => '<button>Target</button>' }));

describe('context menu tree', () => {
	test('a11y:context-menu.item-closes-tree choosing a submenu item closes every level once and restores focus', async () => {
		const onOpenChange = vi.fn();
		renderInTheme(ContextMenu, { items: tree(), onOpenChange, children: contextTarget });
		const target = screen.getByRole('button', { name: 'Target' });
		target.focus();
		await fireEvent.contextMenu(target, { clientX: 40, clientY: 40 });
		await waitFor(() => expect(menus()).toHaveLength(1));
		const submenu = await openSubmenu('Share');

		await fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Copy link' }));

		await waitFor(() => expect(menus()).toHaveLength(0));
		expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
		// No trigger: focus goes back to the element that had it when the menu opened.
		expect(document.activeElement).toBe(target);
	});
});

describe('menu bar tree', () => {
	test('a11y:menu-bar.item-closes-tree choosing a submenu item closes the bar menu and returns focus to its trigger', async () => {
		renderInTheme(MenuBar, { menus: [{ label: 'File', items: tree() }] });
		const file = within(screen.getByRole('menubar')).getByRole('menuitem', { name: 'File' });
		file.focus();
		await fireEvent.click(file);
		await waitFor(() => expect(menus()).toHaveLength(1));
		await waitFor(() => expect(file).toHaveAttribute('aria-expanded', 'true'));
		const submenu = await openSubmenu('Share');

		await fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Copy link' }));

		await waitFor(() => expect(menus()).toHaveLength(0));
		expect(file).toHaveAttribute('aria-expanded', 'false');
		await waitFor(() => expect(document.activeElement).toBe(file));
	});
});
