<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Avatar } from 'svelai/avatar';
	import { Chip } from 'svelai/chip';
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
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<article class="flex flex-col gap-xl mx-auto max-w-2xl">
		<header class="flex flex-col gap-xl items-center text-center">
			<Chip size="small" variant="outline" color="neutral">Essay № 24</Chip><Heading
				size="h2"
				weight="normal">A little more attention.<br />A little less noise.</Heading
			>
			<p class="text-lg text-neutral/60">
				Some thoughts on finding a sustainable pace for creative work.
			</p>
			<Avatar user={{ name: 'Alex Morgan' }} />
			<p class="text-xs text-neutral/50">Alex Morgan · 5 minute read</p>
		</header>
		<p
			class="text-lg leading-relaxed first-letter:float-left first-letter:mr-sm first-letter:text-6xl"
		>
			The quality of our work often follows the quality of our attention. When every moment is
			filled, we lose the chance to notice the small details that make an idea worth pursuing.
		</p>
		{#each sections as section (section.title)}<section class="flex flex-col gap-lg">
				<Heading size="h4">{section.title}</Heading>
				<p class="leading-relaxed text-neutral/70">{section.body}</p>
			</section>{/each}
		<p class="border-t border-neutral/15 pt-xl text-center text-sm text-neutral/50">
			Thank you for reading. Make room for a good thought today.
		</p>
	</article>
</section>
