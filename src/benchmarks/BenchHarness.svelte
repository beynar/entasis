<script lang="ts" module>
	export type BenchScenario =
		'select' | 'combobox' | 'command' | 'menu' | 'closed-popovers' | 'closed-selects';
</script>

<script lang="ts">
	// Fixtures for the benchmarks in this folder: large lists (SC-9, MN-13) and many closed
	// overlays (CX-10). Measurements are synchronous (flushSync), so no run waits on an animation.
	import Theme from '$lib/components/Theme/Theme.svelte';
	import Command from '$lib/components/Command/Command.svelte';
	import Combobox from '$lib/components/Form/Combobox/Combobox.svelte';
	import Select from '$lib/components/Form/Select/Select.svelte';
	import Menu from '$lib/components/Menu/Menu.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import type { MenuItem } from '$lib/components/Menu/menu.props.js';

	let { scenario, count }: { scenario: BenchScenario; count: number } = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	const range = (length: number) => Array.from({ length }, (_, index) => index + 1);
	const options = $derived(
		range(count).map((index) => ({ value: `option-${index}`, label: `Option ${index}` }))
	);
	const menuItems = $derived<MenuItem[]>(
		range(count).map((index) => ({ type: 'option', title: `Item ${index}` }))
	);
	const smallOptions = [
		{ value: 'a', label: 'Alpha' },
		{ value: 'b', label: 'Beta' },
		{ value: 'c', label: 'Gamma' }
	];
</script>

<Theme>
	{#if scenario === 'select'}
		<Select label="Large select" items={options} />
	{:else if scenario === 'combobox'}
		<Combobox label="Large combobox" items={options} showAllOnFocus />
	{:else if scenario === 'command'}
		<Command items={[{ heading: 'Options', items: options }]} placeholder="Search options" />
	{:else if scenario === 'menu'}
		<Menu items={menuItems} />
	{:else if scenario === 'closed-popovers'}
		{#each range(count) as index (index)}
			<Popover transition={zero} trigger={{ content: `Popover ${index}` }}>
				<p>Panel {index}</p>
			</Popover>
		{/each}
	{:else if scenario === 'closed-selects'}
		{#each range(count) as index (index)}
			<Select label={`Select ${index}`} items={smallOptions} />
		{/each}
	{/if}
</Theme>
