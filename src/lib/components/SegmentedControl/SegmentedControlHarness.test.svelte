<script lang="ts">
	// A SegmentedControl between two plain buttons, with its value written out, so browser tests can
	// Tab into the control and read whether anything selected.
	import Theme from '../Theme/Theme.svelte';
	import SegmentedControl from './SegmentedControl.svelte';
	import type { SegmentedControlItem } from './segmentedControl.props.js';

	let {
		items = [
			{ value: 'grid', label: 'Grid' },
			{ value: 'list', label: 'List' },
			{ value: 'table', label: 'Table' }
		],
		value = $bindable<string | undefined>('list'),
		changes = $bindable<string[]>([])
	}: {
		items?: SegmentedControlItem[];
		value?: string;
		changes?: string[];
	} = $props();
</script>

<Theme>
	<button type="button">Before</button>
	<SegmentedControl
		label="View"
		{items}
		bind:value
		onValueChange={(next: string) => changes.push(next)}
	/>
	<button type="button">After</button>
	<output data-testid="value">{value ?? ''}</output>
	<output data-testid="changes">{changes.join(',')}</output>
</Theme>
