import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const defaultTableOfContentsRoot = cva({
	base: 'relative block min-w-0'
});

const defaultTableOfContentsScrollAreaViewport = cva({
	base: 'max-h-[calc(100dvh-2rem)] overscroll-contain'
});

const defaultTableOfContentsContent = cva({
	base: 'relative isolate min-w-0'
});

const defaultTableOfContentsList = cva({
	base: 'relative z-[1] flex min-w-0 list-none flex-col gap-[var(--table-of-contents-list-gap)]'
});

const defaultTableOfContentsItem = cva({
	base: 'relative min-w-0'
});

const defaultTableOfContentsLink = cva({
	base: 'text-neutral/60 hover:text-neutral block min-w-0 rounded-sm py-[var(--table-of-contents-link-padding)] pe-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-color/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
	variants: {
		size: {
			small: 'text-xs/5',
			normal: 'text-sm/6',
			large: 'text-base/7'
		},
		highlighted: {
			true: 'text-color-readable font-medium',
			false: null
		}
	},
	defaultVariants: {
		size: 'normal',
		highlighted: false
	}
});

const defaultTableOfContentsRail = cva({
	base: 'pointer-events-none absolute top-0 start-0 z-0 overflow-visible rtl:-scale-x-100'
});

const defaultTableOfContentsTrack = cva({
	base: 'stroke-neutral/15'
});

const defaultTableOfContentsActive = cva({
	base: 'text-color-readable stroke-current'
});

const defaultTableOfContentsMarker = cva({
	base: 'stroke-surface',
	variants: {
		highlighted: {
			true: 'text-color-readable fill-current',
			false: 'fill-neutral/15'
		}
	},
	defaultVariants: {
		highlighted: false
	}
});

export const tableOfContentsTheme = {
	root: defaultTableOfContentsRoot,
	scrollAreaViewport: defaultTableOfContentsScrollAreaViewport,
	content: defaultTableOfContentsContent,
	list: defaultTableOfContentsList,
	item: defaultTableOfContentsItem,
	link: defaultTableOfContentsLink,
	rail: defaultTableOfContentsRail,
	track: defaultTableOfContentsTrack,
	active: defaultTableOfContentsActive,
	marker: defaultTableOfContentsMarker
};

export type TableOfContentsTheme = typeof tableOfContentsTheme;
export type TableOfContentsThemeProps = InferComponentTheme<TableOfContentsTheme>;
export const setTableOfContentsTheme = setComponentTheme<TableOfContentsTheme>('table-of-contents');
export const useTableOfContentsTheme = useComponentTheme<TableOfContentsTheme>(
	'table-of-contents',
	tableOfContentsTheme
);
