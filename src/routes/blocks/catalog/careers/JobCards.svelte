<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { Dialog } from 'svelai/dialog';
	const jobs = [
		{
			title: 'Product designer',
			team: 'Design',
			location: 'Remote · Europe',
			type: 'Full time',
			detail:
				'Help shape a thoughtful component library. Work with engineers on interaction design, accessibility, and visual systems.'
		},
		{
			title: 'Design engineer',
			team: 'Engineering',
			location: 'Paris / Remote',
			type: 'Full time',
			detail:
				'Build expressive interfaces with Svelte. Own components from a design sketch through production behavior.'
		},
		{
			title: 'Frontend engineer',
			team: 'Engineering',
			location: 'Remote · Worldwide',
			type: 'Full time',
			detail: 'Improve the performance, reliability, and developer experience of our UI platform.'
		},
		{
			title: 'Content designer',
			team: 'Design',
			location: 'London / Remote',
			type: 'Contract',
			detail:
				'Make complex product workflows easier to understand with clear language and useful examples.'
		}
	];
	let selectedJob = $state<(typeof jobs)[number] | null>(null);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Make your next move</p>
		<Heading size="h2" weight="bold">Work that leaves a mark.</Heading>
		<p class="max-w-2xl text-neutral/65">Bring your craft, your questions, and a point of view.</p>
	</header>
	<div class="grid gap-xl rounded-lg border border-dashed border-neutral/25 p-xl sm:grid-cols-2">
		{#each jobs as job (job.title)}<Card
				><div class="flex flex-col gap-xl">
					<div class="flex gap-md items-center justify-between">
						<Chip size="small" variant="soft">{job.team}</Chip><span class="text-xs text-neutral/50"
							>{job.type}</span
						>
					</div>
					<h3 class="text-xl font-semibold">{job.title}</h3>
					<p class="text-neutral/65">{job.detail}</p>
					<div class="flex gap-md items-center justify-between">
						<span class="text-sm text-neutral/55">{job.location}</span><Button
							variant="outline"
							size="small"
							onclick={() => (selectedJob = job)}>Explore role</Button
						>
					</div>
				</div></Card
			>{/each}
	</div>
	<Dialog
		open={selectedJob !== null}
		onOpenChange={(open) => {
			if (!open) selectedJob = null;
		}}
		title={selectedJob?.title ?? 'Position details'}
		description={selectedJob?.location}
		><div class="flex flex-col gap-lg">
			<p>{selectedJob?.detail}</p>
			<p class="text-sm text-neutral/60">
				This example shows the role details. Connect your application workflow when using this
				block.
			</p>
			<Button variant="outline" onclick={() => (selectedJob = null)}>Close details</Button>
		</div></Dialog
	>
</section>
