<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		title,
		description,
		children
	}: {
		id: string;
		title: string;
		description?: string;
		children: Snippet;
	} = $props();
</script>

<section {id} data-stress-section={id} class="gap-lg grid scroll-mt-24">
	<header class="gap-xs border-neutral-muted pb-sm grid border-b">
		<h2 class="text-neutral text-2xl font-semibold">{title}</h2>
		{#if description}
			<p class="text-neutral/60 text-sm">{description}</p>
		{/if}
	</header>
	<div class="gap-lg grid">
		{@render children()}
	</div>
</section>
