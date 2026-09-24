<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Sidebar from './Sidebar.svelte';
	import type {
		SidebarActiveVariant,
		SidebarGroup,
		SidebarMenuButtonItem
	} from './sidebar.props.js';
	import type { SidebarSize } from './sidebar.props.js';
	import type { SidebarThemeProps } from './sidebar.theme.js';

	let {
		activeVariant = 'soft',
		iconSize,
		theme,
		headerButton,
		items,
		onCollapse
	}: {
		activeVariant?: SidebarActiveVariant;
		iconSize?: SidebarSize;
		theme?: SidebarThemeProps;
		headerButton?: SidebarMenuButtonItem;
		items?: SidebarGroup[];
		onCollapse?: () => void;
	} = $props();

	const defaultItems: SidebarGroup[] = [
		{
			label: 'Workspace',
			action: [
				{ icon: '+', label: 'Add project', size: 'large' },
				{ icon: 'x', label: 'Reorder projects' }
			],
			items: [
				{ label: 'Inbox', href: '#inbox', icon: 'I', isActive: true },
				{
					label: 'Atlas',
					href: '#atlas',
					icon: 'A',
					iconColor: 'success',
					iconVariant: 'tile'
				}
			]
		}
	];
</script>

<Theme>
	<Sidebar
		items={items ?? defaultItems}
		{activeVariant}
		{iconSize}
		{theme}
		{headerButton}
		search={{ placeholder: 'Search', label: 'Search the workspace' }}
		defaultOpen
		frame="contained"
	>
		{#snippet header()}
			<p data-testid="custom-header">Workspace card</p>
		{/snippet}
		<p>Page content</p>
		<button type="button" data-testid="collapse" onclick={() => onCollapse?.()}>outside</button>
	</Sidebar>
</Theme>
