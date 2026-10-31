<script lang="ts">
	// A SignatureInput in a native form, with its value and changes reported to the test.
	import SignatureInput from './SignatureInput.svelte';
	import type { SignatureInputProps } from './signatureInput.props.js';

	let { value = $bindable(), ...props }: SignatureInputProps = $props();
</script>

<form data-testid="form">
	<SignatureInput name="signature" format="svg" bind:value {...props} />
</form>
