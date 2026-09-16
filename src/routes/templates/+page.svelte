<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';

	const templates = [
		{
			href: resolve('/templates/tasks-dashboard'),
			title: 'Tasks dashboard',
			description:
				'A full-page task workspace: project sidebar, overview statistics, status charts and a month-long timeline.',
			tags: ['Sidebar', 'Tabbar', 'Chart', 'Timeline']
		}
	];
</script>

<svelte:head>
	<title>Templates · svelai</title>
	<meta
		name="description"
		content="Full-page application templates built with svelai components and theme tokens only."
	/>
</svelte:head>

<article class="gap-xl mx-auto flex w-full max-w-7xl flex-col">
	<header class="gap-lg border-neutral-muted py-xl flex flex-col border-b">
		<div class="gap-sm text-neutral/70 flex flex-wrap items-center text-xs font-medium">
			<span class="bg-primary size-1.5 rounded-full"></span><span>SVELAI TEMPLATES</span>
		</div>
		<h1 class="text-neutral text-4xl font-semibold tracking-tight md:text-5xl">
			Whole products, not just parts.
		</h1>
		<p class="text-neutral/70 max-w-xl text-base leading-relaxed">
			Complete application screens assembled from svelai components and retuned with theme tokens
			alone. Each one opens outside the docs shell, at its own full-page route.
		</p>
	</header>

	<div class="gap-lg grid grid-cols-1 md:grid-cols-2">
		{#each templates as template (template.href)}
			<Card href={template.href} title={template.title} description={template.description}>
				<div class="gap-xs flex flex-wrap">
					{#each template.tags as tag (tag)}
						<Chip size="small" variant="outline">{tag}</Chip>
					{/each}
				</div>
			</Card>
		{/each}
	</div>
</article>
