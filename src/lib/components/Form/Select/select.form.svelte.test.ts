import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import FormValidationHarness from '../Form/FormValidationHarness.test.svelte';
import type { FormState } from '../Form/form.state.svelte.js';

const scrollIntoView = Element.prototype.scrollIntoView;
const animate = Element.prototype.animate;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
	Element.prototype.animate = function entasisFiniteAnimate() {
		const animation = {
			onfinish: null as null | (() => void),
			oncancel: null,
			cancel() {},
			finish() {},
			play() {},
			pause() {},
			finished: Promise.resolve()
		};
		setTimeout(() => animation.onfinish?.(), 0);
		return animation as unknown as Animation;
	};
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
	Element.prototype.animate = animate;
});

const items = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'banana', label: 'Banana' },
	{ value: 'cherry', label: 'Cherry' }
];

// The Form's select-multiple field type (SC-7): a Select with `multiple` inside a Form.
describe('Form select-multiple', () => {
	const mount = (extra: Record<string, unknown> = {}) => {
		let form: FormState | undefined;
		render(FormValidationHarness, {
			props: {
				inputs: {
					fruits: { type: 'select-multiple', label: 'Fruits', required: true, items, ...extra }
				},
				onForm: (next: FormState) => {
					form = next;
				},
				actions: [{ children: 'Submit', onAction: (state: FormState) => state.submit() }]
			}
		});
		return () => form!;
	};
	const trigger = () => screen.getByRole('combobox', { name: 'Fruits' });
	const value = () => JSON.parse(screen.getByTestId('value').textContent ?? '{}');

	test('toggling options without closing writes an array into the form value', async () => {
		mount();
		await fireEvent.click(trigger());
		await screen.findByRole('listbox');
		expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');

		await fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
		await fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
		expect(trigger()).toHaveAttribute('aria-expanded', 'true');
		await waitFor(() => expect(value().fruits).toEqual(['apple', 'cherry']));

		await fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
		await waitFor(() => expect(value().fruits).toEqual(['apple']));
	});

	test('an empty required selection reports the required message on submit', async () => {
		mount();
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		await waitFor(() =>
			expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
		);
	});

	test('a chosen selection submits as an array of values', async () => {
		const onSubmit = vi.fn();
		let form: FormState | undefined;
		render(FormValidationHarness, {
			props: {
				inputs: { fruits: { type: 'select-multiple', label: 'Fruits', required: true, items } },
				onForm: (next: FormState) => {
					form = next;
				},
				onSubmit,
				actions: [{ children: 'Submit', onAction: (state: FormState) => state.submit() }]
			}
		});
		await fireEvent.click(trigger());
		await fireEvent.click(await screen.findByRole('option', { name: 'Banana' }));
		await fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalled());
		expect(JSON.stringify(onSubmit.mock.calls[0])).toContain('["banana","cherry"]');
		expect(form).toBeDefined();
	});
});
