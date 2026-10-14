// ScrollArea styling hooks, thumb geometry, RTL and press behaviour. jsdom has no layout, so the
// boxes are stood in for by prototype getters that read `layout` below.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { mockRect } from '$lib/testing/jsdom.test-helper.js';
import ScrollAreaHooksHarness from './ScrollAreaHooksHarness.test.svelte';

const layout = {
	scrollHeight: 400,
	clientHeight: 100,
	scrollWidth: 200,
	clientWidth: 200,
	trackY: 200,
	trackX: 200
};
const reset = () =>
	Object.assign(layout, {
		scrollHeight: 400,
		clientHeight: 100,
		scrollWidth: 200,
		clientWidth: 200,
		trackY: 200,
		trackX: 200
	});

const isViewport = (el: Element) =>
	el.hasAttribute('data-scroll-area-viewport') || el.hasAttribute('data-scroll-area-content');
const isTrack = (el: Element, orientation: 'vertical' | 'horizontal') =>
	el.getAttribute('data-slot') === 'scroll-area-scrollbar' &&
	el.getAttribute('data-orientation') === orientation;

const original: Record<string, PropertyDescriptor> = {};
const stubbed = ['scrollHeight', 'clientHeight', 'scrollWidth', 'clientWidth'] as const;
beforeAll(() => {
	for (const name of stubbed) {
		original[name] = Object.getOwnPropertyDescriptor(Element.prototype, name)!;
		Object.defineProperty(Element.prototype, name, {
			configurable: true,
			get(this: Element) {
				if (isViewport(this)) return layout[name];
				if (name === 'clientHeight' && isTrack(this, 'vertical')) return layout.trackY;
				if (name === 'clientWidth' && isTrack(this, 'horizontal')) return layout.trackX;
				return 0;
			}
		});
	}
});
afterAll(() => {
	for (const name of stubbed) Object.defineProperty(Element.prototype, name, original[name]);
});

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
beforeEach(reset);
afterEach(() => captured.clear());

const root = () => document.querySelector<HTMLElement>('[data-scroll-area]')!;
const viewport = () => document.querySelector<HTMLElement>('[data-scroll-area-viewport]')!;
const track = (orientation: 'vertical' | 'horizontal') =>
	document.querySelector<HTMLElement>(
		`[data-slot="scroll-area-scrollbar"][data-orientation="${orientation}"]`
	);
const thumb = (orientation: 'vertical' | 'horizontal') =>
	document.querySelector<HTMLElement>(
		`[data-slot="scroll-area-thumb"][data-orientation="${orientation}"]`
	);

/** Gives the viewport a scroll position that tests move and announce. */
const offsets = (element: HTMLElement) => {
	const position = { top: 0, left: 0 };
	Object.defineProperty(element, 'scrollTop', {
		configurable: true,
		get: () => position.top,
		set: (value: number) => (position.top = value)
	});
	Object.defineProperty(element, 'scrollLeft', {
		configurable: true,
		get: () => position.left,
		set: (value: number) => (position.left = value)
	});
	return {
		position,
		scrollTo: async (next: { top?: number; left?: number }) => {
			Object.assign(position, next);
			await fireEvent.scroll(element);
		}
	};
};

const setup = async (props: Record<string, unknown> = {}) => {
	render(ScrollAreaHooksHarness, { props: { type: 'always', ...props } });
	await waitFor(() => expect(track('vertical')).not.toBeNull());
	return offsets(viewport());
};

const firePointer = (node: Element, type: string, init: PointerEventInit = {}) =>
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
			clientY: 5,
			...init
		})
	);

describe('data-scrolling', () => {
	test('marks the root, viewport, scrollbars and thumbs from the first scroll until the area is idle', async () => {
		const { scrollTo } = await setup();
		for (const element of [root(), viewport(), track('vertical'), thumb('vertical')]) {
			expect(element).not.toHaveAttribute('data-scrolling');
		}

		await scrollTo({ top: 10 });
		for (const element of [root(), viewport(), track('vertical'), thumb('vertical')]) {
			expect(element).toHaveAttribute('data-scrolling');
		}

		await waitFor(() => expect(root()).not.toHaveAttribute('data-scrolling'), { timeout: 1500 });
		expect(viewport()).not.toHaveAttribute('data-scrolling');
		expect(thumb('vertical')).not.toHaveAttribute('data-scrolling');
	});
});

