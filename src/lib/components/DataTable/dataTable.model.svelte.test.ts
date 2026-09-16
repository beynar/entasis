// The TanStack Table v9 migration re-expressed every row-model stage, the column-def sorting and
// aggregation slots, and physical column pinning by hand. These tests drive `DataTableModel`
// directly so each of those pipelines is exercised without a DOM.
import { describe, expect, test } from 'vitest';
import { createDataTableState, DataTableModel } from './dataTable.model.svelte.js';
import type { DataTableColumn, DataTableProps, DataTableState } from './dataTable.props.js';

type Person = {
	id: string;
	name: string;
	dept: string;
	level: string;
	salary: number;
	active: boolean;
	hired: Date;
};

const people: Person[] = [
	{
		id: 'a',
		name: 'Ada',
		dept: 'Eng',
		level: 'senior',
		salary: 100,
		active: true,
		hired: new Date('2020-01-01')
	},
	{
		id: 'b',
		name: 'Grace',
		dept: 'Eng',
		level: 'junior',
		salary: 200,
		active: false,
		hired: new Date('2021-01-01')
	},
	{
		id: 'c',
		name: 'Linus',
		dept: 'Design',
		level: 'senior',
		salary: 300,
		active: true,
		hired: new Date('2022-01-01')
	},
	{
		id: 'd',
		name: 'Barbara',
		dept: 'Design',
		level: 'junior',
		salary: 400,
		active: false,
		hired: new Date('2023-01-01')
	}
];

const baseColumns: DataTableColumn<Person>[] = [
	{ id: 'name', accessor: 'name', header: 'Name', sortable: true, filter: { type: 'text' } },
	{ id: 'dept', accessor: 'dept', header: 'Dept', groupable: true, sortable: true },
	{
		id: 'salary',
		accessor: 'salary',
		header: 'Salary',
		sortable: true,
		aggregation: 'sum',
		filter: { type: 'number' }
	},
	{ id: 'active', accessor: 'active', header: 'Active', filter: { type: 'boolean' } }
];

const createHarness = <TData>(config: {
	items: readonly TData[];
	columns: readonly DataTableColumn<TData>[];
	getRowId: (row: TData, index: number, parent?: TData) => string;
	initialState?: Partial<DataTableState>;
	pageSize?: number;
	props?: Partial<DataTableProps<TData>>;
}) => {
	let state = createDataTableState(config.columns, config.initialState, config.pageSize ?? 25);
	const props = {
		items: config.items,
		columns: config.columns,
		getRowId: config.getRowId,
		selectionMode: 'none',
		processingMode: 'client',
		pagination: {},
		...config.props
	} as DataTableProps<TData>;

	const model = new DataTableModel<TData>({
		get props() {
			return props;
		},
		get state() {
			return state;
		},
		set state(value: DataTableState) {
			state = value;
		}
	});

	// The component republishes options from `$effect.pre`; tests do it explicitly.
	const sync = () => model.updateOptions();
	sync();

	return {
		model,
		sync,
		get state() {
			return state;
		},
		/** Runs an interaction and republishes options, as a render pass would. */
		act(run: () => void) {
			run();
			sync();
		},
		ids: () => model.pageRows.map((row) => row.id),
		values: (columnId: string) => model.pageRows.map((row) => row.getValue(columnId))
	};
};

const createPeopleHarness = (config: Partial<Parameters<typeof createHarness<Person>>[0]> = {}) =>
	createHarness<Person>({
		items: people,
		columns: baseColumns,
		getRowId: (person) => person.id,
		...config
	});

