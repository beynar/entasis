<script lang="ts">
	import Chip from '$lib/components/Chip/Chip.svelte';
	import Markdown from '$lib/components/Markdown/Markdown.svelte';
	import Separator from '$lib/components/Separator/Separator.svelte';
	import changelogSource from '../../../CHANGELOG.md?raw';
	import { parseChangelog } from './changelog.js';

	const releases = parseChangelog(changelogSource);
	const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' });
	const formatDate = (date: string) => dateFormat.format(new Date(`${date}T00:00:00Z`));
</script>

<svelte:head>
	<title>Changelog · Entasis</title>
</svelte:head>

<div class="text-neutral mx-auto grid max-w-5xl gap-10 pb-20 lg:grid-cols-[minmax(0,1fr)_11rem]">
	<article class="grid min-w-0 content-start gap-6">
		<header class="grid gap-2">
			<h1 class="text-3xl font-semibold">Changelog</h1>
			<p class="text-neutral/70 text-balance">
				Every release of entasis, newest first. A minor version can carry breaking changes while the
				library is below 1.0; each one lists what to change under “Upgrading from”.
			</p>
		</header>

		{#each releases as release, index (release.id)}
			{#if index > 0}
				<Separator class="my-2" />
			{/if}
			<section id={release.id} class="grid min-w-0 scroll-mt-24 gap-3">
				<div class="flex flex-wrap items-baseline gap-3">
					<h2 class="text-2xl font-semibold">
						<a href="#{release.id}" class="hover:underline">{release.version}</a>
					</h2>
					{#if release.date}
						<time class="text-neutral/70 text-sm" datetime={release.date}>
							{formatDate(release.date)}
						</time>
					{/if}
					{#if index === 0 && release.version !== 'Unreleased'}
						<Chip size="small" variant="soft" color="primary">Latest</Chip>
					{/if}
				</div>
				<Markdown content={release.body} />
			</section>
		{/each}
	</article>

	<nav aria-label="Releases" class="hidden lg:block">
		<ul class="sticky top-24 grid gap-1 text-sm">
			{#each releases as release (release.id)}
				<li>
					<a
						href="#{release.id}"
						class="text-neutral/70 hover:text-neutral flex items-baseline justify-between gap-2 rounded-sm py-0.5"
					>
						<span class="font-medium">{release.version}</span>
						{#if release.date}<span class="text-xs tabular-nums">{release.date}</span>{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</div>