describe('overflow edges', () => {
	test('flags the edges that hide content and publishes how much is hidden', async () => {
		const { scrollTo } = await setup();
		// 300px of content past the 100px viewport.
		await waitFor(() => expect(root()).toHaveAttribute('data-has-overflow-y'));
		expect(root()).not.toHaveAttribute('data-has-overflow-x');
		expect(root()).not.toHaveAttribute('data-overflow-y-start');
		expect(root()).toHaveAttribute('data-overflow-y-end');
		expect(root().style.getPropertyValue('--scroll-area-overflow-y-start')).toBe('0px');
		expect(root().style.getPropertyValue('--scroll-area-overflow-y-end')).toBe('300px');

		await scrollTo({ top: 120 });
		expect(root()).toHaveAttribute('data-overflow-y-start');
		expect(root()).toHaveAttribute('data-overflow-y-end');
		expect(root().style.getPropertyValue('--scroll-area-overflow-y-start')).toBe('120px');
		expect(root().style.getPropertyValue('--scroll-area-overflow-y-end')).toBe('180px');

		await scrollTo({ top: 300 });
		expect(root()).toHaveAttribute('data-overflow-y-start');
		expect(root()).not.toHaveAttribute('data-overflow-y-end');
		expect(root().style.getPropertyValue('--scroll-area-overflow-y-end')).toBe('0px');
	});

	test('a remainder under the threshold is not hidden content', async () => {
		const { scrollTo } = await setup();
		await scrollTo({ top: 299.5 });
		expect(root()).not.toHaveAttribute('data-overflow-y-end');
		await scrollTo({ top: 298 });
		expect(root()).toHaveAttribute('data-overflow-y-end');
	});

	test('overflowEdgeThreshold widens the remainder that does not count', async () => {
		const { scrollTo } = await setup({ overflowEdgeThreshold: 20 });
		await scrollTo({ top: 285 });
		expect(root()).not.toHaveAttribute('data-overflow-y-end');
		expect(root().style.getPropertyValue('--scroll-area-overflow-y-end')).toBe('15px');
		await scrollTo({ top: 270 });
		expect(root()).toHaveAttribute('data-overflow-y-end');
	});

	test('measures the horizontal edges from the inline start in RTL', async () => {
		layout.scrollWidth = 800;
		const { scrollTo } = await setup({ dir: 'rtl' });
		await waitFor(() => expect(root()).toHaveAttribute('data-has-overflow-x'));
		// Scrolled to the start: the browser reports 0 in RTL too.
		expect(root()).not.toHaveAttribute('data-overflow-x-start');
		expect(root()).toHaveAttribute('data-overflow-x-end');

		await scrollTo({ left: -250 });
		expect(root()).toHaveAttribute('data-overflow-x-start');
		expect(root().style.getPropertyValue('--scroll-area-overflow-x-start')).toBe('250px');
		expect(root().style.getPropertyValue('--scroll-area-overflow-x-end')).toBe('350px');

		await scrollTo({ left: -600 });
		expect(root()).not.toHaveAttribute('data-overflow-x-end');
	});
});

describe('wheel over a scrollbar', () => {
	const wheel = (init: WheelEventInit) =>
		new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });

	test('scrolls the viewport and keeps the page still while the viewport can move', async () => {
		const { position } = await setup();
		const event = wheel({ deltaY: 40 });
		track('vertical')!.dispatchEvent(event);
		expect(position.top).toBe(40);
		expect(event.defaultPrevented).toBe(true);
	});

	test('leaves the wheel to the page at the edge', async () => {
		const { position, scrollTo } = await setup();
		const up = wheel({ deltaY: -40 });
		track('vertical')!.dispatchEvent(up);
		expect(up.defaultPrevented).toBe(false);

		await scrollTo({ top: 300 });
		const down = wheel({ deltaY: 40 });
		track('vertical')!.dispatchEvent(down);
		expect(down.defaultPrevented).toBe(false);
		expect(position.top).toBe(300);

		// Moving back the other way is still the area's.
		const back = wheel({ deltaY: -40 });
		track('vertical')!.dispatchEvent(back);
		expect(back.defaultPrevented).toBe(true);
	});
});

