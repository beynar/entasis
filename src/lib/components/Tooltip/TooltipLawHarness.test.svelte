<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import TooltipTarget from './TooltipTarget.test.svelte';
	import type { TooltipProps } from './tooltip.svelte.js';

	const props: Pick<TooltipProps, 'onAfterOpen' | 'onAfterClose'> = $props();
</script>

<Theme>
	<TooltipTarget {...props} />
</Theme>
