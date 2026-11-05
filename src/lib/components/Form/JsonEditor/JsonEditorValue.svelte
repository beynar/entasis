<script lang="ts">
	// The control for one value. Each is the library's own input, labelled by the row and fed the
	// row's problems: `errors` is read from the editor's validator and never written back, so a
	// control's own checks cannot disagree with the schema.
	import ColorInput from '../ColorInput/ColorInput.svelte';
	import DateInput from '../DateInput/DateInput.svelte';
	import NumberInput from '../NumberInput/NumberInput.svelte';
	import PasswordInput from '../PasswordInput/Password.svelte';
	import Select from '../Select/Select.svelte';
	import Switch from '../Switch/Switch.svelte';
	import TextArea from '../TextArea/TextArea.svelte';
	import TextInput from '../TextInput/TextInput.svelte';
	import TimeInput from '../TimeInput/TimeInput.svelte';
	import { useJsonEditor } from './jsonEditor.state.svelte.js';
	import { jsonEditorFieldTheme } from './jsonEditor.theme.js';
	import { jsonEquals } from './jsonEditor.validate.js';
	import {
		dateFromJson,
		dateToJson,
		joinDateTime,
		secondsFromTime,
		splitDateTime,
		timeFromSeconds,
		stringControl
	} from './jsonEditor.controls.js';
	import type {
		JsonSchemaNode,
		JsonSchemaObject,
		JsonType,
		JsonValue
	} from './jsonEditor.schema.js';

	let {
		value,
		node,
		type,
		label,
		required = false,
		readOnly = false,
		errors,
		description,
		onChange
	}: {
		value: JsonValue | undefined;
		node: JsonSchemaNode;
		type: JsonType | undefined;
		label: string;
		required?: boolean;
		readOnly?: boolean;
		errors: string[];
		description?: string;
		/** Takes the new value; `undefined` means the control was emptied. */
		onChange: (next: JsonValue | undefined) => void;
	} = $props();

	const editor = useJsonEditor();
	const schema = $derived<JsonSchemaObject>(node.schema);
	const size = $derived(editor.controlSize);
	const classes = $derived(editor.classes);
	const fixed = $derived(schema.const !== undefined);

	const placeholder = $derived.by(() => {
		const example = schema.examples?.[0] ?? schema.default;
		return example === undefined || typeof example === 'object' ? undefined : String(example);
	});

	const control = $derived(type === 'string' ? stringControl(schema, value) : null);

	const optionItems = $derived(
		(node.options ?? []).map((option, index) => ({ value: String(index), label: option.label }))
	);
	const optionIndex = $derived.by(() => {
		if (value === undefined) return null;
		const index = (node.options ?? []).findIndex((option) => jsonEquals(option.value, value));
		return index < 0 ? null : String(index);
	});

	const isInteger = $derived(type === 'integer');
	// Strict bounds become the nearest whole number a stepper can stop at; for decimals the validator
	// reports them, since no nearest number exists.
	const numberMin = $derived.by(() => {
		if (typeof schema.exclusiveMinimum === 'number') {
			return isInteger ? Math.floor(schema.exclusiveMinimum) + 1 : schema.exclusiveMinimum;
		}
		return schema.minimum;
	});
	const numberMax = $derived.by(() => {
		if (typeof schema.exclusiveMaximum === 'number') {
			return isInteger ? Math.ceil(schema.exclusiveMaximum) - 1 : schema.exclusiveMaximum;
		}
		return schema.maximum;
	});
	const numberStep = $derived(schema.multipleOf ?? 1);
	const numberFormat = $derived<Intl.NumberFormatOptions>(
		isInteger
			? { useGrouping: false, maximumFractionDigits: 0 }
			: { useGrouping: false, maximumFractionDigits: 20 }
	);

	const text = $derived(typeof value === 'string' ? value : '');
	const dateTime = $derived(splitDateTime(text));
	// Emptying the date empties the value, but not what the user meant by the rest: retyping a date
	// brings the time and the offset back.
	let keptTime = '';
	let keptSuffix = '';
	$effect.pre(() => {
		if (dateTime.time) keptTime = dateTime.time;
		if (dateTime.suffix) keptSuffix = dateTime.suffix;
	});
	const dateValue = $derived(dateFromJson(control === 'date-time' ? dateTime.date : text));
	const timeSeconds = $derived(secondsFromTime(control === 'date-time' ? dateTime.time : text));

	const onText = (next: string | null) => onChange(next === null || next === '' ? undefined : next);

	const readableConst = $derived(
		typeof schema.const === 'string' ? schema.const : JSON.stringify(schema.const)
	);
</script>

