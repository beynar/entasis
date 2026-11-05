// A press outside a picker closes it and leaves focus where the press put it: taking focus back to
// the input would blur and refocus it, and run whatever listens to either.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PickerFocusHarness from './PickerFocusHarness.test.svelte';

const input = () =>
	document.querySelector<HTMLInputElement>('[data-testid="field"] input:not([type="hidden"])')!;
const panel = () =>
	[...document.querySelectorAll<HTMLElement>('dialog[open]')].find(
		(dialog) => !dialog.querySelector('[role="tooltip"]')
	) ?? null;

describe.each(['color', 'date', 'time'] as const)('%s input', (kind) => {
	const open = async () => {
		await render(PickerFocusHarness, { props: { kind } });
		await expect.poll(input).not.toBeNull();
		await userEvent.click(input());
		// A time field takes typing: its picker opens from the keyboard or its button, not a click.
		if (kind === 'time') await userEvent.keyboard('{ArrowDown}');
		await expect.poll(panel).not.toBeNull();
		await new Promise((resolve) => setTimeout(resolve, 300));
	};

	test('a press on nothing closes the picker and the input stays blurred', async () => {
		await open();
		const focused: number[] = [];
		input().addEventListener('focus', () => focused.push(1));
		await userEvent.click(page.getByTestId('outside'));
		await expect.poll(panel).toBeNull();
		await new Promise((resolve) => setTimeout(resolve, 300));
		expect(document.activeElement).toBe(document.body);
		expect(focused).toEqual([]);
		expect(panel()).toBeNull();
	});

	test('a press on a control leaves focus on that control', async () => {
		await open();
		await userEvent.click(page.getByTestId('other'));
		await expect.poll(panel).toBeNull();
		await new Promise((resolve) => setTimeout(resolve, 300));
		expect(document.activeElement).toBe(page.getByTestId('other').element());
	});

	test('Escape still returns to the input', async () => {
		await open();
		await userEvent.keyboard('{Escape}');
		await expect.poll(panel).toBeNull();
		await expect.poll(() => document.activeElement).toBe(input());
		expect(panel()).toBeNull();
	});
});
