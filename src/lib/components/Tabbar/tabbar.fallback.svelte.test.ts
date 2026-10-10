import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import TabbarFallbackHarness from './TabbarFallbackHarness.test.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';

const bound = () => screen.getByRole('status').textContent;
const selectedTabs = () =>
	screen.getAllByRole('tab').filter((tab) => tab.getAttribute('aria-selected') === 'true');
const indicator = () =>
	document.querySelector<HTMLElement>('[data-slot="tabbar-indicator"]:not([role])');

describe('Tabbar selects an enabled tab', () => {
	test('a disabled first tab is skipped by the default selection and the tab stop', () => {
		const onValueChange = vi.fn();
		renderInTheme(TabbarFallbackHarness, {
			items: [{ label: 'Overview', disabled: true }, 'Activity'],
			onValueChange
		});

		expect(selectedTabs()).toEqual([screen.getByRole('tab', { name: 'Activity' })]);
		expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('tabindex', '0');
		expect(bound()).toBe('Activity');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('an unknown value selects the first enabled tab, writes it back and reports it', () => {
		const onValueChange = vi.fn();
		renderInTheme(TabbarFallbackHarness, {
			items: ['Overview', 'Activity'],
			initialValue: 'Archive',
			onValueChange
		});

		expect(selectedTabs()).toEqual([screen.getByRole('tab', { name: 'Overview' })]);
		expect(bound()).toBe('Overview');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Overview');
	});

	test('removing the active tab selects its nearest neighbour and reports it', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(TabbarFallbackHarness, {
			items: ['Overview', 'Activity', 'Settings'],
			initialValue: 'Activity',
			onValueChange
		});

		await rerender({ items: ['Overview', 'Settings'] });

		expect(selectedTabs()).toEqual([screen.getByRole('tab', { name: 'Settings' })]);
		expect(bound()).toBe('Settings');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Settings');
	});

	test('a click on an object item reports its value', async () => {
		const onValueChange = vi.fn();
		renderInTheme(TabbarFallbackHarness, {
			items: ['Overview', { value: 'activity', label: 'Activity' }],
			initialValue: 'Overview',
			onValueChange
		});

		await fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));

		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('activity');
	});

	test('hides the indicator when no tab can be selected and shows it again on a selection', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(TabbarFallbackHarness, {
			items: ['Overview', 'Activity'],
			initialValue: 'Activity',
			onValueChange
		});
		await tick();
		expect(indicator()).not.toBeNull();
		expect(indicator()).not.toHaveAttribute('hidden');
		expect(indicator()?.getAttribute('style')).toContain('transform');

		await rerender({ items: [{ label: 'Archive', disabled: true }] });

		expect(selectedTabs()).toEqual([]);
		expect(indicator()).toHaveAttribute('hidden');
		expect(indicator()).toHaveAttribute('data-ready', 'false');
		expect(indicator()?.getAttribute('style') ?? '').toBe('');
		// Nothing could be selected, so nothing was written back or reported.
		expect(bound()).toBe('Activity');
		expect(onValueChange).not.toHaveBeenCalled();

		await rerender({ items: [{ label: 'Archive', disabled: true }, 'Activity'] });

		expect(selectedTabs()).toEqual([screen.getByRole('tab', { name: 'Activity' })]);
		expect(indicator()).not.toHaveAttribute('hidden');
		expect(indicator()?.getAttribute('style')).toContain('transform');
	});
});
