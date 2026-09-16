import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useBoundingClientRect } from './useBoundingClientRect.svelte.js';

class FakeResizeObserver {
	static instances: FakeResizeObserver[] = [];
	observed = new Set<Element>();
	constructor(private callback: (entries: ResizeObserverEntry[]) => void) {
		FakeResizeObserver.instances.push(this);
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
	fire() {
		this.callback([...this.observed].map((target) => ({ target }) as ResizeObserverEntry));
	}
}

let original: typeof globalThis.ResizeObserver;
beforeEach(() => {
	FakeResizeObserver.instances = [];
	original = globalThis.ResizeObserver;
	globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof globalThis.ResizeObserver;
});
afterEach(() => {
	globalThis.ResizeObserver = original;
});

const nodeWithRect = (rect: Partial<DOMRect>) => {
	const node = document.createElement('div');
	Object.defineProperty(node, 'getBoundingClientRect', {
		configurable: true,
		value: () => ({ top: 0, left: 0, width: 0, height: 0, ...rect }) as DOMRect
	});
	return node;
};

describe('useBoundingClientRect', () => {
	it('starts on a zeroed rect that serialises', () => {
		const box = useBoundingClientRect();
		expect(box.current.width).toBe(0);
		expect(box.current.toJSON()).toMatchObject({ width: 0, height: 0 });
	});

	it('reads the rect on attach and again on every resize', () => {
		const box = useBoundingClientRect();
		const node = nodeWithRect({ width: 100, height: 40 });
		const cleanup = box.reference(node);
		expect(box.current.width).toBe(100);

		Object.defineProperty(node, 'getBoundingClientRect', {
			configurable: true,
			value: () => ({ top: 0, left: 0, width: 250, height: 40 }) as DOMRect
		});
		FakeResizeObserver.instances[0].fire();
		expect(box.current.width).toBe(250);

		cleanup?.();
		expect(FakeResizeObserver.instances[0].observed.size).toBe(0);
	});
});
