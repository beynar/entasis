<script lang="ts">
	// A ToggleButtonGroup between two plain buttons, so browser tests can Tab into and out of it.
	import Theme from '../Theme/Theme.svelte';
	import ToggleButtonGroup from './ToggleButtonGroup.svelte';
	import type { ToggleButtonGroupItems, ToggleButtonGroupOrientation } from './index.js';

	let {
		items = [
			{ value: 'bold', children: 'Bold' },
			{ value: 'italic', children: 'Italic' },
			{ value: 'underline', children: 'Underline' }
		],
		value = [],
		type = 'multiple',
		disabled = false,
		orientation = 'horizontal',
		loopFocus = true,
		joined = false
	}: {
		items?: ToggleButtonGroupItems;
		value?: string[] | string;
		type?: 'single' | 'multiple';
		disabled?: boolean;
		orientation?: ToggleButtonGroupOrientation;
		loopFocus?: boolean;
		joined?: boolean;
	} = $props();
	// Flipped by the last button, to prove `loopFocus` is read on every arrow press.
	let stopped = $state(false);
</script>

<Theme>
	<button type="button">Before</button>
	<ToggleButtonGroup
		label="Formatting"
		{items}
		{type}
		{disabled}
		{orientation}
		{joined}
		loopFocus={loopFocus && !stopped}
		defaultValue={value as never}
	/>
	<button type="button">After</button>
	<button type="button" onclick={() => (stopped = true)}>Stop looping</button>
</Theme>
