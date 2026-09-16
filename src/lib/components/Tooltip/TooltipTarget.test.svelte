<script lang="ts">
	import { tooltip } from './tooltip.attachment.svelte.js';
	import type { TooltipOptions } from './tooltip.props.js';

	let { onAfterOpen, onAfterClose }: Pick<TooltipOptions, 'onAfterOpen' | 'onAfterClose'> =
		$props();
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
