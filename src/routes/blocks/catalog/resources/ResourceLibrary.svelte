<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { TextInput } from 'entasis/text-input';
	import { Tabbar } from 'entasis/tabbar';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Button } from 'entasis/button';
	const resources = [
		{
			title: 'Design system foundations',
			type: 'Guide',
			description: 'Build a useful shared language for your product team.',
			duration: '12 min read'
		},
		{
			title: 'A better component API',
			type: 'Article',
			description: 'Small contracts that make complex interfaces easier to build.',
			duration: '6 min read'
		},
		{
			title: 'Interface review checklist',
			type: 'Checklist',
			description: 'Questions to ask before an interface meets its users.',
			duration: '8 questions'
		},
		{
			title: 'Designing clear empty states',
			type: 'Article',
			description: 'Help people find the first useful action.',
			duration: '5 min read'
		}
	];
	let query = $state('');
	let category = $state('All resources');
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Resource library
		</p>
		<Heading size="h2" weight="bold">Useful things for thoughtful teams.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			Guides, articles, and practical checklists to keep your work moving.
		</p>
	</header>
	<div class="gap-xl grid md:grid-cols-[14rem_1fr]">
		<aside class="gap-xl flex flex-col">
			<TextInput label="Search resources" placeholder="Find a topic" bind:value={query} /><Tabbar
				orientation="vertical"
				items={['All resources', 'Guide', 'Article', 'Checklist']}
				bind:value={category}
			/>
		</aside>
		<div class="gap-xl grid sm:grid-cols-2">
			{#each resources.filter((resource) => (category === 'All resources' || resource.type === category) && resource.title
						.toLowerCase()
						.includes((query ?? '').toLowerCase())) as resource (resource.title)}<Card
					title={resource.title}
					description={resource.description}
					><div class="gap-xl flex flex-col">
						<Chip variant="soft" class="w-fit" size="small">{resource.type}</Chip>
						<div class="gap-md flex items-center justify-between">
							<span class="text-neutral/65 text-sm">{resource.duration}</span><Button
								href="/docs"
								variant="link">Read ↗</Button
							>
						</div>
					</div></Card
				>{:else}<p class="p-xl text-neutral/70">No resources match this search.</p>{/each}
		</div>
	</div>
</section>
