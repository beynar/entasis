<script lang="ts">
	import { tooltip } from './tooltip.svelte.js';
	import type { TooltipProps } from './tooltip.svelte.js';

	let { onAfterOpen, onAfterClose }: Pick<TooltipProps, 'onAfterOpen' | 'onAfterClose'> = $props();
</script>

<button
	type="button"
	{@attach tooltip({
		content: 'Tooltip content',
		delay: 0,
		transition: { in: { duration: 0 }, out: { duration: 0 } },
		onAfterOpen,
		onAfterClose
	})}>Tooltip trigger</button
>
