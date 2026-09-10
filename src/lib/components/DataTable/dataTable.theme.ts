import {
	cva,
	setComponentTheme,
	type InferComponentTheme,
	useComponentTheme
} from '$lib/utils/cva/index.js';

const root = cva({
	base: 'relative flex min-w-0 flex-col gap-lg',
	variants: {
		fill: {
			true: 'h-full min-h-0',
			false: ''
		}
	},
	defaultVariants: { fill: false }
});
const toolbar = cva({
	base: 'flex min-w-0 flex-wrap items-center justify-between gap-md'
});
const toolbarGroup = cva({ base: 'flex min-w-0 flex-wrap items-center gap-md' });
const search = cva({ base: 'w-full sm:w-64' });
const viewport = cva({
	base: 'relative isolate overflow-hidden rounded-sm border border-neutral-muted bg-surface [container-type:inline-size]',
	variants: {
		fill: {
			true: 'min-h-0 flex-1',
			false: ''
		}
	},
	defaultVariants: { fill: false }
});
const savingIndicator = cva({ base: '!absolute !z-30 !rounded-none' });
const scrollArea = cva({ base: 'h-full' });
const virtualTable = cva({ base: 'grid min-w-full table-fixed text-sm' });
const caption = cva({
	base: 'text-sm text-neutral/60',
	variants: {
		density: { small: 'mt-lg', normal: 'mt-xl', large: 'mt-layout-md' }
	},
	defaultVariants: { density: 'normal' }
});
const header = cva({
	base: 'z-20 grid bg-surface-raised'
});
const headerRow = cva({ base: 'grid border-b border-neutral-muted bg-surface-raised' });
const headerCell = cva({
	base: 'group/data-table-header relative flex min-w-0 items-center gap-xs overflow-visible border-neutral-muted font-medium whitespace-nowrap',
	variants: {
		density: {
			small: 'h-8 px-sm',
			normal: 'h-10 px-md',
			large: 'h-12 px-lg'
		},
		align: {
			start: 'justify-start text-left',
			center: 'justify-center text-center',
			end: 'justify-end text-right'
		},
		pinned: { true: 'z-30 bg-surface-raised', false: '' }
	},
	defaultVariants: { density: 'normal', align: 'start', pinned: false }
});
const headerContent = cva({
	base: 'flex min-w-0 flex-1 items-center gap-xs'
});
const headerButton = cva({
	base: 'flex min-w-0 flex-1 items-center gap-xs rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary [&_svg]:size-3.5 [&_svg]:shrink-0'
});
const headerLabel = cva({ base: 'truncate' });
const headerActions = cva({ base: 'ml-auto flex shrink-0 items-center' });
const headerMenuPanel = cva({
	base: 'w-full max-w-none sm:w-72 sm:max-w-[calc(100vw-2rem)]'
});
const headerMenuButton = cva({
	base: 'pointer-events-none opacity-0 group-hover/data-table-header:pointer-events-auto group-hover/data-table-header:opacity-100 group-focus-within/data-table-header:pointer-events-auto group-focus-within/data-table-header:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100',
	variants: {
		active: {
			true: 'pointer-events-auto opacity-100',
			false: ''
		}
	},
	defaultVariants: { active: false }
});
const dragHandle = cva({
	base: 'pointer-events-none absolute -top-1.5 start-1/2 z-30 grid h-4 w-8 -translate-x-1/2 cursor-grab place-items-center text-neutral/60 opacity-0 outline-none transition-[color,opacity] group-hover/data-table-header:pointer-events-auto group-hover/data-table-header:opacity-100 hover:text-neutral focus-visible:pointer-events-auto focus-visible:text-primary-readable focus-visible:opacity-100 active:cursor-grabbing disabled:pointer-events-none'
});
const dragThumb = cva({
	base: 'h-1 w-5 rounded-full bg-current shadow-[0_0_0_1px_var(--color-surface)]'
});
const resizeHandle = cva({
	base: 'absolute inset-y-1 end-0 z-40 w-1 cursor-col-resize touch-none rounded-full outline-none hover:bg-primary focus-visible:bg-primary data-[resizing=true]:bg-primary'
});
const body = cva({ base: 'relative z-0 grid' });
const row = cva({
	base: 'state-layer grid min-w-full border-b border-neutral-muted transition-colors last:border-b-0 data-[selected=true]:bg-primary-muted/40',
	variants: {
		density: { small: 'min-h-8', normal: 'min-h-10', large: 'min-h-12' },
		grouped: { true: 'bg-surface-raised font-medium', false: '' }
	},
	defaultVariants: { density: 'normal', grouped: false }
});
const cell = cva({
	base: 'relative flex min-w-0 items-center overflow-hidden border-neutral-muted outline-none',
	variants: {
		density: {
			small: 'min-h-8 px-sm py-xs',
			normal: 'min-h-10 p-md',
			large: 'min-h-12 p-lg'
		},
		align: {
			start: 'justify-start text-left',
			center: 'justify-center text-center',
			end: 'justify-end text-right'
		},
		pinned: { true: 'z-10 bg-surface', false: '' },
		focused: {
			true: 'z-20 bg-primary-muted/20 ring-2 ring-inset ring-primary/70',
			false: ''
		},
		editing: { true: 'overflow-visible p-0 ring-1 ring-inset ring-primary', false: '' }
	},
	defaultVariants: {
		density: 'normal',
		align: 'start',
		pinned: false,
		focused: false,
		editing: false
	}
});
const cellContent = cva({ base: 'min-w-0 truncate' });
const selectionCell = cva({ base: 'p-0' });
const selectionCheckboxRoot = cva({ base: 'h-full w-full' });
const selectionCheckboxContainer = cva({ base: '!h-full !w-full' });
const selectionCheckboxControl = cva({
	base: '!h-full !w-full !min-h-0 !rounded-none focus:ring-inset focus:ring-offset-0'
});
const selectionCheckboxIndicator = cva({ base: '!size-4 !rounded-sm' });
const actionsCell = cva({ base: 'p-0 [&>*]:h-full [&>*]:w-full [&>*]:rounded-none' });
const detailRow = cva({
	base: 'grid min-w-full border-b border-neutral-muted bg-surface-raised/50'
});
const detailCell = cva({
	base: 'min-w-0 overflow-hidden',
	variants: {
		density: {
			small: 'px-layout-lg py-md',
			normal: 'px-layout-lg py-lg',
			large: 'px-layout-xl py-xl'
		}
	},
	defaultVariants: { density: 'normal' }
});
const spacer = cva({ base: 'pointer-events-none grid border-0' });
const expander = cva({ base: 'mr-xs shrink-0' });
const groupValue = cva({ base: 'min-w-0 truncate' });
const groupCount = cva({ base: 'ml-xs text-xs font-normal text-neutral/60' });
const pinnedBoundary = cva({
	base: 'after:pointer-events-none after:absolute after:inset-y-0 after:w-px after:bg-neutral-muted',
	variants: {
		side: {
			left: 'after:end-0 after:shadow-[2px_0_4px_color-mix(in_oklab,var(--color-neutral)_10%,transparent)] rtl:after:shadow-[-2px_0_4px_color-mix(in_oklab,var(--color-neutral)_10%,transparent)]',
			right:
				'after:start-0 after:shadow-[-2px_0_4px_color-mix(in_oklab,var(--color-neutral)_10%,transparent)] rtl:after:shadow-[2px_0_4px_color-mix(in_oklab,var(--color-neutral)_10%,transparent)]',
			none: 'after:hidden'
		}
	},
	defaultVariants: { side: 'none' }
});
const editor = cva({ base: 'relative grid h-full w-full min-w-0 items-center' });
const editorField = cva({ base: 'w-full min-w-0' });
const editorInput = cva({ base: 'h-auto min-w-0 rounded-none text-sm' });
const editorInputContainer = cva({
	base: 'w-full rounded-none border-0 bg-transparent shadow-none transition-none focus-within:ring-0',
	variants: {
		density: {
			small: 'min-h-8 px-sm py-xs',
			normal: 'min-h-10 p-md',
			large: 'min-h-12 p-lg'
		}
	},
	defaultVariants: { density: 'normal' }
});
const editorSwitchContainer = cva({ base: 'justify-center' });
const editorError = cva({
	base: 'absolute top-full left-0 z-50 mt-xs rounded-sm bg-danger px-md py-xs text-xs text-danger-contrast shadow'
});
const filterPanel = cva({
	base: 'grid w-full gap-xs p-lg',
	variants: {
		separated: {
			true: 'mt-xs border-t border-neutral-muted',
			false: ''
		}
	},
	defaultVariants: { separated: false }
});
const filterHeader = cva({ base: 'flex items-center justify-between gap-lg' });
const filterLabel = cva({ base: 'text-xs font-medium text-neutral/60' });
const filterFields = cva({ base: 'grid grid-cols-2 gap-md' });
const filterCheckboxGroup = cva({ base: '!gap-xs' });
const filterCheckboxContainer = cva({ base: '!gap-xs' });
const filterCheckboxItem = cva({ base: '!min-h-8 !py-xs !pl-layout-lg' });
const filterCheckboxIndicator = cva({ base: '!top-2 !size-4' });
const stateRow = cva({ base: 'grid min-h-40' });
const stateCell = cva({ base: 'relative grid min-w-0' });
const stateContent = cva({
	base: 'sticky start-0 grid w-[100cqw] place-items-center p-layout-md text-center'
});
const skeletonList = cva({ base: 'grid w-full max-w-3xl gap-lg' });
const skeletonBar = cva({ base: 'h-8 w-full' });
const footer = cva({ base: 'flex flex-wrap items-center justify-between gap-lg' });
const summary = cva({ base: 'text-sm text-neutral/60' });

