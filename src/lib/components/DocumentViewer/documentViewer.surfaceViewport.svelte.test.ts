import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Harness from './surfaceViewportHarness.test.svelte';
import type { createDocumentSurfaceViewport } from './documentViewer.surfaceViewport.svelte.js';

type Surface = ReturnType<typeof createDocumentSurfaceViewport>;
type Rect = { top?: number; left?: number; width?: number; height?: number };

const frames = new Map<number, FrameRequestCallback>();
let nativeResizeObserver: typeof ResizeObserver;
let nextFrame = 0;
const flushFrames = () => {
	const queued = [...frames.values()];
	frames.clear();
	for (const frame of queued) frame(0);
};

class TestResizeObserver {
	static instances: TestResizeObserver[] = [];
	disconnected = false;
	constructor(private readonly callback: ResizeObserverCallback) {
		TestResizeObserver.instances.push(this);
	}
	observe() {}
	unobserve() {}
	disconnect() {
		this.disconnected = true;
	}
	resize(width: number, height: number) {
		this.callback([{ contentRect: { width, height } } as ResizeObserverEntry], this as never);
	}
}

const stubRect = (node: Element, { top = 0, left = 0, width = 0, height = 0 }: Rect) => {
	vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
		top,
		left,
		width,
		height,
		right: left + width,
		bottom: top + height,
		x: left,
		y: top,
		toJSON: () => ({})
	} as DOMRect);
};

const stubBox = (node: Element, box: { clientWidth?: number; clientHeight?: number }) => {
	for (const [key, value] of Object.entries(box)) {
		Object.defineProperty(node, key, { configurable: true, value });
	}
};

const mount = (props: Partial<Record<string, unknown>> = {}) => {
	let surface: Surface | undefined;
	const result = render(Harness, {
		props: { ...props, onsurface: (value: Surface) => (surface = value) }
	});
	const viewport = screen.getByTestId('viewport');
	const observer = TestResizeObserver.instances.at(-1)!;
	return { ...result, viewport, observer, surface: surface! };
};

