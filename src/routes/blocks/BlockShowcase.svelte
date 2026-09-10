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

<article class="mx-auto flex w-full max-w-7xl flex-col gap-xl">
	<header class="flex max-w-3xl flex-col gap-sm">
		<a class="text-primary-readable text-sm font-medium hover:underline" href={resolve('/blocks')}
			>Blocks</a
		>
		<h1 class="text-neutral text-4xl font-bold tracking-tight">{title}</h1>
		<p class="text-neutral/70 text-base">{description}</p>
	</header>

	<section class="border-neutral-muted bg-surface-canvas overflow-hidden rounded-lg border">
		<div class="min-h-96 p-xl">
			{@render children()}
		</div>
	</section>

	<details class="border-neutral-muted bg-surface-canvas overflow-hidden rounded-lg border">
		<summary class="cursor-pointer px-xl py-lg font-medium">View source</summary>
		<pre class="border-neutral-muted overflow-auto border-t p-xl text-sm"><code>{source}</code
			></pre>
	</details>
</article>
