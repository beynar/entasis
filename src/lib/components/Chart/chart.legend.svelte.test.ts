import '@testing-library/jest-dom/vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import Chart from './Chart.svelte';
import type { ChartProps } from './chart.props.js';

type Row = { x: number; y: number; group: string };
const TypedChart = Chart as Component<ChartProps<Row>>;
const props: ChartProps<Row> = {
	data: [
		{ x: 1, y: 3, group: 'First' },
		{ x: 2, y: 5, group: 'First' },
		{ x: 1, y: 2, group: 'Second' },
		{ x: 2, y: 4, group: 'Second' }
	],
	marks: [{ type: 'series', x: 'x', y: 'y', series: 'group', points: true }],
	x: { scale: { type: 'linear' } },
	y: { scale: { type: 'linear' } },
	viewport: { transition: false },
	tooltip: true,
	ariaLabel: 'Interactive legend'
};

describe('Chart legend visibility state', () => {
	test('keeps uncontrolled changes through prop spreads and changed defaults', async () => {
		const onValueChange = vi.fn();
		const { container, getByRole, rerender } = render(TypedChart, {
			props: {
				...props,
				legend: { interactive: true, defaultValue: ['First', 'Second'], onValueChange }
			}
		});
		const first = await waitFor(() => getByRole('button', { name: 'Toggle First series' }));
		const brush = container.querySelector('[data-chart-brush]');
		expect(first).toHaveAttribute('aria-pressed', 'true');
		await fireEvent.click(first);
		await waitFor(() => expect(first).toHaveAttribute('aria-pressed', 'false'));
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(['Second']);
		expect(container.querySelector('[data-chart-brush]')).toBe(brush);
		expect(container.querySelector('svg.ts-chart')).toHaveAttribute('tabindex', '-1');
		await rerender({
			...props,
			ariaDescription: 'Updated',
			legend: { interactive: true, defaultValue: ['First'], onValueChange }
		});
		expect(first).toHaveAttribute('aria-pressed', 'false');
		expect(getByRole('button', { name: 'Toggle Second series' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect(onValueChange).toHaveBeenCalledTimes(1);
		await fireEvent.click(first);
		await waitFor(() => expect(first).toHaveAttribute('aria-pressed', 'true'));
		expect(onValueChange).toHaveBeenLastCalledWith(['First', 'Second']);
	});

	test('proposes controlled changes and applies parent updates silently', async () => {
		const onValueChange = vi.fn();
		const { getByRole, rerender } = render(TypedChart, {
			props: { ...props, legend: { interactive: true, value: ['First'], onValueChange } }
		});
		const second = await waitFor(() => getByRole('button', { name: 'Toggle Second series' }));
		expect(second).toHaveAttribute('aria-pressed', 'false');
		await fireEvent.click(second);
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(['First', 'Second']);
		expect(second).toHaveAttribute('aria-pressed', 'false');
		await rerender({ ...props, legend: { interactive: true, value: ['Second'], onValueChange } });
		await waitFor(() => expect(second).toHaveAttribute('aria-pressed', 'true'));
		expect(getByRole('button', { name: 'Toggle First series' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
		expect(onValueChange).toHaveBeenCalledTimes(1);
	});
});
