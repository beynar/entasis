<script lang="ts">
	import type { FileTree } from '@pierre/trees';
	import Button from '$lib/components/Button/Button.svelte';
	import Tree from '$lib/components/Tree/Tree.svelte';
	import { caretDownIcon } from '$lib/components/Icons/caretDown.js';
	import { caretUpIcon } from '$lib/components/Icons/caretUp.js';
	import { magnifyingGlassIcon } from '$lib/components/Icons/magnifyingGlass.js';
	import { workspaceTreePaths } from '../tree-demo-data.js';

	const initialQuery = 'Tree';
	let fileTree = $state<FileTree>();
	let query = $state(initialQuery);
	let matchCount = $state(countMatchingPaths(workspaceTreePaths, initialQuery));

	const matchLabel = $derived(`${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`);

	function syncMatches(): void {
		matchCount = fileTree?.getSearchMatchingPaths().length ?? 0;
	}

	function onReady(nextFileTree: FileTree): void {
		fileTree = nextFileTree;
		syncMatches();
	}

	function setQuery(nextQuery: string): void {
		query = nextQuery;
		fileTree?.setSearch(nextQuery.length === 0 ? null : nextQuery);
		syncMatches();
	}

	function countMatchingPaths(paths: readonly string[], searchQuery: string): number {
		const normalizedQuery = searchQuery.trim().toLowerCase();
		if (normalizedQuery.length === 0) return 0;
		return getSearchablePaths(paths).filter((path) => path.toLowerCase().includes(normalizedQuery))
			.length;
	}

	function getSearchablePaths(paths: readonly string[]): string[] {
		const searchablePaths = new Set<string>();

		for (const path of paths) {
			searchablePaths.add(path);
			for (const directoryPath of getParentDirectoryPaths(path)) {
				searchablePaths.add(directoryPath);
			}
		}

		return [...searchablePaths];
	}

	function getParentDirectoryPaths(path: string): string[] {
		const segments = path.split('/');
		return segments.slice(0, -1).map((_, index) => `${segments.slice(0, index + 1).join('/')}/`);
	}
</script>

<div class="grid w-full max-w-2xl gap-3">
	<div
		class="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-muted bg-surface p-2"
	>
		<div class="relative min-w-56 flex-1">
			<span class="text-neutral/60 pointer-events-none absolute top-1/2 left-2 -translate-y-1/2">
				{@render magnifyingGlassIcon({ size: 16 })}
			</span>
			<input
				value={query}
				type="search"
				aria-label="Search tree paths"
				placeholder="Search paths..."
				class="border-neutral-muted bg-surface text-neutral placeholder:text-neutral/60 h-9 w-full rounded-md border pr-2 pl-8 text-sm outline-none focus:border-primary"
				oninput={(event) => setQuery(event.currentTarget.value)}
			/>
		</div>
		<div class="text-neutral/60 min-w-20 text-right text-xs">{matchLabel}</div>
		<Button
			size="small"
			variant="outline"
			color="neutral"
			label="Previous search match"
			disabled={fileTree == null || query.length === 0}
			onclick={() => fileTree?.focusPreviousSearchMatch()}
		>
			{@render caretUpIcon({ size: 16 })}
		</Button>
		<Button
			size="small"
			variant="outline"
			color="neutral"
			label="Next search match"
			disabled={fileTree == null || query.length === 0}
			onclick={() => fileTree?.focusNextSearchMatch()}
		>
			{@render caretDownIcon({ size: 16 })}
		</Button>
	</div>

	<Tree
		id="docs-tree-custom-search"
		bind:fileTree
		paths={workspaceTreePaths}
		height={320}
		initialExpansion="open"
		initialSearchQuery={query}
		fileTreeSearchMode="hide-non-matches"
		{onReady}
		onSearchChange={syncMatches}
	/>
</div>