export const dataTableTheme = {
	root,
	toolbar,
	toolbarGroup,
	search,
	viewport,
	savingIndicator,
	scrollArea,
	virtualTable,
	caption,
	header,
	headerRow,
	headerCell,
	headerContent,
	headerButton,
	headerLabel,
	headerActions,
	headerMenuPanel,
	headerMenuButton,
	dragHandle,
	dragThumb,
	resizeHandle,
	body,
	row,
	cell,
	cellContent,
	selectionCell,
	selectionCheckboxRoot,
	selectionCheckboxContainer,
	selectionCheckboxControl,
	selectionCheckboxIndicator,
	actionsCell,
	detailRow,
	detailCell,
	spacer,
	expander,
	groupValue,
	groupCount,
	pinnedBoundary,
	editor,
	editorField,
	editorInput,
	editorInputContainer,
	editorSwitchContainer,
	editorError,
	filterPanel,
	filterHeader,
	filterLabel,
	filterFields,
	filterCheckboxGroup,
	filterCheckboxContainer,
	filterCheckboxItem,
	filterCheckboxIndicator,
	stateRow,
	stateCell,
	stateContent,
	skeletonList,
	skeletonBar,
	footer,
	summary
};

export type DataTableTheme = typeof dataTableTheme;
export type DataTableThemeProps = InferComponentTheme<DataTableTheme>;
export const setDataTableTheme = setComponentTheme<DataTableTheme>('data-table');
export const useDataTableTheme = useComponentTheme<DataTableTheme>('data-table', dataTableTheme);
export type DataTableClasses = ReturnType<typeof useDataTableTheme>;
