<script lang="ts">
	// Test-only: Markdown given its options with a spread, or a message given `markdownProps`, so the
	// test can change one of them after mount.
	import AIMessage from '../AIMessage/AIMessage.svelte';
	import Theme from '../Theme/Theme.svelte';
	import Markdown from './Markdown.svelte';
	import type { MarkdownProps } from './markdown.props.js';

	let {
		content,
		options,
		message = false
	}: { content: string; options: Partial<MarkdownProps>; message?: boolean } = $props();
</script>

<Theme>
	<div data-testid="host">
		{#if message}
			<AIMessage from="assistant" {content} markdownProps={options} />
		{:else}
			<Markdown {content} {...options} />
		{/if}
	</div>
</Theme>
