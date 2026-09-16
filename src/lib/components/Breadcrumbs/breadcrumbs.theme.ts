import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

// No `@container` here: the trail is inline-sized in practice — `PageShellHeader` renders it as a
// flex item next to the back button, so it is sized by its own content and inline-size containment
// would collapse it to nothing. The gap is therefore a single unconditional value instead of a
// responsive one; the link padding and the caret separator carry the rhythm at every width.
const defaultBreadcrumbsContainer = cva({
	base: 'text-neutral/70 flex flex-wrap items-center gap-sm text-sm break-words',
	variants: {},
	defaultVariants: {}
});

const defaultBreadcrumbsItem = cva({
	base: 'inline-flex items-center gap-sm',
	variants: {
		disabled: {
			true: 'text-neutral/70 cursor-not-allowed *:pointer-events-none',
			false: 'cursor-pointer'
		},
		active: {
			true: 'text-neutral font-normal cursor-auto',
			false: 'hover:text-neutral'
		}
	},
	defaultVariants: {}
});

const defaultBreadcrumbsLink = cva({
	base: 'px-md py-micro  outline-none focus-visible:ring-1 focus-visible:ring-focus/50 focus-visible:ring-offset-1 ring-offset-surface rounded-sm',
	variants: {
		disabled: {
			true: '',
			false: ''
		},
		active: {
			true: 'text-neutral font-normal',
			false: ''
		}
	},
	defaultVariants: {
		disabled: false
	}
});

const defaultBreadcrumbsSeparator = cva({
	base: 'flex items-center text-neutral/70 [&>svg]:size-icon-sm',
	variants: {},
	defaultVariants: {}
});

const defaultBreadcrumbsEllipsis = cva({
	base: 'flex items-end justify-center',
	variants: {},
	defaultVariants: {}
});

const defaultBreadcrumbsIcon = cva({
	base: 'flex-shrink-0',
	variants: {
		size: {
			small: 'w-3 h-3',
			normal: 'w-4 h-4',
			large: 'w-5 h-5'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const breadcrumbsTheme = {
	root: defaultBreadcrumbsContainer,
	item: defaultBreadcrumbsItem,
	link: defaultBreadcrumbsLink,

	separator: defaultBreadcrumbsSeparator,
	ellipsis: defaultBreadcrumbsEllipsis,
	icon: defaultBreadcrumbsIcon
};

export type BreadcrumbsTheme = typeof breadcrumbsTheme;
export type BreadcrumbsThemeProps = InferComponentTheme<BreadcrumbsTheme>;
export const setBreadcrumbsTheme = setComponentTheme<BreadcrumbsTheme>('breadcrumbs');
export const useBreadcrumbsTheme = useComponentTheme<BreadcrumbsTheme>(
	'breadcrumbs',
	breadcrumbsTheme
);
