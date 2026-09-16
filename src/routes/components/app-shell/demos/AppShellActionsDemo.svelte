<script lang="ts">
	import {
		AppShell,
		type AppShellSidebarProps,
		type AppShellActions
	} from '$lib/components/AppShell/index.js';
	import type { BreadcrumbItem } from '$lib/components/Breadcrumbs/index.js';
	import type { SidebarGroup } from '$lib/components/Sidebar/index.js';
	import { arrowClockwiseIcon } from '$lib/components/Icons/arrowClockwise.js';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { downloadSimpleIcon } from '$lib/components/Icons/downloadSimple.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { plusIcon } from '$lib/components/Icons/plus.js';
	import { trayIcon } from '$lib/components/Icons/tray.js';

	const items: SidebarGroup[] = [
		{
			label: 'Workspace',
			items: [
				{ label: 'Home', href: '#home', icon: houseIcon, isActive: true },
				{ label: 'Inbox', href: '#inbox', icon: trayIcon, badge: 4 }
			]
		}
	];

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Workspace', href: '#workspace' },
		{ label: 'Reports', active: true }
	];

	const headerActions = [
		{ label: 'Refresh', squared: true, variant: 'outline', prefix: arrowClockwiseIcon },
		{ content: 'Export', variant: 'outline', prefix: downloadSimpleIcon },
		{ content: 'Create', color: 'primary', prefix: plusIcon }
	] satisfies AppShellActions;

	const sidebar: AppShellSidebarProps = {
		items,
		collapsible: 'icon',
		rail: true,
		width: '15rem',
		widthIcon: '3.5rem',
		headerButton: {
			icon: commandIcon,
			title: 'Acme',
			subtitle: 'Reports'
		}
	};
</script>

<div class="h-[460px] w-full">
	<AppShell
		{sidebar}
		variant="inset"
		title="Reports"
		subtitle="Array actions pass through AppShell to PageShell."
		{breadcrumbs}
		back={{ href: '#workspace' }}
		{headerActions}
		contentPadding="normal"
		contentWidth="normal"
		theme={{
			root: {
				base: 'h-full min-h-full overflow-auto rounded-lg border border-neutral-muted'
			}
		}}
	>
		<section class="border-neutral-muted bg-surface-raised rounded-lg border p-5">
			<p class="text-neutral text-sm font-medium">AppShell array actions</p>
			<p class="text-neutral/70 mt-2 text-sm">
				Use arrays for normal buttons, snippets when actions need Sidebar API access.
			</p>
		</section>
	</AppShell>
</div>
