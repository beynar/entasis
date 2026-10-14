import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// The wrapper around the right-click target. Layout-neutral by default (the target owns
// its own box); `display: contents` is the usual override when the wrapper must disappear
// from a grid or flex parent. While the menu is enabled iOS Safari's own long-press callout
// stays off, so the long-press that opens the menu is not met by a second system menu.
const defaultContextMenuRoot = cva({
	base: '',
	variants: {
		disabled: {
			true: '',
			false: '[-webkit-touch-callout:none]'
		}
	},
	defaultVariants: {
		disabled: false
	}
});

// The popover panel the menu is rendered in, layered over PopupMenu's own panel slot.
const defaultContextMenuPanel = cva({
	base: ''
});

export const contextMenuTheme = {
	root: defaultContextMenuRoot,
	panel: defaultContextMenuPanel
};

export type ContextMenuTheme = typeof contextMenuTheme;
export type ContextMenuThemeProps = InferComponentTheme<ContextMenuTheme>;
export const setContextMenuTheme = setComponentTheme<ContextMenuTheme>('context-menu');
export const useContextMenuTheme = useComponentTheme<ContextMenuTheme>(
	'context-menu',
	contextMenuTheme
);
