<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Breadcrumbs } from 'svelai/breadcrumbs';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<Breadcrumbs
		items={[
			{ label: 'Resources', href: '/docs' },
			{ label: 'Design systems', href: '/docs' },
			{ label: 'A practical guide', active: true }
		]}
	/>
	<div class="grid gap-xl md:grid-cols-[1fr_17rem]">
		<article class="flex flex-col gap-xl">
			<header class="flex flex-col gap-lg">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary">
					Guide / 12 minute read
				</p>
				<Heading size="h2" weight="bold">A practical guide to a shared design language.</Heading>
				<p class="max-w-2xl text-neutral/65">
					Start with the real work your team does, then make the useful patterns easier to repeat.
				</p>
			</header>
			<img
				src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
				alt="Alpine morning"
				loading="lazy"
				class="aspect-video w-full rounded-lg object-cover"
			/><Heading size="h3">Begin with the product.</Heading>
			<p class="leading-relaxed text-neutral/70">
				A design system earns its place by solving repeated problems. Look for the patterns your
				team already uses, learn where they break down, and give those patterns clear names and
				responsibilities.
			</p>
			<Heading size="h3">Keep the decisions close.</Heading>
			<p class="leading-relaxed text-neutral/70">
				Useful documentation explains when a pattern belongs in the interface and what it promises.
				Keep examples small enough to understand, and complete enough to use.
			</p>
		</article>
		<aside class="md:sticky md:top-xl md:self-start">
			<Card title="Inside this guide" description="A useful starting point for your team"
				><div class="flex flex-col gap-xl">
					<Chip class="w-fit" variant="soft">Design systems</Chip>
					<ol class="flex flex-col gap-lg list-inside list-decimal text-sm">
						<li>Find the repeated patterns</li>
						<li>Name responsibilities</li>
						<li>Document real examples</li>
						<li>Learn from use</li>
					</ol>
					<Button href="/components" fullWidth>Explore the components</Button>
					<p class="text-xs text-neutral/50">Updated June 2026</p>
				</div></Card
			>
		</aside>
	</div>
</section>
