<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Dialog } from 'svelai/dialog';
	import { Switch } from 'svelai/switch';
	import { TextInput } from 'svelai/text-input';
	import { fileTextIcon } from 'svelai/icons/fileText';
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

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header class="flex flex-wrap items-end justify-between gap-lg">
		<div>
			<h2 class="text-3xl font-semibold">The things worth keeping.</h2>
			<p class="mt-sm text-sm text-neutral/60">A shared shelf of useful team resources.</p>
		</div>
		<Switch label="Saved only" bind:value={savedOnly} />
	</header>
	<TextInput label="Search resources" placeholder="Find a document" bind:value={query} /><Card
		><Stack gap="lg">
			{#each resources.filter((resource) => (!savedOnly || resource.saved) && resource.title
						.toLowerCase()
						.includes((query ?? '').toLowerCase())) as resource (resource)}<div
					class="flex flex-col items-start justify-between gap-md border-b sm:flex-row sm:items-center border-neutral-muted pb-lg"
				>
					<div class="flex items-center gap-md">
						<span class="rounded-lg bg-primary-muted p-md text-2xl">{@render fileTextIcon()}</span>
						<div>
							<h3 class="font-semibold">{resource.title}</h3>
							<p class="text-xs text-neutral/60">{resource.type} · Updated {resource.updated}</p>
						</div>
					</div>
					<Stack orientation="horizontal" gap="sm">
						<Button size="small" variant="ghost" onclick={() => (resource.saved = !resource.saved)}
							>{resource.saved ? 'Unsave' : 'Save'}</Button
						><Button size="small" variant="outline" onclick={() => (selected = resource)}
							>Read</Button
						>
					</Stack>
				</div>{:else}<p class="p-lg text-sm text-neutral/60">
					No resources match this view.
				</p>{/each}
		</Stack></Card
	><Dialog
		open={selected !== null}
		onOpenChange={(open) => {
			if (!open) selected = null;
		}}
		title={selected?.title ?? 'Resource'}
		>{#if selected}<p class="leading-relaxed text-neutral/70">{selected.content}</p>{/if}</Dialog
	>
</Stack>
