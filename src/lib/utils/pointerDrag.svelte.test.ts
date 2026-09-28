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
});
