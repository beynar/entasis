import '@testing-library/jest-dom/vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Harness from './DataTableRowStateHarness.test.svelte';
import type { DataTableApi } from './dataTable.props.js';

type Person = { id: string; name: string };
const items: Person[] = [
	{ id: 'a', name: 'Ada' },
	{ id: 'b', name: 'Bob' }
];

const mount = async (props: Record<string, unknown>) => {
	let api!: DataTableApi<Person>;
	const view = render(Harness, {
		props: { items, onApi: (next: DataTableApi<Person>) => (api = next), ...props } as never
	});
	await waitFor(() => expect(api).toBeDefined());
	return { ...view, api };
};

const cellOf = (container: Element, row: string, column: string) =>
	container.querySelector<HTMLElement>(`tr[data-row-id="${row}"] td[data-column-id="${column}"]`)!;

const edit = async (container: Element, value: string) => {
	await fireEvent.dblClick(cellOf(container, 'a', 'name'));
	const input = await waitFor(() => {
		const found = cellOf(container, 'a', 'name').querySelector('input');
		expect(found).not.toBeNull();
		return found!;
	});
	await fireEvent.input(input, { target: { value } });
};

const editorOpen = (container: Element) =>
	cellOf(container, 'a', 'name').querySelector('input') !== null;

describe('api.commitEditing', () => {
	test('with no editor open there is nothing to wait for', async () => {
		const onCellCommit = vi.fn();
		const { api } = await mount({ onCellCommit });
		await expect(api.commitEditing()).resolves.toBe(true);
		expect(onCellCommit).not.toHaveBeenCalled();
	});

	test('writes the open editor and closes it', async () => {
		const onCellCommit = vi.fn(async () => {});
		const { api, container } = await mount({ onCellCommit });
		await edit(container, 'Grace');
		await expect(api.commitEditing()).resolves.toBe(true);
		expect(onCellCommit).toHaveBeenCalledOnce();
		expect(onCellCommit.mock.lastCall?.at(0)).toMatchObject({
			rowId: 'a',
			columnId: 'name',
			value: 'Grace'
		});
		await waitFor(() => expect(editorOpen(container)).toBe(false));
	});

	test('an unchanged editor closes without writing', async () => {
		const onCellCommit = vi.fn(async () => {});
		const { api, container } = await mount({ onCellCommit });
		await edit(container, 'Ada');
		await expect(api.commitEditing()).resolves.toBe(true);
		expect(onCellCommit).not.toHaveBeenCalled();
	});

	test('a write that fails answers false and leaves the editor open', async () => {
		const onCellCommit = vi.fn(async () => {
			throw new Error('refused');
		});
		const { api, container } = await mount({ onCellCommit });
		await edit(container, 'Grace');
		await expect(api.commitEditing()).resolves.toBe(false);
		await waitFor(() => expect(editorOpen(container)).toBe(true));
	});

	test('a write under way is waited for, and its answer is the answer', async () => {
		let fail!: (error: Error) => void;
		const onCellCommit = vi.fn(
			() =>
				new Promise<void>((_, reject) => {
					fail = reject;
				})
		);
		const { api, container } = await mount({ onCellCommit });
		await edit(container, 'Grace');
		const first = api.commitEditing();
		const second = api.commitEditing();
		fail(new Error('refused'));
		await expect(first).resolves.toBe(false);
		await expect(second).resolves.toBe(false);
		expect(onCellCommit).toHaveBeenCalledOnce();
	});
});

describe('getRowAttrs and getCellAttrs', () => {
	test('land on the row and the cell, structural columns included', async () => {
		const { container } = await mount({
			getRowAttrs: (row: Person) => ({ 'data-change': row.id === 'a' ? 'added' : undefined }),
			getCellAttrs: ({ row, columnId }: { row: Person; columnId: string }) => ({
				'data-cell': `${row.id}:${columnId}`
			})
		});
		const rowA = container.querySelector('tr[data-row-id="a"]')!;
		const rowB = container.querySelector('tr[data-row-id="b"]')!;
		expect(rowA).toHaveAttribute('data-change', 'added');
		expect(rowB).not.toHaveAttribute('data-change');
		for (const column of ['__selection', 'name', '__actions']) {
			expect(cellOf(container, 'a', column)).toHaveAttribute('data-cell', `a:${column}`);
		}
	});

	test('cannot take what the table writes itself', async () => {
		const { container } = await mount({
			getRowAttrs: () => ({ class: 'theirs', 'data-row-id': 'x', 'data-selected': 'true' }),
			getCellAttrs: () => ({ class: 'theirs', 'data-column-id': 'x' })
		});
		const row = container.querySelector('tr[data-row-id="a"]')!;
		expect(row).not.toHaveClass('theirs');
		expect(row).toHaveAttribute('data-selected', 'false');
		expect(cellOf(container, 'a', 'name')).not.toHaveClass('theirs');
	});

	test('follow state the app keeps, on the same rows', async () => {
		let change = $state<string | undefined>();
		const { container } = await mount({
			getRowAttrs: () => ({ 'data-change': change }),
			getCellAttrs: () => ({ 'data-change': change })
		});
		const row = container.querySelector('tr[data-row-id="a"]')!;
		expect(row).not.toHaveAttribute('data-change');
		change = 'added';
		await waitFor(() => expect(row).toHaveAttribute('data-change', 'added'));
		expect(cellOf(container, 'a', 'name')).toHaveAttribute('data-change', 'added');
		expect(container.querySelector('tr[data-row-id="a"]')).toBe(row);
		change = undefined;
		await waitFor(() => expect(row).not.toHaveAttribute('data-change'));
	});
});
