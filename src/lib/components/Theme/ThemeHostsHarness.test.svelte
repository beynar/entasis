<script lang="ts">
	// What a page puts under `<Theme>`, piece by piece: the hosts tests read which shared surfaces
	// the Theme mounted for it.
	import Theme from './Theme.svelte';
	import Button from '../Button/Button.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import Tooltip from '../Tooltip/Tooltip.svelte';
	import { tooltip } from '../Tooltip/tooltip.attachment.svelte.js';
	import type { ThemeState } from './theme.state.svelte.js';
	import type { ThemeTransitionInput } from './themeTransition.js';

	let {
		tooltips = 0,
		tooltipComponent = false,
		dialogs = 0,
		defaultOpen = false,
		transition,
		report
	}: {
		tooltips?: number;
		tooltipComponent?: boolean;
		dialogs?: number;
		defaultOpen?: boolean;
		transition?: ThemeTransitionInput;
		/** Receives the Theme state; returns `true` so the template can carry the call. */
		report?: (theme: ThemeState) => true;
	} = $props();
</script>

<Theme {transition}>
	{#snippet children(theme)}
		{@const reported = report?.(theme)}
		<Button data-reported={reported}>Plain</Button>
		{#each { length: tooltips }, index (index)}
			<button type="button" {@attach tooltip({ content: `Tip ${index}` })}>Tipped {index}</button>
		{/each}
		{#if tooltipComponent}
			<Tooltip content="From the component" trigger={{ content: 'Component' }} />
		{/if}
		{#each { length: dialogs }, index (index)}
			<Dialog title="Dialog {index}" {defaultOpen} trigger={{ content: `Open ${index}` }}>
				Body {index}
			</Dialog>
		{/each}
	{/snippet}
</Theme>
