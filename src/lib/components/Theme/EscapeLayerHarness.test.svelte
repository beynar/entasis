<script lang="ts">
	// Test-only: a control that takes keys, in a popover, under a probe of the layers.
	import Popover from '../Popover/Popover.svelte';
	import SegmentedControl from '../SegmentedControl/SegmentedControl.svelte';
	import EscapeLayerProbe from './EscapeLayerProbe.test.svelte';
	import Theme from './Theme.svelte';

	let { onEscape = () => {} }: { onEscape?: (open: boolean) => void } = $props();
</script>

<Theme>
	<EscapeLayerProbe {onEscape} />
	<Popover trigger={{ content: 'Open' }}>
		<SegmentedControl
			items={[
				{ value: 'all', label: 'All' },
				{ value: 'none', label: 'None' }
			]}
		/>
	</Popover>
</Theme>
