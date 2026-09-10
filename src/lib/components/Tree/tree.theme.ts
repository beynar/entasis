import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultTreeRoot = cva({
	base: 'my-xl flex w-full min-w-0 flex-col overflow-hidden rounded-md border border-neutral-muted bg-surface text-sm text-neutral'
});

const defaultTreeViewport = cva({
	base: 'min-h-0 min-w-0 flex-1 overflow-hidden'
});

const defaultTreeHost = cva({
	base: 'block h-full min-h-0 w-full min-w-0'
});

const defaultTreeError = cva({
	base: 'border-b border-danger/40 bg-danger-muted px-xl py-lg text-sm text-danger-muted-readable'
});

export const treeTheme = {
	root: defaultTreeRoot,
	viewport: defaultTreeViewport,
	host: defaultTreeHost,
	error: defaultTreeError
};

export type TreeTheme = typeof treeTheme;
export type TreeThemeProps = InferComponentTheme<TreeTheme>;
export const setTreeTheme = setComponentTheme<TreeTheme>('tree');
export const useTreeTheme = useComponentTheme('tree', treeTheme);
