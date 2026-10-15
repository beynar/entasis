<script lang="ts">
	// Renders nothing. Popover mounts it while the popover is open or closing, so the open-only
	// machinery (layer, focus scope, safe area, Tab bridge, scroll lock) is built on open and torn
	// down once the closing transition ends; a closed popover pays for none of it.
	import type { PopoverState } from './popover.state.svelte.js';

	let { popover }: { popover: Pick<PopoverState, 'openSession'> } = $props();

	// Once, at initialisation: the session belongs to this mount, never to a later `popover`.
	// svelte-ignore state_referenced_locally
	popover.openSession();
</script>
