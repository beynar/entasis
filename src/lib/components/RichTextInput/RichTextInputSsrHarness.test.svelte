<script lang="ts">
	import AIComposer from '../AIComposer/AIComposer.svelte';
	import Form from '../Form/Form/Form.svelte';
	import Theme from '../Theme/Theme.svelte';
	import RichTextInput from './RichTextInput.svelte';
	import type { FormInputs } from '../Form/Form/form.js';
	import type { RichTextInputProps } from './richTextInput.props.js';

	let {
		kind,
		toolbar = 'hover'
	}: { kind: 'input' | 'form' | 'composer'; toolbar?: RichTextInputProps['toolbar'] } = $props();

	const inputs = $derived({
		description: {
			type: 'rich-text',
			label: 'Description',
			toolbar,
			formats: ['heading2', 'bold', 'italic', 'strikethrough', 'link', 'bulletList']
		}
	} satisfies FormInputs);
</script>

<Theme>
	{#if kind === 'input'}
		<RichTextInput label="Notes" {toolbar} value="Bonjour **le** monde" />
	{:else if kind === 'form'}
		<Form {inputs} />
	{:else}
		<AIComposer />
	{/if}
</Theme>
