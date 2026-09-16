import type { FieldLabelPosition, FieldValue, InputProps, InputType } from '../Field/field.js';
import type { FieldState } from '../Field/field.state.svelte.js';
import type { TextInputProps } from '../TextInput/textInput.props.js';
import type { NumberInputProps } from '../NumberInput/numberInput.props.js';
import type { RatingInputProps } from '../RatingInput/ratingInput.props.js';
import type { VoiceInputProps } from '../VoiceInput/voiceInput.props.js';
import type { SliderProps } from '../Slider/slider.props.js';
import type { TextAreaProps } from '../TextArea/textArea.props.js';
import type { SelectProps } from '../Select/select.props.js';
import type { ComboboxProps } from '../Combobox/combobox.props.js';
import type { RadioInputProps } from '../RadioInput/radioInput.props.js';
import type { CheckboxesInputProps } from '../CheckboxesInput/checkboxesInput.props.js';
import type { SwitchProps } from '../Switch/switch.props.js';
import type { PhoneInputProps } from '../PhoneInput/phoneInput.props.js';
import type { CalendarInputProps } from '../Calendar/calendarInput.props.js';
import type { DateInputProps } from '../DateInput/dateInput.props.js';
import type { DateSelectorInputProps } from '../DateSelector/dateSelector.props.js';
import type { ColorInputProps } from '../ColorInput/colorInput.props.js';
import type { ColorPickerInputProps } from '../ColorPicker/colorPicker.props.js';
import type { FileInputProps } from '../File/fileInput.props.js';
import type { TagGroupProps } from '../TagGroup/tagGroup.props.js';
import type { TimeInputProps } from '../TimeInput/timeInput.props.js';
import type { RichTextInputProps } from '../../RichTextInput/richTextInput.props.js';
import type { PasswordInputProps } from '../PasswordInput/passwordInput.props.js';
import type { CheckboxProps } from '../Checkbox/checkbox.props.js';
import type { TagsInputProps } from '../TagsInput/tagsInput.props.js';
import type { KeyValueInputProps } from '../KeyValueInput/keyValueInput.props.js';
import type { PinInputProps } from '../PinInput/pinInput.props.js';
import type { Slot } from '$lib/components/Slot/slot.js';
import type { ButtonProps } from '$lib/components/Button/index.js';
import type { Snippet } from 'svelte';
import type { FormState } from './form.state.svelte.js';

export type MaybePromise<T> = T | Promise<T>;

export type FormValueRecord = Record<string, FieldValue<InputType> | null | undefined>;

type FormVisibility = boolean | ((value: FormValueRecord) => boolean);

type FormButtonAction<State> = ButtonProps & {
	/** Called with the live form state when the action is activated. */
	onAction?: (payload: State) => MaybePromise<unknown>;
};

export type FormAction<I extends FormInputs = FormInputs> = FormButtonAction<FormState<I>>;

// Base FormInput type without dynamic visibility
type BaseFormFieldInput =
	| ({
			type: 'time';
	  } & TimeInputProps)
	| ({
			type: 'phone';
	  } & PhoneInputProps)
	| ({
			type: 'number';
	  } & NumberInputProps)
	| ({
			type: 'rating';
	  } & RatingInputProps)
	| ({
			type: 'voice';
	  } & VoiceInputProps)
	| ({
			type: 'slider';
	  } & SliderProps)
	| ({
			type: 'slider-range';
	  } & SliderProps)
	| ({
			type: 'calendar' | 'calendar-range';
			display?: undefined;
	  } & CalendarInputProps<'calendar' | 'calendar-range'>)
	| ({
			type: 'calendar-range';
			/** Renders the popover DateSelector (range mode) instead of the inline calendar. */
			display: 'selector';
	  } & Omit<DateSelectorInputProps<'range'>, 'mode'>)
	| ({
			type: 'date' | 'datetime';
			display?: undefined;
	  } & DateInputProps)
	| ({
			type: 'date';
			/** Renders the popover DateSelector instead of the text date input. */
			display: 'selector';
	  } & Omit<DateSelectorInputProps<'date'>, 'mode'>)
	| ({
			type: 'color';
			display?: undefined;
	  } & ColorInputProps)
	| ({
			type: 'color';
			/** Renders the inline ColorPicker panel instead of the swatch text input. */
			display: 'picker';
	  } & ColorPickerInputProps)
	| ({
			type: 'text' | 'email' | 'url';
	  } & TextInputProps)
	| ({
			type: 'password';
	  } & PasswordInputProps)
	| ({
			type: 'textarea';
	  } & TextAreaProps)
	| ({
			type: 'rich-text';
	  } & RichTextInputProps)
	| ({
			type: 'select';
	  } & SelectProps)
	| ({
			type: 'combobox';
	  } & ComboboxProps)
	| ({
			type: 'radio';
	  } & RadioInputProps)
	| ({
			type: 'checkboxes';
	  } & CheckboxesInputProps)
	| ({
			type: 'checkbox';
	  } & CheckboxProps)
	| ({
			type: 'switch';
	  } & SwitchProps)
	| ({
			type: 'file';
	  } & FileInputProps<'single'>)
	| ({
			type: 'files';
	  } & FileInputProps<'multiple'>)
	| ({
			type: 'tag-group';
	  } & TagGroupProps)
	| ({
			type: 'tag';
	  } & TagsInputProps)
	| ({
			type: 'keyvalue';
	  } & KeyValueInputProps)
	| ({
			type: 'pin';
	  } & PinInputProps);

