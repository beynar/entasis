// Floating placement in `popover.position.ts`, alone and through PopoverState. These tests pin the
// middleware chain, when a placement runs, what it writes on the wrapper, the order of the
// minimum-width writes, the autoUpdate wiring, and what PopoverState does with each placement
// (the directed-transition origin and the hover safe area). jsdom has no
// layout, so floating-ui's `computePosition` and `autoUpdate` are replaced by controllable
// mocks; real placement and flipping are covered in `popover.position.browser.test.ts`.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { Placement, VirtualElement } from '@floating-ui/dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mockRect } from '$lib/testing/jsdom.test-helper.js';
import {
	createPanelPositioner,
	directedMotion,
	panelMiddleware,
	releasePanelPosition,
	writePanelPosition,
	type PanelPositionerOptions,
	type PopoverReference
} from './popover.position.js';
import PopoverPositionHarness from './PopoverPositionHarness.test.svelte';

type PositionOptions = { placement: Placement; strategy: string; middleware: unknown[] };

const floating = vi.hoisted(() => ({
	/** The placement floating-ui "resolves" to, standing in for a flip; `null` keeps the request. */
	resolvedPlacement: null as string | null,
	stopUpdates: () => {}
}));
const { computePosition, autoUpdate } = vi.hoisted(() => ({
	computePosition: vi.fn(async (_reference: unknown, _floating: unknown, options?: unknown) => ({
		x: 12.5,
		y: 40,
		strategy: 'fixed' as const,
		placement: floating.resolvedPlacement ?? (options as PositionOptions).placement,
		middlewareData: {}
	})),
	// Like floating-ui's own, the mock runs `update` once before returning the cleanup.
	autoUpdate: vi.fn((_reference: unknown, _floating: unknown, update: () => void) => {
		update();
		return floating.stopUpdates;
	})
}));
vi.mock('@floating-ui/dom', async (importOriginal) => ({
	...(await importOriginal<typeof import('@floating-ui/dom')>()),
	computePosition,
	autoUpdate
}));

const lastOptions = () => computePosition.mock.calls.at(-1)?.[2] as PositionOptions;
const observedUpdate = () => autoUpdate.mock.calls.at(-1)![2];

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

beforeEach(() => {
	floating.resolvedPlacement = null;
	floating.stopUpdates = () => {};
	document.body.replaceChildren();
});

describe('panel middleware', () => {
	test('offset, flip, shift and hide run in that order, keeping 20px from the viewport edges', () => {
		const middleware = panelMiddleware(8);
		expect(middleware.map(({ name }) => name)).toEqual(['offset', 'flip', 'shift', 'hide']);
		expect(middleware[0].options).toBe(8);
		expect(middleware[1].options).toEqual({ mainAxis: true, crossAxis: true, padding: 20 });
		expect(middleware[2].options).toEqual({ mainAxis: true, crossAxis: true, padding: 20 });
	});

	test('an unset offset keeps a 4px gap, and an explicit 0 stays 0', () => {
		expect(panelMiddleware(undefined)[0].options).toBe(4);
		expect(panelMiddleware(0)[0].options).toBe(0);
	});
});

describe('directed motion', () => {
	// The current origins, including the left/right ones CX-5 corrects: the alignment is read on
	// the x axis for every side, and `start` is always the left edge.
	test.each([
		['top', 'center bottom', 'y', 10],
		['top-start', 'left bottom', 'y', 10],
		['top-end', 'right bottom', 'y', 10],
		['bottom', 'center top', 'y', -10],
		['bottom-start', 'left top', 'y', -10],
		['bottom-end', 'right top', 'y', -10],
		['left', 'center center', 'x', 10],
		['left-start', 'left center', 'x', 10],
		['left-end', 'right center', 'x', 10],
		['right', 'center center', 'x', -10],
		['right-start', 'left center', 'x', -10],
		['right-end', 'right center', 'x', -10]
	] as const)('%s scales from %s and travels %s by %d', (placement, origin, axis, distance) => {
		expect(directedMotion(placement)).toEqual({ transformOrigin: origin, axis, distance });
	});
});

