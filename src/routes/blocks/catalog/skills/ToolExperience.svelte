<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Chip } from 'entasis/chip';
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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="gap-xl grid md:grid-cols-[1fr_2fr]">
		<div class="md:top-xl md:sticky md:self-start">
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					The toolkit
				</p>
				<Heading size="h2" weight="bold">The right tool for the idea.</Heading>
				<p class="text-neutral/65 max-w-2xl">
					A few familiar tools I use to turn a good question into something people can use.
				</p>
			</header>
		</div>
		<div>
			{#each tools as tool (tool.name)}<div
					class="gap-xl border-neutral/15 py-xl grid grid-cols-[auto_1fr_auto] items-center border-t"
				>
					<span
						class="bg-primary-muted text-primary-muted-readable grid size-12 place-items-center rounded-lg text-sm font-semibold"
						>{tool.mark}</span
					>
					<div>
						<h3 class="text-lg font-semibold">{tool.name}</h3>
						<p class="mt-sm text-neutral/65 text-sm">{tool.kind}</p>
					</div>
					<Chip variant="outline" color="neutral" size="small">{tool.years}</Chip>
				</div>{/each}
		</div>
	</div>
</section>
