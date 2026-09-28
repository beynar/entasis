<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import { SegmentedControl } from '$lib/components/SegmentedControl/index.js';
	import {
		Sidebar,
		type SidebarActivityBar,
		type SidebarVariant,
		type SidebarView
	} from '$lib/components/Sidebar/index.js';
	import { Skeleton } from '$lib/components/Skeleton/index.js';
	import { chartBarIcon } from '$lib/components/Icons/chartBar.js';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { creditCardIcon } from '$lib/components/Icons/creditCard.js';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { keyIcon } from '$lib/components/Icons/key.js';
	import { lightningIcon } from '$lib/components/Icons/lightning.js';
	import { plugIcon } from '$lib/components/Icons/plug.js';
	import { receiptIcon } from '$lib/components/Icons/receipt.js';
	import { shieldIcon } from '$lib/components/Icons/shield.js';
	import { userPlusIcon } from '$lib/components/Icons/userPlus.js';
	import { usersIcon } from '$lib/components/Icons/users.js';

	const variants = (['admin', 'floating', 'inset', 'split', 'framed'] as const).map((value) => ({
		value,
		label: value
	})) satisfies { value: SidebarVariant; label: string }[];
	let variant = $state<SidebarVariant>('inset');
	let view = $state('workspace');

	// Views are addressed by key. `parent` nests a view: it opens with a back row and slides in
	// from the inline end. Views without one are sections, and switching sections crossfades.
	const views: Record<string, SidebarView> = {
		workspace: {
			label: 'Workspace',
			items: [
				{
					label: 'Workspace',
					items: [
						{ label: 'Overview', href: '#overview', icon: houseIcon, isActive: true },
						{ label: 'Projects', href: '#projects', icon: folderIcon },
						{ label: 'Reports', href: '#reports', icon: chartBarIcon }
					]
				}
			]
		},
		settings: {
			label: 'Settings',
			// A header prop set here replaces the Sidebar's own, and the views nested under Settings
			// inherit it: going deeper leaves the header still, switching sections slides it.
			search: { placeholder: 'Search settings' },
			items: [
				{
					label: 'Settings',
					items: [
						{ label: 'General', href: '#general', icon: gearIcon, isActive: true },
						{ label: 'Members', icon: usersIcon, view: 'members' },
						{ label: 'Billing', icon: creditCardIcon, view: 'billing' },
						{ label: 'Integrations', href: '#integrations', icon: plugIcon }
					]
				}
			]
		},
		members: {
			label: 'Members',
			parent: 'settings',
			items: [
				{
					label: 'Members',
					items: [
						{ label: 'People', href: '#people', icon: usersIcon, isActive: true },
						{ label: 'Invitations', href: '#invitations', icon: userPlusIcon, badge: 2 },
						{ label: 'Roles', icon: shieldIcon, view: 'roles' }
					]
				}
			]
		},
		roles: {
			label: 'Roles',
			parent: 'members',
			items: [
				{
					label: 'Roles',
					items: [
						{ label: 'Owner', href: '#owner', icon: keyIcon },
						{ label: 'Editor', href: '#editor', icon: shieldIcon },
						{ label: 'Viewer', href: '#viewer', icon: usersIcon }
					]
				}
			]
		},
		billing: {
			label: 'Billing',
			parent: 'settings',
			items: [
				{
					label: 'Billing',
					items: [
						{ label: 'Plan', href: '#plan', icon: lightningIcon, isActive: true },
						{ label: 'Invoices', href: '#invoices', icon: receiptIcon },
						{ label: 'Payment methods', href: '#payment', icon: creditCardIcon }
					]
				}
			],
			// Only Billing swaps the footer, so only its footer slides.
			footerButton: {
				icon: lightningIcon,
				title: 'Upgrade to Pro',
				subtitle: '14 days left in trial'
			}
		}
	};

	// The rail marks the section the current view belongs to: the top of its parent chain.
	const section = $derived.by(() => {
		let key = view;
		while (views[key]?.parent) key = views[key].parent!;
		return key;
	});

	const activityBar: SidebarActivityBar = $derived({
		label: 'App sections',
		items: [
			{ id: 'workspace', label: 'Workspace', icon: houseIcon, isActive: section === 'workspace' }
		],
		footerItems: [
			{ id: 'settings', label: 'Settings', icon: gearIcon, isActive: section === 'settings' }
		],
		onSelect: ({ item }) => {
			if (item.id) view = item.id;
		}
	});
</script>

<div class="flex h-[520px] w-full flex-col gap-3">
	<div class="flex w-full flex-wrap items-center justify-between gap-2">
		<p class="text-neutral/70 text-sm">
			View: <span class="text-neutral font-medium">{view}</span>
		</p>
		<SegmentedControl items={variants} bind:value={variant} size="small" label="Sidebar variant" />
	</div>

	<div
		class="border-neutral-muted bg-neutral-muted min-h-0 flex-1 overflow-hidden rounded-lg border"
	>
		<Sidebar
			{views}
			bind:view
			{activityBar}
			{variant}
			collapsible="icon"
			frame="contained"
			headerButton={{ icon: commandIcon, title: 'Acme Studio', subtitle: 'Operations' }}
			footerButton={{ avatar: { fallback: 'AR' }, title: 'Arnaud', subtitle: 'arnaud@example.com' }}
		>
			{#snippet children(api)}
				<div class="bg-surface grid h-full min-w-0 place-items-center p-8">
					<div class="grid w-full max-w-2xl gap-3">
						<!-- On mobile the panel is a drawer: open it, then swipe a nested view back. -->
						<Button class="md:hidden" variant="outline" onclick={api.toggle}>Open navigation</Button
						>
						<Skeleton color="primary" class="h-3 w-11/12 rounded-full" />
						<Skeleton class="h-3 w-8/12 rounded-full" />
						<Skeleton class="h-3 w-full rounded-full" />
						<Skeleton color="primary" class="h-3 w-7/12 rounded-full" />
					</div>
				</div>
			{/snippet}
		</Sidebar>
	</div>
</div>