describe('panel styles', () => {
	test('a written position puts the wrapper at fixed viewport coordinates and reveals it', () => {
		const panel = document.createElement('div');
		panel.style.visibility = 'hidden';
		writePanelPosition(panel, 12.5, 40);
		expect(panel.style.position).toBe('fixed');
		expect(panel.style.left).toBe('12.5px');
		expect(panel.style.top).toBe('40px');
		expect(panel.style.visibility).toBe('');
	});

	test('a released wrapper drops its coordinates, and its visibility only when asked', () => {
		const panel = document.createElement('div');
		writePanelPosition(panel, 1, 2);
		panel.style.visibility = 'hidden';
		releasePanelPosition(panel, false);
		expect(panel.style.position).toBe('');
		expect(panel.style.left).toBe('');
		expect(panel.style.top).toBe('');
		expect(panel.style.visibility).toBe('hidden');
		releasePanelPosition(panel, true);
		expect(panel.style.visibility).toBe('');
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
		expect(onPlace).toHaveBeenCalledExactlyOnceWith({
			panel,
			placement: 'bottom-start',
			mount: true
		});
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
		expect(panelMiddlewareNames(options)).toEqual(['offset', 'flip', 'shift', 'hide']);
		expect((options.middleware[0] as { options: number }).options).toBe(8);
		expect(panel.style.position).toBe('fixed');
		expect(panel.style.left).toBe('12.5px');
		expect(panel.style.top).toBe('40px');
		expect(onPlace).toHaveBeenCalledExactlyOnceWith({ panel, placement: 'top-end', mount: false });
	});

	test('the owner hears the placement floating-ui resolved, not the one it asked for', async () => {
		floating.resolvedPlacement = 'top-start';
		const { panel, positioner, onPlace } = setup();
		await positioner.place(panel, true);
		expect(lastOptions().placement).toBe('bottom-start');
		expect(onPlace).toHaveBeenCalledWith({ panel, placement: 'top-start', mount: true });
	});

	test('fitTrigger hands over the reference width before floating-ui measures the panel', async () => {
		const { panel, positioner, setMinWidth } = setup({ fitTrigger: () => true });
		await positioner.place(panel);
		expect(setMinWidth).toHaveBeenCalledExactlyOnceWith(87.5);
		expect(setMinWidth.mock.invocationCallOrder[0]).toBeLessThan(
			computePosition.mock.invocationCallOrder[0]
		);
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
		expect(setMinWidth.mock.calls).toEqual([[87.5], [120]]);
		expect(onPlace).toHaveBeenCalledExactlyOnceWith({ panel, placement: null, mount: true });
		await placing;
		expect(computePosition).not.toHaveBeenCalled();
	});

	test('positionPanel returning null falls back to floating-ui', async () => {
		const { panel, positioner, onPlace } = setup({ positionPanel: () => () => null });
		await positioner.place(panel);
		expect(computePosition).toHaveBeenCalledOnce();
		expect(onPlace).toHaveBeenCalledWith({ panel, placement: 'bottom-start', mount: false });
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
		expect(onPlace).toHaveBeenLastCalledWith({ panel, placement: 'bottom-start', mount: true });

		settled = true;
		observedUpdate()();
		expect(computePosition).toHaveBeenCalledTimes(2);
		await waitFor(() => expect(onPlace).toHaveBeenCalledTimes(2));
		expect(onPlace).toHaveBeenLastCalledWith({ panel, placement: 'bottom-start', mount: false });
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

	test("the cleanup is floating-ui's own, which stops its observers", () => {
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
	// The jsdom `animate` stub ends the intro on the next macrotask; the panel re-mounts its
	// placement then, so a test of later changes starts once that has happened.
	const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

	test('the wrapper takes the resolved coordinates and the panel scales from the flipped side', async () => {
		floating.resolvedPlacement = 'top-start';
		render(PopoverPositionHarness, { props: { position: 'bottom-start' } });
		const dialog = await wrapper();
		await waitFor(() => expect(dialog.style.visibility).toBe(''));
		expect(dialog.style.left).toBe('12.5px');
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
		await waitFor(() =>
			expect((lastOptions().middleware[0] as { options: number }).options).toBe(12)
		);
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

	test('the transform origin is set as the panel opens and kept by later placements', async () => {
		const { component } = render(PopoverPositionHarness, { props: { position: 'bottom-start' } });
		const panel = (await wrapper()).firstElementChild as HTMLElement;
		await waitFor(() => expect(panel.style.transformOrigin).toBe('left top'));
		await settle();
		const placements = computePosition.mock.calls.length;

		// An observed change (scroll, resize) that flips the open panel.
		floating.resolvedPlacement = 'right-end';
		observedUpdate()();
		await waitFor(() => expect(computePosition).toHaveBeenCalledTimes(placements + 1));
		await settle();
		expect(panel.style.transformOrigin).toBe('left top');

		// A new preferred placement re-runs the mount placement of a panel that already opened.
		floating.resolvedPlacement = null;
		component.update({ position: 'top-end' });
		await waitFor(() => expect(lastOptions().placement).toBe('top-end'));
		await settle();
		expect(panel.style.transformOrigin).toBe('left top');
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
			mockRect(screen.getByRole('button', { name: 'Open popover' }), {
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
		mockRect(screen.getByRole('button', { name: 'Open popover' }), { width: 87.5, height: 32 });
		observedUpdate()();
		await waitFor(() => expect(panel.style.minWidth).toBe('87.5px'));
		expect(panel.style.width).toBe('max-content');
	});
});

function panelMiddlewareNames(options: PositionOptions) {
	return options.middleware.map((middleware) => (middleware as { name: string }).name);
}