describe('thumb size', () => {
	test('shrinks when content is appended while the area already overflows', async () => {
		await setup();
		// A 100px viewport over 400px of content on a 200px track.
		await waitFor(() => expect(thumb('vertical')!.style.height).toBe('50px'));

		layout.scrollHeight = 800;
		screen.getByTestId('list').append(document.createElement('p'));
		await waitFor(() => expect(thumb('vertical')!.style.height).toBe('25px'));
	});

	test('stops at the minimum length', async () => {
		layout.scrollHeight = 4000;
		await setup();
		await waitFor(() => expect(thumb('vertical')!.style.height).toBe('18px'));
	});
});

describe('overscroll', () => {
	test('shrinks the thumb and pins it to the edge being pulled', async () => {
		const { scrollTo } = await setup();
		await scrollTo({ top: 150 });
		expect(thumb('vertical')!.style.transform).toBe('translateY(75px)');

		await scrollTo({ top: -20 });
		expect(thumb('vertical')!.style.height).toBe('30px');
		expect(thumb('vertical')!.style.transform).toBe('translateY(0px)');

		// 20px past the end of the 300px range.
		await scrollTo({ top: 320 });
		expect(thumb('vertical')!.style.height).toBe('30px');
		expect(thumb('vertical')!.style.transform).toBe('translateY(170px)');

		await scrollTo({ top: 300 });
		expect(thumb('vertical')!.style.height).toBe('50px');
		expect(thumb('vertical')!.style.transform).toBe('translateY(150px)');
	});

	test('never shrinks the thumb below the minimum', async () => {
		const { scrollTo } = await setup();
		await scrollTo({ top: -45 });
		expect(thumb('vertical')!.style.height).toBe('18px');
	});

	test('does not count an overscroll as hidden content', async () => {
		const { scrollTo } = await setup();
		await scrollTo({ top: -20 });
		expect(root()).not.toHaveAttribute('data-overflow-y-start');
		expect(root().style.getPropertyValue('--scroll-area-overflow-y-start')).toBe('0px');
	});
});

describe('hover mode', () => {
	test('shows the scrollbar while the area scrolls, without a hover', async () => {
		render(ScrollAreaHooksHarness, { props: {} });
		const { scrollTo } = offsets(viewport());
		await waitFor(() => expect(root()).toHaveAttribute('data-has-overflow-y'));
		expect(track('vertical')).toBeNull();

		await scrollTo({ top: 10 });
		await waitFor(() => expect(track('vertical')).not.toBeNull());
	});

	test('hides it again once the scrolling stops', async () => {
		render(ScrollAreaHooksHarness, { props: {} });
		const { scrollTo } = offsets(viewport());
		await waitFor(() => expect(root()).toHaveAttribute('data-has-overflow-y'));
		await scrollTo({ top: 10 });
		await waitFor(() => expect(track('vertical')).not.toBeNull());
		await waitFor(() => expect(track('vertical')).toBeNull(), { timeout: 3000 });
	});
});

