<script lang="ts">
	import { untrack } from 'svelte';
	import { disclosurePanel, type DisclosurePanelMotion } from './disclosurePanel.svelte.js';

	let {
		defaultOpen = false,
		hiddenUntilFound = false,
		keepMounted = false,
		motion,
		refuseOpen = false,
		panelStyle,
		onBeforeMatch,
		onAfterOpen,
		onAfterClose
	}: {
		defaultOpen?: boolean;
		hiddenUntilFound?: boolean;
		keepMounted?: boolean;
		motion?: DisclosurePanelMotion;
		/** Behave like a controlled parent that ignores find-in-page open requests. */
		refuseOpen?: boolean;
		/** Inline style for the panel, giving it a box to animate in real browsers. */
		panelStyle?: string;
		onBeforeMatch?: (event: Event) => void;
		onAfterOpen?: () => void;
		onAfterClose?: () => void;
	} = $props();

	// The harness owns its open state after the first render, like an uncontrolled component.
	let open = $state(untrack(() => defaultOpen));

	const panel = disclosurePanel({
		open: () => open,
		hiddenUntilFound: () => hiddenUntilFound,
		keepMounted: () => keepMounted,
		motion: () => motion,
		onBeforeMatch: (event) => {
			onBeforeMatch?.(event);
			if (!refuseOpen) open = true;
		},
		onAfterOpen: () => onAfterOpen?.(),
		onAfterClose: () => onAfterClose?.()
	});
</script>

<button type="button" onclick={() => (open = !open)}>Toggle</button>
<button type="button" onclick={() => (open = false)}>Close</button>
<output data-testid="status">{panel.status}</output>
{#if panel.rendered}
	<div data-testid="panel" style={panelStyle} {...panel.attributes} {@attach panel.attach}>
		<div id="disclosure-secret" style:height={panelStyle ? '100px' : undefined}>Secret content</div>
	</div>
{/if}
