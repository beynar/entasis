<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { AvatarGroup } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
	import { circleIcon } from 'svelai/icons/circle';
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl items-center md:grid-cols-2">
	<div class="gap-xl flex flex-col items-start">
		<Chip color="success" variant="soft">A calmer way to work</Chip><Heading
			as="h2"
			size="h1"
			weight="bold">Give your team a clear next step.</Heading
		>
		<p class="text-neutral/70 text-lg">
			A shared place to turn good ideas into work you can actually move forward.
		</p>
		<ul class="gap-md flex flex-col">
			{#each ['The context stays with the work', 'Progress is easy to understand', 'Everyone knows where to begin'] as benefit (benefit)}<li
					class="gap-sm flex items-center text-sm"
				>
					<span class="text-success">{@render checkCircleIcon()}</span>{benefit}
				</li>{/each}
		</ul>
		<Button href="/blocks" size="large" suffix={arrowRightIcon}>Find your workflow</Button>
	</div>
	<div class="bg-primary-muted p-lg md:p-xl rounded-3xl">
		<Card title="A thoughtful product launch" description="Project brief · Shared with your team"
			><Stack gap="lg"
				><Chip class="self-start" color="success" size="small">On track</Chip>
				<div class="gap-md flex flex-col">
					{#each ['Understand the audience', 'Make a useful first version', 'Review with the team'] as task, index (task)}<div
							class="gap-md bg-surface-recessed p-md flex items-center rounded-lg"
						>
							<span class="text-primary-readable"
								>{@render (index < 2 ? checkCircleIcon : circleIcon)()}</span
							><span class="text-sm">{task}</span>
						</div>{/each}
				</div>
				<Separator />
				<div class="gap-md flex items-center justify-between">
					<AvatarGroup
						size="small"
						items={[{ name: 'Maya Chen' }, { name: 'Theo Park' }, { name: 'Nora Ellis' }]}
					/><span class="text-neutral/70 text-xs">Next review · Friday</span>
				</div></Stack
			></Card
		>
	</div>
</section>
