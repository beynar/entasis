<script lang="ts">
	// An entasis Form around the inputs a test passes, with a button that submits it.
	import Theme from '../../Theme/Theme.svelte';
	import Form from '../Form/Form.svelte';
	import type { FormInputs } from '../Form/form.js';

	let {
		inputs,
		onSubmit
	}: {
		inputs: FormInputs;
		onSubmit?: (value: Record<string, unknown>) => void;
	} = $props();
</script>

<Theme>
	<Form {inputs} onSubmit={(value) => onSubmit?.(value as Record<string, unknown>)}>
		{#snippet children(form)}
			<button type="button" onclick={() => form.submit()}>Submit form</button>
		{/snippet}
	</Form>
</Theme>
