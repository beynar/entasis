<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { calendarIcon } from 'svelai/icons/calendar';
	import { chartBarIcon } from 'svelai/icons/chartBar';
	import { chatCircleIcon } from 'svelai/icons/chatCircle';
	import { codeIcon } from 'svelai/icons/code';
	import { folderIcon } from 'svelai/icons/folder';
	import { puzzlePieceIcon } from 'svelai/icons/puzzlePiece';
	import { usersThreeIcon } from 'svelai/icons/usersThree';
	let active = $state(0);
	const tools = [
		{
			title: 'Plan',
			icon: calendarIcon,
			description: 'Connect a milestone to the calendar and the work it depends on.'
		},
		{
			title: 'Talk',
			icon: chatCircleIcon,
			description: 'Bring decisions into the conversation with the right context attached.'
		},
		{
			title: 'Files',
			icon: folderIcon,
			description: 'Give everyone a direct route to the current version.'
		},
		{
			title: 'Build',
			icon: codeIcon,
			description: 'Connect implementation progress to the feature it delivers.'
		},
		{
			title: 'Learn',
			icon: chartBarIcon,
			description: 'Keep useful product signals close to the decisions they inform.'
		},
		{
			title: 'Share',
			icon: usersThreeIcon,
			description: 'Make ownership visible and bring in the right perspective.'
		}
	];
</script>

<section class="mx-auto grid max-w-6xl items-center gap-xl p-lg md:grid-cols-2 md:p-xl">
	<div class="flex flex-col gap-xl">
		<Chip class="self-start" variant="outline">One connected picture</Chip><Heading
			as="h2"
			size="h2"
			weight="bold">Keep the context flowing.</Heading
		>
		<p class="text-neutral/70">Select a tool to see the role it plays in a connected workspace.</p>
		<Card variant="soft" color="primary" title={tools[active].title}
			><Stack gap="lg"
				><p>{tools[active].description}</p>
				<Chip class="self-start" size="small" variant="outline">Connection preview</Chip></Stack
			></Card
		>
	</div>
	<div
		class="relative grid min-h-96 grid-cols-3 items-center gap-lg rounded-2xl bg-surface-recessed p-lg"
	>
		<div class="absolute inset-x-0 top-1/2 h-px bg-neutral-muted" aria-hidden="true"></div>
		<div class="relative flex flex-col gap-xl">
			{#each tools.slice(0, 3) as tool, index (tool.title)}<Button
					variant={active === index ? 'solid' : 'outline'}
					onclick={() => (active = index)}
					prefix={tool.icon}>{tool.title}</Button
				>{/each}
		</div>
		<div class="relative flex justify-center">
			<div
				class="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-contrast"
			>
				{@render puzzlePieceIcon({ size: 36 })}
			</div>
		</div>
		<div class="relative flex flex-col gap-xl">
			{#each tools.slice(3) as tool, index (tool.title)}<Button
					variant={active === index + 3 ? 'solid' : 'outline'}
					onclick={() => (active = index + 3)}
					prefix={tool.icon}>{tool.title}</Button
				>{/each}
		</div>
	</div>
</section>
