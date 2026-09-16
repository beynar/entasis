export { default as Diff } from './Diff.svelte';
export type {
	DiffProps,
	DiffFiles,
	FileContents,
	FileDiffOptions,
	SelectedLineRange,
	DiffLineAnnotation
} from './diff.props.js';
export type { DiffInput, DiffRenderItem, DiffRenderState } from './diff-input.js';
export { createDiffRenderItems } from './diff-input.js';
export { createDiffOptions, registerDiffSyntaxTheme, type DiffOptionProps } from './diff-theme.js';
export {
	diffTheme,
	setDiffTheme,
	useDiffTheme,
	type DiffTheme,
	type DiffThemeProps
} from './diff.theme.js';
