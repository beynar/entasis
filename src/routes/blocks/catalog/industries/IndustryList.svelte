<script lang="ts">
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	const industries = [
		{
			name: 'Product teams',
			description: 'Turn a roadmap into a clear set of decisions and useful releases.'
		},
		{
			name: 'Creative studios',
			description: 'Keep the brief, the feedback, and the final details in one shared rhythm.'
		},
		{
			name: 'Education',
			description: 'Make the next lesson, conversation, and milestone easy to find.'
		},
		{
			name: 'Professional services',
			description:
				'Bring clarity to the client experience, from the first question to the final handoff.'
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl md:grid-cols-3">
	<div class="gap-xl flex flex-col items-start">
		<Chip variant="outline">Built for real work</Chip><Heading as="h2" size="h2" weight="bold"
			>Different fields.<br />Shared possibilities.</Heading
		>
		<p class="text-neutral/70">
			The same thoughtful tools, shaped around the work your team actually does.
		</p>
		<Button href="/blocks" variant="link" suffix={arrowRightIcon}>Explore the patterns</Button>
	</div>
	<div class="md:col-span-2">
		{#each industries as industry, index (industry.name)}<div
				class="gap-lg border-neutral-muted py-xl grid border-t sm:grid-cols-2"
			>
				<div class="gap-lg flex items-center">
					<span class="text-neutral/65 text-xs">0{index + 1}</span><Heading as="h3" size="h4"
						>{industry.name}</Heading
					>
				</div>
				<p class="text-neutral/70 text-sm">{industry.description}</p>
			</div>{/each}
	</div>
</section>
