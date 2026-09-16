<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Card } from 'svelai/card';
	import { Avatar } from 'svelai/avatar';
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Northstar / Customer story
		</p>
		<Heading size="h2" weight="bold">A calmer way to find your next favorite thing.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			How a growing homeware brand made the buying experience feel as considered as its products.
		</p>
	</header>
	<img
		src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
		alt="A place to pause"
		loading="lazy"
		class="aspect-[21/9] w-full rounded-lg object-cover"
	/>
	<div class="gap-xl grid md:grid-cols-[12rem_1fr]">
		<aside class="gap-xl flex flex-col">
			<Chip variant="soft" class="w-fit">Commerce</Chip>
			<dl class="gap-xl flex flex-col text-sm">
				<div>
					<dt class="text-neutral/65">Services</dt>
					<dd>Strategy, design, development</dd>
				</div>
				<div>
					<dt class="text-neutral/65">Timeline</dt>
					<dd>12 weeks</dd>
				</div>
				<div>
					<dt class="text-neutral/65">Year</dt>
					<dd>2026</dd>
				</div>
			</dl>
		</aside>
		<article class="gap-xl flex flex-col">
			<Heading size="h3">From choice overload to clear decisions.</Heading>
			<p class="text-neutral/70 leading-relaxed">
				Northstar had outgrown its first storefront. Customers loved the products but struggled to
				compare finishes and understand delivery. We brought those decisions into the product page
				and simplified the path to checkout.
			</p>
			<div class="gap-lg grid sm:grid-cols-3">
				{#each [{ value: '+34%', label: 'Conversion' }, { value: '−28%', label: 'Cart abandonment' }, { value: '4.9/5', label: 'Customer satisfaction' }] as metric (metric.label)}<Card
						variant="soft"
						><Stack gap="md"
							><p class="text-3xl font-semibold">{metric.value}</p>
							<p class="text-neutral/70 text-sm">{metric.label}</p></Stack
						></Card
					>{/each}
			</div>
			<blockquote class="border-primary pl-xl border-l-2 text-xl">
				“The site finally feels like walking into our store.”
			</blockquote>
			<div class="gap-md flex items-center">
				<Avatar name="Lena Brooks" /><span class="text-sm">Lena Brooks · Founder, Northstar</span>
			</div>
			<p class="text-neutral/65 text-xs">Illustrative customer story and sample metrics.</p>
		</article>
	</div>
</section>
