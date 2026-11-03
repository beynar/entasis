<script lang="ts">
	// The selection harness inside a Theme, for browser tests that mount it directly.
	import type { ComponentProps } from 'svelte';
	import Theme from '../Theme/Theme.svelte';
	import TimelineSelectionHarness from './TimelineSelectionHarness.test.svelte';

	let props: ComponentProps<typeof TimelineSelectionHarness> = $props();
</script>

<Theme>
	<div class="p-xl w-[56rem]">
		<TimelineSelectionHarness {...props} />
	</div>
</Theme>
