// Column resizing runs through `createPointerDrag`, which captures the pointer on the handle:
// the drag keeps tracking while the pointer is outside the document and always terminates.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import Harness from './DataTableInFlowHarness.test.svelte';

// jsdom implements no pointer capture at all, so stand in for it and record the calls.
const captured = new Set<number>();
const setPointerCapture = vi.fn((id: number) => void captured.add(id));
const releasePointerCapture = vi.fn((id: number) => void captured.delete(id));
const pointerCaptureStubs = {
	setPointerCapture,
	releasePointerCapture,
	hasPointerCapture: (id: number) => captured.has(id)
};
beforeAll(() => {
	for (const [name, value] of Object.entries(pointerCaptureStubs)) {
		Object.defineProperty(Element.prototype, name, { configurable: true, writable: true, value });
	}
});
afterAll(() => {
	for (const name of Object.keys(pointerCaptureStubs)) {
		Reflect.deleteProperty(Element.prototype, name);
	}
	captured.clear();
});

const POINTER_ID = 9;
const firePointer = (node: HTMLElement, type: string, clientX: number) =>
	fireEvent(
		node,
		new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			pointerId: POINTER_ID,
			button: 0,
			clientX,
			clientY: 0
		})
	);

const people = [
	{ id: 'person-0', name: 'Ada', role: 'Engineer' },
	{ id: 'person-1', name: 'Grace', role: 'Designer' }
];

const resizeHandle = () => screen.findByRole('separator', { name: 'Resize Name' });
const width = (handle: HTMLElement) => Number(handle.getAttribute('aria-valuenow'));

describe('DataTable column resize', () => {
	test('captures the pointer and tracks the drag until it ends', async () => {
		render(Harness, { props: { items: people } });
		const handle = await resizeHandle();
		const startWidth = width(handle);

		await firePointer(handle, 'pointerdown', 100);
		// Without capture the drag dropped as soon as the pointer left the document.
		expect(setPointerCapture).toHaveBeenCalledWith(POINTER_ID);
		expect(handle.dataset.resizing).toBe('true');

		await firePointer(handle, 'pointermove', 160);
		expect(width(handle)).toBe(startWidth + 60);

		await firePointer(handle, 'pointermove', 130);
		expect(width(handle)).toBe(startWidth + 30);

		await firePointer(handle, 'pointerup', 130);
		expect(handle.dataset.resizing).toBe('false');
		expect(releasePointerCapture).toHaveBeenCalledWith(POINTER_ID);

		// The gesture is over: a stray move must not keep resizing.
		await firePointer(handle, 'pointermove', 400);
		expect(width(handle)).toBe(startWidth + 30);
	});

	test('ends the drag when the capture is lost', async () => {
		render(Harness, { props: { items: people } });
		const handle = await resizeHandle();
		const startWidth = width(handle);

		await firePointer(handle, 'pointerdown', 100);
		await firePointer(handle, 'pointermove', 140);
		expect(width(handle)).toBe(startWidth + 40);

		await firePointer(handle, 'lostpointercapture', 140);
		expect(handle.dataset.resizing).toBe('false');

		await firePointer(handle, 'pointermove', 300);
		expect(width(handle)).toBe(startWidth + 40);
	});

	test('clamps the dragged width to the column bounds', async () => {
		render(Harness, { props: { items: people } });
		const handle = await resizeHandle();

		await firePointer(handle, 'pointerdown', 100);
		await firePointer(handle, 'pointermove', -400);
		expect(width(handle)).toBe(Number(handle.getAttribute('aria-valuemin')));

		await firePointer(handle, 'pointermove', 2000);
		expect(width(handle)).toBe(Number(handle.getAttribute('aria-valuemax')));
		await firePointer(handle, 'pointerup', 2000);
	});
});
