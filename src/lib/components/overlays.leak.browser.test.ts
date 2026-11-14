// Overlays must give back everything an open took: 200 open/close cycles (and mount/open/unmount
// cycles) of each overlay owner, measured against a warm-up baseline, in Chromium only.
//
// Two measurements, each chosen for what it can see from inside the test iframe:
// - window/document listeners: `addEventListener`/`removeEventListener` on `window` and `document`
//   are wrapped for the duration of the file, so the live set is known exactly (keyed by type,
//   listener identity and capture; `once` and `signal` removals are followed). CDP's
//   `DOMDebugger.getEventListeners` needs an objectId from the test frame's execution context,
//   and `cdp()` talks to the top page, so wrapping is the simpler and exact source.
// - DOM nodes and JS event listeners: `HeapProfiler.collectGarbage` then `Memory.getDOMCounters`
//   through `cdp()`. The counters are renderer-wide (the top page and every iframe), so only their
//   difference across cycles means anything. A node a closed overlay still retains (detached, or
//   left in a portal) survives the forced GC and shows up as growth proportional to the cycles.
//
// The slack below is a constant, far under one leaked node or listener per cycle: a real leak
// grows by at least 200 over the measured run.
import { tick } from 'svelte';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { animationsSettled, engine, nextFrame } from '$lib/testing/browser.test-helper.js';
import OverlaysLeakHarness, {
	type LeakController,
	type LeakKind
} from './OverlaysLeakHarness.test.svelte';

const WARM_UP = 20;
const CYCLES = 200;
const MOUNT_CYCLES = 100;
const NODE_SLACK = 60;
const JS_LISTENER_SLACK = 20;
const GLOBAL_LISTENER_SLACK = 0;

type Target = 'window' | 'document';
const live: Record<Target, Map<string, number>> = { window: new Map(), document: new Map() };
const restore: (() => void)[] = [];

/** Wraps a target's listener methods so the set of live listeners is known exactly. */
function track(name: Target, target: EventTarget) {
	const add = target.addEventListener;
	const remove = target.removeEventListener;
	const ids = new WeakMap<object, number>();
	const onceWrappers = new Map<string, EventListener>();
	let nextId = 0;
	const keyOf = (
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | EventListenerOptions
	) => {
		if (!ids.has(listener)) ids.set(listener, (nextId += 1));
		const capture = typeof options === 'boolean' ? options : !!options?.capture;
		return `${type}|${ids.get(listener)}|${capture}`;
	};
	const forget = (key: string) => {
		const count = (live[name].get(key) ?? 0) - 1;
		if (count > 0) live[name].set(key, count);
		else live[name].delete(key);
	};

	target.addEventListener = function (
		this: EventTarget,
		type: string,
		listener: EventListenerOrEventListenerObject | null,
		options?: boolean | AddEventListenerOptions
	) {
		if (!listener) return add.call(this, type, listener, options);
		const key = keyOf(type, listener, options);
		// A second identical registration is a no-op in the DOM, so it is not counted twice.
		if (live[name].has(key)) return add.call(this, type, listener, options);
		live[name].set(key, 1);
		const signal = typeof options === 'object' ? options.signal : undefined;
		signal?.addEventListener('abort', () => forget(key), { once: true });
		if (typeof options === 'object' && options.once) {
			const wrapper: EventListener = function (this: unknown, event) {
				forget(key);
				onceWrappers.delete(key);
				return typeof listener === 'function'
					? listener.call(this, event)
					: listener.handleEvent(event);
			};
			onceWrappers.set(key, wrapper);
			return add.call(this, type, wrapper, options);
		}
		return add.call(this, type, listener, options);
	} as typeof add;

	target.removeEventListener = function (
		this: EventTarget,
		type: string,
		listener: EventListenerOrEventListenerObject | null,
		options?: boolean | EventListenerOptions
	) {
		if (!listener) return remove.call(this, type, listener, options);
		const key = keyOf(type, listener, options);
		const wrapper = onceWrappers.get(key);
		if (live[name].has(key)) forget(key);
		if (wrapper) onceWrappers.delete(key);
		return remove.call(this, type, wrapper ?? listener, options);
	} as typeof remove;

	restore.push(() => {
		target.addEventListener = add;
		target.removeEventListener = remove;
	});
}

interface Sample {
	window: number;
	document: number;
	nodes: number;
	jsEventListeners: number;
	bodyChildren: number;
}

/** Live counts after the page settled and a forced garbage collection. */
async function sample(): Promise<Sample> {
	await tick();
	await animationsSettled();
	await nextFrame();
	const session = cdp();
	await session.send('HeapProfiler.collectGarbage');
	await session.send('HeapProfiler.collectGarbage');
	const counters = (await session.send('Memory.getDOMCounters')) as {
		nodes: number;
		jsEventListeners: number;
	};
	return {
		window: live.window.size,
		document: live.document.size,
		nodes: counters.nodes,
		jsEventListeners: counters.jsEventListeners,
		bodyChildren: document.body.childElementCount
	};
}

