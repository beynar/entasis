// Menus in real browsers (Chromium and WebKit): where focus goes when a menu opens and when Tab
// leaves it, submenus in right-to-left text with real layout, the filter field's focus, and the
// ToggleMenu overflow menu built from checkbox and radio rows.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame, tab } from '$lib/testing/browser.test-helper.js';
import MenuBrowserHarness from './MenuBrowserHarness.test.svelte';

type Props = Parameters<typeof MenuBrowserHarness>[1];
const mount = (scenario: Props['scenario'], dir: Props['dir'] = 'ltr') =>
	render(MenuBrowserHarness, { props: { scenario, dir } });
const button = (name: string | RegExp) =>
	page.getByRole('button', { name }).element() as HTMLElement;
const menus = () => [...document.querySelectorAll<HTMLElement>('[role="menu"]')];
const rowText = (node: Element | null) => node?.textContent?.trim();
const stateText = () => document.querySelector('[data-testid="state"]')?.textContent ?? '';

/** Reach `name` with real Tab presses from the control before it, so a focus ring shows. */
async function tabTo(name: string) {
	button('Before').focus();
	await tab();
	expect(document.activeElement).toBe(button(name));
}

describe('focus when a menu opens', () => {
	test('Enter on the button highlights the first row, ArrowUp the last', async () => {
		mount('popup');
		await tabTo('File');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => rowText(document.activeElement)).toBe('New file');
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => menus().length).toBe(0);
		expect(document.activeElement).toBe(button('File'));

		await userEvent.keyboard('{ArrowUp}');
		await expect.poll(() => rowText(document.activeElement)).toBe('Quit');
	});

	test('a pointer click focuses the menu itself, with no row highlighted', async () => {
		mount('popup');
		await userEvent.click(button('File'));
		await expect.poll(() => document.activeElement?.getAttribute('role')).toBe('menu');
		expect(menus()[0].querySelector('[data-highlighted="true"]')).toBeNull();
	});
});

describe('Tab and Shift+Tab', () => {
	test('Tab closes the menu and lands on the control after the button', async () => {
		mount('popup');
		await tabTo('File');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => menus().length).toBe(1);
		await expect.poll(() => rowText(document.activeElement)).toBe('New file');

		await tab();
		expect(document.activeElement).toBe(button('After'));
		await expect.poll(() => menus().length).toBe(0);
	});

	test('Shift+Tab closes the menu and returns to the button', async () => {
		mount('popup');
		await tabTo('File');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => menus().length).toBe(1);
		await tab({ shift: true });
		expect(document.activeElement).toBe(button('File'));
		await expect.poll(() => menus().length).toBe(0);
	});

	test('Tab from an open submenu closes every level and moves on', async () => {
		mount('popup');
		await tabTo('File');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => rowText(document.activeElement)).toBe('New file');
		await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
		await expect.poll(() => menus().length).toBe(2);
		await expect.poll(() => rowText(document.activeElement)).toBe('Email');

		await tab();
		expect(document.activeElement).toBe(button('After'));
		await expect.poll(() => menus().length).toBe(0);
	});

	test('Tab out of a MenuBar menu moves past the bar', async () => {
		mount('menubar');
		const file = page.getByRole('menuitem', { name: 'File' }).element() as HTMLElement;
		button('Before').focus();
		await tab();
		expect(document.activeElement).toBe(file);
		await userEvent.keyboard('{ArrowDown}');
		await expect.poll(() => menus().length).toBe(1);
		await tab();
		expect(document.activeElement).toBe(button('After'));
		await expect.poll(() => menus().length).toBe(0);
		// Closing does not take focus back from where Tab left it.
		await nextFrame();
		expect(document.activeElement).toBe(button('After'));
	});
});

