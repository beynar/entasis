<script lang="ts">
	// Test-only: one line of Markdown inside a heading, the way a title uses it.
	import Theme from '../Theme/Theme.svelte';
	import Markdown from './Markdown.svelte';

	let { content }: { content: string } = $props();
</script>

<Theme>
	<h2 data-testid="title" style="font-size: 30px"><Markdown {content} inline class="line" /></h2>
</Theme>
