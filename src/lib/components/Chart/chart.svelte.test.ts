import '@testing-library/jest-dom/vitest';
import { createChartAdapter } from '@tanstack/charts/adapter';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Chart from './Chart.svelte';
import { createChartOptions } from './chart.adapter.js';
import type { ChartProps } from './chart.props.js';

type ChartConfiguration<TRow extends object> = Pick<
	ChartProps<TRow>,
	'marks' | 'x' | 'y' | 'guides' | 'clip' | 'frame' | 'margin' | 'palette' | 'tooltip'
>;

type Revenue = {
	month: string;
	actual: number;
};

const data: readonly Revenue[] = [
	{ month: 'January', actual: 12 },
	{ month: 'February', actual: 18 }
];

type GroupedRevenue = Revenue & {
	product: string;
};

const groupedData: readonly GroupedRevenue[] = [
	{ month: 'January', product: 'Platform', actual: 12 },
	{ month: 'January', product: 'Services', actual: 8 },
	{ month: 'February', product: 'Platform', actual: 18 },
	{ month: 'February', product: 'Services', actual: 11 }
];

const groupedDefinition = {
	x: { scale: { type: 'point' }, axis: { label: 'Month' } },
	y: { scale: { type: 'linear' }, axis: { label: 'Revenue' } },
	marks: [
		{
			type: 'series',
			x: 'month',
			y: 'actual',
			colorBy: 'product',
			points: true
		}
	],
	tooltip: true
} satisfies ChartConfiguration<GroupedRevenue>;

const definition = {
	x: { scale: { type: 'point' } },
	y: { scale: { type: 'linear' } },
	marks: [{ type: 'series', x: 'month', y: 'actual', points: true }],
	tooltip: true
} satisfies ChartConfiguration<Revenue>;

const RevenueChart = Chart as Component<ChartProps<Revenue>>;
const GroupedRevenueChart = Chart as Component<ChartProps<GroupedRevenue>>;

const defaultResizeObserver = window.ResizeObserver;
let controlledResizeCallback: ResizeObserverCallback | undefined;
const controlledResizeDisconnect = vi.fn();

class ControlledResizeObserver {
	constructor(callback: ResizeObserverCallback) {
		controlledResizeCallback = callback;
	}
	observe() {}
	unobserve() {}
	disconnect() {
		controlledResizeDisconnect();
	}
}

