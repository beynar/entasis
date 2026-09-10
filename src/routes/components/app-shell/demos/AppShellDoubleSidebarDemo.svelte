<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import { PageShell } from '$lib/components/PageShell/index.js';
	import { Sidebar, type SidebarGroup } from '$lib/components/Sidebar/index.js';
	import { articleIcon } from '$lib/components/Icons/article.js';
	import { chartBarIcon } from '$lib/components/Icons/chartBar.js';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { sidebarSimpleIcon } from '$lib/components/Icons/sidebarSimple.js';
	import { trayIcon } from '$lib/components/Icons/tray.js';
	import { usersIcon } from '$lib/components/Icons/users.js';

	let leftOpen = $state(true);
	let rightOpen = $state(true);

	const leftItems: SidebarGroup[] = [
		{
			label: 'Workspace',
			items: [
				{ label: 'Overview', href: '#overview', icon: houseIcon, isActive: true },
				{ label: 'Reports', href: '#reports', icon: chartBarIcon },
				{ label: 'Inbox', href: '#inbox', icon: trayIcon, badge: 6 },
				{ label: 'Settings', href: '#settings', icon: gearIcon }
			]
		}
	];

	const rightItems: SidebarGroup[] = [
		{
			label: 'Inspector',
			items: [
				{ label: 'Activity', href: '#activity', icon: articleIcon, isActive: true },
				{ label: 'Accounts', href: '#accounts', icon: usersIcon, badge: 24 },
				{ label: 'Signals', href: '#signals', icon: chartBarIcon }
			]
		}
	];
</script>

<div
	class="h-[560px] w-full overflow-auto rounded-lg border border-neutral-muted bg-neutral-muted"
>
	<Sidebar
		open={leftOpen}
		onOpenChange={(nextOpen: boolean) => (leftOpen = nextOpen)}
		items={leftItems}
		collapsible="icon"
		variant="admin"
		frame="contained"
		width="14rem"
		widthIcon="3.5rem"
		edgeReveal={false}
		keyboardShortcut={false}
		headerButton={{
			icon: commandIcon,
			title: 'Acme',
			subtitle: 'Workspace'
		}}
	>
		{#snippet children()}
			<Sidebar
				open={rightOpen}
				onOpenChange={(nextOpen: boolean) => (rightOpen = nextOpen)}
				items={rightItems}
				side="right"
				collapsible="icon"
				variant="admin"
				frame="contained"
				width="16rem"
				widthIcon="3.5rem"
				edgeReveal={false}
				keyboardShortcut={false}
				headerButton={{
					icon: articleIcon,
					title: 'Inspector',
					subtitle: 'Context'
				}}
			>
				{#snippet children()}
					<PageShell
						eyebrow="Double sidebar"
						title="Customer workspace"
						subtitle="Primary navigation on the left, contextual navigation on the right."
						contentPadding="normal"
						contentWidth="full"
					>
						{#snippet headerActions()}
							<Button
								size="small"
								variant="outline"
								prefix={sidebarSimpleIcon}
								label="Toggle left sidebar"
								onclick={() => (leftOpen = !leftOpen)}
							>
								Left
							</Button>
							<Button
								size="small"
								variant="outline"
								prefix={sidebarSimpleIcon}
								label="Toggle right sidebar"
								onclick={() => (rightOpen = !rightOpen)}
							>
								Right
							</Button>
						{/snippet}

						{#snippet footer()}
							<span>
								Left sidebar is {leftOpen ? 'expanded' : 'collapsed'}; right sidebar is
								{rightOpen ? 'expanded' : 'collapsed'}.
							</span>
						{/snippet}

						{#snippet children()}
							<div class="grid gap-4 lg:grid-cols-3">
								{#each ['Pipeline', 'Expansion', 'Risk'] as metric, index}
									<section
										class="rounded-lg border border-neutral-muted bg-surface-raised p-4"
									>
										<p class="text-sm font-medium text-neutral/70">{metric}</p>
										<p class="mt-3 text-2xl font-semibold text-neutral">{76 + index * 8}%</p>
									</section>
								{/each}
							</div>

							<section
								class="mt-4 rounded-lg border border-neutral-muted bg-surface-raised p-4"
							>
								<p class="text-sm font-medium text-neutral">Manual shell composition</p>
								<p class="mt-2 text-sm leading-6 text-neutral/70">
									This keeps AppShell simple while still allowing advanced layouts. Promote this to
									a first-class AppShell API if both sidebars need coordinated collapse and mobile
									behavior.
								</p>
							</section>
						{/snippet}
					</PageShell>
				{/snippet}
			</Sidebar>
		{/snippet}
	</Sidebar>
</div>
