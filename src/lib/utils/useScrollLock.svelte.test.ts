// Scroll lock as an attribute on the scroller: it coexists with locks other libraries hold,
// respects `scrollbar-gutter`, and publishes the hidden scrollbar's width (OV-4, CX-11).
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	lockScroll,
	SCROLL_LOCK_ATTRIBUTE,
	SCROLL_LOCK_PADDED,
	SCROLL_LOCK_UNCOMPENSATED,
	SCROLLBAR_WIDTH_VARIABLE,
	useScrollLock
} from './useScrollLock.svelte.js';

const root = document.documentElement;
const locked = () => root.hasAttribute(SCROLL_LOCK_ATTRIBUTE);

/** Gives the page a classic scrollbar `width` px wide, the way the viewport reports it. */
const classicScrollbar = (width: number) => {
	vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
	vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(1024 - width);
};

/** What `getComputedStyle(...).scrollbarGutter` reports for `html` and `body`. */
const gutter = (value: string) => {
	const real = window.getComputedStyle.bind(window);
	vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
		const style = real(element, pseudo);
		return new Proxy(style, {
			get: (target, property) =>
				property === 'scrollbarGutter'
					? value
					: Reflect.get(target, property, target) instanceof Function
						? (Reflect.get(target, property, target) as (...args: unknown[]) => unknown).bind(
								target
							)
						: Reflect.get(target, property, target)
		});
	});
};

beforeEach(() => {
	root.removeAttribute('style');
	document.body.removeAttribute('style');
});
afterEach(() => {
	vi.restoreAllMocks();
	root.removeAttribute(SCROLL_LOCK_ATTRIBUTE);
	root.removeAttribute('style');
	document.body.removeAttribute('style');
});

describe('lockScroll', () => {
	test('locks <html> with an attribute and leaves inline styles alone', () => {
		classicScrollbar(15);
		root.style.overflow = 'auto';
		const release = lockScroll();
		expect(root).toHaveAttribute(SCROLL_LOCK_ATTRIBUTE, '');
		expect(root.style.overflow).toBe('auto');
		expect(document.body.style.overflow).toBe('');
		expect(document.body.style.paddingRight).toBe('');
		release();
		expect(locked()).toBe(false);
		expect(root.style.overflow).toBe('auto');
	});

	test('publishes the hidden scrollbar width while locked and removes it on release', () => {
		classicScrollbar(15);
		const release = lockScroll();
		expect(root.style.getPropertyValue(SCROLLBAR_WIDTH_VARIABLE)).toBe('15px');
		release();
		expect(root.style.getPropertyValue(SCROLLBAR_WIDTH_VARIABLE)).toBe('');
	});

	test('an outside inline overflow: hidden set before the lock survives the release', () => {
		root.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';
		const release = lockScroll();
		release();
		expect(root.style.overflow).toBe('hidden');
		expect(document.body.style.overflow).toBe('hidden');
	});

	test('an outside lock cleared while ours is held does not unlock the page', () => {
		root.style.overflow = 'hidden';
		const release = lockScroll();
		root.style.overflow = '';
		expect(locked()).toBe(true);
		release();
		expect(locked()).toBe(false);
	});

	test('stacked locks hold the attribute until the last release, and a release counts once', () => {
		const first = lockScroll();
		const second = lockScroll();
		first();
		first();
		expect(locked()).toBe(true);
		second();
		expect(locked()).toBe(false);
	});

	test('a page that already reserves its gutter gets no second one', () => {
		classicScrollbar(15);
		gutter('stable both-edges');
		const release = lockScroll();
		expect(root).toHaveAttribute(SCROLL_LOCK_ATTRIBUTE, SCROLL_LOCK_UNCOMPENSATED);
		release();
	});

	test('pads the scrollbar width when the gutter did not hold and the content widened', () => {
		const width = vi.spyOn(root, 'clientWidth', 'get');
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
		// 1009 with the scrollbar showing; the attribute hides it and nothing kept its room.
		width.mockImplementation(() => (locked() ? 1024 : 1009));
		const release = lockScroll();
		expect(root).toHaveAttribute(SCROLL_LOCK_ATTRIBUTE, SCROLL_LOCK_PADDED);
		expect(root.style.getPropertyValue(SCROLLBAR_WIDTH_VARIABLE)).toBe('15px');
		release();
		expect(locked()).toBe(false);
	});

	test('keeps the gutter rule when the content did not widen', () => {
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
		vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(1009);
		const release = lockScroll();
		expect(root).toHaveAttribute(SCROLL_LOCK_ATTRIBUTE, '');
		release();
	});

	test('overlay scrollbars need no compensation', () => {
		classicScrollbar(0);
		const release = lockScroll();
		expect(root).toHaveAttribute(SCROLL_LOCK_ATTRIBUTE, SCROLL_LOCK_UNCOMPENSATED);
		expect(root.style.getPropertyValue(SCROLLBAR_WIDTH_VARIABLE)).toBe('0px');
		release();
	});

	test('locks another scroller the same way', () => {
		const pane = document.createElement('div');
		document.body.append(pane);
		const release = lockScroll(pane);
		expect(pane).toHaveAttribute(SCROLL_LOCK_ATTRIBUTE);
		expect(locked()).toBe(false);
		release();
		expect(pane).not.toHaveAttribute(SCROLL_LOCK_ATTRIBUTE);
		pane.remove();
	});
});

describe('useScrollLock', () => {
	test('locks while active and releases when it turns inactive or is destroyed', () => {
		let active = $state(false);
		const destroy = $effect.root(() => {
			useScrollLock({ isActive: () => active });
		});
		flushSync();
		expect(locked()).toBe(false);
		active = true;
		flushSync();
		expect(locked()).toBe(true);
		active = false;
		flushSync();
		expect(locked()).toBe(false);
		active = true;
		flushSync();
		destroy();
		expect(locked()).toBe(false);
	});
});
