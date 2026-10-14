// Characterisation of the drawer swipe-to-dismiss gesture. The panel is the whole dialog
// content, so the gesture is deliberately *not* captured on pointerdown: a press that never
// becomes a drag has to leave clicks, text selection and focus inside the drawer alone. Only a
// move past 4px along the dismiss axis (and not mostly across it) promotes the press to a drag, captures the pointer and
// starts moving the panel.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import Harness from './dialogSwipeHarness.test.svelte';
import StackHarness from './dialogStackSwipeHarness.test.svelte';
import { DIALOG_Z_BASE } from './dialog.state.svelte.js';
import type { DialogProps } from './dialog.props.js';
import type { OpenChangeDetails } from '$lib/utils/openChange.js';

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

/**
 * Fires a pointer event positioned along the drawer's dismiss axis (vertical by default). A
 * finger by default: a mouse or pen drags a drawer only from its handles.
 */
const firePointer = async (node: Element, type: string, init: PointerInit = {}) => {
	const {
		pos = 0,
		cross = 0,
		t = 0,
		pointerId = POINTER_ID,
		pointerType = 'touch',
		axis = 'y'
	} = init;
	const event = new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		pointerId,
		button: 0,
		// The primary button is held from the press until the release, as in a real drag.
		buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
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
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			false,
			expect.objectContaining({ reason: 'swipe', event: expect.any(PointerEvent) })
		);
	});

	test('a swipe close that onOpenChange cancels snaps back and keeps the drawer open', async () => {
		const onOpenChange = vi.fn((open: boolean, details: OpenChangeDetails) => {
			if (!open) details.cancel();
		});
		const node = setup({ onOpenChange });

		await firePointer(node, 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: PANEL_SIZE * 0.5, t: 900 });
		await firePointer(node, 'pointerup', { pos: PANEL_SIZE * 0.5, t: 1800 });
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			false,
			expect.objectContaining({ reason: 'swipe' })
		);
		await nextFrame();
		expect(readout('offset')).toBe('0');
		expect(transform()).toBe('');
		expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
	});

	test('a flick dismisses on velocity alone, well short of the distance threshold', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ onOpenChange });

		await firePointer(node, 'pointerdown', { pos: 0, t: 0 });
		// 60px in 20ms = 3px/ms, far past the 0.4px/ms flick rule, but only 15% of the panel.
		await firePointer(node, 'pointermove', { pos: 60, t: 20 });
		await firePointer(node, 'pointerup', { pos: 60, t: 25 });
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			false,
			expect.objectContaining({ reason: 'swipe', event: expect.any(PointerEvent) })
		);
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

	test('a flick that ends with an almost stationary move still dismisses', async () => {
		// Android Chrome sends one last move that barely changes the position right before release.
		const onOpenChange = vi.fn();
		const node = setup({ onOpenChange });

		await firePointer(node, 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 20, t: 8 });
		await firePointer(node, 'pointermove', { pos: 40, t: 16 });
		await firePointer(node, 'pointermove', { pos: 60, t: 24 });
		await firePointer(node, 'pointermove', { pos: 60.5, t: 34 });
		await firePointer(node, 'pointerup', { pos: 60.5, t: 35 });
		expect(onOpenChange).toHaveBeenCalledOnce();
		expect(onOpenChange.mock.calls[0][0]).toBe(false);
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

	test('a drag across the other axis is spent: a sideways drag never starts the drawer', async () => {
		const node = setup();

		await firePointer(node, 'pointerdown', { pos: 0, cross: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 0, cross: 120, t: 100 });
		expect(readout('dragging')).toBe('false');
		expect(setPointerCapture).not.toHaveBeenCalled();

		// The press went across, so moving down the dismiss axis afterwards does not take it over.
		await firePointer(node, 'pointermove', { pos: 40, cross: 120, t: 200 });
		await firePointer(node, 'pointermove', { pos: 200, cross: 120, t: 300 });
		expect(readout('dragging')).toBe('false');
		expect(setPointerCapture).not.toHaveBeenCalled();
		await firePointer(node, 'pointerup', { pos: 200, cross: 120, t: 400 });
		expect(transform()).toBe('');
	});

	test('a horizontal drag with downward drift never drags a bottom drawer', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ onOpenChange });

		await firePointer(node, 'pointerdown', { pos: 0, cross: 0, t: 0 });
		// A carousel swipe: well over the 4px the drawer used to need, but mostly sideways.
		for (let i = 1; i <= 8; i += 1) {
			await firePointer(node, 'pointermove', { pos: i * 3, cross: i * 20, t: i * 16 });
		}
		expect(readout('dragging')).toBe('false');
		await firePointer(node, 'pointerup', { pos: 24, cross: 160, t: 140 });
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(transform()).toBe('');
	});

	test('a drag along the dismiss axis with a little sideways drift still drags', async () => {
		const node = setup();

		await firePointer(node, 'pointerdown', { pos: 0, cross: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 12, cross: 5, t: 50 });
		expect(readout('dragging')).toBe('true');
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
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			false,
			expect.objectContaining({ reason: 'swipe', event: expect.any(PointerEvent) })
		);
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

describe('Dialog swipe: text selection and pointer type (OV-10)', () => {
	test('a mouse drag on the body selects text instead of dismissing the drawer', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ onOpenChange });

		await firePointer(screen.getByTestId('body'), 'pointerdown', {
			pos: 0,
			t: 0,
			pointerType: 'mouse'
		});
		await firePointer(node, 'pointermove', { pos: 200, t: 100, pointerType: 'mouse' });
		expect(readout('dragging')).toBe('false');
		expect(setPointerCapture).not.toHaveBeenCalled();
		await firePointer(node, 'pointerup', { pos: 200, t: 200, pointerType: 'mouse' });
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test('a pen drag on the body does not swipe either', async () => {
		const node = setup();

		await firePointer(screen.getByTestId('body'), 'pointerdown', {
			pos: 0,
			t: 0,
			pointerType: 'pen'
		});
		await firePointer(node, 'pointermove', { pos: 200, t: 100, pointerType: 'pen' });
		expect(readout('dragging')).toBe('false');
	});

	test('a mouse drag on the header and on the thumb still dismisses', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ title: 'Drawer', onOpenChange });
		const header = document.querySelector('header[data-drag-handle]');
		if (!(header instanceof HTMLElement)) throw new Error('drawer header not rendered');

		await firePointer(header, 'pointerdown', { pos: 0, t: 0, pointerType: 'mouse' });
		await firePointer(node, 'pointermove', { pos: 40, t: 300, pointerType: 'mouse' });
		expect(readout('dragging')).toBe('true');
		await firePointer(node, 'pointermove', { pos: PANEL_SIZE * 0.5, t: 900, pointerType: 'mouse' });
		await firePointer(node, 'pointerup', { pos: PANEL_SIZE * 0.5, t: 1500, pointerType: 'mouse' });
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			false,
			expect.objectContaining({ reason: 'swipe', interaction: 'mouse' })
		);
	});

	test('a touch drag with an active text selection in the panel does not dismiss', async () => {
		const onOpenChange = vi.fn();
		const node = setup({ onOpenChange });
		const body = screen.getByTestId('body');
		window.getSelection()?.selectAllChildren(body);
		expect(window.getSelection()?.isCollapsed).toBe(false);

		await firePointer(body, 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 200, t: 100 });
		expect(readout('dragging')).toBe('false');
		await firePointer(node, 'pointerup', { pos: 200, t: 200 });
		expect(onOpenChange).not.toHaveBeenCalled();

		// Once the selection is gone the same drag swipes.
		window.getSelection()?.removeAllRanges();
		await firePointer(body, 'pointerdown', { pos: 0, t: 300 });
		await firePointer(node, 'pointermove', { pos: 200, t: 400 });
		expect(readout('dragging')).toBe('true');
	});
});

