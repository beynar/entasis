<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Marquee } from 'svelai/marquee';
</script>

<section class="flex flex-col gap-xl overflow-hidden bg-surface-recessed p-xl">
	<Heading as="h2" size="h4" align="center">Ideas travel further in good company.</Heading><Marquee
		speed="slow"
		fade
		innerClass="gap-xl"
		><div class="flex items-center gap-xl">
			{#each ['✳ Layers', 'Quotient', '◈ Capsule', 'Sisyphus', 'Circooles', 'Catalog', 'Feather'] as partner, index (partner)}<span
					class={'min-w-40 text-center text-3xl text-neutral/50 ' +
						(index % 2 ? 'font-serif italic' : 'font-semibold')}>{partner}</span
				>{/each}
		</div></Marquee
	>
	<p class="text-center text-xs text-neutral/50">
		Illustrative wordmarks for a partner or customer section.
	</p>
</section>
