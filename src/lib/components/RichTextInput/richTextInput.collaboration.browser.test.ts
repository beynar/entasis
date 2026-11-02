// RichTextInput on a shared edytor document, in real browsers (Chromium and WebKit): two inputs
// on one document show each other's edits and publish them as their own value; the document,
// not a parent's value, is the source of truth.
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './RichTextInputCollaborationHarness.test.svelte';

const editor = (which: 'first' | 'second') =>
	document.querySelector<HTMLElement>(`[data-testid="${which}"] [data-rich-text-input-editor]`)!;
const value = (which: 'first' | 'second') =>
	document.querySelector(`[data-testid="${which}-value"]`)!.textContent;
const button = (name: string) => page.getByRole('button', { name });

describe('RichTextInput collaboration', () => {
	test('the first value seeds the shared document, and both inputs show it', async () => {
		render(Harness);
		await expect.poll(() => editor('second').querySelector('strong')?.textContent).toBe('draft');
		expect(editor('first').textContent).toBe('Shared draft text');
		await expect.poll(() => value('second')).toBe('Shared **draft** text');
	});

	test('an edit in one input reaches the other, which publishes it as its value', async () => {
		const onSecondChange = vi.fn();
		render(Harness, { props: { onSecondChange } });
		await expect.poll(() => editor('second').textContent).toBe('Shared draft text');
		await userEvent.click(button('Focus first'));
		await userEvent.keyboard(' and more');
		await expect.poll(() => editor('second').textContent).toBe('Shared draft text and more');
		await expect.poll(() => value('second')).toBe('Shared **draft** text and more');
		expect(onSecondChange).toHaveBeenLastCalledWith({
			markdown: 'Shared **draft** text and more',
			tokens: [],
			isEmpty: false
		});
	});

	test("a parent's new value does not replace the shared document", async () => {
		render(Harness);
		await expect.poll(() => editor('second').textContent).toBe('Shared draft text');
		await userEvent.click(button('Set first'));
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(editor('first').textContent).toBe('Shared draft text');
		expect(editor('second').textContent).toBe('Shared draft text');
	});

	test('clear() empties the document for every input', async () => {
		render(Harness);
		await expect.poll(() => editor('second').textContent).toBe('Shared draft text');
		await userEvent.click(button('Clear first'));
		await expect.poll(() => editor('second').textContent).toBe('');
		await expect.poll(() => value('second')).toBe('');
	});
});
