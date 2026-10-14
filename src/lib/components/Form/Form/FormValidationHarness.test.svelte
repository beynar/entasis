<script lang="ts">
	// Harness for form.validation.svelte.test.ts: a Form inside a Theme with the options under
	// test, an optional custom `type: 'field'` entry, and the FormState handed back to the test.
	import Theme from '../../Theme/Theme.svelte';
	import type { FieldState } from '../Field/field.state.svelte.js';
	import Form from './Form.svelte';
	import type { FormInputs, LiveFormValue } from './form.js';
	import type { FormState } from './form.state.svelte.js';

	let {
		inputs,
		onForm,
		customField = false,
		reduceMotion,
		value = $bindable({}),
		...rest
	}: {
		inputs: FormInputs;
		onForm?: (form: FormState) => void;
		/** Appends a `type: 'field'` entry named `custom`. */
		customField?: boolean;
		reduceMotion?: boolean;
		value?: LiveFormValue<FormInputs>;
		[key: string]: unknown;
	} = $props();

	let form = $state<FormState>();
	$effect(() => {
		if (form) onForm?.(form);
	});
</script>

{#snippet customControl(field: FieldState<'text'>)}
	<input {...field.controlAttrs} {@attach field.control} bind:value={field.value} />
{/snippet}

<Theme {reduceMotion}>
	<Form
		inputs={customField
			? {
					...inputs,
					custom: { type: 'field', fieldType: 'text', label: 'Custom', snippet: customControl }
				}
			: inputs}
		bind:form
		bind:value
		{...rest}
	/>
	<output data-testid="value">{JSON.stringify(value)}</output>
</Theme>
