<script lang="ts">
	// A Button inside a native <form>, so tests can observe whether activating it submits.
	import Theme from '../Theme/Theme.svelte';
	import Button from './Button.svelte';

	let {
		loading = false,
		disabled = false,
		focusableWhenDisabled = false,
		onclick,
		onSubmit
	}: {
		loading?: boolean;
		disabled?: boolean;
		focusableWhenDisabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		onSubmit: (event: SubmitEvent) => void;
	} = $props();
</script>

<Theme>
	<form
		onsubmit={(event) => {
			event.preventDefault();
			onSubmit(event);
		}}
	>
		<input name="note" aria-label="Note" />
		<Button type="submit" {loading} {disabled} {focusableWhenDisabled} {onclick}>Send</Button>
	</form>
</Theme>
