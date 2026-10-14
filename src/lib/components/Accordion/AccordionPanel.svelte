<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		disclosurePanel,
		type DisclosurePanelMotion
	} from '$lib/attachments/disclosurePanel.svelte.js';

	// One item's panel. The disclosure panel controller is created per item, so every item
	// keeps its own `hidden` state, height animation and completion callbacks.
	let {
		id,
		labelledby,
		open,
		hiddenUntilFound,
		keepMounted,
		motion,
		class: className,
		onBeforeMatch,
		onAfterOpen,
		onAfterClose,
		children
	}: {
		id: string;
		/** The id of the trigger that labels the region. */
		labelledby: string;
		open: boolean;
		hiddenUntilFound?: boolean;
		keepMounted?: boolean;
		motion?: DisclosurePanelMotion;
		/** Classes of the content element inside the panel. */
		class?: string;
		onBeforeMatch: (event: Event) => void;
		onAfterOpen?: () => void;
		onAfterClose?: () => void;
		children: Snippet;
	} = $props();

	const panel = disclosurePanel({
		open: () => open,
		hiddenUntilFound: () => hiddenUntilFound,
		keepMounted: () => keepMounted,
		motion: () => motion,
		onBeforeMatch: (event) => onBeforeMatch(event),
		onAfterOpen: () => onAfterOpen?.(),
		onAfterClose: () => onAfterClose?.()
	});
</script>

{#if panel.rendered}
	<!-- The panel stays bare: while it hides until found, only its content is skipped, so the
	     padding of the content slot lives on the element inside. -->
	<div
		{id}
		role="region"
		aria-labelledby={labelledby}
		data-slot="accordion-panel"
		{...panel.attributes}
		{@attach panel.attach}
	>
		<div class={className} data-open={open ? '' : undefined} data-closed={open ? undefined : ''}>
			{@render children()}
		</div>
	</div>
{/if}
