// Keys that belong elsewhere stay there: a Menu under the pointer must not take keys typed in
// another field (MN-2), and Alt/Ctrl/Meta + a navigation key is a browser shortcut, never a move
// (CC-INFRA-2a).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { flushSync, tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import CalendarMonthYearPicker from '../components/Form/Calendar/CalendarMonthYearPicker.svelte';
import { renderInTheme } from '../components/Theme/renderInTheme.test-helper.js';
import NavigationKeysHarness from './NavigationKeysHarness.test.svelte';
import { useKeyDown } from './useKeyDown.svelte.js';

const menuItems = (onProfile = vi.fn(), onSettings = vi.fn()) => [
	{ type: 'option' as const, title: 'Profile', onclick: onProfile },
	{ type: 'option' as const, title: 'Settings', onclick: onSettings },
	{ type: 'option' as const, title: 'Billing' }
];

const mountMenu = (items = menuItems()) => {
	render(NavigationKeysHarness, { props: { scenario: 'menu', items } });
	const menu = screen.getByRole('menu');
	return {
		menu,
		rows: within(menu).getAllByRole('menuitem'),
		input: screen.getByRole('textbox', { name: 'Search' })
	};
};

/** Rest the pointer on the menu, optionally over one row (pointerenter does not bubble). */
const hover = async (menu: HTMLElement, row?: HTMLElement) => {
	await fireEvent.pointerEnter(menu);
	if (row) await fireEvent.pointerEnter(row);
};

/** Let a popup mount and run its `focusOnMount` (it focuses after a tick). */
const settle = async () => {
	await new Promise((resolve) => setTimeout(resolve, 20));
	await tick();
};

/** Open the harness PopupMenu with a click; its panel then has focus (`focusOnMount: 'container'`). */
const openPopup = async (items = menuItems()) => {
	render(NavigationKeysHarness, { props: { scenario: 'popup', items } });
	await fireEvent.click(screen.getByRole('button', { name: 'Open' }));
	const menu = await waitFor(() => screen.getByRole('menu'));
	await settle();
	return { menu, rows: within(menu).getAllByRole('menuitem') };
};

/** Open a MenuBar menu from the keyboard; focus lands on its first row. */
const openMenuBarMenu = async (label: string) => {
	render(NavigationKeysHarness, { props: { scenario: 'menubar' } });
	const trigger = screen.getByRole('menuitem', { name: label });
	trigger.focus();
	await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
	await settle();
	return document.activeElement as HTMLElement;
};

const expandedTriggers = () =>
	screen
		.getAllByRole('menuitem')
		.filter((node) => node.getAttribute('aria-expanded') === 'true')
		.map((node) => node.textContent?.trim());

afterEach(() => {
	(document.activeElement as HTMLElement | null)?.blur?.();
});

