<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Dialog from './Dialog.svelte';
	import type { DialogProps } from './dialog.props.js';

	let {
		defaultOpen = false,
		type,
		responsive = false,
		closeOnClickOutside,
		onOpenChange,
		onAfterOpen,
		onAfterClose
	}: Pick<
		DialogProps,
		| 'defaultOpen'
		| 'type'
		| 'responsive'
		| 'closeOnClickOutside'
		| 'onOpenChange'
		| 'onAfterOpen'
		| 'onAfterClose'
	> = $props();
</script>

<Theme>
	<Dialog
		{defaultOpen}
		{type}
		{responsive}
		{closeOnClickOutside}
		{onOpenChange}
		{onAfterOpen}
		{onAfterClose}
		transition={{ in: { duration: 0 }, out: { duration: 0 } }}
		title="Disclosure law"
	>
		{#snippet trigger(dialog)}
			<button type="button" onclick={dialog.open}>Open law dialog</button>
		{/snippet}

		{#snippet children(dialog)}
			<button type="button" onclick={dialog.close}>Close law dialog</button>
		{/snippet}
	</Dialog>
</Theme>
