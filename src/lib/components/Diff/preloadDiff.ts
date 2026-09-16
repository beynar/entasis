import { preloadDiffHTML } from '@pierre/diffs/ssr';
import type { FileDiffOptions } from '@pierre/diffs';
import { createDiffOptions, type DiffOptionProps } from './diff-theme.js';
import {
	createDiffRenderItems,
	type DiffInput,
	type DiffRenderState,
	type PreloadedDiffRenderItem
} from './diff-input.js';

/**
 * Server-side preload: parse the input and render each file diff to an HTML
 * string via `@pierre/diffs/ssr`. The strings are emitted as declarative shadow
 * DOM so the diff is visible in the SSR output before hydration.
 */
export async function preloadDiff(
	input: DiffInput,
	options: FileDiffOptions<undefined, undefined> | undefined,
	state: Pick<DiffRenderState, 'lineAnnotations'>,
	optionProps: DiffOptionProps
): Promise<PreloadedDiffRenderItem[]> {
	const diffOptions = createDiffOptions(options, optionProps);
	const items = createDiffRenderItems(input, diffOptions);

	return Promise.all(
		items.map(async (item) => ({
			...item,
			html: await preloadDiffHTML({
				fileDiff: item.fileDiff,
				options: diffOptions,
				annotations: state.lineAnnotations
			})
		}))
	);
}
