// What consumers infer from FormState.value: its named type, field by field. The emitted declaration
// keeps that name (an inferred member expanded to 240 KB here); `check:declaration-size` guards it.
import { describe, expect, test } from 'vitest';
import type { FormState } from './form.state.svelte.js';
import type { LiveFormValue } from './form.js';

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const same = <T extends true>(check?: T) => check;

type Inputs = {
	name: { type: 'text'; label: string; required: true };
	age: { type: 'number'; label: string };
};

describe('FormState.value', () => {
	test('is LiveFormValue, and reads as the fields it holds', () => {
		same<Equal<FormState<Inputs>['value'], LiveFormValue<Inputs>>>();
		const value = {} as FormState<Inputs>['value'];
		const name: string | undefined = value.name;
		const age: number | null | undefined = value.age;
		// @ts-expect-error a name is not a number
		const wrong: number | null | undefined = value.name;
		expect([name, age, wrong]).toEqual([undefined, undefined, undefined]);
	});
});
