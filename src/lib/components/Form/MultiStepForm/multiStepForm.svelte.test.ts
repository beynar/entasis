import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import MultiStepFormHarness from './MultiStepFormHarness.test.svelte';

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

const name = () => screen.getByRole('textbox', { name: 'Name' });
const next = () => screen.getByRole('button', { name: 'Next' });

describe('MultiStepForm submission', () => {
	test('the pressed button stays focusable and keeps focus while a step submits', async () => {
		const submitting = deferred<void>();
		render(MultiStepFormHarness, { props: { onSubmitStep: () => submitting.promise } });
		await fireEvent.input(name(), { target: { value: 'Ada' } });
		const button = next();
		button.focus();
		await fireEvent.click(button);
		await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'true'));

		// Loading refuses activation without a native `disabled`, which would drop focus to <body>.
		expect(button).not.toHaveAttribute('disabled');
		expect(button).toHaveAttribute('aria-disabled', 'true');
		expect(button).toHaveFocus();

		submitting.resolve();
		await waitFor(() => expect(button).not.toHaveAttribute('aria-busy'));
	});

	test('Next waits for an async validator, then moves on or stops', async () => {
		const pending = deferred<string | null>();
		const onSubmitStep = vi.fn();
		render(MultiStepFormHarness, { props: { onValidate: () => pending.promise, onSubmitStep } });
		await fireEvent.input(name(), { target: { value: 'Ada' } });
		await fireEvent.click(next());
		await tick();
		expect(onSubmitStep).not.toHaveBeenCalled();
		expect(onSubmitStep).not.toHaveBeenCalled();
		pending.resolve('Taken');
		await waitFor(() => expect(screen.getByText('Taken')).toBeInTheDocument());
		expect(onSubmitStep).not.toHaveBeenCalled();
		expect(name()).toHaveFocus();
	});

	test('Next continues once the async validator accepts', async () => {
		const onSubmitStep = vi.fn();
		render(MultiStepFormHarness, {
			props: { onValidate: () => Promise.resolve(null), onSubmitStep }
		});
		await fireEvent.input(name(), { target: { value: 'Ada' } });
		await fireEvent.click(next());
		await waitFor(() => expect(onSubmitStep).toHaveBeenCalledOnce());
	});

	test('submitting a step from the keyboard validates it once', async () => {
		const onValidate = vi.fn(() => Promise.resolve(null));
		const onSubmitStep = vi.fn();
		render(MultiStepFormHarness, { props: { onValidate, onSubmitStep } });
		await fireEvent.input(name(), { target: { value: 'Ada' } });
		await fireEvent.keyDown(name(), { key: 'Enter' });
		await waitFor(() => expect(onSubmitStep).toHaveBeenCalledOnce());
		expect(onValidate).toHaveBeenCalledOnce();
	});
});
