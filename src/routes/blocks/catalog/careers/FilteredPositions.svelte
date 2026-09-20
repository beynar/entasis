<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Tabbar } from 'entasis/tabbar';
	import { TextInput } from 'entasis/text-input';
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

	let query = $state('');
	let team = $state('All teams');
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Open positions
		</p>
		<Heading size="h2" weight="bold">Find your place here.</Heading>
	</header>
	<div class="gap-xl grid md:grid-cols-[15rem_1fr]">
		<aside class="gap-xl flex flex-col">
			<TextInput label="Search roles" placeholder="Role or keyword" bind:value={query} /><Tabbar
				orientation="vertical"
				items={['All teams', 'Design', 'Engineering']}
				bind:value={team}
			/>
			<p class="text-neutral/65 text-sm">
				We welcome different backgrounds and thoughtful approaches to craft.
			</p>
		</aside>
		<div class="gap-lg flex flex-col">
			{#each jobs.filter((job) => (team === 'All teams' || job.team === team) && job.title
						.toLowerCase()
						.includes((query ?? '').toLowerCase())) as job (job.title)}<div
					class="gap-lg p-xl bg-surface-recessed flex flex-wrap items-center justify-between rounded-lg"
				>
					<div class="gap-md flex flex-col">
						<h3 class="text-lg font-semibold">{job.title}</h3>
						<span class="text-neutral/70 text-sm">{job.location}</span>
					</div>
					<Button variant="outline" onclick={() => (selectedJob = job)}>View role ↗</Button>
				</div>{:else}<p class="p-xl text-neutral/70">
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
