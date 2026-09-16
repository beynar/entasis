import {
	parseDiffFromFile,
	parsePatchFiles,
	type DiffLineAnnotation,
	type FileContents,
	type FileDiffMetadata,
	type FileDiffOptions,
	type SelectedLineRange
} from '@pierre/diffs';

/** Tuple of `[oldFile, newFile]` used when diffing raw file contents. */
export type DiffFiles = [FileContents, FileContents];

/** Source of a diff: either a unified `patch` string or a `files` tuple. */
export type DiffInput = {
	patch?: string;
	files?: DiffFiles;
};

/** A single parsed file diff ready to hand to the renderer. */
export type DiffRenderItem = {
	key: string;
	fileDiff: FileDiffMetadata;
};

/** A render item plus its server-preloaded shadow-DOM HTML (used for SSR + hydration). */
export type PreloadedDiffRenderItem = DiffRenderItem & {
	html: string;
};

/** Interactive render state forwarded to each `FileDiff` instance. */
export type DiffRenderState = {
	lineAnnotations?: DiffLineAnnotation<undefined>[];
	selectedLines?: SelectedLineRange | null;
};

/**
 * Turns a `DiffInput` (patch string or files tuple) into one render item per
 * file diff. Throws when the input is ambiguous, empty, or unparseable so the
 * component can surface a friendly error message.
 */
export function createDiffRenderItems(
	input: DiffInput,
	options: FileDiffOptions<undefined, undefined>
): DiffRenderItem[] {
	const hasPatch = input.patch != null && input.patch.trim().length > 0;
	const hasFiles = input.files != null;

	if (hasPatch && hasFiles) {
		throw new Error('Diff expects either `patch` or `files`, not both.');
	}

	if (hasPatch) {
		return createPatchRenderItems(input.patch as string);
	}

	if (hasFiles) {
		const [oldFile, newFile] = input.files as DiffFiles;
		const fileDiff = parseDiffFromFile(oldFile, newFile, options.parseDiffOptions, true);
		return [{ key: fileDiffKey(fileDiff, 0), fileDiff }];
	}

	throw new Error('Diff expects a `files` tuple or a unified `patch` string.');
}

function createPatchRenderItems(patch: string): DiffRenderItem[] {
	const parsedPatches = parsePatchFiles(patch, undefined, true);
	const fileDiffs = parsedPatches.flatMap((parsedPatch) => parsedPatch.files);

	if (fileDiffs.length === 0) {
		throw new Error('Diff patch did not contain any file diffs.');
	}

	return fileDiffs.map((fileDiff, index) => ({
		key: fileDiffKey(fileDiff, index),
		fileDiff
	}));
}

function fileDiffKey(fileDiff: FileDiffMetadata, index: number): string {
	return fileDiff.cacheKey ?? `${fileDiff.prevName ?? 'old'}:${fileDiff.name}:${index}`;
}
