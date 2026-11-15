// `popconfirm()` in real browsers: the click's own action waits for an answer given in a small
// popover anchored to the element, and runs, replays or is dropped accordingly.
import { afterEach, describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './PopconfirmHarness.test.svelte';

const dialog = () => document.querySelector<HTMLElement>('dialog[open], [role="dialog"]');
const question = () => dialog()?.textContent ?? '';
/** Presses a button of the open question. */
const answer = async (name: string) => {
	const button = [...(dialog()?.querySelectorAll('button') ?? [])].find(
		(candidate) => candidate.textContent?.trim() === name
	);
	if (!button) throw new Error(`no "${name}" button in the question`);
	await userEvent.click(button);
};

afterEach(() => {
	if (location.hash) history.replaceState(null, '', location.pathname + location.search);
});

describe('popconfirm', () => {
	test('asks beside the clicked button, and runs the handler with the original event on Confirm', async () => {
		const log: string[] = [];
		await render(Harness, { log });
		const trigger = page.getByRole('button', { name: 'Delete', exact: true });
		const triggerElement = trigger.element() as HTMLElement;
		await trigger.click();
		await expect.poll(dialog).not.toBeNull();
		expect(question()).toContain('Delete the file?');
		expect(log).toEqual([]);

		// Anchored to the button: above it, horizontally overlapping it.
		const panel = dialog()!.getBoundingClientRect();
		const button = triggerElement.getBoundingClientRect();
		expect(panel.bottom).toBeLessThanOrEqual(button.top + 1);
		expect(panel.right).toBeGreaterThan(button.left);
		expect(panel.left).toBeLessThan(button.right);

		await answer('Delete');
		await expect.poll(() => log).toEqual(['deleted:click:Delete']);
		await expect.poll(dialog).toBeNull();
	});

	test('Cancel, Escape and a press outside drop the action and give focus back', async () => {
		const log: string[] = [];
		await render(Harness, { log });
		const trigger = page.getByRole('button', { name: 'Delete', exact: true });
		const triggerElement = trigger.element() as HTMLElement;

		await trigger.click();
		await expect.poll(dialog).not.toBeNull();
		await answer('Cancel');
		await expect.poll(dialog).toBeNull();

		await userEvent.click(triggerElement);
		await expect.poll(dialog).not.toBeNull();
		await userEvent.keyboard('{Escape}');
		await expect.poll(dialog).toBeNull();
		expect(document.activeElement).toBe(triggerElement);

		await userEvent.click(triggerElement);
		await expect.poll(dialog).not.toBeNull();
		await userEvent.click(document.body, { position: { x: 5, y: 5 } });
		await expect.poll(dialog).toBeNull();
		expect(log).toEqual([]);
	});

	test('an async handler keeps Confirm loading until it settles', async () => {
		const log: string[] = [];
		await render(Harness, { log, slow: true });
		await page.getByRole('button', { name: 'Delete', exact: true }).click();
		await expect.poll(dialog).not.toBeNull();
		await answer('Delete');
		await expect
			.poll(() => dialog()?.querySelector('[aria-busy="true"], [data-loading="true"]'))
			.not.toBeNull();
		await expect.poll(() => log, { timeout: 2000 }).toEqual(['deleted:click:Delete']);
		await expect.poll(dialog).toBeNull();
	});

	test('without a handler, Confirm replays the click: the link is followed', async () => {
		await render(Harness, { log: [] });
		await page.getByRole('link', { name: 'Leave' }).click();
		await expect.poll(dialog).not.toBeNull();
		expect(location.hash).toBe('');
		await answer('Confirm');
		await expect.poll(() => location.hash).toBe('#replayed');
	});

	test('without a handler, Confirm replays the click: the form is submitted', async () => {
		const log: string[] = [];
		await render(Harness, { log });
		await page.getByRole('button', { name: 'Submit' }).click();
		await expect.poll(dialog).not.toBeNull();
		expect(question()).toContain('Are you sure?');
		expect(log).toEqual([]);
		await answer('Confirm');
		await expect.poll(() => log).toEqual(['submitted']);
	});
});
