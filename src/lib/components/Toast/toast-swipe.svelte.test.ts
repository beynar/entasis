// Toast swipe-to-dismiss on the shared pointer drag (DF-INFRA-2) and velocity tracker (OV-8):
// primary button only, cancel snaps back, a sideways press is spent, a flick dismisses, and the
// click that ends a drag is not a press on the toast.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import Harness from './ToasterHarness.test.svelte';
import { toast, type Toaster } from './toast.state.svelte.js';

const toaster = () => window.toaster as Toaster;
const items = () => document.querySelectorAll<HTMLElement>('section[data-live-region] > li');

type PointerInit = { x: number; y?: number; t?: number; buttons?: number; button?: number };
const firePointer = async (node: Element, type: string, init: PointerInit) => {
	const { x, y = 100, t = 0, button = 0 } = init;
	const event = new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		pointerId: 5,
		button,
		buttons: init.buttons ?? (type === 'pointerup' || type === 'pointercancel' ? 0 : 1),
		pointerType: 'mouse',
		clientX: x,
		clientY: y
	});
	// `timeStamp` is clock-driven; the flick rule needs deterministic samples.
	Object.defineProperty(event, 'timeStamp', { configurable: true, value: t });
	await fireEvent(node, event);
};

/** A bottom-right toast, which swipes right (x axis) to dismiss. */
const showToast = async (options: Parameters<typeof toast.info>[0] = {}) => {
	render(Harness, { position: 'bottom-right' });
	toast.info({ id: 'swipe', title: 'Swipe me', duration: false, ...options });
	await waitFor(() => expect(items()).toHaveLength(1));
	// Svelte's `on` attaches the drag listeners a microtask later.
	await tick();
	return items()[0];
};
const offset = (li: HTMLElement) => li.style.translate.split(' ')[0];

describe('Toast swipe', () => {
	test('a flick toward the edge dismisses well short of the distance threshold', async () => {
		const li = await showToast();
		await firePointer(li, 'pointerdown', { x: 100, t: 0 });
		await firePointer(li, 'pointermove', { x: 110, t: 8 });
		await firePointer(li, 'pointermove', { x: 120, t: 16 });
		await firePointer(li, 'pointermove', { x: 130, t: 24 });
		await firePointer(li, 'pointerup', { x: 130, t: 25 });
		expect(toaster().toasts).toEqual([]);
	});

	test('a short drag that rests before release snaps back', async () => {
		const li = await showToast();
		await firePointer(li, 'pointerdown', { x: 100, t: 0 });
		await firePointer(li, 'pointermove', { x: 130, t: 24 });
		expect(offset(li)).toBe('30px');
		await firePointer(li, 'pointerup', { x: 130, t: 300 });
		expect(toaster().toasts).toHaveLength(1);
		expect(offset(li)).toBe('0px');
	});

	test('a cancelled drag snaps back instead of dismissing', async () => {
		const li = await showToast();
		await firePointer(li, 'pointerdown', { x: 100, t: 0 });
		await firePointer(li, 'pointermove', { x: 160, t: 200 });
		expect(offset(li)).toBe('60px');
		await firePointer(li, 'pointercancel', { x: 160, t: 210 });
		expect(toaster().toasts).toHaveLength(1);
		expect(offset(li)).toBe('0px');
	});

	test('a press that travels mostly across the swipe axis never moves the toast', async () => {
		const li = await showToast();
		await firePointer(li, 'pointerdown', { x: 100, y: 100, t: 0 });
		await firePointer(li, 'pointermove', { x: 104, y: 112, t: 20 });
		await firePointer(li, 'pointermove', { x: 160, y: 130, t: 200 });
		expect(offset(li)).toBe('0px');
		await firePointer(li, 'pointerup', { x: 160, y: 130, t: 210 });
		expect(toaster().toasts).toHaveLength(1);
	});

	test('a secondary-button press never drags', async () => {
		const li = await showToast();
		await firePointer(li, 'pointerdown', { x: 100, t: 0, button: 2, buttons: 2 });
		await firePointer(li, 'pointermove', { x: 200, t: 200, buttons: 2 });
		expect(offset(li)).toBe('0px');
		await firePointer(li, 'pointerup', { x: 200, t: 210, button: 2 });
		expect(toaster().toasts).toHaveLength(1);
	});

	test('a mouse that lost its button ends the drag', async () => {
		const li = await showToast();
		await firePointer(li, 'pointerdown', { x: 100, t: 0 });
		await firePointer(li, 'pointermove', { x: 120, t: 200 });
		// Released outside the window: the next move arrives without the button.
		await firePointer(li, 'pointermove', { x: 300, t: 400, buttons: 0 });
		expect(offset(li)).toBe('0px');
		await firePointer(li, 'pointermove', { x: 400, t: 500 });
		expect(offset(li)).toBe('0px');
		expect(toaster().toasts).toHaveLength(1);
	});

	test('a mouse that lost its button past the threshold ends the drag as a release', async () => {
		const li = await showToast();
		await firePointer(li, 'pointerdown', { x: 100, t: 0 });
		await firePointer(li, 'pointermove', { x: 170, t: 200 });
		await firePointer(li, 'pointermove', { x: 300, t: 400, buttons: 0 });
		expect(toaster().toasts).toEqual([]);
	});

	test('the click that ends a drag is not a press on a closeOnClick toast', async () => {
		const li = await showToast({ closeOnClick: true });
		await firePointer(li, 'pointerdown', { x: 100, t: 0 });
		await firePointer(li, 'pointermove', { x: 120, t: 200 });
		await firePointer(li, 'pointerup', { x: 120, t: 400 });
		await fireEvent.click(li);
		expect(toaster().toasts).toHaveLength(1);
		// A plain click still dismisses it once the drag is over.
		await firePointer(li, 'pointerdown', { x: 120, t: 500 });
		await firePointer(li, 'pointerup', { x: 120, t: 520 });
		await fireEvent.click(li);
		expect(toaster().toasts).toEqual([]);
	});
});

