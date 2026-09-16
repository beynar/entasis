<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import TooltipTarget from './TooltipTarget.test.svelte';
	import type { TooltipOptions } from './tooltip.props.js';

	const props: Pick<TooltipOptions, 'onAfterOpen' | 'onAfterClose'> = $props();
</script>

<Theme>
	<TooltipTarget {...props} />
</Theme>
