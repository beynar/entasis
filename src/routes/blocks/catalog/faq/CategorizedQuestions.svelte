<script lang="ts">
	import { Accordion } from 'svelai/accordion';
	import { Button } from 'svelai/button';
	import { Heading } from 'svelai/heading';
	import { Tabbar } from 'svelai/tabbar';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	let active = $state(0);
	const topics = [
		[
			{
				id: 'a',
				title: 'What do I need to begin?',
				content:
					'A Svelte 5 project and a real interface to build. Install the library and follow the theme setup in the guides.'
			},
			{
				id: 'b',
				title: 'Which example should I try first?',
				content:
					'Choose the smallest block that resembles your actual screen. Replace the example content before adding complexity.'
			}
		],
		[
			{
				id: 'c',
				title: 'Can I change the visual style?',
				content:
					'Use the shared theme for decisions that should travel across every component. Use local classes for the composition around them.'
			},
			{
				id: 'd',
				title: 'How should I choose spacing?',
				content: 'Use semantic spacing tokens so the layout follows the rhythm of the active theme.'
			}
		],
		[
			{
				id: 'e',
				title: 'Where should application state live?',
				content:
					'Keep state with the feature that owns it. Pass values and callbacks into the components that display and edit it.'
			},
			{
				id: 'f',
				title: 'How do I copy a block?',
				content:
					'Open the source tab, copy the component, and bring it into a project with Svelai configured.'
			}
		]
	];
</script>

<section class="mx-auto flex max-w-4xl flex-col gap-xl p-lg md:p-xl">
	<div class="max-w-2xl">
		<Heading as="h2" size="h2" weight="bold">Find the answer you need.</Heading>
		<p class="mt-lg text-neutral/70">Start with a topic. Open a question. Keep moving.</p>
	</div>
	<Tabbar
		items={['Getting started', 'Design', 'Development']}
		bind:value={active}
	/>{#key active}<Accordion items={topics[active]} variant="card" splitted icon="math" />{/key}
	<div
		class="flex flex-wrap items-center justify-between gap-lg rounded-lg bg-surface-recessed p-lg"
	>
		<p class="text-sm text-neutral/60">There is more context in the documentation.</p>
		<Button href="/docs" variant="link" suffix={arrowRightIcon}>Read the guides</Button>
	</div>
</section>
