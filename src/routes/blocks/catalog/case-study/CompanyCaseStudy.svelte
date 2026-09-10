<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="grid gap-xl lg:grid-cols-[1fr_18rem]">
		<article class="flex flex-col gap-xl">
			<header class="flex flex-col gap-lg">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary">
					Forma / Product design
				</p>
				<Heading size="h2" weight="bold">A shared language for a growing team.</Heading>
			</header>
			<img
				src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
				alt="Desert light"
				loading="lazy"
				class="aspect-video w-full rounded-lg object-cover"
			/><Heading size="h3">One system. Many useful possibilities.</Heading>
			<p class="leading-relaxed text-neutral/70">
				As Forma grew, its product teams began solving the same problems in different ways. We
				worked together on a component system that makes familiar patterns easy to use and uncommon
				workflows possible to express.
			</p>
			<div class="grid gap-xl sm:grid-cols-2">
				<div>
					<h4 class="font-semibold">The challenge</h4>
					<p class="mt-lg text-neutral/65">
						Reduce repetitive design decisions without limiting the team’s creativity.
					</p>
				</div>
				<div>
					<h4 class="font-semibold">The approach</h4>
					<p class="mt-lg text-neutral/65">
						Start with real workflows, keep ownership clear, and document the decisions that matter.
					</p>
				</div>
			</div>
			<blockquote class="rounded-lg bg-primary-muted p-xl text-xl">
				“We spend more time on the problem, and less on recreating a button.”
			</blockquote>
		</article>
		<aside class="lg:sticky lg:top-xl lg:self-start">
			<Card title="Forma" description="Tools for thoughtful teams"
				><div class="flex flex-col gap-xl">
					<Chip variant="soft" class="w-fit">Software / 80 people</Chip>
					<dl class="flex flex-col gap-lg text-sm">
						<div>
							<dt class="text-neutral/50">Headquarters</dt>
							<dd>Copenhagen, Denmark</dd>
						</div>
						<div>
							<dt class="text-neutral/50">Focus</dt>
							<dd>Product design systems</dd>
						</div>
					</dl>
					<p class="text-4xl font-semibold">2.4×</p>
					<p class="text-neutral/60">Faster onboarding in this sample story.</p>
					<Button href="/components" variant="outline">Explore the components</Button>
				</div></Card
			>
		</aside>
	</div>
</section>