// FormInput with dynamic visibility support
// The visibility property can be a boolean or a function that receives the form value
export type FormFieldInput = BaseFormFieldInput extends infer T
	? T extends { visible?: boolean }
		? Omit<T, 'visible'> & {
				visible?: FormVisibility;
			}
		: T
	: never;

type BaseFormRenderableInput = {
	/** Controls visibility using the complete private field-value cache. */
	visible?: FormVisibility;
	/** Additional classes applied to the rendered entry. */
	class?: string;
};

/**
 * The non-generic form state an `action` or `custom` entry declares. An inline `inputs`
 * literal is contextually typed by `FormActionInput`/`FormCustomInput` *before* `I` is
 * inferred, so a handler written there gets this type — and then has to satisfy the
 * `FormInputState<I>` shape `FormInputsWithState<I>` maps it onto. Parameterising on `any`
 * (instead of the `FormInputs` default, whose value map erases to `Record<string, undefined>`)
 * is what keeps the two mutually assignable, so `onAction: (form) => form.validate()` written
 * straight inside `inputs` type-checks.
 */
// Only `any` keeps the contextually-typed handler and `FormInputState<I>` mutually assignable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErasedFormInputState = FormInputState<any>;
type ErasedFormInputAction = FormButtonAction<ErasedFormInputState>;

export type FormActionInput = BaseFormRenderableInput & {
	type: 'action';
	/** Label rendered with the shared Field typography. */
	label?: Slot;
	/** Supporting text rendered directly below the action label. */
	description?: Slot;
	/** Overrides the Form layout for this action entry. */
	labelPosition?: FieldLabelPosition;
	/** Buttons rendered at this position. Their handlers receive the live form state. */
	actions: ErasedFormInputAction[];
};

export type FormCustomInput = BaseFormRenderableInput & {
	type: 'custom';
	/** Custom content rendered at this position with the live form state. */
	snippet: Snippet<[form: ErasedFormInputState]>;
};

export type FormFieldController<T extends InputType> = FieldState<T>;

export type FormFieldEntry<T extends InputType = InputType> = T extends InputType
	? BaseFormRenderableInput &
			Omit<InputProps<T>, 'class' | 'name' | 'visible'> & {
				type: 'field';
				/** Built-in schema and value type used by the shared FieldState validation owner. */
				fieldType: T;
				/** Renders the control with its registered, bindable FieldState controller. */
				snippet: Snippet<[field: FormFieldController<T>]>;
			}
	: never;

export type FormValueInput = FormFieldInput | FormFieldEntry;
export type FormRenderableInput =
	FormFieldInput | FormFieldEntry | FormActionInput | FormCustomInput;

export type FormGroupInputs = Record<string, FormRenderableInput>;
export type FormGroupColumns = 1 | 2 | 3 | 4;

export type FormGroup<I extends FormGroupInputs = FormGroupInputs> = {
	type: 'group';
	/** Accessible group name rendered as the fieldset legend. */
	label: Slot;
	/** Supporting text rendered between the legend and grouped fields. */
	description?: Slot;
	/** Fields and non-value entries grouped visually; field values retain top-level keys. */
	inputs: I;
	/** Number of equal-width group columns in vertical form layouts, from 42rem of form width. */
	columns?: FormGroupColumns;
	/** Controls the whole group's visibility using the complete private value cache. */
	visible?: FormVisibility;
	/** Additional classes applied to the fieldset. */
	class?: string;
};

export type FormInput = FormRenderableInput | FormGroup;
export type FormInputs = Record<string, FormInput>;

export type FormInputState<I extends FormInputs = FormInputs> = Pick<
	FormState<I>,
	keyof FormState<I>
>;
export type FormInputAction<I extends FormInputs = FormInputs> = FormButtonAction<
	FormInputState<I>
>;

type BindFormInputState<Input, I extends FormInputs> = Input extends { type: 'action' }
	? Omit<Input, 'actions'> & { actions: FormInputAction<I>[] }
	: Input extends { type: 'custom' }
		? Omit<Input, 'snippet'> & { snippet: Snippet<[form: FormInputState<I>]> }
		: Input extends FormFieldEntry<infer T>
			? Omit<Input, 'snippet'> & { snippet: Snippet<[field: FieldState<T>]> }
			: Input extends { type: 'group'; inputs: infer GroupInputs extends FormGroupInputs }
				? Omit<Input, 'inputs'> & {
						inputs: { [K in keyof GroupInputs]: BindFormInputState<GroupInputs[K], I> };
					}
				: Input;

