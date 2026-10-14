// Floating placement in `popover.position.ts`, alone and through PopoverState. These tests pin the
// middleware chain, when a placement runs, what it writes on the wrapper, the order of the
// minimum-width writes, the autoUpdate and visual-viewport wiring, logical sides, and what
// PopoverState does with each placement (the directed-transition origin, the styling hooks, the
// hover safe area and initial focus). jsdom has no layout, so floating-ui's `computePosition` and
// `autoUpdate` are replaced by controllable mocks; real placement and flipping are covered in
// `popover.position.browser.test.ts` and `popover.viewport.svelte.test.ts`.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { Placement, VirtualElement } from '@floating-ui/dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mockRect, viewport } from '$lib/testing/jsdom.test-helper.js';
import {
	VIEWPORT_SETTLE_MS,
	applyDirectedOffset,
	claimPopupSide,
	createPanelPositioner,
	directedMotion,
	nearestLine,
	panelMiddleware,
	releasePanelPosition,
	reportedSide,
	resolvePlacement,
	snapToDevicePixel,
	transformOriginFor,
	writePanelPosition,
	type PanelPositionerOptions,
	type PopoverReference
} from './popover.position.js';
import PopoverPositionHarness from './PopoverPositionHarness.test.svelte';

type MiddlewareLike = { name: string; options: Record<string, unknown> };
type PositionOptions = {
	placement: Placement;
	strategy: string;
	middleware: MiddlewareLike[];
	platform?: { isRTL: (element: Element) => boolean };
};

const floating = vi.hoisted(() => ({
	/** The placement floating-ui "resolves" to, standing in for a flip; `null` keeps the request. */
	resolvedPlacement: null as string | null,
	/** What floating-ui's `hide()` reports for the reference. */
	referenceHidden: false,
	stopUpdates: () => {}
}));
const { computePosition, autoUpdate, defaultCompute } = vi.hoisted(() => {
	const defaultCompute = async (_reference: unknown, _floating: unknown, options?: unknown) => ({
		x: 12.5,
		y: 40,
		strategy: 'fixed' as const,
		placement: (floating.resolvedPlacement ?? (options as PositionOptions).placement) as Placement,
		middlewareData: { hide: { referenceHidden: floating.referenceHidden } }
	});
	return {
		defaultCompute,
		computePosition: vi.fn(defaultCompute),
		// Like floating-ui's own, the mock runs `update` once before returning the cleanup.
		autoUpdate: vi.fn((_reference: unknown, _floating: unknown, update: () => void) => {
			update();
			return floating.stopUpdates;
		})
	};
});
vi.mock('@floating-ui/dom', async (importOriginal) => ({
	...(await importOriginal<typeof import('@floating-ui/dom')>()),
	computePosition,
	autoUpdate
}));

const lastOptions = () => computePosition.mock.calls.at(-1)?.[2] as PositionOptions;
const observedUpdate = () => autoUpdate.mock.calls.at(-1)![2];
const middlewareNames = (options: PositionOptions) => options.middleware.map(({ name }) => name);
const middlewareNamed = (options: PositionOptions, name: string) =>
	options.middleware.find((middleware) => middleware.name === name)!;
/** Two wrapped lines of an element: the top half across, then the bottom half's left half. */
const wrapLines = (element: Element) => {
	element.getClientRects = () => {
		const box = element.getBoundingClientRect();
		return [
			new DOMRect(box.x, box.y, box.width, box.height / 2),
			new DOMRect(box.x, box.y + box.height / 2, box.width / 2, box.height / 2)
		] as unknown as DOMRectList;
	};
};
/** The reference of the last placement: the line box a line-anchored placement chose. */
const lastReferenceRect = () =>
	(computePosition.mock.calls.at(-1)![0] as VirtualElement).getBoundingClientRect();
const setDevicePixelRatio = (ratio: number) =>
	Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: ratio });

const setup = (overrides: Partial<PanelPositionerOptions> = {}) => {
	const reference = document.createElement('button');
	document.body.append(reference);
	mockRect(reference, { x: 10, y: 20, width: 87.5, height: 32 });
	const panel = document.createElement('dialog');
	document.body.append(panel);
	const setMinWidth = vi.fn<PanelPositionerOptions['setMinWidth']>();
	const onPlace = vi.fn<PanelPositionerOptions['onPlace']>();
	const options: PanelPositionerOptions = {
		reference: () => reference,
		floating: () => true,
		settled: () => true,
		placement: () => 'bottom-start',
		offset: () => undefined,
		fitTrigger: () => false,
		positionPanel: () => undefined,
		setMinWidth,
		onPlace,
		...overrides
	};
	return { reference, panel, setMinWidth, onPlace, positioner: createPanelPositioner(options) };
};

/** The report for a floating-ui placement of a panel placed after its transition. */
const placed = (panel: HTMLElement, placement: Placement, extra: Record<string, unknown> = {}) => ({
	panel,
	placement,
	side: placement.split('-')[0],
	align: placement.split('-')[1] ?? 'center',
	anchorHidden: false,
	direction: 'ltr',
	mount: false,
	...extra
});

