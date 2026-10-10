import { describe, expect, test } from 'vitest';
import { getDefaultTabValue, resolveTabSelection } from './tabbar.selection.svelte.js';
import type { TabItem } from './tabbar.props.js';

const settled = (lastIndex?: number) => ({ lastIndex });

describe('getDefaultTabValue', () => {
	test('is the first enabled tab', () => {
		expect(getDefaultTabValue([{ label: 'A', disabled: true }, 'B'])).toBe('B');
	});

	test('is the first tab when every tab is disabled, and empty without tabs', () => {
		expect(getDefaultTabValue([{ label: 'A', disabled: true }])).toBe('A');
		expect(getDefaultTabValue([])).toBe('');
	});
});

describe('resolveTabSelection', () => {
	const items: TabItem[] = ['A', 'B', 'C', 'D'];

	test('keeps a value that names an enabled tab', () => {
		expect(resolveTabSelection(items, 'C', undefined)).toEqual({ index: 2 });
		expect(resolveTabSelection(items, 'C', settled(0))).toEqual({ index: 2 });
	});

	test('falls back to the first enabled tab before anything was resolved', () => {
		expect(resolveTabSelection([{ label: 'A', disabled: true }, 'B'], 'A', undefined)).toEqual({
			index: 1,
			reason: 'initial'
		});
		expect(resolveTabSelection(items, 'Z', undefined)).toEqual({ index: 0, reason: 'initial' });
	});

	test('a disabled selection falls back to the first enabled tab', () => {
		const withDisabled: TabItem[] = ['A', 'B', { label: 'C', disabled: true }];
		expect(resolveTabSelection(withDisabled, 'C', settled(2))).toEqual({
			index: 0,
			reason: 'disabled'
		});
	});

	test('a missing selection moves to its nearest enabled neighbour, following tabs first', () => {
		// `B` (index 1) was removed: `C` slid into its slot.
		expect(resolveTabSelection(['A', 'C', 'D'], 'B', settled(1))).toEqual({
			index: 1,
			reason: 'missing'
		});
		// The last tab was removed: the previous one is nearest.
		expect(resolveTabSelection(['A', 'B', 'C'], 'D', settled(3))).toEqual({
			index: 2,
			reason: 'missing'
		});
		// The slot and the previous tab are disabled: the next ring out is tried, following first.
		expect(
			resolveTabSelection(
				['A', { label: 'B', disabled: true }, { label: 'C', disabled: true }, 'D', 'E'],
				'Z',
				settled(2)
			)
		).toEqual({ index: 3, reason: 'missing' });
	});

	test('a missing selection without a previous position uses the first enabled tab', () => {
		expect(resolveTabSelection(items, 'Z', settled())).toEqual({ index: 0, reason: 'missing' });
	});

	test('with no enabled tab keeps a disabled match and otherwise selects nothing', () => {
		const disabled: TabItem[] = [
			{ label: 'A', disabled: true },
			{ label: 'B', disabled: true }
		];
		expect(resolveTabSelection(disabled, 'B', settled(1))).toEqual({ index: 1 });
		expect(resolveTabSelection(disabled, 'Z', settled(1))).toEqual({ index: -1 });
		expect(resolveTabSelection([], 'A', undefined)).toEqual({ index: -1 });
	});
});