describe('DataTableModel row-model pipeline', () => {
	test('renders the core rows when no processing state is set', () => {
		const harness = createPeopleHarness();
		expect(harness.ids()).toEqual(['a', 'b', 'c', 'd']);
	});

	test("sorts with the registry's inferred sort function", () => {
		const harness = createPeopleHarness();
		const column = harness.model.table.getColumn('name')!;

		harness.act(() => column.toggleSorting());
		expect(harness.values('name')).toEqual(['Ada', 'Barbara', 'Grace', 'Linus']);

		harness.act(() => column.toggleSorting());
		expect(harness.values('name')).toEqual(['Linus', 'Grace', 'Barbara', 'Ada']);
	});

	test('sorts on several columns at once', () => {
		const harness = createPeopleHarness();
		harness.act(() => harness.model.table.getColumn('dept')!.toggleSorting(false, true));
		harness.act(() => harness.model.table.getColumn('salary')!.toggleSorting(true, true));

		expect(harness.state.sorting).toEqual([
			{ id: 'dept', desc: false },
			{ id: 'salary', desc: true }
		]);
		expect(harness.ids()).toEqual(['d', 'c', 'b', 'a']);
	});

	test('uses a column-supplied comparator for sorting', () => {
		const seen: string[] = [];
		// Sorting the name column by salary proves the column comparator, not the registry's
		// inferred text sort, decides the order.
		const bySalary = (left: Person, right: Person, columnId: string) => {
			seen.push(columnId);
			return right.salary - left.salary;
		};
		const harness = createPeopleHarness({
			columns: [{ ...baseColumns[0]!, sortable: bySalary }, ...baseColumns.slice(1)]
		});

		harness.act(() => harness.model.table.getColumn('name')!.toggleSorting(false));
		expect(harness.values('name')).toEqual(['Barbara', 'Linus', 'Grace', 'Ada']);
		expect(new Set(seen)).toEqual(new Set(['name']));
	});

	test('applies the global filter across columns', () => {
		const harness = createPeopleHarness();
		harness.act(() => harness.model.setGlobalFilter('des'));

		expect(harness.ids()).toEqual(['c', 'd']);
		expect(harness.state.globalFilter).toBe('des');
		expect(harness.state.pagination.page).toBe(1);
	});

	test('applies typed column filters', () => {
		const harness = createPeopleHarness();

		harness.act(() => harness.model.setColumnFilter('name', 'ra'));
		expect(harness.ids()).toEqual(['b', 'd']);

		harness.act(() => harness.model.setColumnFilter('name', undefined));
		harness.act(() => harness.model.setColumnFilter('salary', { min: 250 }));
		expect(harness.ids()).toEqual(['c', 'd']);

		harness.act(() => harness.model.setColumnFilter('salary', undefined));
		harness.act(() => harness.model.setColumnFilter('active', true));
		expect(harness.ids()).toEqual(['a', 'c']);
	});

	test('runs a custom filter predicate against the original row', () => {
		const seen: Person[] = [];
		const harness = createPeopleHarness({
			columns: [
				{
					id: 'name',
					accessor: 'name',
					header: 'Name',
					filter: {
						type: 'custom',
						render: undefined as never,
						predicate: (row, value) => {
							seen.push(row);
							return row.dept === value;
						}
					}
				},
				...baseColumns.slice(1)
			]
		});

		harness.act(() => harness.model.setColumnFilter('name', 'Eng'));
		expect(harness.ids()).toEqual(['a', 'b']);
		expect(seen.map((row) => row.id)).toEqual(['a', 'b', 'c', 'd']);
	});

	test('exposes faceted unique values and min/max bounds', () => {
		const harness = createPeopleHarness();
		const dept = harness.model.table.getColumn('dept')!;
		const salary = harness.model.table.getColumn('salary')!;

		expect([...dept.getFacetedUniqueValues().entries()].sort()).toEqual([
			['Design', 2],
			['Eng', 2]
		]);
		expect(salary.getFacetedMinMaxValues()).toEqual([100, 400]);
	});

	test('paginates with a one-based public page', () => {
		const harness = createPeopleHarness({ pageSize: 2 });
		expect(harness.ids()).toEqual(['a', 'b']);

		harness.act(() => harness.model.setPage(2));
		expect(harness.state.pagination.page).toBe(2);
		expect(harness.ids()).toEqual(['c', 'd']);

		harness.act(() => harness.model.setPageSize(3));
		expect(harness.state.pagination.pageSize).toBe(3);
	});

	test('leaves server-processed rows untouched in manual mode', () => {
		const harness = createPeopleHarness({
			pageSize: 2,
			props: { processingMode: 'manual', rowCount: 40 }
		});

		harness.act(() => harness.model.table.getColumn('name')!.toggleSorting(true));
		// Manual mode reports the sort but must not reorder the supplied page.
		expect(harness.state.sorting).toEqual([{ id: 'name', desc: true }]);
		expect(harness.ids()).toEqual(['a', 'b', 'c', 'd']);
		expect(harness.model.table.getPageCount()).toBe(20);
	});
});

