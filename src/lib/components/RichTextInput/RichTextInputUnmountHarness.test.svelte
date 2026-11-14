<script lang="ts">
	// A RichTextInput (or an AIComposer) removed from the page while focused, as changing room does.
	import Theme from '../Theme/Theme.svelte';
	import AIComposer from '../AIComposer/AIComposer.svelte';
	import RichTextInput from './RichTextInput.svelte';

	let { composer = false }: { composer?: boolean } = $props();

	let shown = $state(true);
	// Some browsers blur a focused element as its block removes it, while Svelte updates that block:
	// the condition below does the same, blurring the editor from inside the block's update.
	const keep = (value: boolean) => {
		if (!value && document.activeElement instanceof HTMLElement) document.activeElement.blur();
		return value;
	};
	// A window event removes it without moving focus first, as a route change does.
	$effect(() => {
		const remove = () => (shown = false);
		window.addEventListener('remove-editor', remove);
		return () => window.removeEventListener('remove-editor', remove);
	});
</script>

<Theme>
	{#if keep(shown)}
		{#if composer}
			<AIComposer onSubmit={() => {}} />
		{:else}
			<RichTextInput label="Message" />
		{/if}
	{/if}
</Theme>
