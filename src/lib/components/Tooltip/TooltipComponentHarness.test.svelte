<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import Theme from '../Theme/Theme.svelte';
	import Tooltip from './Tooltip.svelte';

	let { open = false, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void } =
		$props();
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
	/>
</Theme>
