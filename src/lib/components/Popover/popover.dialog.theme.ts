import type { DialogThemeProps } from '../Dialog/dialog.theme.js';

export function getPopoverDialogTheme(contentClass: string): DialogThemeProps {
	return {
		content: { base: contentClass },
		closeButton: { base: 'hidden' }
	};
}
