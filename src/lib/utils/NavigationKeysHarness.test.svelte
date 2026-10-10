<script lang="ts">
	// Harness for `useNavigation.keys.svelte.test.ts`: an inline Menu (hover-to-navigate) beside an
	// unrelated text field, a PopupMenu opened by a button, a MenuBar and a SegmentedControl, each
	// inside <Theme>.
	import Theme from '../components/Theme/Theme.svelte';
	import Menu from '../components/Menu/Menu.svelte';
	import MenuBar from '../components/MenuBar/MenuBar.svelte';
	import PopupMenu from '../components/PopupMenu/PopupMenu.svelte';
	import SegmentedControl from '../components/SegmentedControl/SegmentedControl.svelte';
	import type { MenuItem } from '../components/Menu/menu.props.js';

	let {
		scenario,
		items = [],
		onValueChange
	}: {
		scenario: 'menu' | 'popup' | 'menubar' | 'segmented';
		items?: MenuItem[];
		onValueChange?: (value: string) => void;
	} = $props();
</script>

<Theme>
	{#if scenario === 'menu'}
		<input aria-label="Search" />
		<Menu {items} />
	{:else if scenario === 'popup'}
		<PopupMenu menu={{ items }} transition={{ in: { duration: 0 }, out: { duration: 0 } }}>
			{#snippet trigger(popover)}
				<button type="button" onclick={popover.toggle} {@attach popover.reference}>Open</button>
			{/snippet}
		</PopupMenu>
	{:else if scenario === 'menubar'}
		<MenuBar
			menus={[
				{ label: 'File', items: [{ type: 'option', title: 'New file' }] },
				{ label: 'Edit', items: [{ type: 'option', title: 'Undo' }] }
			]}
		/>
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