export type FormInputsWithState<I extends FormInputs> = string extends keyof I
	? I
	: { [K in keyof I]: BindFormInputState<I[K], I> };

type FormValueInputType<T extends FormValueInput> =
	T extends FormFieldEntry<infer Input> ? Input : T extends FormFieldInput ? T['type'] : never;

type InferInputValue<T extends FormValueInput> = T['required'] extends true
	? NonNullable<FieldValue<FormValueInputType<T>>>
	: FieldValue<FormValueInputType<T>> | null;

type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (
	value: infer I
) => void
	? I
	: never;

type Simplify<T> = { [K in keyof T]: T[K] };
type NoFormFields = Record<never, never>;

type HasConditionalVisibility<Input> = Input extends { visible: infer Visibility }
	? boolean extends Visibility
		? true
		: Extract<Visibility, false | ((value: FormValueRecord) => boolean)> extends never
			? false
			: true
	: false;

type ConditionalGroupInputs<Group extends FormGroup, Inputs extends FormGroupInputs> =
	HasConditionalVisibility<Group> extends true
		? {
				[K in keyof Inputs]: Omit<Inputs[K], 'visible'> & {
					visible: (value: FormValueRecord) => boolean;
				};
			}
		: Inputs;

type FlattenFormInputEntry<Key extends PropertyKey, Input extends FormInput> =
	Input extends FormGroup<infer Inputs>
		? ConditionalGroupInputs<Input, Inputs>
		: Input extends FormValueInput
			? { [K in Key]: Input }
			: NoFormFields;

export type FlattenFormInputs<T extends FormInputs> = Simplify<
	UnionToIntersection<
		{
			[K in keyof T]: FlattenFormInputEntry<K, T[K]>;
		}[keyof T]
	>
>;

type InferFlatFormValue<T> = {
	[
		K in keyof T as T[K] extends FormValueInput
			? HasConditionalVisibility<T[K]> extends true
				? never
				: K
			: never
	]: InferInputValue<Extract<T[K], FormValueInput>>;
} & {
	[
		K in keyof T as T[K] extends FormValueInput
			? HasConditionalVisibility<T[K]> extends true
				? K
				: never
			: never
	]?: InferInputValue<Extract<T[K], FormValueInput>>;
};

export type InferFormValue<T extends FormInputs> = Simplify<
	InferFlatFormValue<FlattenFormInputs<T>>
>;

export type LiveFormValue<T extends FormInputs> = Partial<InferFormValue<T>>;

type FormInputVariant<
	T extends FormFieldInput['type'],
	Display extends 'default' | 'selector' | 'picker',
	Input extends FormFieldInput = FormFieldInput
> = Input extends FormFieldInput
	? T extends Input['type']
		? Display extends 'default'
			? Input extends { display: 'selector' | 'picker' }
				? never
				: Input
			: Input extends { display: Display }
				? Input
				: never
		: never
	: never;

export type FormInputProps<
	T extends FormFieldInput['type'],
	Display extends 'default' | 'selector' | 'picker' = 'default'
> = Omit<FormInputVariant<T, Display>, 'type' | 'display' | 'visible'> & {
	/** Resolved visibility for a control rendered by Form. */
	visible?: boolean;
};

export type FlatFormField = {
	name: string;
	input: FormValueInput;
	group?: FormGroup;
	path: string;
};

export function flattenFormInputs(inputs: FormInputs): FlatFormField[] {
	const fields: FlatFormField[] = [];

	const addField = (name: string, input: FormValueInput, path: string, group?: FormGroup) => {
		fields.push({ name, input, group, path });
	};

	for (const [name, input] of Object.entries(inputs)) {
		if (input.type === 'action' || input.type === 'custom') continue;
		if (input.type !== 'group') {
			addField(name, input, name);
			continue;
		}

		if (!input.inputs || typeof input.inputs !== 'object') {
			throw new Error(`Form group "${name}" requires an inputs object.`);
		}
		if (input.label === undefined || input.label === null) {
			throw new Error(`Form group "${name}" requires a label.`);
		}

		for (const [childName, childInput] of Object.entries(input.inputs)) {
			if ((childInput as FormInput).type === 'group') {
				throw new Error(
					`Form group "${name}" contains nested group "${childName}"; nested groups are not supported.`
				);
			}
			if (childInput.type === 'action' || childInput.type === 'custom') continue;
			addField(childName, childInput, `${name}.${childName}`, input);
		}
	}

	return fields;
}

export const getFormValueInputType = (input: FormValueInput): InputType =>
	input.type === 'field' ? input.fieldType : input.type;

export type FormSubmitHandler<T extends FormInputs> = (
	value: InferFormValue<T>
) => MaybePromise<unknown | void>;
