// The picker opens when asked. Focus coming back to the input, as it does when the picker closes, is
// not asking.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ColorInputHarness from './ColorInputHarness.test.svelte';

const input = () => document.querySelector<HTMLInputElement>('input[aria-label="Color value"]')!;
const swatch = () => page.elementLocator(document.querySelector('[aria-haspopup="dialog"]')!);
const pickerOpen = () => document.querySelector('[id$="-color-picker"]') !== null;
const settle = () => new Promise((resolve) => setTimeout(resolve, 350));

const mount = async () => {
	await render(ColorInputHarness);
	await expect.poll(() => input()).not.toBeNull();
};

const expectStaysClosed = async () => {
	await expect.poll(pickerOpen).toBe(false);
	await settle();
	expect(pickerOpen()).toBe(false);
};

/** A press on nothing lets go of focus: the input does not take it back. */
const expectFocusLeftTheInput = () => expect(document.activeElement).toBe(document.body);

describe('ColorInput', () => {
	test('a click on the input opens the picker', async () => {
		await mount();
		await userEvent.click(input());
		await expect.poll(pickerOpen).toBe(true);
	});

	test('a click outside closes a picker the input opened, for good', async () => {
		await mount();
		await userEvent.click(input());
		await expect.poll(pickerOpen).toBe(true);
		await settle();
		await userEvent.click(page.getByTestId('outside'));
		await expectStaysClosed();
		expectFocusLeftTheInput();
	});

	test('a click outside closes a picker the swatch opened, for good', async () => {
		await mount();
		await swatch().click();
		await expect.poll(pickerOpen).toBe(true);
		await settle();
		await userEvent.click(page.getByTestId('outside'));
		await expectStaysClosed();
		expectFocusLeftTheInput();
	});

	test('a click outside after using the picker closes it for good', async () => {
		await mount();
		await swatch().click();
		await expect.poll(pickerOpen).toBe(true);
		await settle();
		const control = document.querySelector<HTMLElement>(
			'[id$="-color-picker"] input, [id$="-color-picker"] [tabindex="0"]'
		)!;
		control.focus();
		await expect.poll(() => control.contains(document.activeElement)).toBe(true);
		await userEvent.click(page.getByTestId('outside'));
		await expectStaysClosed();
		expectFocusLeftTheInput();
	});

	test('a second click on the swatch closes it for good', async () => {
		await mount();
		await swatch().click();
		await expect.poll(pickerOpen).toBe(true);
		await settle();
		await swatch().click();
		await expectStaysClosed();
	});

	test('Escape from inside the picker closes it for good and returns to the input', async () => {
		await mount();
		input().focus();
		await userEvent.keyboard('{ArrowDown}');
		await expect
			.poll(() => document.querySelector('[id$="-color-picker"]')?.contains(document.activeElement))
			.toBe(true);
		await userEvent.keyboard('{Escape}');
		await expectStaysClosed();
		expect(document.activeElement).toBe(input());
	});

	test('Escape closes it for good and returns to the input', async () => {
		await mount();
		await userEvent.click(input());
		await expect.poll(pickerOpen).toBe(true);
		await settle();
		await userEvent.keyboard('{Escape}');
		await expectStaysClosed();
		expect(document.activeElement).toBe(input());
	});

	test('Tab goes through the field without opening the picker', async () => {
		await mount();
		page.getByTestId('before').element().focus();
		await userEvent.tab();
		expect(document.activeElement).toBe(input());
		await settle();
		expect(pickerOpen()).toBe(false);
	});

	test('ArrowDown opens the picker and enters it', async () => {
		await mount();
		input().focus();
		await userEvent.keyboard('{ArrowDown}');
		await expect.poll(pickerOpen).toBe(true);
		await expect
			.poll(() => document.querySelector('[id$="-color-picker"]')?.contains(document.activeElement))
			.toBe(true);
	});
});
