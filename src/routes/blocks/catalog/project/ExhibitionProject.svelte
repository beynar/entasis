<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Chip } from 'entasis/chip';
	import { Button } from 'entasis/button';
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Exhibition / Volume 03
		</p>
		<Heading size="h2" weight="bold">In the space between.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			An exploration of material, light, and the traces we leave behind.
		</p>
	</header>
	<div class="gap-xl grid md:grid-cols-[1.5fr_1fr]">
		<img
			src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
			alt="Desert light"
			loading="lazy"
			class="aspect-[4/3] w-full rounded-lg object-cover"
		/>
		<div class="gap-xl flex flex-col">
			<Chip variant="soft" class="w-fit">September 12 — October 24</Chip><Heading size="h3"
				>Objects in conversation.</Heading
			>
			<p class="text-neutral/65">
				A collection of studies in contrast: rough and smooth, solid and transparent, permanent and
				temporary.
			</p>
			<dl class="gap-lg flex flex-col text-sm">
				{#each [['Materials', 'Clay, glass, and brushed steel'], ['Dimensions', 'Variable installation'], ['Location', 'The Annex · Paris'], ['Curated by', 'Studio Fieldnotes']] as row (row[0])}<div
						class="gap-lg border-neutral/15 pb-lg flex justify-between border-b"
					>
						<dt class="text-neutral/65">{row[0]}</dt>
						<dd class="text-right">{row[1]}</dd>
					</div>{/each}
			</dl>
			<Button href="/docs" variant="outline" class="self-start">Exhibition notes ↗</Button>
		</div>
	</div>
</section>
