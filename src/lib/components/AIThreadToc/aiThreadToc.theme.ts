import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const defaultRoot = cva({
	base: 'pointer-events-auto relative h-full max-h-[80%] min-h-24 w-10 shrink-0 self-center overflow-visible',
	variants: { side: { left: 'order-first', right: 'order-last' } },
	defaultVariants: { side: 'left' }
});
const defaultScrollArea = cva({ base: 'h-full w-full overflow-visible' });
const defaultScrollContent = cva({ base: 'flex min-h-full w-full items-center' });
const defaultTrack = cva({
	base: 'relative w-full shrink-0 cursor-default overflow-visible'
});
const defaultPinArea = cva({ base: 'absolute inset-x-0 top-3 bottom-3' });
const defaultRail = cva({
	base: 'pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 rounded-full'
});
const defaultViewport = cva({
	base: 'absolute left-1/2 min-h-2 w-1 -translate-x-1/2 rounded-full'
});
const defaultPin = cva({
	base: 'group absolute left-0 flex h-[5px] w-full -translate-y-1/2 cursor-default items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
	variants: {
		side: {
			left: 'justify-start',
			right: 'justify-end'
		},
		active: {
			true: null,
			false: null
		}
	},
	defaultVariants: { side: 'left', active: false }
});
const defaultPinIndicator = cva({
	base: 'h-0.5 w-3 rounded-full bg-neutral [opacity:var(--ai-thread-toc-opacity)] [transform:scaleX(var(--ai-thread-toc-scale))] motion-safe:transition-[opacity,transform] motion-safe:duration-100 motion-safe:ease-out',
	variants: {
		side: {
			left: 'origin-left',
			right: 'origin-right'
		}
	},
	defaultVariants: { side: 'left' }
});
const defaultPreviewAnchor = cva({
	base: 'pointer-events-none absolute top-[var(--ai-thread-toc-preview-top)] z-10 flex h-[5px] w-7 -translate-y-1/2 opacity-0',
	variants: {
		side: {
			left: 'left-0',
			right: 'right-0'
		}
	},
	defaultVariants: { side: 'left' }
});
const defaultPreview = cva({
	base: 'grid min-w-0 gap-sm overflow-hidden text-left'
});
const defaultPreviewHeader = cva({ base: 'flex min-w-0 items-start gap-md' });
const defaultPreviewIcon = cva({
	base: 'mt-micro flex size-6 shrink-0 items-center justify-center rounded-sm border border-neutral-muted bg-surface text-neutral/60'
});
const defaultPreviewTitle = cva({ base: 'truncate text-sm font-medium leading-tight' });
const defaultPreviewExcerpt = cva({
	base: 'line-clamp-4 text-xs leading-relaxed text-neutral/65'
});
const defaultPreviewMetadata = cva({ base: 'truncate text-xs text-neutral/55' });
const defaultPreviewFiles = cva({
	base: 'flex min-w-0 flex-wrap items-center gap-x-lg gap-y-xs pt-micro'
});

export const aiThreadTocTheme = {
	root: defaultRoot,
	scrollArea: defaultScrollArea,
	scrollContent: defaultScrollContent,
	track: defaultTrack,
	pinArea: defaultPinArea,
	rail: defaultRail,
	viewport: defaultViewport,
	pin: defaultPin,
	pinIndicator: defaultPinIndicator,
	previewAnchor: defaultPreviewAnchor,
	preview: defaultPreview,
	previewHeader: defaultPreviewHeader,
	previewIcon: defaultPreviewIcon,
	previewTitle: defaultPreviewTitle,
	previewExcerpt: defaultPreviewExcerpt,
	previewMetadata: defaultPreviewMetadata,
	previewFiles: defaultPreviewFiles
};

export type AIThreadTocTheme = typeof aiThreadTocTheme;
export type AIThreadTocThemeProps = InferComponentTheme<AIThreadTocTheme>;
export const setAIThreadTocTheme = setComponentTheme<AIThreadTocTheme>('aiThreadToc');
export const useAIThreadTocTheme = useComponentTheme<AIThreadTocTheme>(
	'aiThreadToc',
	aiThreadTocTheme
);
