<script lang="ts">
	import { Accordion } from 'svelai/accordion';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
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

<section class="mx-auto flex max-w-3xl flex-col gap-xl p-lg md:p-xl">
	<div class="text-center">
		<Chip variant="outline">A few useful answers</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Before you get started.</Heading
		>
		<p class="mt-lg text-neutral/70">The questions that help you find your footing.</p>
	</div>
	<Accordion items={questions} defaultValue={['start']} icon="math" />
	<p class="text-center text-sm text-neutral/60">
		Looking for more detail? <a
			href="/docs"
			class="font-medium text-primary underline underline-offset-4">Read the guides.</a
		>
	</p>
</section>
