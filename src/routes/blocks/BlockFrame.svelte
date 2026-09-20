<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Skeleton } from 'entasis/skeleton';

	interface Props {
		category: string;
		block: string;
		title: string;
		thumbnail?: boolean;
		device?: 'desktop' | 'mobile';
	}

	let { category, block, title, thumbnail = false, device = 'desktop' }: Props = $props();
	let container: HTMLDivElement;
	let width = $state(0);
	let visible = $state(false);
	let loaded = $state(false);
	let height = $state(480);
	let contentObserver: ResizeObserver | undefined;
	const src = $derived(
		`/previews/blocks/${category}/${block}?embed=${thumbnail ? 'thumbnail' : 'preview'}`
	);

	function resizePreview(event: Event) {
		loaded = true;
		if (thumbnail) return;
		const frame = event.currentTarget;
		if (!(frame instanceof HTMLIFrameElement)) return;
		const content = frame.contentDocument?.querySelector('[data-block-preview]');
		if (!content) return;
		contentObserver?.disconnect();
		contentObserver = new ResizeObserver(() => {
			height = Math.min(900, Math.max(240, Math.ceil(content.getBoundingClientRect().height)));
		});
		contentObserver.observe(content);
	}

	onDestroy(() => contentObserver?.disconnect());

	onMount(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				visible = entry.isIntersecting;
				if (!thumbnail && visible) observer.disconnect();
			},
			{ rootMargin: '180px' }
		);
		observer.observe(container);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (!visible) loaded = false;
	});
</script>

<div
	bind:this={container}
	bind:clientWidth={width}
	class="bg-surface-canvas relative overflow-hidden {thumbnail ? 'thumbnail' : 'interactive'}"
	class:mobile={!thumbnail && device === 'mobile'}
	style:min-height={thumbnail ? undefined : `${height}px`}
	aria-hidden={thumbnail ? 'true' : undefined}
	inert={thumbnail}
>
	{#if !loaded}
		<div class="gap-lg p-xl absolute inset-0 flex flex-col justify-center" aria-hidden="true">
			<Skeleton class="h-3 w-1/4" />
			<Skeleton class="h-7 w-2/3" />
			<Skeleton class="h-3 w-1/2" />
			<Skeleton class="h-20 w-full" />
		</div>
	{/if}
	{#if visible}
		<iframe
			{src}
			title={`${title} ${thumbnail ? 'thumbnail' : 'preview'}`}
			{...thumbnail ? { tabindex: -1 } : {}}
			loading="lazy"
			class="bg-surface-canvas block border-0 {loaded ? 'opacity-100' : 'opacity-0'}"
			style:width={thumbnail ? '1100px' : '100%'}
			style:height={thumbnail ? '760px' : `${height}px`}
			style:transform={thumbnail ? `scale(${width / 1100})` : undefined}
			onload={resizePreview}
		></iframe>
	{/if}
</div>

<style>
	.thumbnail {
		aspect-ratio: 1100 / 760;
	}
	.thumbnail iframe {
		pointer-events: none;
		transform-origin: top left;
	}
	.interactive {
		width: 100%;
	}
	.mobile {
		width: min(100%, 390px);
		margin-inline: auto;
		box-shadow: 0 0 0 1px var(--color-neutral-muted);
	}
</style>
