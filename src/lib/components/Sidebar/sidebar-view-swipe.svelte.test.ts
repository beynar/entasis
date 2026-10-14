// The mobile back swipe between Sidebar views measures its release speed with the shared
// velocity tracker (OV-8): a flick still commits when the last move before release barely moved.
import { tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SidebarViewsState } from './sidebar.views.svelte.js';

const firePointer = (node: Element, type: string, x: number, t: number) => {
	const event = new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		pointerId: 3,
		button: 0,
		buttons: type === 'pointerup' ? 0 : 1,
		pointerType: 'touch',
		clientX: x,
		clientY: 0
	});
	// `timeStamp` is clock-driven; the velocity rule needs deterministic samples.
	Object.defineProperty(event, 'timeStamp', { configurable: true, value: t });
	node.dispatchEvent(event);
};

let cleanup: (() => void) | undefined;
afterEach(() => {
	cleanup?.();
	cleanup = undefined;
});

const setup = async () => {
	const onViewChange = vi.fn();
	const node = document.createElement('div');
	document.body.append(node);
	let state!: SidebarViewsState;
	let detach: (() => void) | void;
	const stop = $effect.root(() => {
		state = new SidebarViewsState({
			views: { home: {}, settings: { parent: 'home' } },
			view: undefined,
			defaultView: 'settings',
			onViewChange,
			isMobile: true,
			side: 'left',
			root: {},
			setViewProp: () => {}
		});
		detach = state.swipeAttachment(node);
	});
	cleanup = () => {
		detach?.();
		stop();
		node.remove();
	};
	// Svelte's `on` attaches its listeners a microtask later.
	await tick();
	return { node, onViewChange, state };
};

describe('Sidebar view back swipe', () => {
	test('a flick that ends with an almost stationary move still goes back', async () => {
		const { node, onViewChange } = await setup();
		firePointer(node, 'pointerdown', 0, 0);
		firePointer(node, 'pointermove', 20, 8);
		firePointer(node, 'pointermove', 40, 16);
		firePointer(node, 'pointermove', 60, 24);
		firePointer(node, 'pointermove', 60.5, 34);
		firePointer(node, 'pointerup', 60.5, 35);
		expect(onViewChange).toHaveBeenCalledExactlyOnceWith('home');
	});

	test('a drag that rests before release does not go back', async () => {
		const { node, onViewChange, state } = await setup();
		firePointer(node, 'pointerdown', 0, 0);
		firePointer(node, 'pointermove', 20, 8);
		firePointer(node, 'pointermove', 40, 16);
		firePointer(node, 'pointerup', 40, 200);
		expect(onViewChange).not.toHaveBeenCalled();
		expect(state.swipe?.phase).toBe('cancel');
	});
});
