<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
</script>

<svelte:head>
	<title>{data.block.title} preview · entasis</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main
	class="bg-surface-canvas text-neutral {data.embed === 'preview' ? '' : 'min-h-screen'}"
	class:thumbnail={data.embed === 'thumbnail'}
	data-block-preview={data.block.id}
	data-preview-ready={ready}
>
	{#key `${data.category.slug}/${data.block.id}`}<data.Preview />{/key}
</main>

<style>
	.thumbnail {
		display: grid;
		align-content: center;
	}
</style>
