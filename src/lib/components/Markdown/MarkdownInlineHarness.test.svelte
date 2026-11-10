<script lang="ts">
	// Test-only: one line of Markdown inside a heading, the way a title uses it, next to the same
	// text as a block, under a Theme whose registry may restyle the Markdown root.
	import Theme from '../Theme/Theme.svelte';
	import type { ComponentThemeRegistry } from '$lib/utils/cva/theme.js';
	import Markdown from './Markdown.svelte';
	import type { MarkdownThemeProps } from './markdown.theme.js';

	let {
		content,
		components,
		theme
	}: { content: string; components?: ComponentThemeRegistry; theme?: MarkdownThemeProps } =
		$props();
</script>

<Theme {components}>
	<h2 data-testid="title" style="font-size: 30px">
		<Markdown {content} inline class="line" {theme} />
	</h2>
	<div data-testid="block"><Markdown {content} {theme} /></div>
</Theme>
