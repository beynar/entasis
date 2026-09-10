<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Sidebar } from 'svelai/sidebar';
	import { Stat } from 'svelai/stat';
	import { houseIcon } from 'svelai/icons/house';
	import { usersIcon } from 'svelai/icons/users';
	import { folderIcon } from 'svelai/icons/folder';
	import { sidebarIcon } from 'svelai/icons/sidebar';
	import { commandIcon } from 'svelai/icons/command';
	let workspace = $state('Northstar');
	let page = $state('Overview');
</script>

<Sidebar
	frame="contained"
	class="min-h-screen"
	variant="inset"
	collapsible="icon"
	headerButton={{
		title: workspace,
		subtitle: 'Switch workspace',
		icon: commandIcon,
		menu: ['Northstar', 'Personal', 'Studio'].map((name) => ({
			type: 'option',
			children: name,
			onclick: () => (workspace = name)
		}))
	}}
	items={[
		{
			label: 'Workspace',
			items: [
				{
					label: 'Overview',
					icon: houseIcon,
					isActive: page === 'Overview',
					onclick: () => (page = 'Overview')
				},
				{
					label: 'Projects',
					icon: folderIcon,
					items: [
						{ label: 'Website', onclick: () => (page = 'Website') },
						{ label: 'Design system', onclick: () => (page = 'Design system') }
					]
				},
				{
					label: 'Members',
					icon: usersIcon,
					isActive: page === 'Members',
					onclick: () => (page = 'Members')
				}
			]
		}
	]}
	footerButton={{ title: 'Alex Morgan', subtitle: 'Workspace admin', avatar: { fallback: 'AM' } }}
	>{#snippet children(sidebar)}<Stack as="main" gap="lg" class="min-w-0 p-md sm:p-xl">
			<Button class="w-fit" variant="outline" prefix={sidebarIcon} onclick={sidebar.toggle}
				>Navigation</Button
			>
			<p class="text-sm text-neutral/60">{workspace}</p>
			<h2 class="text-3xl font-semibold">{page}</h2>
			<Card
				title={`${page} in ${workspace}`}
				description="Use the workspace menu and navigation to explore this contained sidebar."
				><Grid columns={{ minWidth: 220, max: 2 }} gap="md">
					<Stat
						label="Open projects"
						value={workspace === 'Personal' ? '3' : '12'}
						variant="soft"
					/><Stat label="Members" value={workspace === 'Personal' ? '1' : '8'} variant="soft" />
				</Grid></Card
			>
		</Stack>{/snippet}</Sidebar
>
