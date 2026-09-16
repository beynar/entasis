<script lang="ts">
	import { AppShell, type AppShellSidebarProps } from '$lib/components/AppShell/index.js';
	import { Skeleton } from '$lib/components/Skeleton/index.js';
	import { chartBarIcon } from '$lib/components/Icons/chartBar.js';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { trayIcon } from '$lib/components/Icons/tray.js';

	let open = $state(true);

	const sidebar = $derived<AppShellSidebarProps>({
		open,
		onOpenChange: (nextOpen) => {
			open = nextOpen;
		},
		collapsible: 'icon',
		rail: true,
		width: '16rem',
		widthIcon: '3.5rem',
		headerButton: {
			icon: commandIcon,
			title: 'Acme Studio',
			subtitle: 'Operations'
		},
		items: [
			{
				label: 'Workspace',
				items: [
					{ label: 'Overview', href: '#overview', icon: houseIcon, isActive: true },
					{ label: 'Inbox', href: '#inbox', icon: trayIcon, badge: 12 },
					{ label: 'Projects', href: '#projects', icon: folderIcon },
					{ label: 'Analytics', href: '#analytics', icon: chartBarIcon },
					{ label: 'Settings', href: '#settings', icon: gearIcon }
				]
			}
		],
		footerButton: {
			avatar: { fallback: 'AR' },
			title: 'Arnaud',
			subtitle: 'arnaud@example.com',
			openStyle: 'muted'
		}
	});
</script>

<div class="h-window bg-neutral-muted min-h-[420px] w-full overflow-hidden">
	<AppShell
		{sidebar}
		variant="inset"
		title="Responsive shell"
		subtitle="Breakpoint-aware workspace navigation."
		contentPadding="normal"
		contentWidth="wide"
	>
		<div class="grid min-h-full place-items-center p-4">
			<div class="grid w-full max-w-3xl gap-3">
				<Skeleton color="primary" class="h-3 w-11/12 rounded-full" />
				<Skeleton class="h-3 w-8/12 rounded-full" />
				<Skeleton class="h-3 w-full rounded-full" />
				<Skeleton color="primary" class="h-3 w-7/12 rounded-full" />
			</div>
		</div>
	</AppShell>
</div>
