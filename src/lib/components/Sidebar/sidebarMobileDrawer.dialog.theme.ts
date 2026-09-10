import type { DialogThemeProps } from '../Dialog/dialog.theme.js';

export const sidebarMobileDrawerDialogTheme = {
	override: true,
	content: {
		base: 'relative z-50 flex h-full max-h-full flex-col overflow-hidden rounded-none bg-surface-floating p-0 text-neutral shadow-xl will-change-transform transition-transform duration-200 ease-out [&>div]:h-full [&>div]:min-h-0'
	},
	header: {
		base: 'sr-only'
	},
	title: {
		base: 'sr-only'
	},
	closeButton: {
		base: 'hidden'
	}
} satisfies DialogThemeProps;
