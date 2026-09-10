// @vitest-environment jsdom
import { defineChart, dot, mountChart } from '@tanstack/charts';
import { scaleLinear } from 'd3-scale';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { compileChartTooltip } from './chart.tooltip.js';

const observations = [
	{ id: 'left', x: 2, y: 3, series: 'Alpha' },
	{ id: 'middle-a', x: 5, y: 5, series: 'Alpha' },
	{ id: 'middle-b', x: 5, y: 6, series: 'Beta' },
	{ id: 'right', x: 8, y: 7, series: 'Beta' }
];

const cleanups: (() => void)[] = [];

afterEach(() => {
	for (const cleanup of cleanups.splice(0)) cleanup();
	vi.restoreAllMocks();
});

function mountTooltipChart(groupBy?: 'x' | 'y', domain?: readonly [number, number]) {
	const compiled = compileChartTooltip<(typeof observations)[number]>(true, undefined, groupBy);
	const definition = defineChart({
		marks: [dot(observations, { x: 'x', y: 'y', z: 'series', color: 'series', key: 'id' })],
		scales: {
			x: {
				scale: scaleLinear().domain([0, 10]),
				viewport: domain ? { domain } : undefined,
				axis: { label: 'Signal A' }
			},
			y: { scale: scaleLinear().domain([0, 10]), axis: { label: 'Signal B' } }
		},
		focus: compiled.focus,
		focusRing: false,
		keyboard: false,
		tooltip: compiled.input
	});
	const container = document.createElement('div');
	document.body.append(container);
	vi.spyOn(SVGElement.prototype, 'getBoundingClientRect').mockReturnValue(
		new DOMRect(0, 0, 640, 320)
	);
	const host = mountChart(container, {
		definition,
		width: 640,
		height: 320,
		ariaLabel: 'Tooltip example'
	});
	cleanups.push(() => {
		host.destroy();
		container.remove();
	});
	return { container, host };
}

describe('Chart native tooltip integration', () => {
	test.each(['x', 'y'] as const)('uses native grouped %s focus', (axis) => {
		const compiled = compileChartTooltip(true, undefined, axis);
		expect(compiled.focus).toBe(`group-${axis}`);
		expect(compiled.groupBy).toBe(axis);
	});

	test('uses native nearest geometry when grouping is disabled', () => {
		const compiled = compileChartTooltip({ groupBy: false }, undefined, 'x');
		expect(compiled.focus).toBe('nearest');
		expect(compiled.groupBy).toBeUndefined();
	});

	test('shows the full group inside the chart without pinning or a focus ring', () => {
		const { container, host } = mountTooltipChart('x');
		const point = host.getScene().points.find((candidate) => candidate.datum.id === 'middle-a');
		expect(point).toBeDefined();
		if (!point) throw new Error('Expected the middle observation.');
		const resolved = host.interaction.resolvePointer(point.x, point.y);
		expect(resolved?.points.map((candidate) => candidate.datum.id).sort()).toEqual([
			'middle-a',
			'middle-b'
		]);
		host.interaction.setControlledFocus(resolved, { pinned: true });

		const tooltip = container.querySelector<HTMLElement>('.ts-chart-tooltip');
		expect(tooltip?.textContent).toContain('Alpha');
		expect(tooltip?.textContent).toContain('Beta');
		expect(tooltip?.hasAttribute('data-ts-chart-tooltip-portal')).toBe(false);
		expect(tooltip?.style.position).toBe('absolute');
		expect(tooltip?.getAttribute('role')).not.toBe('dialog');
		expect(tooltip?.dataset.sticky).toBe('false');
		expect(container.querySelector('[data-ts-focus-layer]')).toBeNull();

		host.interaction.setControlledFocus(null);
		expect(tooltip?.hidden).toBe(true);
	});

	test('native viewport focus excludes off-window observations', () => {
		const { container, host } = mountTooltipChart(undefined, [4, 6]);
		const scene = host.getScene();
		const hidden = scene.points.find((point) => point.datum.id === 'right');
		const visible = scene.points.find((point) => point.datum.id === 'middle-a');
		if (!hidden || !visible) throw new Error('Expected visible and clipped observations.');

		expect(host.interaction.resolvePointer(hidden.x, hidden.y)).toBeNull();
		const resolved = host.interaction.resolvePointer(visible.x, visible.y);
		expect(resolved?.point.datum.id).toBe('middle-a');
		host.interaction.setControlledFocus(resolved);
		expect(container.querySelector('.ts-chart-tooltip')?.textContent).toContain('Alpha');
	});
});
