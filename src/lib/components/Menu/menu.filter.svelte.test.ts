// Filterable menus: a search field above the rows, focus that stays in the field while the arrow
// keys highlight rows, Enter on the highlighted row, groups that empty out, submenu filters and
// the highlight callback.
import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import PopupMenu from '../PopupMenu/PopupMenu.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import Menu from './Menu.svelte';
import type { MenuItem } from './menu.props.js';
import { filterMenuItems } from './menuTree.js';

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

const items = (props: { onClick?: () => void } = {}): MenuItem[] => [
	{ type: 'option', title: 'Open', onclick: props.onClick },
	{ type: 'option', title: 'Open recent' },
	{ type: 'separator' },
	{
		type: 'group',
		label: 'Export',
		items: [
			{ type: 'option', title: 'PDF' },
			{ type: 'option', title: 'Café menu' }
		]
	},
	{ type: 'option', title: 'Quit', disabled: true }
];

const field = () => screen.getByRole('textbox', { name: 'Search' }) as HTMLInputElement;
const rows = () => screen.queryAllByRole('menuitem').map((row) => row.textContent?.trim());
const type = async (text: string) => {
	field().value = text;
	await fireEvent.input(field());
	await settle();
};
const key = (name: string, init: KeyboardEventInit = {}) =>
	fireEvent.keyDown(field(), { key: name, ...init });

describe('filtering', () => {
	test('a menu without filter has no search field', () => {
		renderInTheme(Menu, { items: items() });
		expect(screen.queryByRole('textbox')).toBeNull();
	});

	test('the search field sits outside the role="menu" element', () => {
		renderInTheme(Menu, { items: items(), filter: true });
		expect(screen.getByRole('menu')).not.toContainElement(field());
	});

	test('typing hides the rows that do not match, separators included', async () => {
		renderInTheme(Menu, { items: items(), filter: true });
		expect(rows()).toHaveLength(5);

		await type('open');
		expect(rows()).toEqual(['Open', 'Open recent']);
		expect(screen.queryByRole('separator')).toBeNull();
	});

	test('matching ignores case and accents', async () => {
		renderInTheme(Menu, { items: items(), filter: true });
		await type('CAFE');
		expect(rows()).toEqual(['Café menu']);
	});

	test('a group stays while one of its rows matches and goes when none does', async () => {
		renderInTheme(Menu, { items: items(), filter: true });
		await type('pdf');
		expect(screen.getByRole('group', { name: 'Export' })).toBeInTheDocument();
		expect(rows()).toEqual(['PDF']);

		await type('open');
		expect(screen.queryByRole('group')).toBeNull();
	});

	test('a group whose label matches keeps all of its rows', async () => {
		renderInTheme(Menu, { items: items(), filter: true });
		await type('export');
		expect(rows()).toEqual(['PDF', 'Café menu']);
	});

	test('a custom match decides which rows stay', async () => {
		renderInTheme(Menu, {
			items: items(),
			filter: { match: (row: { text: string }, search: string) => row.text.startsWith(search) }
		});
		await type('Open r');
		expect(rows()).toEqual(['Open recent']);
	});

	test('no match shows the empty message outside the menu, which can be replaced', async () => {
		const { unmount } = renderInTheme(Menu, { items: items(), filter: true });
		await type('zzz');
		expect(rows()).toEqual([]);
		const status = screen.getByRole('status');
		expect(status).toHaveTextContent('No results found.');
		expect(screen.getByRole('menu')).not.toContainElement(status);
		unmount();

		const empty = createRawSnippet(() => ({ render: () => '<span>Nothing here</span>' }));
		renderInTheme(Menu, { items: items(), filter: true, empty });
		await type('zzz');
		expect(screen.getByRole('status')).toHaveTextContent('Nothing here');
	});

	test('the placeholder and the label of the field are configurable', () => {
		renderInTheme(Menu, {
			items: items(),
			filter: { placeholder: 'Find an action', label: 'Find' }
		});
		const input = screen.getByRole('textbox', { name: 'Find' });
		expect(input).toHaveAttribute('placeholder', 'Find an action');
	});

	test('filterMenuItems leaves rows alone for an empty search', () => {
		expect(filterMenuItems(items(), '  ', undefined)).toHaveLength(5);
	});
});

describe('search state', () => {
	test('defaultSearch starts the field filled and filtered', () => {
		renderInTheme(Menu, { items: items(), filter: true, defaultSearch: 'pdf' });
		expect(field().value).toBe('pdf');
		expect(rows()).toEqual(['PDF']);
	});

	test('onSearchChange fires once per edit', async () => {
		const onSearchChange = vi.fn();
		renderInTheme(Menu, { items: items(), filter: true, onSearchChange });
		await type('o');
		await type('op');
		expect(onSearchChange.mock.calls).toEqual([['o'], ['op']]);
	});

	test('a search the parent passes follows the parent when it changes it', async () => {
		const onSearchChange = vi.fn();
		const { rerender } = renderInTheme(Menu, {
			items: items(),
			filter: true,
			search: '',
			onSearchChange
		});
		await type('pdf');
		expect(onSearchChange).toHaveBeenCalledWith('pdf');

		await rerender({ items: items(), filter: true, search: 'pdf', onSearchChange });
		expect(rows()).toEqual(['PDF']);
	});
});

