import type { Snippet } from 'svelte';
import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { Density, Sizes } from '$lib/types/theme.js';
import type {
	FormAction,
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
		 * Field layout; horizontal places labels to the left from the desktop breakpoint.
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
	},
	'header' | 'title' | 'description' | 'footer',
	FormState<I>
>;