describe('hovered menu and keys typed elsewhere (MN-2)', () => {
	test('Space and Enter in another field are not taken and do not click the hovered row', async () => {
		const onProfile = vi.fn();
		const { menu, rows, input } = mountMenu(menuItems(onProfile));
		await hover(menu, rows[0]);
		expect(rows[0]).toHaveAttribute('data-highlighted', 'true');

		input.focus();
		expect(await fireEvent.keyDown(input, { key: ' ' })).toBe(true);
		expect(await fireEvent.keyDown(input, { key: 'Enter' })).toBe(true);

		expect(onProfile).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(input);
	});

	test('arrows, Home and End in another field keep focus there', async () => {
		const { menu, rows, input } = mountMenu();
		await hover(menu, rows[0]);

		input.focus();
		for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
			expect(await fireEvent.keyDown(input, { key })).toBe(true);
			expect(document.activeElement).toBe(input);
		}
	});

	test('a focused button elsewhere keeps its keys too', async () => {
		const { menu, rows } = mountMenu();
		const outside = document.createElement('button');
		document.body.append(outside);
		try {
			await hover(menu, rows[1]);
			outside.focus();
			expect(await fireEvent.keyDown(outside, { key: 'ArrowDown' })).toBe(true);
			expect(document.activeElement).toBe(outside);
		} finally {
			outside.remove();
		}
	});

	test('with nothing focused, ArrowDown moves on from the hovered row', async () => {
		const { menu, rows } = mountMenu();
		await hover(menu, rows[0]);
		expect(document.activeElement).toBe(document.body);

		expect(await fireEvent.keyDown(document.body, { key: 'ArrowDown' })).toBe(false);
		expect(document.activeElement).toBe(rows[1]);
	});

	test('with nothing focused and no row under the pointer, arrows enter at the matching edge', async () => {
		const { menu, rows } = mountMenu();
		await hover(menu);
		await fireEvent.keyDown(document.body, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(rows[0]);

		(document.activeElement as HTMLElement).blur();
		await fireEvent.pointerLeave(menu);
		await hover(menu);
		await fireEvent.keyDown(document.body, { key: 'ArrowUp' });
		expect(document.activeElement).toBe(rows[2]);
	});

	test('with nothing focused and no row under the pointer, Home and End enter at the first and last rows', async () => {
		const { menu, rows } = mountMenu();
		await hover(menu);
		expect(await fireEvent.keyDown(document.body, { key: 'End' })).toBe(false);
		expect(document.activeElement).toBe(rows[2]);

		(document.activeElement as HTMLElement).blur();
		await fireEvent.pointerLeave(menu);
		await hover(menu);
		expect(await fireEvent.keyDown(document.body, { key: 'Home' })).toBe(false);
		expect(document.activeElement).toBe(rows[0]);
	});

	test('with nothing focused, ArrowLeft on a root row with no level to leave is not taken', async () => {
		const { menu, rows } = mountMenu();
		await hover(menu, rows[0]);

		expect(await fireEvent.keyDown(document.body, { key: 'ArrowLeft' })).toBe(true);
		expect(await fireEvent.keyDown(document.body, { key: 'ArrowRight' })).toBe(true);
		expect(document.activeElement).toBe(document.body);
	});

	test('with nothing focused, Enter and Space never click the row under the pointer', async () => {
		const onProfile = vi.fn();
		const { menu, rows } = mountMenu(menuItems(onProfile));
		await hover(menu, rows[0]);

		expect(await fireEvent.keyDown(document.body, { key: 'Enter' })).toBe(true);
		expect(await fireEvent.keyDown(document.body, { key: ' ' })).toBe(true);
		expect(onProfile).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(document.body);
	});

	test('a key another handler already took is left alone', async () => {
		const { menu, rows } = mountMenu();
		await hover(menu, rows[0]);
		const claim = (event: KeyboardEvent) => event.preventDefault();
		document.body.addEventListener('keydown', claim);
		try {
			await fireEvent.keyDown(document.body, { key: 'ArrowDown' });
			expect(document.activeElement).toBe(document.body);
		} finally {
			document.body.removeEventListener('keydown', claim);
		}
	});

	test('once focus is inside, Enter still activates the focused row', async () => {
		const onSettings = vi.fn();
		const { menu, rows } = mountMenu(menuItems(vi.fn(), onSettings));
		await hover(menu, rows[0]);
		await fireEvent.keyDown(document.body, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(rows[1]);

		expect(await fireEvent.keyDown(rows[1], { key: 'Enter' })).toBe(false);
		expect(onSettings).toHaveBeenCalledOnce();
	});
});

describe('keys act on the focused row, not on the row under the pointer (MN-2)', () => {
	test('Enter and Space activate the focused row while the pointer rests on another', async () => {
		const onProfile = vi.fn();
		const onSettings = vi.fn();
		const { menu, rows } = mountMenu(menuItems(onProfile, onSettings));
		rows[0].focus();
		await hover(menu, rows[1]);
		expect(rows[1]).toHaveAttribute('data-highlighted', 'true');

		await fireEvent.keyDown(rows[0], { key: 'Enter' });
		await fireEvent.keyDown(rows[0], { key: ' ' });
		expect(onSettings).not.toHaveBeenCalled();
		expect(onProfile).toHaveBeenCalledTimes(2);
		expect(rows[0]).toHaveAttribute('data-highlighted', 'true');
	});

	test('arrows move on from the focused row while the pointer rests on another', async () => {
		const { menu, rows } = mountMenu();
		rows[0].focus();
		await hover(menu, rows[2]);

		await fireEvent.keyDown(rows[0], { key: 'ArrowDown' });
		expect(document.activeElement).toBe(rows[1]);
	});

	test('type-ahead searches on from the focused row while the pointer rests on another', async () => {
		const { menu, rows } = mountMenu([
			{ type: 'option', title: 'Save' },
			{ type: 'option', title: 'Share' },
			{ type: 'option', title: 'Settings' }
		]);
		rows[0].focus();
		await hover(menu, rows[2]);

		await fireEvent.keyDown(rows[0], { key: 's' });
		expect(document.activeElement).toBe(rows[1]);
	});

	test('Enter still activates the focused row after the pointer has left the menu', async () => {
		const onProfile = vi.fn();
		const { menu, rows } = mountMenu(menuItems(onProfile));
		rows[0].focus();
		await hover(menu, rows[1]);
		await fireEvent.pointerLeave(menu);

		await fireEvent.keyDown(rows[0], { key: 'Enter' });
		expect(onProfile).toHaveBeenCalledOnce();
	});

	test('in a popup menu whose panel has focus, Enter activates the highlighted row', async () => {
		const onSettings = vi.fn();
		const { menu, rows } = await openPopup(menuItems(vi.fn(), onSettings));
		expect(document.activeElement).toBe(menu);
		await hover(menu, rows[1]);
		expect(menu).toHaveAttribute('aria-activedescendant', rows[1].id);

		await fireEvent.keyDown(menu, { key: 'Enter' });
		expect(onSettings).toHaveBeenCalledOnce();
	});

	test('Escape on a focused row is left for the popup, which closes', async () => {
		const { menu, rows } = await openPopup();
		await fireEvent.keyDown(menu, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(rows[0]);

		expect(await fireEvent.keyDown(rows[0], { key: 'Escape' })).toBe(false);
		await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
	});
});

describe('modified navigation keys (CC-INFRA-2a)', () => {
	test.each(['altKey', 'ctrlKey', 'metaKey'] as const)(
		'SegmentedControl ignores %s + ArrowRight and leaves it to the browser',
		async (modifier) => {
			const onValueChange = vi.fn();
			render(NavigationKeysHarness, { props: { scenario: 'segmented', onValueChange } });
			const list = screen.getByRole('radio', { name: 'List' });
			list.focus();

			expect(await fireEvent.keyDown(list, { key: 'ArrowRight', [modifier]: true })).toBe(true);
			expect(document.activeElement).toBe(list);
			expect(onValueChange).not.toHaveBeenCalled();
			expect(list).toHaveAttribute('aria-checked', 'true');
		}
	);

	test('Shift + ArrowRight still moves and selects in SegmentedControl', async () => {
		const onValueChange = vi.fn();
		render(NavigationKeysHarness, { props: { scenario: 'segmented', onValueChange } });
		const list = screen.getByRole('radio', { name: 'List' });
		list.focus();

		expect(await fireEvent.keyDown(list, { key: 'ArrowRight', shiftKey: true })).toBe(false);
		expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Grid' }));
		expect(onValueChange).toHaveBeenCalledWith('grid');
	});

	test('Menu leaves Ctrl/Meta + arrows, Home and End to the browser', async () => {
		const { rows } = mountMenu();
		rows[0].focus();
		for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
			expect(await fireEvent.keyDown(rows[0], { key, ctrlKey: true })).toBe(true);
			expect(await fireEvent.keyDown(rows[0], { key, metaKey: true })).toBe(true);
			expect(document.activeElement).toBe(rows[0]);
		}
	});

	test('Menu leaves Meta + Enter to the browser instead of clicking the row itself', async () => {
		const onProfile = vi.fn();
		const { rows } = mountMenu(menuItems(onProfile));
		rows[0].focus();
		expect(await fireEvent.keyDown(rows[0], { key: 'Enter', metaKey: true })).toBe(true);
		expect(onProfile).not.toHaveBeenCalled();
	});

	test('a hovered menu ignores Alt + ArrowDown typed with nothing focused', async () => {
		const { menu, rows } = mountMenu();
		await hover(menu, rows[0]);
		expect(await fireEvent.keyDown(document.body, { key: 'ArrowDown', altKey: true })).toBe(true);
		expect(document.activeElement).toBe(document.body);
	});

	test.each(['altKey', 'ctrlKey', 'metaKey'] as const)(
		'inside an open MenuBar menu, %s + ArrowLeft and ArrowRight stay with the browser',
		async (modifier) => {
			const row = await openMenuBarMenu('Edit');
			expect(row).toHaveTextContent('Undo');

			for (const key of ['ArrowLeft', 'ArrowRight']) {
				expect(await fireEvent.keyDown(row, { key, [modifier]: true })).toBe(true);
				await settle();
				expect(expandedTriggers()).toEqual(['Edit']);
				expect(document.activeElement).toBe(row);
			}
		}
	);

	test('inside an open MenuBar menu, a plain ArrowLeft still switches to the previous menu', async () => {
		const row = await openMenuBarMenu('Edit');
		expect(await fireEvent.keyDown(row, { key: 'ArrowLeft' })).toBe(false);
		await settle();
		expect(expandedTriggers()).toEqual(['File']);
	});

	test('Alt + ArrowDown on a MenuBar trigger opens nothing and stays with the browser', async () => {
		render(NavigationKeysHarness, { props: { scenario: 'menubar' } });
		const file = screen.getByRole('menuitem', { name: 'File' });
		file.focus();
		expect(await fireEvent.keyDown(file, { key: 'ArrowDown', altKey: true })).toBe(true);
		await settle();
		expect(expandedTriggers()).toEqual([]);
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	test('the calendar month and year chooser leaves Ctrl + ArrowRight to the browser', async () => {
		renderInTheme(CalendarMonthYearPicker, {
			id: 'picker',
			currentMonth: 4,
			currentYear: 2026,
			onSelect: vi.fn(),
			onEscape: vi.fn()
		});
		// The chooser focuses the current month (May) on the next frame.
		const month = await waitFor(() => {
			const active = document.activeElement as HTMLElement;
			expect(active.dataset.pickerColumn).toBe('month');
			expect(active).toHaveTextContent('May');
			return active;
		});

		expect(await fireEvent.keyDown(month, { key: 'ArrowRight', ctrlKey: true })).toBe(true);
		expect(document.activeElement).toBe(month);

		expect(await fireEvent.keyDown(month, { key: 'ArrowRight' })).toBe(false);
		expect((document.activeElement as HTMLElement).dataset.pickerColumn).toBe('year');
	});
});

describe('submenu arrows follow the writing direction', () => {
	const shareItems = () => [
		{ type: 'option' as const, title: 'Profile' },
		{
			type: 'submenu' as const,
			title: 'Share',
			menu: [
				{ type: 'option' as const, title: 'Email' },
				{ type: 'option' as const, title: 'Link' }
			]
		}
	];

	/** Open the harness PopupMenu (as in the docs demo) and focus its submenu row. */
	const focusShare = async (dir: 'ltr' | 'rtl') => {
		render(NavigationKeysHarness, { props: { scenario: 'popup', items: shareItems(), dir } });
		await fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		await settle();
		const share = screen.getByRole('menuitem', { name: 'Share' });
		share.focus();
		return share;
	};

	/** Wait for the submenu to take focus on its first row. */
	const submenuFocused = () =>
		waitFor(() => {
			const email = screen.getByRole('menuitem', { name: 'Email' });
			expect(document.activeElement).toBe(email);
			return email;
		});

	test('in LTR, ArrowRight opens a submenu and ArrowLeft closes it', async () => {
		const share = await focusShare('ltr');
		await fireEvent.keyDown(share, { key: 'ArrowLeft' });
		await settle();
		expect(share).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.keyDown(share, { key: 'ArrowRight' });
		const email = await submenuFocused();
		expect(share).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.keyDown(email, { key: 'ArrowLeft' });
		await waitFor(() => expect(document.activeElement).toBe(share));
		expect(share).toHaveAttribute('aria-expanded', 'false');
	});

	test('in RTL, ArrowLeft opens a submenu and ArrowRight closes it', async () => {
		const share = await focusShare('rtl');
		await fireEvent.keyDown(share, { key: 'ArrowRight' });
		await settle();
		expect(share).toHaveAttribute('aria-expanded', 'false');
		expect(screen.getAllByRole('menu')).toHaveLength(1);

		await fireEvent.keyDown(share, { key: 'ArrowLeft' });
		const email = await submenuFocused();
		expect(share).toHaveAttribute('aria-expanded', 'true');

		// The submenu's rows open no further level, so ArrowLeft stays where it is.
		await fireEvent.keyDown(email, { key: 'ArrowLeft' });
		await settle();
		expect(document.activeElement).toBe(email);

		await fireEvent.keyDown(email, { key: 'ArrowRight' });
		await waitFor(() => expect(document.activeElement).toBe(share));
		expect(share).toHaveAttribute('aria-expanded', 'false');
	});

	test('in an RTL MenuBar, ArrowLeft on a submenu row opens the submenu', async () => {
		render(NavigationKeysHarness, { props: { scenario: 'menubar', dir: 'rtl' } });
		const file = screen.getByRole('menuitem', { name: 'File' });
		file.focus();
		await fireEvent.keyDown(file, { key: 'ArrowDown' });
		await settle();
		const recent = screen.getByRole('menuitem', { name: 'Open recent' });
		await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(recent);

		await fireEvent.keyDown(recent, { key: 'ArrowLeft' });
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'notes.md' }))
		);
		expect(recent).toHaveAttribute('aria-expanded', 'true');
		expect(file).toHaveAttribute('aria-expanded', 'true');
	});
});

