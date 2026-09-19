// A submenu is the same menu one level down. Its rows are rendered by a *second* `Menu`
// instance living in a nested `PopupMenu`, so nothing carries the parent's axes across unless
// the props are handed over explicitly — a `size="small"` menu used to open a normal-sized
// submenu right beside itself, and a pinned `color` stopped at the first panel.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import Menu from './Menu.svelte';
import type { MenuItem } from './menu.props.js';

const items: MenuItem[] = [
	{ type: 'option', title: 'Dashboard' },
	{
		type: 'submenu',
		title: 'Recent files',
		menu: [
			{ type: 'option', title: 'document.txt' },
			{ type: 'option', title: 'project.js' }
		]
	}
];

const axes = (element: HTMLElement) => ({
	size: element.dataset.size,
	density: element.dataset.density,
	color: element.dataset.color
});

const openSubmenu = async () => {
	const [parent] = screen.getAllByRole('menu');
	await fireEvent.click(screen.getByRole('menuitem', { name: /Recent files/ }));
	const submenu = await waitFor(() => {
		const panels = screen.getAllByRole('menu').filter((panel) => panel !== parent);
		expect(panels).toHaveLength(1);
		return panels[0];
	});
	return { parent, submenu };
};

describe('menu submenu inheritance', () => {
	test('the submenu renders on the same size, density and colour as the menu that opened it', async () => {
		renderInTheme(Menu, {
			items,
			submenuMode: 'popover',
			size: 'small',
			density: 'comfortable',
			color: 'info'
		});

		const { parent, submenu } = await openSubmenu();
		expect(axes(parent)).toEqual({ size: 'small', density: 'comfortable', color: 'info' });
		expect(axes(submenu)).toEqual(axes(parent));
	});

	test('the submenu rows carry the inherited axes, not the MenuOption defaults', async () => {
		renderInTheme(Menu, {
			items,
			submenuMode: 'popover',
			size: 'small',
			density: 'comfortable',
			color: 'info'
		});

		const { submenu } = await openSubmenu();
		const row = submenu.querySelector<HTMLElement>('[role="menuitem"]');
		expect(row).not.toBeNull();
		expect(axes(row as HTMLElement)).toEqual({
			size: 'small',
			density: 'comfortable',
			color: 'info'
		});
	});

	test('an item that names its own axis still wins over the inherited one', async () => {
		renderInTheme(Menu, {
			items: [
				{
					type: 'submenu',
					title: 'Recent files',
					menu: [{ type: 'option', title: 'document.txt', color: 'danger', size: 'large' }]
				}
			] satisfies MenuItem[],
			submenuMode: 'popover',
			size: 'small',
			color: 'info'
		});

		const { submenu } = await openSubmenu();
		const row = submenu.querySelector<HTMLElement>('[role="menuitem"]') as HTMLElement;
		expect(row.dataset.color).toBe('danger');
		expect(row.dataset.size).toBe('large');
	});
});

describe('popup menu submenu panel', () => {
	test('a submenu opens in a panel of the same size as the PopupMenu that hosts it', async () => {
		const { default: PopupMenu } = await import('../PopupMenu/PopupMenu.svelte');
		renderInTheme(PopupMenu, {
			open: true,
			size: 'normal',
			trigger: { content: 'File' },
			menu: { items, submenuMode: 'popover' }
		});
		await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1));
		const { parent, submenu } = await openSubmenu();
		// The popover panel is the nearest padded ancestor: its `p-*` is what caps the rows'
		// `rounded-md-concentric`, so equal padding is equal nesting.
		const panelOf = (menu: HTMLElement) =>
			menu.closest('[class~="p-xs"], [class~="p-md"]') as HTMLElement | null;
		const parentPanel = panelOf(parent);
		const submenuPanel = panelOf(submenu);
		expect(parentPanel).not.toBeNull();
		expect(submenuPanel).not.toBeNull();
		expect(submenuPanel).not.toBe(parentPanel);
		const nesting = (panel: HTMLElement) =>
			panel.className.split(' ').filter((token) => /^p-/.test(token));
		expect(nesting(submenuPanel!)).toEqual(nesting(parentPanel!));
		expect(nesting(parentPanel!)).toContain('p-md');
	});
});
