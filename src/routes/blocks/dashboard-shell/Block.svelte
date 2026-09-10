<script lang="ts">
	import { AppShell, type AppShellSidebarProps } from 'svelai/app-shell';
	import { Button } from 'svelai/button';
	import { Stat } from 'svelai/stat';
	import { Timeline, type TimelineItem } from 'svelai/timeline';
	import { arrowClockwiseIcon } from 'svelai/icons/arrowClockwise';
	import { bellIcon } from 'svelai/icons/bell';
	import { chartBarIcon } from 'svelai/icons/chartBar';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
	import { commandIcon } from 'svelai/icons/command';
	import { downloadSimpleIcon } from 'svelai/icons/downloadSimple';
	import { gearIcon } from 'svelai/icons/gear';
	import { houseIcon } from 'svelai/icons/house';
	import { lightningIcon } from 'svelai/icons/lightning';
	import { receiptIcon } from 'svelai/icons/receipt';
	import { sidebarIcon } from 'svelai/icons/sidebar';
	import { signOutIcon } from 'svelai/icons/signOut';
	import { trendUpIcon } from 'svelai/icons/trendUp';
	import { trayIcon } from 'svelai/icons/tray';
	import { usersIcon } from 'svelai/icons/users';

	const sidebar: AppShellSidebarProps = {
		collapsible: 'icon',
		rail: true,
		items: [
			{
				label: 'Workspace',
				items: [
					{ label: 'Overview', href: '#overview', icon: houseIcon, isActive: true },
					{ label: 'Analytics', href: '#analytics', icon: chartBarIcon },
					{ label: 'Customers', href: '#customers', icon: usersIcon, badge: 24 },
					{ label: 'Inbox', href: '#inbox', icon: trayIcon, badge: 7 }
				]
			},
			{
				label: 'Manage',
				separator: true,
				items: [
					{ label: 'Automations', href: '#automations', icon: lightningIcon },
					{ label: 'Settings', href: '#settings', icon: gearIcon }
				]
			}
		],
		headerButton: {
			icon: commandIcon,
			title: 'Northstar',
			subtitle: 'Growth workspace'
		},
		footerButton: {
			avatar: { fallback: 'AR', alt: 'Arnaud Robert' },
			title: 'Arnaud Robert',
			subtitle: 'Workspace admin',
			menu: [
				{
					type: 'option',
					children: 'Sign out',
					prefix: signOutIcon,
					onclick: () => undefined
				}
			]
		}
	};

	const activity = [
		{
			id: 'renewal',
			title: 'Enterprise renewal completed',
			description: 'Northwind expanded to the annual Scale plan.',
			date: '12 min ago',
			datetime: '2026-09-07T19:48:00Z',
			icon: receiptIcon,
			color: 'success'
		},
		{
			id: 'milestone',
			title: 'Activation milestone reached',
			description: 'Acme Studio invited its tenth team member.',
			date: '34 min ago',
			datetime: '2026-09-07T19:26:00Z',
			icon: checkCircleIcon,
			color: 'primary'
		},
		{
			id: 'signal',
			title: 'Expansion signal detected',
			description: 'Globex usage grew 31% over the last seven days.',
			date: '1 hr ago',
			datetime: '2026-09-07T19:00:00Z',
			icon: trendUpIcon,
			color: 'info'
		}
	] satisfies TimelineItem[];
</script>

<AppShell
	class="min-h-screen overflow-hidden rounded-lg border border-neutral-muted"
	variant="inset"
	{sidebar}
	eyebrow="Monday, September 7"
	title="Good evening, Arnaud"
	subtitle="Here is what changed across your workspace today."
	contentPadding="normal"
	contentWidth="wide"
