import { DEV } from 'esm-env';
import { tick } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { DataTableModel } from './dataTable.model.svelte.js';
import type { DataTableRowInstance } from './dataTable.table.js';
import type { DataTableCellCommit, DataTableEditorPayload } from './dataTable.props.js';

type EditingState<TData> = {
	row: DataTableRowInstance<TData>;
	columnId: string;
	previousValue: unknown;
	draft: unknown;
	pending: boolean;
	error: unknown;
};

type OptimisticCell = {
	token: symbol;
	value: unknown;
};

const cellValuesEqual = (left: unknown, right: unknown) => {
	if (Object.is(left, right)) return true;
	return left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
};

export class DataTableEditing<TData> {
	editing = $state<EditingState<TData> | null>(null);
	private readonly optimisticCells = new SvelteMap<string, OptimisticCell>();
	private readonly warnedMissingCommitColumns = new SvelteSet<string>();

	constructor(private readonly model: DataTableModel<TData>) {}

	get pendingCommitCount() {
		return this.optimisticCells.size;
	}

	getCellValue(row: DataTableRowInstance<TData>, columnId: string) {
		const key = this.getCellKey(row.id, columnId);
		return this.optimisticCells.has(key)
			? this.optimisticCells.get(key)?.value
			: row.getValue(columnId);
	}

	getPayload(): DataTableEditorPayload<TData> | null {
		if (!this.editing) return null;
		return {
			row: this.editing.row.original as TData,
			rowId: this.editing.row.id,
			columnId: this.editing.columnId,
			previousValue: this.editing.previousValue,
			value: this.editing.draft,
			draft: this.editing.draft,
			pending: this.editing.pending,
			error: this.editing.error,
			setDraft: (value) => this.setDraft(value),
			commit: async () => {
				await this.commit();
			},
			cancel: () => this.cancel()
		};
	}

	start(row: DataTableRowInstance<TData>, columnId: string) {
		const column = this.model.getColumnConfig(columnId);
		if (column?.editor && !this.model.props.onCellCommit) {
			this.warnMissingCommit(columnId);
			return;
		}
		if (
			!column?.editor ||
			this.model.props.disabled ||
			row.getIsGrouped() ||
			this.editing !== null ||
			this.optimisticCells.size > 0
		)
			return;
		const previousValue = this.getCellValue(row, columnId);
		this.editing = {
			row,
			columnId,
			previousValue,
			draft: previousValue,
			pending: false,
			error: null
		};
	}

	setDraft(value: unknown) {
		if (!this.editing || this.editing.pending) return;
		this.editing.draft = value;
		this.editing.error = null;
	}

	async commit(): Promise<boolean> {
		if (!this.editing || this.editing.pending) return false;
		const editing = this.editing;
		if (cellValuesEqual(editing.previousValue, editing.draft)) {
			this.editing = null;
			return true;
		}
		const commit: DataTableCellCommit<TData> = {
			row: editing.row.original as TData,
			rowId: editing.row.id,
			columnId: editing.columnId,
			previousValue: editing.previousValue,
			value: editing.draft
		};
		const key = this.getCellKey(editing.row.id, editing.columnId);
		const token = Symbol(key);
		editing.pending = true;
		editing.error = null;
		this.optimisticCells.set(key, { token, value: editing.draft });
		this.editing = null;
		try {
			await this.model.props.onCellCommit!(commit);
			await tick();
			if (this.optimisticCells.get(key)?.token === token) this.optimisticCells.delete(key);
			return true;
		} catch (error) {
			if (this.optimisticCells.get(key)?.token === token) this.optimisticCells.delete(key);
			editing.pending = false;
			editing.error = error;
			this.editing = editing;
			return false;
		}
	}

	cancel() {
		if (this.editing?.pending) return;
		this.editing = null;
	}

	private warnMissingCommit(columnId: string) {
		if (!DEV || this.warnedMissingCommitColumns.has(columnId)) return;
		this.warnedMissingCommitColumns.add(columnId);
		console.warn(
			`DataTable column "${columnId}" defines an editor but DataTable has no onCellCommit handler.`
		);
	}

	private getCellKey(rowId: string, columnId: string) {
		return JSON.stringify([rowId, columnId]);
	}
}
