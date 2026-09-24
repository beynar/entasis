import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultToggleMenuRoot = cva({
	base: 'border-neutral-muted bg-neutral-muted/40 relative inline-flex max-w-full items-center gap-xs rounded-md border p-xs'
});

const defaultToggleMenuRail = cva({
	base: 'flex min-w-0 items-center gap-md overflow-hidden whitespace-nowrap'
});

const defaultToggleMenuUnit = cva({
	base: 'shrink-0 data-[overflowed=true]:pointer-events-none data-[overflowed=true]:invisible'
});

const defaultToggleMenuMore = cva({
	base: 'shrink-0 data-[overflow=false]:pointer-events-none data-[overflow=false]:absolute data-[overflow=false]:right-1 data-[overflow=false]:invisible'
});

export const toggleMenuTheme = {
	root: defaultToggleMenuRoot,
	rail: defaultToggleMenuRail,
	unit: defaultToggleMenuUnit,
	more: defaultToggleMenuMore
};

export type ToggleMenuTheme = typeof toggleMenuTheme;
export type ToggleMenuThemeProps = InferComponentTheme<ToggleMenuTheme>;
export const setToggleMenuTheme = setComponentTheme<ToggleMenuTheme>('toggle-menu');
export const useToggleMenuTheme = useComponentTheme<ToggleMenuTheme>('toggle-menu', toggleMenuTheme);