describe('RTL', () => {
	const horizontal = async (props: Record<string, unknown>) => {
		layout.scrollWidth = 800;
		const scrolling = await setup({ type: 'always', ...props });
		await waitFor(() => expect(track('horizontal')).not.toBeNull());
		// A 200px track; the 200/800 content ratio makes a 50px thumb that can travel 150px.
		mockRect(track('horizontal')!, { x: 0, y: 0, width: 200, height: 6 });
		await waitFor(() => expect(thumb('horizontal')!.style.width).toBe('50px'));
		return scrolling;
	};

	test('places the thumb from the inline start, mirrored in RTL', async () => {
		const ltr = await horizontal({});
		await ltr.scrollTo({ left: 300 });
		expect(thumb('horizontal')!.style.transform).toBe('translateX(75px)');
	});

	test('reads the negative offset of an RTL viewport as travel from the inline start', async () => {
		const { scrollTo } = await horizontal({ dir: 'rtl' });
		await scrollTo({ left: -300 });
		expect(thumb('horizontal')!.style.transform).toBe('translateX(-75px)');
		await scrollTo({ left: -600 });
		expect(thumb('horizontal')!.style.transform).toBe('translateX(-150px)');
		await scrollTo({ left: 0 });
		expect(thumb('horizontal')!.style.transform).toMatch(/^translateX\(-?0px\)$/);
	});

	test('dragging the thumb writes a negative offset', async () => {
		const { position } = await horizontal({ dir: 'rtl' });
		const handle = thumb('horizontal')!;
		// In RTL the thumb starts at the right of the track.
		mockRect(handle, { x: 150, y: 0, width: 50, height: 6 });
		await tick();
		await firePointer(handle, 'pointerdown', { clientX: 195, clientY: 3 });
		// 75px from the right edge, 5px of which the press was inside the thumb: 70 of 150px travelled.
		await firePointer(handle, 'pointermove', { clientX: 125, clientY: 3 });
		expect(position.left).toBeCloseTo(-280, 5);
		await firePointer(handle, 'pointerup', { clientX: 125, clientY: 3 });
	});

	test('a LTR drag still writes a positive offset', async () => {
		const { position } = await horizontal({});
		const handle = thumb('horizontal')!;
		mockRect(handle, { x: 0, y: 0, width: 50, height: 6 });
		await tick();
		await firePointer(handle, 'pointerdown', { clientX: 5, clientY: 3 });
		await firePointer(handle, 'pointermove', { clientX: 80, clientY: 3 });
		expect(position.left).toBeCloseTo(300, 5);
		await firePointer(handle, 'pointerup', { clientX: 80, clientY: 3 });
	});

	test('clicking the track measures from the inline start edge', async () => {
		const { position } = await horizontal({ dir: 'rtl' });
		// 175px from the right edge of the track: the 50px thumb centres at 175, its start at 150.
		await fireEvent.click(track('horizontal')!, { clientX: 25, clientY: 3 });
		expect(position.left).toBeCloseTo(-600, 5);
		await fireEvent.click(track('horizontal')!, { clientX: 100, clientY: 3 });
		expect(position.left).toBeCloseTo(-300, 5);
	});

	test('anchors the scrollbars to logical sides', async () => {
		await horizontal({});
		expect(track('vertical')!.className).toContain('end-0');
		expect(track('vertical')!.className).not.toMatch(/\bright-0\b/);
		expect(track('horizontal')!.className).toContain('start-0');
		expect(track('horizontal')!.className).not.toMatch(/\bleft-0\b/);
	});

	test('insets each scrollbar by the thickness of the other at the corner', async () => {
		// Both tracks are 6px thick once laid out (jsdom has no layout of its own).
		const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!;
		const offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!;
		Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
			configurable: true,
			get(this: HTMLElement) {
				return isTrack(this, 'vertical') ? 6 : 0;
			}
		});
		Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
			configurable: true,
			get(this: HTMLElement) {
				return isTrack(this, 'horizontal') ? 6 : 0;
			}
		});
		try {
			layout.scrollWidth = 800;
			await setup({ type: 'always' });
			await waitFor(() => expect(track('horizontal')).not.toBeNull());
			await waitFor(() => expect(track('vertical')!.style.bottom).toBe('6px'));
			expect(track('horizontal')!.style.insetInlineEnd).toBe('6px');
		} finally {
			Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidth);
			Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offsetHeight);
		}
	});

	test('leaves the corner free while only one scrollbar shows', async () => {
		await setup({ type: 'always' });
		expect(track('horizontal')).toBeNull();
		expect(track('vertical')!.style.bottom).toBe('0px');
	});
});

describe('pressing a scrollbar', () => {
	test('does not take focus from the focused control', async () => {
		await setup();
		const field = screen.getByLabelText('Field');
		field.focus();
		for (const target of [track('vertical')!, thumb('vertical')!]) {
			const pointerdown = new PointerEvent('pointerdown', {
				bubbles: true,
				cancelable: true,
				pointerId: 3,
				button: 0,
				pointerType: 'mouse'
			});
			target.dispatchEvent(pointerdown);
			expect(pointerdown.defaultPrevented).toBe(true);
			const mousedown = new MouseEvent('mousedown', {
				bubbles: true,
				cancelable: true,
				button: 0
			});
			target.dispatchEvent(mousedown);
			expect(mousedown.defaultPrevented).toBe(true);
			// A press that never turned into a drag must not leave one behind.
			await firePointer(target, 'pointerup', { pointerId: 3 });
		}
		expect(document.activeElement).toBe(field);
	});

	test('leaves a touch press and a secondary button alone', async () => {
		await setup();
		const touch = new PointerEvent('pointerdown', {
			bubbles: true,
			cancelable: true,
			pointerId: 4,
			button: 0,
			pointerType: 'touch'
		});
		track('vertical')!.dispatchEvent(touch);
		expect(touch.defaultPrevented).toBe(false);

		const secondary = new PointerEvent('pointerdown', {
			bubbles: true,
			cancelable: true,
			pointerId: 5,
			button: 2,
			pointerType: 'mouse'
		});
		track('vertical')!.dispatchEvent(secondary);
		expect(secondary.defaultPrevented).toBe(false);
	});
});

