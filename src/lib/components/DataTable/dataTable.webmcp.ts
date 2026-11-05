// How a DataTable appears to AI agents: `query_table`, which searches, filters, sorts and pages as
// its controls do and answers with the rows, by column; `move_row` while rows can be reordered.

import { tick } from 'svelte';
import { watchWebMCPTool, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { exposureOf, toolOptions, toolText, toolValue } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPJsonSchema, WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';
import type { DataTableApi, DataTableColumn, DataTableSorting } from './dataTable.props.js';

export type DataTableToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly label: unknown;
	readonly columns: readonly DataTableColumn<never>[];
	readonly api: DataTableApi<never>;
	readonly searchable: boolean;
	readonly loading: boolean;
	readonly hidden: Readonly<Record<string, boolean>>;
	/** The rows of the page showing, with the ids the table itself knows them by. */
	readonly pageRows: readonly { id: string; index: number; original: never }[];
	/** A table-level `cell` snippet draws every cell. */
	readonly customCells: boolean;
	readonly setSorting: (sorting: DataTableSorting[]) => void;
	readonly canMoveRows: boolean;
	readonly moveRow: (rowId: string, index: number) => boolean;
	readonly root: HTMLElement | null | undefined;
};

type QueryInput = {
	search?: unknown;
	filters?: unknown;
	sort?: unknown;
	descending?: unknown;
	page?: unknown;
	clearFilters?: unknown;
};

const MAX_ROWS = 100;
const LOADING_TIMEOUT = 5000;

const columnName = (column: DataTableColumn<never>): string => toolText(column.header) || column.id;

const isVisible = (source: DataTableToolSource, column: DataTableColumn<never>): boolean =>
	source.hidden[column.id] !== false;

/** The filter value each kind of built-in filter takes that JSON carries as is. */
function filterSchema(column: DataTableColumn<never>): WebMCPJsonSchema | null {
	const filter = column.filter;
	if (!filter || !('type' in filter)) return null;
	if (filter.type === 'text') return { type: 'string' };
	if (filter.type === 'boolean') return { type: 'boolean' };
	if (filter.type === 'select') {
		return { type: 'string', enum: filter.options.map((option) => option.value) };
	}
	return null;
}

/** What a cell shows: a renderer may show less than its accessor holds, a mask or a status. */
function shownValue(
	source: DataTableToolSource,
	column: DataTableColumn<never>,
	row: DataTableToolSource['pageRows'][number]
): unknown {
	if (!column.cell && !source.customCells) return valueOf(column, row.original, row.index);
	const cell = source.root?.querySelector(
		`tr[data-row-id="${CSS.escape(row.id)}"] [data-column-id="${CSS.escape(column.id)}"]`
	);
	// A virtualized row off screen has no cell to read: nothing is shown of it right now.
	return cell?.textContent?.trim() ?? null;
}

function valueOf(column: DataTableColumn<never>, row: never, index: number): unknown {
	const { accessor } = column;
	return toolValue(
		typeof accessor === 'function'
			? (accessor as (row: never, index: number) => unknown)(row, index)
			: (row as Record<string, unknown>)[accessor]
	);
}

