<script lang="ts">
	import Ask from '../Ask/Ask.svelte';
	import Theme from '../../Theme/Theme.svelte';
	import Form from './Form.svelte';
	import type { InferFormValue } from './form.js';

	let {
		onSubmit,
		required = true
	}: {
		onSubmit: (value: unknown) => void;
		required?: boolean;
	} = $props();

	// Plain data, as a server or a tool call would send it.
	const inputs = $derived({
		price: { type: 'test-money', label: 'Price', required, currencies: ['EUR', 'USD'] },
		note: { type: 'text', label: 'Note' }
	} as const);
	let value = $state<Partial<InferFormValue<typeof inputs>>>({});
</script>

<Theme>
	<Ask />
	<Form {inputs} bind:value {onSubmit}>
		{#snippet children(form)}
			<button type="button" onclick={() => form.submit()}>Submit</button>
		{/snippet}
	</Form>
	<output data-testid="live-value">{JSON.stringify(value)}</output>
</Theme>
