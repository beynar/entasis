import type { AIFilePreviewThemeProps } from '../AIFilePreview/aiFilePreview.theme.js';

export const aiThreadTocPreviewFileTheme = {
	preview: { base: 'size-4 rounded-sm' },
	fallback: { base: 'size-4 bg-transparent text-neutral/45' },
	content: { base: 'min-w-0' },
	name: { base: 'text-xs font-normal text-neutral/70' },
	meta: { base: 'hidden' },
	error: { base: 'hidden' }
} satisfies AIFilePreviewThemeProps;
