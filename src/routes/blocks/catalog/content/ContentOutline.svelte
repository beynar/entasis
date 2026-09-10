<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Separator } from 'svelai/separator';
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
			<Chip variant="soft" class="w-fit">Field guide</Chip>
			<nav aria-label="Guide outline" class="flex flex-col gap-lg">
				{#each sections as section, i (section.title)}<a
						href={`#${sectionId}-${i}`}
						class="text-sm text-neutral/60 hover:text-primary">0{i + 1} / {section.title}</a
					>{/each}
			</nav>
		</aside>
		<article class="flex flex-col gap-xl max-w-3xl">
			<header class="flex flex-col gap-lg">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary">
					A practical perspective
				</p>
				<Heading size="h2" weight="bold">Design for the everyday.</Heading>
				<p class="max-w-2xl text-neutral/65">
					A guide to making thoughtful decisions about the things around us.
				</p>
			</header>
			<Separator />{#each sections as section, i (section.title)}<section
					id={`${sectionId}-${i}`}
					class="flex flex-col gap-xl"
				>
					<Heading size="h3">{section.title}</Heading>
					<p class="leading-relaxed text-neutral/70">{section.body}</p>
					{#if i === 1}<blockquote class="border-l-2 border-primary pl-xl text-xl">
							The best design makes room for a life, rather than prescribing one.
						</blockquote>{/if}
				</section>{/each}
		</article>
	</div>
</section>
