import type { DialogThemeProps } from '../Dialog/dialog.theme.js';

export const commandDialogTheme = {
	align: { type: { modal: 'items-start pt-[15vh]' } },
	content: {
		base: 'rounded-lg p-0 overflow-hidden',
		type: { drawerBottom: 'h-[min(70dvh,23rem)] [&>div]:h-full' }
	},
	header: { base: 'sr-only' },
	closeButton: { base: 'hidden' }
} satisfies DialogThemeProps;
