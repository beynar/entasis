<script lang="ts">
	import {
		Sidebar,
		type SidebarActivityBar,
		type SidebarDisplayState,
		type SidebarGroup
	} from '$lib/components/Sidebar/index.js';
	import { Skeleton } from '$lib/components/Skeleton/index.js';
	import { bellIcon } from '$lib/components/Icons/bell.js';
	import { archiveIcon } from '$lib/components/Icons/archive.js';
	import { atIcon } from '$lib/components/Icons/at.js';
	import { bookmarkIcon } from '$lib/components/Icons/bookmark.js';
	import { clockIcon } from '$lib/components/Icons/clock.js';
	import { clockCounterClockwiseIcon } from '$lib/components/Icons/clockCounterClockwise.js';
	import { filesIcon } from '$lib/components/Icons/files.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { lockIcon } from '$lib/components/Icons/lock.js';
	import { magnifyingGlassIcon } from '$lib/components/Icons/magnifyingGlass.js';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import { userIcon } from '$lib/components/Icons/user.js';
	import { usersIcon } from '$lib/components/Icons/users.js';
	import { warningIcon } from '$lib/components/Icons/warning.js';

	let section = $state('files');
	let displayState = $state<SidebarDisplayState>('collapsed');

	const activityBar: SidebarActivityBar = $derived({
		label: 'Workspace sections',
		items: [
			{ id: 'files', label: 'Files', icon: filesIcon, isActive: section === 'files' },
			{ id: 'search', label: 'Search', icon: magnifyingGlassIcon, isActive: section === 'search' },
			{
				id: 'alerts',
				label: 'Alerts',
				icon: bellIcon,
				badge: 3,
				isActive: section === 'alerts'
			}
		],
		footerItems: [
			{ id: 'account', label: 'Account', icon: userIcon, isActive: section === 'account' }
		],
		onSelect: ({ item }) => {
			if (item.id) section = item.id;
		}
	});

	// The rail only reports a selection; the panel's menu follows it. Each rail item owns the menu
	// the panel shows while it is selected.
	const menus: Record<string, SidebarGroup[]> = {
		files: [
			{
				label: 'Files',
				items: [
					{ label: 'Documents', href: '#documents', icon: folderIcon, isActive: true },
					{ label: 'Shared with me', href: '#shared', icon: usersIcon },
					{ label: 'Recent', href: '#recent', icon: clockIcon },
					{ label: 'Archive', href: '#archive', icon: archiveIcon }
				]
			}
		],
		search: [
			{
				label: 'Search',
				items: [
					{ label: 'All results', href: '#results', icon: magnifyingGlassIcon, isActive: true },
					{ label: 'Saved searches', href: '#saved', icon: bookmarkIcon },
					{ label: 'History', href: '#history', icon: clockCounterClockwiseIcon }
				]
			}
		],
		alerts: [
			{
				label: 'Alerts',
				items: [
					{ label: 'Unread', href: '#unread', icon: bellIcon, badge: 3, isActive: true },
					{ label: 'Mentions', href: '#mentions', icon: atIcon },
					{ label: 'Warnings', href: '#warnings', icon: warningIcon }
				]
			}
		],
		account: [
			{
				label: 'Account',
				items: [
					{ label: 'Profile', href: '#profile', icon: userIcon, isActive: true },
					{ label: 'Security', href: '#security', icon: lockIcon },
					{ label: 'Settings', href: '#settings', icon: gearIcon }
				]
			}
		]
	};
	const items = $derived(menus[section] ?? []);
</script>

<div class="flex h-[460px] w-full flex-col gap-3">
	<div class="flex w-full items-center justify-between">
		<p class="text-neutral/70 text-sm">
			Selected section: <span class="text-neutral font-medium">{section}</span>
		</p>
		<button
			type="button"
			class="state-layer border-neutral-muted bg-surface text-neutral inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition"
			onclick={() => (displayState = displayState === 'expanded' ? 'collapsed' : 'expanded')}
		>
			{displayState === 'expanded' ? 'Collapse panel' : 'Expand panel'}
		</button>
	</div>

	<div
		class="border-neutral-muted bg-neutral-muted min-h-0 flex-1 overflow-hidden rounded-lg border"
	>
		<Sidebar
			bind:displayState
			{items}
			{activityBar}
			collapsible="icon"
			expandOnHover
			variant="admin"
			frame="contained"
		>
			<div class="bg-surface grid h-full min-w-0 place-items-center p-8">
				<div class="grid w-full max-w-2xl gap-3">
					<Skeleton color="primary" class="h-3 w-11/12 rounded-full" />
					<Skeleton class="h-3 w-8/12 rounded-full" />
					<Skeleton class="h-3 w-full rounded-full" />
					<Skeleton color="primary" class="h-3 w-7/12 rounded-full" />
				</div>
			</div>
		</Sidebar>
	</div>
</div>
