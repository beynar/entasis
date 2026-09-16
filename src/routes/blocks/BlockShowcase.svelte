<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description: string;
		source: string;
		children: Snippet;
	}

	let { title, description, source, children }: Props = $props();
</script>

<svelte:head>
	<title>{title} block · svelai</title>
	<meta name="description" content={description} />
</svelte:head>

<article class="gap-xl mx-auto flex w-full max-w-7xl flex-col">
	<header class="gap-sm flex max-w-3xl flex-col">
		<a class="text-primary-readable text-sm font-medium hover:underline" href={resolve('/blocks')}
			>Blocks</a
		>
		<h1 class="text-neutral text-4xl font-bold tracking-tight">{title}</h1>
		<p class="text-neutral/70 text-base">{description}</p>
	</header>

	<section class="border-neutral-muted bg-surface-canvas overflow-hidden rounded-lg border">
		<div class="p-xl min-h-96">
			{@render children()}
		</div>
	</section>

	<details class="border-neutral-muted bg-surface-canvas overflow-hidden rounded-lg border">
		<summary class="px-xl py-lg cursor-pointer font-medium">View source</summary>
		<pre class="border-neutral-muted p-xl overflow-auto border-t text-sm"><code>{source}</code
			></pre>
	</details>
</article>