describe('DataTableModel grouping and aggregation', () => {
	const groupedHarness = (columns = baseColumns) =>
		createPeopleHarness({ columns, initialState: { grouping: ['dept'] } });

	test('builds grouped rows with built-in aggregation over the leaf rows', () => {
		const harness = groupedHarness();
		const groups = harness.model.pageRows;

		expect(groups.map((row) => row.getValue('dept'))).toEqual(['Eng', 'Design']);
		expect(groups.map((row) => row.getValue('salary'))).toEqual([300, 700]);
		expect(groups.every((row) => row.getIsGrouped())).toBe(true);
	});

	test('resolves every aggregation name the public API accepts', () => {
		const names = ['count', 'max', 'mean', 'median', 'min', 'sum', 'uniqueCount'] as const;
		const harness = createPeopleHarness({
			columns: [
				baseColumns[1]!,
				...names.map((aggregation) => ({
					id: aggregation,
					accessor: 'salary' as const,
					header: aggregation,
					aggregation
				}))
			],
			initialState: { grouping: ['dept'] }
		});
		const group = harness.model.pageRows[0]!;

		expect(names.map((name) => group.getValue(name))).toEqual([2, 200, 150, 150, 100, 300, 2]);
	});

	test('passes every terminal leaf row to a custom aggregation', () => {
		const calls: { values: unknown[]; rows: Person[] }[] = [];
		const harness = createPeopleHarness({
			columns: [
				baseColumns[0]!,
				baseColumns[1]!,
				{
					...baseColumns[2]!,
					aggregation: (values, rows) => {
						calls.push({ values, rows: rows as Person[] });
						return values.length;
					}
				},
				baseColumns[3]!
			],
			initialState: { grouping: ['dept', 'level'] }
		});

		const outer = harness.model.pageRows[0]!;
		expect(outer.getValue('salary')).toBe(2);
		// v8 handed the aggregation the group's terminal leaf rows; nested grouping must not
		// collapse that to the group's direct sub-rows.
		const outerCall = calls.at(-1)!;
		expect(outerCall.values).toEqual([100, 200]);
		expect(outerCall.rows.map((row) => row.id)).toEqual(['a', 'b']);
	});

	test('keeps the v8 meaning of an aggregated cell', () => {
		const harness = groupedHarness();
		const groupRow = harness.model.pageRows[0]!;
		const cells = groupRow.getVisibleCells();
		const cellFor = (columnId: string) => cells.find((cell) => cell.column.id === columnId)!;

		expect(harness.model.isCellAggregated(cellFor('dept'))).toBe(false);
		expect(cellFor('dept').getIsGrouped()).toBe(true);
		expect(harness.model.isCellAggregated(cellFor('salary'))).toBe(true);
		// `active` declares no aggregation at all; v8 still treated it as an aggregated cell.
		expect(harness.model.isCellAggregated(cellFor('active'))).toBe(true);
	});

	test('expands a grouped row into its children', () => {
		const harness = groupedHarness();
		const group = harness.model.pageRows[0]!;

		harness.act(() => group.toggleExpanded());
		expect(harness.state.expanded[group.id]).toBe(true);
		expect(harness.model.pageRows.map((row) => row.id)).toEqual([
			group.id,
			'a',
			'b',
			'dept:Design'
		]);
	});

	test('drops grouping in manual processing mode', () => {
		const harness = createPeopleHarness({
			initialState: { grouping: ['dept'] },
			props: { processingMode: 'manual', rowCount: 4 }
		});
		harness.act(() => harness.model.reconcileProcessingMode());

		expect(harness.state.grouping).toEqual([]);
		expect(harness.ids()).toEqual(['a', 'b', 'c', 'd']);
	});
});

describe('DataTableModel selection', () => {
	test('selects and clears rows through the public state shape', () => {
		const harness = createPeopleHarness({ props: { selectionMode: 'multiple' } });
		const [first, second] = harness.model.pageRows;

		harness.act(() => first!.toggleSelected());
		harness.act(() => second!.toggleSelected());
		expect(harness.state.rowSelection).toEqual({ a: true, b: true });
		expect(harness.model.selectedRows.map((row) => row.id)).toEqual(['a', 'b']);

		harness.act(() => harness.model.clearSelection());
		expect(harness.state.rowSelection).toEqual({});
	});

	test('honours single selection and isRowSelectable', () => {
		const harness = createPeopleHarness({
			props: { selectionMode: 'single', isRowSelectable: (person) => person.active }
		});
		const rows = harness.model.pageRows;

		expect(rows.map((row) => row.getCanSelect())).toEqual([true, false, true, false]);
		harness.act(() => rows[0]!.toggleSelected());
		harness.act(() => rows[2]!.toggleSelected());
		expect(harness.state.rowSelection).toEqual({ c: true });
	});

	test('reads a caller-supplied false entry as unselected', () => {
		const harness = createPeopleHarness({
			props: { selectionMode: 'multiple' },
			initialState: { rowSelection: { a: false, b: true } }
		});

		expect(harness.model.pageRows.map((row) => row.getIsSelected())).toEqual([
			false,
			true,
			false,
			false
		]);
		expect(harness.model.selectedRows.map((row) => row.id)).toEqual(['b']);
	});
});

