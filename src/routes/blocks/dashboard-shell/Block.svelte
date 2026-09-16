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
	class="border-neutral-muted min-h-screen overflow-hidden rounded-lg border"
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

	<div class="gap-xl grid">
		<section class="gap-md grid sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
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

		<div class="gap-xl grid xl:grid-cols-3">
			<section
				class="gap-lg border-neutral-muted bg-surface-raised p-xl flex flex-col rounded-lg border xl:col-span-2"
			>
				<header class="gap-md flex flex-wrap items-center justify-between">
					<div class="gap-xs flex flex-col">
						<h2 class="text-neutral text-lg font-semibold">Recent activity</h2>
						<p class="text-neutral/70 text-sm">Signals and milestones from your customers.</p>
					</div>
					<Button size="small" variant="ghost" prefix={arrowClockwiseIcon}>Refresh</Button>
				</header>
				<Timeline
					items={activity}
					variant="ghost"
					density="comfortable"
					showConnectors
					aria-label="Recent workspace activity"
				/>
			</section>

			<aside
				class="gap-lg border-neutral-muted bg-surface-raised p-xl flex flex-col rounded-lg border"
			>
				<header class="gap-xs flex flex-col">
					<h2 class="text-neutral text-lg font-semibold">Today’s focus</h2>
					<p class="text-neutral/70 text-sm">Three accounts need attention.</p>
				</header>
				<ul class="gap-md flex flex-col">
					<li class="gap-md bg-warning-muted p-md flex items-start rounded-md">
						{@render receiptIcon({ class: 'size-5 shrink-0 text-warning-muted-readable' })}
						<div class="gap-xs flex min-w-0 flex-col">
							<span class="text-neutral text-sm font-medium">Review overdue invoices</span>
							<span class="text-neutral/70 text-sm">4 customers · $8,240</span>
						</div>
					</li>
					<li class="gap-md bg-primary-muted p-md flex items-start rounded-md">
						{@render usersIcon({ class: 'size-5 shrink-0 text-primary-muted-readable' })}
						<div class="gap-xs flex min-w-0 flex-col">
							<span class="text-neutral text-sm font-medium">Follow up with trials</span>
							<span class="text-neutral/70 text-sm">9 trials end this week</span>
						</div>
					</li>
					<li class="gap-md bg-info-muted p-md flex items-start rounded-md">
						{@render chartBarIcon({ class: 'size-5 shrink-0 text-info-muted-readable' })}
						<div class="gap-xs flex min-w-0 flex-col">
							<span class="text-neutral text-sm font-medium">Share the weekly report</span>
							<span class="text-neutral/70 text-sm">Ready for stakeholder review</span>
						</div>
					</li>
				</ul>
				<Button fullWidth color="primary">Open workspace</Button>
			</aside>
		</div>
	</div>
</AppShell>
