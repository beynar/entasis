import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import type { ScrollAreaThemeProps } from '../ScrollArea/scrollArea.theme.js';

const root = cva({
	base: 'relative flex h-full min-h-0 w-full',
	variants: {
		size: { small: 'gap-md', normal: 'gap-lg', large: 'gap-xl' },
		position: {
			top: 'flex-col',
			bottom: 'flex-col-reverse',
			left: 'flex-row',
			right: 'flex-row-reverse'
		}
	},
	defaultVariants: { size: 'normal', position: 'top' }
});

const toolbar = cva({
	base: 'flex shrink-0 flex-wrap items-center border-neutral-muted',
	variants: {
		size: { small: 'gap-xs p-sm', normal: 'gap-sm p-md', large: 'gap-md p-md' },
		position: {
			top: 'flex-row border-b',
			bottom: 'flex-row border-t',
			left: 'flex-col border-r',
			right: 'flex-col border-l'
		}
	},
	defaultVariants: { size: 'normal', position: 'top' }
});

const pageInfo = cva({
	base: 'select-none px-md text-neutral/60 tabular-nums',
	variants: { size: { small: 'text-xs', normal: 'text-sm', large: 'text-base' } },
	defaultVariants: { size: 'normal' }
});

const viewer = cva({
	base: 'relative flex h-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-sm border border-neutral-muted',
	variants: {
		position: {
			top: 'flex-col',
			bottom: 'flex-col-reverse',
			left: 'flex-row',
			right: 'flex-row-reverse'
		}
	},
	defaultVariants: { position: 'top' }
});
const workspace = cva({ base: 'flex min-h-0 min-w-0 flex-1' });
const content = cva({ base: 'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden' });
const warning = cva({
	base: 'flex shrink-0 items-center gap-md border-b border-warning-muted bg-warning-muted px-lg py-md text-sm text-warning-readable'
});
const sidebar = cva({
	base: 'flex min-h-0 w-44 shrink-0 flex-col border-r border-neutral-muted p-md max-sm:absolute max-sm:inset-y-0 max-sm:left-0 max-sm:z-20 max-sm:shadow-lg'
});
const thumbnails = cva({ base: 'flex flex-col gap-md' });
const thumbnail = cva({
	base: 'state-layer flex w-full flex-col items-center gap-xs rounded-sm border border-transparent p-sm text-xs text-neutral/70 outline-none focus-visible:ring-2 focus-visible:ring-primary'
});
const thumbnailActive = cva({ base: 'border-primary bg-primary-muted text-primary-readable' });
const thumbnailPreview = cva({
	base: 'relative flex w-full items-start justify-center overflow-hidden rounded-sm bg-white p-xs text-left text-[5px] leading-tight text-black shadow-sm'
});
const thumbnailCanvas = cva({ base: 'block h-auto max-h-full max-w-full bg-white' });
const surface = cva({ base: 'relative min-h-0 min-w-0 flex-1' });
const pages = cva({
	base: 'flex gap-xl p-xl',
	variants: {
		orientation: { vertical: 'flex-col items-center', horizontal: 'w-max flex-row items-start' }
	},
	defaultVariants: { orientation: 'vertical' }
});
const single = cva({ base: 'grid h-full min-w-full place-items-center p-xl' });
const singlePage = cva({ base: 'relative [grid-area:1/1]' });
const scroller = cva({ base: 'h-full w-full' });
const page = cva({ base: 'relative shrink-0 overflow-hidden bg-white shadow-sm' });
const canvas = cva({ base: 'absolute top-0 left-0 z-[1] block' });
const pageError = cva({
	base: 'absolute inset-0 z-[4] flex items-center justify-center bg-surface-raised text-sm text-danger-readable'
});
const error = cva({
	base: 'flex h-full w-full items-center justify-center p-layout-md text-center text-sm text-danger-readable'
});
const skeleton = cva({ base: 'absolute inset-0 z-30 h-full w-full rounded-none' });
const search = cva({ base: 'flex items-center gap-xs' });
const searchInput = cva({
	base: 'min-w-0 flex-1 rounded-sm border border-neutral-muted bg-surface px-md py-xs text-sm outline-none focus:border-primary',
	variants: { size: { small: 'py-micro text-xs', normal: 'text-sm', large: 'text-base' } },
	defaultVariants: { size: 'normal' }
});
const searchCount = cva({
	base: 'min-w-12 select-none px-xs text-center text-xs text-neutral/60 tabular-nums'
});
const sheetTabs = cva({
	base: 'flex shrink-0 items-center gap-xs overflow-x-auto border-t border-neutral-muted px-md py-xs'
});
const sheetTab = cva({
	base: 'state-layer shrink-0 rounded-sm px-lg py-sm text-xs text-neutral/70 outline-none focus-visible:ring-2 focus-visible:ring-primary'
});
const sheetTabActive = cva({ base: 'bg-primary-muted text-primary-readable' });
const grid = cva({ base: 'relative h-full w-full bg-surface text-sm' });
const gridCell = cva({
	base: 'absolute overflow-hidden border-r border-b border-neutral-muted bg-surface px-md py-xs whitespace-nowrap text-neutral'
});
const gridHeader = cva({
	base: 'absolute z-10 flex items-center justify-center border-r border-b border-neutral-muted bg-surface-raised text-xs text-neutral/60'
});
const legacyPage = cva({
	base: 'shrink-0 overflow-hidden bg-white p-layout-xl whitespace-pre-wrap text-black shadow-sm'
});
const ooxmlPage = cva({ base: 'relative inline-block shrink-0 bg-white shadow-sm' });
const ooxmlCanvas = cva({ base: 'block' });
const ooxmlTextLayer = cva({ base: 'absolute inset-0 z-[2] h-full w-full overflow-hidden' });

export const documentViewerTheme = {
	root,
	toolbar,
	pageInfo,
	viewer,
	workspace,
	content,
	warning,
	sidebar,
	thumbnails,
	thumbnail,
	thumbnailActive,
	thumbnailPreview,
	thumbnailCanvas,
	surface,
	pages,
	single,
	singlePage,
	scroller,
	page,
	canvas,
	pageError,
	error,
	skeleton,
	search,
	searchInput,
	searchCount,
	sheetTabs,
	sheetTab,
	sheetTabActive,
	grid,
	gridCell,
	gridHeader,
	legacyPage,
	ooxmlPage,
	ooxmlCanvas,
	ooxmlTextLayer
};

export const documentViewerScrollAreaTheme = {
	content: { base: 'h-full' }
} satisfies ScrollAreaThemeProps;

export type DocumentViewerTheme = typeof documentViewerTheme;
export type DocumentViewerThemeProps = InferComponentTheme<DocumentViewerTheme>;
export const setDocumentViewerTheme = setComponentTheme<DocumentViewerTheme>('documentViewer');
export const useDocumentViewerTheme = useComponentTheme<DocumentViewerTheme>(
	'documentViewer',
	documentViewerTheme
);
