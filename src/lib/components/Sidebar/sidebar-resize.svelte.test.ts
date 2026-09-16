// The resize handle drags through `createPointerDrag`: it captures the pointer (so the drag
// survives the pointer leaving the document), only tracks past a 3px threshold, and releases the
// capture on every termination.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import SidebarResizeHarness from './SidebarResizeHarness.test.svelte';

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

const POINTER_ID = 4;
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

const query = (selector: string) => {
	const node = document.querySelector(selector);
	if (!(node instanceof HTMLElement)) throw new Error(`${selector} not rendered`);
	return node;
};
const handle = () => query('[data-slot="sidebar-resize-handle"]');
/** jsdom has no layout, so the panel has to report the width the drag starts from. */
const startPanelWidth = (width: number) => {
	const panel = query('[data-slot="sidebar-container"]');
	panel.getBoundingClientRect = () => new DOMRect(0, 0, width, 600);
	return width;
};
const width = (node: HTMLElement) => Number(node.getAttribute('aria-valuenow'));

describe('sidebar resize', () => {
	test('captures the pointer and resizes the panel until the drag ends', async () => {
		render(SidebarResizeHarness);
		const resizeHandle = handle();
		const start = startPanelWidth(260);

		await firePointer(resizeHandle, 'pointerdown', start);
		expect(setPointerCapture).toHaveBeenCalledWith(POINTER_ID);
		expect(resizeHandle.dataset.dragging).toBe('true');

		await firePointer(resizeHandle, 'pointermove', start + 60);
		expect(width(resizeHandle)).toBe(start + 60);

		await firePointer(resizeHandle, 'pointerup', start + 60);
		expect(resizeHandle.dataset.dragging).toBeUndefined();
		expect(releasePointerCapture).toHaveBeenCalledWith(POINTER_ID);

		// The gesture is over: a stray move must not keep resizing.
		await firePointer(resizeHandle, 'pointermove', start + 200);
		expect(width(resizeHandle)).toBe(start + 60);
	});

	test('ignores a sub-threshold twitch so a combined rail handle still toggles on click', async () => {
		render(SidebarResizeHarness, { props: { rail: true } });
		const resizeHandle = handle();
		const start = startPanelWidth(260);
		const before = width(resizeHandle);

		await firePointer(resizeHandle, 'pointerdown', start);
		await firePointer(resizeHandle, 'pointermove', start + 2);
		expect(width(resizeHandle)).toBe(before);
		await firePointer(resizeHandle, 'pointerup', start + 2);

		await fireEvent.click(resizeHandle);
		expect(query('[data-slot="sidebar-wrapper"]').dataset.displayState).toBe('hidden');
	});

	test('swallows the click that ends a real drag so the rail does not toggle', async () => {
		render(SidebarResizeHarness, { props: { rail: true } });
		const resizeHandle = handle();
		const start = startPanelWidth(260);

		await firePointer(resizeHandle, 'pointerdown', start);
		await firePointer(resizeHandle, 'pointermove', start + 60);
		await firePointer(resizeHandle, 'pointerup', start + 60);

		await fireEvent.click(resizeHandle);
		expect(query('[data-slot="sidebar-wrapper"]').dataset.displayState).toBe('expanded');
	});

	test('ends the drag when the capture is lost', async () => {
		render(SidebarResizeHarness);
		const resizeHandle = handle();
		const start = startPanelWidth(260);

		await firePointer(resizeHandle, 'pointerdown', start);
		await firePointer(resizeHandle, 'pointermove', start + 40);
		expect(width(resizeHandle)).toBe(start + 40);

		await firePointer(resizeHandle, 'lostpointercapture', start + 40);
		expect(resizeHandle.dataset.dragging).toBeUndefined();

		await firePointer(resizeHandle, 'pointermove', start + 200);
		expect(width(resizeHandle)).toBe(start + 40);
	});

	test('clamps the dragged width to the configured bounds', async () => {
		render(SidebarResizeHarness, { props: { resizable: { minWidth: 200, maxWidth: 400 } } });
		const resizeHandle = handle();
		const start = startPanelWidth(260);

		await firePointer(resizeHandle, 'pointerdown', start);
		await firePointer(resizeHandle, 'pointermove', start + 500);
		expect(width(resizeHandle)).toBe(400);

		// Still above the collapse threshold (25% of minWidth), so it clamps instead of collapsing.
		await firePointer(resizeHandle, 'pointermove', start - 160);
		expect(width(resizeHandle)).toBe(200);
		await firePointer(resizeHandle, 'pointerup', start - 160);
	});

	test('collapses the panel when the drag crosses the collapse threshold', async () => {
		render(SidebarResizeHarness, { props: { resizable: { minWidth: 200, maxWidth: 400 } } });
		const resizeHandle = handle();
		const start = startPanelWidth(260);

		await firePointer(resizeHandle, 'pointerdown', start);
		await firePointer(resizeHandle, 'pointermove', start - 240);
		expect(query('[data-slot="sidebar-wrapper"]').dataset.displayState).toBe('hidden');
		await firePointer(resizeHandle, 'pointerup', start - 240);
	});
});
