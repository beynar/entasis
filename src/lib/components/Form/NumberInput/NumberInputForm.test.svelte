<script lang="ts">
	// NumberInput inside a plain <form>, as in a SvelteKit form action.
	import NumberInput from './NumberInput.svelte';
	import type { NumberInputProps } from './numberInput.props.js';

	let { onSubmit, ...props }: NumberInputProps & { onSubmit?: (data: FormData) => void } = $props();
</script>

<form
	data-testid="form"
	onsubmit={(event) => {
		event.preventDefault();
		onSubmit?.(new FormData(event.currentTarget));
	}}
>
	<NumberInput name="qty" label="Quantity" {...props} />
	<button type="submit">Send</button>
	<button type="reset">Reset</button>
</form>
