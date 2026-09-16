<script lang="ts">
	import {
		Sidebar,
		type SidebarActivityBar,
		type SidebarDisplayState,
		type SidebarGroup
	} from '$lib/components/Sidebar/index.js';
	import { Skeleton } from '$lib/components/Skeleton/index.js';
	import { bellIcon } from '$lib/components/Icons/bell.js';
	import { chartPieIcon } from '$lib/components/Icons/chartPie.js';
	import { databaseIcon } from '$lib/components/Icons/database.js';
	import { filesIcon } from '$lib/components/Icons/files.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { lockIcon } from '$lib/components/Icons/lock.js';
	import { magnifyingGlassIcon } from '$lib/components/Icons/magnifyingGlass.js';
	import { robotIcon } from '$lib/components/Icons/robot.js';
	import { userIcon } from '$lib/components/Icons/user.js';

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

	const items: SidebarGroup[] = [
		{
			label: 'Automations',
			items: [
				{ label: 'Agents', href: '#agents', icon: robotIcon, isActive: true },
				{ label: 'Insights', href: '#insights', icon: chartPieIcon, badge: 4 },
				{ label: 'Data', href: '#data', icon: databaseIcon },
				{ label: 'Security', href: '#security', icon: lockIcon },
				{ label: 'Settings', href: '#settings', icon: gearIcon }
			]
		}
	];
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
