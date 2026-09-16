<script lang="ts">
	import { Sidebar, type SidebarGroup } from '$lib/components/Sidebar/index.js';
	import { Skeleton } from '$lib/components/Skeleton/index.js';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { fileIcon } from '$lib/components/Icons/file.js';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import { plusIcon } from '$lib/components/Icons/plus.js';

	let open = $state(true);

	const items: SidebarGroup[] = [
		{
			label: 'Files',
			action: {
				label: 'Add file',
				icon: plusIcon,
				menu: [
					{ type: 'option', title: 'New file', prefix: fileIcon },
					{ type: 'option', title: 'New folder', prefix: folderIcon }
				]
			},
			tree: [
				{
					label: 'src',
					icon: folderIcon,
					defaultOpen: true,
					children: [
						{
							label: 'lib',
							icon: folderIcon,
							defaultOpen: true,
							children: [
								{
									label: 'components',
									icon: folderIcon,
									defaultOpen: true,
									children: [
										{ label: 'Sidebar.svelte', href: '#sidebar', icon: fileIcon, isActive: true },
										{ label: 'SidebarGroup.svelte', href: '#group', icon: fileIcon }
									]
								}
							]
						},
						{ label: 'routes', href: '#routes', icon: folderIcon }
					]
				},
				{ label: 'package.json', href: '#package', icon: fileIcon }
			]
		}
	];
</script>

<div
	class="border-neutral-muted bg-neutral-muted h-[460px] w-full overflow-hidden rounded-lg border"
>
	<Sidebar
		bind:open
		{items}
		collapsible="offcanvas"
		edgeReveal
		variant="admin"
		frame="contained"
		width="18rem"
		headerButton={{
			icon: commandIcon,
			title: 'Repository',
			subtitle: 'svelai'
		}}
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
