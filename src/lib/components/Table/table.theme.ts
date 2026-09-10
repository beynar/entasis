import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultTableContainer = cva({
	base: 'relative w-full overflow-x-auto'
});

const defaultTable = cva({
	base: 'w-full caption-bottom text-sm'
});

const defaultTableHead = cva({
	base: '[&_tr]:border-b [&_tr]:border-neutral-muted'
});

const defaultTableBody = cva({
	base: '[&_tr:last-child]:border-0'
});

const defaultTableFoot = cva({
	base: 'bg-surface-raised border-t border-neutral-muted font-medium [&>tr]:last:border-b-0'
});

// `density` owns paddings and row heights only ('normal' keeps today's exact
// values; small is one step tighter, large one step roomier).
const defaultTableRow = cva({
	base: 'state-layer data-[state=selected]:bg-neutral-muted data-[state=selected]:text-neutral-muted-readable border-b border-neutral-muted transition-colors',
	variants: {
		density: {
			small: 'py-0',
			normal: 'py-micro',
			large: 'py-xs'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultTableHeadCell = cva({
	base: 'text-neutral text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
	variants: {
		density: {
			small: 'h-8 px-sm',
			normal: 'h-10 px-md',
			large: 'h-12 px-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultTableCell = cva({
	base: 'align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
	variants: {
		density: {
			small: 'px-sm py-xs',
			normal: 'p-md',
			large: 'p-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultTableCaption = cva({
	base: 'text-neutral/60 text-sm',
	variants: {
		density: {
			small: 'mt-lg',
			normal: 'mt-xl',
			large: 'mt-layout-md'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultTablePrefix = cva({
	base: ''
});

const defaultTableSuffix = cva({
	base: ''
});

export const tableTheme = {
	root: defaultTableContainer,
	table: defaultTable,
	thead: defaultTableHead,
	tbody: defaultTableBody,
	tfoot: defaultTableFoot,
	row: defaultTableRow,
	head: defaultTableHeadCell,
	cell: defaultTableCell,
	caption: defaultTableCaption,
	prefix: defaultTablePrefix,
	suffix: defaultTableSuffix
};

export type TableTheme = typeof tableTheme;
export type TableThemeProps = InferComponentTheme<TableTheme>;
export const setTableTheme = setComponentTheme<TableTheme>('table');
export const useTableTheme = useComponentTheme<TableTheme>('table', tableTheme);
