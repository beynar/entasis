// A menu and its submenus are one tree. Submenu panels are portaled out of the root panel, so the
// root's item-press listener never saw a click inside one: choosing a submenu item left every
// level open. The outermost PopupMenu now owns the tree, closes every level once, and focus goes
// back to the root trigger. Only the submenus a Menu renders join a tree: a PopupMenu nested in a
// menu's header or trigger is the root of its own.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import ContextMenu from '../ContextMenu/ContextMenu.svelte';
import Menu from '../Menu/Menu.svelte';
import type { MenuItem } from '../Menu/menu.props.js';
import MenuBar from '../MenuBar/MenuBar.svelte';
import type { PopoverState } from '../Popover/popover.state.svelte.js';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import TreeContextMenuSurface from '../Tree/TreeContextMenuSurface.svelte';
import PopupMenu from './PopupMenu.svelte';
import PopupMenuNestedHarness from './PopupMenuNestedHarness.test.svelte';
import { closeMenuTree } from './popupMenu.context.js';

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
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const keepOpen = { attrs: { 'data-menu-keep-open': 'true' } };

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

	test('focus goes straight to the trigger, never resting on a closing submenu row', async () => {
		const { trigger } = await openPopupMenu();
		await openSubmenu('Share');
		const exportPanel = await openSubmenu('Export');

		await fireEvent.click(within(exportPanel).getByRole('menuitem', { name: 'PDF' }));

		// Before any panel has finished leaving. Handing focus to the Share row first, to wait for
		// the root panel's transition, announced a still-expanded submenu after the choice.
		expect(document.activeElement).toBe(trigger);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await waitFor(() => expect(menus()).toHaveLength(0));
		expect(document.activeElement).toBe(trigger);
	});

	test.each(['Enter', ' '])(
		'pressing %j on a submenu item closes the tree like a click',
		async (key) => {
			const onCopy = vi.fn();
			const { trigger, onOpenChange } = await openPopupMenu({
				menu: { items: tree({ onclick: onCopy }), submenuMode: 'popover' }
			});
			const submenu = await openSubmenu('Share');
			const copy = within(submenu).getByRole('menuitem', { name: 'Copy link' });
			expect(document.activeElement).toBe(copy);

			await fireEvent.keyDown(copy, { key });

			expect(onCopy).toHaveBeenCalledTimes(1);
			await waitFor(() => expect(menus()).toHaveLength(0));
			expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
			expect(document.activeElement).toBe(trigger);
		}
	);

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

