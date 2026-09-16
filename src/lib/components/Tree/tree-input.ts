import type {
	FileTreeCompositionOptions,
	FileTreeDragAndDropConfig,
	FileTreeOptions,
	FileTreePreparedInput,
	FileTreeRenamingConfig,
	FileTreeSearchChangeListener,
	FileTreeSelectionChangeListener
} from '@pierre/trees';
import type { Density } from '$lib/types/theme.js';

export type TreeInput = {
	paths?: readonly string[];
	preparedInput?: FileTreePreparedInput;
};

export type TreeOptions = Omit<FileTreeOptions, 'paths' | 'preparedInput'>;

export type TreeEventProps = {
	/** Called after a drag-and-drop move completes. Enables drag-and-drop unless `dragAndDrop={false}`. */
	onDropComplete?: NonNullable<FileTreeDragAndDropConfig['onDropComplete']>;
	/** Called when a drag-and-drop move is rejected or fails. */
	onDropError?: (failure: {
		error: string;
		event: Parameters<NonNullable<FileTreeDragAndDropConfig['onDropError']>>[1];
	}) => void;
	/** Called after an inline rename completes. Enables inline rename unless `renaming={false}`. */
	onRename?: NonNullable<FileTreeRenamingConfig['onRename']>;
	/** Called when inline rename validation or mutation fails. */
	onRenameError?: NonNullable<FileTreeRenamingConfig['onError']>;
	/** Called when the built-in tree search query changes. */
	onSearchChange?: FileTreeSearchChangeListener;
	/** Called when selected paths change. */
	onSelectionChange?: FileTreeSelectionChangeListener;
};

export type TreeOptionProps = {
	/** Pierre Trees composition hooks for header and context-menu surfaces. */
	composition?: FileTreeCompositionOptions;
	/** Semantic whitespace density for tree rows. */
	density?: Density;
	/** Drag-and-drop enablement or policy object. */
	dragAndDrop?: TreeOptions['dragAndDrop'];
	/** Search filtering strategy. */
	fileTreeSearchMode?: TreeOptions['fileTreeSearchMode'];
	/** Collapse single-child directory chains into one visual row. */
	flattenEmptyDirectories?: TreeOptions['flattenEmptyDirectories'];
	/** Git status entries mapped by canonical path. */
	gitStatus?: TreeOptions['gitStatus'];
	/** Icon set and file-name or extension icon overrides. */
	icons?: TreeOptions['icons'];
	/** Stable tree id passed to the underlying widget. */
	id?: TreeOptions['id'];
	/** Initial expansion policy: closed, open, or depth. */
	initialExpansion?: TreeOptions['initialExpansion'];
	/** Paths expanded on first render or reset. */
	initialExpandedPaths?: TreeOptions['initialExpandedPaths'];
	/** Initial search query when search is enabled. */
	initialSearchQuery?: TreeOptions['initialSearchQuery'];
	/** Paths selected on first render. */
	initialSelectedPaths?: TreeOptions['initialSelectedPaths'];
	/** SSR and virtualization estimate for first visible row count. */
	initialVisibleRowCount?: TreeOptions['initialVisibleRowCount'];
	/** Fixed row height used by the virtualizer. */
	itemHeight?: TreeOptions['itemHeight'];
	/** Extra rows rendered above and below the viewport. */
	overscan?: TreeOptions['overscan'];
	/** Treat input paths as already sorted. */
	presorted?: TreeOptions['presorted'];
	/** Row decoration renderer for labels or icons at the row edge. */
	renderRowDecoration?: TreeOptions['renderRowDecoration'];
	/** Inline renaming enablement or policy object. */
	renaming?: TreeOptions['renaming'];
	/** Enables the built-in search UI. */
	search?: TreeOptions['search'];
	/** Search blur behavior for the built-in search UI. */
	searchBlurBehavior?: TreeOptions['searchBlurBehavior'];
	/** Keep keyboard focus visually in the tree while the search input is active. */
	searchFakeFocus?: TreeOptions['searchFakeFocus'];
	/** Top spacing above the built-in search input. A number is treated as px. */
	searchTopInset?: number | string;
	/** Hide Git status styling without mutating the provided status array. */
	showGitStatus?: boolean;
	/** Sort policy for paths when raw paths are used. */
	sort?: TreeOptions['sort'];
	/** Keep ancestor folders stuck at the top while scrolling. */
	stickyFolders?: TreeOptions['stickyFolders'];
	/** Raw CSS injected into the Pierre Trees shadow root. */
	unsafeCSS?: TreeOptions['unsafeCSS'];
};

