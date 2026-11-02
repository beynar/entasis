// DataTable row reordering in real engines (Chromium and WebKit): a row drags by its grip or moves
// with the keyboard, the table shows the new order, and `onRowMove` reports it once, in `items`
// indices. A sort pauses it, and `canDragRow` holds a row in place.
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame } from '$lib/testing/browser.test-helper.js';
import Harness from './DataTableRowReorderHarness.test.svelte';

type Props = NonNullable<Parameters<typeof Harness>[1]>;
const mount = async (props: Props = {}) => {
	render(Harness, { props });
	await nextFrame();
	await nextFrame();
};
const order = () => document.querySelector('[data-testid="order"]')!.textContent;
const renderedOrder = () =>
	[...document.querySelectorAll<HTMLElement>('tbody tr[data-row-id]')]
		.map((row) => row.dataset.rowId)
		.join(',');
const grip = (rowId: string) =>
	document.querySelector<HTMLButtonElement>(`tr[data-row-id="${rowId}"] [data-dnd-handle]`)!;
const row = (rowId: string) => document.querySelector<HTMLElement>(`tr[data-row-id="${rowId}"]`)!;

const frames = async (count: number) => {
	for (let index = 0; index < count; index += 1) await nextFrame();
};
const fire = (type: string, target: Element, x: number, y: number, dataTransfer: DataTransfer) =>
	target.dispatchEvent(
		new DragEvent(type, {
			bubbles: true,
			cancelable: true,
			composed: true,
			clientX: x,
			clientY: y,
			dataTransfer
		})
	);

// Synthetic native drag events: the element adapter starts from `dragstart` on the draggable row
// and tracks the pointer from `dragover`, as it does for a trusted gesture.
async function dragRow(rowId: string, overRowId: string, half: 'top' | 'bottom') {
	const handle = grip(rowId);
	const source = handle.closest<HTMLElement>('[draggable="true"]')!;
	const dataTransfer = new DataTransfer();
	const start = handle.getBoundingClientRect();
	const startX = start.left + start.width / 2;
	const startY = start.top + start.height / 2;
	handle.dispatchEvent(
		new PointerEvent('pointerdown', {
			bubbles: true,
			clientX: startX,
			clientY: startY,
			isPrimary: true
		})
	);
	fire('dragstart', source, startX, startY, dataTransfer);
	await frames(2);
	const over = row(overRowId).getBoundingClientRect();
	const x = over.left + over.width / 2;
	const y = half === 'top' ? over.top + over.height * 0.25 : over.top + over.height * 0.75;
	for (let index = 0; index < 6; index += 1) {
		const target = document.elementFromPoint(x, y) ?? document.body;
		fire('dragenter', target, x, y, dataTransfer);
		fire('dragover', target, x, y, dataTransfer);
		await nextFrame();
	}
	fire('drop', document.elementFromPoint(x, y) ?? document.body, x, y, dataTransfer);
	fire('dragend', source, x, y, dataTransfer);
	await frames(3);
}

describe('DataTable row reordering', () => {
	test('a row dragged by its grip lands in its new place and is reported once', async () => {
		const onRowMove = vi.fn();
		await mount({ onRowMove });
		expect(grip('p1').getAttribute('aria-label')).toBe(
			'Move row 1 with the up and down arrow keys'
		);

		await dragRow('p1', 'p3', 'bottom');
		await expect.poll(order).toBe('p2,p3,p1,p4,p5');
		await expect.poll(renderedOrder).toBe('p2,p3,p1,p4,p5');
		expect(onRowMove).toHaveBeenCalledOnce();
		const move = onRowMove.mock.calls[0][0];
		expect(move.row.id).toBe('p1');
		expect([move.from, move.to]).toEqual([0, 2]);
		expect(move.rows.map((person: { id: string }) => person.id)).toEqual([
			'p2',
			'p3',
			'p1',
			'p4',
			'p5'
		]);
		expect([move.after?.id, move.before?.id]).toEqual(['p3', 'p4']);
	});

	test('a drop on its own place moves nothing and reports nothing', async () => {
		const onRowMove = vi.fn();
		await mount({ onRowMove });
		await dragRow('p2', 'p2', 'top');
		await frames(2);
		expect(order()).toBe('p1,p2,p3,p4,p5');
		expect(onRowMove).not.toHaveBeenCalled();
	});

	test('on a later page the move keeps every other page in place', async () => {
		const onRowMove = vi.fn();
		await mount({
			count: 6,
			pagination: { pageSize: 3 },
			initialState: { pagination: { page: 2, pageSize: 3 } },
			onRowMove
		});
		expect(renderedOrder()).toBe('p4,p5,p6');
		await dragRow('p6', 'p4', 'top');
		await expect.poll(order).toBe('p1,p2,p3,p6,p4,p5');
		const move = onRowMove.mock.calls[0][0];
		expect([move.from, move.to]).toEqual([5, 3]);
		expect([move.after?.id, move.before?.id]).toEqual(['p3', 'p4']);
	});

	test('the grip moves its row with the arrow keys, Home and End, and announces it', async () => {
		const onRowMove = vi.fn();
		await mount({ onRowMove });
		grip('p2').focus();
		await userEvent.keyboard('{ArrowDown}');
		await expect.poll(order).toBe('p1,p3,p2,p4,p5');
		await expect.poll(() => document.activeElement === grip('p2')).toBe(true);
		expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe(
			'Row moved to position 3 of 5'
		);

		await userEvent.keyboard('{End}');
		await expect.poll(order).toBe('p1,p3,p4,p5,p2');
		await expect.poll(() => document.activeElement === grip('p2')).toBe(true);
		await userEvent.keyboard('{Home}');
		await expect.poll(order).toBe('p2,p1,p3,p4,p5');
		await userEvent.keyboard('{ArrowUp}');
		await frames(2);
		expect(order()).toBe('p2,p1,p3,p4,p5');
		expect(onRowMove).toHaveBeenCalledTimes(3);
	});

	test('a sort pauses reordering and says why', async () => {
		const onRowMove = vi.fn();
		await mount({ onRowMove, initialState: { sorting: [{ id: 'name', desc: true }] } });
		expect(grip('p1').disabled).toBe(true);
		expect(grip('p1').closest('td')?.title).toBe(
			'Clear sorting, filters and grouping to reorder rows'
		);
		await dragRow('p5', 'p1', 'bottom');
		await frames(2);
		expect(order()).toBe('p1,p2,p3,p4,p5');
		expect(onRowMove).not.toHaveBeenCalled();
	});

	test('canDragRow holds a row in place while the others still pass it', async () => {
		const onRowMove = vi.fn();
		await mount({ onRowMove, canDragRow: (person) => person.id !== 'p1' });
		expect(grip('p1').disabled).toBe(true);
		expect(grip('p2').disabled).toBe(false);
		await dragRow('p1', 'p3', 'bottom');
		await frames(2);
		expect(order()).toBe('p1,p2,p3,p4,p5');
		await dragRow('p3', 'p1', 'top');
		await expect.poll(order).toBe('p3,p1,p2,p4,p5');
	});

	test('a virtualized table reorders too', async () => {
		await mount({ count: 20, virtualize: true });
		await dragRow('p1', 'p2', 'bottom');
		await expect
			.poll(order)
			.toBe('p2,p1,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19,p20');
	});
});
