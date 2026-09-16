// Characterisation of the drawer swipe-to-dismiss gesture. The panel is the whole dialog
// content, so the gesture is deliberately *not* captured on pointerdown: a press that never
// becomes a drag has to leave clicks, text selection and focus inside the drawer alone. Only a
// move past 4px along the dismiss axis promotes the press to a drag, captures the pointer and
// starts moving the panel.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import Harness from './dialogSwipeHarness.test.svelte';
import { DIALOG_Z_BASE } from './dialog.state.svelte.js';
import type { DialogProps } from './dialog.props.js';

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
beforeEach(() => captured.clear());

const POINTER_ID = 7;
/** jsdom has no layout, so the panel has to report the extent the drag is measured against. */
const PANEL_SIZE = 400;

type PointerInit = {
	pos?: number;
	cross?: number;
	t?: number;
	pointerId?: number;
	pointerType?: string;
	axis?: 'x' | 'y';
};

/** Fires a pointer event positioned along the drawer's dismiss axis (vertical by default). */
const firePointer = async (node: Element, type: string, init: PointerInit = {}) => {
	const {
		pos = 0,
		cross = 0,
		t = 0,
		pointerId = POINTER_ID,
		pointerType = 'mouse',
		axis = 'y'
	} = init;
	const event = new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		pointerId,
		button: 0,
		pointerType,
		clientX: axis === 'y' ? cross : pos,
		clientY: axis === 'y' ? pos : cross
	});
	// `timeStamp` is read-only and clock-driven; the velocity rule needs deterministic samples.
	Object.defineProperty(event, 'timeStamp', { configurable: true, value: t });
	await fireEvent(node, event);
	return event;
};

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

const panel = () => {
	// root(role=dialog) > positioner > content: the content node carries the swipe attachment.
	const node = document.querySelector('[role="dialog"]')?.firstElementChild?.firstElementChild;
	if (!(node instanceof HTMLElement)) throw new Error('dialog panel not rendered');
	return node;
};
const backdrop = () => {
	const node = document.querySelector(
		`div[style*="z-index: ${DIALOG_Z_BASE - 1}"]`
	)?.firstElementChild;
	if (!(node instanceof HTMLElement)) throw new Error('dialog backdrop not rendered');
	return node;
};
const readout = (name: string) => screen.getByTestId(name).textContent;
const transform = () => panel().style.transform;

const setup = (props: Partial<DialogProps> & { onAction?: () => void } = {}) => {
	render(Harness, { props });
	const node = panel();
	for (const name of ['offsetHeight', 'offsetWidth'] as const) {
		Object.defineProperty(node, name, { configurable: true, value: PANEL_SIZE });
	}
	return node;
};

