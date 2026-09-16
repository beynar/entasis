import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isOverflowing, useOverflowObserver } from './useOverflowObserver.svelte.js';

// jsdom has no layout and only a no-op ResizeObserver, so drive both by hand.
type Sized = { scroll: number; client: number };

const sizeNode = (node: HTMLElement, axis: 'x' | 'y', { scroll, client }: Sized) => {
	const [scrollKey, clientKey] =
		axis === 'x'
			? (['scrollWidth', 'clientWidth'] as const)
			: (['scrollHeight', 'clientHeight'] as const);
	Object.defineProperty(node, scrollKey, { configurable: true, value: scroll });
	Object.defineProperty(node, clientKey, { configurable: true, value: client });
};

let observers: FakeResizeObserver[];
let frames: Array<() => void>;
const flushFrames = () => {
	const queued = frames;
	frames = [];
	queued.forEach((frame) => frame());
};

class FakeResizeObserver {
	observed = new Set<Element>();
	constructor(private callback: () => void) {
		observers.push(this);
	}
	fire() {
		this.callback();
	}
	observe(node: Element) {
		this.observed.add(node);
	}
	unobserve(node: Element) {
		this.observed.delete(node);
	}
	disconnect() {
		this.observed.clear();
	}
}

let originalResizeObserver: typeof globalThis.ResizeObserver;
let originalRaf: typeof globalThis.requestAnimationFrame;
let originalCancelRaf: typeof globalThis.cancelAnimationFrame;

beforeEach(() => {
	observers = [];
	frames = [];
	originalResizeObserver = globalThis.ResizeObserver;
	originalRaf = globalThis.requestAnimationFrame;
	originalCancelRaf = globalThis.cancelAnimationFrame;
	globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof globalThis.ResizeObserver;
	globalThis.requestAnimationFrame = ((frame: FrameRequestCallback) => {
		frames.push(() => frame(0));
		return frames.length;
	}) as typeof globalThis.requestAnimationFrame;
	globalThis.cancelAnimationFrame = ((handle: number) => {
		frames[handle - 1] = () => {};
	}) as typeof globalThis.cancelAnimationFrame;
});

afterEach(() => {
	globalThis.ResizeObserver = originalResizeObserver;
	globalThis.requestAnimationFrame = originalRaf;
	globalThis.cancelAnimationFrame = originalCancelRaf;
	document.body.innerHTML = '';
});

const mount = (axis: 'x' | 'y', size: Sized, childCount = 0) => {
	const node = document.createElement('div');
	for (let index = 0; index < childCount; index += 1) {
		const child = document.createElement('span');
		child.setAttribute('role', 'tab');
		node.append(child);
	}
	document.body.append(node);
	sizeNode(node, axis, size);
	return node;
};

describe('isOverflowing', () => {
	it('allows one pixel of sub-pixel slack before reporting overflow', () => {
		const node = mount('x', { scroll: 101, client: 100 });
		expect(isOverflowing(node)).toBe(false);
		sizeNode(node, 'x', { scroll: 102, client: 100 });
		expect(isOverflowing(node)).toBe(true);
	});

	it('measures the vertical axis on request', () => {
		const node = mount('y', { scroll: 400, client: 100 });
		expect(isOverflowing(node, 'y')).toBe(true);
		expect(isOverflowing(node, 'x')).toBe(false);
	});
});

describe('useOverflowObserver', () => {
	it('measures on attach, one frame later', () => {
		const node = mount('x', { scroll: 500, client: 100 });
		const overflow = useOverflowObserver();
		overflow.attachment(node);

		expect(overflow.overflowing).toBe(false);
		flushFrames();
		expect(overflow.overflowing).toBe(true);
	});

	it('re-measures when the container resizes', () => {
		const node = mount('x', { scroll: 500, client: 100 });
		const overflow = useOverflowObserver();
		overflow.attachment(node);
		flushFrames();
		expect(overflow.overflowing).toBe(true);

		sizeNode(node, 'x', { scroll: 500, client: 900 });
		observers.forEach((observer) => observer.fire());
		flushFrames();
		expect(overflow.overflowing).toBe(false);
	});

	it('observes the matching descendants too', () => {
		const node = mount('x', { scroll: 500, client: 100 }, 3);
		const overflow = useOverflowObserver({ selector: '[role="tab"]' });
		overflow.attachment(node);
		expect(observers).toHaveLength(1);
		// The container plus each tab: a tab relabelling resizes no ancestor, so the
		// descendants have to be observed for the measurement to stay honest.
		expect(observers[0].observed.size).toBe(4);
		expect(observers[0].observed.has(node)).toBe(true);
		flushFrames();
		expect(overflow.overflowing).toBe(true);
	});

	it('honours the axis getter', () => {
		const node = mount('y', { scroll: 500, client: 100 });
		sizeNode(node, 'x', { scroll: 100, client: 100 });
		const overflow = useOverflowObserver({ axis: () => 'y' });
		overflow.attachment(node);
		flushFrames();
		expect(overflow.overflowing).toBe(true);
	});

	it('stays false and observes nothing while disabled', () => {
		const node = mount('x', { scroll: 500, client: 100 });
		const overflow = useOverflowObserver({ enabled: () => false });
		expect(overflow.attachment(node)).toBeUndefined();
		flushFrames();
		expect(overflow.overflowing).toBe(false);
		expect(observers).toHaveLength(0);
	});

	it('cancels its pending frame on teardown', () => {
		const node = mount('x', { scroll: 500, client: 100 });
		const overflow = useOverflowObserver();
		const cleanup = overflow.attachment(node);
		cleanup?.();
		flushFrames();
		expect(overflow.overflowing).toBe(false);
	});
});
