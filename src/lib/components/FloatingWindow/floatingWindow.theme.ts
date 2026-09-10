import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultFloatingWindow = cva({
	base: 'bg-surface-floating text-neutral pointer-events-auto fixed isolate flex flex-col overflow-visible rounded-lg shadow-xl ring-1 ring-neutral/15 outline-none focus-visible:ring-2 focus-visible:ring-primary',
	variants: {
		dragFrom: {
			header: '',
			window: 'cursor-move'
		},
		dragging: {
			true: 'select-none shadow-2xl transition-none',
			false: 'transition-[box-shadow] duration-150'
		},
		resizing: {
			true: 'select-none shadow-2xl transition-none',
			false: ''
		}
	},
	defaultVariants: {
		dragFrom: 'header',
		dragging: false,
		resizing: false
	}
});

const defaultFloatingWindowHeader = cva({
	base: 'border-neutral-muted flex h-9 shrink-0 items-center gap-sm border-b px-md select-none',
	variants: {
		draggable: {
			true: 'cursor-move touch-none',
			false: ''
		}
	},
	defaultVariants: {
		draggable: true
	}
});

const defaultFloatingWindowTitle = cva({
	base: 'min-w-0 flex-1 truncate text-sm font-medium'
});

const defaultFloatingWindowActions = cva({
	base: 'flex shrink-0 items-center gap-micro'
});

const defaultFloatingWindowControl = cva({
	base: 'shrink-0 !p-sm text-neutral/65 hover:text-neutral'
});

const defaultFloatingWindowScrollArea = cva({
	base: 'min-h-0 flex-1'
});

const defaultFloatingWindowContent = cva({
	base: 'p-xl'
});

const defaultFloatingWindowResizeHandle = cva({
	base: 'absolute z-20 touch-none outline-none after:absolute after:rounded-full after:bg-neutral/25 after:opacity-0 after:transition-opacity hover:after:opacity-100 focus-visible:after:bg-primary focus-visible:after:opacity-100',
	variants: {
		direction: {
			north:
				'-top-1.5 right-3 left-3 h-3 cursor-ns-resize after:top-1.5 after:right-3 after:left-3 after:h-0.5',
			northEast: '-top-2.5 -right-2.5 z-30 size-6 cursor-nesw-resize',
			east: 'top-3 -right-1.5 bottom-3 w-3 cursor-ew-resize after:top-3 after:right-1.5 after:bottom-3 after:w-0.5',
			southEast: '-right-2.5 -bottom-2.5 z-30 size-6 cursor-nwse-resize',
			south:
				'-bottom-1.5 right-3 left-3 h-3 cursor-ns-resize after:right-3 after:bottom-1.5 after:left-3 after:h-0.5',
			southWest: '-bottom-2.5 -left-2.5 z-30 size-6 cursor-nesw-resize',
			west: 'top-3 bottom-3 -left-1.5 w-3 cursor-ew-resize after:top-3 after:bottom-3 after:left-1.5 after:w-0.5',
			northWest: '-top-2.5 -left-2.5 z-30 size-6 cursor-nwse-resize'
		}
	}
});

const defaultFloatingWindowDockItem = cva({
	base: 'bg-surface-floating text-neutral pointer-events-auto fixed flex touch-none items-center overflow-hidden shadow-lg ring-1 ring-neutral/15',
	variants: {
		orientation: {
			horizontal: 'h-9 flex-row',
			vertical: 'w-9 flex-col'
		},
		side: {
			top: 'rounded-t-none rounded-b-md',
			right: 'rounded-r-none rounded-l-md',
			bottom: 'rounded-t-md rounded-b-none',
			left: 'rounded-r-md rounded-l-none'
		},
		dragging: {
			true: 'cursor-grabbing select-none',
			false: 'cursor-grab transition-[top,left,box-shadow] duration-200'
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		side: 'bottom',
		dragging: false
	}
});

const defaultFloatingWindowDockTitle = cva({
	base: '!min-w-0 !flex-1 !rounded-none !text-xs !font-medium',
	variants: {
		orientation: {
			horizontal: '!h-full !w-auto !justify-start !px-md !text-left',
			vertical: '!h-auto !min-h-0 !w-full !px-0 !py-md'
		},
		dragging: {
			true: '!cursor-grabbing',
			false: '!cursor-grab'
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		dragging: false
	}
});

const defaultFloatingWindowDockTitleText = cva({
	base: 'block max-w-full overflow-hidden text-ellipsis whitespace-nowrap',
	variants: {
		side: {
			top: '',
			right: '[writing-mode:vertical-rl]',
			bottom: '',
			left: 'rotate-180 [writing-mode:vertical-rl]'
		}
	},
	defaultVariants: {
		side: 'bottom'
	}
});

const defaultFloatingWindowDockActions = cva({
	base: 'flex shrink-0 items-center gap-0',
	variants: {
		orientation: {
			horizontal: 'flex-row pr-xs',
			vertical: 'flex-col pb-xs'
		}
	},
	defaultVariants: {
		orientation: 'horizontal'
	}
});

export const floatingWindowTheme = {
	root: defaultFloatingWindow,
	header: defaultFloatingWindowHeader,
	title: defaultFloatingWindowTitle,
	actions: defaultFloatingWindowActions,
	control: defaultFloatingWindowControl,
	scrollArea: defaultFloatingWindowScrollArea,
	content: defaultFloatingWindowContent,
	resizeHandle: defaultFloatingWindowResizeHandle,
	dockItem: defaultFloatingWindowDockItem,
	dockTitle: defaultFloatingWindowDockTitle,
	dockTitleText: defaultFloatingWindowDockTitleText,
	dockActions: defaultFloatingWindowDockActions
};

export type FloatingWindowTheme = typeof floatingWindowTheme;
export type FloatingWindowThemeProps = InferComponentTheme<FloatingWindowTheme>;
export const setFloatingWindowTheme = setComponentTheme<FloatingWindowTheme>('floating-window');
export const useFloatingWindowTheme = useComponentTheme<FloatingWindowTheme>(
	'floating-window',
	floatingWindowTheme
);
