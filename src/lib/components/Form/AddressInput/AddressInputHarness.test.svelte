<script lang="ts">
	// An AddressInput in a native form.
	import AddressInput from './AddressInput.svelte';
	import type { AddressInputProps } from './addressInput.props.js';

	let { value = $bindable(), ...props }: AddressInputProps = $props();
</script>

<form data-testid="form">
	<AddressInput bind:value {...props} />
</form>
