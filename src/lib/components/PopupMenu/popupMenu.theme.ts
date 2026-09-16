import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// PopupMenu composes Popover + Menu, which own their own themes. This slot is the one
// surface PopupMenu styles itself: the popover panel holding the menu. A menu-appropriate
// min-width keeps short-label menus (context menus, overflow menus) from collapsing to
// their content; it is overridable because Popover runs the result through tailwind-merge,
// where the consumer `class` lands last and wins.
const defaultPopupMenuPanel = cva({
	base: 'min-w-44'
});

export const popupMenuTheme = {
	panel: defaultPopupMenuPanel
};

export type PopupMenuTheme = typeof popupMenuTheme;
export type PopupMenuThemeProps = InferComponentTheme<PopupMenuTheme>;
export const setPopupMenuTheme = setComponentTheme<PopupMenuTheme>('popup-menu');
export const usePopupMenuTheme = useComponentTheme<PopupMenuTheme>('popup-menu', popupMenuTheme);
