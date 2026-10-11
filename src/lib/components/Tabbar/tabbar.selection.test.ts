import { describe, expect, test } from 'vitest';
import {
	getDefaultTabValue,
	getTabValueOrigin,
	resolveTabSelection,
	type TabSelectionHistory
} from './tabbar.selection.svelte.js';
import type { TabItem } from './tabbar.props.js';

const settled = (value: string, index: number): TabSelectionHistory => ({
	settled: { value, index }
});

describe('getDefaultTabValue', () => {
	test('is the first enabled tab', () => {
		expect(getDefaultTabValue([{ label: 'A', disabled: true }, 'B'])).toBe('B');
	});

	test('is the first tab when every tab is disabled, and empty without tabs', () => {
		expect(getDefaultTabValue([{ label: 'A', disabled: true }])).toBe('A');
		expect(getDefaultTabValue([])).toBe('');
	});
});

describe('getTabValueOrigin', () => {
	test('names who chose the starting value', () => {
		expect(getTabValueOrigin('A', 'B')).toBe('value');
		expect(getTabValueOrigin(undefined, 'B')).toBe('defaultValue');
		expect(getTabValueOrigin(undefined, undefined)).toBe('default');
		// The server renders a bound component again once its default was written back.
		expect(getTabValueOrigin('B', 'B')).toBe('defaultValue');
	});
});

describe('resolveTabSelection', () => {
	const items: TabItem[] = ['A', 'B', 'C', 'D'];
	const disabledFirst: TabItem[] = [{ label: 'A', disabled: true }, 'B'];

	test('keeps a value that names an enabled tab', () => {
		expect(resolveTabSelection(items, 'C')).toEqual({ index: 2 });
		expect(resolveTabSelection(items, 'C', settled('A', 0))).toEqual({ index: 2 });
	});

	test('replaces its own starting value when it names no enabled tab', () => {
		const fromDefaultValue = { initial: { value: 'A', origin: 'defaultValue' as const } };
		expect(resolveTabSelection(disabledFirst, 'A', fromDefaultValue)).toEqual({
			index: 1,
			fallback: 'initial'
		});
		expect(
			resolveTabSelection(items, 'Z', { initial: { value: 'Z', origin: 'defaultValue' } })
		).toEqual({ index: 0, fallback: 'initial' });
		// The default computed before any tab existed is replaced without a report.
		expect(resolveTabSelection(items, '', { initial: { value: '', origin: 'default' } })).toEqual({
			index: 0,
			fallback: 'default'
		});
	});

	test('never replaces a value the parent chose', () => {
		// A disabled tab it names stays selected; an unknown value selects nothing.
		expect(resolveTabSelection(disabledFirst, 'A')).toEqual({ index: 0 });
		expect(resolveTabSelection(items, 'Z')).toEqual({ index: -1 });
		// A value that moved away from the settled one is the parent's too.
		expect(resolveTabSelection(items, 'Z', settled('B', 1))).toEqual({ index: -1 });
	});

	test('a selected tab that became disabled falls back to the first enabled tab', () => {
		const withDisabled: TabItem[] = ['A', 'B', { label: 'C', disabled: true }];
		expect(resolveTabSelection(withDisabled, 'C', settled('C', 2))).toEqual({
			index: 0,
			fallback: 'disabled'
		});
	});

	test('a removed selected tab moves to its nearest enabled neighbour, following tabs first', () => {
		// `B` (index 1) was removed: `C` slid into its slot.
		expect(resolveTabSelection(['A', 'C', 'D'], 'B', settled('B', 1))).toEqual({
			index: 1,
			fallback: 'missing'
		});
		// The last tab was removed: the previous one is nearest.
		expect(resolveTabSelection(['A', 'B', 'C'], 'D', settled('D', 3))).toEqual({
			index: 2,
			fallback: 'missing'
		});
		// The slot and the previous tab are disabled: the next ring out is tried, following first.
		expect(
			resolveTabSelection(
				['A', { label: 'B', disabled: true }, { label: 'C', disabled: true }, 'D', 'E'],
				'Z',
				settled('Z', 2)
			)
		).toEqual({ index: 3, fallback: 'missing' });
	});

	test('with no enabled tab keeps a disabled match and otherwise selects nothing', () => {
		const disabled: TabItem[] = [
			{ label: 'A', disabled: true },
			{ label: 'B', disabled: true }
		];
		expect(resolveTabSelection(disabled, 'B', settled('B', 1))).toEqual({ index: 1 });
		expect(resolveTabSelection(disabled, 'Z', settled('Z', 1))).toEqual({ index: -1 });
		expect(resolveTabSelection([], 'A', { initial: { value: 'A', origin: 'default' } })).toEqual({
			index: -1
		});
	});
});
