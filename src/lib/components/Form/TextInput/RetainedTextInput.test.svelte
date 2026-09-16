<script lang="ts">
	import TextInput from './TextInput.svelte';
	import type { TextInputProps } from './textInput.props.js';

	let { onValueChange }: { onValueChange: (value: string | null) => void } = $props();
	let controlProps = $state<TextInputProps>({
		defaultValue: 'Initial',
		onValueChange(value) {
			onValueChange(value);
			controlProps = { ...controlProps, density: 'comfortable' };
		}
	});
</script>

<TextInput {...controlProps} />