describe('context menu tree options', () => {
	test.each([
		['popup.closeOnItemClick={false}', tree(), { closeOnItemClick: false }],
		['data-menu-keep-open on the item', tree(keepOpen), undefined]
	])('%s keeps the menu and its submenu open', async (_case, items, popup) => {
		const onOpenChange = vi.fn();
		renderInTheme(ContextMenu, { items, popup, onOpenChange, children: contextTarget });
		await fireEvent.contextMenu(screen.getByRole('button', { name: 'Target' }), {
			clientX: 40,
			clientY: 40
		});
		await waitFor(() => expect(menus()).toHaveLength(1));
		const submenu = await openSubmenu('Share');

		await fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Copy link' }));
		await settle();

		expect(menus()).toHaveLength(2);
		expect(onOpenChange.mock.calls).toEqual([[true]]);
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

describe('menu bar tree options', () => {
	test.each([
		['closeOnItemClick={false}', tree(), false],
		['data-menu-keep-open on the item', tree(keepOpen), true]
	])('%s keeps the bar menu and its submenu open', async (_case, items, closeOnItemClick) => {
		renderInTheme(MenuBar, { menus: [{ label: 'File', items }], closeOnItemClick });
		const file = within(screen.getByRole('menubar')).getByRole('menuitem', { name: 'File' });
		file.focus();
		await fireEvent.click(file);
		await waitFor(() => expect(menus()).toHaveLength(1));
		const submenu = await openSubmenu('Share');

		await fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Copy link' }));
		await settle();

		expect(menus()).toHaveLength(2);
		expect(file).toHaveAttribute('aria-expanded', 'true');
	});
});

describe('menus nested without being submenus', () => {
	test("a menu in another menu's header keeps its own closeOnItemClick", async () => {
		const onInnerItem = vi.fn();
		const onInnerOpenChange = vi.fn();
		renderInTheme(PopupMenuNestedHarness, {
			placement: 'header',
			outerCloseOnItemClick: false,
			onInnerItem,
			onInnerOpenChange
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
		await waitFor(() => expect(menus()).toHaveLength(1));
		await fireEvent.click(screen.getByRole('button', { name: 'More' }));
		await waitFor(() => expect(menus()).toHaveLength(2));

		await fireEvent.click(within(menus()[1]).getByRole('menuitem', { name: 'Archive' }));

		expect(onInnerItem).toHaveBeenCalledTimes(1);
		// The inner menu closes on its own default; the outer one, which keeps open, stays.
		await waitFor(() => expect(menus()).toHaveLength(1));
		expect(onInnerOpenChange.mock.calls).toEqual([[true], [false]]);
		expect(screen.getByRole('button', { name: 'Columns' })).toHaveAttribute(
			'aria-expanded',
			'true'
		);
	});

	test("a menu in a closed menu's trigger closes on its own item press", async () => {
		const onInnerItem = vi.fn();
		const onInnerOpenChange = vi.fn();
		renderInTheme(PopupMenuNestedHarness, {
			placement: 'trigger',
			onInnerItem,
			onInnerOpenChange
		});
		await fireEvent.click(screen.getByRole('button', { name: 'More' }));
		await waitFor(() => expect(menus()).toHaveLength(1));

		await fireEvent.click(screen.getByRole('menuitem', { name: 'Archive' }));

		expect(onInnerItem).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(menus()).toHaveLength(0));
		expect(onInnerOpenChange.mock.calls).toEqual([[true], [false]]);
	});
});

describe('menu hosted inline', () => {
	test("choosing a flyout item in Tree's context menu closes the whole surface", async () => {
		const close = vi.fn();
		const onArchive = vi.fn();
		const items: MenuItem[] = [
			{ type: 'option', title: 'Rename' },
			{
				type: 'submenu',
				title: 'Move to',
				menu: [{ type: 'option', title: 'Archive', onclick: onArchive }]
			}
		];
		renderInTheme(TreeContextMenuSurface, {
			items,
			data: { context: { anchorRect: { x: 10, y: 10, width: 0, height: 0 } }, close } as never
		});
		const flyout = await openSubmenu('Move to');

		await fireEvent.click(within(flyout).getByRole('menuitem', { name: 'Archive' }));

		expect(onArchive).toHaveBeenCalledTimes(1);
		expect(close).toHaveBeenCalledTimes(1);
	});
});

describe('closeMenuTree', () => {
	type FakeLevel = {
		name: string;
		isOpen: boolean;
		children: FakeLevel[];
		dialogElement: HTMLElement | null;
		close: () => void;
	};
	const level = (name: string, closed: string[], children: FakeLevel[] = []): FakeLevel => {
		const fake: FakeLevel = {
			name,
			isOpen: true,
			children,
			dialogElement: null,
			close: vi.fn(() => {
				closed.push(name);
				fake.isOpen = false;
			})
		};
		return fake;
	};

	test('closes every open level once, deepest first, and skips closed ones', () => {
		const closed: string[] = [];
		const exportLevel = level('export', closed);
		const shareLevel = level('share', closed, [exportLevel]);
		const closedLevel = level('closed', closed);
		closedLevel.isOpen = false;
		const root = level('root', closed, [shareLevel, closedLevel]);

		closeMenuTree(root as unknown as PopoverState, null);

		expect(closed).toEqual(['export', 'share', 'root']);
		expect(closedLevel.close).not.toHaveBeenCalled();
	});

	test('moves focus to the return target only when focus was inside the tree', () => {
		const panel = document.createElement('div');
		const item = document.createElement('button');
		const trigger = document.createElement('button');
		const elsewhere = document.createElement('button');
		panel.append(item);
		document.body.append(panel, trigger, elsewhere);
		const submenu = level('submenu', []);
		submenu.dialogElement = panel;

		item.focus();
		closeMenuTree(level('root', [], [submenu]) as unknown as PopoverState, trigger);
		expect(document.activeElement).toBe(trigger);

		elsewhere.focus();
		closeMenuTree(level('root', []) as unknown as PopoverState, trigger);
		expect(document.activeElement).toBe(elsewhere);
		panel.remove();
		trigger.remove();
		elsewhere.remove();
	});
});
