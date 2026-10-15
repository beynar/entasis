<script lang="ts">
	// Harness for `popover.api.svelte.test.ts`: what the trigger and children snippets and the
	// lifecycle callbacks receive (CX-9). Zero-length transitions.
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import type { PopoverApi } from './popover.api.js';

	let {
		onAfterOpen,
		onAfterClose
	}: {
		onAfterOpen?: (popover: PopoverApi) => void;
		onAfterClose?: (popover: PopoverApi) => void;
	} = $props();
</script>

<Theme>
	<Popover
		transition={{ in: { duration: 0 }, out: { duration: 0 } }}
		label="Details"
		size="large"
		position="top"
		offset={12}
		{onAfterOpen}
		{onAfterClose}
	>
		{#snippet trigger(popover: PopoverApi)}
			<button type="button" {@attach popover.trigger}>Details</button>
			<span data-testid="trigger-status">{popover.status}</span>
			<span data-testid="trigger-open">{popover.isOpen}</span>
		{/snippet}
		{#snippet children(popover: PopoverApi)}
			<span data-testid="panel-status">{popover.status}</span>
			<button type="button" onclick={() => popover.close()}>Done</button>
		{/snippet}
	</Popover>
</Theme>
