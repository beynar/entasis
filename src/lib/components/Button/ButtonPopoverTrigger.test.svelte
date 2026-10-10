<script lang="ts">
	// A Button that is also a Popover trigger, so tests can check that a click listener attached
	// directly to the element cannot act while the Button refuses activation.
	import Theme from '../Theme/Theme.svelte';
	import Popover from '../Popover/Popover.svelte';
	import type { PopoverState } from '../Popover/popover.state.svelte.js';
	import Button from './Button.svelte';

	let { loading = false, disabled = false }: { loading?: boolean; disabled?: boolean } = $props();
</script>

{#snippet trigger(popover: PopoverState)}
	<Button {loading} {disabled} {@attach popover.trigger}>Export</Button>
{/snippet}

<Theme>
	<Popover {trigger}>
		<p>Export options</p>
	</Popover>
</Theme>
