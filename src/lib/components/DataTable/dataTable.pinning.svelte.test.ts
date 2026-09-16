// v9 renamed physical column pinning to logical start/end regions. DataTable keeps the public
// left/right spelling and the rendered sticky layout, so both are pinned down here.
import '@testing-library/jest-dom/vitest';
import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Harness from './DataTablePinningHarness.test.svelte';

const people = [
	{ id: 'a', name: 'Ada', role: 'Engineer', team: 'Core' },
	{ id: 'b', name: 'Grace', role: 'Designer', team: 'Platform' }
];

const headerCells = (container: HTMLElement) => [
	...container.querySelectorAll<HTMLElement>('thead th[data-column-id]')
];

describe('DataTable column pinning', () => {
	test('renders pinned headers as sticky left and right columns', async () => {
		const { container } = render(Harness, { props: { items: people } });
		await waitFor(() => expect(headerCells(container).length).toBeGreaterThan(0));

		const byId = new Map(headerCells(container).map((cell) => [cell.dataset.columnId, cell]));
		const name = byId.get('name')!;
		const role = byId.get('role')!;
		const team = byId.get('team')!;

		expect(name.dataset.pinned).toBe('left');
		expect(team.dataset.pinned).toBe('right');
		expect(role.dataset.pinned).toBeUndefined();

		expect(name.style.position).toBe('sticky');
		expect(team.style.position).toBe('sticky');
		expect(role.style.position).toBe('');

		// The selection column is pinned ahead of `name`, so `name` starts after its 36px.
		expect(name.style.getPropertyValue('inset-inline-start')).toBe('36px');
		expect(team.style.getPropertyValue('inset-inline-end')).toBe('0px');
	});

	test('places pinned body cells at the same sticky offsets', async () => {
		const { container } = render(Harness, { props: { items: people } });
		await waitFor(() =>
			expect(container.querySelectorAll('tbody tr[data-row-id]')).toHaveLength(people.length)
		);

		const firstRow = container.querySelector<HTMLElement>('tbody tr[data-row-id="a"]')!;
		const cellFor = (columnId: string) =>
			firstRow.querySelector<HTMLElement>(`td[data-column-id="${columnId}"]`)!;

		expect(cellFor('name').style.position).toBe('sticky');
		expect(cellFor('name').style.getPropertyValue('inset-inline-start')).toBe('36px');
		expect(cellFor('team').style.position).toBe('sticky');
		expect(cellFor('team').style.getPropertyValue('inset-inline-end')).toBe('0px');
		expect(cellFor('role').style.position).toBe('');
	});

	test('renders unpinned columns normally when nothing is pinned', async () => {
		const { container } = render(Harness, {
			props: { items: people, columnPinning: { left: [], right: [] } }
		});
		await waitFor(() => expect(headerCells(container).length).toBeGreaterThan(0));

		for (const cell of headerCells(container)) {
			expect(cell.dataset.pinned).toBeUndefined();
			expect(cell.style.position).toBe('');
		}
	});
});