{#if fixed}
	<span class={classes.fixedValue({ size })} title={readableConst}>{readableConst}</span>
{:else if node.options}
	<Select
		{label}
		{size}
		density="compact"
		class="w-full"
		theme={jsonEditorFieldTheme}
		items={optionItems}
		{readOnly}
		{required}
		{description}
		{placeholder}
		bind:errors={() => errors, () => {}}
		bind:value={
			() => optionIndex,
			(next) => onChange(next === null ? undefined : node.options?.[Number(next)]?.value)
		}
	/>
{:else if type === 'boolean'}
	<Switch
		{size}
		density="compact"
		{readOnly}
		{description}
		theme={jsonEditorFieldTheme}
		inputAttrs={{ 'aria-label': label }}
		bind:errors={() => errors, () => {}}
		bind:value={() => value === true, (next) => onChange(Boolean(next))}
	/>
{:else if type === 'number' || type === 'integer'}
	<NumberInput
		{label}
		{size}
		density="compact"
		class="w-full"
		theme={jsonEditorFieldTheme}
		min={numberMin}
		max={numberMax}
		step={numberStep}
		format={numberFormat}
		showControls={false}
		{readOnly}
		{required}
		{description}
		{placeholder}
		bind:errors={() => errors, () => {}}
		bind:value={
			() => (typeof value === 'number' ? value : null),
			(next) => onChange(next === null || next === undefined ? undefined : next)
		}
	/>
{:else if type === 'null'}
	<span class={classes.fixedValue({ size })}>null</span>
{:else if control === 'date'}
	<DateInput
		{label}
		{size}
		density="compact"
		class="w-full"
		theme={jsonEditorFieldTheme}
		format="yyyy/mm/dd"
		separator="-"
		placeholder="yyyy-mm-dd"
		{readOnly}
		{required}
		{description}
		bind:errors={() => errors, () => {}}
		bind:value={
			() => dateValue,
			(next) => {
				const iso = dateToJson(next ?? null);
				if (iso !== text) onChange(iso || undefined);
			}
		}
	/>
{:else if control === 'date-time'}
	<div class="gap-xs flex w-full min-w-0 items-start">
		<DateInput
			label={editor.t.jsonDatePart(label)}
			{size}
			density="compact"
			class="min-w-0 flex-[3]"
			theme={jsonEditorFieldTheme}
			format="yyyy/mm/dd"
			separator="-"
			placeholder="yyyy-mm-dd"
			{readOnly}
			{required}
			{description}
			bind:errors={() => errors, () => {}}
			bind:value={
				() => dateValue,
				(next) => {
					const date = dateToJson(next ?? null);
					const joined = joinDateTime(
						date,
						dateTime.time || keptTime,
						dateTime.suffix || keptSuffix
					);
					if (joined !== text) onChange(joined || undefined);
				}
			}
		/>
		<TimeInput
			label={editor.t.jsonTimePart(label)}
			{size}
			density="compact"
			class="min-w-0 flex-[2]"
			theme={jsonEditorFieldTheme}
			as="secondSinceMidnight"
			format="HH:MM:SS"
			{readOnly}
			bind:value={
				() => timeSeconds,
				(next) => {
					const time = next === null || next === undefined ? '' : timeFromSeconds(next);
					keptTime = time;
					const joined = joinDateTime(dateTime.date, time, dateTime.suffix || keptSuffix);
					if (joined !== text) onChange(joined || undefined);
				}
			}
		/>
	</div>
{:else if control === 'time'}
	<TimeInput
		{label}
		{size}
		density="compact"
		class="w-full"
		theme={jsonEditorFieldTheme}
		as="secondSinceMidnight"
		format="HH:MM:SS"
		{readOnly}
		{required}
		{description}
		bind:errors={() => errors, () => {}}
		bind:value={
			() => timeSeconds,
			(next) => {
				const time = next === null || next === undefined ? '' : timeFromSeconds(next);
				if (time !== text) onChange(time || undefined);
			}
		}
	/>
{:else if control === 'color'}
	<ColorInput
		{label}
		{size}
		density="compact"
		class="w-full"
		theme={jsonEditorFieldTheme}
		{readOnly}
		{required}
		{description}
		bind:errors={() => errors, () => {}}
		bind:value={() => text || null, onText}
	/>
{:else if control === 'password'}
	<PasswordInput
		{label}
		{size}
		density="compact"
		class="w-full"
		theme={jsonEditorFieldTheme}
		{readOnly}
		{required}
		{description}
		{placeholder}
		inputAttrs={{ maxlength: schema.maxLength }}
		bind:errors={() => errors, () => {}}
		bind:value={() => text || null, onText}
	/>
{:else if control === 'textarea'}
	<TextArea
		{label}
		{size}
		density="compact"
		class="w-full"
		theme={jsonEditorFieldTheme}
		rows={2}
		maxLength={schema.maxLength}
		{readOnly}
		{required}
		{description}
		{placeholder}
		bind:errors={() => errors, () => {}}
		bind:value={() => text, onText}
	/>
{:else}
	<TextInput
		{label}
		{size}
		density="compact"
		class="w-full"
		theme={jsonEditorFieldTheme}
		type={control === 'email' ? 'email' : control === 'url' ? 'url' : 'text'}
		{readOnly}
		{required}
		{description}
		{placeholder}
		inputAttrs={{
			maxlength: schema.maxLength,
			spellcheck: false,
			autocomplete: 'off'
		}}
		bind:errors={() => errors, () => {}}
		bind:value={() => text, onText}
	/>
{/if}
