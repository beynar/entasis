// An `onSubmit` that answers at once closes the ask like a slow one: nothing about the speed of
// the answer can leave the dialog open and busy.
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { animationsSettled } from '$lib/testing/browser.test-helper.js';
import { ask } from './ask.js';
import AskHarness from './AskHarness.test.svelte';

const cases: [string, () => unknown][] = [
	['synchronous', () => undefined],
	['async, immediate', async () => undefined],
	['after a tick', () => tick()],
	['after a macrotask', () => new Promise((resolve) => setTimeout(resolve, 0))],
	['after 20 ms', () => new Promise((resolve) => setTimeout(resolve, 20))],
	['after 150 ms', () => new Promise((resolve) => setTimeout(resolve, 150))]
];

describe('ask with an onSubmit of any speed', () => {
	test.each(cases)('%s: closes and resolves', async (_name, onSubmit) => {
		render(AskHarness);
		let settled = false;
		const result = ask({
			title: 'Rename',
			inputs: { name: { type: 'text', label: 'Name', defaultValue: 'x' } },
			confirm: 'Save',
			cancel: 'Cancel',
			onSubmit
		}).finally(() => {
			settled = true;
		});
		await expect.poll(() => document.querySelector('[data-slot="ask-body"]')).not.toBeNull();
		await animationsSettled();
		await page.getByRole('button', { name: 'Save' }).click();

		const started = performance.now();
		while (!settled && performance.now() - started < 3000) {
			await new Promise((resolve) => setTimeout(resolve, 20));
		}
		expect(settled).toBe(true);
		await expect(result).resolves.toMatchObject({ submitted: true });
		expect(document.querySelector('[data-slot="ask-body"]')).toBeNull();
	});
});
