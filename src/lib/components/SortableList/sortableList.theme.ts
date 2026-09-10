import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

// The root <ul>: a stack/row/wrapping row whose gap scales with the size token.
const defaultRoot = cva({
	base: 'm-0 flex list-none p-0',
	variants: {
		size: {
			small: 'gap-xs',
			normal: 'gap-md',
			large: 'gap-lg'
		},
		orientation: {
			vertical: 'flex-col',
			horizontal: 'flex-row',
			grid: 'flex-row flex-wrap'
		}
	},
	defaultVariants: {
		size: 'normal',
		orientation: 'vertical'
	}
});

// The <li> row. In full-row mode the whole row is the drag activator (grab cursor, no text
// selection); in handle mode only the grip drags. `dragging` marks the dimmed placeholder —
// the dragged row shown at the slot it would land in.
const defaultItem = cva({
	base: 'border-neutral-muted bg-surface text-neutral relative flex items-center rounded-lg border outline-none transition-[box-shadow,opacity] focus-visible:ring-2 focus-visible:ring-primary/50',
	variants: {
		size: {
			small: 'gap-md p-md text-sm',
			normal: 'gap-lg p-lg text-base',
			large: 'gap-xl p-xl text-lg'
		},
		handle: {
			true: '',
			false: 'cursor-grab touch-none select-none active:cursor-grabbing'
		},
		dragging: {
			true: 'opacity-40',
			false: ''
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		}
	},
	compoundVariants: [
		// A disabled row never shows the grab cursor, even in full-row mode.
		{ disabled: true, handle: false, class: 'cursor-not-allowed active:cursor-not-allowed' }
	],
	defaultVariants: {
		size: 'normal',
		handle: false,
		dragging: false,
		disabled: false
	}
});

// The row content region wrapping the `item` snippet (or the default label).
const defaultContent = cva({
	base: 'min-w-0 flex-1'
});

// The grip handle button rendered in handle mode; its content is the `handle` snippet.
const defaultHandle = cva({
	base: 'text-neutral/60 hover:text-neutral inline-flex shrink-0 cursor-grab touch-none items-center justify-center rounded-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 active:cursor-grabbing disabled:pointer-events-none disabled:cursor-not-allowed',
	variants: {
		size: {
			small: 'size-6',
			normal: 'size-7',
			large: 'size-8'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// The empty state rendered when the list has no rows (only when the `empty`
// slot is provided). min-h keeps an empty grouped list a hittable drop area.
const defaultEmpty = cva({
	base: 'text-neutral/60 border-neutral-muted flex min-h-12 w-full items-center justify-center rounded-lg border border-dashed px-lg py-md text-sm'
});

export const sortableListTheme = {
	root: defaultRoot,
	item: defaultItem,
	content: defaultContent,
	handle: defaultHandle,
	empty: defaultEmpty
};

export type SortableListTheme = typeof sortableListTheme;
export type SortableListThemeProps = InferComponentTheme<SortableListTheme>;
/** The resolved per-part class builders returned by `useSortableListTheme`. */
export type SortableListClasses = ReturnType<typeof useSortableListTheme>;
export const setSortableListTheme = setComponentTheme<SortableListTheme>('sortableList');
export const useSortableListTheme = useComponentTheme('sortableList', sortableListTheme);
