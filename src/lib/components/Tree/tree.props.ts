import type { FileTree, FileTreeMutationEvent, FileTreePreparedInput } from '@pierre/trees';
import type { HTMLAttributes } from 'svelte/elements';
import type { WithAttachments } from '$lib/types/props.js';
import type {
	TreeEventProps,
	TreeInput,
	TreeOptionProps,
	TreeOptions,
	TreeTuningProps
} from './tree-input.js';
import type { TreeRendererHooks } from './TreeRenderer.js';
import type { TreeSnippetProps } from './TreeSnippetRenderer.js';
import type { TreeThemeProps } from './tree.theme.js';

export type TreeProps = WithAttachments<
	Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'height'> &
		TreeEventProps &
		TreeOptionProps &
		TreeSnippetProps & {
			/** Bindable reference to the outer Svelte wrapper element. */
			ref?: HTMLDivElement | null;
			/** Canonical file and directory paths passed to `@pierre/trees`. */
			paths?: readonly string[];
			/** Pre-shaped Pierre Trees input, preferred for large or server-rendered trees. */
			preparedInput?: FileTreePreparedInput;
			/** Lower-level options forwarded to `@pierre/trees` `FileTree`. */
			options?: TreeOptions;
			/** CSS height applied to the wrapper. A number is treated as px. */
			height?: number | string;
			/** Classes applied to the outer Svelte wrapper. */
			class?: string;
			/** Classes applied to the inner `file-tree-container` host. */
			hostClass?: string;
			/** Current Pierre Trees instance. Bind with `bind:api` for imperative calls. */
			api?: FileTree;
			/** Fires after the current Pierre Trees instance renders or hydrates. */
			onReady?: (payload: FileTree) => void;
			/** Fires when the focused path changes. */
			onFocusChange?: (focusedPath: string | null) => void;
			/** Fires for public path mutation events emitted by Pierre Trees. */
			onMutation?: (event: FileTreeMutationEvent) => void;
			/** Per-instance theme overrides for wrapper, host, viewport, and error parts. */
			theme?: TreeThemeProps;
		}
>;

export type TreeAttachmentParams = {
	eventProps: TreeEventProps;
	hostClass: string | undefined;
	input: TreeInput;
	optionProps: TreeOptionProps;
	options: TreeOptions | undefined;
	rendererHooks: TreeRendererHooks;
	snippets: TreeSnippetProps;
};

export type TreePropValues = TreeEventProps &
	TreeOptionProps &
	TreeSnippetProps & {
		onFocusChange?: (focusedPath: string | null) => void;
		onMutation?: (event: FileTreeMutationEvent) => void;
		onReady?: (payload: FileTree) => void;
		onDispose: () => void;
		setFileTree: (fileTree: FileTree | undefined) => void;
	};

export function createTreeEventProps(props: TreePropValues): TreeEventProps {
	return {
		onDropComplete: props.onDropComplete,
		onDropError: props.onDropError,
		onRename: props.onRename,
		onRenameError: props.onRenameError,
		onSearchChange: props.onSearchChange,
		onSelectionChange: props.onSelectionChange
	};
}

export function createTreeOptionProps(props: TreePropValues): TreeOptionProps {
	return {
		composition: props.composition,
		density: props.density,
		dragAndDrop: props.dragAndDrop,
		fileTreeSearchMode: props.fileTreeSearchMode,
		flattenEmptyDirectories: props.flattenEmptyDirectories,
		gitStatus: props.gitStatus,
		icons: props.icons,
		id: props.id,
		initialExpandedPaths: props.initialExpandedPaths,
		initialExpansion: props.initialExpansion,
		initialSearchQuery: props.initialSearchQuery,
		initialSelectedPaths: props.initialSelectedPaths,
		initialVisibleRowCount: props.initialVisibleRowCount,
		itemHeight: props.itemHeight,
		overscan: props.overscan,
		presorted: props.presorted,
		renderRowDecoration: props.renderRowDecoration,
		renaming: props.renaming,
		search: props.search,
		searchBlurBehavior: props.searchBlurBehavior,
		searchFakeFocus: props.searchFakeFocus,
		searchTopInset: props.searchTopInset,
		showGitStatus: props.showGitStatus,
		sort: props.sort,
		stickyFolders: props.stickyFolders,
		unsafeCSS: props.unsafeCSS
	};
}

export function createTreeRendererHooks(props: TreePropValues): TreeRendererHooks {
	return {
		onDispose: props.onDispose,
		onFocusChange: props.onFocusChange,
		onMutation: props.onMutation,
		onReady: props.onReady,
		setFileTree: props.setFileTree
	};
}

export function createTreeTuningProps(props: TreePropValues): TreeTuningProps {
	return {
		density: props.density,
		initialVisibleRowCount: props.initialVisibleRowCount,
		itemHeight: props.itemHeight,
		overscan: props.overscan
	};
}

export function createTreeSnippetProps(props: TreePropValues): TreeSnippetProps {
	return {
		contextMenu: props.contextMenu,
		header: props.header
	};
}
