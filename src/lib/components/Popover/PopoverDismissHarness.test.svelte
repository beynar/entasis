<script lang="ts">
	// Harness for `popover.dismissible.svelte.test.ts`: a popover with a control that closes it, a
	// page control to press or tab to, and the dismissal props passed through.
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import type { PopoverProps } from './popover.props.js';

	let {
		dismissible = false,
		modal = false,
		closeOnClickOutside,
		onOpenChange,
		onDismissAttempt
	}: Pick<
		PopoverProps,
		'dismissible' | 'modal' | 'closeOnClickOutside' | 'onOpenChange' | 'onDismissAttempt'
	> = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<button type="button">Page control</button>
	<Popover
		{dismissible}
		{modal}
		{closeOnClickOutside}
		{onOpenChange}
		{onDismissAttempt}
		focusOnOpen="first"
		transition={zero}
		trigger={{ content: 'Open popover' }}
	>
		{#snippet children(popover)}
			<input aria-label="Inside field" />
			<button type="button" onclick={(event) => popover.close({ reason: 'close-press', event })}
				>Done</button
			>
		{/snippet}
	</Popover>
</Theme>
