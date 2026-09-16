<script lang="ts">
	import type { FileTreeDirectoryHandle, FileTreeRowDecorationRenderer } from '@pierre/trees';
	import Tree from '$lib/components/Tree/Tree.svelte';
	import TreeContextMenuSurface from '$lib/components/Tree/TreeContextMenuSurface.svelte';
	import type { TreeContextMenuSnippetData } from '$lib/components/Tree/TreeSnippetRenderer.js';
	import type { MenuItem } from '$lib/components/Menu/menu.props.js';
	import { checkIcon } from '$lib/components/Icons/check.js';
	import { copyIcon } from '$lib/components/Icons/copy.js';
	import { folderOpenIcon } from '$lib/components/Icons/folderOpen.js';
	import { magnifyingGlassIcon } from '$lib/components/Icons/magnifyingGlass.js';
	import { gitStatus, workspaceTreePaths } from '../tree-demo-data.js';

	let lastAction = $state('Open a row menu with the action button or right click.');

	const renderRowDecoration: FileTreeRowDecorationRenderer = ({ item }) => {
		if (item.path.endsWith('Tree.svelte')) {
			return { text: 'entry', title: 'Component entry point' };
		}

		if (item.path.endsWith('.spec.ts')) {
			return { text: 'test', title: 'Test file' };
		}

		return null;
	};

	function getContextMenuItems(data: TreeContextMenuSnippetData): MenuItem[] {
		const items: MenuItem[] = [
			{
				type: 'option',
				title: `Focus ${data.name}`,
				prefix: magnifyingGlassIcon,
				onclick: () => {
					data.itemHandle?.focus();
					lastAction = `Focused ${data.path}.`;
				}
			},
			{
				type: 'option',
				title: data.isSelected ? 'Deselect' : 'Select',
				prefix: checkIcon,
				onclick: () => {
					data.itemHandle?.toggleSelect();
					lastAction = `${data.isSelected ? 'Deselected' : 'Selected'} ${data.path}.`;
				}
			},
			{
				type: 'option',
				title: 'Copy path',
				prefix: copyIcon,
				onclick: () => {
					lastAction = `Copied ${data.path}.`;
				}
			}
		];

		if (data.kind === 'directory') {
			items.push({ type: 'separator' });
			items.push({
				type: 'option',
				title: data.isExpanded ? 'Collapse folder' : 'Expand folder',
				prefix: folderOpenIcon,
				onclick: () => {
					toggleDirectory(data);
					lastAction = `${data.isExpanded ? 'Collapsed' : 'Expanded'} ${data.path}.`;
				}
			});
		}

		return items;
	}

	function toggleDirectory(data: TreeContextMenuSnippetData): void {
		const itemHandle = data.itemHandle;
		if (!isDirectoryHandle(itemHandle)) return;
		itemHandle.toggle();
	}

	function isDirectoryHandle(
		itemHandle: TreeContextMenuSnippetData['itemHandle']
	): itemHandle is FileTreeDirectoryHandle {
		return itemHandle?.isDirectory() === true;
	}
</script>

<div class="grid w-full max-w-2xl gap-3">
	<div class="border-neutral-muted bg-neutral-muted rounded-lg border px-3 py-2 text-sm">
		{lastAction}
	</div>
	<Tree
		id="docs-tree-composition"
		paths={workspaceTreePaths}
		height={340}
		initialExpansion="open"
		{gitStatus}
		{renderRowDecoration}
		composition={{
			contextMenu: {
				enabled: true,
				triggerMode: 'both',
				buttonVisibility: 'always'
			}
		}}
	>
		{#snippet header()}
			<div
				class="border-neutral-muted bg-neutral-muted text-neutral/70 flex items-center justify-between border-b px-3 py-2 text-xs"
			>
				<span>Workspace</span>
				<span>{workspaceTreePaths.length} paths</span>
			</div>
		{/snippet}

		{#snippet contextMenu(data)}
			<TreeContextMenuSurface {data} items={getContextMenuItems(data)} />
		{/snippet}
	</Tree>
</div>
