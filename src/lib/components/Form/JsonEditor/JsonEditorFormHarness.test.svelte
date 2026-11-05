<script lang="ts">
	// Harness: a JsonEditor as a Form entry, and inside a native form beside a plain input.
	import Theme from '../../Theme/Theme.svelte';
	import Form from '../Form/Form.svelte';
	import JsonEditor from './JsonEditor.svelte';
	import type { JsonSchema, JsonValue } from './jsonEditor.schema.js';

	let {
		schema,
		value,
		onSubmit,
		onNativeSubmit
	}: {
		schema: JsonSchema;
		value?: JsonValue;
		onSubmit?: (values: Record<string, unknown>) => void;
		onNativeSubmit?: (data: FormData) => void;
	} = $props();
</script>

<Theme>
	<Form
		inputs={{ config: { type: 'json', label: 'Config', schema, defaultValue: value } }}
		onSubmit={(values: Record<string, unknown>) => onSubmit?.(values)}
	>
		{#snippet footer(form)}
			<button type="button" onclick={() => form.submit()}>Submit the Form</button>
		{/snippet}
	</Form>
	<form
		data-testid="native"
		onsubmit={(event) => {
			event.preventDefault();
			onNativeSubmit?.(new FormData(event.currentTarget));
		}}
	>
		<JsonEditor name="payload" label="Payload" {schema} defaultValue={value} />
		<button type="submit">Submit natively</button>
	</form>
</Theme>
