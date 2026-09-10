import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { FieldState } from './field.state.svelte.js';
import type { FieldThemeProps } from './field.theme.js';
import type { Density, Sizes } from '$lib/types/theme.js';

export type KeyValuePair = { key: string; value: string };

export type TextInputType = 'text' | 'password' | 'email' | 'url' | 'textarea' | 'phone';
export type RichTextInputType = 'rich-text';
export type NumberInputType = 'number' | 'slider';
export type RatingInputType = 'rating';
export type VoiceInputType = 'voice';
export type SliderRangeInputType = 'slider-range';
export type TagInputType = 'tag';
export type TagGroupInputType = 'tag-group';
export type KeyValueInputType = 'keyvalue';
export type PinInputType = 'pin';
export type DateInputType = 'datetime' | 'date';
export type TimeInputType = 'time';
export type BooleanInputType = 'switch' | 'checkbox';
export type SingleOptionInputType = 'select' | 'radio' | 'combobox';
export type MultipleChoiceInputType = 'checkboxes';
export type FileInputType = 'file' | 'files';
export type CalendarInputType = 'calendar' | 'calendar-range';
export type ColorInputType = 'color';
export type FieldLabelPosition = 'top' | 'left';
export type FieldAttributes = Omit<HTMLAttributes<HTMLElement>, 'class' | 'id'>;

export type InputType =
	| FileInputType
	| SliderRangeInputType
	| DateInputType
	| ColorInputType
	| NumberInputType
	| RatingInputType
	| VoiceInputType
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

export type FieldValue<T extends InputType> = T extends 'file'
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

export type InputProps<T extends InputType> = WithSlot<
	{
		/** Form field name, used as the key when the input is part of a Form. */
		name?: string;
		/** Marks the field as required for validation and shows the required indicator. */
		required?: boolean;
		/** Disables the input, preventing interaction and focus. */
		disabled?: boolean;
		/** Geometry and typography of the field control and label. */
		size?: Sizes;
		/** Internal spacing between field regions, labels, and adornments. */
		density?: Density;
		/** Places the field label above the control or to its left from the desktop breakpoint. */
		labelPosition?: FieldLabelPosition;
		/** Whether the field is rendered; when false the field is hidden from the form. */
		visible?: boolean;
		/** Validates the value; messages or true mark it invalid, false/null/undefined accept it. */
		onValidate?: (value: FieldValue<T>) => string | string[] | boolean | null | undefined;
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
		/** Whether the field currently holds focus, bindable with `bind:focused`. */
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

export type FieldProps<T extends InputType> = Omit<
	InputProps<T>,
	| 'type'
	| 'name'
	| 'required'
	| 'disabled'
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
