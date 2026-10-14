// The scroll lock in real engines (Chromium and WebKit): a viewport with a classic scrollbar keeps
// the page's width when the lock hides it, whether the engine honours `scrollbar-gutter` or the
// lock falls back to padding the scrollbar's width (CX-11). The rules below mirror the plugin CSS
// in `tailwind/global.ts`; the scrollbar is a custom `::-webkit-scrollbar`, which classic-looking
// bars on every platform (including overlay-scrollbar machines) share.
import { afterEach, describe, expect, test } from 'vitest';
import { lockScroll, SCROLL_LOCK_ATTRIBUTE } from './useScrollLock.svelte.js';

let style: HTMLStyleElement | null = null;
let main: HTMLElement | null = null;

afterEach(() => {
	style?.remove();
	main?.remove();
	style = main = null;
	document.documentElement.removeAttribute(SCROLL_LOCK_ATTRIBUTE);
});

describe('lockScroll with a classic scrollbar', () => {
	test('the page content keeps its width while the lock hides the scrollbar', () => {
		style = document.createElement('style');
		style.textContent = `
			::-webkit-scrollbar { width: 15px; height: 15px; }
			::-webkit-scrollbar-thumb { background: #888; }
			[data-entasis-scroll-lock] { overflow: hidden !important; }
			[data-entasis-scroll-lock]:not([data-entasis-scroll-lock='uncompensated']):not([data-entasis-scroll-lock='padding']) { scrollbar-gutter: stable !important; }
			[data-entasis-scroll-lock][data-entasis-scroll-lock='padding'] { padding-inline-end: var(--entasis-scrollbar-width, 0px); }
		`;
		main = document.createElement('main');
		main.style.height = `${window.innerHeight * 3}px`;
		document.head.append(style);
		document.body.append(main);
		const before = main.getBoundingClientRect().width;
		// Skip on engines where this page shows no scrollbar at all.
		if (window.innerWidth === document.documentElement.clientWidth) return;

		const release = lockScroll();
		expect(main.getBoundingClientRect().width).toBe(before);
		release();
		expect(main.getBoundingClientRect().width).toBe(before);
	});
});
