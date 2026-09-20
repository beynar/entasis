<script lang="ts">
	import { Grid } from 'entasis/grid';
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Sidebar } from 'entasis/sidebar';
	import { Stat } from 'entasis/stat';
	import { houseIcon } from 'entasis/icons/house';
	import { usersIcon } from 'entasis/icons/users';
	import { folderIcon } from 'entasis/icons/folder';
	import { sidebarIcon } from 'entasis/icons/sidebar';
	import { commandIcon } from 'entasis/icons/command';
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
	>{#snippet children(sidebar)}<Stack as="main" gap="lg" class="p-md sm:p-xl min-w-0">
			<Button class="w-fit" variant="outline" prefix={sidebarIcon} onclick={sidebar.toggle}
				>Navigation</Button
			>
			<p class="text-neutral/70 text-sm">{workspace}</p>
			<h2 class="text-3xl font-semibold">{page}</h2>
			<Card
				title={`${page} in ${workspace}`}
				description="Use the workspace menu and navigation to explore this contained sidebar."
				><Grid columns={{ minWidth: 220, max: 2 }} gap="md">
					<Stat
						label="Open projects"
						value={workspace === 'Personal' ? '3' : '12'}
						variant="outline"
					/><Stat label="Members" value={workspace === 'Personal' ? '1' : '8'} variant="outline" />
				</Grid></Card
			>
		</Stack>{/snippet}</Sidebar
>
