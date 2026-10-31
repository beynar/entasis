import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
import type { FieldState, FieldValidatorResult, ValidationMode } from './field.state.svelte.js';
import type { FieldMessageOverrides } from './field.messages.js';
import type { FieldThemeProps } from './field.theme.js';
import type { Density, Sizes } from '$lib/types/theme.js';
import type { FormInputRegistry } from '../Form/form.js';
import type { Address } from '../../Address/address.js';

export type KeyValuePair = { key: string; value: string };

export type TextInputType = 'text' | 'password' | 'email' | 'url' | 'textarea' | 'phone';
export type RichTextInputType = 'rich-text';
export type NumberInputType = 'number' | 'slider';
export type RatingInputType = 'rating';
export type VoiceInputType = 'voice';
export type SignatureInputType = 'signature';
export type AddressInputType = 'address';
export type SliderRangeInputType = 'slider-range';
export type TagInputType = 'tag';
export type TagGroupInputType = 'tag-group';
export type KeyValueInputType = 'keyvalue';
export type PinInputType = 'pin';
export type DateInputType = 'datetime' | 'date';
export type TimeInputType = 'time';
export type BooleanInputType = 'switch' | 'checkbox';
export type SingleOptionInputType = 'select' | 'radio' | 'combobox';
export type MultipleChoiceInputType = 'checkboxes' | 'select-multiple';
export type FileInputType = 'file' | 'files';
export type CalendarInputType = 'calendar' | 'calendar-range';
export type ColorInputType = 'color';
export type FieldLabelPosition = 'top' | 'left';
export type FieldAttributes = Omit<HTMLAttributes<HTMLElement>, 'class' | 'id'>;
/**
 * Native attributes a button-rooted control (Checkbox, Switch) accepts through `inputAttrs`, such
 * as `aria-label`, `aria-describedby`, `title`, `data-*` and event handlers. The control keeps its
 * identity, role, state and form attributes. An `aria-label` here names the control instead of the
 * field label.
 */
export type FieldButtonAttributes = Omit<
	HTMLButtonAttributes,
	| 'class'
	| 'disabled'
	| 'form'
	| 'id'
	| 'name'
	| 'role'
	| 'type'
	| 'value'
	| 'aria-checked'
	| 'aria-disabled'
	| 'aria-readonly'
	| 'aria-required'
>;

export type InputType =
	| FileInputType
	| SliderRangeInputType
	| DateInputType
	| ColorInputType
	| NumberInputType
	| RatingInputType
	| VoiceInputType
	| SignatureInputType
	| AddressInputType
	| TimeInputType
	| TextInputType
	| RichTextInputType
	| BooleanInputType
	| MultipleChoiceInputType
	| TagInputType
	| TagGroupInputType
	| KeyValueInputType
	| PinInputType
	| SingleOptionInputType
	| CalendarInputType;

/** Input types an app registered: the keys of its `FormInputRegistry` augmentation. */
export type RegisteredInputType = Extract<keyof FormInputRegistry, string>;

/** Every type a field can carry: the built-in inputs and the ones an app registered. */
export type FieldType = InputType | RegisteredInputType;

type RegisteredInputValue<T extends RegisteredInputType> = FormInputRegistry[T] extends {
	value: infer Value;
}
	? Value
	: unknown;

export type FieldValue<T extends FieldType> = T extends RegisteredInputType
	? RegisteredInputValue<T>
	: T extends 'file'
		? File
		: T extends 'files'
			? File[]
			: T extends DateInputType
				? Date
				: T extends SliderRangeInputType
					? number[]
					: T extends NumberInputType
						? number
						: T extends RatingInputType
							? number
							: T extends VoiceInputType
								? Blob
								: T extends SignatureInputType
									? string
									: T extends AddressInputType
										? Address
										: T extends TimeInputType
											? number
											: T extends TextInputType
												? string
												: T extends RichTextInputType
													? string
													: T extends PinInputType
														? string
														: T extends BooleanInputType
															? boolean
															: T extends MultipleChoiceInputType
																? string[]
																: T extends TagInputType
																	? string[]
																	: T extends TagGroupInputType
																		? string | string[] | null
																		: T extends KeyValueInputType
																			? KeyValuePair[]
																			: T extends SingleOptionInputType
																				? string
																				: T extends 'calendar'
																					? Date
																					: T extends 'calendar-range'
																						? [Date | null, Date | null]
																						: T extends ColorInputType
																							? string
																							: never;

