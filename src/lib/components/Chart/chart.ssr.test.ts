import { render } from 'svelte/server';
import type { Component } from 'svelte';
import { describe, expect, test } from 'vitest';
import Chart from './Chart.svelte';
import type { ChartProps } from './chart.props.js';

type Revenue = {
	month: Date;
	value: number | null;
};

const data: readonly Revenue[] = [
	{ month: new Date('2026-01-01T00:00:00.000Z'), value: 12 },
	{ month: new Date('2026-02-01T00:00:00.000Z'), value: 18 },
	{ month: new Date('2026-03-01T00:00:00.000Z'), value: null }
];

const chart = {
	x: { scale: { type: 'utc' } },
	y: { scale: { type: 'linear' } },
	marks: [{ type: 'series', x: 'month', y: 'value' }]
} satisfies Pick<ChartProps<Revenue>, 'marks' | 'x' | 'y'>;

const RevenueChart = Chart as Component<ChartProps<Revenue>>;

describe('Chart SSR', () => {
	test('prerenders an accessible SVG at the requested aspect ratio', () => {
		const output = render(RevenueChart, {
			props: {
				data,
				...chart,
				label: 'Monthly revenue',
				aspectRatio: 2
			}
		});

		expect(output.body).toContain('data-slot="chart"');
		expect(output.body).toContain('<svg');
		expect(output.body).toContain('aria-label="Monthly revenue"');
		expect(output.body).toContain('viewBox="0 0 800 400"');
		expect(output.body).toContain('aspect-ratio:2');
	});

	test('prerenders and sizes the root from height alone', () => {
		const output = render(RevenueChart, {
			props: { data, ...chart, label: 'Monthly revenue', height: 320 }
		});

		expect(output.body).toContain('viewBox="0 0 800 320"');
		expect(output.body).toContain('height:320px');
	});

	test('rejects height combined with aspectRatio', () => {
		let thrown: unknown;
		try {
			const output = render(RevenueChart, {
				props: { data, ...chart, label: 'Monthly revenue', height: 320, aspectRatio: 2 }
			});
			void output.body;
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(TypeError);
		expect((thrown as Error).message).toBe(
			'[Chart] height cannot be combined with aspectRatio; each one sizes the chart on its own.'
		);
	});

	test('renders only a stable host when no size is declared', () => {
		const output = render(RevenueChart, {
			props: { data, ...chart, label: 'Monthly revenue' }
		});

		expect(output.body).toContain('data-slot="chart"');
		expect(output.body).toContain('data-chart-host');
		expect(output.body).not.toContain('<svg');
	});

	test('keeps empty datasets valid', () => {
		const output = render(RevenueChart, {
			props: {
				data: [],
				...chart,
				label: 'Empty revenue',
				aspectRatio: 2
			}
		});

		expect(output.body).toContain('<svg');
		expect(output.body).toContain('aria-label="Empty revenue"');
	});

	test('rejects a non-positive height', () => {
		let thrown: unknown;
		try {
			const output = render(RevenueChart, {
				props: { data, ...chart, label: 'Monthly revenue', height: 0 }
			});
			void output.body;
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(TypeError);
		expect((thrown as Error).message).toBe(
			'[Chart] height must be a finite number of pixels greater than 0.'
		);
	});
});
