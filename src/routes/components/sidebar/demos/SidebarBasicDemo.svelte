<script lang="ts">
	import {
		Sidebar,
		type SidebarDensity,
		type SidebarDisplayState,
		type SidebarGroup,
		type SidebarMenuEntry,
		type SidebarSize,
		type SidebarVariant
	} from '$lib/components/Sidebar/index.js';
	import { Skeleton } from '$lib/components/Skeleton/index.js';
	import type { MenuItem } from '$lib/components/Menu/index.js';
	import { bellIcon } from '$lib/components/Icons/bell.js';
	import { chartBarIcon } from '$lib/components/Icons/chartBar.js';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { creditCardIcon } from '$lib/components/Icons/creditCard.js';
	import { dotsThreeIcon } from '$lib/components/Icons/dotsThree.js';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { plusIcon } from '$lib/components/Icons/plus.js';
	import { signOutIcon } from '$lib/components/Icons/signOut.js';
	import { trayIcon } from '$lib/components/Icons/tray.js';

	let {
		variant = 'inset',
		size = 'normal',
		density = 'normal'
	}: {
		variant?: SidebarVariant;
		size?: SidebarSize;
		density?: SidebarDensity;
	} = $props();

	let displayState = $state<SidebarDisplayState>('expanded');
	let width = $state('17rem');
	let query = $state('');

	const accountMenu: MenuItem[] = [
		{ type: 'option', title: 'Notifications', prefix: bellIcon },
		{ type: 'option', title: 'Billing', prefix: creditCardIcon },
		{ type: 'separator' },
		{ type: 'option', title: 'Sign out', prefix: signOutIcon, color: 'danger' }
	];

	const projectMenu: MenuItem[] = [
		{ type: 'option', title: 'New project', prefix: plusIcon },
		{ type: 'option', title: 'Project settings', prefix: gearIcon }
	];

	const items: SidebarGroup[] = [
		{
			label: 'Workspace',
			items: [
				{ label: 'Overview', href: '#overview', icon: houseIcon, isActive: true },
				{ label: 'Inbox', href: '#inbox', icon: trayIcon, badge: 12 },
				{
					label: 'Projects',
					icon: folderIcon,
					defaultOpen: true,
					items: [
						{ label: 'Web app', href: '#web-app', isActive: true },
						{ label: 'Mobile app', href: '#mobile-app' },
						{ label: 'Design system', href: '#design-system' }
					],
					action: { label: 'Project actions', icon: dotsThreeIcon, menu: projectMenu }
				},
				{ label: 'Analytics', href: '#analytics', icon: chartBarIcon }
			]
		}
	];

	const visibleGroups = $derived(query.trim() ? filterGroups(items, query.trim()) : items);
	const search = $derived({
		placeholder: 'Search workspace',
		value: query,
		oninput: (event: Event & { currentTarget: HTMLInputElement }) => {
			query = event.currentTarget.value;
		}
	});

	function filterGroups(groupsToFilter: SidebarGroup[], value: string): SidebarGroup[] {
		const normalized = value.toLowerCase();

		return groupsToFilter
			.map((group) => ({
				...group,
				items: group.items ? filterItems(group.items, normalized) : group.items
			}))
			.filter((group) => group.items?.length || group.label?.toLowerCase().includes(normalized));
	}

	function filterItems(items: SidebarMenuEntry[], normalized: string): SidebarMenuEntry[] {
		return items.flatMap((item) => {
			const children = item.items?.filter((child) =>
				child.label.toLowerCase().includes(normalized)
			);
			const matches = item.label.toLowerCase().includes(normalized);

			if (matches) return [item];
			if (children?.length) return [{ ...item, items: children, defaultOpen: true }];
			return [];
		});
	}
</script>

<div
	class="h-[520px] w-full overflow-hidden rounded-lg border border-neutral-muted bg-neutral-muted"
>
	<Sidebar
		bind:displayState
		bind:width
		items={visibleGroups}
		{search}
		collapsible="icon"
		{variant}
		{size}
		{density}
		frame="contained"
		rail="thumb"
		widthIcon="3.5rem"
		resizable={{
			minWidth: '12rem',
			maxWidth: '24rem'
		}}
		headerButton={{
			icon: commandIcon,
			title: 'Acme Studio',
			subtitle: 'Operations',
			menu: accountMenu,
			menuShowLabel: true
		}}
		footerButton={{
			avatar: { fallback: 'AR' },
			title: 'Arnaud',
			subtitle: 'arnaud@example.com',
			menu: accountMenu,
			menuShowLabel: true
		}}
	>
		{#snippet children()}
			<div class="grid h-full min-w-0 place-items-center bg-surface p-8">
				<div class="grid w-full max-w-2xl gap-3">
					<Skeleton color="primary" class="h-3 w-11/12 rounded-full" />
					<Skeleton class="h-3 w-8/12 rounded-full" />
					<Skeleton class="h-3 w-full rounded-full" />
					<Skeleton color="primary" class="h-3 w-7/12 rounded-full" />
				</div>
			</div>
		{/snippet}
	</Sidebar>
</div>
