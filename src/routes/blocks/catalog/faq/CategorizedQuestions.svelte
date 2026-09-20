<script lang="ts">
	import { Accordion } from 'entasis/accordion';
	import { Button } from 'entasis/button';
	import { Heading } from 'entasis/heading';
	import { Tabbar } from 'entasis/tabbar';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	const tabs = ['Getting started', 'Design', 'Development'];
	let active = $state(tabs[0]);
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
					'Open the source tab, copy the component, and bring it into a project with Entasis configured.'
			}
		]
	];
	const activeTopics = $derived(topics[Math.max(0, tabs.indexOf(active))]);
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-4xl flex-col">
	<div class="max-w-2xl">
		<Heading as="h2" size="h2" weight="bold">Find the answer you need.</Heading>
		<p class="mt-lg text-neutral/70">Start with a topic. Open a question. Keep moving.</p>
	</div>
	<Tabbar items={tabs} bind:value={active} />{#key active}<Accordion
			items={activeTopics}
			variant="card"
			splitted
			icon="plus-minus"
		/>{/key}
	<div
		class="gap-lg bg-surface-recessed p-lg flex flex-wrap items-center justify-between rounded-lg"
	>
		<p class="text-neutral/70 text-sm">There is more context in the documentation.</p>
		<Button href="/docs" variant="link" suffix={arrowRightIcon}>Read the guides</Button>
	</div>
</section>
