<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import LinkPreview from './LinkPreview.svelte';
	import type { LinkPreviewProps } from './linkPreview.props.js';

	const props: LinkPreviewProps = $props();
</script>

<Theme>
	{#snippet children()}
		<LinkPreview {...props} />
	{/snippet}
</Theme>