async function settled(source: DataTableToolSource): Promise<void> {
	await tick();
	// Data the app fetches for this state arrives on its own time: `loading` says when.
	const deadline = Date.now() + LOADING_TIMEOUT;
	while (source.loading && Date.now() < deadline) {
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	await tick();
}

function apply(source: DataTableToolSource, input: QueryInput): string | null {
	const { api, columns } = source;
	if (input.clearFilters === true) api.clearFilters();
	if (typeof input.search === 'string') {
		if (!source.searchable) return 'This table has no search.';
		api.setGlobalFilter(input.search);
	}
	if (input.filters && typeof input.filters === 'object') {
		for (const [id, value] of Object.entries(input.filters)) {
			const column = columns.find((candidate) => candidate.id === id);
			const schema = column && filterSchema(column);
			if (!schema) return `The column "${id}" has no such filter.`;
			// A person only picks what the filter offers.
			const fits = schema.enum
				? (schema.enum as unknown[]).includes(value)
				: typeof value === schema.type;
			if (!fits) return `The filter of "${id}" does not take this value.`;
			api.setColumnFilter(id, value);
		}
	}
	if (typeof input.sort === 'string') {
		const column = columns.find((candidate) => candidate.id === input.sort);
		if (!column?.sortable) return `The column "${input.sort}" does not sort.`;
		source.setSorting([{ id: column.id, desc: input.descending === true }]);
	}
	if (Number.isInteger(input.page) && (input.page as number) >= 1) {
		api.setPage(input.page as number);
	}
	return null;
}

async function query(source: DataTableToolSource, input: QueryInput) {
	const refused = apply(source, input);
	if (refused) return { status: 'invalid', message: refused };
	await settled(source);
	const { api } = source;
	const columns = source.columns.filter((column) => isVisible(source, column));
	return {
		status: 'done',
		total: api.totalItems,
		page: api.state.pagination.page,
		totalPages: api.totalPages,
		columns: columns.map((column) => ({ id: column.id, name: columnName(column) })),
		rows: source.pageRows.slice(0, MAX_ROWS).map((row) => ({
			id: row.id,
			...Object.fromEntries(columns.map((column) => [column.id, shownValue(source, column, row)]))
		}))
	};
}

export const expose: WebMCPExpose<DataTableToolSource> = (source, config) => {
	const exposure = () => ({
		exposedTo: exposureOf(source.tool, config),
		modal: config.surface
	});
	const stops = [
		watchWebMCPTool(() => {
			const options = toolOptions(source.tool);
			const filters = Object.fromEntries(
				source.columns.flatMap((column) => {
					const schema = filterSchema(column);
					return schema ? [[column.id, { ...schema, description: columnName(column) }]] : [];
				})
			);
			const sortable = source.columns.filter((column) => column.sortable).map(({ id }) => id);
			const about = toolText(source.label);
			return {
				name: options.name ?? 'query_table',
				title: options.title,
				description:
					options.description ??
					`Reads the rows of ${about ? `the table "${about}"` : 'the table'} and, on screen too, searches, filters, sorts or pages it. Without input it reads what is showing.`,
				inputSchema: {
					type: 'object',
					properties: {
						...(source.searchable ? { search: { type: 'string' } } : {}),
						...(Object.keys(filters).length
							? { filters: { type: 'object', properties: filters, additionalProperties: false } }
							: {}),
						...(sortable.length
							? {
									sort: { type: 'string', enum: sortable },
									descending: { type: 'boolean' }
								}
							: {}),
						page: { type: 'integer', minimum: 1 },
						clearFilters: { type: 'boolean', description: 'Clears the search and the filters.' }
					},
					additionalProperties: false
				},
				annotations: { untrustedContentHint: true },
				execute: (input: QueryInput) => query(source, input)
			};
		}, exposure),
		watchWebMCPTool(() => {
			if (!source.canMoveRows) return null;
			const options = toolOptions(source.tool);
			return {
				name: 'move_row',
				description: 'Moves a row of the page showing to a position on that page, from 0.',
				inputSchema: {
					type: 'object',
					properties: {
						rowId: { type: 'string', description: 'The id query_table gives.' },
						index: { type: 'integer', minimum: 0 }
					},
					required: ['rowId', 'index'],
					additionalProperties: false
				},
				annotations: { consequentialHint: options.consequential ?? true },
				execute: ({ rowId, index }: { rowId: unknown; index: unknown }) => {
					if (typeof rowId !== 'string' || typeof index !== 'number') return { status: 'invalid' };
					const moved = source.moveRow(rowId, index);
					return { status: moved ? 'done' : 'refused', rowId, index };
				}
			};
		}, exposure)
	];
	return () => {
		for (const stop of stops) stop();
	};
};
