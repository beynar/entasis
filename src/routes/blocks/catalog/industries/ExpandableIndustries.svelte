<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Accordion } from 'entasis/accordion';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { codeIcon } from 'entasis/icons/code';
	import { graduationCapIcon } from 'entasis/icons/graduationCap';
	import { paletteIcon } from 'entasis/icons/palette';
	const industries = [
		{
			id: 'product',
			title: 'Software and product',
			description:
				'Give your team a connected view of the next feature, its context, and the people bringing it to life.',
			outcome: 'A clearer product workflow',
			tags: ['Planning', 'Research', 'Delivery'],
			icon: codeIcon
		},
		{
			id: 'studio',
			title: 'Design and creative',
			description:
				'Keep the original idea close through every round of feedback and every small production decision.',
			outcome: 'A thoughtful client experience',
			tags: ['Briefs', 'Reviews', 'Handoffs'],
			icon: paletteIcon
		},
		{
			id: 'education',
			title: 'Learning and education',
			description:
				'Help people see where they are, what comes next, and where to go when they need a little support.',
			outcome: 'A path that invites progress',
			tags: ['Lessons', 'Community', 'Milestones'],
			icon: graduationCapIcon
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-5xl flex-col">
	<div class="max-w-2xl">
		<Chip variant="soft">A flexible foundation</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Find the shape that fits your work.</Heading
		>
	</div>
	<Accordion items={industries} defaultValue={['product']} variant="outline" icon="plus-minus"
		>{#snippet content({ item })}<div class="gap-xl grid items-center md:grid-cols-2">
				<div class="gap-lg flex flex-col items-start">
					<p class="text-neutral/70">{item.description}</p>
					<Button href="/blocks" variant="link" suffix={arrowRightIcon}>See working examples</Button
					>
				</div>
				<Card variant="soft" color="primary"
					><Stack gap="lg"
						><span class="text-primary-readable">{@render item.icon({ size: 32 })}</span><Heading
							as="h3"
							size="h4">{item.outcome}</Heading
						>
						<div class="gap-sm flex flex-wrap">
							{#each item.tags as tag (tag)}<Chip size="small" variant="outline">{tag}</Chip>{/each}
						</div></Stack
					></Card
				>
			</div>{/snippet}</Accordion
	>
</section>
