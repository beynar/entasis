import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, expectTypeOf, test, vi } from 'vitest';
import { ask } from '../Ask/ask.js';
import type { AskResult } from '../Ask/ask.props.js';
import MoneyInput from './MoneyInput.test.svelte';
import RegisteredInputHarness from './RegisteredInputHarness.test.svelte';
import { flattenFormInputs, type FormInputs, type InferFormValue } from './form.js';
import { registerFormInputs } from './form.registry.js';

type TestMoney = { amount: number; currency: string };

// What an app writes once: the value and props of its input type, for every Form and ask().
declare module './form.js' {
	interface FormInputRegistry {
		'test-money': { value: TestMoney; props: { currencies?: readonly string[] } };
	}
}

let unregister: () => void;
const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
	unregister = registerFormInputs({
		'test-money': {
			component: MoneyInput,
			isEmpty: (value) => value?.amount === undefined || Number.isNaN(value.amount),
			validate: (value) => (value.amount < 0 ? 'Must not be negative' : null)
		}
	});
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
	unregister();
});

const inputs = {
	price: { type: 'test-money', label: 'Price', required: true, currencies: ['EUR', 'USD'] },
	discount: { type: 'test-money', label: 'Discount' }
} as const satisfies FormInputs;

describe('registered form inputs', () => {
	test('entries are plain data whose value type comes from the registry', () => {
		expectTypeOf<InferFormValue<typeof inputs>>().toEqualTypeOf<{
			price: TestMoney;
			discount: TestMoney | null;
		}>();
		expect(JSON.parse(JSON.stringify(inputs))).toEqual(inputs);
		expect(flattenFormInputs(inputs).map(({ name }) => name)).toEqual(['price', 'discount']);
	});

	test('render inside Field, update the form value, and submit it', async () => {
		const onSubmit = vi.fn();
		render(RegisteredInputHarness, { props: { onSubmit } });

		// Field's label names the control the component attached the field to.
		const amount = screen.getByLabelText('Price');
		expect(amount).toHaveAttribute('name', 'price');
		expect(amount).toHaveAttribute('required');

		await fireEvent.input(amount, { target: { value: '12' } });
		await fireEvent.change(screen.getByRole('combobox', { name: 'Currency' }), {
			target: { value: 'USD' }
		});
		await waitFor(() =>
			expect(screen.getByTestId('live-value')).toHaveTextContent(
				'{"price":{"amount":12,"currency":"USD"},"note":null}'
			)
		);

		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({
				price: { amount: 12, currency: 'USD' },
				note: null
			})
		);
	});

	test('required uses the definition isEmpty, then its validate runs', async () => {
		const onSubmit = vi.fn();
		render(RegisteredInputHarness, { props: { onSubmit } });

		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(onSubmit).not.toHaveBeenCalled();
		expect(await screen.findByRole('alert')).toBeInTheDocument();

		await fireEvent.input(screen.getByLabelText('Price'), { target: { value: '-3' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(await screen.findByText('Must not be negative')).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('ask() renders registered inputs and resolves their typed value', async () => {
		render(RegisteredInputHarness, { props: { onSubmit: vi.fn() } });
		const result = ask({
			title: 'Set a price',
			confirm: 'Save',
			cancel: 'Cancel',
			inputs: { price: { type: 'test-money', label: 'Asked price', required: true } }
		});
		expectTypeOf(result).resolves.toEqualTypeOf<
			AskResult<{ readonly price: { type: 'test-money'; label: string; required: true } }>
		>();

		await fireEvent.input(await screen.findByLabelText('Asked price'), {
			target: { value: '40' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		await expect(result).resolves.toEqual({
			submitted: true,
			value: { price: { amount: 40, currency: 'EUR' } }
		});
	});

	test('registering a built-in type is refused', () => {
		expect(() =>
			registerFormInputs({ text: { component: MoneyInput } } as unknown as Parameters<
				typeof registerFormInputs
			>[0])
		).toThrow(/built-in input type/);
	});
});
