export const treeDescription = `
# Tree Component

Virtualized file tree powered by @pierre/trees. The wrapper provides Svelte props,
SSR pre-rendering, bindable access to the FileTree instance, tokenized styling,
Git status, search, snippets, context menus, drag-and-drop, renaming, and mutation
events.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { Tree } from 'entasis/tree';

	const paths = [
		'src/lib/components/Tree/Tree.svelte',
		'src/lib/components/Tree/tree.props.ts',
		'src/routes/components/tree/+page.svelte'
	];
</script>

<Tree paths={paths} height="320px" initialExpansion="open" search />
\`\`\`

## Large Trees

Use \`prepareFileTreeInput\` from \`entasis/tree\` and pass \`preparedInput\` for large
or SSR-heavy trees. Keep the input preparation outside component render work.

\`\`\`svelte
<script lang="ts">
	import { Tree, prepareFileTreeInput } from 'entasis/tree';

	const preparedInput = prepareFileTreeInput(paths, { sort: 'default' });
</script>

<Tree {preparedInput} height={420} initialVisibleRowCount={18} overscan={8} />
\`\`\`

## AI-Safe Usage Contract

Prefer the narrowest public API:

1. Use \`paths\` for small and medium static trees.
2. Use \`preparedInput\` for large trees, server-rendered trees, or pre-sorted data.
3. Use promoted props such as \`search\`, \`gitStatus\`, \`icons\`, \`renaming\`,
   \`dragAndDrop\`, \`density\`, and \`searchTopInset\` before using raw \`options\`.
4. Use \`bind:api\` only when you need imperative behavior such as custom search,
   focus, mutation, or scroll control.
5. Passing \`onRename\` enables inline rename with the default policy unless
   \`renaming={false}\`. Passing \`onDropComplete\` enables drag-and-drop with the
   default policy unless \`dragAndDrop={false}\`.
6. Use \`TreeContextMenuSurface\` for normal context menus instead of rebuilding menu
   positioning from scratch.
7. Use \`unsafeCSS\` only for unsupported shadow-DOM styling. Prefer \`searchTopInset\`
   for search spacing.

Never pass both \`paths\` and \`preparedInput\`. Virtualized trees need a bounded
\`height\` or an outer layout that gives the wrapper a real height.

## Recipes

### Controlled Search

\`\`\`svelte
<script lang="ts">
	import { Tree, type FileTree } from 'entasis/tree';

	let fileTree: FileTree | undefined = $state();
	let query = $state('');

	function setQuery(value: string) {
		query = value;
		fileTree?.setSearch(value.length === 0 ? null : value);
	}
</script>

<input value={query} oninput={(event) => setQuery(event.currentTarget.value)} />
<Tree bind:api paths={paths} height={360} search initialSearchQuery={query} />
\`\`\`

### Git Status

\`\`\`svelte
<script lang="ts">
	import { Tree, type GitStatusEntry } from 'entasis/tree';

	const gitStatus: GitStatusEntry[] = [
		{ path: 'src/lib/Tree.svelte', status: 'modified' }
	];
</script>

<Tree paths={paths} {gitStatus} showGitStatus height={360} />
\`\`\`

### Context Menu

\`\`\`svelte
<script lang="ts">
	import { Tree, TreeContextMenuSurface } from 'entasis/tree';
</script>

<Tree
	paths={paths}
	height={360}
	composition={{ contextMenu: { enabled: true, triggerMode: 'both' } }}
>
	{#snippet contextMenu(data)}
		<TreeContextMenuSurface
			{data}
			items={[{ type: 'option', title: \`Copy \${data.name}\`, onclick: () => copy(data.path) }]}
		/>
	{/snippet}
</Tree>
\`\`\`

## Props

### Data
- **paths**: readonly string[] - Canonical file and directory paths.
- **preparedInput**: FileTreePreparedInput - Pre-shaped input from @pierre/trees.
- **options**: TreeOptions - Lower-level FileTree options.
- **api**: FileTree - Bindable instance handle for imperative calls.

### Rendering
- **height**: number | string - Bounded wrapper height. Virtualized trees need one.
- **hostClass**: string - Classes applied to the inner file-tree-container.
- **theme**: TreeThemeProps - Theme overrides for root, viewport, host, and error.
- **class**: string - Classes applied to the outer wrapper.
- **ref**: HTMLDivElement - Bindable wrapper element.

### Tree Options
- **id**: string - Stable tree id.
- **initialExpansion**: 'closed' | 'open' | number - Initial expansion policy.
- **initialExpandedPaths**: readonly string[] - Paths expanded initially or on reset.
- **initialSelectedPaths**: readonly string[] - Paths selected initially.
- **flattenEmptyDirectories**: boolean - Collapse single-child directory chains.
- **presorted**: boolean - Treat input paths as already sorted.
- **sort**: 'default' | FileTreeSortComparator - Sort policy.
- **density**: 'compact' | 'normal' | 'comfortable' - Semantic row density. Lower-level numeric tuning belongs in options.density.
- **itemHeight**: number - Virtualized row height.
- **overscan**: number - Extra rows above and below the viewport.
- **initialVisibleRowCount**: number - SSR and virtualization first-pass row count.
- **icons**: FileTreeIcons - Built-in icon set and overrides.
- **gitStatus**: GitStatusEntry[] - Status by path.
- **showGitStatus**: boolean - Set false to hide status styling.
- **renderRowDecoration**: FileTreeRowDecorationRenderer - Row label/icon decoration.
- **search**: boolean - Enables built-in search UI.
- **initialSearchQuery**: string | null - Initial search value.
- **fileTreeSearchMode**: FileTreeSearchMode - Search filtering strategy.
- **searchBlurBehavior**: FileTreeSearchBlurBehavior - Search close/retain behavior.
- **searchFakeFocus**: boolean - Preserve visual tree focus during search.
- **searchTopInset**: number | string - Top spacing above the built-in search input.
- **stickyFolders**: boolean - Keep ancestor folders sticky while scrolling.
- **unsafeCSS**: string - CSS injected into the tree shadow root.
- **dragAndDrop**: boolean | FileTreeDragAndDropConfig - DnD behavior and policies.
- **renaming**: boolean | FileTreeRenamingConfig - Inline rename behavior and policies.
- **composition**: FileTreeCompositionOptions - Raw Pierre composition hooks.

### Snippets
- **header**: Snippet - Custom header mounted into the tree composition header slot.
- **contextMenu**: Snippet<[TreeContextMenuSnippetData]> - Custom row context menu.
- **TreeContextMenuSurface**: exported helper component for standard entasis Menu styling
  and Pierre context-menu positioning.

### Events
- **onReady**: (payload: FileTree) => void - After render or hydration.
- **onFocusChange**: (path: string | null) => void - Focused row changed.
- **onMutation**: (event: FileTreeMutationEvent) => void - Add/remove/move/reset event.
- **onSelectionChange**: (paths: readonly string[]) => void - Selection changed. Its payload is the
  whole selected-path set, so it belongs to the \`onSelectionChange\` state family rather than the
  \`onSelect\` pick event. @pierre/trees owns the selection and exposes no setter, so
  \`initialSelectedPaths\` is the only default and there is no controlled \`selection\` prop.
- **onSearchChange**: (value: string | null) => void - Search changed.
- **onRename**: FileTreeRenamingConfig['onRename'] - Rename completed.
- **onRenameError**: FileTreeRenamingConfig['onError'] - Rename failed.
- **onDropComplete**: FileTreeDragAndDropConfig['onDropComplete'] - Drop completed.
- **onDropError**: receives one { error, event } object when a drop fails.

## Accessibility

@pierre/trees owns the ARIA tree semantics, keyboard navigation, selection, search,
renaming, drag interactions, and virtualized focus handling. This wrapper preserves
the server-rendered tree host during hydration and surfaces rendering errors through
a role=alert error region.

## Notes

- Pass exactly one data source: \`paths\` or \`preparedInput\`.
- Virtualized trees need a bounded height via \`height\` or an outer layout class.
- The wrapper maps Pierre CSS variables to entasis \`--color-*\` tokens, so light and
dark themes are inherited automatically.
- Import common Pierre helpers and types from \`entasis/tree\` first. Reach for
\`@pierre/trees\` directly only when this wrapper does not re-export a type or helper.
`;
