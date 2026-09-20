<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Avatar } from 'entasis/avatar';
	import { Chip } from 'entasis/chip';
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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<article class="gap-xl mx-auto flex max-w-2xl flex-col">
		<header class="gap-xl flex flex-col items-center text-center">
			<Chip size="small" variant="outline" color="neutral">Essay № 24</Chip><Heading
				size="h2"
				weight="normal">A little more attention.<br />A little less noise.</Heading
			>
			<p class="text-neutral/70 text-lg">
				Some thoughts on finding a sustainable pace for creative work.
			</p>
			<Avatar name="Alex Morgan" />
			<p class="text-neutral/65 text-xs">Alex Morgan · 5 minute read</p>
		</header>
		<p
			class="first-letter:mr-sm text-lg leading-relaxed first-letter:float-left first-letter:text-6xl"
		>
			The quality of our work often follows the quality of our attention. When every moment is
			filled, we lose the chance to notice the small details that make an idea worth pursuing.
		</p>
		{#each sections as section (section.title)}<section class="gap-lg flex flex-col">
				<Heading size="h4">{section.title}</Heading>
				<p class="text-neutral/70 leading-relaxed">{section.body}</p>
			</section>{/each}
		<p class="border-neutral/15 pt-xl text-neutral/65 border-t text-center text-sm">
			Thank you for reading. Make room for a good thought today.
		</p>
	</article>
</section>
