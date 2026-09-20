<script lang="ts">
	import { resolveLink } from '../appNavigation.js';
	import { componentInventory } from '$lib/generated/componentContract.js';

	const publicEntries = componentInventory.filter((entry) => entry.visibility === 'public');
	const internalEntries = componentInventory.filter((entry) => entry.visibility === 'internal');
</script>

<svelte:head>
	<title>Component inventory · entasis</title>
	<meta
		name="description"
		content="The generated inventory of entasis components, utilities, entrypoints, and documentation."
	/>
</svelte:head>

<article class="mx-auto flex w-full max-w-6xl flex-col gap-10">
	<header class="flex max-w-3xl flex-col gap-3">
		<p class="text-primary text-sm font-semibold">Public surface</p>
		<h1 class="text-neutral text-4xl font-bold tracking-tight">Components and entrypoints</h1>
		<p class="text-neutral/70 text-base">
			This inventory is generated from the package contract. It contains {publicEntries.length}
			public entrypoints and {internalEntries.length} internal entrypoint.
		</p>
	</header>

	<div class="border-neutral-muted overflow-hidden rounded-xl border">
		<div
			class="bg-surface-recessed text-neutral/60 grid grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto] gap-4 border-b px-4 py-3 text-xs font-semibold tracking-wide uppercase"
		>
			<span>Entrypoint</span>
			<span>Capabilities</span>
			<span>Docs</span>
		</div>
		{#each componentInventory as entry (entry.id)}
			<div
				class="border-neutral-muted grid grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto] items-center gap-4 border-b px-4 py-3 last:border-b-0"
			>
				<div class="flex min-w-0 items-center gap-2">
					<code class="text-neutral truncate text-sm">{entry.subpath ?? 'Internal component'}</code>
					{#if entry.visibility === 'internal'}
						<span
							class="bg-warning-muted text-warning-dark rounded px-1.5 py-0.5 text-[0.625rem] font-semibold"
						>
							internal
						</span>
					{/if}
				</div>
				<div class="flex flex-wrap gap-1.5">
					{#each entry.capabilities as capability (capability)}
						<span class="bg-surface-raised text-neutral/70 rounded-md px-2 py-1 text-xs">
							{capability}
						</span>
					{/each}
				</div>
				<div class="flex flex-wrap justify-end gap-2">
					{#each entry.docs as doc (doc.id)}
						<a
							class="text-primary text-sm font-medium hover:underline"
							href={resolveLink(doc.route)}>{doc.label}</a
						>
					{:else}
						<span class="text-neutral/40 text-sm">—</span>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</article>
