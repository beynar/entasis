// `submitDisabled` holds sending while the editor stays usable: an app dictating into the editor
// keeps its caret and its text, and nothing leaves until it lets go.
import { expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './AIComposerSubmitDisabledHarness.test.svelte';

const editor = () => document.querySelector<HTMLElement>('[role="textbox"][contenteditable]')!;
const send = () =>
	page.getByRole('button', { name: 'Send message' }).element() as HTMLButtonElement;

test('held sending keeps the editor, actions and attachments usable', async () => {
	const onSubmit = vi.fn();
	const screen = await render(Harness, { submitDisabled: true, onSubmit });

	await userEvent.click(editor());
	await userEvent.keyboard('Hello');
	await expect.poll(() => editor().textContent).toBe('Hello');
	expect(editor().getAttribute('contenteditable')).toBe('true');
	expect(send().disabled).toBe(true);
	expect(
		(page.getByRole('button', { name: 'Attach files' }).element() as HTMLButtonElement).disabled
	).toBe(false);

	// The shortcut does nothing; the app's own action still writes into the editor.
	await userEvent.keyboard('{Enter}');
	await page.getByRole('button', { name: 'Dictate' }).click();
	await expect.poll(() => editor().textContent).toBe('Hello dictated');
	expect(onSubmit).not.toHaveBeenCalled();

	await screen.rerender({ submitDisabled: false, onSubmit });
	await expect.poll(() => send().disabled).toBe(false);
	await userEvent.click(editor());
	await userEvent.keyboard('{End}{Enter}');
	await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
	expect(onSubmit.mock.calls[0][0].markdown).toBe('Hello dictated');
});

test('held sending also holds the queue while busy, and stop still works', async () => {
	const onSubmit = vi.fn();
	await render(Harness, { submitDisabled: true, busy: true, onSubmit });
	await userEvent.click(editor());
	await userEvent.keyboard('Later');
	const queue = page.getByRole('button', { name: 'Queue message' }).element() as HTMLButtonElement;
	expect(queue.disabled).toBe(true);
	expect(
		(page.getByRole('button', { name: 'Stop response' }).element() as HTMLButtonElement).disabled
	).toBe(false);
	await userEvent.keyboard('{Enter}');
	await new Promise((resolve) => setTimeout(resolve, 50));
	expect(document.querySelector('[data-slot="ai-composer-queue-item"]')).toBeNull();
	expect(editor().textContent).toBe('Later');
});
