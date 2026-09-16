<script lang="ts">
	import type {
		FileTree,
		FileTreeDragAndDropConfig,
		FileTreeMutationEvent,
		FileTreeRenamingConfig
	} from '@pierre/trees';
	import Button from '$lib/components/Button/Button.svelte';
	import Tree from '$lib/components/Tree/Tree.svelte';
	import { workspaceTreePaths } from '../tree-demo-data.js';

	let fileTree = $state<FileTree>();
	let lastPolicyEvent = $state('Rename .svelte files or drag files into src/lib.');
	let lastMutation = $state('Mutation events will appear here.');
	let eventFileIndex = $state(0);

	const renaming: FileTreeRenamingConfig = {
		canRename: (item) => item.path.endsWith('.svelte')
	};

	const dragAndDrop: FileTreeDragAndDropConfig = {
		canDrag: (paths) => paths.every((path) => !path.startsWith('.github/')),
		canDrop: (event) => event.target.directoryPath?.startsWith('src/lib') === true,
		onDropComplete: (event) => {
			lastPolicyEvent = `Dropped ${event.draggedPaths.length} path(s) into ${event.target.directoryPath ?? 'root'}.`;
		},
		onDropError: (error) => {
			lastPolicyEvent = error;
		}
	};

	function onRename(event: { sourcePath: string; destinationPath: string }): void {
		lastPolicyEvent = `Renamed ${event.sourcePath} to ${event.destinationPath}.`;
	}

	function onRenameError(error: string): void {
		lastPolicyEvent = error;
	}

	function onMutation(event: FileTreeMutationEvent): void {
		if (event.operation === 'batch') {
			lastMutation = `batch: ${event.events.length} event(s)`;
			return;
		}

		if (event.operation === 'move') {
			lastMutation = `move: ${event.from} -> ${event.to}`;
			return;
		}

		if (event.operation === 'reset') {
			lastMutation = `reset: ${event.pathCountBefore} -> ${event.pathCountAfter} paths`;
			return;
		}

		lastMutation = `${event.operation}: ${event.path}`;
	}

	function addEventFile(): void {
		eventFileIndex += 1;
		fileTree?.add(`src/lib/components/Tree/event-${eventFileIndex}.ts`);
	}
</script>

<div class="grid w-full max-w-2xl gap-3">
	<div class="grid gap-2 md:grid-cols-[1fr_auto]">
		<div class="grid gap-2 text-sm md:grid-cols-2">
			<div class="border-neutral-muted bg-neutral-muted rounded-lg border px-3 py-2">
				{lastPolicyEvent}
			</div>
			<div class="border-neutral-muted bg-neutral-muted rounded-lg border px-3 py-2">
				{lastMutation}
			</div>
		</div>
		<Button
			size="small"
			variant="outline"
			color="neutral"
			onclick={addEventFile}
			disabled={!fileTree}
		>
			Add event file
		</Button>
	</div>
	<Tree
		id="docs-tree-policies"
		bind:api={fileTree}
		paths={workspaceTreePaths}
		height={340}
		initialExpansion="open"
		{dragAndDrop}
		{renaming}
		{onRename}
		{onRenameError}
		{onMutation}
	/>
</div>
