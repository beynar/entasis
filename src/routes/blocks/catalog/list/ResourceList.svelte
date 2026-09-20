<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Dialog } from 'entasis/dialog';
	import { Switch } from 'entasis/switch';
	import { TextInput } from 'entasis/text-input';
	import { fileTextIcon } from 'entasis/icons/fileText';
	let query = $state<string | null>('');
	let savedOnly = $state(false);
	let resources = $state([
		{
			title: 'Design principles',
			type: 'Guide',
			updated: 'today',
			saved: true,
			content:
				'Start with the user’s goal. Make each interaction clear, keep related work together, and remove anything that does not help the outcome.'
		},
		{
			title: 'Team working agreement',
			type: 'Document',
			updated: 'yesterday',
			saved: false,
			content:
				'Write decisions down, protect focus time, and give feedback with context. When a discussion needs nuance, make room for a conversation.'
		},
		{
			title: 'Project kickoff checklist',
			type: 'Checklist',
			updated: 'June 24',
			saved: false,
			content:
				'Agree on the problem, define the outcome, choose an owner, and identify what would make the project fail. Keep the first useful milestone small.'
		},
		{
			title: 'Research interview notes',
			type: 'Notes',
			updated: 'June 22',
			saved: true,
			content:
				'Ask about the last time a problem occurred. Look for observed behavior, workarounds, and the cost of doing nothing.'
		}
	]);
	let selected = $state<(typeof resources)[number] | null>(null);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header class="gap-lg flex flex-wrap items-end justify-between">
		<div>
			<h2 class="text-3xl font-semibold">The things worth keeping.</h2>
			<p class="mt-sm text-neutral/70 text-sm">A shared shelf of useful team resources.</p>
		</div>
		<Switch label="Saved only" bind:value={savedOnly} />
	</header>
	<TextInput label="Search resources" placeholder="Find a document" bind:value={query} /><Card
		><Stack gap="lg">
			{#each resources.filter((resource) => (!savedOnly || resource.saved) && resource.title
						.toLowerCase()
						.includes((query ?? '').toLowerCase())) as resource (resource)}<div
					class="gap-md border-neutral-muted pb-lg flex flex-col items-start justify-between border-b sm:flex-row sm:items-center"
				>
					<div class="gap-md flex items-center">
						<span class="bg-primary-muted p-md rounded-lg text-2xl">{@render fileTextIcon()}</span>
						<div>
							<h3 class="font-semibold">{resource.title}</h3>
							<p class="text-neutral/70 text-xs">{resource.type} · Updated {resource.updated}</p>
						</div>
					</div>
					<Stack orientation="horizontal" gap="sm">
						<Button size="small" variant="ghost" onclick={() => (resource.saved = !resource.saved)}
							>{resource.saved ? 'Unsave' : 'Save'}</Button
						><Button size="small" variant="outline" onclick={() => (selected = resource)}
							>Read</Button
						>
					</Stack>
				</div>{:else}<p class="p-lg text-neutral/70 text-sm">
					No resources match this view.
				</p>{/each}
		</Stack></Card
	><Dialog
		open={selected !== null}
		onOpenChange={(open) => {
			if (!open) selected = null;
		}}
		title={selected?.title ?? 'Resource'}
		>{#if selected}<p class="text-neutral/70 leading-relaxed">{selected.content}</p>{/if}</Dialog
	>
</Stack>
