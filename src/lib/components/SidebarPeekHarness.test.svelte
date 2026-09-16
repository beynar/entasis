<script lang="ts">
	import Theme from './Theme/Theme.svelte';
	import Sidebar from './Sidebar/Sidebar.svelte';
	import type {
		SidebarActivityBar,
		SidebarCollapsible,
		SidebarGroup
	} from './Sidebar/sidebar.props.js';

	type Scenario = 'peek' | 'activity-bar';
	let {
		scenario = 'peek',
		collapsible = 'offcanvas',
		expandOnHover = false,
		onSelect
	}: {
		scenario?: Scenario;
		collapsible?: SidebarCollapsible;
		expandOnHover?: boolean;
		onSelect?: (label: string, index: number) => void;
	} = $props();

	const items: SidebarGroup[] = [
		{
			label: 'Workspace',
			collapsible: true,
			defaultOpen: true,
			items: [
				{ label: 'Inbox', href: '#inbox', icon: 'I', badge: 7 },
				{
					label: 'Row menu',
					icon: 'M',
					menu: [
						{ type: 'option', title: 'Archive' },
						{ type: 'option', title: 'Delete' }
					]
				}
			]
		}
	];

	const activityBar: SidebarActivityBar = {
		label: 'Workspaces',
		items: [
			{ label: 'Files', icon: 'F' },
			{ label: 'Search', icon: 'S', isActive: true },
			{ label: 'Extensions', icon: 'E', badge: 3 }
		],
		footerItems: [{ label: 'Account', icon: 'A' }],
		onSelect: ({ item, index }) => onSelect?.(item.label, index)
	};
</script>

<Theme>
	<button type="button" data-testid="outside">Outside the sidebar</button>
	<Sidebar
		{items}
		{collapsible}
		{expandOnHover}
		search={{ label: 'Search workspace' }}
		defaultOpen={false}
		frame="contained"
		activityBar={scenario === 'activity-bar' ? activityBar : undefined}
	>
		<p>Page content</p>
	</Sidebar>
</Theme>
