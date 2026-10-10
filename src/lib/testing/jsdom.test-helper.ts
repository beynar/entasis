// jsdom stand-ins for the browser APIs that overlays, positioning and keyboard navigation read.
// `vitest-setup-client.ts` installs them for every `*.svelte.test.ts` and resets them after each
// test; tests drive them through the controls exported here:
//
//   closeWatchers.requestClose()   Android Back (and desktop Escape) for the newest CloseWatcher
//   viewport.set({ height: 400 })  the visual viewport shrinking under an on-screen keyboard
//   mockRect(el, { … })            layout for one element (jsdom reports none)
//   mockNotRendered(el)            an element hidden by CSS: no client rects, zero size
//
// Behaviour that depends on real layout, focus order or input belongs in `*.browser.test.ts`.

type Rect = { x?: number; y?: number; width: number; height: number };

// ---------------------------------------------------------------------------------------------
// CloseWatcher
// ---------------------------------------------------------------------------------------------

/** Watchers that can still receive a close request, oldest first. */
const activeWatchers: CloseWatcherStub[] = [];

/**
 * The HTML `CloseWatcher` (https://html.spec.whatwg.org/#closewatcher), without user-activation
 * grouping: every watcher is its own group, and `cancel` is cancelable unless a test says
 * otherwise through `closeWatchers.requestClose({ cancelable: false })`.
 */
export class CloseWatcherStub extends EventTarget {
	oncancel: ((event: Event) => void) | null = null;
	onclose: ((event: Event) => void) | null = null;
	#active = true;
	#runningCancel = false;

	constructor(options: { signal?: AbortSignal } = {}) {
		super();
		if (options.signal?.aborted) {
			this.#active = false;
			return;
		}
		options.signal?.addEventListener('abort', () => this.destroy(), { once: true });
		activeWatchers.push(this);
	}

	/** Spec `requestClose()`: fire `cancel`, then close unless it was cancelled. */
	requestClose(): void {
		this.#request(true);
	}

	/** Spec `close()`: close without firing `cancel`. */
	close(): void {
		if (!this.#active) return;
		this.destroy();
		this.#fire('close', false);
	}

	/** Spec `destroy()`: stop receiving close requests, without events. */
	destroy(): void {
		this.#active = false;
		const index = activeWatchers.indexOf(this);
		if (index !== -1) activeWatchers.splice(index, 1);
	}

	/** Returns whether the watcher closed. */
	#request(cancelable: boolean): boolean {
		if (!this.#active || this.#runningCancel) return true;
		this.#runningCancel = true;
		const proceed = this.#fire('cancel', cancelable);
		this.#runningCancel = false;
		if (!proceed) return false;
		this.close();
		return true;
	}

	#fire(type: 'cancel' | 'close', cancelable: boolean): boolean {
		const event = new Event(type, { cancelable });
		const handler = type === 'cancel' ? this.oncancel : this.onclose;
		handler?.call(this, event);
		this.dispatchEvent(event);
		return !event.defaultPrevented;
	}

	/** @internal Used by `closeWatchers.requestClose`. */
	static request(watcher: CloseWatcherStub, cancelable: boolean) {
		return watcher.#request(cancelable);
	}
}

export const closeWatchers = {
	/** Active watchers, oldest first. */
	get active(): readonly CloseWatcherStub[] {
		return [...activeWatchers];
	},
	/**
	 * A user close request (Android Back, or Escape on desktop): sent to the newest active watcher.
	 * `cancelable: false` models a page without user activation, where `cancel` cannot be prevented.
	 * Returns false when nothing closed (no watcher, or `cancel` was prevented).
	 */
	requestClose({ cancelable = true }: { cancelable?: boolean } = {}): boolean {
		const newest = activeWatchers.at(-1);
		if (!newest) return false;
		return CloseWatcherStub.request(newest, cancelable);
	},
	reset() {
		activeWatchers.length = 0;
	}
};

// Chromium turns an Escape keydown that nobody prevented into a close request after dispatch,
// whether or not its propagation was stopped. Mirror that (listening in the capture phase), so a
// component that both handles Escape and owns a CloseWatcher is tested for double handling
// exactly as it would run in the browser.
function forwardEscapeToCloseWatchers(event: KeyboardEvent) {
	if (event.key !== 'Escape' || event.isComposing) return;
	queueMicrotask(() => {
		if (!event.defaultPrevented) closeWatchers.requestClose();
	});
}

// ---------------------------------------------------------------------------------------------
// visualViewport
// ---------------------------------------------------------------------------------------------

type ViewportState = {
	width: number;
	height: number;
	offsetLeft: number;
	offsetTop: number;
	scale: number;
};

/** `window.visualViewport`: follows the window size until a test sets it. */
export class VisualViewportStub extends EventTarget {
	onresize: ((event: Event) => void) | null = null;
	onscroll: ((event: Event) => void) | null = null;
	onscrollend: ((event: Event) => void) | null = null;
	#state: Partial<ViewportState> = {};

