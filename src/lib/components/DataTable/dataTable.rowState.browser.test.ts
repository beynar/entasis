// The selection and actions columns are pinned, with a background of their own, so a tint on the row
// alone stops at them. This is what the docs say to write instead, in a real browser.
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './DataTableRowStateHarness.test.svelte';

const items = [
	{ id: 'a', name: 'Ada' },
	{ id: 'b', name: 'Bob' }
];

const background = (row: string, column: string) =>
	getComputedStyle(
		document.querySelector(`tr[data-row-id="${row}"] td[data-column-id="${column}"]`)!
	).backgroundColor;

test('a row tint reaches the pinned columns, a cell tint its whole cell', async () => {
	await render(Harness, {
		props: {
			items,
			getRowAttrs: (row: { id: string }) => ({
				'data-change': row.id === 'a' ? 'added' : undefined
			}),
			getCellAttrs: ({ row, columnId }: { row: { id: string }; columnId: string }) => ({
				'data-changed': row.id === 'b' && columnId === 'name' ? 'true' : undefined
			}),
			theme: {
				row: { base: '[&[data-change=added]>td]:bg-success-muted' },
				cell: { base: 'data-[changed=true]:bg-warning-muted' }
			}
		}
	});
	await expect.poll(() => document.querySelector('tr[data-row-id="a"]')).not.toBeNull();

	const untouched = background('b', '__actions');
	const tint = background('a', 'name');
	expect(tint).not.toBe(background('b', '__selection'));
	expect(background('a', '__selection')).toBe(tint);
	expect(background('a', '__actions')).toBe(tint);
	expect(background('b', 'name')).not.toBe(untouched);
	expect(background('b', 'name')).not.toBe(tint);
});
