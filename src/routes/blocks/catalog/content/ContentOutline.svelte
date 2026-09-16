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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="gap-xl grid md:grid-cols-[12rem_1fr]">
		<aside class="gap-xl md:top-xl flex flex-col md:sticky md:self-start">
			<Chip variant="soft" class="w-fit">Field guide</Chip>
			<nav aria-label="Guide outline" class="gap-lg flex flex-col">
				{#each sections as section, i (section.title)}<a
						href={`#${sectionId}-${i}`}
						class="text-neutral/70 hover:text-primary-readable text-sm"
						>0{i + 1} / {section.title}</a
					>{/each}
			</nav>
		</aside>
		<article class="gap-xl flex max-w-3xl flex-col">
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					A practical perspective
				</p>
				<Heading size="h2" weight="bold">Design for the everyday.</Heading>
				<p class="text-neutral/65 max-w-2xl">
					A guide to making thoughtful decisions about the things around us.
				</p>
			</header>
			<Separator />{#each sections as section, i (section.title)}<section
					id={`${sectionId}-${i}`}
					class="gap-xl flex flex-col"
				>
					<Heading size="h3">{section.title}</Heading>
					<p class="text-neutral/70 leading-relaxed">{section.body}</p>
					{#if i === 1}<blockquote class="border-primary pl-xl border-l-2 text-xl">
							The best design makes room for a life, rather than prescribing one.
						</blockquote>{/if}
				</section>{/each}
		</article>
	</div>
</section>
