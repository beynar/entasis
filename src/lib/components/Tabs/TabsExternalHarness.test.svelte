<script lang="ts">
	// Panels Tabs does not render, as an editor would keep them: in the document, in order, hidden by
	// their own renderer, and replaced when the owner re-renders one.
	import Theme from '../Theme/Theme.svelte';
	import Tabs from './Tabs.svelte';
	import { createTabsPanels } from './tabs.panels.svelte.js';
	import type { TabsValueChangePayload } from './tabs.props.js';

	let {
		tabs = ['One', 'Two', 'Three'],
		value = $bindable(),
		revision = 0,
		reduceMotion,
		exit = false,
		onValueChange
	}: {
		tabs?: string[];
		value?: string;
		/** Bumping it replaces every panel element, as an editor commit would. */
		revision?: number;
		reduceMotion?: boolean;
		/** Keep the leaving panel shown while it plays out, through `panels.isExiting`. */
		exit?: boolean;
		onValueChange?: (payload: TabsValueChangePayload) => void;
	} = $props();

	const panels = createTabsPanels();
</script>

<Theme {reduceMotion}>
	<div data-testid="block" class:exit>
		<Tabs items={tabs} bind:value {panels} {onValueChange} />
		<div data-testid="children">
			{#each tabs as tab (tab)}
				{#key revision}
					<section
						data-tab={tab}
						hidden={tab !== value && !(exit && panels.isExiting(tab))}
						{@attach panels.panel(tab)}
					>
						Content of {tab}
					</section>
				{/key}
			{/each}
		</div>
	</div>
</Theme>
