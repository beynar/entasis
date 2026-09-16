<script lang="ts">
	import { Checkbox } from '$lib/components/Form/Checkbox/index.js';
	import { CheckboxesInput } from '$lib/components/Form/CheckboxesInput/index.js';
	import { ColorInput } from '$lib/components/Form/ColorInput/index.js';
	import { ColorPicker } from '$lib/components/Form/ColorPicker/index.js';
	import { Combobox } from '$lib/components/Form/Combobox/index.js';
	import { DateInput } from '$lib/components/Form/DateInput/index.js';
	import { DateSelectorInput } from '$lib/components/Form/DateSelector/index.js';
	import { FileInput } from '$lib/components/Form/File/index.js';
	import { KeyValueInput } from '$lib/components/Form/KeyValueInput/index.js';
	import { NumberInput } from '$lib/components/Form/NumberInput/index.js';
	import { PasswordInput } from '$lib/components/Form/PasswordInput/index.js';
	import { PinInput } from '$lib/components/Form/PinInput/index.js';
	import { RadioInput } from '$lib/components/Form/RadioInput/index.js';
	import { RatingInput } from '$lib/components/Form/RatingInput/index.js';
	import { Select } from '$lib/components/Form/Select/index.js';
	import { Slider } from '$lib/components/Form/Slider/index.js';
	import { Switch } from '$lib/components/Form/Switch/index.js';
	import { TagGroup } from '$lib/components/Form/TagGroup/index.js';
	import { TagsInput } from '$lib/components/Form/TagsInput/index.js';
	import { TextArea } from '$lib/components/Form/TextArea/index.js';
	import { TextInput } from '$lib/components/Form/TextInput/index.js';
	import { TimeInput } from '$lib/components/Form/TimeInput/index.js';
	import { RichTextInput } from '$lib/components/RichTextInput/index.js';
	import { CalendarInput } from '$lib/components/Form/Calendar/index.js';
	import { Form } from '$lib/components/Form/Form/index.js';
	import { MultiStepForm } from '$lib/components/Form/MultiStepForm/index.js';
	import { PhoneInput } from '$lib/components/Form/PhoneInput/index.js';
	import { VoiceInput } from '$lib/components/Form/VoiceInput/index.js';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import Matrix from './Matrix.svelte';
	import Section from './Section.svelte';
	import {
		checkboxOptions,
		colors,
		comboboxItems,
		radioOptions,
		selectItems,
		sizes,
		tagGroupOptions
	} from './fixtures.js';

	let { size = 'normal', density = 'normal' }: { size?: Sizes; density?: Density } = $props();

	const errors = ['Required'];
	const fixedDate = new Date(2026, 2, 14);
	const formVariants = ['plain', 'sectioned', 'card'] as const;
</script>

<Section
	id="inputs"
	title="Inputs"
	description="Every Form/* input with a label + value, an error state, a disabled state and the three sizes."
