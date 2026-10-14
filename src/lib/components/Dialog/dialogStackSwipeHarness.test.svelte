<script lang="ts">
	// A drawer open at creation with a second drawer above it, for the stack-follows-swipe tests.
	import Theme from '../Theme/Theme.svelte';
	import Dialog from './Dialog.svelte';
	import type { DialogProps } from './dialog.props.js';

	let { modal = true }: Pick<DialogProps, 'modal'> = $props();
</script>

<Theme>
	<Dialog
		defaultOpen
		type="drawerBottom"
		responsive={false}
		title="Parent"
		transition={{ in: { duration: 0 }, out: { duration: 0 } }}
	>
		<Dialog
			type="drawerBottom"
			{modal}
			responsive={false}
			title="Child"
			trigger={{ content: 'Open child' }}
			transition={{ in: { duration: 0 }, out: { duration: 0 } }}
		>
			<p>Child body</p>
		</Dialog>
	</Dialog>
</Theme>