describe('Dialog swipe in right-to-left scrollers (CX-14)', () => {
	const defineScroller = (scroller: HTMLElement, scrollLeft: number) => {
		Object.defineProperty(scroller, 'scrollWidth', { configurable: true, value: 300 });
		Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: 100 });
		Object.defineProperty(scroller, 'scrollLeft', { configurable: true, value: scrollLeft });
	};

	test('a right-to-left scroller that can still scroll back keeps a drag toward the right edge', async () => {
		const node = setup({ type: 'drawerRight' });
		const scroller = screen.getByTestId('x-scroller');
		// At its start edge (the right end), scrollLeft is 0 and there is content to the left.
		defineScroller(scroller, 0);

		await firePointer(scroller, 'pointerdown', { pos: 0, axis: 'x', t: 0 });
		await firePointer(node, 'pointermove', { pos: 80, axis: 'x', t: 100 });
		expect(readout('dragging')).toBe('false');
	});

	test('scrolled to its far (left) end, nothing is left to scroll back and the drag dismisses', async () => {
		const node = setup({ type: 'drawerRight' });
		const scroller = screen.getByTestId('x-scroller');
		defineScroller(scroller, -200);

		await firePointer(scroller, 'pointerdown', { pos: 0, axis: 'x', t: 0 });
		await firePointer(node, 'pointermove', { pos: 80, axis: 'x', t: 100 });
		expect(readout('dragging')).toBe('true');
	});
});

