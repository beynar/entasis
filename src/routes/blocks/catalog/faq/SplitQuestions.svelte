<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Accordion } from 'svelai/accordion';
	import { AvatarGroup } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	const questions = [
		{
			id: 'scope',
			title: 'Should I start with a full design system?',
			content:
				'Start with the decisions that are already shared: type, color, spacing, and a few essential controls. Let the system grow from real use.'
		},
		{
			id: 'blocks',
			title: 'What is a block?',
			content:
				'A block is a complete interface section built from components. It shows how the pieces work together in context.'
		},
		{
			id: 'responsive',
			title: 'Do the examples work on smaller screens?',
			content:
				'The layouts adapt to available width. Test the final composition with your actual content and the devices your audience uses.'
		},
		{
			id: 'behavior',
			title: 'Do the form examples submit to a server?',
			content:
				'The showcase forms keep their interaction local. Their review step lets you inspect a draft without sending any information.'
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl md:grid-cols-3">
	<div class="gap-xl flex flex-col items-start">
		<Chip variant="soft">Good questions welcome</Chip><Heading as="h2" size="h2" weight="bold"
			>A little clarity goes a long way.</Heading
		>
		<p class="text-neutral/70">Here are a few answers to help you choose your next step.</p>
		<Card variant="soft" color="primary"
			><Stack gap="lg"
				><AvatarGroup
					items={[{ name: 'Maya Chen' }, { name: 'Theo Park' }, { name: 'Nora Ellis' }]}
				/>
				<p>Find a pattern that fits the way your team works.</p>
				<Button href="/docs" variant="outline">Explore the guides</Button></Stack
			></Card
		>
	</div>
	<Accordion class="md:col-span-2" variant="outline" splitted items={questions} icon="chevron" />
</section>
