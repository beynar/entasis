<script lang="ts">
	// Harness for `useNavigation.keys.svelte.test.ts`: an inline Menu (hover-to-navigate) beside an
	// unrelated text field, and a SegmentedControl, each inside <Theme>.
	import Theme from '../components/Theme/Theme.svelte';
	import Menu from '../components/Menu/Menu.svelte';
	import SegmentedControl from '../components/SegmentedControl/SegmentedControl.svelte';
	import type { MenuItem } from '../components/Menu/menu.props.js';

	let {
		scenario,
		items = [],
		onValueChange
	}: {
		scenario: 'menu' | 'segmented';
		items?: MenuItem[];
		onValueChange?: (value: string) => void;
	} = $props();
</script>

<Theme>
	{#if scenario === 'menu'}
		<input aria-label="Search" />
		<Menu {items} />
	{:else}
		<SegmentedControl
			label="View"
			items={[
				{ value: 'list', label: 'List' },
				{ value: 'grid', label: 'Grid' },
				{ value: 'board', label: 'Board' }
			]}
			defaultValue="list"
			{onValueChange}
		/>
	{/if}
</Theme>
