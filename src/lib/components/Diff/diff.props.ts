import type {
	DiffLineAnnotation,
	FileContents,
	FileDiffOptions,
	SelectedLineRange
} from '@pierre/diffs';
import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { DiffFiles } from './diff-input.js';
import type { DiffOptionProps } from './diff-theme.js';
import type { DiffThemeProps } from './diff.theme.js';

export type { DiffFiles };

/**
 * Props for the `Diff` component. Renders one or more rich, syntax-highlighted
 * file diffs (split or unified) client-side via `@pierre/diffs`, using the shared
 * Code syntax palette so colors adapt to light/dark automatically.
 */
export type DiffProps = WithAttachments<
	WithSlot<
		{
			/** Unified diff/patch content (may cover multiple files). Mutually exclusive with `files`. */
			patch?: string;
			/** Tuple of `[oldFile, newFile]` raw contents. Mutually exclusive with `patch`. */
			files?: DiffFiles;

			/** `'split'` (side-by-side) or `'unified'` (inline). Defaults to `'split'`. */
			diffStyle?: DiffOptionProps['diffStyle'];
			/** Show the line-number gutter. Defaults to on. */
			lineNumbers?: DiffOptionProps['lineNumbers'];
			/** Wrap long lines instead of horizontal scrolling. Defaults to off (scroll). */
			wrapping?: DiffOptionProps['wrapping'];
			/** Show the tinted added/removed line backgrounds. Defaults to on. */
			backgrounds?: DiffOptionProps['backgrounds'];
			/** Hunk separator style. Defaults to `'line-info'`. */
			hunkSeparators?: DiffOptionProps['hunkSeparators'];
			/** Intra-line diff granularity: `'word-alt'`, `'word'`, `'char'`, or `'none'`. */
			lineDiffType?: DiffOptionProps['lineDiffType'];
			/** Gutter change indicators: `'classic'`, `'bars'`, or `'none'`. */
			diffIndicators?: DiffOptionProps['diffIndicators'];

			/** Escape hatch: full `FileDiffOptions` forwarded to each `@pierre/diffs` `FileDiff`. */
			options?: FileDiffOptions<undefined, undefined>;

			/** Diff-side line annotations passed to the renderer. */
			lineAnnotations?: DiffLineAnnotation<undefined>[];
			/** Classes merged onto the annotation snippet host element. */
			renderAnnotationClass?: string;

			/** Controlled selected line range. Bindable; use `null` to clear the selection. */
			selection?: SelectedLineRange | null;
			/** Initial selected line range when `selection` is omitted. */
			defaultSelection?: SelectedLineRange | null;
			/** Called once for each diff-driven change to the selected line range. */
			onSelectionChange?: (payload: SelectedLineRange | null) => void;

			/** Extra classes for each per-file wrapper. */
			fileClass?: string;
			/** Extra classes for the root element. */
			class?: string;
			/** Theme overrides for the root, per-file wrapper, and error surface. */
			theme?: DiffThemeProps;
		},
		/** Snippet used to render the content of each line annotation. */
		'renderAnnotation',
		DiffLineAnnotation<undefined>
	>
>;

export type { FileContents, FileDiffOptions, SelectedLineRange, DiffLineAnnotation };
