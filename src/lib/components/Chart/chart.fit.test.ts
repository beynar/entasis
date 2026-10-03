import { createChartRuntime, type SceneLabel, type SceneNode } from '@tanstack/charts';
import { describe, expect, test } from 'vitest';
import { createChartOptions } from './chart.adapter.js';
import {
	CHART_FIT_MARGIN,
	estimateLabelWidth,
	fitAxis,
	LABEL_LINE_BOX,
	type RelationAxisItem
} from './chart.fit.js';
import type { ChartProps } from './chart.props.js';

describe('fitAxis', () => {
	const extremes = (items: readonly RelationAxisItem[], length: number) => {
		const { start, span } = fitAxis(items, length);
		return {
			low: Math.min(...items.map((item) => start + item.fraction * span - item.before)),
			high: Math.max(...items.map((item) => start + item.fraction * span + item.after))
		};
	};

	test('stretches the layout until its outermost labels reach both edges', () => {
		const items = [
			{ fraction: 0, before: 60, after: 5 },
			{ fraction: 0.5, before: 5, after: 40 },
			{ fraction: 1, before: 5, after: 80 }
		];
		const { low, high } = extremes(items, 600);
		expect(low).toBeCloseTo(CHART_FIT_MARGIN);
		expect(high).toBeCloseTo(600 - CHART_FIT_MARGIN);
	});

	test('accounts for an inner label that reaches further than the outer ones', () => {
		// The middle node's label is the widest thing past the last node's anchor.
		const items = [
			{ fraction: 0, before: 5, after: 5 },
			{ fraction: 0.9, before: 5, after: 200 },
			{ fraction: 1, before: 5, after: 5 }
		];
		const { high } = extremes(items, 600);
		expect(high).toBeCloseTo(600 - CHART_FIT_MARGIN);
	});

	test('centres a layout with a single position', () => {
		const { low, high } = extremes([{ fraction: 0.5, before: 10, after: 30 }], 200);
		expect(low - 0).toBeCloseTo(200 - high);
	});
});

type Month = { month: string; value: number };

const months: readonly Month[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => ({
	month,
	value: 4 + ((index * 7) % 9)
}));

const sceneOf = (marks: ChartProps<Month>['marks'], width: number, height: number) =>
	createChartRuntime().render(
		createChartOptions({ data: months, marks, label: 'Months', idPrefix: 'fit' }).definition,
		{
			width,
			height
		}
	);

/** Every label's estimated box, in plot coordinates. */
function labelBoxes(nodes: readonly SceneNode[], x = 0, y = 0) {
	const boxes: { left: number; right: number; top: number; bottom: number }[] = [];
	for (const node of nodes) {
		if (node.kind === 'group') {
			boxes.push(
				...labelBoxes(node.children, x + (node.translateX ?? 0), y + (node.translateY ?? 0))
			);
		} else if (node.kind === 'label') {
			boxes.push(labelBox(node, x, y));
		}
	}
	return boxes;
}

function labelBox(label: SceneLabel, x: number, y: number) {
	const fontSize = label.fontSize ?? 12;
	const width = estimateLabelWidth(label.text, fontSize, label.fontWeight ?? 400);
	const left = label.anchor === 'end' ? width : label.anchor === 'start' ? 0 : width / 2;
	const lineBox = LABEL_LINE_BOX[label.baseline ?? 'middle'];
	return {
		left: x + label.x - left,
		right: x + label.x - left + width,
		top: y + label.y - lineBox.above * fontSize,
		bottom: y + label.y + lineBox.below * fontSize
	};
}

describe('polar fit', () => {
	test.each([
		['wide', 600, 300],
		['tall', 300, 600]
	] as const)('a radial bar chart in a %s plot fills it with its labels inside', (_, w, h) => {
		const scene = sceneOf(
			[{ type: 'polar', variant: 'radial-bar', angle: 'month', radius: 'value' }],
			w,
			h
		);
		const boxes = labelBoxes(scene.nodes);
		expect(boxes.length).toBe(months.length);
		const left = Math.min(...boxes.map((box) => box.left)) - scene.chart.x;
		const right = scene.chart.x + scene.chart.width - Math.max(...boxes.map((box) => box.right));
		const top = Math.min(...boxes.map((box) => box.top)) - scene.chart.y;
		const bottom = scene.chart.y + scene.chart.height - Math.max(...boxes.map((box) => box.bottom));
		for (const gap of [left, right, top, bottom]) expect(gap).toBeGreaterThanOrEqual(0);
		// The labels reach the edges of the tight axis. In a tall plot the side labels touch them;
		// in a wide one the circle does, with the labels just past twelve o'clock a few px
		// inside (a fixed 24px inset left them over 20px away).
		const tight = w > h ? Math.min(top, bottom) : Math.min(left, right);
		expect(tight).toBeLessThan(w > h ? 8 : CHART_FIT_MARGIN + 1);
	});
});