describe('right-to-left text', () => {
	test('the submenu opens beside its row on the left, with a mirrored caret', async () => {
		mount('popup', 'rtl');
		await userEvent.click(button('File'));
		await expect.poll(() => menus().length).toBe(1);
		const share = page.getByRole('menuitem', { name: 'Share' }).element() as HTMLElement;
		share.focus();
		await userEvent.keyboard('{ArrowLeft}');
		await expect.poll(() => menus().length).toBe(2);

		const [root, submenu] = menus().map((menu) => menu.getBoundingClientRect());
		expect(submenu.right).toBeLessThanOrEqual(root.left + 8);
		// The panel starts where its trigger starts, on the right, not at the edge of the viewport.
		const trigger = button('File').getBoundingClientRect();
		expect(Math.abs(root.right - trigger.right)).toBeLessThan(8);

		const caret = share.querySelector('span.inline-flex');
		expect(
			getComputedStyle(caret!).scale === '-1 1' || getComputedStyle(caret!).transform !== 'none'
		).toBe(true);

		// ArrowRight leaves the submenu.
		await userEvent.keyboard('{ArrowRight}');
		await expect.poll(() => menus().length).toBe(1);
		expect(document.activeElement).toBe(share);
	});

	test('in an RTL MenuBar ArrowLeft opens a submenu', async () => {
		mount('menubar', 'rtl');
		const file = page.getByRole('menuitem', { name: 'File' }).element() as HTMLElement;
		file.focus();
		await userEvent.keyboard('{ArrowDown}');
		await expect.poll(() => menus().length).toBe(1);
		const share = page.getByRole('menuitem', { name: 'Share' }).element() as HTMLElement;
		share.focus();
		await userEvent.keyboard('{ArrowLeft}');
		await expect.poll(() => menus().length).toBe(2);
		await expect.poll(() => rowText(document.activeElement)).toBe('Email');
	});
});

describe('filterable menu', () => {
	test('typing filters, ArrowDown highlights a row and Enter presses it', async () => {
		mount('filter');
		await tabTo('Actions');
		await userEvent.keyboard('{Enter}');
		const search = page.getByRole('textbox', { name: 'Search' });
		await expect.element(search).toBeVisible();
		await expect.poll(() => document.activeElement).toBe(search.element());

		await userEvent.keyboard('sh');
		await expect.poll(() => menus()[0].querySelectorAll('[role="menuitem"]').length).toBe(1);
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(search.element());
		expect(search.element().getAttribute('aria-activedescendant')).toBe(
			menus()[0].querySelector('[data-highlighted="true"]')?.id
		);
	});
});

describe('ToggleMenu overflow', () => {
	test('the More menu lists the squeezed toggles and radios as checkbox and radio rows', async () => {
		mount('toolbar');
		await nextFrame();
		await nextFrame();
		const more = page.getByRole('button', { name: 'More tools' });
		await expect.element(more).toBeVisible();
		await userEvent.click(more);
		await expect.poll(() => menus().length).toBe(1);

		const menu = menus()[0];
		const bold = menu.querySelector<HTMLElement>('[role="menuitemcheckbox"][aria-label="Bold"]');
		const italic = menu.querySelector<HTMLElement>(
			'[role="menuitemcheckbox"][aria-label="Italic"]'
		);
		expect(bold?.getAttribute('aria-checked')).toBe('false');
		expect(italic?.getAttribute('aria-checked')).toBe('true');
		const align = menu.querySelector('[role="group"]');
		expect(align?.querySelectorAll('[role="menuitemradio"]').length).toBe(2);

		await userEvent.click(bold!);
		await expect.poll(() => bold!.getAttribute('aria-checked')).toBe('true');
		await expect.poll(stateText).toContain('Bold:true');
		// A checkbox keeps the menu open.
		expect(menus()).toHaveLength(1);

		const right = menu.querySelector<HTMLElement>('[role="menuitemradio"][aria-label="Right"]');
		await userEvent.click(right!);
		await expect.poll(stateText).toContain('Align:right');
		expect(right!.getAttribute('aria-checked')).toBe('true');
		expect(menus()).toHaveLength(1);
	});
});
