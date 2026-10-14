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
		loopFocus = true
	}: {
		items?: ToggleButtonGroupItems;
		value?: string[] | string;
		type?: 'single' | 'multiple';
		disabled?: boolean;
		orientation?: ToggleButtonGroupOrientation;
		loopFocus?: boolean;
	} = $props();
</script>

<Theme>
	<button type="button">Before</button>
	<ToggleButtonGroup
		label="Formatting"
		{items}
		{type}
		{disabled}
		{orientation}
		{loopFocus}
		defaultValue={value as never}
	/>
	<button type="button">After</button>
</Theme>
