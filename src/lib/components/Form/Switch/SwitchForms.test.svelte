<script lang="ts">
	import Theme from '../../Theme/Theme.svelte';
	import Form from '../Form/Form.svelte';
	import Switch from './Switch.svelte';

	let {
		inputValue,
		nativeRequired = false,
		secondRequired = false,
		withUnnamed = false,
		formDefaultValue = false,
		onNativeSubmit,
		onFormSubmit
	}: {
		inputValue?: string;
		nativeRequired?: boolean;
		secondRequired?: boolean;
		/** Adds a switch without a name to the native form. */
		withUnnamed?: boolean;
		formDefaultValue?: boolean | null;
		onNativeSubmit?: (data: FormData) => void;
		onFormSubmit?: (value: { terms: boolean }) => void;
	} = $props();
</script>

<Theme>
	<form
		data-testid="native-form"
		onsubmit={(event) => {
			event.preventDefault();
			onNativeSubmit?.(new FormData(event.currentTarget));
		}}
	>
		<Switch name="alerts" label="Alerts" {inputValue} required={nativeRequired} />
		{#if secondRequired}
			<Switch name="updates" label="Updates" required />
		{/if}
		{#if withUnnamed}
			<Switch label="Advanced options" />
		{/if}
		<button type="submit">Save native</button>
	</form>

	<Form
		inputs={{
			terms: {
				type: 'switch',
				label: 'Accept the terms',
				required: true,
				defaultValue: formDefaultValue
			}
		}}
		onSubmit={(value) => onFormSubmit?.(value as { terms: boolean })}
	>
		{#snippet children(form)}
			<button type="button" onclick={() => form.submit()}>Submit form</button>
		{/snippet}
	</Form>
</Theme>
