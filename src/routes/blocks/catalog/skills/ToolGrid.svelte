<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Card } from 'entasis/card';
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
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Tools of the trade
		</p>
		<Heading size="h2" weight="bold">A practical creative toolkit.</Heading>
	</header>
	<div class="gap-xl grid sm:grid-cols-2">
		{#each tools as tool (tool.name)}<Card
				><div class="gap-xl flex items-start">
					<span
						class="bg-surface-recessed grid size-14 shrink-0 place-items-center rounded-lg text-xl font-semibold"
						>{tool.mark}</span
					>
					<div class="gap-lg flex flex-col">
						<h3 class="text-xl font-semibold">{tool.name}</h3>
						<p class="text-neutral/65">{tool.usage}</p>
						<Chip size="small" variant="soft" class="w-fit">{tool.kind}</Chip>
					</div>
				</div></Card
			>{/each}
	</div>
</section>
