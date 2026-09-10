<script lang="ts">
	import type { FieldState } from '../Field/field.state.svelte.js';
	import Form from './Form.svelte';
	import type { Density, Sizes } from '$lib/types/theme.js';

	let {
		disabled = false,
		onSubmit,
		onFieldValueChange,
		onValueChange,
		onValidate,
		inputValue,
		defaultInputValue,
		value = $bindable({}),
		size = 'normal',
		density = 'normal'
	}: {
		disabled?: boolean;
		onSubmit: (value: { displayName: string }) => void;
		onFieldValueChange?: (value: string | null) => void;
		onValueChange?: (value: { displayName?: string }) => void;
		onValidate?: (value: string) => string | null;
		inputValue?: string | null;
		defaultInputValue?: string | null;
		value?: { displayName?: string };
		size?: Sizes;
		density?: Density;
	} = $props();
</script>

{#snippet displayNameControl(field: FieldState<'text'>)}
	<input
		{...field.controlAttrs}
		{@attach field.control}
		bind:value={field.value}
		data-testid="custom-field-control"
		data-size={field.size}
		data-density={field.density}
	/>
	<button
		type="button"
		onclick={() => {
			field.setValue('First');
			field.setValue('Second');
		}}>Set twice</button
	>
{/snippet}

{#snippet displayOnly()}
	<p>Display only</p>
{/snippet}

<Form
	inputs={{
		displayName: {
			type: 'field',
			fieldType: 'text',
			label: 'Display name',
			required: true,
			disabled,
			onValueChange: onFieldValueChange,
			onValidate,
			...(inputValue === undefined ? {} : { value: inputValue }),
			defaultValue: defaultInputValue,
			snippet: displayNameControl
		},
		status: {
			type: 'custom',
			snippet: displayOnly
		}
	}}
	bind:value
	{onValueChange}
	{onSubmit}
	{size}
	{density}
>
	{#snippet children(form)}
		<button type="button" onclick={() => form.submit()}>Submit</button>
	{/snippet}
</Form>

<output data-testid="live-value">{JSON.stringify(value)}</output>
