import type { Slot } from '../Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Density } from '$lib/types/theme.js';
import type { TableThemeProps } from './table.theme.js';

/**
 * Represents a single cell in a table (header or footer)
 */
export type TableCell = {
	/**
	 * The content of the cell. Can be a string or a Snippet.
	 */
	content?: Slot;
	/**
	 * Optional CSS classes to apply to the cell.
	 */
	class?: string;
	/**
	 * Number of rows the cell spans.
	 */
	rowSpan?: number;
	/**
	 * Number of columns the cell spans.
	 */
	colSpan?: number;
};

/**
 * A cell value can be either a full TableCell object or directly a Slot (string or Snippet).
 * This allows for more concise syntax: `name: "Name"` instead of `name: { content: "Name" }`
 */
export type TableCellValue = TableCell | Slot;

/**
 * Represents a row in the table body.
 * Can either have an object of cells (keyed by column name) or a single content slot.
 */
export type TableRow = {
	/**
	 * Object of cells for this row, keyed by column name. Used when you want structured cells.
	 * Cells will be rendered in the same order as the header keys (if header is provided).
	 * Each cell can be a TableCell object or directly a Slot (string or Snippet).
	 */
	cells?: Record<string, TableCellValue>;
	/**
	 * Direct content slot for the row. Used when you want flexible content.
	 * If both cells and content are provided, content takes precedence.
	 */
	content?: Slot;
	/**
	 * Optional CSS classes to apply to the row.
	 */
	class?: string;
	/**
	 * Marks the row as selected: drives the row theme's `selected` variant and the
	 * `data-state="selected"` attribute.
	 */
	selected?: boolean;
};

export type TableProps = WithAttachments<{
	/**
	 * Object of cells for the table header, keyed by column name.
	 * Each cell can be a TableCell object or directly a Slot (string or Snippet).
	 */
	header?: Record<string, TableCellValue>;
	/**
	 * Object of cells for the table footer, keyed by column name.
	 * Each cell can be a TableCell object or directly a Slot (string or Snippet).
	 */
	footer?: Record<string, TableCellValue>;
	/**
	 * Items to render as table body rows.
	 */
	items: TableRow[];
	/**
	 * Slot rendered above the table. Useful for search/filter controls.
	 */
	prefix?: Slot;
	/**
	 * Slot rendered below the table. Useful for pagination controls.
	 */
	suffix?: Slot;
	/**
	 * Caption for the table. Rendered as a <caption> element.
	 */
	caption?: Slot;
	/**
	 * Spacing density controlling cell paddings and row heights.
	 * 'normal' is today's everyday scale; 'small' for dense data grids;
	 * 'large' for roomy detail surfaces.
	 */
	density?: Density;
	/**
	 * CSS classes to apply to the table container.
	 */
	class?: string;
	/**
	 * Theme overrides for the table.
	 */
	theme?: TableThemeProps;
}>;
