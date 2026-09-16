<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-xl border-neutral/15 pb-xl grid border-b md:grid-cols-[1.5fr_1fr]">
		<div class="gap-xl flex flex-col">
			<Chip class="w-fit" variant="soft">Selected project / 01</Chip><Heading
				size="h2"
				weight="normal"
				class="font-serif">A quieter place.</Heading
			>
			<p class="text-neutral/65 max-w-lg text-lg">
				A home shaped by the landscape, the changing light, and the people who live there.
			</p>
		</div>
		<dl class="gap-xl grid grid-cols-2 text-sm">
			<div>
				<dt class="text-neutral/65">Client</dt>
				<dd class="mt-md">Private residence</dd>
			</div>
			<div>
				<dt class="text-neutral/65">Location</dt>
				<dd class="mt-md">Northern California</dd>
			</div>
			<div>
				<dt class="text-neutral/65">Services</dt>
				<dd class="mt-md">Architecture / Interiors</dd>
			</div>
			<div>
				<dt class="text-neutral/65">Year</dt>
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
	<div class="gap-xl flex flex-wrap items-center justify-between">
		<p class="text-neutral/65 max-w-2xl">
			An exploration of warmth, restraint, and the relationship between a building and its
			surroundings.
		</p>
		<Button href="/components" variant="outline">All projects ↗</Button>
	</div>
</section>
