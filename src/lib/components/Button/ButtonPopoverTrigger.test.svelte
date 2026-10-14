<script lang="ts">
	// A Button that is also a Popover trigger, so tests can check that a click listener attached
	// directly to the element cannot act while the Button refuses activation.
	import Theme from '../Theme/Theme.svelte';
	import Popover from '../Popover/Popover.svelte';
	import type { PopoverApi } from '../Popover/popover.api.js';
	import Button from './Button.svelte';

	let { loading = false, disabled = false }: { loading?: boolean; disabled?: boolean } = $props();
</script>

{#snippet trigger(popover: PopoverApi)}
	<Button {loading} {disabled} {@attach popover.trigger}>Export</Button>
{/snippet}

<Theme>
	<Popover {trigger}>
		<p>Export options</p>
	</Popover>
</Theme>
