import { tick } from 'svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { createPointerDrag } from './pointerDrag.js';

// jsdom implements no pointer capture; stand in for it.
const capture = {
	setPointerCapture: () => {},
	releasePointerCapture: () => {},
	hasPointerCapture: () => false
};
beforeAll(() => {
	for (const [name, value] of Object.entries(capture))
		Object.defineProperty(Element.prototype, name, { configurable: true, writable: true, value });
});
afterAll(() => {
	for (const name of Object.keys(capture)) Reflect.deleteProperty(Element.prototype, name);
});

const pointer = (target: Element, type: string, clientX = 0) =>
	target.dispatchEvent(
		new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, clientX })
	);

type PointerInit = { x?: number; y?: number; pointerType?: string; buttons?: number };
/** A pointer event with both coordinates; the primary button is held unless `buttons` says otherwise. */
const pointerAt = (target: Element, type: string, init: PointerInit = {}) => {
	const { x = 0, y = 0, pointerType = 'mouse' } = init;
	const buttons = init.buttons ?? (type === 'pointerup' || type === 'pointercancel' ? 0 : 1);
	return target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			pointerId: 1,
			button: 0,
			buttons,
			pointerType,
			clientX: x,
			clientY: y
		})
	);
};

const mount = async (options: Parameters<typeof createPointerDrag>[0]) => {
	const node = document.createElement('div');
	document.body.append(node);
	const detach = createPointerDrag(options)(node);
	// Svelte's `on` attaches pointer listeners a microtask later.
	await tick();
	return {
		node,
		unmount: () => {
			detach?.();
			node.remove();
		}
	};
};

describe('createPointerDrag', () => {
	test('an on-activate drag survives the lost capture of the child a touch was captured to', async () => {
		const node = document.createElement('div');
		const child = document.createElement('span');
		node.append(child);
		document.body.append(node);
		const onEnd = vi.fn();
		const onCancel = vi.fn();
		const detach = createPointerDrag({
			capture: 'on-activate',
			shouldActivate: ({ deltaX }) => deltaX > 4,
			onEnd,
			onCancel
		})(node);
		// Svelte's `on` attaches pointer listeners a microtask later.
		await tick();

		pointer(child, 'pointerdown');
		pointer(child, 'pointermove', 10);
		// Taking the capture over from the implicitly captured child: its loss bubbles up here.
		pointer(child, 'lostpointercapture', 10);
		expect(onCancel).not.toHaveBeenCalled();
		pointer(child, 'pointerup', 10);
		expect(onEnd).toHaveBeenCalledOnce();

		// The node's own capture loss still ends the drag.
		pointer(child, 'pointerdown');
		pointer(child, 'pointermove', 10);
		pointer(node, 'lostpointercapture', 10);
		expect(onCancel).toHaveBeenCalledOnce();

		detach?.();
		node.remove();
	});

	describe('axis attribution', () => {
		test('a press that travels mostly across the axis is spent and never activates', async () => {
			const shouldActivate = vi.fn(() => true);
			const onStart = vi.fn();
			const onCancel = vi.fn();
			const { node, unmount } = await mount({
				capture: 'on-activate',
				axis: () => 'y',
				shouldActivate,
				onStart,
				onCancel
			});

			pointerAt(node, 'pointerdown');
			// Below the slop nothing is decided, and nothing activates.
			expect(pointerAt(node, 'pointermove', { x: 3, y: 2 })).toBe(true);
			expect(shouldActivate).not.toHaveBeenCalled();
			// Sideways with some drift along the axis: spent.
			pointerAt(node, 'pointermove', { x: 7, y: 5 });
			// Even a later move that is mostly along the axis no longer activates.
			const late = pointerAt(node, 'pointermove', { x: 8, y: 40 });
			expect(late).toBe(true);
			expect(shouldActivate).not.toHaveBeenCalled();
			expect(onStart).not.toHaveBeenCalled();
			pointerAt(node, 'pointerup', { x: 8, y: 40 });
			expect(onCancel).toHaveBeenCalledOnce();
			unmount();
		});

		test('a press that travels mostly along the axis is handed to shouldActivate', async () => {
			const onStart = vi.fn();
			const onMove = vi.fn();
			const { node, unmount } = await mount({
				capture: 'on-activate',
				axis: () => 'y',
				shouldActivate: ({ deltaY }) => deltaY > 4,
				onStart,
				onMove
			});

			pointerAt(node, 'pointerdown');
			pointerAt(node, 'pointermove', { x: 2, y: 5 });
			expect(onStart).not.toHaveBeenCalled();
			pointerAt(node, 'pointermove', { x: 3, y: 9 });
			expect(onStart).toHaveBeenCalledOnce();
			expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ deltaY: 9 }));
			pointerAt(node, 'pointerup', { x: 3, y: 9 });
			unmount();
		});

		test('a spent touch press no longer activates on its hold timer', async () => {
			const onStart = vi.fn();
			const { node, unmount } = await mount({
				axis: () => 'x',
				activation: () => ({ distancePx: 4, touchDelayMs: 200, touchTolerancePx: 40 }),
				onStart
			});
			vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
			try {
				pointerAt(node, 'pointerdown', { pointerType: 'touch' });
				pointerAt(node, 'pointermove', { y: 10, pointerType: 'touch' });
				vi.advanceTimersByTime(300);
				expect(onStart).not.toHaveBeenCalled();
				pointerAt(node, 'pointerup', { y: 10, pointerType: 'touch' });
			} finally {
				vi.useRealTimers();
				unmount();
			}
		});
	});

	describe('a mouse that no longer holds the button', () => {
		test('ends an active drag through onEnd', async () => {
			const onMove = vi.fn();
			const onEnd = vi.fn();
			const { node, unmount } = await mount({ onMove, onEnd });

			pointerAt(node, 'pointerdown');
			pointerAt(node, 'pointermove', { x: 10 });
			expect(onMove).toHaveBeenCalledOnce();
			// The button came up outside the window: the next move arrives without it. The drag
			// ends where the button was last held.
			pointerAt(node, 'pointermove', { x: 20, buttons: 0 });
			expect(onEnd).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ x: 10, deltaX: 10 }));
			expect(onMove).toHaveBeenCalledOnce();
			// The session is gone: further moves do nothing.
			pointerAt(node, 'pointermove', { x: 30 });
			expect(onMove).toHaveBeenCalledOnce();
			unmount();
		});

		test('ends a candidate through onCancel, and a touch or pen move without buttons is left alone', async () => {
			const onCancel = vi.fn();
			const onStart = vi.fn();
			const { node, unmount } = await mount({
				capture: 'on-activate',
				shouldActivate: ({ deltaX }) => deltaX > 20,
				onStart,
				onCancel
			});

			pointerAt(node, 'pointerdown', { pointerType: 'pen' });
			pointerAt(node, 'pointermove', { x: 5, pointerType: 'pen', buttons: 0 });
			expect(onCancel).not.toHaveBeenCalled();
			pointerAt(node, 'pointerup', { x: 5, pointerType: 'pen' });
			expect(onCancel).toHaveBeenCalledOnce();

			pointerAt(node, 'pointerdown');
			pointerAt(node, 'pointermove', { x: 5, buttons: 0 });
			expect(onCancel).toHaveBeenCalledTimes(2);
			expect(onStart).not.toHaveBeenCalled();
			unmount();
		});
	});
});
