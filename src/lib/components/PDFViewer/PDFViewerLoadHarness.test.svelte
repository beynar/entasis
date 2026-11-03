<script lang="ts">
	// Owns a PDFViewerState the way a viewer does, and hands it to the test once mounted.
	import { onMount } from 'svelte';
	import { PDFViewerState } from './pdfViewer.state.svelte.js';

	let {
		options,
		onReady
	}: {
		options: ConstructorParameters<typeof PDFViewerState>[0];
		onReady: (state: PDFViewerState) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const state = new PDFViewerState(options);
	onMount(() => onReady(state));
</script>