describe('Dialog drawer swipe-to-dismiss', () => {
	test('a press that never becomes a drag neither captures the pointer nor swallows the click', async () => {
		const onAction = vi.fn();
		setup({ onAction });
		const button = screen.getByTestId('action');

		const down = await firePointer(button, 'pointerdown', { pos: 300, t: 0 });
		expect(setPointerCapture).not.toHaveBeenCalled();
		// Capturing here would retarget the compatibility mouse events away from the button.
		expect(down.defaultPrevented).toBe(false);

		const up = await firePointer(button, 'pointerup', { pos: 300, t: 40 });
		expect(up.defaultPrevented).toBe(false);
		expect(setPointerCapture).not.toHaveBeenCalled();
		expect(readout('dragging')).toBe('false');
		expect(transform()).toBe('');

		await fireEvent.click(button);
		expect(onAction).toHaveBeenCalledOnce();
	});

	test('a drag past the threshold captures the pointer and moves the panel with the finger', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ onOpenChange });

		await firePointer(node, 'pointerdown', { pos: 100, t: 0 });
		expect(readout('dragging')).toBe('false');

		// 4px is the promotion threshold: still a press, not a drag.
		await firePointer(node, 'pointermove', { pos: 104, t: 300 });
		expect(readout('dragging')).toBe('false');
		expect(transform()).toBe('');

		const promoting = await firePointer(node, 'pointermove', { pos: 140, t: 600 });
		expect(setPointerCapture).toHaveBeenCalledWith(POINTER_ID);
		expect(promoting.defaultPrevented).toBe(true);
		expect(readout('dragging')).toBe('true');
		expect(readout('offset')).toBe('40');
		expect(readout('progress')).toBe(`${40 / PANEL_SIZE}`);
		expect(transform()).toBe(`translate3d(0px, 40px, 0) scale(1)`);
		// The backdrop fades out with the drag, on no transition while the finger drives it.
		expect(backdrop().style.opacity).toBe(`${1 - 40 / PANEL_SIZE}`);
		expect(backdrop().style.transition).toBe('none');
		expect(node.style.transition).toBe('none');

		// Dragging back past the open position is clamped: the panel never lifts off the edge.
		await firePointer(node, 'pointermove', { pos: 60, t: 900 });
		expect(readout('offset')).toBe('0');
		// Back at rest the transform drops off the node entirely rather than writing an identity.
		expect(transform()).toBe('');

		await firePointer(node, 'pointerup', { pos: 60, t: 1200 });
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test('releasing past a quarter of the panel dismisses the drawer', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ onOpenChange });

		await firePointer(node, 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: PANEL_SIZE * 0.25, t: 900 });
		// Exactly a quarter is not past it, and the slow move rules out the velocity escape.
		await firePointer(node, 'pointerup', { pos: PANEL_SIZE * 0.25, t: 1800 });
		expect(onOpenChange).not.toHaveBeenCalled();

		await firePointer(node, 'pointerdown', { pos: 0, t: 2000 });
		await firePointer(node, 'pointermove', { pos: PANEL_SIZE * 0.25 + 1, t: 2900 });
		await firePointer(node, 'pointerup', { pos: PANEL_SIZE * 0.25 + 1, t: 3800 });
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
	});

	test('a flick dismisses on velocity alone, well short of the distance threshold', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ onOpenChange });

		await firePointer(node, 'pointerdown', { pos: 0, t: 0 });
		// 60px in 20ms = 3px/ms, far past the 0.4px/ms flick rule, but only 15% of the panel.
		await firePointer(node, 'pointermove', { pos: 60, t: 20 });
		await firePointer(node, 'pointerup', { pos: 60, t: 25 });
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
	});

	test('a flick that ends in a stationary hold is not a flick any more', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ onOpenChange });

		await firePointer(node, 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 60, t: 20 });
		// Held still past 100ms: the stale velocity sample must not dismiss the drawer.
		await firePointer(node, 'pointermove', { pos: 60, t: 200 });
		await firePointer(node, 'pointerup', { pos: 60, t: 400 });
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test('a short drag snaps the panel back on the next frame', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ onOpenChange });

		await firePointer(node, 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 30, t: 300 });
		expect(readout('offset')).toBe('30');

		await firePointer(node, 'pointerup', { pos: 30, t: 600 });
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(readout('dragging')).toBe('false');
		// Snapping back waits a frame so the re-enabled CSS transition animates the return; the
		// frame can already have fired by the time the pointerup settles, so only the end state
		// is asserted.
		await nextFrame();
		await vi.waitFor(() => expect(readout('offset')).toBe('0'));
		expect(transform()).toBe('');
		expect(backdrop().style.opacity).toBe('');
	});

	test('a drag across the other axis is ignored, and does not spend the gesture', async () => {
		const node = setup();

		await firePointer(node, 'pointerdown', { pos: 0, cross: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 0, cross: 120, t: 100 });
		expect(readout('dragging')).toBe('false');
		expect(setPointerCapture).not.toHaveBeenCalled();

		// The press is still live: moving along the dismiss axis afterwards still drags.
		await firePointer(node, 'pointermove', { pos: 40, cross: 120, t: 200 });
		expect(readout('dragging')).toBe('true');
		expect(readout('offset')).toBe('40');
	});

	test('a drag the wrong way down the axis spends the gesture for good', async () => {
		const node = setup();

		await firePointer(node, 'pointerdown', { pos: 100, t: 0 });
		// Away from the dismissing edge: the drawer cannot be dragged open past its resting place.
		await firePointer(node, 'pointermove', { pos: 90, t: 100 });
		expect(readout('dragging')).toBe('false');

		// Coming back down the axis must not resurrect the rejected press.
		await firePointer(node, 'pointermove', { pos: 260, t: 200 });
		expect(readout('dragging')).toBe('false');
		expect(setPointerCapture).not.toHaveBeenCalled();

		await firePointer(node, 'pointerup', { pos: 260, t: 300 });
		expect(transform()).toBe('');
	});

	test('a second pointer cannot hijack a press that is already down', async () => {
		const node = setup();
		const second = POINTER_ID + 1;

		await firePointer(node, 'pointerdown', { pos: 100, t: 0 });
		await firePointer(node, 'pointermove', { pos: 90, t: 100 }); // spends the first press

		await firePointer(node, 'pointerdown', { pos: 0, t: 200, pointerId: second });
		await firePointer(node, 'pointermove', { pos: 200, t: 300, pointerId: second });
		expect(readout('dragging')).toBe('false');

		// Once the first pointer lifts, a fresh press drags again.
		await firePointer(node, 'pointerup', { pos: 90, t: 400 });
		await firePointer(node, 'pointerdown', { pos: 0, t: 500 });
		await firePointer(node, 'pointermove', { pos: 60, t: 600 });
		expect(readout('dragging')).toBe('true');
	});

	test('a press released outside the panel leaves the gesture ready for the next one', async () => {
		const node = setup();

		await firePointer(node, 'pointerdown', { pos: 100, t: 0 });
		// No capture yet, so the release lands wherever the pointer went.
		await firePointer(document.body, 'pointerup', { pos: 100, t: 100 });

		await firePointer(node, 'pointerdown', { pos: 0, t: 200 });
		await firePointer(node, 'pointermove', { pos: 60, t: 300 });
		expect(readout('dragging')).toBe('true');
	});

	test('pointercancel snaps the panel back instead of dismissing it', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ onOpenChange });

		await firePointer(node, 'pointerdown', { pos: 0, t: 0 });
		// Past both the distance and the velocity rule: only the cancel keeps it open.
		await firePointer(node, 'pointermove', { pos: 300, t: 20 });
		expect(readout('dragging')).toBe('true');

		await firePointer(node, 'pointercancel', { pos: 300, t: 40 });
		expect(readout('dragging')).toBe('false');
		expect(onOpenChange).not.toHaveBeenCalled();

		await nextFrame();
		await vi.waitFor(() => expect(readout('offset')).toBe('0'));
	});

	test('touch drags on the same threshold as the mouse, with no activation delay', async () => {
		const node = setup();

		await firePointer(node, 'pointerdown', { pos: 0, t: 0, pointerType: 'touch' });
		await firePointer(node, 'pointermove', { pos: 4, t: 10, pointerType: 'touch' });
		expect(readout('dragging')).toBe('false');

		await firePointer(node, 'pointermove', { pos: 40, t: 20, pointerType: 'touch' });
		expect(readout('dragging')).toBe('true');
		expect(readout('offset')).toBe('40');
	});

	test('a press on a native control never drags, but a drag handle always does', async () => {
		setup();
		const node = panel();

		// NO_SWIPE_TAGS: the button owns its own pointer gesture.
		await firePointer(screen.getByTestId('action'), 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 80, t: 100 });
		expect(readout('dragging')).toBe('false');
		await firePointer(node, 'pointerup', { pos: 80, t: 200 });

		// `data-no-swipe` opts a region out by hand.
		await firePointer(screen.getByTestId('opted-out'), 'pointerdown', { pos: 0, t: 300 });
		await firePointer(node, 'pointermove', { pos: 80, t: 400 });
		expect(readout('dragging')).toBe('false');
		await firePointer(node, 'pointerup', { pos: 80, t: 500 });

		// The thumb is a drag handle: it drags whatever it sits on.
		const thumb = document.querySelector('[data-drag-handle][aria-hidden="true"]');
		if (!(thumb instanceof HTMLElement)) throw new Error('drag thumb not rendered');
		await firePointer(thumb, 'pointerdown', { pos: 0, t: 600 });
		await firePointer(node, 'pointermove', { pos: 80, t: 700 });
		expect(readout('dragging')).toBe('true');
		expect(readout('offset')).toBe('80');
	});

	test('a scrollable region keeps the gesture until it is scrolled to the dismissing edge', async () => {
		setup();
		const node = panel();
		const scroller = screen.getByTestId('scroller');
		Object.defineProperty(scroller, 'scrollTop', { configurable: true, value: 24, writable: true });

		await firePointer(scroller, 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 80, t: 100 });
		expect(readout('dragging')).toBe('false');
		await firePointer(node, 'pointerup', { pos: 80, t: 200 });

		// Scrolled back to the top, dragging down can only mean "dismiss".
		Object.defineProperty(scroller, 'scrollTop', { configurable: true, value: 0, writable: true });
		await firePointer(scroller, 'pointerdown', { pos: 0, t: 300 });
		await firePointer(node, 'pointermove', { pos: 80, t: 400 });
		expect(readout('dragging')).toBe('true');
	});

	test('`swipeFrom: handle` refuses drags that start on the panel body', async () => {
		setup({ swipeFrom: 'handle' });
		const node = panel();

		await firePointer(screen.getByTestId('body'), 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 120, t: 100 });
		expect(readout('dragging')).toBe('false');
		await firePointer(node, 'pointerup', { pos: 120, t: 200 });

		const thumb = document.querySelector('[data-drag-handle][aria-hidden="true"]');
		if (!(thumb instanceof HTMLElement)) throw new Error('drag thumb not rendered');
		await firePointer(thumb, 'pointerdown', { pos: 0, t: 300 });
		await firePointer(node, 'pointermove', { pos: 120, t: 400 });
		expect(readout('dragging')).toBe('true');
	});

	test('a horizontal drawer swipes along its own axis and sign', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ type: 'drawerLeft', onOpenChange });

		// `drawerLeft` dismisses toward −x, so a drag to the right is the wrong way.
		await firePointer(node, 'pointerdown', { pos: 0, axis: 'x', t: 0 });
		await firePointer(node, 'pointermove', { pos: 40, axis: 'x', t: 100 });
		expect(readout('dragging')).toBe('false');
		await firePointer(node, 'pointerup', { pos: 40, axis: 'x', t: 200 });

		await firePointer(node, 'pointerdown', { pos: 0, axis: 'x', t: 300 });
		await firePointer(node, 'pointermove', { pos: -40, axis: 'x', t: 600 });
		expect(readout('dragging')).toBe('true');
		expect(readout('offset')).toBe('-40');
		expect(transform()).toBe('translate3d(-40px, 0px, 0) scale(1)');

		await firePointer(node, 'pointermove', { pos: -PANEL_SIZE * 0.3, axis: 'x', t: 1500 });
		await firePointer(node, 'pointerup', { pos: -PANEL_SIZE * 0.3, axis: 'x', t: 2400 });
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
	});

	test('swipe stays off when the drawer opts out of it', async () => {
		const node = setup({ swipeToDismiss: false });

		await firePointer(node, 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 200, t: 100 });
		expect(readout('dragging')).toBe('false');
		expect(transform()).toBe('');
		expect(setPointerCapture).not.toHaveBeenCalled();
	});
});
