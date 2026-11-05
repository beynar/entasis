// The selection and actions columns are pinned, with a background of their own, so a tint on the row
// alone stops at them. This is what the docs say to write instead, in a real browser.
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './DataTableRowStateHarness.test.svelte';

const items = [
	{ id: 'a', name: 'Ada' },
	{ id: 'b', name: 'Bob' }
];

const cell = (row: string, column: string) =>
	document.querySelector<HTMLElement>(`tr[data-row-id="${row}"] td[data-column-id="${column}"]`)!;

const background = (row: string, column: string) =>
	getComputedStyle(cell(row, column)).backgroundColor;

// Painted over nothing: fully opaque paint leaves an alpha of 255, whatever syntax the engine reports.
const alphaOf = (color: string) => {
	const context = document.createElement('canvas').getContext('2d')!;
	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	return context.getImageData(0, 0, 1, 1).data[3];
};

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

test('a focused pinned cell stays opaque, with the tint of focus over its surface', async () => {
	await render(Harness, { props: { items, interactionMode: 'grid' } });
	await expect.poll(() => document.querySelector('tr[data-row-id="a"]')).not.toBeNull();
	const resting = background('a', '__actions');
	expect(alphaOf(resting)).toBe(255);

	cell('a', 'name').focus();
	await expect.poll(() => cell('a', 'name').hasAttribute('data-focused')).toBe(true);
	// Not pinned: the tint is the cell's own background, as before.
	const plainTint = alphaOf(background('a', 'name'));
	expect(plainTint).toBeGreaterThan(0);
	expect(plainTint).toBeLessThan(255);
	expect(getComputedStyle(cell('a', 'name'), '::before').content).toBe('none');

	cell('a', '__actions').focus();
	await expect.poll(() => cell('a', '__actions').hasAttribute('data-focused')).toBe(true);
	expect(background('a', '__actions')).toBe(resting);
	const tint = getComputedStyle(cell('a', '__actions'), '::before').backgroundColor;
	expect(alphaOf(tint)).toBe(plainTint);
});

test('the row tint the docs give is opaque, so a pinned cell hides what scrolls under it', async () => {
	await render(Harness, {
		props: {
			items,
			getRowAttrs: () => ({ 'data-change': 'added' }),
			theme: { row: { base: '[&[data-change=added]>td]:bg-success-muted' } }
		}
	});
	await expect.poll(() => document.querySelector('tr[data-row-id="a"]')).not.toBeNull();
	expect(alphaOf(background('a', '__actions'))).toBe(255);
});
