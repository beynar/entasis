<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Stat } from 'svelai/stat';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { chatCircleIcon } from 'svelai/icons/chatCircle';
	import { fileTextIcon } from 'svelai/icons/fileText';
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl md:grid-cols-2">
	<div class="gap-xl flex flex-col items-start">
		<Chip variant="outline">Work with a little more clarity</Chip><Heading
			as="h2"
			size="h1"
			weight="bold">Keep the important things close.</Heading
		>
		<p class="text-neutral/70 text-lg">
			A shared workflow connects the brief, the conversation, and the next decision.
		</p>
		<div class="gap-md grid w-full grid-cols-2">
			<Stat label="One source of context" value="1" variant="ghost" /><Stat
				label="A useful review rhythm"
				value="Weekly"
				variant="ghost"
			/>
		</div>
		<Button href="/blocks" suffix={arrowRightIcon}>See complete workflows</Button>
	</div>
	<div class="gap-lg flex flex-col">
		{#each [{ title: 'A brief with a point of view', description: 'Agree on the audience, the problem, and the outcome.', label: 'Start here', icon: fileTextIcon }, { title: 'Feedback beside the work', description: 'Keep a decision attached to the thing it changes.', label: 'Stay connected', icon: chatCircleIcon }, { title: 'A next step everyone can see', description: 'Turn a review into a clear, owned action.', label: 'Move forward', icon: arrowRightIcon }] as feature, index (feature.title)}<Card
				variant={index === 1 ? 'soft' : 'outline'}
				color={index === 1 ? 'primary' : 'neutral'}
				><div class="gap-lg flex items-start">
					<span class="text-primary-readable">{@render feature.icon({ size: 30 })}</span>
					<div class="gap-md flex flex-col">
						<Chip size="small" variant="outline" class="self-start">{feature.label}</Chip><Heading
							as="h3"
							size="h4">{feature.title}</Heading
						>
						<p class="text-neutral/70 text-sm">{feature.description}</p>
					</div>
				</div></Card
			>{/each}
	</div>
</section>
