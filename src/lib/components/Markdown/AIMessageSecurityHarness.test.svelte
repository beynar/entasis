<script lang="ts">
	// Harness: model text through AIMessage's defaults, inside a Theme.
	import AIMessage from '../AIMessage/AIMessage.svelte';
	import Theme from '../Theme/Theme.svelte';

	let { content }: { content: string } = $props();
</script>

<Theme><AIMessage role="assistant" {content} /></Theme>
