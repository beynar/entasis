<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import DocumentViewer from './DocumentViewer.svelte';
	import type { DocumentViewerProps } from './documentViewer.props.js';

	const props: DocumentViewerProps = $props();
</script>

<Theme>
	<DocumentViewer {...props} />
</Theme>