describe('Toast swipe robustness (DF-5)', () => {
	test('a press on an action button never starts a drag', async () => {
		const li = await showToast({ actions: [{ content: 'Undo', dismiss: false }] });
		const button = screen.getByRole('button', { name: 'Undo' });
		await firePointer(button, 'pointerdown', { x: 100, t: 0 });
		await firePointer(button, 'pointermove', { x: 160, t: 100 });
		await firePointer(button, 'pointermove', { x: 220, t: 200 });
		expect(offset(li)).toBe('0px');
		expect(li.style.cursor).not.toBe('grabbing');
		await firePointer(button, 'pointerup', { x: 220, t: 210 });
		expect(toaster().toasts).toHaveLength(1);
	});

	test('a press on the close button never starts a drag, and a press on the surface still does', async () => {
		const li = await showToast();
		const close = screen.getByRole('button', { name: 'Dismiss notification' });
		await firePointer(close, 'pointerdown', { x: 100, t: 0 });
		await firePointer(close, 'pointermove', { x: 200, t: 100 });
		expect(offset(li)).toBe('0px');
		await firePointer(close, 'pointerup', { x: 200, t: 110 });

		await firePointer(li, 'pointerdown', { x: 100, t: 200 });
		await firePointer(li, 'pointermove', { x: 130, t: 300 });
		expect(offset(li)).toBe('30px');
		await firePointer(li, 'pointercancel', { x: 130, t: 310 });
	});

	test('an element marked data-swipe-ignore does not start a drag', async () => {
		const li = await showToast();
		const marked = document.createElement('span');
		marked.setAttribute('data-swipe-ignore', '');
		li.append(marked);
		await firePointer(marked, 'pointerdown', { x: 100, t: 0 });
		await firePointer(marked, 'pointermove', { x: 180, t: 100 });
		expect(offset(li)).toBe('0px');
		await firePointer(marked, 'pointerup', { x: 180, t: 110 });
		marked.remove();
	});

	test('the swipe leaves page scrolling along the other axis to the browser', async () => {
		// Bottom-right swipes sideways: the page may still pan vertically across the toast.
		const li = await showToast();
		expect(li.style.touchAction).toBe('pan-y');
	});

	test('a toast that swipes vertically leaves horizontal panning to the browser', async () => {
		render(Harness, { position: 'top-center' });
		toast.info({ id: 'vertical', title: 'Swipe up', duration: false });
		await waitFor(() => expect(items()).toHaveLength(1));
		expect(items()[0].style.touchAction).toBe('pan-x');
	});

	test('a toast that cannot be swiped does not touch the browser panning', async () => {
		const li = await showToast({ swipeToDismiss: false });
		expect(li.style.touchAction).toBe('');
	});

	test('the stack stays expanded while one of its toasts is dragged', async () => {
		render(Harness, { position: 'bottom-right' });
		toast.info({ id: 'back', title: 'Back', duration: false });
		toast.info({ id: 'front', title: 'Front', duration: false });
		await waitFor(() => expect(items()).toHaveLength(2));
		await tick();
		const front = toaster().toasts[1];
		expect(front.stacked).toBe(true);

		const li = items()[1];
		await firePointer(li, 'pointerdown', { x: 100, t: 0 });
		await firePointer(li, 'pointermove', { x: 130, t: 100 });
		expect(front.dragging).toBe(true);
		expect(toaster().toasts[0].stacked).toBe(false);
		await firePointer(li, 'pointerup', { x: 130, t: 400 });
		expect(toaster().toasts[0].stacked).toBe(true);
	});

	test('a drag holds the timers and a cancelled one releases them', async () => {
		const li = await showToast({ duration: 5000 });
		const shown = toaster().toasts[0];
		await firePointer(li, 'pointerdown', { x: 100, t: 0 });
		await firePointer(li, 'pointermove', { x: 130, t: 100 });
		expect(shown.timer?.heldBy).toEqual(['swipe']);
		await firePointer(li, 'pointercancel', { x: 130, t: 200 });
		expect(shown.pressed).toBe(false);
		expect(shown.timer?.paused).toBe(false);
	});
});
