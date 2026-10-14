<script lang="ts" generics="T extends FieldType">
	import { DEV } from 'esm-env';
	import { tick } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { getFirstTabbable } from '$lib/utils/focus.js';
	import { createListFilter } from '$lib/utils/listFilter.js';
	import type { FieldType, FieldValue } from './field.js';
	import { getFieldFormAttribute } from './fieldNativeForm.svelte.js';
	import type { FieldHiddenInputsProps } from './fieldHiddenInputs.props.js';

	let {
		field,
		value,
		checked,
		name,
		required,
		disabled,
		form,
		id,
		autocomplete,
		options,
		onAutofill,
		readOnly
	}: FieldHiddenInputsProps<T> = $props();

	const t = $derived(useI18n());

	// FieldState names an unnamed field `${type}-input-${id}` so Form wiring stays unique. Only a
	// name the app gave, directly or through Form, is submitted, as for a native control.
	const submittedName = $derived(
		name ?? (field.name === `${field.type}-input-${field.id}` ? undefined : field.name)
	);
	const isRequired = $derived(Boolean(required ?? field.required));
	const isDisabled = $derived(Boolean(disabled ?? field.disabled));
	const isReadOnly = $derived(Boolean(readOnly ?? field.readOnly));
	const formId = $derived(form ?? getFieldFormAttribute(field));
	const reportId = $derived(id ?? `${field.id}-input`);
	const values = $derived(
		(Array.isArray(value) ? value : value == null ? [] : [value]).map((entry) => String(entry))
	);
	const mode = $derived(
		checked !== undefined ? 'checked' : autocomplete ? 'autofill' : ('values' as const)
	);
	const isEmpty = $derived(mode === 'checked' ? !checked : values.every((entry) => entry === ''));
	// What the browser treats as a missing value, and so a blocked submit.
	const isMissing = $derived(isRequired && !isDisabled && isEmpty);

	const focusControl = () => {
		const control = field.node?.isConnected ? field.node : null;
		(control ?? (field.rootNode && getFirstTabbable(field.rootNode)))?.focus();
	};

	// A blocked native submit (or reportValidity) focuses the first invalid control. When that is
	// one of these inputs, the report belongs to the field: it shows its own error and its control
	// takes focus. Firefox hides its bubble when the reported input loses focus, which only works
	// once its focus has settled, so the hand-off waits a task. A silent checkValidity() focuses
	// nothing, so it changes nothing here.
	const handOffReport = (event: FocusEvent & { currentTarget: HTMLInputElement }) => {
		const input = event.currentTarget;
		field.validate();
		setTimeout(() => {
			if (input.ownerDocument.activeElement === input) focusControl();
		});
	};

	// While a value is missing, the reportable input also carries a blank custom error. Chromium
	// and WebKit trim the message before showing their bubble, so a blank one shows nothing over
	// the field's own error, and the constraint never lapses: every submit stays blocked.
	const blankNativeReport: Attachment<HTMLInputElement> = (input) => {
		input.setCustomValidity(isMissing ? ' ' : '');
	};

	// The inputs sit beside the control: a button may not contain interactive content, and a
	// click on an input inside it reaches the button as a second activation.
	const besideControl: Attachment<HTMLInputElement> = (input) => {
		if (DEV && input.parentElement?.closest('button')) {
			console.warn(
				'FieldHiddenInputs is rendered inside a <button>. Render it beside the control instead.'
			);
		}
	};

	// The checkbox only mirrors the field: a change that reaches it directly is undone.
	const keepChecked = (event: Event & { currentTarget: HTMLInputElement }) => {
		event.currentTarget.checked = Boolean(checked);
	};

	const matchOption = (text: string): string | undefined => {
		if (!options) return text;
		const byValue = options.find((option) => option.value === text);
		if (byValue) return byValue.value;
		const byLabel = options.find((option) => option.label === text);
		if (byLabel) return byLabel.value;
		const filter = createListFilter({ locale: t.locale });
		return options.find((option) => option.label !== undefined && filter.equals(option.label, text))
			?.value;
	};

	// The browser fills the text it knows (often a label such as "Canada"); it becomes the field's
	// value only when it names an option. Afterwards the input shows the field's value again,
	// whatever was typed into it.
	const applyAutofill = async (event: Event & { currentTarget: HTMLInputElement }) => {
		const input = event.currentTarget;
		const text = input.value.trim();
		if (text && text !== values[0] && !isDisabled && !isReadOnly) {
			const match = matchOption(text);
			if (match !== undefined) {
				if (onAutofill) onAutofill(match);
				// Autofill is offered to single-value text fields, whose value is the option value.
				else field.setValue(match as FieldValue<T>);
			}
		}
		await tick();
		input.value = values[0] ?? '';
	};
</script>

{#if mode === 'checked'}
	<input
		type="checkbox"
		id={reportId}
		name={submittedName}
		value={values[0] ?? 'on'}
		{checked}
		required={isRequired}
		disabled={isDisabled}
		form={formId}
		tabindex={-1}
		aria-hidden="true"
		class="sr-only"
		data-field-hidden-input=""
		onchange={keepChecked}
		onfocus={handOffReport}
		{@attach blankNativeReport}
		{@attach besideControl}
	/>
{:else if mode === 'autofill'}
	<input
		type="text"
		id={reportId}
		name={submittedName}
		value={values[0] ?? ''}
		{autocomplete}
		required={isRequired}
		disabled={isDisabled}
		form={formId}
		tabindex={-1}
		aria-hidden="true"
		class="sr-only"
		data-field-hidden-input=""
		oninput={applyAutofill}
		onchange={applyAutofill}
		onfocus={handOffReport}
		{@attach blankNativeReport}
		{@attach besideControl}
	/>
{:else}
	{#each values as entry, index (index)}
		<input
			type="hidden"
			name={submittedName}
			value={entry}
			disabled={isDisabled}
			form={formId}
			data-field-hidden-input=""
		/>
	{/each}
	{#if isMissing}
		<!-- Submits nothing (no name): it only stands for the missing value, so the browser blocks
		     the submit and reports it. -->
		<input
			id={reportId}
			value=""
			autocomplete="off"
			required
			form={formId}
			tabindex={-1}
			aria-hidden="true"
			class="sr-only"
			data-field-hidden-input=""
			onfocus={handOffReport}
			{@attach blankNativeReport}
			{@attach besideControl}
		/>
	{/if}
{/if}
