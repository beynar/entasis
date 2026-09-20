<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Button } from 'entasis/button';
	import { Dialog } from 'entasis/dialog';
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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Make your next move
		</p>
		<Heading size="h2" weight="bold">Work that leaves a mark.</Heading>
		<p class="text-neutral/65 max-w-2xl">Bring your craft, your questions, and a point of view.</p>
	</header>
	<div class="gap-xl border-neutral/25 p-xl grid rounded-lg border border-dashed sm:grid-cols-2">
		{#each jobs as job (job.title)}<Card
				><div class="gap-xl flex flex-col">
					<div class="gap-md flex items-center justify-between">
						<Chip size="small" variant="soft">{job.team}</Chip><span class="text-neutral/65 text-xs"
							>{job.type}</span
						>
					</div>
					<h3 class="text-xl font-semibold">{job.title}</h3>
					<p class="text-neutral/65">{job.detail}</p>
					<div class="gap-md flex items-center justify-between">
						<span class="text-neutral/65 text-sm">{job.location}</span><Button
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
		><div class="gap-lg flex flex-col">
			<p>{selectedJob?.detail}</p>
			<p class="text-neutral/70 text-sm">
				This example shows the role details. Connect your application workflow when using this
				block.
			</p>
			<Button variant="outline" onclick={() => (selectedJob = null)}>Close details</Button>
		</div></Dialog
	>
</section>
