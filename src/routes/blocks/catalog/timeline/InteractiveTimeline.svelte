<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
	import { Meter } from 'svelai/meter';
	import { Chip } from 'svelai/chip';
	const phases = [
		{
			title: 'Discover',
			date: 'Week 01',
			description: 'Listen, ask useful questions, and agree on the problem worth solving.'
		},
		{
			title: 'Define',
			date: 'Week 02',
			description: 'Turn the findings into a clear direction and a small set of design principles.'
		},
		{
			title: 'Create',
			date: 'Weeks 03–05',
			description: 'Explore the interface in real flows, test the details, and build together.'
		},
		{
			title: 'Deliver',
			date: 'Week 06',
			description: 'Ship a useful first version, observe what happens, and keep learning.'
		}
	];
	let step = $state(0);
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			The project journey
		</p>
		<Heading size="h2" weight="bold">Know where you are. See what’s next.</Heading>
	</header>
	<Meter
		value={step + 1}
		color="primary"
		max={phases.length}
		label={`Phase ${step + 1} of ${phases.length}`}
	/>
	<div class="gap-xl grid md:grid-cols-[13rem_1fr]">
		<nav aria-label="Project phases" class="gap-md flex flex-col">
			{#each phases as phase, i (phase.title)}<Button
					variant={step === i ? 'soft' : 'ghost'}
					color={step === i ? 'primary' : 'neutral'}
					class="justify-start"
					onclick={() => (step = i)}>0{i + 1} · {phase.title}</Button
				>{/each}
		</nav>
		<div class="gap-xl p-xl bg-surface-recessed flex flex-col rounded-lg">
			<Chip class="w-fit" variant="soft">{phases[step].date}</Chip><Heading size="h3"
				>{phases[step].title}</Heading
			>
			<p class="text-neutral/65 text-lg">{phases[step].description}</p>
			<div class="gap-lg flex justify-between">
				<Button variant="outline" disabled={step === 0} onclick={() => (step -= 1)}>Previous</Button
				><Button disabled={step === phases.length - 1} onclick={() => (step += 1)}
					>Next phase →</Button
				>
			</div>
		</div>
	</div>
</section>
