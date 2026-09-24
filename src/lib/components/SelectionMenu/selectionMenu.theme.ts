import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultSelectionMenuPopover = cva({
	base: 'bg-surface-floating max-w-[calc(100vw-1rem)] p-0 shadow-none ring-0'
});

const defaultSelectionMenuContent = cva({
	base: 'max-w-[calc(100vw-1rem)]'
});

export const selectionMenuTheme = {
	popover: defaultSelectionMenuPopover,
	content: defaultSelectionMenuContent
};

export type SelectionMenuTheme = typeof selectionMenuTheme;
export type SelectionMenuThemeProps = InferComponentTheme<SelectionMenuTheme>;
export const setSelectionMenuTheme = setComponentTheme<SelectionMenuTheme>('selection-menu');
export const useSelectionMenuTheme = useComponentTheme<SelectionMenuTheme>(
	'selectionMenu',
	selectionMenuTheme
);
