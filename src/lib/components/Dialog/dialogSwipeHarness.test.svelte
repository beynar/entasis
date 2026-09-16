<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Dialog from './Dialog.svelte';
	import type { DialogProps } from './dialog.props.js';

	let {
		type = 'drawerBottom',
		swipeFrom,
		swipeToDismiss,
		closable = true,
		onOpenChange,
		onAction
	}: Pick<DialogProps, 'type' | 'swipeFrom' | 'swipeToDismiss' | 'closable' | 'onOpenChange'> & {
		onAction?: () => void;
	} = $props();
</script>

<Theme>
	<Dialog
		defaultOpen
		{type}
		{swipeFrom}
		{swipeToDismiss}
		{closable}
		{onOpenChange}
		responsive={false}
		transition={{ in: { duration: 0 }, out: { duration: 0 } }}
	>
		{#snippet children(dialog)}
			<!-- The drag state the panel transform and the backdrop opacity are derived from. -->
			<span data-testid="dragging">{dialog.dragging}</span>
			<span data-testid="progress">{dialog.dragProgress}</span>
			<span data-testid="offset">{dialog.dragOffset}</span>
			<button type="button" data-testid="action" onclick={onAction}>Action</button>
			<div data-testid="body">Body copy</div>
			<div data-testid="opted-out" data-no-swipe>Opted out</div>
			<div data-testid="scroller" style="overflow-y: auto;">Scrollable</div>
		{/snippet}
	</Dialog>
</Theme>
