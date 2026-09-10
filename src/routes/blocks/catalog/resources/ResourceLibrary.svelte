<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { TextInput } from 'svelai/text-input';
	import { Tabbar } from 'svelai/tabbar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
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
	let category = $state(0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Resource library</p>
		<Heading size="h2" weight="bold">Useful things for thoughtful teams.</Heading>
		<p class="max-w-2xl text-neutral/65">
			Guides, articles, and practical checklists to keep your work moving.
		</p>
	</header>
	<div class="grid gap-xl md:grid-cols-[14rem_1fr]">
		<aside class="flex flex-col gap-xl">
			<TextInput label="Search resources" placeholder="Find a topic" bind:value={query} /><Tabbar
				orientation="vertical"
				items={['All resources', 'Guide', 'Article', 'Checklist']}
				bind:value={category}
			/>
		</aside>
		<div class="grid gap-xl sm:grid-cols-2">
			{#each resources.filter((resource) => (category === 0 || resource.type === ['', 'Guide', 'Article', 'Checklist'][category]) && resource.title
						.toLowerCase()
						.includes((query ?? '').toLowerCase())) as resource (resource.title)}<Card
					title={resource.title}
					description={resource.description}
					><div class="flex flex-col gap-xl">
						<Chip variant="soft" class="w-fit" size="small">{resource.type}</Chip>
						<div class="flex gap-md items-center justify-between">
							<span class="text-sm text-neutral/50">{resource.duration}</span><Button
								href="/docs"
								variant="link">Read ↗</Button
							>
						</div>
					</div></Card
				>{:else}<p class="p-xl text-neutral/60">No resources match this search.</p>{/each}
		</div>
	</div>
</section>
