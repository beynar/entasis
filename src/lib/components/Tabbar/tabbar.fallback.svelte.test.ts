import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import TabbarFallbackHarness from './TabbarFallbackHarness.test.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';

const bound = () => screen.getByRole('status').textContent;
const tabsIn = (testId: string) => within(screen.getByTestId(testId)).getAllByRole('tab');
const selectedTabs = (testId = 'tabbar') =>
	tabsIn(testId).filter((tab) => tab.getAttribute('aria-selected') === 'true');
const indicator = () =>
	document.querySelector<HTMLElement>('[data-slot="tabbar-indicator"]:not([role])');
// The indicator turns its transitions on two animation frames after it is first placed.
const transitionFrames = () =>
	new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
	);

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

	test('an unknown defaultValue selects the first enabled tab, writes it back and reports it', () => {
		const onValueChange = vi.fn();
		renderInTheme(TabbarFallbackHarness, {
			items: ['Overview', 'Activity'],
			defaultValue: 'Archive',
			onValueChange
		});

		expect(selectedTabs()).toEqual([screen.getByRole('tab', { name: 'Overview' })]);
		expect(bound()).toBe('Overview');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ value: 'Overview', reason: 'initial' });
	});

	test('a value another control sets to no tab is kept: nothing is selected or reported', async () => {
		const onValueChange = vi.fn();
		renderInTheme(TabbarFallbackHarness, {
			items: ['All', 'Design', 'Culture'],
			initialValue: 'All',
			externalValue: 'Studio',
			onValueChange
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Set external value' }));
		await tick();

		expect(selectedTabs()).toEqual([]);
		expect(indicator()).toHaveAttribute('hidden');
		expect(bound()).toBe('Studio');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a deep-linked value survives tabs that arrive in two steps', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(TabbarFallbackHarness, {
			items: ['Overview'],
			initialValue: 'Settings',
			onValueChange
		});
		expect(selectedTabs()).toEqual([]);

		await rerender({ items: ['Overview', 'Settings'] });

		expect(selectedTabs()).toEqual([screen.getByRole('tab', { name: 'Settings' })]);
		expect(bound()).toBe('Settings');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('tabs loaded after mount select the first enabled tab without a report', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(TabbarFallbackHarness, { items: [], onValueChange });

		await rerender({ items: [{ label: 'Drafts', disabled: true }, 'Inbox', 'Sent'] });

		expect(selectedTabs()).toEqual([screen.getByRole('tab', { name: 'Inbox' })]);
		expect(bound()).toBe('Inbox');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('two tab lists sharing a value with no tab in common leave each other alone', async () => {
		renderInTheme(TabbarFallbackHarness, {
			items: ['A', 'B'],
			mirrorItems: ['C', 'D'],
			initialValue: 'A'
		});
		await tick();
		expect(bound()).toBe('A');
		expect(selectedTabs('mirror')).toEqual([]);

		await fireEvent.click(within(screen.getByTestId('mirror')).getByRole('tab', { name: 'D' }));
		await tick();

		expect(bound()).toBe('D');
		expect(selectedTabs()).toEqual([]);
		expect(selectedTabs('mirror').map((tab) => tab.textContent?.trim())).toEqual(['D']);
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
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ value: 'Settings', reason: 'missing' });
	});

	test('a click on an object item reports its value', async () => {
		const onValueChange = vi.fn();
		renderInTheme(TabbarFallbackHarness, {
			items: ['Overview', { value: 'activity', label: 'Activity' }],
			initialValue: 'Overview',
			onValueChange
		});

		await fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));

		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ value: 'activity', reason: 'user' });
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

	test('a re-shown indicator snaps into place before it animates again', async () => {
		const { rerender } = renderInTheme(TabbarFallbackHarness, {
			items: ['Overview', 'Activity'],
			initialValue: 'Activity'
		});
		await tick();
		await transitionFrames();
		await tick();
		expect(indicator()).toHaveAttribute('data-ready', 'true');

		await rerender({ items: [{ label: 'Archive', disabled: true }] });
		expect(indicator()).toHaveAttribute('hidden');
		expect(indicator()).toHaveAttribute('data-ready', 'false');

		await rerender({ items: [{ label: 'Archive', disabled: true }, 'Activity'] });

		// Placed from an empty style: transitions stay off for this placement.
		expect(indicator()).not.toHaveAttribute('hidden');
		expect(indicator()).toHaveAttribute('data-ready', 'false');
		await transitionFrames();
		await tick();
		expect(indicator()).toHaveAttribute('data-ready', 'true');
	});

	test('hiding before transitions are on still snaps the next placement', async () => {
		const { rerender } = renderInTheme(TabbarFallbackHarness, {
			items: ['Overview', 'Activity'],
			initialValue: 'Activity'
		});
		await tick();
		await rerender({ items: [{ label: 'Archive', disabled: true }] });
		expect(indicator()).toHaveAttribute('hidden');
		// The frames the first placement asked for must not turn transitions on while hidden.
		await transitionFrames();
		await tick();
		expect(indicator()).toHaveAttribute('data-ready', 'false');

		await rerender({ items: [{ label: 'Archive', disabled: true }, 'Activity'] });

		expect(indicator()).not.toHaveAttribute('hidden');
		expect(indicator()).toHaveAttribute('data-ready', 'false');
	});
});
