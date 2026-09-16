<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Marquee } from 'svelai/marquee';
</script>

<section class="gap-xl bg-surface-recessed p-xl flex flex-col overflow-hidden">
	<Heading as="h2" size="h4" align="center">Ideas travel further in good company.</Heading><Marquee
		speed="slow"
		fade
		innerClass="gap-xl"
		><div class="gap-xl flex items-center">
			{#each ['✳ Layers', 'Quotient', '◈ Capsule', 'Sisyphus', 'Circooles', 'Catalog', 'Feather'] as partner, index (partner)}<span
					class={'text-neutral/65 min-w-40 text-center text-3xl ' +
						(index % 2 ? 'font-serif italic' : 'font-semibold')}>{partner}</span
				>{/each}
		</div></Marquee
	>
	<p class="text-neutral/65 text-center text-xs">
		Illustrative wordmarks for a partner or customer section.
	</p>
</section>
