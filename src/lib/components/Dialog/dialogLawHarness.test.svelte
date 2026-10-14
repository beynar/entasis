<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Dialog from './Dialog.svelte';
	import type { DialogProps } from './dialog.props.js';

	let {
		defaultOpen = false,
		type,
		responsive = false,
		modal,
		closable,
		closeButton,
		emptyClose = false,
		closeOnClickOutside,
		onOpenChange,
		onAfterOpen,
		onAfterClose
	}: {
		/** Passes a close button snippet that renders nothing, as the Popover mobile sheet does. */
		emptyClose?: boolean;
	} & Pick<
		DialogProps,
		| 'defaultOpen'
		| 'type'
		| 'responsive'
		| 'modal'
		| 'closable'
		| 'closeButton'
		| 'closeOnClickOutside'
		| 'onOpenChange'
		| 'onAfterOpen'
		| 'onAfterClose'
	> = $props();
</script>

{#snippet emptyCloseButton()}{/snippet}

<Theme>
	<button type="button" data-testid="page-button">Page control</button>
	<Dialog
		{defaultOpen}
		{type}
		{responsive}
		{modal}
		{closable}
		closeButton={emptyClose ? emptyCloseButton : closeButton}
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
			<input aria-label="Draft" />
		{/snippet}
	</Dialog>
</Theme>