beforeEach(() => {
	frames.clear();
	nextFrame = 0;
	TestResizeObserver.instances = [];
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
		frames.set(++nextFrame, callback);
		return nextFrame;
	});
	vi.stubGlobal('cancelAnimationFrame', (handle: number) => frames.delete(handle));
	// The client setup file installs a non-configurable ResizeObserver stub, so swap the value.
	nativeResizeObserver = window.ResizeObserver;
	window.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
	window.ResizeObserver = nativeResizeObserver;
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('createDocumentSurfaceViewport', () => {
	test('coalesces repeated resizes into a single fit frame', () => {
		const setScaleFromSurface = vi.fn();
		// Single mode so the only frame in flight is the fit.
		const { viewport, observer } = mount({ fit: 'width', mode: 'single', setScaleFromSurface });
		stubBox(viewport, { clientWidth: 832, clientHeight: 400 });
		setScaleFromSurface.mockClear(); // drop the fit taken before the viewport had a size

		// Mounting arms one frame; further resizes before it runs must not arm more.
		expect(frames.size).toBe(1);
		observer.resize(832, 400);
		observer.resize(900, 500);
		expect(frames.size).toBe(1);

		flushFrames();
		expect(setScaleFromSurface).toHaveBeenCalledTimes(1);
		expect(setScaleFromSurface).toHaveBeenCalledWith(1); // (832 - 32 padding) / 800

		// The frame re-arms once it has run.
		observer.resize(432, 400);
		expect(frames.size).toBe(1);
		flushFrames();
		expect(setScaleFromSurface).toHaveBeenCalledTimes(2);
	});

	test('fits a page to the smaller of the width and height scales', () => {
		const setScaleFromSurface = vi.fn();
		const { viewport } = mount({ fit: 'page', setScaleFromSurface });
		stubBox(viewport, { clientWidth: 832, clientHeight: 532 });

		flushFrames();
		// width (832 - 32) / 800 = 1, height (532 - 32) / 1000 = 0.5
		expect(setScaleFromSurface).toHaveBeenCalledWith(0.5);
	});

	test('ignores height-only resizes when the surface does not observe height', () => {
		const setScaleFromSurface = vi.fn();
		const { viewport, observer } = mount({
			fit: 'width',
			observesHeight: () => false,
			setScaleFromSurface
		});
		stubBox(viewport, { clientWidth: 832, clientHeight: 400 });
		flushFrames();
		observer.resize(832, 400); // records the baseline size
		flushFrames();
		setScaleFromSurface.mockClear();

		observer.resize(832, 900);
		expect(frames.size).toBe(0);

		observer.resize(500, 900);
		expect(frames.size).toBe(1);
		flushFrames();
		expect(setScaleFromSurface).toHaveBeenCalledTimes(1);
	});

	test('centres the requested page in the viewport, and skips a scroll already in place', async () => {
		const { viewport, rerender } = mount({ mode: 'scroll', orientation: 'vertical' });
		stubBox(viewport, { clientWidth: 832, clientHeight: 400 });
		stubRect(viewport, { top: 100, height: 400 });
		stubRect(viewport.querySelector('[data-document-unit="2"]')!, { top: 700, height: 200 });
		const scrollTo = vi.spyOn(viewport, 'scrollTo').mockImplementation(() => {});
		flushFrames();
		scrollTo.mockClear();

		await rerender({ page: 2 });
		flushFrames();
		// (700 - 100) - (400 - 200) / 2 = 500
		expect(scrollTo).toHaveBeenCalledWith({ top: 500, behavior: 'smooth' });

		stubBox(viewport, { clientWidth: 832, clientHeight: 400 });
		Object.defineProperty(viewport, 'scrollTop', { configurable: true, value: 500 });
		scrollTo.mockClear();
		await rerender({ page: 1 });
		// (200 - 100 + 500 scrollTop) - (400 - 200) / 2 = 500, the scroll offset already in place.
		stubRect(viewport.querySelector('[data-document-unit="1"]')!, { top: 200, height: 200 });
		flushFrames();
		expect(scrollTo).not.toHaveBeenCalled();
	});

	test('centres the requested page along the inline axis when pages flow horizontally', async () => {
		const { viewport, rerender } = mount({
			mode: 'scroll',
			unit: 'page',
			orientation: 'horizontal'
		});
		stubBox(viewport, { clientWidth: 400, clientHeight: 400 });
		stubRect(viewport, { left: 0, width: 400 });
		stubRect(viewport.querySelector('[data-document-unit="2"]')!, { left: 600, width: 200 });
		const scrollTo = vi.spyOn(viewport, 'scrollTo').mockImplementation(() => {});
		flushFrames();
		scrollTo.mockClear();

		await rerender({ page: 2 });
		flushFrames();
		// 600 - (400 - 200) / 2 = 500
		expect(scrollTo).toHaveBeenCalledWith({ left: 500, behavior: 'smooth' });
	});

	test('stops chasing the navigation target once the user scrolls, and tears down on unmount', async () => {
		const goTo = vi.fn();
		const { viewport, observer, surface, rerender, unmount } = mount({ mode: 'scroll', goTo });
		stubBox(viewport, { clientWidth: 832, clientHeight: 400 });
		stubRect(viewport, { top: 0, height: 400 });
		stubRect(viewport.querySelector('[data-document-unit="1"]')!, { top: 0, height: 300 });
		stubRect(viewport.querySelector('[data-document-unit="2"]')!, { top: 300, height: 300 });
		vi.spyOn(viewport, 'scrollTo').mockImplementation(() => {});
		flushFrames();

		await rerender({ page: 2 });
		flushFrames();

		// Page 1 is still at the reading position, but the pending navigation to page 2 owns the scroll.
		surface.schedulePageSync();
		flushFrames();
		expect(goTo).not.toHaveBeenCalled();

		// A wheel gesture hands control back to the user.
		viewport.dispatchEvent(new WheelEvent('wheel'));
		surface.schedulePageSync();
		flushFrames();
		expect(goTo).toHaveBeenCalledWith(1);

		goTo.mockClear();
		surface.schedulePageSync();
		expect(frames.size).toBe(1);
		unmount();
		expect(frames.size).toBe(0);
		expect(observer.disconnected).toBe(true);

		viewport.dispatchEvent(new WheelEvent('wheel'));
		flushFrames();
		expect(goTo).not.toHaveBeenCalled();
	});
});