describe('keyboard', () => {
	test('a11y:menu.filter-focus ArrowDown highlights the first row, names it as the active descendant and keeps focus in the field', async () => {
		renderInTheme(Menu, { items: items(), filter: true });
		field().focus();
		await key('ArrowDown');

		const open = screen.getByRole('menuitem', { name: 'Open' });
		expect(open).toHaveAttribute('data-highlighted', 'true');
		expect(field()).toHaveAttribute('aria-activedescendant', open.id);
		expect(document.activeElement).toBe(field());

		await key('ArrowDown');
		expect(screen.getByRole('menuitem', { name: 'Open recent' })).toHaveAttribute(
			'data-highlighted',
			'true'
		);
	});

	test('ArrowUp from the field enters at the last row that can be highlighted', async () => {
		renderInTheme(Menu, { items: items(), filter: true });
		field().focus();
		await key('ArrowUp');
		// "Quit" is disabled, so the highlight stops on the row before it.
		expect(screen.getByRole('menuitem', { name: 'Café menu' })).toHaveAttribute(
			'data-highlighted',
			'true'
		);
	});

	test('the arrows wrap around the rows', async () => {
		renderInTheme(Menu, {
			items: [
				{ type: 'option', title: 'A' },
				{ type: 'option', title: 'B' }
			] satisfies MenuItem[],
			filter: true
		});
		field().focus();
		await key('ArrowDown');
		await key('ArrowDown');
		await key('ArrowDown');
		expect(screen.getByRole('menuitem', { name: 'A' })).toHaveAttribute('data-highlighted', 'true');
	});

	test('Enter presses the highlighted row', async () => {
		const onClick = vi.fn();
		renderInTheme(Menu, { items: items({ onClick }), filter: true });
		field().focus();
		await key('ArrowDown');
		await key('Enter');
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	test('Enter with nothing highlighted does nothing', async () => {
		const onClick = vi.fn();
		renderInTheme(Menu, { items: items({ onClick }), filter: true });
		field().focus();
		await key('Enter');
		expect(onClick).not.toHaveBeenCalled();
	});

	test('typing highlights the first match, so Enter presses it', async () => {
		const onClick = vi.fn();
		renderInTheme(Menu, { items: items({ onClick }), filter: true });
		field().focus();
		await type('op');
		expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveAttribute(
			'data-highlighted',
			'true'
		);
		await key('Enter');
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	test('emptying the field clears the highlight', async () => {
		renderInTheme(Menu, { items: items(), filter: true });
		field().focus();
		await type('op');
		await type('');
		expect(screen.getByRole('menu').querySelector('[data-highlighted="true"]')).toBeNull();
		expect(field()).not.toHaveAttribute('aria-activedescendant');
	});

	test('rows are out of the tab order and keys do not reach type-ahead', async () => {
		renderInTheme(Menu, { items: items(), filter: true });
		for (const row of screen.getAllByRole('menuitem'))
			expect(row).toHaveAttribute('tabindex', '-1');
		field().focus();
		await key('q');
		expect(document.activeElement).toBe(field());
	});

	test('a press on a row keeps focus in the field', async () => {
		renderInTheme(Menu, { items: items(), filter: true });
		field().focus();
		const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
		screen.getByRole('menuitem', { name: 'Open' }).dispatchEvent(down);
		expect(down.defaultPrevented).toBe(true);
	});
});

describe('highlight callback', () => {
	test('reports the value of the highlighted row and undefined when none is', async () => {
		const onHighlightChange = vi.fn();
		renderInTheme(Menu, {
			items: [
				{ type: 'option', title: 'Open', value: 'file.open' },
				{ type: 'option', title: 'Close' }
			] satisfies MenuItem[],
			filter: true,
			onHighlightChange
		});
		onHighlightChange.mockClear();
		field().focus();
		await key('ArrowDown');
		await waitFor(() => expect(onHighlightChange).toHaveBeenLastCalledWith('file.open'));
		await key('ArrowDown');
		await waitFor(() => expect(onHighlightChange).toHaveBeenLastCalledWith('Close'));
		await type('zzz');
		await waitFor(() => expect(onHighlightChange).toHaveBeenLastCalledWith(undefined));
	});

	test('works without a filter, for the pointer', async () => {
		const onHighlightChange = vi.fn();
		renderInTheme(Menu, {
			items: [{ type: 'option', title: 'Open', value: 'file.open' }] satisfies MenuItem[],
			onHighlightChange
		});
		onHighlightChange.mockClear();
		await fireEvent.pointerEnter(screen.getByRole('menuitem', { name: 'Open' }));
		await waitFor(() => expect(onHighlightChange).toHaveBeenLastCalledWith('file.open'));
	});
});

describe('submenu filters', () => {
	const tree = (): MenuItem[] => [
		{ type: 'option', title: 'Rename' },
		{
			type: 'submenu',
			title: 'Move to',
			filter: { placeholder: 'Pick a folder' },
			menu: [
				{ type: 'option', title: 'Inbox' },
				{ type: 'option', title: 'Archive' },
				{ type: 'option', title: 'Projects' }
			]
		}
	];

	test('a submenu with a filter opens on its search field', async () => {
		renderInTheme(PopupMenu, {
			trigger: { content: 'Actions' },
			menu: { items: tree() },
			transition: { in: { duration: 0 }, out: { duration: 0 } }
		});
		const trigger = screen.getByRole('button', { name: 'Actions' });
		trigger.focus();
		await fireEvent.click(trigger, { detail: 0 });
		await waitFor(() => expect(screen.queryAllByRole('menu')).toHaveLength(1));
		const move = screen.getByRole('menuitem', { name: 'Move to' });
		move.focus();
		await fireEvent.keyDown(move, { key: 'ArrowRight' });

		const search = await screen.findByPlaceholderText('Pick a folder');
		await waitFor(() => expect(document.activeElement).toBe(search));

		search.focus();
		(search as HTMLInputElement).value = 'arch';
		await fireEvent.input(search);
		await settle();
		const submenu = screen.getAllByRole('menu')[1];
		expect(
			within(submenu)
				.getAllByRole('menuitem')
				.map((row) => row.textContent?.trim())
		).toEqual(['Archive']);

		// Enter chooses the match and closes the whole tree.
		await fireEvent.keyDown(search, { key: 'Enter' });
		await waitFor(() => expect(screen.queryAllByRole('menu')).toHaveLength(0));
	});

	test('ArrowLeft at the start of the field leaves the submenu', async () => {
		renderInTheme(PopupMenu, {
			trigger: { content: 'Actions' },
			menu: { items: tree() },
			transition: { in: { duration: 0 }, out: { duration: 0 } }
		});
		const trigger = screen.getByRole('button', { name: 'Actions' });
		trigger.focus();
		await fireEvent.click(trigger, { detail: 0 });
		await waitFor(() => expect(screen.queryAllByRole('menu')).toHaveLength(1));
		const move = screen.getByRole('menuitem', { name: 'Move to' });
		move.focus();
		await fireEvent.keyDown(move, { key: 'ArrowRight' });
		const search = await screen.findByPlaceholderText('Pick a folder');
		await waitFor(() => expect(document.activeElement).toBe(search));

		await fireEvent.keyDown(search, { key: 'ArrowLeft' });
		await waitFor(() => expect(screen.queryAllByRole('menu')).toHaveLength(1));
		expect(document.activeElement).toBe(move);
	});
});

describe('stacked menus (mobile sheet)', () => {
	const stacked = (props: Record<string, unknown> = {}) =>
		renderInTheme(Menu, {
			submenuMode: 'stack',
			items: [
				{ type: 'option', title: 'Rename' },
				{ type: 'option', title: 'Delete' },
				{
					type: 'submenu',
					title: 'Move to',
					filter: { placeholder: 'Pick a folder' },
					menu: [
						{ type: 'option', title: 'Inbox' },
						{ type: 'option', title: 'Archive' }
					]
				}
			] satisfies MenuItem[],
			...props
		});

	test('the root level filters and a submenu level has a field of its own', async () => {
		stacked({ filter: true });
		await type('re');
		expect(rows()).toEqual(['Rename']);
		await type('');

		await fireEvent.click(screen.getByRole('menuitem', { name: 'Move to' }));
		const search = await screen.findByPlaceholderText('Pick a folder');
		await waitFor(() => expect(document.activeElement).toBe(search));

		(search as HTMLInputElement).value = 'arch';
		await fireEvent.input(search);
		await settle();
		const visible = screen
			.getAllByRole('menuitem')
			.map((row) => row.textContent?.trim())
			.filter((text) => text === 'Inbox' || text === 'Archive');
		expect(visible).toEqual(['Archive']);
	});

	test('a submenu level with no filter of its own shows no field', async () => {
		stacked({
			items: [
				{
					type: 'submenu',
					title: 'More',
					menu: [{ type: 'option', title: 'Inner' }]
				}
			] satisfies MenuItem[]
		});
		await fireEvent.click(screen.getByRole('menuitem', { name: 'More' }));
		await screen.findByRole('menuitem', { name: 'Inner' });
		expect(screen.queryByRole('textbox')).toBeNull();
	});
});
