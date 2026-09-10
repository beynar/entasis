<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import RichTextInput from './RichTextInput.svelte';
	import type { RichTextInputHandle, RichTextInputProps } from './richTextInput.props.js';

	let {
		value,
		defaultValue,
		onValueChange
	}: Pick<RichTextInputProps, 'value' | 'defaultValue' | 'onValueChange'> = $props();
	let editor: RichTextInputHandle | undefined = $state();
</script>

<Theme>
	<RichTextInput
		bind:this={editor}
		{value}
		{defaultValue}
		{onValueChange}
		label="Editor"
		toolbar="none"
	/>
	<button type="button" onclick={() => editor?.clear()}>Clear editor</button>
</Theme>
