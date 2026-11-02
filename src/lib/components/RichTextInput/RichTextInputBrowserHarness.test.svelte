<script lang="ts">
	// A RichTextInput whose markdown value shows beside it, with its handle's methods as buttons.
	import Theme from '../Theme/Theme.svelte';
	import RichTextInput from './RichTextInput.svelte';
	import type { RichTextInputHandle, RichTextInputProps } from './richTextInput.props.js';

	let {
		value: initial = '',
		next = '',
		...props
	}: Omit<RichTextInputProps, 'value'> & { value?: string; next?: string } = $props();
	// svelte-ignore state_referenced_locally
	let value = $state(initial);
	let editor: RichTextInputHandle | undefined = $state();
</script>

<Theme>
	<RichTextInput bind:this={editor} bind:value label="Editor" {...props} />
	<output data-testid="value">{value}</output>
	<button type="button" onclick={() => (value = next)}>Set value</button>
	<button type="button" onclick={() => editor?.clear()}>Clear</button>
	<button type="button" onclick={() => editor?.focus()}>Focus</button>
	<button type="button" onclick={() => editor?.insertText('inserted')}>Insert text</button>
	<button
		type="button"
		onclick={() =>
			editor?.insertToken({ kind: 'file', id: 'f1', label: 'brief.md', path: 'docs/brief.md' })}
		>Insert token</button
	>
</Theme>