>
	{#snippet headerActions({ sidebar })}
		<Button
			label="Toggle navigation"
			prefix={sidebarIcon}
			squared
			variant="ghost"
			{...{ onclick: sidebar.toggle }}
		/>
		<Button label="View notifications" prefix={bellIcon} squared variant="outline" />
		<Button prefix={downloadSimpleIcon} variant="outline">Export</Button>
	{/snippet}

	<div class="grid gap-xl">
		<section class="grid gap-md sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
			<Stat
				label="Monthly revenue"
				value="$84.2k"
				trend="+12.5%"
				trendDirection="up"
				description="Compared with last month"
				indicatorColor="success"
				indicatorVariant="icon"
			>
				{#snippet indicator()}{@render trendUpIcon()}{/snippet}
			</Stat>
			<Stat
				label="Active customers"
				value="2,846"
				trend="+184"
				trendDirection="up"
				description="Across all plans"
				indicatorColor="primary"
				indicatorVariant="icon"
			>
				{#snippet indicator()}{@render usersIcon()}{/snippet}
			</Stat>
			<Stat
				label="Activation rate"
				value="68.4%"
				trend="+4.2%"
				trendDirection="up"
				description="Trailing 30 days"
				indicatorColor="info"
				indicatorVariant="icon"
			>
				{#snippet indicator()}{@render lightningIcon()}{/snippet}
			</Stat>
			<Stat
				label="Open invoices"
				value="16"
				trend="$12.8k"
				description="4 due this week"
				indicatorColor="warning"
				indicatorVariant="icon"
			>
				{#snippet indicator()}{@render receiptIcon()}{/snippet}
			</Stat>
		</section>

		<div class="grid gap-xl xl:grid-cols-3">
			<section
				class="flex flex-col gap-lg rounded-lg border border-neutral-muted bg-surface-raised p-xl xl:col-span-2"
			>
				<header class="flex flex-wrap items-center justify-between gap-md">
					<div class="flex flex-col gap-xs">
						<h2 class="text-lg font-semibold text-neutral">Recent activity</h2>
						<p class="text-sm text-neutral/60">Signals and milestones from your customers.</p>
					</div>
					<Button size="small" variant="ghost" prefix={arrowClockwiseIcon}>Refresh</Button>
				</header>
				<Timeline
					items={activity}
					variant="ghost"
					density="large"
					showConnectors
					aria-label="Recent workspace activity"
				/>
			</section>

			<aside
				class="flex flex-col gap-lg rounded-lg border border-neutral-muted bg-surface-raised p-xl"
			>
				<header class="flex flex-col gap-xs">
					<h2 class="text-lg font-semibold text-neutral">Today’s focus</h2>
					<p class="text-sm text-neutral/60">Three accounts need attention.</p>
				</header>
				<ul class="flex flex-col gap-md">
					<li class="flex items-start gap-md rounded-md bg-warning-muted p-md">
						{@render receiptIcon({ class: 'size-5 shrink-0 text-warning-muted-readable' })}
						<div class="flex min-w-0 flex-col gap-xs">
							<span class="text-sm font-medium text-neutral">Review overdue invoices</span>
							<span class="text-sm text-neutral/60">4 customers · $8,240</span>
						</div>
					</li>
					<li class="flex items-start gap-md rounded-md bg-primary-muted p-md">
						{@render usersIcon({ class: 'size-5 shrink-0 text-primary-muted-readable' })}
						<div class="flex min-w-0 flex-col gap-xs">
							<span class="text-sm font-medium text-neutral">Follow up with trials</span>
							<span class="text-sm text-neutral/60">9 trials end this week</span>
						</div>
					</li>
					<li class="flex items-start gap-md rounded-md bg-info-muted p-md">
						{@render chartBarIcon({ class: 'size-5 shrink-0 text-info-muted-readable' })}
						<div class="flex min-w-0 flex-col gap-xs">
							<span class="text-sm font-medium text-neutral">Share the weekly report</span>
							<span class="text-sm text-neutral/60">Ready for stakeholder review</span>
						</div>
					</li>
				</ul>
				<Button fullWidth color="primary">Open workspace</Button>
			</aside>
		</div>
	</div>
</AppShell>
