// How focus enters a PopupMenu (by how it opened), how Tab leaves it, how a submenu is toggled
// and closed when focus comes back to its parent, and how an inline Menu closes a submenu.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Menu from '../Menu/Menu.svelte';
import type { MenuItem } from '../Menu/menu.props.js';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import PopupMenuFocusHarness from './PopupMenuFocusHarness.test.svelte';

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
const menus = () => screen.queryAllByRole('menu');

const items = (): MenuItem[] => [
	{ type: 'option', title: 'New file' },
	{ type: 'option', title: 'Open' },
	{
		type: 'submenu',
		title: 'Share',
		menu: [
			{ type: 'option', title: 'Email' },
			{ type: 'option', title: 'Link' }
		]
	},
	{ type: 'option', title: 'Quit' }
];

const mount = (props: Record<string, unknown> = {}) =>
	render(PopupMenuFocusHarness, { props: { items: items(), ...props } });
const trigger = () => screen.getByRole('button', { name: 'File' });

/** A mouse press and click: `detail` is 1, so the open reads as a pointer open. */
const pointerClick = async (element: HTMLElement) => {
	await fireEvent.pointerDown(element, { pointerType: 'mouse' });
	await fireEvent.click(element, { detail: 1 });
};
/** What Enter or Space on a button dispatches: a click with no detail. */
const keyboardClick = (element: HTMLElement) => fireEvent.click(element, { detail: 0 });

describe('initial focus follows how the menu opened', () => {
	test('a11y:popup-menu.initial-focus a keyboard click on the button highlights the first row', async () => {
		mount();
		trigger().focus();
		await keyboardClick(trigger());
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'New file' }))
		);
	});

	test('ArrowDown on the button opens the menu on the first row', async () => {
		mount();
		trigger().focus();
		await fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'New file' }))
		);
		expect(trigger()).toHaveAttribute('aria-expanded', 'true');
	});

	test('ArrowUp on the button opens the menu on the last row', async () => {
		mount();
		trigger().focus();
		await fireEvent.keyDown(trigger(), { key: 'ArrowUp' });
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Quit' }))
		);
	});

	test('a pointer click focuses the menu, with no row highlighted', async () => {
		mount();
		await pointerClick(trigger());
		await waitFor(() => expect(menus()).toHaveLength(1));
		await waitFor(() => expect(document.activeElement).toBe(menus()[0]));
		expect(menus()[0].querySelector('[data-highlighted]')).toBeNull();
	});

	test('a menu that names focusOnMount keeps it', async () => {
		mount({ menu: { focusOnMount: 'container' } });
		trigger().focus();
		await keyboardClick(trigger());
		await waitFor(() => expect(document.activeElement).toBe(menus()[0]));
	});

	test('ArrowDown or ArrowUp with a modifier is left to the browser', async () => {
		mount();
		trigger().focus();
		await fireEvent.keyDown(trigger(), { key: 'ArrowDown', altKey: true });
		await settle();
		expect(menus()).toHaveLength(0);
	});
});

