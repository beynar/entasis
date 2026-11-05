<script lang="ts">
	// Test-only: a Mermaid on its own, or a fence in a model's message.
	import AIMessage from '../AIMessage/AIMessage.svelte';
	import Theme from '../Theme/Theme.svelte';
	import Mermaid from './Mermaid.svelte';

	let { chart, fence, images }: { chart?: string; fence?: string; images?: boolean } = $props();
</script>

<Theme>
	{#if fence !== undefined}
		<AIMessage from="assistant" content={fence} markdownProps={{ peleOptions: { images } }} />
	{:else}
		<Mermaid chart={chart ?? ''} {images} />
	{/if}
</Theme>
