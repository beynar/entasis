<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import HiddenInputsControl from './HiddenInputsControl.test.svelte';

	let {
		onSubmit,
		value = $bindable(),
		...control
	}: ComponentProps<typeof HiddenInputsControl> & {
		onSubmit?: (data: FormData) => void;
	} = $props();
</script>

<form
	id="native"
	data-testid="form"
	onsubmit={(event) => {
		event.preventDefault();
		onSubmit?.(new FormData(event.currentTarget));
	}}
>
	<HiddenInputsControl {...control} bind:value />
	<button type="submit">Save</button>
</form>
<form id="elsewhere" data-testid="elsewhere"></form>