describe('Tab leaves the menu', () => {
	const openWithKeyboard = async () => {
		trigger().focus();
		await keyboardClick(trigger());
		await waitFor(() => expect(menus()).toHaveLength(1));
		await waitFor(() => expect(menus()[0].contains(document.activeElement)).toBe(true));
	};

	test('a11y:popup-menu.tab-leaves Tab closes the menu and hands focus to the trigger, so the browser moves on after it', async () => {
		const onOpenChange = vi.fn();
		mount({ onOpenChange });
		await openWithKeyboard();

		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		document.activeElement!.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(false);
		expect(document.activeElement).toBe(trigger());
		await waitFor(() => expect(menus()).toHaveLength(0));
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'focus-out', interaction: 'keyboard' })
		);
		// The close does not take focus back from where Tab left it.
		await settle();
		expect(document.activeElement).toBe(trigger());
	});

	test('Shift+Tab closes the menu and keeps focus on the trigger', async () => {
		mount();
		await openWithKeyboard();

		const event = new KeyboardEvent('keydown', {
			key: 'Tab',
			shiftKey: true,
			bubbles: true,
			cancelable: true
		});
		document.activeElement!.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(trigger());
		await waitFor(() => expect(menus()).toHaveLength(0));
	});

	test('Tab from a submenu closes every level', async () => {
		mount();
		await openWithKeyboard();
		const share = screen.getByRole('menuitem', { name: 'Share' });
		share.focus();
		await fireEvent.keyDown(share, { key: 'ArrowRight' });
		await waitFor(() => expect(menus()).toHaveLength(2));
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Email' }))
		);

		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		document.activeElement!.dispatchEvent(event);

		expect(document.activeElement).toBe(trigger());
		await waitFor(() => expect(menus()).toHaveLength(0));
	});

	test('a cancelled close keeps the menu and its focus', async () => {
		const onOpenChange = vi.fn((_open: boolean, details: { reason: string; cancel(): void }) => {
			if (details.reason === 'focus-out') details.cancel();
		});
		mount({ onOpenChange });
		await openWithKeyboard();

		const row = document.activeElement as HTMLElement;
		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		row.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(menus()).toHaveLength(1);
		expect(document.activeElement).toBe(row);
	});

	test('Tab inside a footer field goes on to the next control of the panel', async () => {
		const { createRawSnippet } = await import('svelte');
		const footer = createRawSnippet(() => ({
			render: () => '<div><a href="/help">Help</a><a href="/docs">Docs</a></div>'
		}));
		mount({ menu: { footer } });
		await openWithKeyboard();
		const help = screen.getByRole('link', { name: 'Help' });
		help.focus();

		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		help.dispatchEvent(event);
		await settle();
		expect(menus()).toHaveLength(1);
		expect(event.defaultPrevented).toBe(false);

		// From the last control of the panel, Tab leaves.
		const docs = screen.getByRole('link', { name: 'Docs' });
		docs.focus();
		docs.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
		);
		await waitFor(() => expect(menus()).toHaveLength(0));
	});
});

describe('submenus', () => {
	const openShare = async () => {
		trigger().focus();
		await keyboardClick(trigger());
		await waitFor(() => expect(menus()).toHaveLength(1));
		const share = screen.getByRole('menuitem', { name: 'Share' });
		share.focus();
		return share;
	};

	test('a11y:popup-menu.submenu-toggle pressing an open submenu trigger again with the keyboard closes the submenu', async () => {
		mount();
		const share = await openShare();

		await keyboardClick(share);
		await waitFor(() => expect(menus()).toHaveLength(2));
		await keyboardClick(share);
		await waitFor(() => expect(menus()).toHaveLength(1));
		expect(share).toHaveAttribute('aria-expanded', 'false');
	});

	test('a second pointer click on a submenu that a click opened closes it', async () => {
		mount();
		const share = await openShare();

		await pointerClick(share);
		await waitFor(() => expect(menus()).toHaveLength(2));
		await pointerClick(share);
		await waitFor(() => expect(menus()).toHaveLength(1));
	});

	test('a keyboard open of a submenu focuses its first row, a pointer open the submenu itself', async () => {
		mount();
		const share = await openShare();
		await fireEvent.keyDown(share, { key: 'ArrowRight' });
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Email' }))
		);
	});

	test('a pointer open of a submenu focuses the submenu, not a row', async () => {
		mount();
		const share = await openShare();
		await pointerClick(share);
		await waitFor(() => expect(menus()).toHaveLength(2));
		await waitFor(() => expect(document.activeElement).toBe(menus()[1]));
	});

	test('focus returning to the parent menu closes the submenu and gives the arrow keys back', async () => {
		mount();
		const share = await openShare();
		await fireEvent.keyDown(share, { key: 'ArrowRight' });
		await waitFor(() => expect(menus()).toHaveLength(2));
		await waitFor(() => expect(menus()[1].contains(document.activeElement)).toBe(true));

		// Shift+Tab from the submenu used to land here, with the parent's keys switched off.
		const open = screen.getByRole('menuitem', { name: 'Open' });
		open.focus();
		await waitFor(() => expect(menus()).toHaveLength(1));

		await fireEvent.keyDown(open, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(share);
	});

	test('a submenu opened by the pointer does not take focus from a field', async () => {
		mount({ menu: { items: [] }, items: [] });
		const search = screen.getByRole('textbox', { name: 'Search' });
		search.focus();
		// The submenu panel opens from a trigger the pointer rests on while the field has focus.
		await fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
		search.focus();
		expect(document.activeElement).toBe(search);
	});
});

