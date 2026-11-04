<script lang="ts">
	// Harness: model text through Markdown's defaults, inside a Theme.
	import Theme from '../Theme/Theme.svelte';
	import Markdown from './Markdown.svelte';
	import type { MarkdownProps } from './markdown.props.js';

	let props: MarkdownProps = $props();
</script>

<Theme><Markdown {...props} /></Theme>