/** Resolves on the controller's next `afterOpen`/`afterClose`, or fails after a second. */
function next(controller: LeakController, hook: 'afterOpen' | 'afterClose') {
	return new Promise<void>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`${hook} never fired`)), 1000);
		controller[hook] = () => {
			clearTimeout(timer);
			controller[hook] = undefined;
			resolve();
		};
	});
}

async function openClose(controller: LeakController) {
	const opened = next(controller, 'afterOpen');
	controller.setOpen!(true);
	await opened;
	const closed = next(controller, 'afterClose');
	controller.setOpen!(false);
	await closed;
}

async function mountOpenUnmount(controller: LeakController) {
	controller.setMounted!(true);
	await tick();
	const opened = next(controller, 'afterOpen');
	controller.setOpen!(true);
	await opened;
	// Unmounted while open: nothing gets to run its close path first.
	controller.setMounted!(false);
	controller.setOpen!(false);
	await tick();
}

/** The trigger a person presses, for the kinds a click opens. */
const triggers: Partial<Record<LeakKind, () => HTMLElement>> = {
	dialog: () => page.getByRole('button', { name: 'Open dialog' }).element() as HTMLElement,
	popover: () => page.getByRole('button', { name: 'Open popover' }).element() as HTMLElement,
	menu: () => page.getByRole('button', { name: 'File' }).element() as HTMLElement,
	select: () => page.getByRole('combobox', { name: 'Fruit' }).element() as HTMLElement
};

function growth(before: Sample, after: Sample) {
	return {
		window: after.window - before.window,
		document: after.document - before.document,
		nodes: after.nodes - before.nodes,
		jsEventListeners: after.jsEventListeners - before.jsEventListeners,
		bodyChildren: after.bodyChildren - before.bodyChildren
	};
}

function expectNoGrowth(label: string, delta: ReturnType<typeof growth>) {
	expect(delta.window, `${label}: window listeners`).toBeLessThanOrEqual(GLOBAL_LISTENER_SLACK);
	expect(delta.document, `${label}: document listeners`).toBeLessThanOrEqual(GLOBAL_LISTENER_SLACK);
	expect(delta.bodyChildren, `${label}: elements left in <body>`).toBeLessThanOrEqual(0);
	expect(delta.nodes, `${label}: DOM nodes`).toBeLessThanOrEqual(NODE_SLACK);
	expect(delta.jsEventListeners, `${label}: JS event listeners`).toBeLessThanOrEqual(
		JS_LISTENER_SLACK
	);
}

/** Renders one overlay with the pointer resting away from it, so no hover trigger opens it. */
async function mount(kind: LeakKind) {
	const controller: LeakController = {};
	const view = await render(OverlaysLeakHarness, { props: { kind, controller } });
	await restPointer();
	return { controller, view };
}

const restPointer = () => userEvent.hover(page.getByTestId('elsewhere'));

const kinds: LeakKind[] = [
	'dialog',
	'popover',
	'menu',
	'tooltip',
	'hover-card',
	'select',
	'combobox'
];

describe.skipIf(engine !== 'chromium')('overlay leaks (Chromium, CDP)', () => {
	beforeAll(() => {
		track('window', window);
		track('document', document);
	});
	afterAll(() => {
		for (const undo of restore.splice(0)) undo();
	});

	describe.each(kinds)('%s', (kind) => {
		test(`${CYCLES} open/close cycles leave no listeners or nodes behind`, async () => {
			const { controller, view } = await mount(kind);

			// One real open and close first, through the trigger a person presses.
			const trigger = triggers[kind]?.();
			if (trigger) {
				const opened = next(controller, 'afterOpen');
				await userEvent.click(trigger);
				await opened;
				const closed = next(controller, 'afterClose');
				await userEvent.keyboard('{Escape}');
				await closed;
				await restPointer();
			}
			for (let index = 0; index < WARM_UP; index += 1) await openClose(controller);
			const before = await sample();
			for (let index = 0; index < CYCLES; index += 1) await openClose(controller);
			const after = await sample();

			expectNoGrowth(`${kind} open/close`, growth(before, after));
			view.unmount();
		});

		test(`${MOUNT_CYCLES} mount/open/unmount cycles leave no listeners or nodes behind`, async () => {
			const { controller, view } = await mount(kind);

			for (let index = 0; index < WARM_UP; index += 1) await mountOpenUnmount(controller);
			const before = await sample();
			for (let index = 0; index < MOUNT_CYCLES; index += 1) await mountOpenUnmount(controller);
			const after = await sample();

			expectNoGrowth(`${kind} mount/unmount`, growth(before, after));
			view.unmount();
		});
	});
});
