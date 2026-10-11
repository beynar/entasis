import '@testing-library/jest-dom/vitest';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
import { renderInTheme } from '$lib/components/Theme/renderInTheme.test-helper.js';

// The indicator turns its transitions on two animation frames after it is first placed.
const transitionFrames = () =>
	new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
	);
const indicator = () => document.querySelector<HTMLElement>('[role="radiogroup"] > span');
const items = [
	{ value: 'day', label: 'Day' },
	{ value: 'week', label: 'Week' }
];

// Tabbar covers the same helper through its own `hidden` indicator in tabbar.fallback tests.
describe('useSlidingIndicator in SegmentedControl', () => {
	test('an indicator shown again after no item matched snaps into place first', async () => {
		const { rerender } = renderInTheme(SegmentedControl, { items, value: 'day' });
		await tick();
		await transitionFrames();
		await tick();
		expect(indicator()).toHaveAttribute('data-ready', 'true');

		await rerender({ items, value: 'month' });
		expect(indicator()).toBeNull();

		await rerender({ items, value: 'week' });

		expect(indicator()).toHaveAttribute('data-ready', 'false');
		expect(indicator()?.getAttribute('style')).toContain('transform');
		await transitionFrames();
		await tick();
		expect(indicator()).toHaveAttribute('data-ready', 'true');
	});
});