describe('Dialog stack follows a child swipe (OV-12)', () => {
	test("the parent's scale and fade track the child's drag progress", async () => {
		render(StackHarness);
		await fireEvent.click(await screen.findByRole('button', { name: 'Open child' }));
		const dialogs = await screen.findAllByRole('dialog');
		expect(dialogs).toHaveLength(2);
		const panelOf = (root: HTMLElement) => {
			const node = root.firstElementChild?.firstElementChild;
			if (!(node instanceof HTMLElement)) throw new Error('panel not rendered');
			return node;
		};
		const parent = panelOf(dialogs[0]);
		const child = panelOf(dialogs[1]);
		for (const name of ['offsetHeight', 'offsetWidth'] as const) {
			Object.defineProperty(child, name, { configurable: true, value: PANEL_SIZE });
		}
		const parentFade = () => parent.querySelector<HTMLElement>(':scope > div')!.style.opacity;
		// Resting: one level down.
		expect(parent.style.transform).toContain('scale(0.94)');
		expect(parentFade()).toBe('0.65');

		await firePointer(child, 'pointerdown', { pos: 0, t: 0 });
		await firePointer(child, 'pointermove', { pos: PANEL_SIZE * 0.5, t: 600 });
		expect(child.style.transform).toContain(`translate3d(0px, ${PANEL_SIZE * 0.5}px, 0)`);
		// Half dismissed: halfway back to full size and opacity.
		expect(parent.style.transform).toContain('scale(0.97)');
		expect(Number(parentFade())).toBeCloseTo(0.825, 3);
		// While the finger drives it, the parent follows without easing.
		expect(parent.style.transition).toBe('none');

		await firePointer(child, 'pointermove', { pos: 0, t: 1200 });
		expect(parent.style.transform).toContain('scale(0.94)');
	});
});