describe('DataTableModel column pinning, ordering, and sizing', () => {
	test('translates public left/right pinning to logical regions', () => {
		const harness = createPeopleHarness({
			initialState: { columnPinning: { left: ['name'], right: ['active'] } }
		});
		const table = harness.model.table;

		expect(table.getStartVisibleLeafColumns().map((column) => column.id)).toEqual(['name']);
		expect(table.getEndVisibleLeafColumns().map((column) => column.id)).toEqual(['active']);
		expect(harness.model.getColumnPinning(table.getColumn('name')!)).toBe('left');
		expect(harness.model.getColumnPinning(table.getColumn('active')!)).toBe('right');
		expect(harness.model.getColumnPinning(table.getColumn('dept')!)).toBe(false);
	});

	test('writes pinning back in the public left/right spelling', () => {
		const harness = createPeopleHarness();
		const table = harness.model.table;

		harness.act(() => table.getColumn('dept')!.pin('start'));
		expect(harness.state.columnPinning).toEqual({ left: ['dept'], right: [] });

		harness.act(() => table.getColumn('salary')!.pin('end'));
		expect(harness.state.columnPinning).toEqual({ left: ['dept'], right: ['salary'] });

		harness.act(() => table.getColumn('dept')!.pin(false));
		expect(harness.state.columnPinning).toEqual({ left: [], right: ['salary'] });
	});

	test('keeps the internal selection and actions columns out of public pinning state', () => {
		const harness = createPeopleHarness({
			props: { selectionMode: 'multiple', rowActions: 'actions' as never }
		});
		const table = harness.model.table;

		expect(table.getStartVisibleLeafColumns().map((column) => column.id)).toEqual(['__selection']);
		expect(table.getEndVisibleLeafColumns().map((column) => column.id)).toEqual(['__actions']);

		harness.act(() => table.getColumn('dept')!.pin('start'));
		expect(harness.state.columnPinning.left).toEqual(['dept']);
		expect(harness.state.columnOrder).not.toContain('__selection');
	});

	test('measures pinned offsets from the pinned edge', () => {
		const harness = createPeopleHarness({
			initialState: {
				columnPinning: { left: ['name', 'dept'], right: ['active'] },
				columnSizing: { name: 120, dept: 90, active: 70 }
			}
		});
		const table = harness.model.table;

		expect(harness.model.getColumnPinnedOffset(table.getColumn('name')!)).toBe(0);
		expect(harness.model.getColumnPinnedOffset(table.getColumn('dept')!)).toBe(120);
		expect(harness.model.getColumnPinnedOffset(table.getColumn('active')!)).toBe(0);
		expect(harness.model.getColumnPinnedOffset(table.getColumn('salary')!)).toBe(0);
	});

	test('resizes, hides, and reorders columns', () => {
		const harness = createPeopleHarness();
		const table = harness.model.table;

		harness.act(() => harness.model.setColumnSize('name', 260));
		expect(table.getColumn('name')!.getSize()).toBe(260);
		// The public setter clamps to the column bounds.
		harness.act(() => harness.model.setColumnSize('name', 5000));
		expect(table.getColumn('name')!.getSize()).toBe(640);
		expect(table.getColumn('name')!.getCanResize()).toBe(true);

		harness.act(() => table.getColumn('dept')!.toggleVisibility(false));
		expect(harness.state.columnVisibility).toEqual({ dept: false });
		expect(table.getVisibleLeafColumns().map((column) => column.id)).toEqual([
			'name',
			'salary',
			'active'
		]);

		harness.act(() => harness.model.moveColumn('name', 1));
		expect(harness.state.columnOrder).toEqual(['dept', 'name', 'salary', 'active']);
	});
});

describe('DataTableModel hierarchical rows', () => {
	type Node = { id: string; name: string; children?: Node[] };
	const tree: Node[] = [
		{ id: 'root', name: 'Root', children: [{ id: 'child', name: 'Child' }] },
		{ id: 'leaf', name: 'Leaf' }
	];

	test('expands sub rows supplied by getSubRows', () => {
		const harness = createHarness<Node>({
			items: tree,
			columns: [{ id: 'name', accessor: 'name', header: 'Name' }],
			getRowId: (node) => node.id,
			props: { getSubRows: (node) => node.children }
		});

		expect(harness.ids()).toEqual(['root', 'leaf']);
		const root = harness.model.pageRows[0]!;
		expect(root.getCanExpand()).toBe(true);

		harness.act(() => root.toggleExpanded());
		expect(harness.ids()).toEqual(['root', 'child', 'leaf']);
		expect(harness.state.expanded).toEqual({ root: true });
	});
});
