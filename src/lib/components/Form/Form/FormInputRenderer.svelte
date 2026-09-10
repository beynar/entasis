<script lang="ts">
	import type { Density, Sizes } from '$lib/types/theme.js';
	import type { FieldLabelPosition } from '../Field/field.js';
	import RichTextInput from '../../RichTextInput/RichTextInput.svelte';
	import CalendarInput from '../Calendar/CalendarInput.svelte';
	import Checkbox from '../Checkbox/Checkbox.svelte';
	import CheckboxesInput from '../CheckboxesInput/CheckboxesInput.svelte';
	import ColorInput from '../ColorInput/ColorInput.svelte';
	import ColorPickerInput from '../ColorPicker/ColorPickerInput.svelte';
	import Combobox from '../Combobox/Combobox.svelte';
	import DateInput from '../DateInput/DateInput.svelte';
	import DateSelectorInput from '../DateSelector/DateSelectorInput.svelte';
	import FileInput from '../File/FileInput.svelte';
	import KeyValueInput from '../KeyValueInput/KeyValueInput.svelte';
	import NumberInput from '../NumberInput/NumberInput.svelte';
	import PasswordInput from '../PasswordInput/Password.svelte';
	import PhoneInput from '../PhoneInput/PhoneInput.svelte';
	import PinInput from '../PinInput/PinInput.svelte';
	import RadioInput from '../RadioInput/RadioInput.svelte';
	import RatingInput from '../RatingInput/RatingInput.svelte';
	import Select from '../Select/Select.svelte';
	import Slider from '../Slider/Slider.svelte';
	import Switch from '../Switch/Switch.svelte';
	import TagGroup from '../TagGroup/TagGroup.svelte';
	import TagsInput from '../TagsInput/TagsInput.svelte';
	import TextArea from '../TextArea/TextArea.svelte';
	import TextInput from '../TextInput/TextInput.svelte';
	import TimeInput from '../TimeInput/TimeInput.svelte';
	import VoiceInput from '../VoiceInput/VoiceInput.svelte';
	import type { FormFieldInput, FormInputProps } from './form.js';
	import { prepareInputProps } from './visibility.js';

	let {
		name,
		input,
		size,
		density,
		labelPosition,
		itemClass
	}: {
		name: string;
		input: FormFieldInput;
		size: Sizes;
		density: Density;
		labelPosition?: FieldLabelPosition;
		itemClass?: string;
	} = $props();
	const inputProps = $derived({
		...prepareInputProps(input, size, labelPosition),
		density: input.density ?? density,
		class: [input.class, itemClass].filter(Boolean).join(' ') || undefined
	});
	const inheritedDensity = $derived(
		'density' in input && input.density !== undefined ? input.density : density
	);
</script>

{#if input.type === 'text'}
	<TextInput {...inputProps as FormInputProps<'text'>} type={input.type} {name} />
{:else if input.type === 'email'}
	<TextInput {...inputProps as FormInputProps<'email'>} type={input.type} {name} />
{:else if input.type === 'url'}
	<TextInput {...inputProps as FormInputProps<'url'>} type={input.type} {name} />
{:else if input.type === 'number'}
	<NumberInput {...inputProps as FormInputProps<'number'>} {name} />
{:else if input.type === 'rating'}
	<RatingInput {...inputProps as FormInputProps<'rating'>} {name} />
{:else if input.type === 'voice'}
	<VoiceInput {...inputProps as FormInputProps<'voice'>} {name} />
{:else if input.type === 'slider'}
	<Slider {...inputProps as FormInputProps<'slider'>} {name} />
{:else if input.type === 'slider-range'}
	<Slider {...inputProps as FormInputProps<'slider-range'>} {name} mode="range" />
{:else if input.type === 'textarea'}
	<TextArea {...inputProps as FormInputProps<'textarea'>} {name} />
{:else if input.type === 'rich-text'}
	<RichTextInput {...inputProps as FormInputProps<'rich-text'>} {name} />
{:else if input.type === 'select'}
	<Select {...inputProps as FormInputProps<'select'>} density={inheritedDensity} {name} />
{:else if input.type === 'combobox'}
	<Combobox {...inputProps as FormInputProps<'combobox'>} density={inheritedDensity} {name} />
{:else if input.type === 'radio'}
	<RadioInput {...inputProps as FormInputProps<'radio'>} {name} />
{:else if input.type === 'checkboxes'}
	<CheckboxesInput {...inputProps as FormInputProps<'checkboxes'>} {name} />
{:else if input.type === 'checkbox'}
	<Checkbox {...inputProps as FormInputProps<'checkbox'>} {name} />
{:else if input.type === 'switch'}
	<Switch {...inputProps as FormInputProps<'switch'>} {name} />
{:else if input.type === 'password'}
	<PasswordInput {...inputProps as FormInputProps<'password'>} {name} />
{:else if input.type === 'phone'}
	<PhoneInput {...inputProps as FormInputProps<'phone'>} {name} />
{:else if input.type === 'calendar-range' && input.display === 'selector'}
	<DateSelectorInput
		mode="range"
		{...inputProps as FormInputProps<'calendar-range', 'selector'>}
		{name}
	/>
{:else if input.type === 'calendar' || input.type === 'calendar-range'}
	<CalendarInput
		{...inputProps as FormInputProps<'calendar' | 'calendar-range'>}
		type={input.type}
		{name}
	/>
{:else if input.type === 'date' && input.display === 'selector'}
	<DateSelectorInput mode="date" {...inputProps as FormInputProps<'date', 'selector'>} {name} />
{:else if input.type === 'date' || input.type === 'datetime'}
	<DateInput {...inputProps as FormInputProps<'date' | 'datetime'>} type={input.type} {name} />
{:else if input.type === 'color' && input.display === 'picker'}
	<ColorPickerInput {...inputProps as FormInputProps<'color', 'picker'>} {name} />
{:else if input.type === 'color'}
	<ColorInput {...inputProps as FormInputProps<'color'>} {name} />
{:else if input.type === 'file'}
	<FileInput {...inputProps as FormInputProps<'file'>} {name} mode="single" />
{:else if input.type === 'files'}
	<FileInput {...inputProps as FormInputProps<'files'>} {name} mode="multiple" />
{:else if input.type === 'tag-group'}
	<TagGroup {...inputProps as FormInputProps<'tag-group'>} {name} />
{:else if input.type === 'tag'}
	<TagsInput {...inputProps as FormInputProps<'tag'>} density={inheritedDensity} {name} />
{:else if input.type === 'keyvalue'}
	<KeyValueInput {...inputProps as FormInputProps<'keyvalue'>} {name} />
{:else if input.type === 'pin'}
	<PinInput {...inputProps as FormInputProps<'pin'>} {name} />
{:else if input.type === 'time'}
	<TimeInput {...inputProps as FormInputProps<'time'>} {name} />
{/if}
