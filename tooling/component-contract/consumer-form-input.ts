// A consumer registering its own Form input through the published package: augmentation of
// 'entasis/form' types the entries, registerFormInputs supplies the component.
import { ask, registerFormInputs, type FormInputs, type InferFormValue } from 'entasis/form';
import MoneyInput from './MoneyInput.svelte';

export type Money = { amount: number; currency: string };

declare module 'entasis/form' {
	interface FormInputRegistry {
		money: { value: Money; props: { currencies?: readonly string[] } };
	}
}

registerFormInputs({
	money: {
		component: MoneyInput,
		isEmpty: (value) => value?.amount === undefined,
		validate: (value) => (value.amount < 0 ? 'Must not be negative' : null)
	}
});

// Serializable entries, typed by the augmentation.
const inputs = {
	price: { type: 'money', label: 'Price', required: true, currencies: ['EUR', 'USD'] },
	discount: { type: 'money', label: 'Discount' }
} as const satisfies FormInputs;

export const price: InferFormValue<typeof inputs>['price'] = { amount: 1, currency: 'EUR' };
export const discount: InferFormValue<typeof inputs>['discount'] = null;

// @ts-expect-error A registered input takes only the props its registry entry declares.
export const unknownProp = { price: { type: 'money', currency: 'EUR' } } satisfies FormInputs;
// @ts-expect-error An input type nobody registered is not an entry.
export const unknownType = { price: { type: 'unregistered' } } satisfies FormInputs;

export async function askPrice(): Promise<Money | null> {
	const result = await ask({ title: 'Set a price', confirm: 'Save', cancel: 'Cancel', inputs });
	return result.submitted ? result.value.price : null;
}