describe('scroll snapping while dragging', () => {
	test('is switched off for the drag and restored when it ends or is cancelled', async () => {
		await setup();
		viewport().style.scrollSnapType = 'y mandatory';
		const handle = thumb('vertical')!;
		mockRect(track('vertical')!, { x: 0, y: 0, width: 6, height: 200 });
		mockRect(handle, { x: 0, y: 0, width: 6, height: 50 });
		await tick();

		await firePointer(handle, 'pointerdown', { clientY: 5 });
		expect(viewport().style.scrollSnapType).toBe('none');
		await firePointer(handle, 'pointerup', { clientY: 5 });
		expect(viewport().style.scrollSnapType).toBe('y mandatory');

		await firePointer(handle, 'pointerdown', { clientY: 5 });
		expect(viewport().style.scrollSnapType).toBe('none');
		await firePointer(handle, 'pointercancel', { clientY: 5 });
		expect(viewport().style.scrollSnapType).toBe('y mandatory');
	});
});

describe('viewportAttrs', () => {
	test('turns the viewport into the caller’s widget without a name or a tab stop of its own', async () => {
		render(ScrollAreaHooksHarness, {
			props: {
				type: 'always',
				viewportAttrs: {
					role: 'listbox',
					id: 'options',
					'aria-activedescendant': 'option-2',
					'data-listbox': ''
				}
			}
		});
		await waitFor(() => expect(root()).toHaveAttribute('data-has-overflow-y'));
		const region = viewport();
		expect(region).toHaveAttribute('role', 'listbox');
		expect(region).toHaveAttribute('id', 'options');
		expect(region).toHaveAttribute('aria-activedescendant', 'option-2');
		expect(region).toHaveAttribute('data-listbox');
		// Overflowing, yet neither the automatic name nor the automatic tab stop.
		expect(region).not.toHaveAttribute('aria-label');
		expect(region).not.toHaveAttribute('tabindex');
		expect(screen.getByRole('listbox')).toBe(region);
		// The scroll area's own hooks stay on the same element.
		expect(region).toHaveAttribute('data-scroll-area-viewport');
	});

	test('takes the caller’s name and tab stop over the automatic ones', async () => {
		render(ScrollAreaHooksHarness, {
			props: {
				type: 'always',
				viewportAttrs: { role: 'listbox', 'aria-label': 'Options', tabindex: -1 }
			}
		});
		await waitFor(() => expect(root()).toHaveAttribute('data-has-overflow-y'));
		expect(screen.getByRole('listbox', { name: 'Options' })).toBe(viewport());
		expect(viewport()).toHaveAttribute('tabindex', '-1');
	});

	test('keeps the automatic accessibility tree when it passes no role', async () => {
		render(ScrollAreaHooksHarness, {
			props: { type: 'always', viewportAttrs: { 'data-extra': 'yes' } }
		});
		await waitFor(() => expect(viewport()).toHaveAttribute('tabindex', '0'));
		expect(screen.getByRole('group', { name: 'Scrollable content' })).toBe(viewport());
		expect(viewport()).toHaveAttribute('data-extra', 'yes');
	});

	test('adds its class and runs its handlers before the built-in ones', async () => {
		const calls: string[] = [];
		render(ScrollAreaHooksHarness, {
			props: {
				type: 'always',
				onscroll: () => calls.push('prop'),
				viewportAttrs: {
					class: 'listbox-viewport',
					onscroll: () => calls.push('attrs'),
					onfocus: () => calls.push('focus')
				}
			}
		});
		await waitFor(() => expect(root()).toHaveAttribute('data-has-overflow-y'));
		expect(viewport()).toHaveClass('listbox-viewport');
		expect(viewport().className).toContain('outline-none');

		await fireEvent.scroll(viewport());
		expect(calls).toEqual(['attrs', 'prop']);

		await waitFor(() => expect(viewport()).toHaveAttribute('tabindex', '0'));
		viewport().focus();
		expect(calls).toContain('focus');
		// The built-in focus bookkeeping still ran after the caller's handler.
		viewport().blur();
	});
});
