<script lang="ts">
	import { Accordion } from 'entasis/accordion';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	const questions = [
		{
			id: 'start',
			title: 'Where should I start?',
			content:
				'Begin with a small, real screen. Explore the components that fit that screen, then compose them around your own content.'
		},
		{
			id: 'theme',
			title: 'Can I make it look like my brand?',
			content:
				'Yes. The shared theme controls color, spacing, radius, and type so that your decisions travel across the interface.'
		},
		{
			id: 'copy',
			title: 'Can I adapt the examples?',
			content:
				'The examples are ordinary Svelte components. Read the source, keep the parts that help, and change the rest to fit your product.'
		},
		{
			id: 'state',
			title: 'How is interactive state handled?',
			content:
				'Controls use familiar value and change patterns. Keep the state with the feature that owns it, and pass it into the components.'
		},
		{
			id: 'learn',
			title: 'Where can I learn more?',
			content:
				'The component pages show the public API and focused examples. The guides explain the shared patterns behind them.'
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-3xl flex-col">
	<div class="text-center">
		<Chip variant="outline">A few useful answers</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Before you get started.</Heading
		>
		<p class="mt-lg text-neutral/70">The questions that help you find your footing.</p>
	</div>
	<Accordion items={questions} defaultValue={['start']} icon="plus-minus" />
	<p class="text-neutral/70 text-center text-sm">
		Looking for more detail? <a
			href="/docs"
			class="text-primary-readable font-medium underline underline-offset-4">Read the guides.</a
		>
	</p>
</section>
