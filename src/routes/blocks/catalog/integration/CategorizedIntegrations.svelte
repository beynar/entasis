<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Tabbar } from 'svelai/tabbar';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { calendarIcon } from 'svelai/icons/calendar';
	import { chartBarIcon } from 'svelai/icons/chartBar';
	import { chatCenteredTextIcon } from 'svelai/icons/chatCenteredText';
	import { chatCircleIcon } from 'svelai/icons/chatCircle';
	import { columnsIcon } from 'svelai/icons/columns';
	import { fileTextIcon } from 'svelai/icons/fileText';
	let active = $state('All tools');
	const integrations = [
		{
			title: 'Calendar',
			description: 'Milestones and meeting rhythms.',
			group: 'Planning',
			label: 'Planning',
			icon: calendarIcon
		},
		{
			title: 'Project boards',
			description: 'A shared view of the next steps.',
			group: 'Planning',
			label: 'Planning',
			icon: columnsIcon
		},
		{
			title: 'Team conversations',
			description: 'Decisions beside the work.',
			group: 'Collaboration',
			label: 'People',
			icon: chatCircleIcon
		},
		{
			title: 'Shared documents',
			description: 'One place for useful context.',
			group: 'Collaboration',
			label: 'Knowledge',
			icon: fileTextIcon
		},
		{
			title: 'Product analytics',
			description: 'Signals that lead to decisions.',
			group: 'Insights',
			label: 'Insights',
			icon: chartBarIcon
		},
		{
			title: 'Customer feedback',
			description: 'A direct line to real experience.',
			group: 'Insights',
			label: 'Insights',
			icon: chatCenteredTextIcon
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-5xl flex-col">
	<Heading as="h2" size="h2" weight="bold">A place for every part of the workflow.</Heading><Tabbar
		items={['All tools', 'Planning', 'Collaboration', 'Insights']}
		bind:value={active}
	/>
	<div class="gap-md grid sm:grid-cols-2">
		{#each integrations.filter((integration) => active === 'All tools' || integration.group === active) as integration (integration.title)}<Card
				variant="outline"
				><div class="gap-lg flex items-center">
					<div class="bg-primary-muted p-md text-primary-readable rounded-lg">
						{@render integration.icon({ size: 28 })}
					</div>
					<div class="flex-1">
						<Heading as="h3" size="h5">{integration.title}</Heading>
						<p class="mt-sm text-neutral/70 text-sm">{integration.description}</p>
					</div>
					<Chip size="small" variant="soft">{integration.label}</Chip>
				</div></Card
			>{/each}
	</div>
	<Button href="/components" variant="link" class="self-start" suffix={arrowRightIcon}
		>Explore the underlying components</Button
	>
</section>
