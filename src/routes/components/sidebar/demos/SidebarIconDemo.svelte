<script lang="ts">
	import {
		Sidebar,
		type SidebarDisplayState,
		type SidebarGroup
	} from '$lib/components/Sidebar/index.js';
	import { Skeleton } from '$lib/components/Skeleton/index.js';
	import { bookOpenIcon } from '$lib/components/Icons/bookOpen.js';
	import { chartPieIcon } from '$lib/components/Icons/chartPie.js';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { databaseIcon } from '$lib/components/Icons/database.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { lightningIcon } from '$lib/components/Icons/lightning.js';
	import { lockIcon } from '$lib/components/Icons/lock.js';
	import { robotIcon } from '$lib/components/Icons/robot.js';

	let displayState = $state<SidebarDisplayState>('collapsed');
	let width = $state('16rem');
	const open = $derived(displayState === 'expanded');

	const items: SidebarGroup[] = [
		{
			items: [
				{ label: 'Automations', href: '#automations', icon: robotIcon, isActive: true },
				{ label: 'Insights', href: '#insights', icon: chartPieIcon, badge: 4 },
				{ label: 'Data', href: '#data', icon: databaseIcon },
				{ label: 'Security', href: '#security', icon: lockIcon },
				{ label: 'Settings', href: '#settings', icon: gearIcon }
			]
		}
	];
</script>

<div class="flex h-[460px] w-full flex-col gap-3">
	<div class="flex w-full justify-end">
		<button
			type="button"
			class="state-layer border-neutral-muted bg-surface text-neutral inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition"
			aria-pressed={!open}
			onclick={() => (displayState = open ? 'collapsed' : 'expanded')}
		>
			{open ? 'Collapse' : 'Expand'}
		</button>
	</div>

	<div
		class="border-neutral-muted bg-neutral-muted min-h-0 flex-1 overflow-hidden rounded-lg border"
	>
		<Sidebar
			bind:displayState
			bind:width
			{items}
			collapsible="icon"
			tooltips="always"
			variant="floating"
			frame="contained"
			widthIcon="3.5rem"
			resizable={{
				minWidth: '12rem',
				maxWidth: '22rem'
			}}
			headerButton={{
				icon: commandIcon,
				title: 'Control',
				subtitle: 'Command center',
				variant: 'brand'
			}}
			footerMenu={[
				{ label: 'Quick start', href: '#quick-start', icon: lightningIcon },
				{ label: 'Docs', href: '#docs', icon: bookOpenIcon }
			]}
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
