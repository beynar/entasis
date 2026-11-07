// A custom editor in a real engine: who Escape belongs to, where focus goes, and `api.isEditing`.
import { expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './DataTableCustomEditorHarness.test.svelte';

const cell = () => document.querySelector<HTMLElement>('td[data-column-id="at"]')!;
const editorInput = () => cell().querySelector<HTMLInputElement>('input:not([type="hidden"])');
const picker = () =>
	[...document.querySelectorAll<HTMLElement>('dialog[open]')].find(
		(dialog) => !dialog.querySelector('[role="tooltip"]')
	) ?? null;
const editing = page.getByTestId('editing');

const openEditor = async (props = {}) => {
	await render(Harness, { props });
	await expect.poll(cell).not.toBeNull();
	await expect.element(editing).toHaveTextContent('no');
	cell().focus();
	await userEvent.keyboard('{Enter}');
	await expect.poll(editorInput).not.toBeNull();
	await expect.poll(() => document.activeElement).toBe(editorInput());
	await expect.element(editing).toHaveTextContent('yes');
};

test('Escape closes the list first, and the next one cancels', async () => {
	await openEditor();
	await userEvent.click(editorInput()!);
	await expect.poll(picker).not.toBeNull();
	await userEvent.keyboard('{Escape}');
	await expect.poll(picker).toBeNull();
	expect(editorInput()).not.toBeNull();
	await expect.element(editing).toHaveTextContent('yes');

	await userEvent.keyboard('{Escape}');
	await expect.element(editing).toHaveTextContent('no');
	await expect.poll(() => document.activeElement).toBe(cell());
});

test('with no list open, one Escape cancels', async () => {
	await openEditor();
	await userEvent.keyboard('{Escape}');
	await expect.element(editing).toHaveTextContent('no');
	await expect.poll(() => document.activeElement).toBe(cell());
});

test('commit() from inside the editor gives focus back to the cell', async () => {
	const onCellCommit = vi.fn();
	await openEditor({ onCellCommit });
	await userEvent.keyboard('{Enter}');
	await expect.element(editing).toHaveTextContent('no');
	await expect.poll(() => document.activeElement).toBe(cell());
});

test('cancel() from inside the editor gives focus back to the cell', async () => {
	await openEditor();
	await userEvent.keyboard('q');
	await expect.element(editing).toHaveTextContent('no');
	await expect.poll(() => document.activeElement).toBe(cell());
});

test('a commit on blur leaves focus where the person put it', async () => {
	await openEditor({ commitOnBlur: true });
	(page.getByTestId('outside').element() as HTMLElement).focus();
	await expect.element(editing).toHaveTextContent('no');
	await new Promise((resolve) => setTimeout(resolve, 100));
	expect(document.activeElement).toBe(page.getByTestId('outside').element());
});
