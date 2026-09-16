<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Breadcrumbs } from 'svelai/breadcrumbs';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<Breadcrumbs
		items={[
			{ label: 'Resources', href: '/docs' },
			{ label: 'Design systems', href: '/docs' },
			{ label: 'A practical guide', active: true }
		]}
	/>
	<div class="gap-xl grid md:grid-cols-[1fr_17rem]">
		<article class="gap-xl flex flex-col">
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					Guide / 12 minute read
				</p>
				<Heading size="h2" weight="bold">A practical guide to a shared design language.</Heading>
				<p class="text-neutral/65 max-w-2xl">
					Start with the real work your team does, then make the useful patterns easier to repeat.
				</p>
			</header>
			<img
				src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
				alt="Alpine morning"
				loading="lazy"
				class="aspect-video w-full rounded-lg object-cover"
			/><Heading size="h3">Begin with the product.</Heading>
			<p class="text-neutral/70 leading-relaxed">
				A design system earns its place by solving repeated problems. Look for the patterns your
				team already uses, learn where they break down, and give those patterns clear names and
				responsibilities.
			</p>
			<Heading size="h3">Keep the decisions close.</Heading>
			<p class="text-neutral/70 leading-relaxed">
				Useful documentation explains when a pattern belongs in the interface and what it promises.
				Keep examples small enough to understand, and complete enough to use.
			</p>
		</article>
		<aside class="md:top-xl md:sticky md:self-start">
			<Card title="Inside this guide" description="A useful starting point for your team"
				><div class="gap-xl flex flex-col">
					<Chip class="w-fit" variant="soft">Design systems</Chip>
					<ol class="gap-lg flex list-inside list-decimal flex-col text-sm">
						<li>Find the repeated patterns</li>
						<li>Name responsibilities</li>
						<li>Document real examples</li>
						<li>Learn from use</li>
					</ol>
					<Button href="/components" fullWidth>Explore the components</Button>
					<p class="text-neutral/65 text-xs">Updated June 2026</p>
				</div></Card
			>
		</aside>
	</div>
</section>
