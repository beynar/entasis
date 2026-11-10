// `truncate`: in a row narrower than the message, SpinnerText stops at the row and ends with "…".
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './SpinnerTextRowHarness.test.svelte';

const LONG = 'Lecture des 42 devis du client Durand et comparaison avec le plafond';
const row = () => document.querySelector<HTMLElement>('[data-testid="row"]')!;
const root = () => row().querySelector<HTMLElement>('[data-slot="spinner-text"]')!;
const message = () =>
	root().querySelector<HTMLElement>('[aria-hidden="true"] > span:not(:first-child)')!;
const sizerItems = () => [
	...root().querySelectorAll<HTMLElement>('[aria-hidden="true"] > span:first-child > span')
];

describe('SpinnerText truncate', () => {
	test('stays inside the row and ends the message with an ellipsis', async () => {
		await render(Harness, { props: { texts: [LONG, 'Court'], truncate: true } });
		await expect.poll(() => message()?.textContent?.trim()).toBe(LONG);
		const rowBox = row().getBoundingClientRect();
		expect(root().getBoundingClientRect().right).toBeLessThanOrEqual(rowBox.right + 0.5);
		expect(row().scrollWidth).toBeLessThanOrEqual(row().clientWidth);
		const after = row().querySelector<HTMLElement>('[data-testid="after"]')!;
		expect(after.getBoundingClientRect().right).toBeLessThanOrEqual(rowBox.right + 0.5);
		for (const element of [message(), ...sizerItems()]) {
			expect(getComputedStyle(element).textOverflow).toBe('ellipsis');
		}
		expect(message().scrollWidth).toBeGreaterThan(message().clientWidth);
	});

	test('takes the free width of the row', async () => {
		await render(Harness, { props: { texts: ['Court'], truncate: true } });
		await expect.poll(() => message()?.textContent?.trim()).toBe('Court');
		const after = row().querySelector<HTMLElement>('[data-testid="after"]')!;
		// flex-1: the root grows, so what follows it sits at the row's end.
		expect(Math.round(after.getBoundingClientRect().right)).toBe(
			Math.round(row().getBoundingClientRect().right)
		);
	});

	test('the status region still holds the full text', async () => {
		await render(Harness, { props: { texts: [LONG], truncate: true } });
		await expect.poll(() => root().querySelector('.sr-only')?.textContent).toBe(LONG);
		expect(root().getAttribute('role')).toBe('status');
	});

	test('without it, the message keeps its full width, as before', async () => {
		await render(Harness, { props: { texts: [LONG] } });
		await expect.poll(() => message()?.textContent?.trim()).toBe(LONG);
		expect(getComputedStyle(message()).textOverflow).not.toBe('ellipsis');
		expect(root().hasAttribute('data-truncate')).toBe(false);
	});
});
