// useNavigation in real engines (Chromium and WebKit): CSS-hidden items, the focus restore after
// the focused item is removed (Chromium blurs a removed element, WebKit does not), real Tab order
// around the roving tab stop, and a toolbar text field typed into with real keys.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame, tab } from '$lib/testing/browser.test-helper.js';
import ThemeProviderHarness from '../components/Theme/ThemeProviderHarness.test.svelte';
import TabbarFallbackHarness from '../components/Tabbar/TabbarFallbackHarness.test.svelte';
import NavigationListHarness, { type HarnessItem } from './NavigationListHarness.test.svelte';

const items = (...labels: string[]): HarnessItem[] =>
	labels.map((label) => ({ id: label.toLowerCase(), label }));
const button = (name: string) =>
	page.getByRole('button', { name, exact: true }).element() as HTMLElement;
const tabStops = (root: Element) => Array.from(root.querySelectorAll('[tabindex="0"]'));
const settle = async () => {
	await nextFrame();
	await nextFrame();
};

describe('hidden items', () => {
	test('arrow keys skip an item hidden with display: none', async () => {
		await render(NavigationListHarness, {
			items: items('Archive', 'Copy', 'Cut'),
			options: { orientation: 'vertical' }
		});
		button('Copy').style.display = 'none';
		button('Archive').focus();
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(button('Cut'));
		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(button('Archive'));
	});

	test('a hidden tab-stop item hands the stop to the next visible one', async () => {
		await render(NavigationListHarness, { items: items('Archive', 'Copy', 'Cut') });
		const list = page.getByTestId('list').element();
		await settle();
		expect(tabStops(list)).toEqual([button('Archive')]);

		button('Archive').hidden = true;
		await settle();
		expect(tabStops(list)).toEqual([button('Copy')]);
		button('Before').focus();
		await tab();
		expect(document.activeElement).toBe(button('Copy'));
	});
});

describe('removing the focused item', () => {
	test('focus moves to the item that took its place, and Tab order keeps one stop', async () => {
		const screen = await render(NavigationListHarness, { items: items('Archive', 'Copy', 'Cut') });
		const list = page.getByTestId('list').element();
		button('Copy').focus();
		await screen.rerender({ items: items('Archive', 'Cut') });
		await settle();

		expect(document.activeElement).toBe(button('Cut'));
		expect(tabStops(list)).toEqual([button('Cut')]);
		// Tab leaves the list in one step, and Shift+Tab comes back to its single stop (with no
		// default item, the first one once focus has left).
		await tab();
		expect(document.activeElement).toBe(button('After'));
		await tab({ shift: true });
		expect(document.activeElement).toBe(button('Archive'));
		expect(tabStops(list)).toEqual([button('Archive')]);
	});

	test('the focused, selected last tab: focus and the tab stop land on its replacement', async () => {
		const screen = await render(ThemeProviderHarness, {
			component: TabbarFallbackHarness,
			items: ['In review', 'Approved', 'Archived'],
			initialValue: 'Archived'
		});
		const archived = page.getByRole('tab', { name: 'Archived' });
		await userEvent.click(archived);
		expect(document.activeElement).toBe(archived.element());

		await screen.rerender({
			component: TabbarFallbackHarness,
			items: ['In review', 'Approved']
		});
		await settle();

		const approved = page.getByRole('tab', { name: 'Approved' }).element();
		const tablist = page.getByRole('tablist').element();
		expect(approved.getAttribute('aria-selected')).toBe('true');
		expect(document.activeElement).toBe(approved);
		expect(tabStops(tablist)).toEqual([approved]);

		// Shift+Tab leaves the tab list in one step: the tablist itself is no Tab stop.
		await tab({ shift: true });
		expect(document.activeElement).toBe(button('Set external value'));
		await tab();
		expect(document.activeElement).toBe(approved);
		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(page.getByRole('tab', { name: 'In review' }).element());
	});
});

describe('a text field in a toolbar', () => {
	test('keeps Home, End and Space, and leaves only from the caret edge', async () => {
		await render(NavigationListHarness, {
			items: [
				...items('Bold'),
				{ id: 'search', label: 'Search', kind: 'input', value: 'ab' },
				...items('Italic')
			]
		});
		const search = page.getByRole('textbox', { name: 'Search' }).element() as HTMLInputElement;
		search.focus();
		search.setSelectionRange(2, 2);

		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(search);
		expect(search.selectionStart).toBe(1);

		await userEvent.keyboard(' ');
		expect(search.value).toBe('a b');
		// Home stays in the field (on macOS it does not move the caret, so place it for the next key).
		await userEvent.keyboard('{Home}');
		expect(document.activeElement).toBe(search);
		search.setSelectionRange(0, 0);

		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(button('Bold'));

		search.focus();
		await userEvent.keyboard('{End}');
		expect(document.activeElement).toBe(search);
		search.setSelectionRange(search.value.length, search.value.length);
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(button('Italic'));
	});
});