afterEach(() => {
	window.ResizeObserver = defaultResizeObserver;
	controlledResizeCallback = undefined;
	controlledResizeDisconnect.mockClear();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('Chart in the browser', () => {
	test('mounts a client-only chart with the TanStack default height', async () => {
		const { container } = render(RevenueChart, {
			props: { data, ...definition, ariaLabel: 'Monthly revenue' }
		});

		await waitFor(() => expect(container.querySelector('svg')).toBeInTheDocument());

		const root = container.querySelector('[data-slot="chart"]');
		const svg = container.querySelector('svg');
		expect(root).toHaveStyle({ height: '320px' });
		expect(svg).toHaveAttribute('aria-label', 'Monthly revenue');
		expect(svg).toHaveAttribute('viewBox', '0 0 640 320');
	});

	test('updates accessible content after props are replaced', async () => {
		const { container, rerender } = render(RevenueChart, {
			props: { data, ...definition, ariaLabel: 'Monthly revenue' }
		});

		await waitFor(() => expect(container.querySelector('svg')).toBeInTheDocument());
		await rerender({
			data: [...data, { month: 'March', actual: 24 }],
			...definition,
			ariaLabel: 'Quarterly revenue',
			ariaDescription: 'Three monthly values'
		});

		await waitFor(() => {
			const svg = container.querySelector('svg');
			expect(svg).toHaveAttribute('aria-label', 'Quarterly revenue');
			expect(svg?.querySelector('desc')).toHaveTextContent('Three monthly values');
			expect(svg).toHaveTextContent('March');
		});

		const pointDefinition = {
			...definition,
			marks: [{ type: 'series', line: false, points: true, x: 'month', y: 'actual' }]
		} satisfies ChartConfiguration<Revenue>;
		await rerender({
			data,
			...pointDefinition,
			ariaLabel: 'Monthly points'
		});

		await waitFor(() => {
			expect(container.querySelector('.ts-chart__dot')).toBeInTheDocument();
			expect(container.querySelector('.ts-chart__line')).not.toBeInTheDocument();
		});
	});

	test('does not activate point focus through keyboard or clicks', async () => {
		const { container } = render(RevenueChart, {
			props: { data, ...definition, ariaLabel: 'Monthly revenue' }
		});

		const svg = await waitFor(() => {
			const renderedSvg = container.querySelector('svg');
			expect(renderedSvg).toBeInTheDocument();
			return renderedSvg as SVGElement;
		});

		svg.focus();
		await fireEvent.keyDown(svg, { key: 'ArrowRight' });

		await fireEvent.click(svg, { clientX: 25, clientY: 297 });
		expect(svg).toHaveAttribute('tabindex', '-1');
		expect(document.querySelector('.ts-chart-tooltip')).not.toBeInTheDocument();
	});

	test('opens the native tooltip from pointer input', async () => {
		const { container } = render(RevenueChart, {
			props: { data, ...definition, ariaLabel: 'Monthly revenue' }
		});
		const svg = await waitFor(() => {
			const renderedSvg = container.querySelector('svg');
			expect(renderedSvg).toBeInTheDocument();
			return renderedSvg as SVGElement;
		});
		vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 640, 320));

		await fireEvent.pointerMove(svg, { clientX: 25, clientY: 297 });

		await waitFor(() => expect(document.querySelector('[role="status"]')).toBeInTheDocument());
	});

	test('uses the native TanStack brush for viewport zoom', async () => {
		const brushData = [...data, { month: 'March', actual: 15 }];
		const { container } = render(RevenueChart, {
			props: { data: brushData, ...definition, viewport: true, ariaLabel: 'Monthly revenue' }
		});

		const brush = await waitFor(() => {
			const renderedBrush = container.querySelector('[data-chart-brush="brush-x"]');
			expect(renderedBrush).toBeInTheDocument();
			return renderedBrush as SVGElement;
		});
		expect(brush.tagName.toLowerCase()).toBe('svg');

		const endHandle = brush.querySelector('[data-chart-brush-handle="end"]') as SVGElement;
		expect(endHandle).toHaveAttribute('role', 'slider');
		await fireEvent.keyDown(endHandle, { key: 'ArrowLeft' });

		const reset = await waitFor(() => {
			const button = container.querySelector('[data-chart-viewport-reset]');
			expect(button).toBeInTheDocument();
			return button as HTMLButtonElement;
		});
		await fireEvent.click(reset);
		await waitFor(() =>
			expect(container.querySelector('[data-chart-viewport-reset]')).not.toBeInTheDocument()
		);
	});

	test('supports repeated continuous brush zoom, hover, cancellation, and reset', async () => {
		vi.spyOn(SVGSVGElement.prototype, 'getBoundingClientRect').mockReturnValue(
			new DOMRect(0, 0, 640, 320)
		);
		const observations = [
			{ month: 'January', actual: 12 },
			{ month: 'February', actual: 15 },
			{ month: 'March', actual: 18 }
		];
		const { container } = render(RevenueChart, {
			props: {
				data: observations,
				x: { scale: { type: 'linear', domain: [0, 30] } },
				y: { scale: { type: 'linear', domain: [0, 30] } },
				marks: [{ type: 'scatter', x: 'actual', y: 'actual' }],
				viewport: { transition: false },
				tooltip: true,
				ariaLabel: 'Continuous observations'
			}
		});
		const brush = await waitFor(() => {
			const renderedBrush = container.querySelector<SVGSVGElement>('[data-chart-brush]');
			expect(renderedBrush).toBeInTheDocument();
			return renderedBrush as SVGSVGElement;
		});
		const overlay = () => container.querySelector<SVGRectElement>('[data-chart-brush] .overlay')!;
		expect(brush).toContainElement(overlay());
		const firstPoint = () => container.querySelector<SVGCircleElement>('.ts-chart__dot circle')!;
		const initialX = Number(firstPoint().getAttribute('cx'));
		const mouse = async (
			target: Element | Window,
			type: string,
			fraction: number,
			buttons: number
		) => {
			const left = Number(overlay().getAttribute('x'));
			const width = Number(overlay().getAttribute('width'));
			const y = Number(overlay().getAttribute('y')) + 100;
			const event = new MouseEvent(type, {
				clientX: left + width * fraction,
				clientY: y,
				buttons,
				button: 0,
				bubbles: true
			});
			// jsdom rejects Vitest's Window proxy in the MouseEvent constructor.
			Object.defineProperty(event, 'view', { value: window });
			await fireEvent(target, event);
		};
		const drag = async (start: number, end: number) => {
			await mouse(overlay(), 'mousedown', start, 1);
			await mouse(window, 'mousemove', end, 1);
			await mouse(window, 'mouseup', end, 0);
		};
		await drag(0.2, 0.8);
		await waitFor(() =>
			expect(container.querySelector('[data-chart-viewport-reset]')).toBeInTheDocument()
		);
		const zoomedX = Number(firstPoint().getAttribute('cx'));
		expect(zoomedX).toBeLessThan(initialX);
		expect(container.querySelector('[data-chart-brush]')).toBe(brush);
		await drag(0.2, 0.8);
		await waitFor(() => expect(Number(firstPoint().getAttribute('cx'))).toBeLessThan(zoomedX));

		await fireEvent.pointerMove(overlay(), {
			clientX: Number(firstPoint().getAttribute('cx')),
			clientY: Number(firstPoint().getAttribute('cy'))
		});
		await waitFor(() =>
			expect(container.querySelector('.ts-chart-tooltip')).toHaveTextContent('12')
		);
		await fireEvent.pointerDown(overlay());
		await mouse(overlay(), 'mousedown', 0.3, 1);
		await mouse(window, 'mousemove', 0.7, 1);
		await fireEvent.keyDown(document, { key: 'Escape' });
		await fireEvent.click(container.querySelector('[data-chart-viewport-reset]')!);
		await waitFor(() => expect(Number(firstPoint().getAttribute('cx'))).toBeCloseTo(initialX, 1));
		expect(container.querySelector('[data-chart-viewport-reset]')).not.toBeInTheDocument();
	});

	test('groups series at the hovered x value in a chart-contained tooltip', async () => {
		const { container } = render(GroupedRevenueChart, {
			props: { data: groupedData, ...groupedDefinition, ariaLabel: 'Revenue by product' }
		});
		const svg = await waitFor(() => {
			const renderedSvg = container.querySelector('svg');
			expect(renderedSvg).toBeInTheDocument();
			return renderedSvg as SVGElement;
		});

		vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 640, 320));
		const point = container.querySelector('.ts-chart__dot circle') as SVGCircleElement;
		await fireEvent.pointerMove(svg, {
			clientX: Number(point.getAttribute('cx')),
			clientY: Number(point.getAttribute('cy'))
		});

		await waitFor(() => {
			const tooltip = document.querySelector<HTMLElement>('.ts-chart-tooltip');
			expect(tooltip).toHaveAttribute('aria-label', 'Month: January\nPlatform: 12\nServices: 8');
			expect(tooltip).not.toHaveAttribute('data-ts-chart-tooltip-portal');
			expect(container.querySelector('[data-chart-host]')).toContainElement(tooltip);
			expect(tooltip?.querySelectorAll('.ts-chart-tooltip__swatch')).toHaveLength(2);
		});
	});

	test('shows one axis indicator and one uniform state for the focused point group', async () => {
		const { container } = render(GroupedRevenueChart, {
			props: { data: groupedData, ...groupedDefinition, ariaLabel: 'Revenue by product' }
		});
		const svg = await waitFor(() => {
			const renderedSvg = container.querySelector('svg');
			expect(renderedSvg).toBeInTheDocument();
			return renderedSvg as SVGElement;
		});
		vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 640, 320));
		const firstPoint = await waitFor(() => {
			const point = container.querySelector('.ts-chart__dot circle');
			expect(point).toBeInTheDocument();
			return point as SVGCircleElement;
		});

		await fireEvent.pointerMove(svg, {
			clientX: Number(firstPoint.getAttribute('cx')),
			clientY: Number(firstPoint.getAttribute('cy'))
		});

		await waitFor(() => {
			const points = Array.from(container.querySelectorAll('.ts-chart__dot circle'));
			expect(points).toHaveLength(4);
			const activePoints = points.filter((point) => point.getAttribute('r') === '5');
			expect(activePoints).toHaveLength(2);
			expect(
				activePoints.map((point) => ({
					radius: point.getAttribute('r'),
					stroke: point.getAttribute('stroke'),
					strokeWidth: point.getAttribute('stroke-width')
				}))
			).toEqual([
				{ radius: '5', stroke: null, strokeWidth: null },
				{ radius: '5', stroke: null, strokeWidth: null }
			]);
			expect(points.filter((point) => point.getAttribute('opacity') === '0.3')).toHaveLength(2);
			const focusBands = Array.from(
				container.querySelectorAll('.ts-chart__focus-layer rect')
			).filter((band) => band.getAttribute('visibility') === 'visible');
			expect(focusBands).toHaveLength(1);
			expect(focusBands[0]).toHaveAttribute('fill', 'var(--color-neutral)');
			expect(focusBands[0]).toHaveAttribute('fill-opacity', '0.14');
			expect(container.querySelector('.ts-chart__focus-layer--default')).not.toBeInTheDocument();
			expect(container.querySelectorAll('svg circle')).toHaveLength(4);
		});
	});

	test('formats local tooltip fields without exposing TanStack points', async () => {
		const customTooltip = {
			...definition,
			tooltip: {
				fields: [
					{
						field: 'actual',
						label: 'Revenue',
						format: (value: number) => `€${value}`
					}
				],
				placement: 'top'
			}
		} satisfies ChartConfiguration<Revenue>;
		const { container } = render(RevenueChart, {
			props: { data, ...customTooltip, ariaLabel: 'Monthly revenue' }
		});
		const svg = await waitFor(() => {
			const renderedSvg = container.querySelector('svg');
			expect(renderedSvg).toBeInTheDocument();
			return renderedSvg as SVGElement;
		});

		vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 640, 320));
		await fireEvent.pointerMove(svg, { clientX: 25, clientY: 297 });

		await waitFor(() => {
			const tooltip = document.querySelector('[role="status"]');
			expect(tooltip).toHaveAttribute('aria-label', 'Revenue: €12');
			expect(tooltip).toHaveAttribute('data-sticky', 'false');
		});
	});

	test('preserves the SSR aspect ratio when the host resizes', async () => {
		window.ResizeObserver = ControlledResizeObserver as typeof ResizeObserver;

		const { container, unmount } = render(RevenueChart, {
			props: {
				data,
				...definition,
				ariaLabel: 'Monthly revenue',
				initialDimensions: { width: 800, height: 400 }
			}
		});
		const host = container.querySelector('[data-chart-host]') as HTMLElement;
		vi.spyOn(host, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 400, 200));

		controlledResizeCallback?.([], {} as ResizeObserver);

		await waitFor(() =>
			expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 400 200')
		);
		unmount();
		expect(controlledResizeDisconnect).toHaveBeenCalled();
	});

	test('adopts the prerendered SVG when the vanilla controller mounts', () => {
		const options = createChartOptions({
			data,
			...definition,
			ariaLabel: 'Monthly revenue',
			idPrefix: 'chart-adoption-test',
			initialDimensions: { width: 800, height: 400 }
		});
		const adapter = createChartAdapter(options);
		const host = document.createElement('div');
		host.innerHTML = adapter.prerender();
		const prerenderedSvg = host.querySelector('svg');

		adapter.mount(host);

		expect(host.querySelector('svg')).toBe(prerenderedSvg);
		adapter.destroy();
	});

	test('removes chart DOM during cleanup', async () => {
		const { container, unmount } = render(RevenueChart, {
			props: { data, ...definition, ariaLabel: 'Monthly revenue' }
		});

		await waitFor(() => expect(container.querySelector('svg')).toBeInTheDocument());
		const host = container.querySelector('[data-chart-host]') as HTMLElement;
		const removeEventListener = vi.spyOn(host, 'removeEventListener');
		const svg = container.querySelector('svg') as SVGElement;
		vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 640, 320));
		await fireEvent.pointerMove(svg, { clientX: 25, clientY: 297 });
		await waitFor(() => expect(document.querySelector('[role="status"]')).toBeInTheDocument());
		unmount();

		expect(container.querySelector('svg')).not.toBeInTheDocument();
		expect(document.querySelector('[role="status"]')).not.toBeInTheDocument();
		expect(removeEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
		expect(removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
	});
});
