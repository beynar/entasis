<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		caption,
		varies,
		note,
		layout = 'wrap',
		class: className = '',
		children
	}: {
		/** Component name shown above the block. */
		caption: string;
		/** Which props vary inside the block, so screenshots are self-explanatory. */
		varies?: string;
		/** Visible caveat (representative example, skipped feature, required setup). */
		note?: string;
		layout?: 'wrap' | 'stack' | 'grid' | 'block';
		class?: string;
		children: Snippet;
	} = $props();

	const layoutClass = {
		wrap: 'flex flex-wrap items-center gap-sm',
		stack: 'grid gap-sm',
		grid: 'grid gap-sm sm:grid-cols-2 lg:grid-cols-3',
		block: 'block'
	} as const;
</script>

<div class="gap-xs grid" data-stress-block={caption}>
	<p class="text-neutral/70 text-xs font-semibold tracking-wide uppercase">
		{caption}
		{#if varies}
			<span class="text-neutral/65 font-normal normal-case">— varies: {varies}</span>
		{/if}
	</p>
	{#if note}
		<p class="text-warning-readable text-xs" data-stress-note>{note}</p>
	{/if}
	<div class="{layoutClass[layout]} {className}">
		{@render children()}
	</div>
</div>
