// The positioner with the real floating-ui against the jsdom visual viewport stub: rects come
// from `mockRect`, the viewport from `viewport.set`. An on-screen keyboard shrinks the visual
// viewport without a window resize, and iOS reports the final size only after its last `resize`
// event: the panel must leave the space the keyboard covers once the viewport has settled.
import { waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mockRect, viewport } from '$lib/testing/jsdom.test-helper.js';
import { VIEWPORT_SETTLE_MS, createPanelPositioner } from './popover.position.js';

const cleanups: Array<() => void> = [];
afterEach(() => {
	cleanups.splice(0).forEach((cleanup) => cleanup());
	document.body.replaceChildren();
	Reflect.deleteProperty(viewport.visual, 'height');
});

/** iOS: the visual viewport reaches `height` after its last `resize` event, with no event of its own. */
const settleSilently = (height: number) =>
	Object.defineProperty(viewport.visual, 'height', { configurable: true, get: () => height });

/** A 160px input-like reference at `top` and a 200px tall panel placed below it. */
const dropdown = (top: number) => {
	const reference = document.createElement('div');
	const panel = document.createElement('div');
	document.body.append(reference, panel);
	mockRect(reference, { x: 100, y: top, width: 160, height: 32 });
	mockRect(panel, { x: 0, y: 0, width: 200, height: 200 });
	const onPlace = vi.fn();
	const positioner = createPanelPositioner({
		reference: () => reference,
		floating: () => true,
		settled: () => true,
		placement: () => 'bottom-start',
		offset: () => undefined,
		fitTrigger: () => false,
		positionPanel: () => undefined,
		setMinWidth: () => {},
		onPlace
	});
	cleanups.push(positioner.track(panel, reference, () => {}));
	const lastSide = () => onPlace.mock.calls.at(-1)?.[0].side;
	return { panel, onPlace, lastSide };
};

describe('panel placement against the visual viewport', () => {
	test('a dropdown flips above its input once an on-screen keyboard has settled', async () => {
		const { panel, lastSide } = dropdown(400);
		await waitFor(() => expect(lastSide()).toBe('bottom'));
		// Below the input: 768 - 20 - (400 + 32 + 4) px of room.
		expect(panel.style.getPropertyValue('--available-height')).toBe('312px');

		// The keyboard slides in: the last `resize` still reports the full height, then the
		// viewport settles at 500px with no further event.
		viewport.set({ height: 768 });
		await new Promise((resolve) => setTimeout(resolve, VIEWPORT_SETTLE_MS / 2));
		expect(lastSide()).toBe('bottom');
		settleSilently(500);
		await waitFor(() => expect(lastSide()).toBe('top'));
		expect(panel.style.top).toBe(`${400 - 4 - 200}px`);
		// Above the input: 400 - 4 - 20 px of room.
		expect(panel.style.getPropertyValue('--available-height')).toBe('376px');
	});

	test('a dropdown that fits below its input in the shrunk viewport stays there with less room', async () => {
		const { panel, lastSide } = dropdown(120);
		await waitFor(() => expect(lastSide()).toBe('bottom'));
		viewport.set({ height: 400 });
		await waitFor(() =>
			expect(panel.style.getPropertyValue('--available-height')).toBe(`${400 - 20 - 156}px`)
		);
		expect(lastSide()).toBe('bottom');
	});
});
