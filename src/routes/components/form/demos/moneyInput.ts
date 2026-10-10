// The docs' own app-defined input, set up exactly as a consumer would: augment the registry for
// the types, register the component for Form and ask().
import { registerFormInputs } from 'entasis/form';
import MoneyInput from './MoneyInput.svelte';

export type Money = { amount: number; currency: string };

declare module 'entasis/form' {
	interface FormInputRegistry {
		money: { value: Money; props: { currencies?: string[] } };
	}
}

registerFormInputs({
	money: {
		component: MoneyInput,
		isEmpty: (value) => value?.amount === undefined || Number.isNaN(value.amount),
		validate: (value) => (value.amount < 0 ? 'Enter an amount of zero or more.' : null)
	}
});
