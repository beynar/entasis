<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="grid gap-xl border-b border-neutral/15 pb-xl md:grid-cols-[1.5fr_1fr]">
		<div class="flex flex-col gap-xl">
			<Chip class="w-fit" variant="soft">Selected project / 01</Chip><Heading
				size="h2"
				weight="normal"
				class="font-serif">A quieter place.</Heading
			>
			<p class="max-w-lg text-lg text-neutral/65">
				A home shaped by the landscape, the changing light, and the people who live there.
			</p>
		</div>
		<dl class="grid grid-cols-2 gap-xl text-sm">
			<div>
				<dt class="text-neutral/45">Client</dt>
				<dd class="mt-md">Private residence</dd>
			</div>
			<div>
				<dt class="text-neutral/45">Location</dt>
				<dd class="mt-md">Northern California</dd>
			</div>
			<div>
				<dt class="text-neutral/45">Services</dt>
				<dd class="mt-md">Architecture / Interiors</dd>
			</div>
			<div>
				<dt class="text-neutral/45">Year</dt>
				<dd class="mt-md">2026</dd>
			</div>
		</dl>
	</header>
	<img
		src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
		alt="A place to pause"
		loading="lazy"
		class="aspect-[16/7] w-full rounded-lg object-cover"
	/>
	<div class="flex gap-xl items-center justify-between flex-wrap">
		<p class="max-w-2xl text-neutral/65">
			An exploration of warmth, restraint, and the relationship between a building and its
			surroundings.
		</p>
		<Button href="/components" variant="outline">All projects ↗</Button>
	</div>
</section>