>
	<Matrix
		caption="TextInput"
		varies="value, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<TextInput
			{size}
			{density}
			label="Email"
			value="ada@example.com"
			placeholder="you@example.com"
		/>
		<TextInput {size} {density} label="Email" value="not-an-email" {errors} />
		<TextInput {size} {density} label="Email" value="ada@example.com" disabled />
		{#each sizes as inputSize (inputSize)}
			<TextInput size={inputSize} {density} label="Size {inputSize}" value="Sample value" />
		{/each}
	</Matrix>

	<Matrix
		caption="TextArea"
		varies="value, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<TextArea {size} {density} label="Notes" value="A short multi-line note." rows={3} />
		<TextArea {size} {density} label="Notes" value="" {errors} rows={3} />
		<TextArea {size} {density} label="Notes" value="Locked content" disabled rows={3} />
		{#each sizes as inputSize (inputSize)}
			<TextArea size={inputSize} {density} label="Size {inputSize}" value="Sample" rows={2} />
		{/each}
	</Matrix>

	<Matrix
		caption="PasswordInput"
		varies="value, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<PasswordInput {size} {density} label="Password" value="correct-horse" />
		<PasswordInput {size} {density} label="Password" value="123" {errors} />
		<PasswordInput {size} {density} label="Password" value="123456" disabled />
		{#each sizes as inputSize (inputSize)}
			<PasswordInput size={inputSize} {density} label="Size {inputSize}" value="secret" />
		{/each}
	</Matrix>

	<Matrix
		caption="NumberInput"
		varies="value, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<NumberInput {size} {density} label="Quantity" value={12} min={0} max={99} showControls />
		<NumberInput {size} {density} label="Quantity" value={0} {errors} showControls />
		<NumberInput {size} {density} label="Quantity" value={12} disabled showControls />
		{#each sizes as inputSize (inputSize)}
			<NumberInput size={inputSize} {density} label="Size {inputSize}" value={7} showControls />
		{/each}
	</Matrix>

	<Matrix caption="Select" varies="value, errors, disabled, size" layout="grid" class="items-start">
		<Select {size} {density} label="Status" items={selectItems} value="review" />
		<Select {size} {density} label="Status" items={selectItems} value={null} {errors} />
		<Select {size} {density} label="Status" items={selectItems} value="draft" disabled />
		{#each sizes as inputSize (inputSize)}
			<Select
				size={inputSize}
				{density}
				label="Size {inputSize}"
				items={selectItems}
				value="published"
			/>
		{/each}
	</Matrix>

	<Matrix
		caption="Combobox"
		varies="value, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<Combobox {size} {density} label="Framework" items={comboboxItems} value="svelte" />
		<Combobox {size} {density} label="Framework" items={comboboxItems} value={null} {errors} />
		<Combobox {size} {density} label="Framework" items={comboboxItems} value="vite" disabled />
		{#each sizes as inputSize (inputSize)}
			<Combobox
				size={inputSize}
				{density}
				label="Size {inputSize}"
				items={comboboxItems}
				value="tailwind"
			/>
		{/each}
	</Matrix>

	<Matrix
		caption="DateInput"
		varies="value, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<DateInput {size} {density} label="Start date" value={fixedDate} />
		<DateInput {size} {density} label="Start date" value={null} {errors} />
		<DateInput {size} {density} label="Start date" value={fixedDate} disabled />
		{#each sizes as inputSize (inputSize)}
			<DateInput size={inputSize} {density} label="Size {inputSize}" value={fixedDate} />
		{/each}
	</Matrix>

	<Matrix
		caption="DateSelectorInput"
		varies="value, errors, disabled"
		layout="grid"
		class="items-start"
	>
		<DateSelectorInput {size} {density} label="Due date" value={fixedDate} />
		<DateSelectorInput {size} {density} label="Due date" value={null} {errors} />
		<DateSelectorInput {size} {density} label="Due date" value={fixedDate} disabled />
	</Matrix>

	<Matrix
		caption="TimeInput"
		varies="value, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<TimeInput {size} {density} label="Start time" value={9 * 60} />
		<TimeInput {size} {density} label="Start time" value={null} {errors} />
		<TimeInput {size} {density} label="Start time" value={17 * 60} disabled />
		{#each sizes as inputSize (inputSize)}
			<TimeInput size={inputSize} {density} label="Size {inputSize}" value={12 * 60} />
		{/each}
	</Matrix>

	<Matrix
		caption="ColorInput"
		varies="value, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<ColorInput {size} {density} label="Accent" value="#5f62ef" />
		<ColorInput {size} {density} label="Accent" value="" {errors} />
		<ColorInput {size} {density} label="Accent" value="#22c55e" disabled />
		{#each sizes as inputSize (inputSize)}
			<ColorInput size={inputSize} {density} label="Size {inputSize}" value="#ef4444" />
		{/each}
	</Matrix>

	<Matrix caption="ColorPicker" varies="size, disabled" layout="grid" class="items-start">
		{#each sizes as pickerSize (pickerSize)}
			<ColorPicker size={pickerSize} value="#5f62ef" />
		{/each}
		<ColorPicker {size} value="#f59e0b" disabled />
	</Matrix>

	<Matrix
		caption="Slider"
		varies="variant, mode, color, disabled, errors"
		layout="grid"
		class="items-start"
	>
		<Slider {size} {density} label="Volume" value={40} showValue />
		<Slider {size} {density} label="Volume" value={40} {errors} />
		<Slider {size} {density} label="Volume" value={40} disabled />
		<Slider {size} {density} label="Thick" value={60} variant="thick" showValue />
		<Slider {size} {density} label="Contained" value={60} variant="contained" showValue />
		<Slider {size} {density} label="Range" mode="range" value={[20, 70]} showValue />
		{#each colors as color (color)}
			<Slider {size} {density} label={color} {color} value={55} showValue />
		{/each}
	</Matrix>

	<Matrix caption="Switch" varies="value, errors, disabled, size" layout="grid" class="items-start">
		<Switch {size} {density} label="Notifications" value={true} />
		<Switch {size} {density} label="Notifications" value={false} {errors} />
		<Switch {size} {density} label="Notifications" value={true} disabled />
		{#each sizes as inputSize (inputSize)}
			<Switch size={inputSize} {density} label="Size {inputSize}" value={true} />
		{/each}
	</Matrix>

	<Matrix
		caption="Checkbox"
		varies="value, indeterminate, mode, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<Checkbox {size} {density} label="Accept terms" value={true} />
		<Checkbox {size} {density} label="Accept terms" value={false} {errors} />
		<Checkbox {size} {density} label="Accept terms" value={true} disabled />
		<Checkbox {size} {density} label="Partially selected" indeterminate />
		<Checkbox {size} {density} label="Card mode" mode="card" value={true} />
		{#each sizes as inputSize (inputSize)}
			<Checkbox size={inputSize} {density} label="Size {inputSize}" value={true} />
		{/each}
	</Matrix>

	<Matrix
		caption="CheckboxesInput"
		varies="mode, errors, disabled"
		layout="grid"
		class="items-start"
	>
		<CheckboxesInput {size} {density} label="Channels" items={checkboxOptions} value={['email']} />
		<CheckboxesInput
			{size}
			{density}
			label="Channels"
			items={checkboxOptions}
			value={[]}
			{errors}
		/>
		<CheckboxesInput
			{size}
			{density}
			label="Channels"
			items={checkboxOptions}
			value={['sms']}
			disabled
		/>
		<CheckboxesInput
			{size}
			{density}
			label="Card mode"
			mode="card"
			items={checkboxOptions}
			value={['email', 'sms']}
		/>
	</Matrix>

	<Matrix caption="RadioInput" varies="mode, errors, disabled" layout="grid" class="items-start">
		<RadioInput {size} {density} label="Plan" items={radioOptions} value="team" />
		<RadioInput {size} {density} label="Plan" items={radioOptions} value={null} {errors} />
		<RadioInput {size} {density} label="Plan" items={radioOptions} value="starter" disabled />
		<RadioInput {size} {density} label="Card mode" mode="card" items={radioOptions} value="team" />
	</Matrix>

	<Matrix caption="TagGroup" varies="multiple, errors, disabled" layout="grid" class="items-start">
		<TagGroup {size} {density} label="Team" items={tagGroupOptions} value="design" />
		<TagGroup
			{size}
			{density}
			label="Teams"
			multiple
			items={tagGroupOptions}
			value={['design', 'product']}
		/>
		<TagGroup {size} {density} label="Team" items={tagGroupOptions} value={null} {errors} />
		<TagGroup {size} {density} label="Team" items={tagGroupOptions} value="design" disabled />
	</Matrix>

	<Matrix
		caption="TagsInput"
		varies="value, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<TagsInput {size} {density} label="Keywords" value={['svelte', 'design']} customTags />
		<TagsInput {size} {density} label="Keywords" value={[]} {errors} customTags />
		<TagsInput {size} {density} label="Keywords" value={['locked']} disabled customTags />
		{#each sizes as inputSize (inputSize)}
			<TagsInput size={inputSize} {density} label="Size {inputSize}" value={['one']} customTags />
		{/each}
	</Matrix>

	<Matrix
		caption="PinInput"
		varies="value, mask, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<PinInput {size} {density} label="Code" value="1234" />
		<PinInput {size} {density} label="Code" value="12" {errors} />
		<PinInput {size} {density} label="Code" value="1234" disabled />
		<PinInput {size} {density} label="Masked" value="1234" mask />
		{#each sizes as inputSize (inputSize)}
			<PinInput size={inputSize} {density} label="Size {inputSize}" value="1234" />
		{/each}
	</Matrix>

	<Matrix
		caption="FileInput"
		varies="mode, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<FileInput {size} {density} label="Attachment" />
		<FileInput {size} {density} label="Attachment" {errors} />
		<FileInput {size} {density} label="Attachment" disabled />
		<FileInput {size} {density} label="Attachments" mode="multiple" maxFiles={3} />
		{#each sizes as inputSize (inputSize)}
			<FileInput size={inputSize} {density} label="Size {inputSize}" />
		{/each}
	</Matrix>

	<Matrix
		caption="RatingInput"
		varies="value, halfSteps, errors, disabled, size"
		layout="grid"
		class="items-start"
	>
		<RatingInput {size} {density} label="Rating" value={3} />
		<RatingInput {size} {density} label="Rating" value={null} {errors} />
		<RatingInput {size} {density} label="Rating" value={4} disabled />
		<RatingInput {size} {density} label="Half steps" value={3.5} halfSteps />
		{#each sizes as inputSize (inputSize)}
			<RatingInput size={inputSize} {density} label="Size {inputSize}" value={4} />
		{/each}
	</Matrix>

	<Matrix
		caption="KeyValueInput"
		varies="value, errors, disabled"
		layout="grid"
		class="items-start"
	>
		<KeyValueInput
			{size}
			{density}
			label="Headers"
			value={[{ key: 'Accept', value: 'application/json' }]}
		/>
		<KeyValueInput {size} {density} label="Headers" value={[]} {errors} />
		<KeyValueInput
			{size}
			{density}
			label="Headers"
			value={[{ key: 'Accept', value: 'text/html' }]}
			disabled
		/>
	</Matrix>

	<Matrix
		caption="RichTextInput"
		varies="toolbar, errors, disabled"
		note="Editor body mounts client-side; SSR renders the field chrome only."
		layout="grid"
		class="items-start"
	>
		<RichTextInput
			{size}
			{density}
			label="Description"
			value="Rich **text** body."
			toolbar="fixed"
		/>
		<RichTextInput {size} {density} label="Description" value="" {errors} toolbar="none" />
		<RichTextInput {size} {density} label="Description" value="Locked" disabled toolbar="none" />
	</Matrix>

	<Matrix caption="PhoneInput" varies="value, errors, disabled" layout="grid" class="items-start">
		<PhoneInput {size} {density} label="Phone" value="+33612345678" country="fr" />
		<PhoneInput {size} {density} label="Phone" value="" {errors} country="fr" />
		<PhoneInput {size} {density} label="Phone" value="+33612345678" disabled country="fr" />
	</Matrix>

	<Matrix
		caption="VoiceInput"
		varies="variant, color, disabled"
		note="Representative example: recording needs microphone permission, so only the idle state renders."
		layout="grid"
		class="items-start"
	>
		<VoiceInput {size} {density} label="Voice note" variant="expandable" />
		<VoiceInput {size} {density} label="Voice note" variant="compact" color="danger" />
		<VoiceInput {size} {density} label="Voice note" disabled />
	</Matrix>

	<Matrix
		caption="CalendarInput"
		varies="type (calendar, calendar-range)"
		layout="grid"
		class="items-start"
	>
		<CalendarInput {size} {density} type="calendar" label="Pick a day" value={fixedDate} />
		<CalendarInput
			{size}
			{density}
			type="calendar-range"
			label="Pick a range"
			value={[fixedDate, new Date(2026, 2, 21)]}
		/>
	</Matrix>

	<Matrix
		caption="Form"
		varies="variant (plain, sectioned, card)"
		layout="grid"
		class="items-start"
	>
		{#each formVariants as variant (variant)}
			<Form
				{size}
				{density}
				{variant}
				title="Profile — {variant}"
				description="Composed field set inside a Form."
				inputs={{
					name: { type: 'text', label: 'Name', required: true },
					email: { type: 'email', label: 'Email', required: true },
					role: { type: 'select', label: 'Role', items: selectItems },
					notify: { type: 'switch', label: 'Notify me' }
				}}
			/>
		{/each}
	</Matrix>

	<Matrix caption="MultiStepForm" varies="showMeter, meterColor" layout="block">
		<MultiStepForm
			showMeter
			meterColor="primary"
			items={[
				{
					title: 'Account',
					description: 'Who is signing up.',
					inputs: {
						name: { type: 'text', label: 'Name', required: true },
						email: { type: 'email', label: 'Email', required: true }
					}
				},
				{
					title: 'Preferences',
					description: 'How they want to be contacted.',
					inputs: {
						role: { type: 'select', label: 'Role', items: selectItems },
						notify: { type: 'switch', label: 'Notify me' }
					}
				}
			]}
		/>
	</Matrix>
</Section>