describe('an inline menu', () => {
	const inline = (dir?: 'ltr' | 'rtl') => {
		renderInTheme(Menu, {
			items: [
				{ type: 'option', title: 'Dashboard' },
				{
					type: 'submenu',
					title: 'Recent files',
					menu: [
						{ type: 'option', title: 'document.txt' },
						{ type: 'option', title: 'project.js' }
					]
				}
			] satisfies MenuItem[],
			submenuMode: 'popover',
			...(dir ? { dir } : {})
		});
	};

	test('ArrowLeft closes a first-level submenu and returns focus to its row', async () => {
		inline();
		const recent = screen.getByRole('menuitem', { name: 'Recent files' });
		recent.focus();
		await fireEvent.focusIn(recent);
		await fireEvent.keyDown(recent, { key: 'ArrowRight' });
		await waitFor(() =>
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'document.txt' }))
		);

		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
		await waitFor(() => expect(document.activeElement).toBe(recent));
		await waitFor(() => expect(menus()).toHaveLength(1));
	});

	test('ArrowLeft on a root row of an inline menu stays unhandled', async () => {
		inline();
		const dashboard = screen.getByRole('menuitem', { name: 'Dashboard' });
		dashboard.focus();
		await fireEvent.focusIn(dashboard);
		const event = new KeyboardEvent('keydown', {
			key: 'ArrowLeft',
			bubbles: true,
			cancelable: true
		});
		dashboard.dispatchEvent(event);
		expect(document.activeElement).toBe(dashboard);
		expect(menus()).toHaveLength(1);
	});
});

describe('a submenu the pointer opened', () => {
	const hoverMenu = () => {
		render(PopupMenuFocusHarness, {
			props: {
				items: [
					{ type: 'option', title: 'New file' },
					{
						type: 'submenu',
						title: 'Share',
						delay: 0,
						menu: [
							{ type: 'option', title: 'Email' },
							{ type: 'option', title: 'Link' }
						]
					}
				] satisfies MenuItem[]
			}
		});
	};

	test('opens without taking focus from where it was', async () => {
		hoverMenu();
		trigger().focus();
		await keyboardClick(trigger());
		await waitFor(() => expect(menus()).toHaveLength(1));
		const search = screen.getByRole('textbox', { name: 'Search' });
		search.focus();

		await fireEvent.mouseEnter(screen.getByRole('menuitem', { name: 'Share' }));
		await waitFor(() => expect(menus()).toHaveLength(2));
		await settle();
		expect(document.activeElement).toBe(search);
	});

	test('a mouse click on it pins it open, and Enter then closes it', async () => {
		hoverMenu();
		trigger().focus();
		await keyboardClick(trigger());
		await waitFor(() => expect(menus()).toHaveLength(1));
		const share = screen.getByRole('menuitem', { name: 'Share' });

		await fireEvent.mouseEnter(share);
		await waitFor(() => expect(menus()).toHaveLength(2));
		await pointerClick(share);
		await settle();
		expect(menus()).toHaveLength(2);

		await keyboardClick(share);
		await waitFor(() => expect(menus()).toHaveLength(1));
	});
});

describe('VoiceOver (Apple platforms)', () => {
	const openShare = async () => {
		mount();
		trigger().focus();
		await keyboardClick(trigger());
		await waitFor(() => expect(menus()).toHaveLength(1));
		const share = screen.getByRole('menuitem', { name: 'Share' });
		share.focus();
		await fireEvent.keyDown(share, { key: 'ArrowRight' });
		await waitFor(() => expect(menus()).toHaveLength(2));
		return share;
	};

	test('an open submenu trigger drops aria-expanded, keeping aria-haspopup and aria-controls', async () => {
		vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
		const share = await openShare();
		expect(share).not.toHaveAttribute('aria-expanded');
		expect(share).toHaveAttribute('aria-haspopup', 'menu');
		expect(share).toHaveAttribute('aria-controls');

		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
		await waitFor(() => expect(menus()).toHaveLength(1));
		expect(share).toHaveAttribute('aria-expanded', 'false');
	});

	test('elsewhere the trigger keeps aria-expanded', async () => {
		vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
		vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Windows NT 10.0)');
		const share = await openShare();
		expect(share).toHaveAttribute('aria-expanded', 'true');
	});
});
