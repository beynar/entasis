<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Tabbar } from 'svelai/tabbar';
	import { TextInput } from 'svelai/text-input';
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

	let query = $state('');
	let teamIndex = $state(0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Open positions</p>
		<Heading size="h2" weight="bold">Find your place here.</Heading>
	</header>
	<div class="grid gap-xl md:grid-cols-[15rem_1fr]">
		<aside class="flex flex-col gap-xl">
			<TextInput label="Search roles" placeholder="Role or keyword" bind:value={query} /><Tabbar
				orientation="vertical"
				items={['All teams', 'Design', 'Engineering']}
				bind:value={teamIndex}
			/>
			<p class="text-sm text-neutral/55">
				We welcome different backgrounds and thoughtful approaches to craft.
			</p>
		</aside>
		<div class="flex flex-col gap-lg">
			{#each jobs.filter((job) => (teamIndex === 0 || job.team === ['', 'Design', 'Engineering'][teamIndex]) && job.title
						.toLowerCase()
						.includes((query ?? '').toLowerCase())) as job (job.title)}<div
					class="flex gap-lg items-center justify-between flex-wrap p-xl rounded-lg bg-surface-recessed"
				>
					<div class="flex flex-col gap-md">
						<h3 class="text-lg font-semibold">{job.title}</h3>
						<span class="text-sm text-neutral/60">{job.location}</span>
					</div>
					<Button variant="outline" onclick={() => (selectedJob = job)}>View role ↗</Button>
				</div>{:else}<p class="p-xl text-neutral/60">
					No matching roles. Try another search or department.
				</p>{/each}
		</div>
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
