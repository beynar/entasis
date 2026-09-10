<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Card } from 'svelai/card';
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
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Tools of the trade</p>
		<Heading size="h2" weight="bold">A practical creative toolkit.</Heading>
	</header>
	<div class="grid gap-xl sm:grid-cols-2">
		{#each tools as tool (tool.name)}<Card
				><div class="flex gap-xl items-start">
					<span
						class="grid size-14 shrink-0 place-items-center rounded-lg bg-surface-recessed text-xl font-semibold"
						>{tool.mark}</span
					>
					<div class="flex flex-col gap-lg">
						<h3 class="text-xl font-semibold">{tool.name}</h3>
						<p class="text-neutral/65">{tool.usage}</p>
						<Chip size="small" variant="soft" class="w-fit">{tool.kind}</Chip>
					</div>
				</div></Card
			>{/each}
	</div>
</section>
