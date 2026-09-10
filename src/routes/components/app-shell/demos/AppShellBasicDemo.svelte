<script lang="ts">
	import { AppShell, type AppShellSidebarProps } from '$lib/components/AppShell/index.js';
	import type {
		SidebarDensity,
		SidebarDisplayState,
		SidebarGroup,
		SidebarSize,
		SidebarVariant
	} from '$lib/components/Sidebar/index.js';
	import { chartBarIcon } from '$lib/components/Icons/chartBar.js';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { sidebarIcon } from '$lib/components/Icons/sidebar.js';
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

	let sidebarDisplayState = $state<SidebarDisplayState>('expanded');
	let sidebarWidth = $state('17rem');
	const open = $derived(sidebarDisplayState === 'expanded');

	const items: SidebarGroup[] = [
		{
			label: 'Workspace',
			items: [
				{ label: 'Overview', href: '#overview', icon: houseIcon, isActive: true },
				{ label: 'Inbox', href: '#inbox', icon: trayIcon, badge: 8 },
				{ label: 'Analytics', href: '#analytics', icon: chartBarIcon },
				{ label: 'Settings', href: '#settings', icon: gearIcon }
			]
		}
	];

	const sidebar = $derived<AppShellSidebarProps>({
		displayState: sidebarDisplayState,
		onDisplayStateChange: (nextDisplayState) => {
			sidebarDisplayState = nextDisplayState;
		},
		items,
		size,
		density,
		collapsible: 'icon',
		rail: true,
		width: sidebarWidth,
		widthIcon: '3.5rem',
		resizable: {
			minWidth: '12rem',
			maxWidth: '24rem',
			onWidthChange: (nextWidth) => {
				sidebarWidth = nextWidth;
			}
		},
		headerButton: {
			icon: commandIcon,
			title: 'Acme',
			subtitle: 'Operations'
		}
	});
</script>

<div class="h-[520px] w-full">
	<AppShell
		{sidebar}
		{variant}
		title="Dashboard"
		subtitle="Sidebar navigation with sticky page chrome"
		theme={{
			root: {
				base: 'h-full min-h-full overflow-auto rounded-lg border border-neutral-muted'
			}
		}}
	>
		{#snippet headerActions({ sidebar })}
			<button
				type="button"
				class="state-layer border-neutral-muted inline-flex size-8 items-center justify-center rounded-md border text-neutral"
				aria-label="Toggle sidebar"
				onclick={sidebar.toggle}
			>
				{@render sidebarIcon({ class: 'size-4' })}
			</button>
		{/snippet}

		{#snippet footer()}
			<span>Sidebar is {open ? 'expanded' : 'collapsed'}</span>
			<span class="font-medium text-primary">Responsive drawer included</span>
		{/snippet}

		{#snippet children()}
			<div class="grid gap-4 p-4 md:grid-cols-3">
				{#each ['Pipeline', 'Revenue', 'Support'] as metric}
					<section class="rounded-lg border border-neutral-muted bg-surface-raised p-4">
						<p class="text-sm font-medium text-neutral">{metric}</p>
						<p class="mt-2 text-2xl font-semibold text-primary">Healthy</p>
					</section>
				{/each}
			</div>
		{/snippet}
	</AppShell>
</div>
