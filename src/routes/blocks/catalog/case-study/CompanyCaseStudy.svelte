<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Button } from 'entasis/button';
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="gap-xl grid lg:grid-cols-[1fr_18rem]">
		<article class="gap-xl flex flex-col">
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
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
			<p class="text-neutral/70 leading-relaxed">
				As Forma grew, its product teams began solving the same problems in different ways. We
				worked together on a component system that makes familiar patterns easy to use and uncommon
				workflows possible to express.
			</p>
			<div class="gap-xl grid sm:grid-cols-2">
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
			<blockquote class="bg-primary-muted p-xl rounded-lg text-xl">
				“We spend more time on the problem, and less on recreating a button.”
			</blockquote>
		</article>
		<aside class="lg:top-xl lg:sticky lg:self-start">
			<Card title="Forma" description="Tools for thoughtful teams"
				><div class="gap-xl flex flex-col">
					<Chip variant="soft" class="w-fit">Software / 80 people</Chip>
					<dl class="gap-lg flex flex-col text-sm">
						<div>
							<dt class="text-neutral/65">Headquarters</dt>
							<dd>Copenhagen, Denmark</dd>
						</div>
						<div>
							<dt class="text-neutral/65">Focus</dt>
							<dd>Product design systems</dd>
						</div>
					</dl>
					<p class="text-4xl font-semibold">2.4×</p>
					<p class="text-neutral/70">Faster onboarding in this sample story.</p>
					<Button href="/components" variant="outline">Explore the components</Button>
				</div></Card
			>
		</aside>
	</div>
</section>
