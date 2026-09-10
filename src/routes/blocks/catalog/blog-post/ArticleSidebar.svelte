<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Avatar } from 'svelai/avatar';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	const sections = [
		{
			title: 'Start with less',
			body: 'Every object asks something of a room. It takes up space, catches the light, and changes how we move. A considered interior begins by noticing these relationships before adding anything new.'
		},
		{
			title: 'Make room for use',
			body: 'Choose materials that grow more interesting with daily use. A worn edge or a changing surface can tell a better story than an object kept in perfect condition.'
		},
		{
			title: 'Leave something open',
			body: 'The most useful spaces leave room for a different day. A table becomes a workshop. A quiet corner becomes a place to read. Good design makes these changes feel natural.'
		}
	];
	const sectionId = $props.id();
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="grid gap-xl md:grid-cols-[12rem_1fr]">
		<aside class="flex flex-col gap-xl md:sticky md:top-xl md:self-start">
			<Chip variant="soft" class="w-fit">Design journal</Chip>
			<p class="text-xs uppercase tracking-widest text-neutral/50">On this page</p>
			<nav aria-label="Article sections" class="flex flex-col gap-lg">
				{#each sections as section, i (section.title)}<a
						href={`#${sectionId}-${i}`}
						class="text-sm hover:text-primary">{section.title}</a
					>{/each}
			</nav>
			<div class="flex gap-md items-center">
				<Avatar user={{ name: 'Maya Chen' }} />
				<div class="text-sm">
					<p>Maya Chen</p>
					<p class="text-neutral/50">6 min read</p>
				</div>
			</div>
		</aside>
		<article class="flex flex-col gap-xl">
			<header class="flex flex-col gap-lg">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary">
					Design / June 2026
				</p>
				<Heading size="h2" weight="bold">The art of making room.</Heading>
				<p class="max-w-2xl text-neutral/65">
					How a little less can make space for a little more living.
				</p>
			</header>
			<img
				src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
				alt="A place to pause"
				loading="lazy"
				class="aspect-video w-full rounded-lg object-cover"
			/>{#each sections as section, i (section.title)}<section
					id={`${sectionId}-${i}`}
					class="flex flex-col gap-lg scroll-mt-xl"
				>
					<Heading size="h3">{section.title}</Heading>
					<p class="max-w-prose leading-relaxed text-neutral/75">{section.body}</p>
				</section>{/each}<Button href="/docs" variant="link" class="self-start"
				>More from the journal ↗</Button
			>
		</article>
	</div>
</section>
