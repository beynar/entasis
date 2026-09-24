import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

export const aiFilePreviewTheme = {
	root: cva({
		base: 'group relative flex min-w-36 max-w-72 items-center gap-md overflow-hidden rounded-sm border border-neutral-muted bg-surface-raised p-md',
		variants: {
			status: {
				pending: '',
				uploading: 'border-primary/40',
				uploaded: 'border-success/40',
				failed: 'border-danger/40 bg-danger-muted/30'
			}
		}
	}),
	preview: cva({ base: 'size-10 shrink-0 rounded-sm object-cover' }),
	fallback: cva({
		base: 'grid size-10 shrink-0 place-items-center rounded-sm bg-neutral-muted text-neutral-muted-readable'
	}),
	content: cva({ base: 'grid min-w-0 flex-1 gap-micro' }),
	name: cva({ base: 'truncate text-xs font-medium' }),
	meta: cva({ base: 'flex items-center gap-xs text-xs text-neutral/70' }),
	error: cva({ base: 'truncate text-xs text-danger-readable' })
};

export type AIFilePreviewTheme = typeof aiFilePreviewTheme;
export type AIFilePreviewThemeProps = InferComponentTheme<AIFilePreviewTheme>;
export const setAIFilePreviewTheme = setComponentTheme<AIFilePreviewTheme>('ai-file-preview');
export const useAIFilePreviewTheme = useComponentTheme<AIFilePreviewTheme>(
	'aiFilePreview',
	aiFilePreviewTheme
);