export type TreeTuningProps = Pick<
	TreeOptionProps,
	'density' | 'initialVisibleRowCount' | 'itemHeight' | 'overscan'
>;

const defaultSearchTopInset = 'calc(var(--trees-item-row-gap) * 2)';

function createDefaultUnsafeCSS(searchTopInset: number | string | undefined): string {
	const resolvedSearchTopInset = formatCssLength(searchTopInset ?? defaultSearchTopInset);
	return `
[data-file-tree-search-container] {
	padding-block-start: ${resolvedSearchTopInset};
}
`;
}

export function createTreeOptions(
	input: TreeInput,
	options?: TreeOptions,
	optionProps?: TreeOptionProps,
	eventProps?: TreeEventProps
): FileTreeOptions {
	const resolvedOptions = createResolvedOptions(options, optionProps, eventProps);

	if (input.preparedInput != null) {
		if (input.paths != null) {
			throw new Error('Tree expects either `paths` or `preparedInput`, not both.');
		}

		return { ...resolvedOptions, preparedInput: input.preparedInput };
	}

	if (input.paths != null) {
		return { ...resolvedOptions, paths: input.paths };
	}

	throw new Error('Tree expects `paths` or `preparedInput`.');
}

function createResolvedOptions(
	options: TreeOptions | undefined,
	optionProps: TreeOptionProps | undefined,
	eventProps: TreeEventProps | undefined
): TreeOptions {
	const resolvedOptions: TreeOptions = options == null ? {} : { ...options };

	if (optionProps != null) {
		setDefinedOption(resolvedOptions, 'composition', optionProps.composition);
		if (optionProps.density !== undefined) {
			const presets = { compact: 'compact', normal: 'default', comfortable: 'relaxed' } as const;
			resolvedOptions.density = presets[optionProps.density];
		}
		setDefinedOption(resolvedOptions, 'dragAndDrop', optionProps.dragAndDrop);
		setDefinedOption(resolvedOptions, 'fileTreeSearchMode', optionProps.fileTreeSearchMode);
		setDefinedOption(
			resolvedOptions,
			'flattenEmptyDirectories',
			optionProps.flattenEmptyDirectories
		);
		setDefinedOption(resolvedOptions, 'gitStatus', optionProps.gitStatus);
		setDefinedOption(resolvedOptions, 'icons', optionProps.icons);
		setDefinedOption(resolvedOptions, 'id', optionProps.id);
		setDefinedOption(resolvedOptions, 'initialExpandedPaths', optionProps.initialExpandedPaths);
		setDefinedOption(resolvedOptions, 'initialExpansion', optionProps.initialExpansion);
		setDefinedOption(resolvedOptions, 'initialSearchQuery', optionProps.initialSearchQuery);
		setDefinedOption(resolvedOptions, 'initialSelectedPaths', optionProps.initialSelectedPaths);
		setDefinedOption(resolvedOptions, 'initialVisibleRowCount', optionProps.initialVisibleRowCount);
		setDefinedOption(resolvedOptions, 'itemHeight', optionProps.itemHeight);
		setDefinedOption(resolvedOptions, 'overscan', optionProps.overscan);
		setDefinedOption(resolvedOptions, 'presorted', optionProps.presorted);
		setDefinedOption(resolvedOptions, 'renderRowDecoration', optionProps.renderRowDecoration);
		setDefinedOption(resolvedOptions, 'renaming', optionProps.renaming);
		setDefinedOption(resolvedOptions, 'search', optionProps.search);
		setDefinedOption(resolvedOptions, 'searchBlurBehavior', optionProps.searchBlurBehavior);
		setDefinedOption(resolvedOptions, 'searchFakeFocus', optionProps.searchFakeFocus);
		setDefinedOption(resolvedOptions, 'sort', optionProps.sort);
		setDefinedOption(resolvedOptions, 'stickyFolders', optionProps.stickyFolders);
		setDefinedOption(resolvedOptions, 'unsafeCSS', optionProps.unsafeCSS);

		if (optionProps.showGitStatus === false) {
			delete resolvedOptions.gitStatus;
		}
	}

	applyEventProps(resolvedOptions, eventProps);
	resolvedOptions.unsafeCSS = [
		createDefaultUnsafeCSS(optionProps?.searchTopInset),
		resolvedOptions.unsafeCSS
	]
		.filter((unsafeCSS) => unsafeCSS != null && unsafeCSS.trim().length > 0)
		.join('\n');

	return resolvedOptions;
}

