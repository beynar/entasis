// Thumb drags run on the shared pointer drag (DF-INFRA-2): primary button only, pointer capture,
// and a drag that ends on release, on pointercancel, or when a mouse no longer holds its button.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { mockRect } from '$lib/testing/jsdom.test-helper.js';
import ScrollAreaHarness from './ScrollAreaHarness.test.svelte';

// jsdom implements no pointer capture; stand in for it.
const captured = new Set<number>();
const capture = {
	setPointerCapture: (id: number) => void captured.add(id),
	releasePointerCapture: (id: number) => void captured.delete(id),
	hasPointerCapture: (id: number) => captured.has(id)
};
beforeAll(() => {
	for (const [name, value] of Object.entries(capture))
		Object.defineProperty(Element.prototype, name, { configurable: true, writable: true, value });
});
afterAll(() => {
	for (const name of Object.keys(capture)) Reflect.deleteProperty(Element.prototype, name);
});

// jsdom has no layout: fake a 400px scroll extent so the vertical bar shows.
const scrollHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight')!;
afterEach(() => {
	Object.defineProperty(Element.prototype, 'scrollHeight', scrollHeight);
	captured.clear();
});

const firePointer = (node: Element, type: string, clientY: number, init: PointerEventInit = {}) =>
	fireEvent(
		node,
		new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			pointerId: 2,
			button: 0,
			buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
			pointerType: 'mouse',
			clientX: 5,
			clientY,
			...init
		})
	);

const setup = async () => {
	Object.defineProperty(Element.prototype, 'scrollHeight', { configurable: true, get: () => 400 });
	render(ScrollAreaHarness, { props: { type: 'always' } });
	const viewport = screen
		.getByText('Long article')
		.closest<HTMLElement>('[data-scroll-area-viewport]')!;
	let scrollTop = 0;
	Object.defineProperty(viewport, 'scrollTop', {
		configurable: true,
		get: () => scrollTop,
		set: (value: number) => {
			scrollTop = value;
		}
	});
	await waitFor(() => expect(document.querySelector('[data-thumb]')).not.toBeNull());
	const thumb = document.querySelector<HTMLElement>('[data-thumb]')!;
	// A 200px track; the 18px minimum thumb sits at its top.
	mockRect(thumb.parentElement!, { x: 0, y: 0, width: 8, height: 200 });
	mockRect(thumb, { x: 0, y: 0, width: 8, height: 18 });
	// Svelte's `on` attaches the drag listeners a microtask later.
	await tick();
	return { viewport, thumb };
};

describe('ScrollArea thumb drag', () => {
	test('a primary press drags the viewport and captures the pointer until release', async () => {
		const { viewport, thumb } = await setup();
		await firePointer(thumb, 'pointerdown', 0);
		expect(captured.has(2)).toBe(true);
		await firePointer(thumb, 'pointermove', 91);
		// Half of the 182px the thumb can travel: half of the 400px scroll extent.
		expect(viewport.scrollTop).toBe(200);
		await firePointer(thumb, 'pointerup', 91);
		expect(captured.has(2)).toBe(false);
		await firePointer(thumb, 'pointermove', 182);
		expect(viewport.scrollTop).toBe(200);
	});

	test('a secondary-button press does not drag', async () => {
		const { viewport, thumb } = await setup();
		await firePointer(thumb, 'pointerdown', 0, { button: 2, buttons: 2 });
		await firePointer(thumb, 'pointermove', 91, { buttons: 2 });
		expect(viewport.scrollTop).toBe(0);
	});

	test('a cancelled drag stops following the pointer', async () => {
		const { viewport, thumb } = await setup();
		await firePointer(thumb, 'pointerdown', 0);
		await firePointer(thumb, 'pointermove', 45.5);
		expect(viewport.scrollTop).toBe(100);
		await firePointer(thumb, 'pointercancel', 45.5);
		await firePointer(thumb, 'pointermove', 182);
		expect(viewport.scrollTop).toBe(100);
	});

	test('a mouse that no longer holds its button ends the drag', async () => {
		const { viewport, thumb } = await setup();
		await firePointer(thumb, 'pointerdown', 0);
		await firePointer(thumb, 'pointermove', 45.5);
		// The button came up outside the window.
		await firePointer(thumb, 'pointermove', 182, { buttons: 0 });
		expect(viewport.scrollTop).toBe(100);
		await firePointer(thumb, 'pointermove', 182);
		expect(viewport.scrollTop).toBe(100);
	});
});
