// A group row's label (expander, value, count) is never cut at the grouped column's width: it runs
// on over the empty cells after it, and an aggregated cell paints over it instead of under it.
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { DataTableCellRenderPayload } from './dataTable.props.js';
import Harness from './DataTableGroupRowHarness.test.svelte';

const items = [
	{ id: 'a', status: 'Nouveau dans la collection', title: 'Ada', price: 10 },
	{ id: 'b', status: 'Nouveau dans la collection', title: 'Bob', price: 20 },
	{ id: 'c', status: 'Archivé', title: 'Cy', price: 5 }
];

const groupCell = () =>
	document.querySelector<HTMLElement>(
		'tr[data-grouped="true"] td[data-column-id="status"], tbody tr td[data-column-id="status"]'
	)!;
const visibleRight = (element: Element) => element.getBoundingClientRect().right;

test('a cell of a column that aggregates nothing leaves the label clear', async () => {
	await render(Harness, { props: { items } });
	await expect.poll(() => document.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
	const row = groupCell().closest('tr')!;
	for (const id of ['title', 'price']) {
		const cell = row.querySelector<HTMLElement>(`td[data-column-id="${id}"]`)!;
		expect(getComputedStyle(cell).zIndex).toBe('auto');
		expect(getComputedStyle(cell).backgroundColor).toBe('rgba(0, 0, 0, 0)');
	}
	// The label's end is drawn, nothing paints over it.
	const count = [...groupCell().querySelectorAll<HTMLElement>('span')].find(
		(span) => span.textContent === '(2)'
	)!;
	const { right, top, height } = count.getBoundingClientRect();
	expect(document.elementFromPoint(right - 2, top + height / 2)).toBe(count);
});

test('the label runs past its column instead of being cut', async () => {
	await render(Harness, { props: { items } });
	await expect.poll(() => document.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
	const cell = groupCell();
	const count = [...cell.querySelectorAll<HTMLElement>('span')].find(
		(span) => span.textContent === '(2)'
	)!;
	expect(count).toBeDefined();
	expect(getComputedStyle(cell).overflowX).toBe('visible');
	// The whole label is laid out past the 90px column, and nothing clips it.
	expect(visibleRight(count)).toBeGreaterThan(visibleRight(cell));
	expect(cell.textContent).toContain('Nouveau dans la collection');
});

test('an aggregated cell paints over the label, on the row surface', async () => {
	await render(Harness, { props: { items, aggregate: true } });
	await expect.poll(() => document.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
	const row = groupCell().closest('tr')!;
	const aggregate = row.querySelector<HTMLElement>('td[data-column-id="price"]')!;
	expect(aggregate.textContent).toContain('30');
	expect(Number(getComputedStyle(aggregate).zIndex)).toBeGreaterThan(
		Number(getComputedStyle(groupCell()).zIndex)
	);
	expect(getComputedStyle(aggregate).backgroundColor).toBe(getComputedStyle(row).backgroundColor);
});

test('a grouped cell payload carries the size of its group', async () => {
	const seen: DataTableCellRenderPayload<(typeof items)[number]>[] = [];
	await render(Harness, { props: { items, onCell: (payload) => seen.push(payload) } });
	await expect.poll(() => seen.filter((payload) => payload.grouped).length).toBeGreaterThan(1);
	const sizes = Object.fromEntries(
		seen
			.filter((payload) => payload.grouped)
			.map((payload) => [String(payload.value), payload.groupSize])
	);
	expect(sizes).toEqual({ 'Nouveau dans la collection': 2, Archivé: 1 });
	expect(
		seen
			.filter((payload) => !payload.grouped)
			.every((payload) => payload.groupSize === 0 || payload.columnId !== 'status')
	).toBe(true);
});
