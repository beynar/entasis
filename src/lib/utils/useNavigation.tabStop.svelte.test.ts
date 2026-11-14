// The render-time tab stop (`tabIndexAt`) hands over to the list once it mounts: a template that
// renders the tabindex again never leaves the list without its single tab stop (law 7).
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import ToggleButtonGroup from '../components/ToggleButtonGroup/ToggleButtonGroup.svelte';
import SegmentedControl from '../components/SegmentedControl/SegmentedControl.svelte';
import TabIndexAtHarness from './TabIndexAtHarness.test.svelte';

const tabStops = () =>
	Array.from(document.querySelectorAll('[tabindex="0"]')).map((node) => node.textContent?.trim());

const settle = async () => {
	await tick();
	await Promise.resolve();
	await tick();
};

describe('tab stop after mount', () => {
	test('comes back when a template renders tabIndexAt again with nothing else changing', async () => {
		const { rerender } = render(TabIndexAtHarness);
		await settle();
		expect(tabStops()).toEqual(['B']);

		await rerender({ tone: 'b' });
		await settle();
		expect(screen.getByRole('button', { name: 'B' })).toHaveClass('b');
		expect(tabStops()).toEqual(['B']);
	});

	test('survives a ToggleButtonGroup whose item props change', async () => {
		// Only a class changes: nothing the list watches in the DOM, so no re-sync of its own.
		const items = (tone: string) => [
			{ value: 'left', children: 'Left', class: tone },
			{ value: 'center', children: 'Center', class: tone },
			{ value: 'right', children: 'Right', class: tone }
		];
		const { rerender } = render(ToggleButtonGroup, {
			props: { label: 'Align', type: 'single' as const, items: items('a'), defaultValue: 'center' }
		});
		await settle();
		expect(tabStops()).toEqual(['Center']);

		await rerender({ items: items('b') });
		await settle();
		expect(screen.getByRole('radio', { name: 'Center' })).toHaveClass('b');
		expect(tabStops()).toEqual(['Center']);
	});

	test('survives a SegmentedControl whose items are reordered', async () => {
		const list = { value: 'list', label: 'List' };
		const grid = { value: 'grid', label: 'Grid' };
		const board = { value: 'board', label: 'Board' };
		const { rerender } = render(SegmentedControl, {
			props: { label: 'View', items: [list, grid, board], defaultValue: 'grid' }
		});
		await settle();
		expect(tabStops()).toEqual(['Grid']);

		await rerender({ items: [grid, board, list] });
		await settle();
		expect(tabStops()).toEqual(['Grid']);
		await rerender({ items: [board, list, grid] });
		await settle();
		expect(tabStops()).toEqual(['Grid']);
	});
});