function formatCssLength(value: number | string): string {
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) {
			throw new Error('Tree `searchTopInset` must be a finite number.');
		}
		return `${value}px`;
	}

	const trimmedValue = value.trim();
	if (trimmedValue.length === 0) {
		throw new Error('Tree `searchTopInset` cannot be empty.');
	}
	return trimmedValue;
}

function setDefinedOption<TKey extends keyof TreeOptions>(
	options: TreeOptions,
	key: TKey,
	value: TreeOptions[TKey] | undefined
): void {
	if (value !== undefined) {
		options[key] = value;
	}
}

function applyEventProps(options: TreeOptions, eventProps: TreeEventProps | undefined): void {
	if (eventProps == null) return;

	const onSearchChange = composeCallbacks(options.onSearchChange, eventProps.onSearchChange);
	if (onSearchChange != null) options.onSearchChange = onSearchChange;

	const onSelectionChange = composeCallbacks(
		options.onSelectionChange,
		eventProps.onSelectionChange
	);
	if (onSelectionChange != null) options.onSelectionChange = onSelectionChange;

	options.renaming = composeRenaming(options.renaming, eventProps);
	options.dragAndDrop = composeDragAndDrop(options.dragAndDrop, eventProps);
}

function composeRenaming(
	renaming: TreeOptions['renaming'],
	eventProps: TreeEventProps
): TreeOptions['renaming'] {
	if (eventProps.onRename == null && eventProps.onRenameError == null) return renaming;
	if (renaming === false) return renaming;

	const renamingConfig: FileTreeRenamingConfig =
		renaming === true || renaming == null ? {} : { ...renaming };
	const onRename = composeCallbacks(renamingConfig.onRename, eventProps.onRename);
	const onError = composeCallbacks(renamingConfig.onError, eventProps.onRenameError);

	if (onRename != null) renamingConfig.onRename = onRename;
	if (onError != null) renamingConfig.onError = onError;

	return renamingConfig;
}

function composeDragAndDrop(
	dragAndDrop: TreeOptions['dragAndDrop'],
	eventProps: TreeEventProps
): TreeOptions['dragAndDrop'] {
	if (eventProps.onDropComplete == null && eventProps.onDropError == null) return dragAndDrop;
	if (dragAndDrop === false) return dragAndDrop;

	const dragAndDropConfig: FileTreeDragAndDropConfig =
		dragAndDrop === true || dragAndDrop == null ? {} : { ...dragAndDrop };
	const onDropComplete = composeCallbacks(
		dragAndDropConfig.onDropComplete,
		eventProps.onDropComplete
	);
	const onDropError = composeCallbacks(
		dragAndDropConfig.onDropError,
		eventProps.onDropError
			? (error, event) => eventProps.onDropError?.({ error, event })
			: undefined
	);

	if (onDropComplete != null) dragAndDropConfig.onDropComplete = onDropComplete;
	if (onDropError != null) dragAndDropConfig.onDropError = onDropError;

	return dragAndDropConfig;
}

type EventCallback<TArgs extends unknown[]> = (...args: TArgs) => void;

function composeCallbacks<TArgs extends unknown[]>(
	first: EventCallback<TArgs> | undefined,
	second: EventCallback<TArgs> | undefined
): EventCallback<TArgs> | undefined {
	if (first == null) return second;
	if (second == null) return first;

	return (...args) => {
		first(...args);
		second(...args);
	};
}
