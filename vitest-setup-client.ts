import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// required for svelte5 + jsdom as jsdom does not support matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	enumerable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onChange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// jsdom lacks these observers; components (ScrollArea, DocumentViewer) construct them on mount.
class MockObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
	takeRecords() {
		return [];
	}
}
for (const name of ['IntersectionObserver', 'ResizeObserver'] as const) {
	if (!(name in window)) {
		Object.defineProperty(window, name, { writable: true, value: MockObserver });
	}
}

// jsdom lacks the Web Animations API; Svelte 5 drives CSS transitions (e.g. the
// Popover open/close) via element.animate(), so stub it or those transitions
// throw an unhandled "element.animate is not a function" that fails `vitest run`.
// The stub finishes on the next macrotask so a closing overlay with a real duration still
// leaves the DOM (Svelte waits for `finished` / `onfinish` before removing the node).
if (!('animate' in Element.prototype)) {
	Object.defineProperty(Element.prototype, 'animate', {
		writable: true,
		value: () => {
			const animation = {
				cancel() {},
				finish() {},
				play() {},
				pause() {},
				finished: Promise.resolve(),
				onfinish: null as null | (() => void),
				oncancel: null as null | (() => void)
			};
			setTimeout(() => animation.onfinish?.(), 0);
			return animation;
		}
	});
}

// jsdom has no layout: every element reports no client rects, which the focus helpers read as
// "not rendered". Report one rect so tabbability checks behave like a real browser.
Object.defineProperty(Element.prototype, 'getClientRects', {
	writable: true,
	value: function svelaiGetClientRects() {
		return [new DOMRect(0, 0, 1, 1)] as unknown as DOMRectList;
	}
});

// jsdom does not implement programmatic scrolling.
for (const name of ['scrollTo', 'scrollBy'] as const) {
	if (!(name in Element.prototype)) {
		Object.defineProperty(Element.prototype, name, { writable: true, value: () => {} });
	}
}

// add more mocks here if you need them
