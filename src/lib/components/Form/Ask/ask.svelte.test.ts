import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { ask } from './ask.js';
import AskHarness from './AskHarness.test.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => (resolve = res));
	return { promise, resolve };
};

describe('ask()', () => {
	test('Confirm keeps keyboard focus while the submission runs', async () => {
		render(AskHarness);
		const submitting = deferred<void>();
		const outcome = ask({
			title: 'Rename',
			inputs: { name: { type: 'text', label: 'Name', required: true } },
			confirm: 'Save',
			cancel: 'Cancel',
			onSubmit: () => submitting.promise
		});
		const name = await screen.findByRole('textbox', { name: 'Name' });
		await fireEvent.input(name, { target: { value: 'Ada' } });
		const confirm = screen.getByRole('button', { name: 'Save' });
		confirm.focus();
		await fireEvent.click(confirm);
		await waitFor(() => expect(confirm).toHaveAttribute('aria-busy', 'true'));

		expect(confirm).not.toHaveAttribute('disabled');
		expect(confirm).toHaveAttribute('aria-disabled', 'true');
		expect(confirm).toHaveFocus();

		submitting.resolve();
		await expect(outcome).resolves.toEqual({ submitted: true, value: { name: 'Ada' } });
	});

	test('disabled fields are left out of the result', async () => {
		render(AskHarness);
		const outcome = ask({
			title: 'Invite',
			inputs: {
				email: { type: 'email', label: 'Email', required: true },
				role: {
					type: 'text',
					label: 'Role',
					defaultValue: 'viewer',
					disabled: true,
					required: true
				}
			},
			confirm: 'Send',
			cancel: 'Cancel'
		});
		await fireEvent.input(await screen.findByRole('textbox', { name: 'Email' }), {
			target: { value: 'ada@example.com' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
		const result = await outcome;
		expect(result).toEqual({ submitted: true, value: { email: 'ada@example.com' } });
		expect(result.value).not.toHaveProperty('role');
	});

	test('validationMode reaches the fields', async () => {
		render(AskHarness);
		const outcome = ask({
			title: 'Rename',
			inputs: { name: { type: 'text', label: 'Name', required: true } },
			validationMode: 'change',
			confirm: 'Save',
			cancel: 'Cancel'
		});
		const name = await screen.findByRole('textbox', { name: 'Name' });
		await fireEvent.input(name, { target: { value: 'Ada' } });
		await fireEvent.input(name, { target: { value: '' } });
		await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'));
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		await outcome;
	});
});
