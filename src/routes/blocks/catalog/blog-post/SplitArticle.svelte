<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Avatar } from 'svelai/avatar';
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
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<article class="flex flex-col gap-xl">
		<header class="grid gap-xl md:grid-cols-2">
			<div class="flex flex-col gap-xl justify-center">
				<p class="text-xs uppercase tracking-widest text-primary">Culture / 8 minute read</p>
				<Heading size="h2" weight="bold">The world is a better brief.</Heading>
				<p class="text-lg text-neutral/65">
					On leaving the desk, following your curiosity, and finding ideas in unexpected places.
				</p>
				<div class="flex gap-md items-center">
					<Avatar user={{ name: 'Sam Rivera' }} /><span class="text-sm"
						>Sam Rivera · June 12, 2026</span
					>
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
		<div class="grid gap-xl md:grid-cols-[1fr_2fr]">
			<blockquote class="text-2xl font-light leading-relaxed text-primary">
				“Attention is the first material we work with.”
			</blockquote>
			<div class="flex flex-col gap-xl">
				{#each sections as section (section.title)}<section class="flex flex-col gap-lg">
						<Heading size="h4">{section.title}</Heading>
						<p class="leading-relaxed text-neutral/70">{section.body}</p>
					</section>{/each}
			</div>
		</div>
	</article>
</section>
