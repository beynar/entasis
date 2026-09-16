import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultRoot = cva({
	base: 'relative h-[var(--window-height,100dvh)] min-h-0 w-full overflow-hidden text-neutral',
	variants: {
		// `framed` is the only treatment where the shell itself is a card: the root paints the
		// canvas the card floats on, and `frame` below draws the card around sidebar and page.
		variant: {
			admin: '',
			floating: '',
			inset: '',
			split: '',
			framed: 'bg-surface-canvas p-md'
		}
	},
	defaultVariants: {
		variant: 'admin'
	}
});

// One rounded app card holding the sidebar and the page. Every other variant is `contents`, so
// the sidebar stays a direct child of the root and the existing layouts are untouched.
const defaultFrame = cva({
	variants: {
		variant: {
			admin: 'contents',
			floating: 'contents',
			inset: 'contents',
			split: 'contents',
			framed: 'relative flex h-full min-h-0 w-full overflow-hidden rounded-xl bg-surface raised-1'
		}
	},
	defaultVariants: {
		variant: 'admin'
	}
});

// The `--page-shell-*` properties below are INTERNAL: they are how each variant hands its
// chrome surface, gaps, radii, border and shadow down to the header and footer parts. A
// consumer picks a variant or overrides the part's theme, never declares one of these.
const defaultPage = cva({
	base: 'h-full min-h-0 [&>[data-slot=page-shell-content]]:min-h-0 [&>[data-slot=page-shell-content]]:overflow-y-auto [&>[data-slot=page-shell-content]]:overscroll-contain [&>[data-slot=page-shell-footer]]:static [&>[data-slot=page-shell-header]]:static',
	variants: {
		variant: {
			admin:
				'bg-surface [--page-shell-chrome:var(--color-surface-canvas)] [--page-shell-surface:var(--color-surface)]',
			floating:
				'bg-surface-canvas [--page-shell-chrome:var(--color-surface)] [--page-shell-surface:var(--color-surface-canvas)] [--page-shell-chrome-inline-gap:0.5rem] [--page-shell-chrome-block-gap:0.5rem] [--page-shell-header-top-radius:var(--radius-lg)] [--page-shell-header-bottom-radius:var(--radius-lg)] [--page-shell-footer-top-radius:var(--radius-lg)] [--page-shell-footer-bottom-radius:var(--radius-lg)] [--page-shell-chrome-border:var(--color-neutral-muted)] [--page-shell-chrome-shadow:var(--elevation-1)]',
			inset:
				'bg-surface [--page-shell-chrome:var(--color-surface)] [--page-shell-surface:var(--color-surface)] transition-[border-color,box-shadow] md:raised-1 md:group-data-[display-state=hidden]/sidebar-wrapper:border-transparent md:group-data-[display-state=hidden]/sidebar-wrapper:shadow-none',
			split:
				'bg-surface [--page-shell-chrome:var(--color-surface)] [--page-shell-surface:var(--color-surface)] transition-[border-color,box-shadow] md:raised-1 md:group-data-[display-state=hidden]/sidebar-wrapper:border-transparent md:group-data-[display-state=hidden]/sidebar-wrapper:shadow-none',
			// The frame already owns the radius, border and elevation, so the page inside it is flat,
			// and its header chrome is the same surface as the content: the white column is one
			// piece whose only corners are the frame's own.
			framed:
				'bg-surface [--page-shell-chrome:var(--color-surface)] [--page-shell-surface:var(--color-surface)]'
		},
		side: {
			left: '',
			right: ''
		}
	},
	defaultVariants: {
		variant: 'admin',
		side: 'left'
	}
});

export const appShellTheme = {
	root: defaultRoot,
	frame: defaultFrame,
	page: defaultPage
};

export type AppShellTheme = typeof appShellTheme;
export type AppShellThemeProps = InferComponentTheme<AppShellTheme>;
export const setAppShellTheme = setComponentTheme<AppShellTheme>('app-shell');
export const useAppShellTheme = useComponentTheme<AppShellTheme>('app-shell', appShellTheme);
