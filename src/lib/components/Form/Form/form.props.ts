import type { Snippet } from 'svelte';
import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { Density, Sizes } from '$lib/types/theme.js';
import type { ValidationMode } from '../Field/field.state.svelte.js';
import type {
	FormAction,
	FormErrors,
	FormInputs,
	FormInputsWithState,
	FormSubmitHandler,
	LiveFormValue
} from './form.js';
import type { FormState } from './form.state.svelte.js';
import type { FormThemeProps } from './form.theme.js';

export type FormVariant = 'plain' | 'sectioned' | 'card';
export type FormLayout = 'vertical' | 'horizontal';

export type FormProps<I extends FormInputs> = WithSlot<
	{
		/**
		 * Ordered field, group, action, or custom definitions keyed by entry name.
		 */
		inputs: I & FormInputsWithState<I>;
		/**
		 * Called after successful validation with the visible field values.
		 */
		onSubmit?: FormSubmitHandler<I>;
		/**
		 * Bindable object of current field values, inferred from the inputs configuration.
		 */
		value?: LiveFormValue<I>;
		/** Initial field values when `value` is omitted. */
		defaultValue?: LiveFormValue<I>;
		/** Called once when a user changes the visible field values; parent updates do not emit it. */
		onValueChange?: (value: LiveFormValue<I>) => void;
		/**
		 * Custom content rendered after the fields, receiving the form state instance.
		 */
		children?: Snippet<[form: FormState<I>]>;
		// Bindable
		/**
		 * Bindable form state instance for validation, submission, and value access.
		 */
		form?: FormState<I>;
		/**
		 * Additional CSS classes applied to the form root element.
		 */
		class?: string;
		/**
		 * Size token controlling typography and the default size of fields and actions.
		 */
		size?: Sizes;
		/**
		 * Density token controlling gaps between form regions independently from size.
		 */
		density?: Density;
		/**
		 * Visual presentation of the form root.
		 */
		variant?: FormVariant;
		/**
		 * Field layout; horizontal places labels to the left from 32rem of the field's own width.
		 */
		layout?: FormLayout;
		/**
		 * Theme overrides for form layout, header, groups, actions, and typography.
		 */
		theme?: FormThemeProps;
		/**
		 * Buttons rendered after the form content. Each handler receives the live form state.
		 */
		actions?: FormAction<I>[];
		/**
		 * When fields validate by themselves, besides a submit. `'submit'` (the default) waits for
		 * the first submit attempt and then re-validates each edited field; `'blur'` validates a
		 * field when focus leaves it; `'change'` validates on every change. A field that shows an
		 * error always re-validates as it is edited. A field's own `validationMode` wins.
		 */
		validationMode?: ValidationMode;
		/**
		 * Milliseconds an edit waits before the validation it triggers, so an async `onValidate`
		 * is not called on every keystroke. Submit and blur validate at once.
		 */
		validationDebounce?: number;
		/**
		 * Errors from outside the form, a server response such as a SvelteKit `ActionData`, keyed
		 * by field name. Each shows under its field, survives validation, does not block a
		 * submit, and clears when that field's value next changes. Changing the prop replaces
		 * the errors, and `form.setErrors()` does the same imperatively.
		 */
		errors?: FormErrors<I>;
		/**
		 * Disables every field, for example `disabled={form.loading}` while a submission runs.
		 * Disabled fields skip validation and, as in a native form, are left out of the submitted
		 * value.
		 */
		disabled?: boolean;
		/**
		 * Makes every field read-only: values stay focusable, validated and submitted, but users
		 * cannot change them.
		 */
		readOnly?: boolean;
	},
	'header' | 'title' | 'description' | 'footer',
	FormState<I>
>;
