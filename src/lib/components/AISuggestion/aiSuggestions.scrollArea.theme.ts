import type { ScrollAreaThemeProps } from '../ScrollArea/scrollArea.theme.js';
import { cx } from '$lib/utils/cva/index.js';

export function getAISuggestionsScrollAreaTheme(
	theme?: ScrollAreaThemeProps
): ScrollAreaThemeProps {
	return {
		...theme,
		scrollbarX: {
			...theme?.scrollbarX,
			base: cx('!hidden', theme?.scrollbarX?.base)
		}
	};
}
