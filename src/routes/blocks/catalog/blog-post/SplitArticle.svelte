<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Avatar } from 'entasis/avatar';
	import { Separator } from 'entasis/separator';
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
	<article class="gap-xl flex flex-col">
		<header class="gap-xl grid md:grid-cols-2">
			<div class="gap-xl flex flex-col justify-center">
				<p class="text-primary-readable text-xs tracking-widest uppercase">
					Culture / 8 minute read
				</p>
				<Heading size="h2" weight="bold">The world is a better brief.</Heading>
				<p class="text-neutral/65 text-lg">
					On leaving the desk, following your curiosity, and finding ideas in unexpected places.
				</p>
				<div class="gap-md flex items-center">
					<Avatar name="Sam Rivera" /><span class="text-sm">Sam Rivera · June 12, 2026</span>
				</div>
			</div>
			<img
				src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
				alt="Alpine morning"
				loading="lazy"
				class="aspect-[4/5] w-full rounded-lg object-cover"
			/>
		</header>
		<Separator />
		<div class="gap-xl grid md:grid-cols-[1fr_2fr]">
			<blockquote class="text-primary-readable text-2xl leading-relaxed font-light">
				“Attention is the first material we work with.”
			</blockquote>
			<div class="gap-xl flex flex-col">
				{#each sections as section (section.title)}<section class="gap-lg flex flex-col">
						<Heading size="h4">{section.title}</Heading>
						<p class="text-neutral/70 leading-relaxed">{section.body}</p>
					</section>{/each}
			</div>
		</div>
	</article>
</section>
