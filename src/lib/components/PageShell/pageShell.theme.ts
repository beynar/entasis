import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultShell = cva({
	base: 'flex min-h-full w-full flex-col overflow-clip rounded-[inherit] bg-surface !bg-[var(--page-shell-surface,var(--color-surface))] text-neutral'
});

const defaultHeader = cva({
	base: 'sticky top-[calc(var(--page-shell-edge-inset,0px)_+_var(--page-shell-chrome-block-gap,0px))] z-20 mx-[var(--page-shell-chrome-inline-gap,0px)] mt-[var(--page-shell-chrome-block-gap,0px)] mb-[var(--page-shell-chrome-block-gap,0px)] shrink-0 rounded-tl-[var(--page-shell-header-top-radius,inherit)] rounded-tr-[var(--page-shell-header-top-radius,inherit)] rounded-br-[var(--page-shell-header-bottom-radius,0px)] rounded-bl-[var(--page-shell-header-bottom-radius,0px)] border-b [border-bottom-color:var(--page-shell-chrome-divider,var(--color-neutral-muted))] bg-[var(--page-shell-chrome,var(--color-surface))] shadow-[var(--page-shell-chrome-shadow,none)] ring-1 ring-inset ring-[var(--page-shell-chrome-border,transparent)] backdrop-blur'
});

// The row wraps: the title keeps its natural width and the actions drop under it when they do not
// fit, instead of the title being squeezed to an ellipsis by a wide actions block.
const defaultHeaderInner = cva({
	base: 'flex min-h-row-lg flex-wrap items-center justify-between gap-x-lg gap-y-md px-lg py-md md:px-xl'
});

// `grow` (basis auto), not `flex-1` (basis 0): the stack must keep its content width so the flex
// line wraps before the title is shrunk.
const defaultTitleStack = cva({
	base: 'grid min-w-0 grow gap-micro'
});

const defaultMeta = cva({
	base: 'flex min-w-0 items-center gap-sm text-xs leading-4 text-neutral/70'
});

const defaultBack = cva({
	base: 'inline-flex size-5 shrink-0 items-center justify-center rounded-sm'
});

const defaultBreadcrumbs = cva({
	base: 'min-w-0 gap-sm text-xs sm:gap-md'
});

const defaultEyebrow = cva({
	base: 'truncate text-xs leading-4 font-medium tracking-normal text-neutral/70 uppercase'
});

const defaultTitle = cva({
	base: 'truncate text-sm leading-5 font-semibold text-neutral'
});

const defaultSubtitle = cva({
	base: 'truncate text-xs leading-4 text-neutral/70'
});

const defaultActions = cva({
	base: 'flex shrink-0 items-center justify-end gap-sm'
});

const defaultContent = cva({
	base: 'flex-1'
});

const defaultContentInner = cva({
	base: 'w-full',
	variants: {
		padding: {
			none: '',
			small: 'p-lg',
			normal: 'p-xl md:p-layout-md',
			large: 'p-layout-md md:p-layout-lg'
		},
		width: {
			full: '',
			narrow: 'mx-auto max-w-3xl',
			normal: 'mx-auto max-w-5xl',
			wide: 'mx-auto max-w-7xl',
			prose: 'mx-auto max-w-3xl'
		}
	},
	defaultVariants: {
		padding: 'none',
		width: 'full'
	}
});

const defaultFooter = cva({
	base: 'sticky bottom-[calc(var(--page-shell-edge-inset,0px)_+_var(--page-shell-chrome-block-gap,0px))] z-20 mx-[var(--page-shell-chrome-inline-gap,0px)] mt-[var(--page-shell-chrome-block-gap,0px)] mb-[var(--page-shell-chrome-block-gap,0px)] shrink-0 rounded-tl-[var(--page-shell-footer-top-radius,0px)] rounded-tr-[var(--page-shell-footer-top-radius,0px)] rounded-br-[var(--page-shell-footer-bottom-radius,inherit)] rounded-bl-[var(--page-shell-footer-bottom-radius,inherit)] border-t [border-top-color:var(--page-shell-chrome-divider,var(--color-neutral-muted))] bg-[var(--page-shell-chrome,var(--color-surface))] shadow-[var(--page-shell-chrome-shadow,none)] ring-1 ring-inset ring-[var(--page-shell-chrome-border,transparent)] backdrop-blur'
});

const defaultFooterInner = cva({
	base: 'flex min-h-row-lg items-center justify-between gap-lg px-xl py-md text-sm text-neutral/70'
});

const defaultFooterContent = cva({
	base: 'min-w-0 flex-1'
});

const defaultInlineActions = cva({
	base: 'hidden shrink-0 items-center justify-end gap-md md:flex'
});

const defaultMobileActions = cva({
	base: 'flex shrink-0 items-center justify-end gap-md md:hidden'
});

const defaultOverflowTrigger = cva({
	base: 'md:hidden'
});

export const pageShellTheme = {
	root: defaultShell,
	header: defaultHeader,
	headerInner: defaultHeaderInner,
	meta: defaultMeta,
	back: defaultBack,
	breadcrumbs: defaultBreadcrumbs,
	eyebrow: defaultEyebrow,
	titleStack: defaultTitleStack,
	title: defaultTitle,
	subtitle: defaultSubtitle,
	actions: defaultActions,
	content: defaultContent,
	contentInner: defaultContentInner,
	footer: defaultFooter,
	footerInner: defaultFooterInner,
	footerContent: defaultFooterContent,
	inlineActions: defaultInlineActions,
	mobileActions: defaultMobileActions,
	overflowTrigger: defaultOverflowTrigger
};

export type PageShellTheme = typeof pageShellTheme;
export type PageShellThemeProps = InferComponentTheme<PageShellTheme>;
export const setPageShellTheme = setComponentTheme<PageShellTheme>('page-shell');
export const usePageShellTheme = useComponentTheme<PageShellTheme>('page-shell', pageShellTheme);
