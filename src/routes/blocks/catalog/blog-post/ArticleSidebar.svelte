<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Avatar } from 'entasis/avatar';
	import { Chip } from 'entasis/chip';
	import { Button } from 'entasis/button';
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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="gap-xl grid md:grid-cols-[12rem_1fr]">
		<aside class="gap-xl md:top-xl flex flex-col md:sticky md:self-start">
			<Chip variant="soft" class="w-fit">Design journal</Chip>
			<p class="text-neutral/65 text-xs tracking-widest uppercase">On this page</p>
			<nav aria-label="Article sections" class="gap-lg flex flex-col">
				{#each sections as section, i (section.title)}<a
						href={`#${sectionId}-${i}`}
						class="hover:text-primary-readable text-sm">{section.title}</a
					>{/each}
			</nav>
			<div class="gap-md flex items-center">
				<Avatar name="Maya Chen" />
				<div class="text-sm">
					<p>Maya Chen</p>
					<p class="text-neutral/65">6 min read</p>
				</div>
			</div>
		</aside>
		<article class="gap-xl flex flex-col">
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					Design / June 2026
				</p>
				<Heading size="h2" weight="bold">The art of making room.</Heading>
				<p class="text-neutral/65 max-w-2xl">
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
					class="gap-lg scroll-mt-xl flex flex-col"
				>
					<Heading size="h3">{section.title}</Heading>
					<p class="text-neutral/75 max-w-prose leading-relaxed">{section.body}</p>
				</section>{/each}<Button href="/docs" variant="link" class="self-start"
				>More from the journal ↗</Button
			>
		</article>
	</div>
</section>