beforeEach(() => {
	floating.resolvedPlacement = null;
	floating.referenceHidden = false;
	floating.stopUpdates = () => {};
	computePosition.mockImplementation(defaultCompute);
	setDevicePixelRatio(1);
	document.body.replaceChildren();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('panel middleware', () => {
	test('offset, flip, size, shift and hide run in that order, keeping 20px from the viewport edges', () => {
		const middleware = panelMiddleware({ offset: 8 }) as unknown as MiddlewareLike[];
		expect(middleware.map(({ name }) => name)).toEqual(['offset', 'flip', 'size', 'shift', 'hide']);
		expect(middleware[0].options).toBe(8);
		expect(middleware[1].options).toEqual({
			mainAxis: true,
			crossAxis: true,
			padding: 20,
			fallbackAxisSideDirection: 'none'
		});
		// Before shift: the available space is the room on the panel's own side.
		expect(middleware[2].options).toMatchObject({ padding: 20 });
		expect(middleware[3].options).toEqual({
			mainAxis: true,
			crossAxis: true,
			padding: 20,
			rootBoundary: 'viewport'
		});
	});

	test('an unset offset keeps a 4px gap, and an explicit 0 stays 0', () => {
		expect((panelMiddleware()[0] as unknown as MiddlewareLike).options).toBe(4);
		expect((panelMiddleware({ offset: 0 })[0] as unknown as MiddlewareLike).options).toBe(0);
	});

	test('the layout viewport bounds shift only; flip and size keep the visual viewport', () => {
		const middleware = panelMiddleware({
			collisionBoundary: 'layoutViewport'
		}) as unknown as MiddlewareLike[];
		expect(middleware[1].options).not.toHaveProperty('rootBoundary');
		expect(middleware[2].options).not.toHaveProperty('rootBoundary');
		expect(middleware[3].options.rootBoundary).toBe('layoutViewport');
	});

	test('fallbackAxisSide lets flip try the perpendicular axis', () => {
		const middleware = panelMiddleware({ fallbackAxisSide: 'end' }) as unknown as MiddlewareLike[];
		expect(middleware[1].options.fallbackAxisSideDirection).toBe('end');
	});

	test('anchoring to a line without a point puts inline() first; with a point the line is chosen outside it', () => {
		const atPoint = panelMiddleware({ line: { x: 40, y: 60 } }) as unknown as MiddlewareLike[];
		expect(atPoint.map(({ name }) => name)).toEqual(['offset', 'flip', 'size', 'shift', 'hide']);
		const noPoint = panelMiddleware({ line: null }) as unknown as MiddlewareLike[];
		expect(noPoint[0]).toMatchObject({ name: 'inline', options: {} });
	});

	test('nearestLine picks the line holding the point, else the closest, even when lines overlap', () => {
		// The wrapped link of the docs: line 1 on the right, line 2 under it, overlapping in x.
		const first = new DOMRect(719, 400, 139, 24);
		const second = new DOMRect(656, 424, 78, 24);
		expect(nearestLine([first, second], { x: 760, y: 410 })).toBe(first);
		expect(nearestLine([first, second], { x: 700, y: 436 })).toBe(second);
		// On the overlapping columns the vertical position decides.
		expect(nearestLine([first, second], { x: 725, y: 405 })).toBe(first);
		expect(nearestLine([first, second], { x: 725, y: 440 })).toBe(second);
		// Outside every line: the closest one.
		expect(nearestLine([first, second], { x: 300, y: 436 })).toBe(second);
		expect(nearestLine([first, second], { x: 900, y: 380 })).toBe(first);
		expect(nearestLine([new DOMRect(0, 0, 0, 0)], { x: 0, y: 0 })).toBeNull();
		expect(nearestLine([], { x: 0, y: 0 })).toBeNull();
	});

	test('size writes the available space and the reference size snapped to device pixels', () => {
		setDevicePixelRatio(2);
		const wrapper = document.createElement('div');
		const size = panelMiddleware()[2] as unknown as {
			options: { apply: (state: unknown) => void };
		};
		size.options.apply({
			elements: { floating: wrapper },
			rects: { reference: { width: 87.3, height: 31.6 } },
			availableWidth: 640,
			availableHeight: -12
		});
		expect(wrapper.style.getPropertyValue('--available-width')).toBe('640px');
		expect(wrapper.style.getPropertyValue('--available-height')).toBe('0px');
		expect(wrapper.style.getPropertyValue('--anchor-width')).toBe('87.5px');
		expect(wrapper.style.getPropertyValue('--anchor-height')).toBe('31.5px');
	});
});

describe('logical sides', () => {
	test.each([
		['inline-start', 'ltr', 'left'],
		['inline-end', 'ltr', 'right'],
		['inline-start', 'rtl', 'right'],
		['inline-end', 'rtl', 'left'],
		['inline-end-start', 'ltr', 'right-start'],
		['inline-start-end', 'rtl', 'right-end'],
		['bottom-start', 'rtl', 'bottom-start']
	] as const)('%s in %s resolves to %s', (requested, direction, resolved) => {
		expect(resolvePlacement(requested, direction)).toBe(resolved);
	});

	test.each([
		['right-start', 'inline-end', 'ltr', 'inline-end'],
		['left-start', 'inline-end', 'ltr', 'inline-start'],
		['left', 'inline-end', 'rtl', 'inline-end'],
		['right', 'inline-end', 'rtl', 'inline-start'],
		['bottom-start', 'inline-end-start', 'ltr', 'bottom'],
		['left', 'left', 'rtl', 'left']
	] as const)(
		'a panel placed %s for %s in %s reports %s',
		(resolved, requested, direction, side) => {
			expect(reportedSide(resolved, requested, direction)).toBe(side);
		}
	);
});

describe('transform origin and directed motion', () => {
	test.each([
		['top', 'ltr', 'center bottom', 'y', 10],
		['top-start', 'ltr', 'left bottom', 'y', 10],
		['top-end', 'ltr', 'right bottom', 'y', 10],
		['bottom', 'ltr', 'center top', 'y', -10],
		['bottom-start', 'ltr', 'left top', 'y', -10],
		['bottom-end', 'ltr', 'right top', 'y', -10],
		['left', 'ltr', 'right center', 'x', 10],
		['left-start', 'ltr', 'right top', 'x', 10],
		['left-end', 'ltr', 'right bottom', 'x', 10],
		['right', 'ltr', 'left center', 'x', -10],
		['right-start', 'ltr', 'left top', 'x', -10],
		['right-end', 'ltr', 'left bottom', 'x', -10],
		// floating-ui lines a vertical `-start` panel up with the reference's right edge in RTL.
		['top-start', 'rtl', 'right bottom', 'y', 10],
		['bottom-end', 'rtl', 'left top', 'y', -10],
		['right-start', 'rtl', 'left top', 'x', -10]
	] as const)(
		'%s in %s scales from %s and travels %s by %d',
		(placement, direction, origin, axis, distance) => {
			expect(transformOriginFor(placement, direction)).toBe(origin);
			expect(directedMotion(placement, direction)).toEqual({
				transformOrigin: origin,
				axis,
				distance
			});
		}
	);

	test('a directed offset on one axis gives the other its undirected value back', () => {
		const params: { x?: number; y?: number; scale: number } = { x: 0, y: 0, scale: 0.98 };
		applyDirectedOffset(params, { axis: 'y', distance: -10 });
		expect(params).toEqual({ x: 0, y: -10, scale: 0.98 });
		applyDirectedOffset(params, { axis: 'x', distance: 10 });
		expect(params).toEqual({ x: 10, y: 0, scale: 0.98 });
	});
});

describe('panel styles', () => {
	test('a written position puts the wrapper at fixed, pixel-snapped coordinates and reveals it', () => {
		const panel = document.createElement('div');
		panel.style.visibility = 'hidden';
		writePanelPosition(panel, 12.4, 40.6);
		expect(panel.style.position).toBe('fixed');
		expect(panel.style.left).toBe('12px');
		expect(panel.style.top).toBe('41px');
		expect(panel.style.visibility).toBe('');
		setDevicePixelRatio(2);
		writePanelPosition(panel, 12.4, 40.6);
		expect(panel.style.left).toBe('12.5px');
		expect(panel.style.top).toBe('40.5px');
	});

	test("a written position resets the <dialog>'s inline-end inset, which beats left in RTL", () => {
		const panel = document.createElement('div');
		panel.style.right = '0px';
		writePanelPosition(panel, 1, 2);
		expect(panel.style.right).toBe('auto');
		expect(panel.style.bottom).toBe('auto');
	});

	test('a position written for a hidden anchor keeps the wrapper hidden', () => {
		const panel = document.createElement('div');
		writePanelPosition(panel, 1, 2, 'fixed', { anchorHidden: true });
		expect(panel.style.visibility).toBe('hidden');
	});

	test('a released wrapper drops its coordinates and CSS variables, and its visibility only when asked', () => {
		const panel = document.createElement('div');
		writePanelPosition(panel, 1, 2);
		panel.style.setProperty('--available-height', '300px');
		panel.style.setProperty('--transform-origin', 'left top');
		panel.style.visibility = 'hidden';
		releasePanelPosition(panel, false);
		expect(panel.style.position).toBe('');
		expect(panel.style.left).toBe('');
		expect(panel.style.top).toBe('');
		expect(panel.style.right).toBe('');
		expect(panel.style.getPropertyValue('--available-height')).toBe('');
		expect(panel.style.getPropertyValue('--transform-origin')).toBe('');
		expect(panel.style.visibility).toBe('hidden');
		releasePanelPosition(panel, true);
		expect(panel.style.visibility).toBe('');
	});

	test('snapping rounds to the nearest device pixel', () => {
		expect(snapToDevicePixel(87.5, 1)).toBe(88);
		expect(snapToDevicePixel(87.3, 2)).toBe(87.5);
		expect(snapToDevicePixel(10.2, 3)).toBeCloseTo(10.333, 3);
		expect(snapToDevicePixel(5.4, 0)).toBe(5);
	});
});

describe('panel positioner: place', () => {
	test('a panel the document lays out only clears its minimum width', async () => {
		const { panel, positioner, setMinWidth, onPlace } = setup({ floating: () => false });
		await positioner.place(panel, true);
		expect(setMinWidth).toHaveBeenCalledExactlyOnceWith(null);
		expect(computePosition).not.toHaveBeenCalled();
		expect(onPlace).not.toHaveBeenCalled();
		expect(panel.style.left).toBe('');
	});

	test('a panel with no reference only clears its minimum width', async () => {
		const { panel, positioner, setMinWidth } = setup({ reference: () => null });
		await positioner.place(panel, true);
		expect(setMinWidth).toHaveBeenCalledExactlyOnceWith(null);
		expect(computePosition).not.toHaveBeenCalled();
	});

	test('before the opening transition ends, only the mount placement runs', async () => {
		const { panel, positioner, onPlace } = setup({ settled: () => false });
		await positioner.place(panel);
		expect(computePosition).not.toHaveBeenCalled();
		expect(onPlace).not.toHaveBeenCalled();
		await positioner.place(panel, true);
		expect(computePosition).toHaveBeenCalledOnce();
		expect(onPlace).toHaveBeenCalledExactlyOnceWith(placed(panel, 'bottom-start', { mount: true }));
	});

	test('floating-ui places the panel with the preferred placement and offset, fixed', async () => {
		const { reference, panel, positioner, onPlace } = setup({
			placement: () => 'top-end',
			offset: () => 8
		});
		await positioner.place(panel);
		expect(computePosition).toHaveBeenCalledWith(reference, panel, expect.anything());
		const options = lastOptions();
		expect(options.strategy).toBe('fixed');
		expect(options.placement).toBe('top-end');
		expect(middlewareNames(options)).toEqual(['offset', 'flip', 'size', 'shift', 'hide']);
		expect(middlewareNamed(options, 'offset').options).toBe(8);
		expect(panel.style.position).toBe('fixed');
		expect(panel.style.left).toBe('13px');
		expect(panel.style.top).toBe('40px');
		expect(panel.style.getPropertyValue('--transform-origin')).toBe('right bottom');
		expect(onPlace).toHaveBeenCalledExactlyOnceWith(placed(panel, 'top-end'));
	});

	test('the owner hears the placement floating-ui resolved, not the one it asked for', async () => {
		floating.resolvedPlacement = 'top-start';
		const { panel, positioner, onPlace } = setup();
		await positioner.place(panel, true);
		expect(lastOptions().placement).toBe('bottom-start');
		expect(onPlace).toHaveBeenCalledWith(placed(panel, 'top-start', { mount: true }));
		expect(panel.style.getPropertyValue('--transform-origin')).toBe('left bottom');
	});

	test('a logical side asks floating-ui for the physical one and reports the logical one', async () => {
		const { panel, positioner, onPlace } = setup({
			placement: () => 'inline-end-start',
			direction: () => 'rtl'
		});
		await positioner.place(panel);
		const options = lastOptions();
		expect(options.placement).toBe('left-start');
		// floating-ui mirrors start/end alignment with the reference's direction, not the
		// portaled wrapper's.
		expect(options.platform?.isRTL(panel)).toBe(true);
		expect(onPlace).toHaveBeenCalledWith(
			placed(panel, 'left-start', { side: 'inline-end', align: 'start', direction: 'rtl' })
		);
	});

	test('collisionBoundary and fallbackAxisSide reach the middleware', async () => {
		const { panel, positioner } = setup({
			collisionBoundary: () => 'layoutViewport',
			fallbackAxisSide: () => 'end'
		});
		await positioner.place(panel);
		expect(middlewareNamed(lastOptions(), 'shift').options.rootBoundary).toBe('layoutViewport');
		expect(middlewareNamed(lastOptions(), 'flip').options.fallbackAxisSideDirection).toBe('end');
	});

	test('a reference scrolled out of view keeps the panel hidden and is reported', async () => {
		floating.referenceHidden = true;
		const { panel, positioner, onPlace } = setup();
		await positioner.place(panel);
		expect(panel.style.visibility).toBe('hidden');
		expect(onPlace).toHaveBeenCalledWith(placed(panel, 'bottom-start', { anchorHidden: true }));

		floating.referenceHidden = false;
		await positioner.place(panel);
		expect(panel.style.visibility).toBe('');
		expect(onPlace).toHaveBeenLastCalledWith(placed(panel, 'bottom-start'));
	});

	test.each([
		[
			'a bare virtual point',
			() => ({ getBoundingClientRect: () => new DOMRect(0, 0, 0, 0) }) as VirtualElement
		],
		[
			'an element with no size',
			() => {
				const element = document.createElement('span');
				document.body.append(element);
				mockRect(element, { width: 0, height: 0 });
				return element;
			}
		]
	])('%s never reports a hidden anchor', async (_reference, create) => {
		floating.referenceHidden = true;
		const reference = create();
		const { panel, positioner, onPlace } = setup({ reference: () => reference });
		await positioner.place(panel);
		expect(panel.style.visibility).toBe('');
		expect(onPlace.mock.calls[0][0].anchorHidden).toBe(false);
	});

	test('fitTrigger hands over the snapped reference width before floating-ui measures the panel', async () => {
		const { panel, positioner, setMinWidth } = setup({ fitTrigger: () => true });
		await positioner.place(panel);
		expect(setMinWidth).toHaveBeenCalledExactlyOnceWith(88);
		expect(setMinWidth.mock.invocationCallOrder[0]).toBeLessThan(
			computePosition.mock.invocationCallOrder[0]
		);
		expect(panel.style.getPropertyValue('--anchor-width')).toBe('88px');
		expect(panel.style.getPropertyValue('--anchor-height')).toBe('32px');
	});

	test('fitTrigger keeps a half-pixel width on a 2x screen', async () => {
		setDevicePixelRatio(2);
		const { panel, positioner, setMinWidth } = setup({ fitTrigger: () => true });
		await positioner.place(panel);
		expect(setMinWidth).toHaveBeenCalledExactlyOnceWith(87.5);
	});

	test('positionPanel places the panel synchronously and floating-ui never runs', async () => {
		const positionPanel = vi.fn(() => ({ x: 5, y: 6, minWidth: 120 }));
		const { reference, panel, positioner, setMinWidth, onPlace } = setup({
			fitTrigger: () => true,
			positionPanel: () => positionPanel
		});
		panel.style.visibility = 'hidden';
		const placing = positioner.place(panel, true);
		// Everything is written before the first await.
		expect(positionPanel).toHaveBeenCalledExactlyOnceWith({ panel, reference });
		expect(panel.style.left).toBe('5px');
		expect(panel.style.top).toBe('6px');
		expect(panel.style.position).toBe('fixed');
		expect(panel.style.visibility).toBe('');
		// Its minWidth replaces fitTrigger's.
		expect(setMinWidth.mock.calls).toEqual([[88], [120]]);
		expect(onPlace).toHaveBeenCalledExactlyOnceWith({
			panel,
			placement: null,
			side: 'none',
			align: null,
			anchorHidden: false,
			direction: 'ltr',
			mount: true
		});
		await placing;
		expect(computePosition).not.toHaveBeenCalled();
	});

	test('a panel that unmounts while floating-ui measures it is neither written nor reported', async () => {
		const { panel, positioner, onPlace } = setup();
		const placing = positioner.place(panel);
		panel.remove();
		await placing;
		expect(computePosition).toHaveBeenCalledOnce();
		expect(onPlace).not.toHaveBeenCalled();
		expect(panel.style.left).toBe('');
	});

	test('positionPanel returning null falls back to floating-ui', async () => {
		const { panel, positioner, onPlace } = setup({ positionPanel: () => () => null });
		await positioner.place(panel);
		expect(computePosition).toHaveBeenCalledOnce();
		expect(onPlace).toHaveBeenCalledWith(placed(panel, 'bottom-start'));
	});

	test('anchoring to a line places against the line holding the point, or lets inline() pick', async () => {
		let point: { x: number; y: number } | null = { x: 30, y: 44 };
		const { reference, panel, positioner } = setup({
			anchorTo: () => 'line',
			anchorPoint: () => point
		});
		// Two lines that overlap horizontally, which inline() alone resolves to a single box.
		reference.getClientRects = () =>
			[new DOMRect(20, 30, 100, 20), new DOMRect(10, 50, 80, 20)] as unknown as DOMRectList;
		await positioner.place(panel);
		expect(middlewareNames(lastOptions())).not.toContain('inline');
		expect(lastReferenceRect()).toMatchObject({ x: 20, y: 30 });
		point = { x: 30, y: 60 };
		await positioner.place(panel);
		expect(lastReferenceRect()).toMatchObject({ x: 10, y: 50 });
		point = null;
		await positioner.place(panel);
		expect(middlewareNamed(lastOptions(), 'inline').options).toEqual({});
		expect(computePosition.mock.calls.at(-1)![0]).toBe(reference);
	});

	test('a reference without client rects anchors to its box even with anchorTo line', async () => {
		const point: VirtualElement = { getBoundingClientRect: () => new DOMRect(300, 200, 0, 0) };
		const { panel, positioner } = setup({
			reference: () => point as PopoverReference,
			anchorTo: () => 'line'
		});
		await positioner.place(panel);
		expect(middlewareNames(lastOptions())).not.toContain('inline');
	});
});

describe('panel positioner: track', () => {
	test('hides the panel until placed, then re-places it on each observed change', async () => {
		let settled = false;
		const { reference, panel, positioner, onPlace } = setup({ settled: () => settled });
		positioner.track(panel, reference, vi.fn());
		expect(panel.style.visibility).toBe('hidden');
		expect(autoUpdate).toHaveBeenCalledWith(reference, panel, expect.any(Function));
		// The mount placement runs; autoUpdate's first update waits for the transition.
		expect(computePosition).toHaveBeenCalledOnce();
		await waitFor(() => expect(panel.style.visibility).toBe(''));
		expect(onPlace).toHaveBeenLastCalledWith(placed(panel, 'bottom-start', { mount: true }));

		settled = true;
		observedUpdate()();
		expect(computePosition).toHaveBeenCalledTimes(2);
		await waitFor(() => expect(onPlace).toHaveBeenCalledTimes(2));
		expect(onPlace).toHaveBeenLastCalledWith(placed(panel, 'bottom-start'));
	});

	test('the panel may use the whole viewport until size measures the real space', () => {
		computePosition.mockImplementation(() => new Promise(() => {}));
		const { reference, panel, positioner } = setup();
		positioner.track(panel, reference, vi.fn());
		expect(panel.style.getPropertyValue('--available-width')).toBe('100vw');
		expect(panel.style.getPropertyValue('--available-height')).toBe('100dvh');
		expect(panel.style.getPropertyValue('--anchor-width')).toBe('88px');
	});

	test('a visual viewport change re-places the panel once it has settled', async () => {
		vi.useFakeTimers();
		const { reference, panel, positioner } = setup();
		const stop = positioner.track(panel, reference, vi.fn());
		await vi.advanceTimersByTimeAsync(0);
		const placements = computePosition.mock.calls.length;

		// An on-screen keyboard slides in: iOS reports several sizes on the way.
		viewport.set({ height: 500 });
		await vi.advanceTimersByTimeAsync(60);
		viewport.set({ height: 400 });
		await vi.advanceTimersByTimeAsync(VIEWPORT_SETTLE_MS - 1);
		expect(computePosition).toHaveBeenCalledTimes(placements);
		await vi.advanceTimersByTimeAsync(1);
		expect(computePosition).toHaveBeenCalledTimes(placements + 1);

		// A pinch-zoom pan moves the visual viewport without resizing it.
		viewport.set({ offsetTop: 120 });
		await vi.advanceTimersByTimeAsync(VIEWPORT_SETTLE_MS);
		expect(computePosition).toHaveBeenCalledTimes(placements + 2);

		// Stopped tracking: no listener and no pending placement survive.
		viewport.set({ height: 300 });
		stop();
		await vi.advanceTimersByTimeAsync(VIEWPORT_SETTLE_MS * 2);
		viewport.set({ height: 350 });
		await vi.advanceTimersByTimeAsync(VIEWPORT_SETTLE_MS * 2);
		expect(computePosition).toHaveBeenCalledTimes(placements + 2);
	});

	test('an element reference that left the document is reported instead of placed', () => {
		const onReferenceDetached = vi.fn();
		const { reference, panel, positioner } = setup();
		positioner.track(panel, reference, onReferenceDetached);
		const placements = computePosition.mock.calls.length;
		reference.remove();
		observedUpdate()();
		expect(onReferenceDetached).toHaveBeenCalledOnce();
		expect(computePosition).toHaveBeenCalledTimes(placements);
	});

	test('a virtual reference has no document presence to lose', () => {
		const onReferenceDetached = vi.fn();
		const point: VirtualElement = { getBoundingClientRect: () => new DOMRect(300, 200, 0, 0) };
		const { panel, positioner } = setup({ reference: () => point as PopoverReference });
		positioner.track(panel, point, onReferenceDetached);
		const placements = computePosition.mock.calls.length;
		observedUpdate()();
		expect(onReferenceDetached).not.toHaveBeenCalled();
		expect(computePosition).toHaveBeenCalledTimes(placements + 1);
		expect(computePosition.mock.calls.at(-1)?.[0]).toBe(point);
	});

	test("the cleanup stops floating-ui's observers", () => {
		const stop = vi.fn();
		floating.stopUpdates = stop;
		const { reference, panel, positioner } = setup();
		const cleanup = positioner.track(panel, reference, vi.fn());
		cleanup();
		expect(stop).toHaveBeenCalledOnce();
	});
});

describe('Popover placement through the positioner', () => {
	const wrapper = async () =>
		(await screen.findByRole('button', { name: 'Inside popover' })).closest('dialog')!;
	const trigger = () => screen.getByRole('button', { name: 'Open popover' });
	// The jsdom `animate` stub ends the intro on the next macrotask; the panel re-mounts its
	// placement then, so a test of later changes starts once that has happened.
	const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

	test('the wrapper takes the resolved coordinates and the panel scales from the flipped side', async () => {
		floating.resolvedPlacement = 'top-start';
		render(PopoverPositionHarness, { props: { position: 'bottom-start' } });
		const dialog = await wrapper();
		await waitFor(() => expect(dialog.style.visibility).toBe(''));
		expect(dialog.style.left).toBe('13px');
		expect(dialog.style.top).toBe('40px');
		expect(lastOptions().placement).toBe('bottom-start');
		const panel = dialog.firstElementChild as HTMLElement;
		await waitFor(() => expect(panel.style.transformOrigin).toBe('left bottom'));
	});

	test('an open popover is placed again when its position or offset changes', async () => {
		const { component } = render(PopoverPositionHarness, { props: { position: 'bottom-start' } });
		await wrapper();
		await settle();
		expect(lastOptions().placement).toBe('bottom-start');

		// No observer fires here (the mocked autoUpdate runs once): only the panel attachment,
		// which read these inputs while placing, can place it again.
		component.update({ position: 'right' });
		await waitFor(() => expect(lastOptions().placement).toBe('right'));

		component.update({ offset: 12 });
		await waitFor(() => expect(middlewareNamed(lastOptions(), 'offset').options).toBe(12));
	});

	test('a directed transition is opted out of with directedTransition={false}', async () => {
		floating.resolvedPlacement = 'top-start';
		render(PopoverPositionHarness, {
			props: { position: 'bottom-start', directedTransition: false }
		});
		const dialog = await wrapper();
		await waitFor(() => expect(dialog.style.visibility).toBe(''));
		await settle();
		expect(lastOptions().placement).toBe('bottom-start');
		const panel = dialog.firstElementChild as HTMLElement;
		expect(panel.style.transformOrigin).toBe('center center');
	});

	test('the transform origin follows every placement, a flip while open included', async () => {
		const { component } = render(PopoverPositionHarness, { props: { position: 'bottom-start' } });
		const dialog = await wrapper();
		const panel = dialog.firstElementChild as HTMLElement;
		await waitFor(() => expect(panel.style.transformOrigin).toBe('left top'));
		await settle();
		const placements = computePosition.mock.calls.length;

		// An observed change (scroll, resize) that flips the open panel.
		floating.resolvedPlacement = 'right-end';
		observedUpdate()();
		await waitFor(() => expect(computePosition).toHaveBeenCalledTimes(placements + 1));
		await waitFor(() => expect(panel.style.transformOrigin).toBe('left bottom'));
		expect(dialog.style.getPropertyValue('--transform-origin')).toBe('left bottom');

		// A new preferred placement re-runs the mount placement of a panel that already opened.
		floating.resolvedPlacement = null;
		component.update({ position: 'top-end' });
		await waitFor(() => expect(lastOptions().placement).toBe('top-end'));
		await waitFor(() => expect(panel.style.transformOrigin).toBe('right bottom'));
	});

	test('changes during the opening transition are placed once it ends', async () => {
		render(PopoverPositionHarness, { props: { position: 'bottom-start' } });
		await screen.findByText('Inside popover');
		// The mount placement ran; the observer's own first update waited for the transition.
		expect(computePosition).toHaveBeenCalledOnce();
		// Content resizing while the panel opens: skipped for now.
		observedUpdate()();
		expect(computePosition).toHaveBeenCalledOnce();
		await waitFor(() => expect(computePosition).toHaveBeenCalledTimes(2));
	});

	test('the panel carries data-side and data-align, and the trigger data-popup-side', async () => {
		floating.resolvedPlacement = 'top-end';
		const { component } = render(PopoverPositionHarness, { props: { position: 'bottom-end' } });
		const panel = (await wrapper()).firstElementChild as HTMLElement;
		await waitFor(() => expect(panel).toHaveAttribute('data-side', 'top'));
		expect(panel).toHaveAttribute('data-align', 'end');
		expect(panel).not.toHaveAttribute('data-anchor-hidden');
		expect(trigger()).toHaveAttribute('data-popup-side', 'top');

		component.update({ open: false });
		await waitFor(() => expect(trigger()).not.toHaveAttribute('data-popup-side'));
	});

	test('a logical side is reported as requested, mirrored in a right-to-left document', async () => {
		render(PopoverPositionHarness, { props: { position: 'inline-end', dir: 'rtl' } });
		const panel = (await wrapper()).firstElementChild as HTMLElement;
		expect(lastOptions().placement).toBe('left');
		await waitFor(() => expect(panel).toHaveAttribute('data-side', 'inline-end'));
		expect(panel).toHaveAttribute('data-align', 'center');
		expect(trigger()).toHaveAttribute('data-popup-side', 'inline-end');
		expect(panel.style.transformOrigin).toBe('right center');
	});

	test('an anchor scrolled out of view marks the panel data-anchor-hidden', async () => {
		render(PopoverPositionHarness);
		const dialog = await wrapper();
		mockRect(trigger(), { x: 10, y: -80, width: 87.5, height: 32 });
		await settle();
		floating.referenceHidden = true;
		observedUpdate()();
		const panel = dialog.firstElementChild as HTMLElement;
		await waitFor(() => expect(panel).toHaveAttribute('data-anchor-hidden', ''));
		expect(dialog.style.visibility).toBe('hidden');

		floating.referenceHidden = false;
		observedUpdate()();
		await waitFor(() => expect(panel).not.toHaveAttribute('data-anchor-hidden'));
		expect(dialog.style.visibility).toBe('');
	});

	test('initial focus waits until the panel is placed, then lands on the first control', async () => {
		const pending: Array<() => void> = [];
		computePosition.mockImplementation(
			(reference: unknown, panel: unknown, options?: unknown) =>
				new Promise((resolve) => {
					pending.push(() => resolve(defaultCompute(reference, panel, options)));
				})
		);
		render(PopoverPositionHarness, { props: { focusOnOpen: 'first' } });
		const inside = await screen.findByText('Inside popover');
		await settle();
		expect(document.activeElement).not.toBe(inside);
		expect(inside.closest('dialog')).not.toContainElement(document.activeElement as HTMLElement);

		pending.splice(0).forEach((land) => land());
		await waitFor(() => expect(document.activeElement).toBe(inside));
	});

	test('anchorTo line anchors to the point the pointer was at when the popover opened', async () => {
		const { component } = render(PopoverPositionHarness, {
			props: { open: false, anchorTo: 'line' }
		});
		mockRect(trigger(), { x: 10, y: 40, width: 300, height: 40 });
		wrapLines(trigger());
		await fireEvent.pointerEnter(trigger(), { clientX: 30, clientY: 44 });
		await fireEvent.pointerMove(trigger(), { clientX: 32, clientY: 46 });
		component.update({ open: true });
		await wrapper();
		expect(lastReferenceRect()).toMatchObject({ y: 40, width: 300 });

		// Moving to the other line while open doesn't re-anchor.
		await settle();
		await fireEvent.pointerMove(trigger(), { clientX: 200, clientY: 64 });
		observedUpdate()();
		await waitFor(() => expect(computePosition.mock.calls.length).toBeGreaterThan(1));
		expect(lastReferenceRect()).toMatchObject({ y: 40, width: 300 });

		// Reopening does.
		component.update({ open: false });
		await waitFor(() => expect(screen.queryByText('Inside popover')).toBeNull());
		await fireEvent.pointerMove(trigger(), { clientX: 100, clientY: 64 });
		component.update({ open: true });
		await wrapper();
		expect(lastReferenceRect()).toMatchObject({ y: 60, width: 150 });
	});

	test('anchorTo line keeps its line when the reference scrolls while the popover is open', async () => {
		const { component } = render(PopoverPositionHarness, {
			props: { open: false, anchorTo: 'line' }
		});
		mockRect(trigger(), { x: 100, y: 200, width: 120, height: 40 });
		wrapLines(trigger());
		await fireEvent.pointerMove(trigger(), { clientX: 130, clientY: 210 });
		component.update({ open: true });
		await wrapper();
		expect(lastReferenceRect()).toMatchObject({ y: 200, width: 120 });

		// The page scrolls by 30px: the point scrolls with the reference.
		await settle();
		mockRect(trigger(), { x: 100, y: 170, width: 120, height: 40 });
		observedUpdate()();
		await waitFor(() => expect(lastReferenceRect()).toMatchObject({ y: 170, width: 120 }));
	});

	test('anchorTo line keeps the point of a tap, whose pointer leaves before the click opens', async () => {
		const { component } = render(PopoverPositionHarness, {
			props: { open: false, anchorTo: 'line' }
		});
		mockRect(trigger(), { x: 10, y: 40, width: 300, height: 40 });
		wrapLines(trigger());
		await fireEvent.pointerDown(trigger(), { pointerType: 'touch', clientX: 30, clientY: 44 });
		await fireEvent.pointerUp(trigger(), { pointerType: 'touch', clientX: 30, clientY: 44 });
		await fireEvent.pointerLeave(trigger(), { pointerType: 'touch', clientX: 30, clientY: 44 });
		component.update({ open: true });
		await wrapper();
		expect(lastReferenceRect()).toMatchObject({ y: 40, width: 300 });
	});

	test('anchorTo line forgets the point after the popover closes and on a keyboard open', async () => {
		const { component } = render(PopoverPositionHarness, {
			props: { open: false, anchorTo: 'line' }
		});
		mockRect(trigger(), { x: 10, y: 40, width: 300, height: 40 });
		wrapLines(trigger());
		await fireEvent.pointerMove(trigger(), { clientX: 30, clientY: 44 });
		component.update({ open: true });
		await wrapper();
		expect(lastReferenceRect()).toMatchObject({ y: 40, width: 300 });

		// The pointer never left (a hover open); the popover closes and opens again from the keyboard.
		await settle();
		component.update({ open: false });
		await waitFor(() => expect(screen.queryByText('Inside popover')).toBeNull());
		component.update({ open: true });
		await wrapper();
		expect(middlewareNamed(lastOptions(), 'inline').options).toEqual({});

		// A point captured while closed is dropped by a key press on the trigger.
		await settle();
		component.update({ open: false });
		await waitFor(() => expect(screen.queryByText('Inside popover')).toBeNull());
		await fireEvent.pointerMove(trigger(), { clientX: 90, clientY: 91 });
		await fireEvent.keyDown(trigger(), { key: 'Enter' });
		component.update({ open: true });
		await wrapper();
		expect(middlewareNamed(lastOptions(), 'inline').options).toEqual({});
	});

	test('popups sharing a trigger keep its data-popup-side until the last one lets go', () => {
		const anchor = document.createElement('button');
		const first = {};
		const second = {};
		claimPopupSide(anchor, first, 'top');
		claimPopupSide(anchor, second, 'bottom');
		expect(anchor).toHaveAttribute('data-popup-side', 'bottom');

		// The first closes while the second stays open.
		claimPopupSide(anchor, first, null);
		expect(anchor).toHaveAttribute('data-popup-side', 'bottom');

		// Same side from both: one closing doesn't strip the other's hook.
		claimPopupSide(anchor, first, 'bottom');
		claimPopupSide(anchor, first, null);
		expect(anchor).toHaveAttribute('data-popup-side', 'bottom');

		claimPopupSide(anchor, second, null);
		expect(anchor).not.toHaveAttribute('data-popup-side');
	});

	// The safe area measures the trigger and the panel; a panel moved by its wrapper's
	// coordinates changes neither element's own attributes or size, so its observers stay quiet
	// and only the placement can measure it again. It closes only a popover hovering opened.
	test.each([
		['floating-ui', undefined],
		['positionPanel', () => ({ x: 400, y: 300 })]
	] as const)(
		'a panel re-placed by %s moves the hover safe area with it',
		async (_placer, positionPanel) => {
			const onOpenChange = vi.fn();
			render(PopoverPositionHarness, {
				props: { closeOnMouseLeave: true, positionPanel, onOpenChange, openedByHover: true }
			});
			await fireEvent.mouseEnter(screen.getByRole('button', { name: 'Open popover' }));
			const panel = (await wrapper()).firstElementChild as HTMLElement;
			mockRect(trigger(), {
				x: 10,
				y: 20,
				width: 87.5,
				height: 32
			});
			await settle();
			const pointerAt = async (clientX: number, clientY: number) => {
				document.body.dispatchEvent(
					new PointerEvent('pointermove', { bubbles: true, clientX, clientY })
				);
				// Past the safe area's close delay.
				await new Promise((resolve) => setTimeout(resolve, 200));
			};

			mockRect(panel, { x: 400, y: 300, width: 160, height: 120 });
			observedUpdate()();
			await settle();
			await pointerAt(480, 360);
			expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
				true,
				expect.objectContaining({ reason: 'trigger-hover' })
			);

			// The safe area is live: leaving it closes the popover.
			await pointerAt(900, 700);
			expect(onOpenChange).toHaveBeenCalledTimes(2);
			expect(onOpenChange).toHaveBeenLastCalledWith(
				false,
				expect.objectContaining({
					reason: 'trigger-hover',
					interaction: 'mouse',
					event: expect.any(PointerEvent)
				})
			);
		}
	);

	test('fitTrigger gives the panel the trigger width as its minimum', async () => {
		render(PopoverPositionHarness, { props: { fitTrigger: true } });
		const panel = (await wrapper()).firstElementChild as HTMLElement;
		await settle();
		// The trigger had no layout box when the panel mounted; the next observed change
		// measures it again.
		expect(panel.style.minWidth).toBe('0px');
		mockRect(trigger(), { width: 87.5, height: 32 });
		observedUpdate()();
		await waitFor(() => expect(panel.style.minWidth).toBe('88px'));
		expect(panel.style.width).toBe('max-content');
	});

	test('positionPanel reports side none on the panel and the trigger', async () => {
		render(PopoverPositionHarness, { props: { positionPanel: () => ({ x: 4, y: 8 }) } });
		const panel = (await wrapper()).firstElementChild as HTMLElement;
		await waitFor(() => expect(panel).toHaveAttribute('data-side', 'none'));
		expect(panel).not.toHaveAttribute('data-align');
		expect(trigger()).toHaveAttribute('data-popup-side', 'none');
	});
});
