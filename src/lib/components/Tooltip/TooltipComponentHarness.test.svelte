<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import Theme from '../Theme/Theme.svelte';
	import Tooltip from './Tooltip.svelte';
	import type { TooltipOptions } from './tooltip.props.js';

	let {
		open = false,
		onOpenChange,
		options = {}
	}: {
		open?: boolean;
		onOpenChange?: TooltipOptions['onOpenChange'];
		/** Further options, replaced through `rerender` to change them while the tooltip lives. */
		options?: Partial<TooltipOptions>;
	} = $props();
</script>

{#snippet triggerSnippet(attach: Attachment<HTMLElement>)}
	<button type="button" {@attach attach}>Tooltip trigger</button>
{/snippet}

<Theme>
	<Tooltip
		{open}
		{onOpenChange}
		content="Tooltip content"
		delay={0}
		transition={{ in: { duration: 0 }, out: { duration: 0 } }}
		trigger={triggerSnippet}
		{...options}
	/>
</Theme>
