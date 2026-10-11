<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import Theme from '$lib/components/Theme/Theme.svelte';
	import type { MotionTokens, DeepPartial } from '$lib/utils/motion/index.js';
	import DisclosurePanelHarness from './DisclosurePanelHarness.test.svelte';

	let {
		reduceMotion,
		motionTokens,
		...props
	}: ComponentProps<typeof DisclosurePanelHarness> & {
		reduceMotion?: boolean;
		motionTokens?: DeepPartial<MotionTokens>;
	} = $props();
</script>

<Theme {reduceMotion} motion={motionTokens}>
	<DisclosurePanelHarness {...props} />
</Theme>
