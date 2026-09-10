<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	const tools = [
		{
			name: 'Svelte',
			kind: 'Interface development',
			years: '5 years',
			usage: 'Interactive products and component systems',
			mark: 'Sv'
		},
		{
			name: 'Figma',
			kind: 'Product design',
			years: '8 years',
			usage: 'Visual systems, prototypes, and collaboration',
			mark: 'Fi'
		},
		{
			name: 'TypeScript',
			kind: 'Engineering',
			years: '6 years',
			usage: 'Clear contracts and reliable application logic',
			mark: 'Ts'
		},
		{
			name: 'CSS',
			kind: 'Visual craft',
			years: '10 years',
			usage: 'Responsive layouts, motion, and detail',
			mark: 'Cs'
		}
	];
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="grid gap-xl md:grid-cols-[1fr_2fr]">
		<div class="md:sticky md:top-xl md:self-start">
			<header class="flex flex-col gap-lg">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary">The toolkit</p>
				<Heading size="h2" weight="bold">The right tool for the idea.</Heading>
				<p class="max-w-2xl text-neutral/65">
					A few familiar tools I use to turn a good question into something people can use.
				</p>
			</header>
		</div>
		<div>
			{#each tools as tool (tool.name)}<div
					class="grid grid-cols-[auto_1fr_auto] items-center gap-xl border-t border-neutral/15 py-xl"
				>
					<span
						class="grid size-12 place-items-center rounded-lg bg-primary-muted text-sm font-semibold text-primary"
						>{tool.mark}</span
					>
					<div>
						<h3 class="text-lg font-semibold">{tool.name}</h3>
						<p class="mt-sm text-sm text-neutral/55">{tool.kind}</p>
					</div>
					<Chip variant="outline" color="neutral" size="small">{tool.years}</Chip>
				</div>{/each}
		</div>
	</div>
</section>
