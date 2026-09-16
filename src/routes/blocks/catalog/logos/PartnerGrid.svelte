<script lang="ts">
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl items-center md:grid-cols-3">
	<div class="gap-lg flex flex-col items-start">
		<Chip variant="outline">A shared direction</Chip><Heading as="h2" size="h3" weight="bold"
			>Good company for the work ahead.</Heading
		>
		<p class="text-neutral/70 text-sm">
			An example partner section, ready for the teams and brands that belong in your story.
		</p>
	</div>
	<div
		class="border-neutral-muted grid grid-cols-2 overflow-hidden rounded-xl border sm:grid-cols-3 md:col-span-2"
	>
		{#each ['Layers', 'Quotient', 'Capsule', 'Sisyphus', 'Circooles', 'Catalog'] as partner, index (partner)}<div
				class="border-neutral-muted bg-surface p-lg flex min-h-28 items-center justify-center border"
			>
				<span
					class={'text-xl ' + (index % 2 ? 'font-serif italic' : 'font-semibold tracking-tight')}
					>{partner}</span
				>
			</div>{/each}
	</div>
</section>
