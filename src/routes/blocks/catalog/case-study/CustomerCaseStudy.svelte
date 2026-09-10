<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Card } from 'svelai/card';
	import { Avatar } from 'svelai/avatar';
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
			Northstar / Customer story
		</p>
		<Heading size="h2" weight="bold">A calmer way to find your next favorite thing.</Heading>
		<p class="max-w-2xl text-neutral/65">
			How a growing homeware brand made the buying experience feel as considered as its products.
		</p>
	</header>
	<img
		src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
		alt="A place to pause"
		loading="lazy"
		class="aspect-[21/9] w-full rounded-lg object-cover"
	/>
	<div class="grid gap-xl md:grid-cols-[12rem_1fr]">
		<aside class="flex flex-col gap-xl">
			<Chip variant="soft" class="w-fit">Commerce</Chip>
			<dl class="flex flex-col gap-xl text-sm">
				<div>
					<dt class="text-neutral/50">Services</dt>
					<dd>Strategy, design, development</dd>
				</div>
				<div>
					<dt class="text-neutral/50">Timeline</dt>
					<dd>12 weeks</dd>
				</div>
				<div>
					<dt class="text-neutral/50">Year</dt>
					<dd>2026</dd>
				</div>
			</dl>
		</aside>
		<article class="flex flex-col gap-xl">
			<Heading size="h3">From choice overload to clear decisions.</Heading>
			<p class="leading-relaxed text-neutral/70">
				Northstar had outgrown its first storefront. Customers loved the products but struggled to
				compare finishes and understand delivery. We brought those decisions into the product page
				and simplified the path to checkout.
			</p>
			<div class="grid gap-lg sm:grid-cols-3">
				{#each [{ value: '+34%', label: 'Conversion' }, { value: '−28%', label: 'Cart abandonment' }, { value: '4.9/5', label: 'Customer satisfaction' }] as metric (metric.label)}<Card
						variant="soft"
						><Stack gap="md"
							><p class="text-3xl font-semibold">{metric.value}</p>
							<p class="text-sm text-neutral/60">{metric.label}</p></Stack
						></Card
					>{/each}
			</div>
			<blockquote class="border-l-2 border-primary pl-xl text-xl">
				“The site finally feels like walking into our store.”
			</blockquote>
			<div class="flex gap-md items-center">
				<Avatar user={{ name: 'Lena Brooks' }} /><span class="text-sm"
					>Lena Brooks · Founder, Northstar</span
				>
			</div>
			<p class="text-xs text-neutral/45">Illustrative customer story and sample metrics.</p>
		</article>
	</div>
</section>
