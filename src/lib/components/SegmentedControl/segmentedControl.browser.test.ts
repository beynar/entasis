// SegmentedControl selection in real engines (Chromium and WebKit): only a deliberate key move
// selects. Tabbing in, or a key that belongs to the browser, never changes the value.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame, tab } from '$lib/testing/browser.test-helper.js';
import Harness from './SegmentedControlHarness.test.svelte';

const button = (name: string) =>
	page.getByRole('button', { name, exact: true }).element() as HTMLElement;
const radio = (name: string) =>
	page.getByRole('radio', { name, exact: true }).element() as HTMLElement;
const value = () => page.getByTestId('value').element().textContent;
const changes = () => page.getByTestId('changes').element().textContent;
const settle = async () => {
	await nextFrame();
	await nextFrame();
};

describe('tabbing in', () => {
	test('lands on the selected item and leaves the value alone', async () => {
		await render(Harness, { value: 'list' });
		await settle();
		button('Before').focus();
		await tab();
		expect(document.activeElement).toBe(radio('List'));
		expect(value()).toBe('list');
		expect(changes()).toBe('');
	});

	test('when the selected item is disabled, the tab stop item is not selected', async () => {
		await render(Harness, {
			value: 'list',
			items: [
				{ value: 'grid', label: 'Grid' },
				{ value: 'list', label: 'List', disabled: true },
				{ value: 'table', label: 'Table' }
			]
		});
		await settle();
		button('Before').focus();
		await tab();
		expect(document.activeElement).toBe(radio('Grid'));
		expect(value()).toBe('list');
		expect(changes()).toBe('');
	});

	test('when the value matches no item, nothing is selected by tabbing in', async () => {
		await render(Harness, { value: 'missing' });
		await settle();
		button('Before').focus();
		await tab();
		expect(document.activeElement).toBe(radio('Grid'));
		expect(value()).toBe('missing');
		expect(changes()).toBe('');
		await tab();
		expect(document.activeElement).toBe(button('After'));
		expect(changes()).toBe('');
	});

	test('Shift+Tab back into the control does not select either', async () => {
		await render(Harness, { value: 'table' });
		await settle();
		button('After').focus();
		await tab({ shift: true });
		expect(document.activeElement).toBe(radio('Table'));
		expect(changes()).toBe('');
	});
});

describe('keyboard moves', () => {
	test('arrow keys move and select, wrapping at the ends', async () => {
		await render(Harness, { value: 'table' });
		await settle();
		radio('Table').focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(radio('Grid'));
		expect(value()).toBe('grid');
		await userEvent.keyboard('{ArrowLeft}');
		expect(value()).toBe('table');
		expect(changes()).toBe('grid,table');
	});

	test('Home and End select the first and last item', async () => {
		await render(Harness, { value: 'list' });
		await settle();
		radio('List').focus();
		await userEvent.keyboard('{End}');
		expect(value()).toBe('table');
		await userEvent.keyboard('{Home}');
		expect(value()).toBe('grid');
	});

	test('arrow keys with Alt, Ctrl or Meta are left to the browser and select nothing', async () => {
		await render(Harness, { value: 'list' });
		await settle();
		radio('List').focus();
		// Synthetic events: a real Alt+ArrowLeft or Cmd+ArrowLeft would take the test page Back.
		const press = (key: string, modifier: 'altKey' | 'ctrlKey' | 'metaKey') => {
			const event = new KeyboardEvent('keydown', {
				key,
				[modifier]: true,
				bubbles: true,
				cancelable: true
			});
			radio('List').dispatchEvent(event);
			return event;
		};
		for (const event of [
			press('ArrowRight', 'altKey'),
			press('ArrowRight', 'ctrlKey'),
			press('ArrowLeft', 'metaKey'),
			press('Home', 'altKey'),
			press('End', 'ctrlKey')
		]) {
			expect(event.defaultPrevented).toBe(false);
		}
		expect(document.activeElement).toBe(radio('List'));
		expect(value()).toBe('list');
		expect(changes()).toBe('');
	});

	test('a click selects the item', async () => {
		await render(Harness, { value: 'list' });
		await settle();
		await userEvent.click(radio('Table'));
		expect(value()).toBe('table');
		expect(changes()).toBe('table');
	});
});
