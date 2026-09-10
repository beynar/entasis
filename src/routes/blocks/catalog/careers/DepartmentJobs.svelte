<script lang="ts">
	import { Heading } from 'svelai/heading';
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
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
			Build something useful
		</p>
		<Heading size="h2" weight="bold">Good people. Meaningful work.</Heading>
		<p class="max-w-2xl text-neutral/65">
			A small, curious team making software feel a little more human.
		</p>
	</header>
	{#each ['Design', 'Engineering'] as team (team)}<div class="grid gap-xl md:grid-cols-[12rem_1fr]">
			<h3 class="text-xl font-semibold">{team}</h3>
			<div>
				{#each jobs.filter((job) => job.team === team) as job (job.title)}<article
						class="flex gap-lg items-center justify-between flex-wrap py-xl border-b border-neutral/15"
					>
						<div class="flex flex-col gap-sm">
							<h4 class="text-lg font-medium">{job.title}</h4>
							<p class="text-sm text-neutral/60">{job.location}</p>
						</div>
						<div class="flex gap-lg items-center">
							<Chip size="small" variant="soft" color="neutral">{job.type}</Chip><Button
								variant="ghost"
								onclick={() => (selectedJob = job)}>Details ↗</Button
							>
						</div>
					</article>{/each}
			</div>
		</div>{/each}<Dialog
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
