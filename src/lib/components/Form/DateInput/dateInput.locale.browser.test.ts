// The month the calendar writes follows the app's I18n, then the browser.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './I18nCalendarHarness.test.svelte';

const monthOf = async (props: { withI18n: boolean; locale?: string }) => {
	await render(Harness, { props });
	await userEvent.click(page.getByRole('textbox', { name: 'Day' }));
	await expect.poll(() => document.querySelector('dialog[open]')).not.toBeNull();
	await new Promise((resolve) => setTimeout(resolve, 100));
	return document.querySelector('dialog[open]')!.textContent ?? '';
};

test('under an I18n, the month is in its language', async () => {
	expect(await monthOf({ withI18n: true })).toMatch(/décembre/i);
});

test('the prop still wins', async () => {
	expect(await monthOf({ withI18n: true, locale: 'de-DE' })).toMatch(/Dezember/);
});

test('without an I18n, the browser decides', async () => {
	const expected = new Date(2026, 11, 5).toLocaleDateString(undefined, { month: 'long' });
	expect((await monthOf({ withI18n: false })).toLowerCase()).toContain(expected.toLowerCase());
});
