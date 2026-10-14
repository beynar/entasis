// Checkbox items, radio groups and labelled groups, the per-item `closeOnClick`, the header and
// footer slots that sit outside the `role="menu"` element, and the row keys that keep a row's
// node through insertions and removals.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import PopupMenu from '../PopupMenu/PopupMenu.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import Menu from './Menu.svelte';
import type { MenuItem } from './menu.props.js';
import { createMenuKeys, menuItemKeys } from './menuTree.js';

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

describe('menu checkbox items', () => {
	test('a11y:menu.checkable-items a checkbox row is a menuitemcheckbox that toggles aria-checked once per press', async () => {
		const onValueChange = vi.fn();
		renderInTheme(Menu, {
			items: [{ type: 'checkbox', title: 'Word wrap', onValueChange }] satisfies MenuItem[]
		});
		const row = screen.getByRole('menuitemcheckbox', { name: 'Word wrap' });
		expect(row).toHaveAttribute('aria-checked', 'false');

		await fireEvent.click(row);
		expect(row).toHaveAttribute('aria-checked', 'true');
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenLastCalledWith(true);

		await fireEvent.click(row);
		expect(row).toHaveAttribute('aria-checked', 'false');
		expect(onValueChange).toHaveBeenCalledTimes(2);
		expect(onValueChange).toHaveBeenLastCalledWith(false);
	});

	test('defaultValue starts a row checked', () => {
		renderInTheme(Menu, {
			items: [{ type: 'checkbox', title: 'Minimap', defaultValue: true }] satisfies MenuItem[]
		});
		expect(screen.getByRole('menuitemcheckbox', { name: 'Minimap' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
	});

	test('a controlled row only changes when its value does', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(Menu, {
			items: [
				{ type: 'checkbox', title: 'Ruler', value: false, onValueChange }
			] satisfies MenuItem[]
		});
		const row = screen.getByRole('menuitemcheckbox', { name: 'Ruler' });
		await fireEvent.click(row);
		expect(onValueChange).toHaveBeenCalledWith(true);
		expect(row).toHaveAttribute('aria-checked', 'false');

		await rerender({
			items: [{ type: 'checkbox', title: 'Ruler', value: true, onValueChange }] satisfies MenuItem[]
		});
		expect(screen.getByRole('menuitemcheckbox', { name: 'Ruler' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
	});

	test('preventDefault in the consumer onclick refuses the toggle', async () => {
		const onValueChange = vi.fn();
		renderInTheme(Menu, {
			items: [
				{
					type: 'checkbox',
					title: 'Locked',
					onclick: (event: MouseEvent) => event.preventDefault(),
					onValueChange
				}
			] satisfies MenuItem[]
		});
		const row = screen.getByRole('menuitemcheckbox', { name: 'Locked' });
		await fireEvent.click(row);
		expect(row).toHaveAttribute('aria-checked', 'false');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('the check indicator stays mounted when the row is unchecked, so its exit can play', async () => {
		renderInTheme(Menu, {
			items: [{ type: 'checkbox', title: 'Grid', defaultValue: true }] satisfies MenuItem[]
		});
		const row = screen.getByRole('menuitemcheckbox', { name: 'Grid' });
		const indicator = () => row.querySelector<HTMLElement>('[data-checked]');
		expect(indicator()).toHaveAttribute('data-checked', 'true');
		const node = indicator();

		await fireEvent.click(row);
		expect(indicator()).toBe(node);
		expect(indicator()).toHaveAttribute('data-checked', 'false');
	});

	test('a disabled checkbox row does not toggle', async () => {
		const onValueChange = vi.fn();
		renderInTheme(Menu, {
			items: [
				{ type: 'checkbox', title: 'Off', disabled: true, onValueChange }
			] satisfies MenuItem[]
		});
		await fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Off' }));
		expect(onValueChange).not.toHaveBeenCalled();
	});
});

describe('menu radio groups', () => {
	const radios = (props: Record<string, unknown> = {}): MenuItem[] => [
		{
			type: 'radio-group',
			label: 'Sort by',
			defaultValue: 'name',
			items: [
				{ value: 'name', title: 'Name' },
				{ value: 'date', title: 'Date' }
			],
			...props
		}
	];

	test('a radio group is a labelled group of menuitemradio rows', () => {
		renderInTheme(Menu, { items: radios() });
		const group = screen.getByRole('group', { name: 'Sort by' });
		const rows = within(group).getAllByRole('menuitemradio');
		expect(rows.map((row) => row.getAttribute('aria-checked'))).toEqual(['true', 'false']);
		// The label is read as the group's name, not as a separate node of the tree.
		expect(screen.getByText('Sort by')).toHaveAttribute('aria-hidden', 'true');
	});

	test('choosing a radio moves the check and reports the value once', async () => {
		const onValueChange = vi.fn();
		renderInTheme(Menu, { items: radios({ onValueChange }) });
		const date = screen.getByRole('menuitemradio', { name: 'Date' });

		await fireEvent.click(date);
		expect(date).toHaveAttribute('aria-checked', 'true');
		expect(screen.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute(
			'aria-checked',
			'false'
		);
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith('date');

		// The checked radio again: nothing changes.
		await fireEvent.click(date);
		expect(onValueChange).toHaveBeenCalledTimes(1);
	});

	test('a controlled group follows its value', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(Menu, { items: radios({ value: 'name', onValueChange }) });
		await fireEvent.click(screen.getByRole('menuitemradio', { name: 'Date' }));
		expect(onValueChange).toHaveBeenCalledWith('date');
		expect(screen.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute(
			'aria-checked',
			'true'
		);

		await rerender({ items: radios({ value: 'date', onValueChange }) });
		expect(screen.getByRole('menuitemradio', { name: 'Date' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
	});

	test('a disabled group refuses every radio', async () => {
		const onValueChange = vi.fn();
		renderInTheme(Menu, { items: radios({ disabled: true, onValueChange }) });
		await fireEvent.click(screen.getByRole('menuitemradio', { name: 'Date' }));
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('the old selected option still reads as a menuitemradio', () => {
		renderInTheme(Menu, {
			items: [{ type: 'option', title: 'Light', selected: true }] satisfies MenuItem[]
		});
		expect(screen.getByRole('menuitemradio', { name: 'Light' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
	});
});

describe('menu groups', () => {
	const items: MenuItem[] = [
		{ type: 'option', title: 'New' },
		{
			type: 'group',
			label: 'Recent',
			items: [
				{ type: 'option', title: 'notes.md' },
				{ type: 'option', title: 'todo.md' }
			]
		},
		{ type: 'option', title: 'Quit' }
	];

	test('a group is a role="group" named by its hidden label', () => {
		renderInTheme(Menu, { items });
		const group = screen.getByRole('group', { name: 'Recent' });
		expect(within(group).getAllByRole('menuitem')).toHaveLength(2);
		expect(screen.getByText('Recent')).toHaveAttribute('aria-hidden', 'true');
	});

	test('arrow keys and type-ahead cross group boundaries', async () => {
		renderInTheme(Menu, { items });
		const first = screen.getByRole('menuitem', { name: 'New' });
		first.focus();
		await fireEvent.focusIn(first);
		await fireEvent.keyDown(first, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'notes.md' }));
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Quit' }));
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(first);
	});
});

describe('closeOnClick', () => {
	const open = async (items: MenuItem[], props: Record<string, unknown> = {}) => {
		renderInTheme(PopupMenu, {
			trigger: { content: 'Edit' },
			menu: { items },
			...props
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
		await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1));
	};

	test('a checkbox keeps the menu open by default', async () => {
		await open([{ type: 'checkbox', title: 'Word wrap' }]);
		await fireEvent.click(screen.getByRole('menuitemcheckbox'));
		await settle();
		expect(screen.queryAllByRole('menu')).toHaveLength(1);
	});

	test('closeOnClick: true on a checkbox closes the menu', async () => {
		await open([{ type: 'checkbox', title: 'Word wrap', closeOnClick: true }]);
		await fireEvent.click(screen.getByRole('menuitemcheckbox'));
		await waitFor(() => expect(screen.queryAllByRole('menu')).toHaveLength(0));
	});

	test('a radio group keeps the menu open, and closeOnClick: true closes it', async () => {
		await open([
			{
				type: 'radio-group',
				items: [
					{ value: 'a', title: 'A' },
					{ value: 'b', title: 'B', closeOnClick: true }
				]
			}
		]);
		await fireEvent.click(screen.getByRole('menuitemradio', { name: 'A' }));
		await settle();
		expect(screen.queryAllByRole('menu')).toHaveLength(1);
		await fireEvent.click(screen.getByRole('menuitemradio', { name: 'B' }));
		await waitFor(() => expect(screen.queryAllByRole('menu')).toHaveLength(0));
	});

	test('closeOnClick: false keeps the menu open for an option and a button', async () => {
		const onclick = vi.fn();
		await open([
			{ type: 'option', title: 'Zoom in', closeOnClick: false, onclick },
			{ type: 'button', children: 'Zoom out', closeOnClick: false }
		]);
		await fireEvent.click(screen.getByRole('menuitem', { name: 'Zoom in' }));
		await fireEvent.click(screen.getByRole('menuitem', { name: 'Zoom out' }));
		await settle();
		expect(onclick).toHaveBeenCalledTimes(1);
		expect(screen.queryAllByRole('menu')).toHaveLength(1);
	});
});

describe('header and footer', () => {
	test('a11y:menu.chrome-outside-role header and footer sit outside the role="menu" element', () => {
		const header = createRawSnippet(() => ({
			render: () => '<input aria-label="Filter" />'
		}));
		const footer = createRawSnippet(() => ({
			render: () => '<a href="/help">Help</a>'
		}));
		renderInTheme(Menu, { items: [{ type: 'option', title: 'Open' }], header, footer });
		const menu = screen.getByRole('menu');
		expect(menu).not.toContainElement(screen.getByRole('link', { name: 'Help' }));
		expect(menu).not.toContainElement(screen.getByRole('textbox', { name: 'Filter' }));
		expect(menu).toContainElement(screen.getByRole('menuitem', { name: 'Open' }));
	});
});

describe('row identity', () => {
	test('keys follow the row text, repeat with a counter and fall back to the position', () => {
		const keys = menuItemKeys([
			{ type: 'option', title: 'Copy' },
			{ type: 'option', title: 'Copy' },
			{ type: 'option', title: 'Paste', key: 'p' },
			{ type: 'option', title: createRawSnippet(() => ({ render: () => '<b>x</b>' })) },
			{ type: 'separator' }
		]);
		expect(keys).toEqual(['option:Copy', 'option:Copy~1', 'k:p', 'option:@3', 'separator:@4']);
	});

	test('a11y:menu.row-identity a row keeps its node when an item before it is removed', async () => {
		const items = ['Archive', 'Copy', 'Cut', 'Delete'].map((title): MenuItem => ({
			type: 'option',
			title
		}));
		const { rerender } = renderInTheme(Menu, { items });
		const cut = screen.getByRole('menuitem', { name: 'Cut' });
		cut.focus();
		await fireEvent.focusIn(cut);

		await rerender({
			items: items.filter((item) => item.type === 'option' && item.title !== 'Copy')
		});
		await settle();
		expect(screen.getByRole('menuitem', { name: 'Cut' })).toBe(cut);
		expect(document.activeElement).toBe(cut);
	});

	test('a11y:menu.row-identity a row that changes its own text keeps its node and focus', async () => {
		const build = (muted: boolean): MenuItem[] => [
			{ type: 'option', title: muted ? 'Unmute' : 'Mute', closeOnClick: false },
			{ type: 'option', title: 'Copy' }
		];
		const { rerender } = renderInTheme(Menu, { items: build(false) });
		const mute = screen.getByRole('menuitem', { name: 'Mute' });
		mute.focus();

		await rerender({ items: build(true) });
		await settle();
		const unmute = screen.getByRole('menuitem', { name: 'Unmute' });
		expect(unmute).toBe(mute);
		expect(document.activeElement).toBe(unmute);
	});

	test('keys handed to a renamed row stay unique', () => {
		const keys = createMenuKeys();
		const row = (title: string): MenuItem => ({ type: 'option', title });
		expect(keys([row('Mute'), row('Copy')])).toEqual(['option:Mute', 'option:Copy']);
		// Mute is renamed: the new row takes its key, and a later row that is called Mute again is fresh.
		expect(keys([row('Unmute'), row('Copy')])).toEqual(['option:Mute', 'option:Copy']);
		const next = keys([row('Unmute'), row('Mute'), row('Copy')]);
		expect(new Set(next).size).toBe(3);
		expect(next[0]).toBe('option:Mute');
	});

	test('rows rebuilt as new objects still keep their node', async () => {
		const build = (titles: string[]): MenuItem[] =>
			titles.map((title) => ({ type: 'option', title }));
		const { rerender } = renderInTheme(Menu, { items: build(['Archive', 'Copy', 'Cut']) });
		const cut = screen.getByRole('menuitem', { name: 'Cut' });
		await rerender({ items: build(['Archive', 'Cut']) });
		expect(screen.getByRole('menuitem', { name: 'Cut' })).toBe(cut);
	});
});

describe('right-to-left icons', () => {
	const mirrored = (row: Element) =>
		row.querySelector('span.inline-flex[class*="rtl:-scale-x-100"]');

	test('the submenu caret and the stacked back arrow flip with the reading direction', async () => {
		renderInTheme(Menu, {
			submenuMode: 'stack',
			items: [
				{
					type: 'submenu',
					title: 'More',
					menu: [{ type: 'option', title: 'Inner' }]
				}
			] satisfies MenuItem[]
		});
		const more = screen.getByRole('menuitem', { name: 'More' });
		expect(mirrored(more)).not.toBeNull();

		await fireEvent.click(more);
		const back = await screen.findByRole('menuitem', { name: /Back/ });
		expect(mirrored(back)).not.toBeNull();
	});
});
