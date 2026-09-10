import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

/**
 * Root wrapper. Holds the shared type styling and vertical rhythm between file
 * diffs. The mount container inside brands @pierre's add/remove/modify decoration
 * colors with our success/danger/warning tokens via `*-color-override` custom
 * properties (see `Diff.svelte`); the syntax surface/tokens come from the shared
 * Code theme registered under the same name.
 */
const defaultDiffRoot = cva({
	base: 'flex w-full min-w-0 flex-col gap-lg text-sm text-neutral'
});

/** Per-file wrapper: a rounded, bordered surface around each rendered file diff. */
const defaultDiffFile = cva({
	base: 'overflow-hidden rounded-md border border-neutral-muted bg-surface'
});

/** Error surface shown when parsing/rendering the diff throws. */
const defaultDiffError = cva({
	base: 'rounded-md border border-danger/40 bg-danger-muted px-xl py-lg text-sm text-danger-muted-readable'
});

export const diffTheme = {
	root: defaultDiffRoot,
	file: defaultDiffFile,
	error: defaultDiffError
};

export type DiffTheme = typeof diffTheme;
export type DiffThemeProps = InferComponentTheme<DiffTheme>;
export const setDiffTheme = setComponentTheme<DiffTheme>('diff');
export const useDiffTheme = useComponentTheme<DiffTheme>('diff', diffTheme);
