<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
			Exhibition / Volume 03
		</p>
		<Heading size="h2" weight="bold">In the space between.</Heading>
		<p class="max-w-2xl text-neutral/65">
			An exploration of material, light, and the traces we leave behind.
		</p>
	</header>
	<div class="grid gap-xl md:grid-cols-[1.5fr_1fr]">
		<img
			src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
			alt="Desert light"
			loading="lazy"
			class="aspect-[4/3] w-full rounded-lg object-cover"
		/>
		<div class="flex flex-col gap-xl">
			<Chip variant="soft" class="w-fit">September 12 — October 24</Chip><Heading size="h3"
				>Objects in conversation.</Heading
			>
			<p class="text-neutral/65">
				A collection of studies in contrast: rough and smooth, solid and transparent, permanent and
				temporary.
			</p>
			<dl class="flex flex-col gap-lg text-sm">
				{#each [['Materials', 'Clay, glass, and brushed steel'], ['Dimensions', 'Variable installation'], ['Location', 'The Annex · Paris'], ['Curated by', 'Studio Fieldnotes']] as row (row[0])}<div
						class="flex gap-lg justify-between border-b border-neutral/15 pb-lg"
					>
						<dt class="text-neutral/55">{row[0]}</dt>
						<dd class="text-right">{row[1]}</dd>
					</div>{/each}
			</dl>
			<Button href="/docs" variant="outline" class="self-start">Exhibition notes ↗</Button>
		</div>
	</div>
</section>
