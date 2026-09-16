<script lang="ts">
	import { slidersHorizontalIcon } from '$lib/components/Icons/slidersHorizontal.js';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import TokenControls from './playground/TokenControls.svelte';
	import {
		runtimeThemePresets,
		useRuntimeThemePlayground
	} from './runtimeThemePlayground.svelte.js';

	const playground = useRuntimeThemePlayground();
	const label = $derived(
		playground.selectedPreset ? runtimeThemePresets[playground.selectedPreset].label : 'Custom'
	);
</script>

<!-- The playground levers live in the shell footer so every docs page can be retuned live. -->
<Popover
	position="top-end"
	size="large"
	haspopup="dialog"
	lockScroll={false}
	class="w-[30rem] max-w-[calc(100vw-2rem)]"
	trigger={{
		content: `Theme: ${label}`,
		prefix: slidersHorizontalIcon,
		variant: 'outline',
		size: 'small',
		label: 'Open the theme playground'
	}}
>
	<div class="pr-xs max-h-[70vh] overflow-y-auto">
		<TokenControls embedded />
	</div>
</Popover>