export type InputProps<T extends FieldType> = WithSlot<
	{
		/** Form field name, used as the key when the input is part of a Form. */
		name?: string;
		/** Marks the field as required for validation and shows the required indicator. */
		required?: boolean;
		/**
		 * Disables the input, preventing interaction and focus. A disabled Form, FormGroup or
		 * fieldset Field around the input disables it too; disabled fields skip validation.
		 */
		disabled?: boolean;
		/**
		 * Shows the value without letting the user change it: the control stays focusable and is
		 * announced as read-only, and the value still validates and submits. A read-only Form or
		 * FormGroup around the input makes it read-only too.
		 */
		readOnly?: boolean;
		/**
		 * Id of the native `<form>` the field submits with when it is rendered outside that form,
		 * like the HTML `form` attribute. The field's native controls and hidden inputs join that
		 * form, and its reset returns the field to its initial value.
		 */
		form?: string;
		/** Geometry and typography of the field control and label. */
		size?: Sizes;
		/** Internal spacing between field regions, labels, and adornments. */
		density?: Density;
		/** Places the field label above the control, or to its left from 32rem of the field's own width. */
		labelPosition?: FieldLabelPosition;
		/** Whether the field is rendered; when false the field is hidden from the form. */
		visible?: boolean;
		/**
		 * Validates the value; messages or true mark it invalid, false/null/undefined accept it.
		 * It may return a promise: the field reads as neither valid nor invalid while the promise
		 * is pending, submit waits for it, and a result for an older value is dropped. A rejected
		 * promise marks the field invalid with the generic message.
		 */
		onValidate?: (value: FieldValue<T>) => FieldValidatorResult;
		/**
		 * When the field validates by itself, overriding the Form's `validationMode`: `'submit'`
		 * (the default) waits for the first submit attempt and then re-validates every edit,
		 * `'blur'` validates when focus leaves the field, `'change'` validates on every change.
		 * A field that shows an error always re-validates as it is edited.
		 */
		validationMode?: ValidationMode;
		/**
		 * Milliseconds an edit waits before the validation it triggers runs, so an async
		 * `onValidate` is not called on every keystroke. Submit and blur validate at once.
		 */
		validationDebounce?: number;
		/**
		 * Replaces catalog validation messages for this field: a string, or a function for the
		 * messages that receive a limit, as in `{ required: 'Enter your name' }` or
		 * `{ tooShort: (min) => 'Use ' + min + ' characters or more' }`.
		 */
		messages?: FieldMessageOverrides;
		/** Called whenever the field value changes. */
		onValueChange?: (value: FieldValue<T> | null) => void;
		/** Native attributes applied to the Field wrapper. */
		fieldAttrs?: FieldAttributes;
		/** CSS classes applied to the field's root element. */
		class?: string;
		/** Theme overrides for the field's structural parts (label, input, error, ...). */
		theme?: FieldThemeProps;
		/** The field's value, bindable with `bind:value`. */
		value?: FieldValue<T> | null;
		/** Initial field value when `value` is omitted. */
		defaultValue?: FieldValue<T> | null;
		/** Validation errors to display; `true` marks the field as errored without a message. */
		errors?: string[] | boolean;
		/**
		 * Whether focus is inside the field, including popups it opened, bindable with
		 * `bind:focused`.
		 */
		focused?: boolean;
	},
	| 'header'
	| 'label'
	| 'suffix'
	| 'prefix'
	| 'actions'
	| 'description'
	| 'helper'
	| 'footer'
	| 'error'
	| 'errorsContainer'
>;

export type FieldProps<T extends FieldType> = Omit<
	InputProps<T>,
	| 'type'
	| 'name'
	| 'required'
	| 'disabled'
	| 'readOnly'
	| 'messages'
	| 'visible'
	| 'onValidate'
	| 'onValueChange'
	| 'defaultValue'
	| 'value'
	| 'errors'
	| 'focused'
> & {
	/** Native wrapper element; use fieldset for a group of controls. */
	as?: string;
	/**
	 * Attachment applied to the input container, the visible box, rather than the field root
	 * (which also holds the label and description). Pass a popover's `reference` here so its panel
	 * opens against the box, not below the description.
	 */
	anchor?: Attachment<HTMLElement>;
	/** Control ID associated with the label, or false for an aria-labelledby label. */
	labelFor?: string | false;
	/** Custom control content composed with the shared field controller. */
	children: Snippet;
	/** Shared value, validation, and accessibility controller. */
	field: FieldState<T>;
};

export const fieldStructure = `
<Field>
	<Header>
		<Label />
		<Actions />
	</Header>
	<InputContainer>
		<Prefix />
		<Input />
		<Suffix />
	</InputContainer>
	<Footer>
		<Description />
		<Helper />
	</Footer>
    <ErrorsContainer>
        <Error />
    </ErrorsContainer>
</Field>
`;

export const llmDescription = `
The field component is a versatile wrapper component for form inputs.
The field component is used to wrap form inputs and provide a consistent look and feel.
It's also used to provide a consistent way to handle errors and validation.
Use it directly with createFieldState for standalone custom controls, or use a Form
type: 'field' entry to receive a registered controller in a snippet.

The field component is composed of the following parts:
- Header
- InputContainer
- Footer
- ErrorsContainer
- Error
- Description
- Helper

To customize the field component, you can use the following snippets:

- header: it is the wrapper for the label and actions.
- label: it is the label for the field.
- actions: it is the actions for the field.
- footer: it is the wrapper for the description and helper.
- errorsContainer: it is the wrapper for the error.
- error: it is the error for the field.
- description: it is the description for the field.
- helper: it is the helper for the field.

Compose snippets with the field controller captured in the parent component.

`;
