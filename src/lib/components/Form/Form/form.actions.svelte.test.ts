import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import FormActionsHarness from './FormActionsHarness.test.svelte';

const deferred = () => {
	let resolve!: () => void;
	const promise = new Promise<void>((done) => (resolve = done));
	return { promise, resolve };
};

describe('Form actions while submitting', () => {
	test('keep the pressed action focusable and busy instead of natively disabled', async () => {
		const pending = deferred();
		const onSubmit = vi.fn(() => pending.promise);
		render(FormActionsHarness, { props: { onSubmit } });

		const save = screen.getByRole('button', { name: 'Save' });
		save.focus();
		await fireEvent.click(save);

		await waitFor(() => expect(save).toHaveAttribute('aria-busy', 'true'));
		expect(onSubmit).toHaveBeenCalledOnce();
		// Native `disabled` would drop keyboard focus to the page body.
		expect(save).not.toBeDisabled();
		expect(save).toHaveAttribute('aria-disabled', 'true');
		expect(document.activeElement).toBe(save);

		pending.resolve();
		await waitFor(() => expect(save).not.toHaveAttribute('aria-busy'));
		expect(save).not.toHaveAttribute('aria-disabled');
		expect(document.activeElement).toBe(save);
	});

	test('ignore a second activation while the submit runs', async () => {
		const pending = deferred();
		const onSubmit = vi.fn(() => pending.promise);
		const onAction = vi.fn();
		render(FormActionsHarness, { props: { onSubmit, onAction } });

		const save = screen.getByRole('button', { name: 'Save' });
		await fireEvent.click(save);
		await waitFor(() => expect(save).toHaveAttribute('aria-busy', 'true'));
		// Enter or Space on the focused button dispatches another click.
		save.click();

		expect(onAction).toHaveBeenCalledOnce();
		expect(onSubmit).toHaveBeenCalledOnce();
		pending.resolve();
	});

	test('still render an action disabled on its own as natively disabled', () => {
		render(FormActionsHarness, { props: { onSubmit: vi.fn() } });

		const archive = screen.getByRole('button', { name: 'Archive' });
		expect(archive).toBeDisabled();
		expect(archive).not.toHaveAttribute('aria-busy');
	});
});
