<script lang="ts">
	// Harness for `lightboxCaption.browser.test.ts`: an ImageGallery and an ImageZoom with a caption,
	// rendered on the page or inside a Dialog.
	import Theme from '../Theme/Theme.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import ImageZoom from '../ImageZoom/ImageZoom.svelte';
	import ImageGallery from './ImageGallery.svelte';

	let {
		inDialog = false,
		galleryOpen = false,
		zoomOpen = false
	}: { inDialog?: boolean; galleryOpen?: boolean; zoomOpen?: boolean } = $props();
	const image =
		'data:image/svg+xml;utf8,' +
		encodeURIComponent(
			'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="1600" height="1000" fill="#3a7"/></svg>'
		);
	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

{#snippet content()}
	<ImageGallery open={galleryOpen}>
		<img src={image} alt="Green" title="Green" style="width:120px" />
		{#snippet caption()}<span data-testid="gallery-caption">Gallery caption</span>{/snippet}
	</ImageGallery>
	<ImageZoom open={zoomOpen} src={image} alt="Zoomed">
		{#snippet caption()}<span data-testid="zoom-caption">Zoom caption</span>{/snippet}
	</ImageZoom>
{/snippet}

<Theme>
	{#if inDialog}
		<Dialog open title="Photos" transition={zero}>{@render content()}</Dialog>
	{:else}
		{@render content()}
	{/if}
</Theme>
