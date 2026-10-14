<script lang="ts">
	// Harness for `layers.ownerDocument.svelte.test.ts`: one non-modal layer on a bare layer stack
	// whose nodes live in a document the test chooses (an iframe's).
	import { LayerStack, type LayerDismissRequest } from './layers.svelte.js';

	let {
		open,
		nodes,
		onDismiss
	}: {
		open: boolean;
		nodes: Node[];
		onDismiss: (request: LayerDismissRequest) => void;
	} = $props();

	const stack = new LayerStack();
	const layer = stack.register({
		kind: 'popover',
		isOpen: () => open,
		isModal: () => false,
		dismissOnEscape: () => true,
		dismissOnOutside: () => true,
		onDismiss: (request) => onDismiss(request)
	});

	$effect(() => {
		const offs = nodes.map((node) => layer.node(node));
		return () => offs.forEach((off) => off());
	});
</script>
