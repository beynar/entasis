import type { Snippet } from 'svelte';
import { describe, expect, expectTypeOf, test } from 'vitest';
import type { ComboboxProps, ComboboxValueChangePayload } from '../Combobox/combobox.props.js';
import type { FieldState } from '../Field/field.state.svelte.js';
import { flattenFormInputs, type FormInputs, type InferFormValue } from './form.js';

const fieldSnippet = null as unknown as Snippet<[field: FieldState<'text'>]>;
const displaySnippet = null as unknown as Snippet;
const inputs = {
	displayName: {
		type: 'field',
		fieldType: 'text',
		required: true,
		snippet: fieldSnippet
	},
	status: {
		type: 'custom',
		snippet: displaySnippet
	}
} as const satisfies FormInputs;

describe('Form field entry types', () => {
	test('infers the field value and excludes display-only custom entries', () => {
		expectTypeOf<InferFormValue<typeof inputs>>().toEqualTypeOf<{
			displayName: string;
		}>();
		expect(flattenFormInputs(inputs).map(({ name }) => name)).toEqual(['displayName']);
	});

	test('exposes Combobox value and option context as one payload', () => {
		expectTypeOf<NonNullable<ComboboxProps['onValueChange']>>().toEqualTypeOf<
			(payload: ComboboxValueChangePayload) => void
		>();
	});
});