describe('Dialog snap points (DLG-5)', () => {
	const AVAILABLE = 800;
	const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
	beforeAll(() => {
		// jsdom has no layout: the positioner reports the room the snap points are measured against.
		Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
			configurable: true,
			get: () => AVAILABLE
		});
	});
	afterAll(() => {
		if (clientHeight) Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight);
		else Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
	});

	const snapSetup = (props: Partial<DialogProps> = {}) => {
		const node = setup({ snapPoints: [0.25, 0.5, 1], ...props });
		return node;
	};
	/** Drags the panel by `distance` px along the axis and releases it after `ms`. */
	const dragBy = async (node: Element, distance: number, ms = 900, from = 0) => {
		await firePointer(node, 'pointerdown', { pos: from, t: 0 });
		await firePointer(node, 'pointermove', { pos: from + distance, t: ms });
		await firePointer(node, 'pointerup', { pos: from + distance, t: ms + 900 });
		await nextFrame();
	};

	test('the panel is as tall as the largest point and opens there', async () => {
		const node = snapSetup();
		expect(node.style.height).toBe(`${AVAILABLE}px`);
		expect(readout('snap')).toBe('1');
		expect(readout('offset')).toBe('0');
		expect(transform()).toBe('');
	});

	test('defaultSnapPoint opens the drawer lower, offset by the part of the panel that is hidden', async () => {
		const node = snapSetup({ defaultSnapPoint: 0.5 });
		expect(readout('snap')).toBe('0.5');
		expect(readout('offset')).toBe(`${AVAILABLE * 0.5}`);
		expect(transform()).toBe(`translate3d(0px, ${AVAILABLE * 0.5}px, 0) scale(1)`);
		expect(node.style.height).toBe(`${AVAILABLE}px`);
	});

	test('the body scrolls only at the largest point', async () => {
		const node = snapSetup({ defaultSnapPoint: 0.5 });
		// A class: an inline overflow-y would be lost when the intro transition rewrites `overflow`.
		expect(node.classList.contains('overflow-y-hidden!')).toBe(true);
		expect(node.style.overflowY).toBe('');
		expect(node.style.touchAction).toBe('none');
		await dragBy(node, -AVAILABLE * 0.5);
		expect(readout('snap')).toBe('1');
		expect(node.classList.contains('overflow-y-hidden!')).toBe(false);
		expect(node.style.touchAction).toBe('');
	});

	test('a drag past the middle rests at the next point and reports it', async () => {
		const onSnapPointChange = vi.fn();
		const onOpenChange = vi.fn();
		const node = snapSetup({ onSnapPointChange, onOpenChange });

		// 1 → 0.5 is 400px away; 300px is nearer to it than to staying.
		await dragBy(node, 300);
		expect(onSnapPointChange).toHaveBeenCalledExactlyOnceWith({
			snapPoint: 0.5,
			details: expect.objectContaining({ reason: 'swipe', event: expect.any(PointerEvent) })
		});
		expect(readout('snap')).toBe('0.5');
		await vi.waitFor(() => expect(readout('offset')).toBe(`${AVAILABLE * 0.5}`));
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
	});

	test('a short drag returns to where it was without reporting a change', async () => {
		const onSnapPointChange = vi.fn();
		const node = snapSetup({ onSnapPointChange });
		await dragBy(node, 100);
		expect(onSnapPointChange).not.toHaveBeenCalled();
		await vi.waitFor(() => expect(readout('offset')).toBe('0'));
		expect(readout('snap')).toBe('1');
	});

	test('dragging up from a lower point opens it further', async () => {
		const node = snapSetup({ defaultSnapPoint: 0.25 });
		expect(readout('offset')).toBe(`${AVAILABLE * 0.75}`);
		await dragBy(node, -300);
		expect(readout('snap')).toBe('0.5');
	});

	test('at the largest point an upward drag is left to the body, which scrolls', async () => {
		const node = snapSetup();
		await firePointer(node, 'pointerdown', { pos: 400, t: 0 });
		await firePointer(node, 'pointermove', { pos: 300, t: 100 });
		expect(readout('dragging')).toBe('false');
	});

	test('a flick carries the drawer on to the next point', async () => {
		const onSnapPointChange = vi.fn();
		const node = snapSetup({ onSnapPointChange });
		// 90px is well short of halfway, but at 4.5px/ms it is carried on to the middle point.
		await firePointer(node, 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: 90, t: 20 });
		await firePointer(node, 'pointerup', { pos: 90, t: 22 });
		expect(onSnapPointChange).toHaveBeenCalledExactlyOnceWith({
			snapPoint: 0.5,
			details: expect.anything()
		});
	});

	test('dragging below the lowest point dismisses the drawer', async () => {
		const onOpenChange = vi.fn();
		const node = snapSetup({ defaultSnapPoint: 0.25, onOpenChange });
		// The lowest point shows 200px of 800; 130px further down shows 70px, nearer to closed.
		await dragBy(node, 130);
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			false,
			expect.objectContaining({ reason: 'swipe' })
		);
	});

	test('with swipeToDismiss off the lowest point is as far as it goes', async () => {
		const onOpenChange = vi.fn();
		const node = snapSetup({ defaultSnapPoint: 0.25, swipeToDismiss: false, onOpenChange });
		await dragBy(node, 200);
		expect(onOpenChange).not.toHaveBeenCalled();
		await vi.waitFor(() => expect(readout('offset')).toBe(`${AVAILABLE * 0.75}`));
		expect(readout('snap')).toBe('0.25');
	});

	test('the backdrop fades only for the drag below the lowest point', async () => {
		const node = snapSetup({ defaultSnapPoint: 0.25 });
		await firePointer(node, 'pointerdown', { pos: 0, t: 0 });
		await firePointer(node, 'pointermove', { pos: -200, t: 500 });
		expect(readout('progress')).toBe('0');
		await firePointer(node, 'pointermove', { pos: 0, t: 800 });
		expect(readout('progress')).toBe('0');
		// 100px below the lowest point's offset of 600, of the 200 left to go.
		await firePointer(node, 'pointermove', { pos: 100, t: 1100 });
		expect(readout('progress')).toBe('0.5');
		expect(backdrop().style.opacity).toBe('0.5');
	});

	test('onSnapPointChange can cancel: the drawer snaps back and keeps its point', async () => {
		const onSnapPointChange = vi.fn(
			({ details }: { snapPoint: number | string; details: OpenChangeDetails }) => details.cancel()
		);
		const node = snapSetup({ onSnapPointChange });
		await dragBy(node, 300);
		expect(onSnapPointChange).toHaveBeenCalledOnce();
		expect(readout('snap')).toBe('1');
		await vi.waitFor(() => expect(readout('offset')).toBe('0'));
	});

	test('setSnapPoint moves the drawer and reports an imperative change', async () => {
		const onSnapPointChange = vi.fn();
		snapSetup({ onSnapPointChange });
		await fireEvent.click(screen.getByTestId('snap-first'));
		expect(onSnapPointChange).toHaveBeenCalledExactlyOnceWith({
			snapPoint: 0.25,
			details: expect.objectContaining({ reason: 'imperative-action' })
		});
		expect(readout('snap')).toBe('0.25');
		await vi.waitFor(() => expect(readout('offset')).toBe(`${AVAILABLE * 0.75}`));
	});

	test('points written as lengths resolve against the room the drawer has', async () => {
		const node = snapSetup({ snapPoints: ['200px', '25rem', 0.9], defaultSnapPoint: '25rem' });
		expect(node.style.height).toBe(`${AVAILABLE * 0.9}px`);
		expect(readout('snap')).toBe('25rem');
		expect(readout('offset')).toBe(`${AVAILABLE * 0.9 - 400}`);
	});

	test('snap points that resolve to nothing never dismiss a drawer that opted out of swiping', async () => {
		// Numbers above 1 are invalid and dropped, leaving no point to rest at.
		const onOpenChange = vi.fn();
		const node = snapSetup({ snapPoints: [2, 5], swipeToDismiss: false, onOpenChange });
		await dragBy(node, 300);
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
	});

	test('snap points that resolve to nothing still dismiss a drawer that swipes to dismiss', async () => {
		const onOpenChange = vi.fn();
		const node = snapSetup({ snapPoints: [2, 5], onOpenChange });
		await dragBy(node, 300);
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
			false,
			expect.objectContaining({ reason: 'swipe' })
		);
	});

	test('top drawers snap the other way', async () => {
		const onSnapPointChange = vi.fn();
		const node = snapSetup({ type: 'drawerTop', onSnapPointChange });
		// A top drawer is dismissed upward: dragging up 300px rests at the middle point.
		await dragBy(node, -300);
		expect(onSnapPointChange).toHaveBeenCalledExactlyOnceWith({
			snapPoint: 0.5,
			details: expect.anything()
		});
		await vi.waitFor(() => expect(readout('offset')).toBe(`${-AVAILABLE * 0.5}`));
	});

	test('other drawer types ignore snapPoints', async () => {
		const node = snapSetup({ type: 'drawerRight' });
		expect(node.style.height).toBe('');
		expect(readout('offset')).toBe('0');
	});
});
