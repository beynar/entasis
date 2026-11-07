<script lang="ts">
	// Test-only: Markdown, or a model's message, whose text the test can move on.
	import AIMessage from '../AIMessage/AIMessage.svelte';
	import Theme from '../Theme/Theme.svelte';
	import Markdown from './Markdown.svelte';

	let {
		content,
		message = false,
		isStatic = false
	}: { content: string; message?: boolean; isStatic?: boolean } = $props();
</script>

<Theme>
	<div data-testid="host" style="width: 600px">
		{#if message}
			<AIMessage
				from="assistant"
				{content}
				markdownProps={isStatic ? { static: true } : undefined}
			/>
		{:else}
			<Markdown {content} static={isStatic} />
		{/if}
	</div>
</Theme>