	get width() {
		return this.#state.width ?? window.innerWidth;
	}
	get height() {
		return this.#state.height ?? window.innerHeight;
	}
	get offsetLeft() {
		return this.#state.offsetLeft ?? 0;
	}
	get offsetTop() {
		return this.#state.offsetTop ?? 0;
	}
	get pageLeft() {
		return window.scrollX + this.offsetLeft;
	}
	get pageTop() {
		return window.scrollY + this.offsetTop;
	}
	get scale() {
		return this.#state.scale ?? 1;
	}

	/** @internal Used by `viewport.set`. */
	apply(next: Partial<ViewportState>) {
		const resized = ['width', 'height', 'scale'].some((key) => key in next);
		const scrolled = ['offsetLeft', 'offsetTop'].some((key) => key in next);
		this.#state = { ...this.#state, ...next };
		if (resized) this.#fire('resize');
		if (scrolled) this.#fire('scroll');
	}

	/** @internal Used by `resetJsdomStubs`. */
	clear() {
		this.#state = {};
	}

	#fire(type: 'resize' | 'scroll') {
		const event = new Event(type);
		(type === 'resize' ? this.onresize : this.onscroll)?.call(this, event);
		this.dispatchEvent(event);
	}
}

const visualViewportStub = new VisualViewportStub();

export const viewport = {
	visual: visualViewportStub,
	/**
	 * Change the visual viewport (e.g. `{ height: 400 }` for an on-screen keyboard, `offsetTop`
	 * for a pinch-zoom pan). Fires `resize` and/or `scroll` on `window.visualViewport`.
	 */
	set(next: Partial<ViewportState>) {
		visualViewportStub.apply(next);
	},
	/** Resize the layout viewport (`innerWidth`/`innerHeight`) and fire `resize` on window. */
	resizeWindow(width: number, height: number) {
		Object.assign(window, { innerWidth: width, innerHeight: height });
		window.dispatchEvent(new Event('resize'));
	}
};

const initialWindowSize = { width: 1024, height: 768 };

// ---------------------------------------------------------------------------------------------
// Element rects
// ---------------------------------------------------------------------------------------------

/** `null` = not rendered (display: none or detached). */
const rectOverrides = new Map<Element, DOMRect | null>();

const toDOMRect = ({ x = 0, y = 0, width, height }: Rect) => new DOMRect(x, y, width, height);
const rectList = (rects: DOMRect[]) =>
	Object.assign([...rects], {
		item: (index: number) => rects[index] ?? null
	}) as unknown as DOMRectList;

/** Give one element a layout box: `getBoundingClientRect`, `getClientRects` and offset size. */
export function mockRect(element: Element, rect: Rect) {
	rectOverrides.set(element, toDOMRect(rect));
}

/** Make one element report what a CSS-hidden element reports: no client rects, zero size. */
export function mockNotRendered(element: Element) {
	rectOverrides.set(element, null);
}

export function clearRectMock(element: Element) {
	rectOverrides.delete(element);
}

// ---------------------------------------------------------------------------------------------
// Installation
// ---------------------------------------------------------------------------------------------

let installed = false;

export function installJsdomStubs() {
	if (installed) return;
	installed = true;

	Object.defineProperty(window, 'CloseWatcher', {
		configurable: true,
		writable: true,
		value: CloseWatcherStub
	});
	window.addEventListener('keydown', forwardEscapeToCloseWatchers, true);

	Object.defineProperty(window, 'visualViewport', {
		configurable: true,
		get: () => visualViewportStub
	});

	const boundingClientRect = Element.prototype.getBoundingClientRect;
	Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
		configurable: true,
		writable: true,
		value: function entasisGetBoundingClientRect(this: Element) {
			if (!rectOverrides.has(this)) return boundingClientRect.call(this);
			return rectOverrides.get(this) ?? new DOMRect(0, 0, 0, 0);
		}
	});
	// jsdom reports no client rects at all, which the focus helpers read as "not rendered".
	// Every element reports one 1×1 rect, so tabbability checks behave like a real browser.
	Object.defineProperty(Element.prototype, 'getClientRects', {
		configurable: true,
		writable: true,
		value: function entasisGetClientRects(this: Element) {
			if (!rectOverrides.has(this)) return rectList([new DOMRect(0, 0, 1, 1)]);
			const rect = rectOverrides.get(this);
			return rectList(rect ? [rect] : []);
		}
	});
	for (const [name, axis] of [
		['offsetWidth', 'width'],
		['offsetHeight', 'height']
	] as const) {
		const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, name);
		Object.defineProperty(HTMLElement.prototype, name, {
			configurable: true,
			get(this: HTMLElement) {
				if (!rectOverrides.has(this)) return original?.get?.call(this) ?? 0;
				return Math.round(rectOverrides.get(this)?.[axis] ?? 0);
			}
		});
	}
}

/** Called after every test: no watcher, viewport size or rect leaks into the next one. */
export function resetJsdomStubs() {
	closeWatchers.reset();
	visualViewportStub.clear();
	rectOverrides.clear();
	Object.assign(window, {
		innerWidth: initialWindowSize.width,
		innerHeight: initialWindowSize.height
	});
}
