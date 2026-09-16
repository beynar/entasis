import type { FileDiffOptions, HunkSeparators, ThemeRegistration } from '@pierre/diffs';
import { registerCustomTheme } from '@pierre/diffs';
import { CODE_SYNTAX_THEME_NAME, getCodeSyntaxTheme } from './diff.syntax-theme.js';

/**
 * Prop-friendly toggles that map onto the more verbose `FileDiffOptions`. These
 * mirror the ergonomic flags svelte-pro exposes and are folded into the full
 * options object by `createDiffOptions`.
 */
export type DiffOptionProps = {
	/** `'split'` (side-by-side) or `'unified'` (inline). */
	diffStyle?: NonNullable<FileDiffOptions<undefined, undefined>['diffStyle']>;
	/** Gutter change indicators: `'classic'`, `'bars'`, or `'none'`. */
	diffIndicators?: NonNullable<FileDiffOptions<undefined, undefined>['diffIndicators']>;
	/** Hunk separator style (the custom-function variant is intentionally excluded). */
	hunkSeparators?: Exclude<HunkSeparators, 'custom'>;
	/** Intra-line diff granularity: `'word-alt'`, `'word'`, `'char'`, or `'none'`. */
	lineDiffType?: NonNullable<FileDiffOptions<undefined, undefined>['lineDiffType']>;
	/** Show the tinted added/removed line backgrounds. */
	backgrounds?: boolean;
	/** Wrap long lines instead of horizontal scrolling. */
	wrapping?: boolean;
	/** Show the line-number gutter. */
	lineNumbers?: boolean;
};

// Registration is process-global (the highlighter caches themes by name), so we
// guard against re-registering the same theme across component instances.
let registered = false;

/**
 * Registers our shared Code syntax palette with `@pierre/diffs` under
 * `CODE_SYNTAX_THEME_NAME`. The loader resolves to `getCodeSyntaxTheme()`, whose
 * every color is a `--code-token-*` CSS variable, so the diff highlighting shares
 * Code's exact colors and auto-adapts to light/dark.
 */
export function registerDiffSyntaxTheme(): void {
	if (registered) return;
	registerCustomTheme(CODE_SYNTAX_THEME_NAME, () =>
		Promise.resolve(getCodeSyntaxTheme() as ThemeRegistration)
	);
	registered = true;
}

/**
 * Builds the full `FileDiffOptions` object handed to each `FileDiff` instance,
 * merging (in order) our defaults, caller-supplied `options`, then the ergonomic
 * `DiffOptionProps` toggles (which win).
 */
export function createDiffOptions(
	options: FileDiffOptions<undefined, undefined> | undefined,
	optionProps: DiffOptionProps = {}
): FileDiffOptions<undefined, undefined> {
	registerDiffSyntaxTheme();

	return {
		theme: {
			dark: CODE_SYNTAX_THEME_NAME,
			light: CODE_SYNTAX_THEME_NAME
		},
		diffStyle: 'split',
		hunkSeparators: 'line-info',
		overflow: 'scroll',
		...options,
		...createPropOptions(optionProps)
	};
}

function createPropOptions(optionProps: DiffOptionProps): FileDiffOptions<undefined, undefined> {
	const options: FileDiffOptions<undefined, undefined> = {};

	if (optionProps.diffStyle !== undefined) options.diffStyle = optionProps.diffStyle;
	if (optionProps.diffIndicators !== undefined) options.diffIndicators = optionProps.diffIndicators;
	if (optionProps.hunkSeparators !== undefined) options.hunkSeparators = optionProps.hunkSeparators;
	if (optionProps.lineDiffType !== undefined) options.lineDiffType = optionProps.lineDiffType;
	if (optionProps.backgrounds !== undefined) options.disableBackground = !optionProps.backgrounds;
	if (optionProps.wrapping !== undefined)
		options.overflow = optionProps.wrapping ? 'wrap' : 'scroll';
	if (optionProps.lineNumbers !== undefined) options.disableLineNumbers = !optionProps.lineNumbers;

	return options;
}