describe('useKeyDown', () => {
	const setup = (options: { ignoreModifiers?: boolean; preventDefault?: boolean }) => {
		const callback = vi.fn();
		const node = document.createElement('div');
		let cleanup: (() => void) | void = undefined;
		const destroy = $effect.root(() => {
			const keyDown = useKeyDown({
				isActive: () => true,
				keys: ['ArrowDown'],
				callback,
				...options
			});
			cleanup = keyDown.reference(node);
		});
		flushSync();
		return {
			callback,
			node,
			destroy: () => {
				cleanup?.();
				destroy();
			}
		};
	};

	test('keeps modified keys by default (Combobox opens on Alt + ArrowDown)', () => {
		const { callback, node, destroy } = setup({});
		const event = new KeyboardEvent('keydown', {
			key: 'ArrowDown',
			altKey: true,
			cancelable: true
		});
		node.dispatchEvent(event);
		expect(callback).toHaveBeenCalledWith(event, 'element');
		expect(event.defaultPrevented).toBe(true);
		destroy();
	});

	test('ignoreModifiers skips Alt, Ctrl and Meta but not Shift', () => {
		const { callback, node, destroy } = setup({ ignoreModifiers: true });
		for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
			const event = new KeyboardEvent('keydown', {
				key: 'ArrowDown',
				[modifier]: true,
				cancelable: true
			});
			node.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(false);
		}
		expect(callback).not.toHaveBeenCalled();

		const shifted = new KeyboardEvent('keydown', {
			key: 'ArrowDown',
			shiftKey: true,
			cancelable: true
		});
		node.dispatchEvent(shifted);
		expect(callback).toHaveBeenCalledOnce();
		expect(shifted.defaultPrevented).toBe(true);
		destroy();
	});
});
