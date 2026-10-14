<script lang="ts">
	// Harness for `layers.svelte.test.ts`: dialogs (modal layers) and a popover (non-modal) on the
	// shared layer stack, with zero-length transitions.
	import Theme from '$lib/components/Theme/Theme.svelte';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import type { OpenChangeHandler } from './openChange.js';

	let {
		scenario,
		onOpenChange,
		onInnerOpenChange,
		closeOnEscape = true
	}: {
		scenario: 'dialog' | 'nested-dialogs' | 'popover';
		onOpenChange?: OpenChangeHandler;
		onInnerOpenChange?: OpenChangeHandler;
		closeOnEscape?: boolean;
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<p data-testid="outside">Page content outside every overlay.</p>

	{#if scenario === 'dialog'}
		<Dialog
			responsive={false}
			transition={zero}
			title="Outer dialog"
			{closeOnEscape}
			trigger={{ content: 'Open dialog' }}
			{onOpenChange}
		>
			<p>Body</p>
		</Dialog>
	{:else if scenario === 'nested-dialogs'}
		<Dialog
			responsive={false}
			transition={zero}
			title="Outer dialog"
			trigger={{ content: 'Open dialog' }}
			{onOpenChange}
		>
			<Dialog
				responsive={false}
				transition={zero}
				title="Inner dialog"
				trigger={{ content: 'Open inner' }}
				onOpenChange={onInnerOpenChange}
			>
				<p>Inner body</p>
			</Dialog>
		</Dialog>
	{:else}
		<Popover transition={zero} trigger={{ content: 'Open popover' }} {onOpenChange}>
			<button type="button">Inside popover</button>
		</Popover>
	{/if}
</Theme>
