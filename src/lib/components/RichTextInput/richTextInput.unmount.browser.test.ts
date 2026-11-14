// A browser can blur a focused editor while Svelte updates the block that removes it; that blur must
// not write state inside the update (`state_unsafe_mutation`).
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './RichTextInputUnmountHarness.test.svelte';

const errors: unknown[] = [];
const onError = (event: ErrorEvent) => errors.push(event.error ?? event.message);
beforeEach(() => {
	errors.length = 0;
	window.addEventListener('error', onError);
});
afterEach(() => window.removeEventListener('error', onError));

test.each([false, true])(
	'a focused editor leaves the page without unsafe writes (composer: %s)',
	async (composer) => {
		const consoleError = vi.spyOn(console, 'error');
		const screen = await render(Harness, { composer });
		const editor = document.querySelector<HTMLElement>('[role="textbox"][contenteditable]')!;
		await userEvent.click(editor);
		await expect.poll(() => editor.contains(document.activeElement)).toBe(true);

		let blurs = 0;
		editor.addEventListener('blur', () => (blurs += 1));
		window.dispatchEvent(new Event('remove-editor'));
		await expect.poll(() => document.querySelector('[role="textbox"]')).toBeNull();
		await new Promise((resolve) => setTimeout(resolve, 50));
		// The harness blurred it from inside the block's update, as some browsers do on removal.
		expect(blurs).toBe(1);

		const messages = [...errors, ...consoleError.mock.calls.flat()].map(String).join('\n');
		expect(messages).not.toMatch(/state_unsafe_mutation/);
		consoleError.mockRestore();
		screen.unmount();
	}
);
