<script lang="ts">
	// Harness for `dialog.api.svelte.test.ts`: what the trigger and children snippets and the
	// lifecycle callbacks receive (CX-9). Zero-length transitions.
	import Theme from '../Theme/Theme.svelte';
	import Dialog from './Dialog.svelte';
	import type { DialogApi } from './dialog.api.js';

	let {
		onAfterOpen,
		onAfterClose
	}: {
		onAfterOpen?: (dialog: DialogApi) => void;
		onAfterClose?: (dialog: DialogApi) => void;
	} = $props();
</script>

<Theme>
	<Dialog
		title="Settings"
		type="modal"
		size="large"
		responsive={false}
		transition={{ in: { duration: 0 }, out: { duration: 0 } }}
		{onAfterOpen}
		{onAfterClose}
	>
		{#snippet trigger(dialog: DialogApi)}
			<button type="button" {@attach dialog.trigger}>Settings</button>
			<span data-testid="trigger-status">{dialog.status}</span>
		{/snippet}
		{#snippet children(dialog: DialogApi)}
			<span data-testid="panel-status">{dialog.status}</span>
			<button type="button" onclick={() => dialog.close()}>Done</button>
		{/snippet}
	</Dialog>
</Theme>
