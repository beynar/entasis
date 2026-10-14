<script lang="ts">
	// Two tooltip triggers, plus a dialog that the first one opens, for the option and focus tests.
	import Dialog from '../Dialog/Dialog.svelte';
	import Theme from '../Theme/Theme.svelte';
	import { tooltip } from './tooltip.attachment.svelte.js';
	import type { TooltipOptions } from './tooltip.props.js';

	type Props = {
		first?: Partial<TooltipOptions>;
		second?: Partial<TooltipOptions>;
		/** The first trigger opens a dialog when pressed. */
		dialog?: boolean;
	};
	let { first = {}, second = {}, dialog = false }: Props = $props();
	let dialogOpen = $state(false);
	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<button type="button">Before</button>
	<button
		type="button"
		onclick={() => (dialogOpen = dialog)}
		{@attach tooltip({ content: 'First content', delay: 0, transition: zero, ...first })}
		>First</button
	>
	<button
		type="button"
		{@attach tooltip({ content: 'Second content', delay: 0, transition: zero, ...second })}
		>Second</button
	>
	<button type="button">After</button>
	{#if dialog}
		<Dialog bind:open={dialogOpen} responsive={false} transition={zero} title="Tooltip dialog">
			<input aria-label="Dialog field" />
		</Dialog>
	{/if}
</Theme>
