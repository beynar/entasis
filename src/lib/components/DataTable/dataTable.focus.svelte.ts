import type { DataTableModel } from './dataTable.model.svelte.js';

type FocusedCell = {
	row: number;
	column: number;
	rowId: string | null;
	columnId: string | null;
};

const initialFocusedCell = (): FocusedCell => ({
	row: 0,
	column: 0,
	rowId: null,
	columnId: null
});

export class DataTableFocus<TData> {
	focusedCell = $state<FocusedCell>(initialFocusedCell());
	hasFocusedCell = $state(false);

	constructor(private readonly model: DataTableModel<TData>) {}

	move(row: number, column: number) {
		const rows = this.model.pageRows;
		const columns = this.model.table.getVisibleLeafColumns();
		const nextRow = Math.max(0, Math.min(row, Math.max(0, rows.length - 1)));
		const nextColumn = Math.max(0, Math.min(column, Math.max(0, columns.length - 1)));
		this.hasFocusedCell = true;
		const next = {
			row: nextRow,
			column: nextColumn,
			rowId: rows[nextRow]?.id ?? null,
			columnId: columns[nextColumn]?.id ?? null
		};
		// `reconcile()` runs from the effect that syncs table state and reads the current cell to
		// do so; writing an identical cell back would re-trigger that effect forever (Svelte
		// compares objects by identity), so only publish an actual move.
		const current = this.focusedCell;
		if (
			current.row === next.row &&
			current.column === next.column &&
			current.rowId === next.rowId &&
			current.columnId === next.columnId
		)
			return;
		this.focusedCell = next;
	}

	reconcile() {
		if (!this.hasFocusedCell) return;
		const rows = this.model.pageRows;
		const columns = this.model.table.getVisibleLeafColumns();
		if (rows.length === 0 || columns.length === 0) {
			this.clear();
			return;
		}
		const rowIndex = this.focusedCell.rowId
			? rows.findIndex((row) => row.id === this.focusedCell.rowId)
			: -1;
		const columnIndex = this.focusedCell.columnId
			? columns.findIndex((column) => column.id === this.focusedCell.columnId)
			: -1;
		this.move(
			rowIndex >= 0 ? rowIndex : this.focusedCell.row,
			columnIndex >= 0 ? columnIndex : this.focusedCell.column
		);
	}

	clear() {
		this.hasFocusedCell = false;
		this.focusedCell = initialFocusedCell();
	}
}
