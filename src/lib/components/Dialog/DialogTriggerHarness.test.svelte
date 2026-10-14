<script lang="ts">
	// Harness for the Dialog trigger contract and lifecycle tests in `dialog.svelte.test.ts`.
	import Theme from '../Theme/Theme.svelte';
	import Dialog from './Dialog.svelte';
	import type { DialogProps } from './dialog.props.js';

	let {
		scenario,
		onOpenChange,
		onAfterOpen
	}: {
		scenario:
			| 'snippet-trigger'
			| 'animated-trigger'
			| 'prevented-trigger'
			| 'built-in-trigger'
			| 'default-open';
		onOpenChange?: DialogProps['onOpenChange'];
		onAfterOpen?: DialogProps['onAfterOpen'];
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	{#if scenario === 'snippet-trigger'}
		<Dialog responsive={false} transition={zero} title="Card details" {onOpenChange}>
			{#snippet trigger(dialog)}
				<div data-testid="card" {@attach dialog.trigger}>Ada Lovelace</div>
			{/snippet}
			<p>Details</p>
		</Dialog>
	{:else if scenario === 'animated-trigger'}
		<!-- A real closing transition: the close completes while the page behind is still inert. -->
		<Dialog
			responsive={false}
			transition={{ in: { duration: 20 }, out: { duration: 40 } }}
			title="Animated card"
			{onOpenChange}
		>
			{#snippet trigger(dialog)}
				<button type="button" data-testid="opener" {@attach dialog.trigger}>Open animated</button>
			{/snippet}
			<p>Details</p>
		</Dialog>
	{:else if scenario === 'built-in-trigger'}
		<Dialog
			responsive={false}
			transition={zero}
			title="Built-in"
			trigger={{ content: 'Open built-in' }}
			{onOpenChange}
		>
			<p>Built-in body</p>
		</Dialog>
	{:else if scenario === 'prevented-trigger'}
		<Dialog
			responsive={false}
			transition={zero}
			title="Guarded"
			trigger={{ content: 'Open guarded', onclick: (event) => event.preventDefault() }}
			{onOpenChange}
		>
			<p>Guarded body</p>
		</Dialog>
	{:else}
		<!-- A real (non-zero) transition: created open, the dialog still animates in once mounted. -->
		<Dialog
			defaultOpen
			responsive={false}
			transition={{ in: { duration: 50 }, out: { duration: 50 } }}
			title="Open at creation"
			{onAfterOpen}
		>
			<p>Body</p>
		</Dialog>
	{/if}
</Theme>
