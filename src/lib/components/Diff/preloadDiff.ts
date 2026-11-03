import { preloadDiffHTML } from '@pierre/diffs/ssr';
import type { DiffProps } from './diff.props.js';
import { createDiffOptions } from './diff-theme.js';
import { createDiffRenderItems, type PreloadedDiffRenderItem } from './diff-input.js';

/** A diff rendered to HTML ahead of time, for `<Diff preloaded>`. */
export type DiffPreload = PreloadedDiffRenderItem[];

/** What `preloadDiff` reads: the content and display props the `<Diff>` will get. */
export type DiffPreloadOptions = Pick<
	DiffProps,
	| 'patch'
	| 'files'
	| 'options'
	| 'lineAnnotations'
	| 'diffStyle'
	| 'diffIndicators'
	| 'hunkSeparators'
	| 'lineDiffType'
	| 'backgrounds'
	| 'wrapping'
	| 'lineNumbers'
>;

/**
 * Renders a diff to HTML on the server (in a `load` function), so `<Diff preloaded>` shows it
 * before hydration as declarative shadow DOM. Pass the same content and display props as the
 * `<Diff>`; annotations rendered by a snippet fill in on the client.
 */
export async function preloadDiff({
	patch,
	files,
	options,
	lineAnnotations,
	...optionProps
}: DiffPreloadOptions): Promise<DiffPreload> {
	const diffOptions = createDiffOptions(options, optionProps);
	const items = createDiffRenderItems({ patch, files }, diffOptions);

	return Promise.all(
		items.map(async (item) => ({
			...item,
			html: await preloadDiffHTML({
				fileDiff: item.fileDiff,
				options: diffOptions,
				annotations: lineAnnotations
			})
		}))
	);
}
