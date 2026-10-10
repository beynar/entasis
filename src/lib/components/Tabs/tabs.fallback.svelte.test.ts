import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import TabsFallbackHarness from './TabsFallbackHarness.test.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import type { TabItem } from '../Tabbar/tabbar.props.js';

const bound = () => screen.getByRole('status').textContent;

/** The selected tab and the shown panel must name each other, whatever the value was. */
const expectSelected = (index: number) => {
	const tabs = screen.getAllByRole('tab');
	const selected = tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true');
	expect(selected).toEqual([tabs[index]]);
	const panels = document.querySelectorAll('[role="tabpanel"][data-step-active="true"]');
	expect(panels).toHaveLength(1);
	expect(panels[0].id).toBe(tabs[index].getAttribute('aria-controls'));
	expect(panels[0]).toHaveAttribute('aria-labelledby', tabs[index].id);
	expect(panels[0]).toHaveTextContent(`Panel ${index}`);
};

const disabledFirst: TabItem[] = [{ label: 'Overview', disabled: true }, 'Activity', 'Settings'];

describe('Tabs selects an enabled tab', () => {
	test('a disabled first tab is skipped by the default selection', () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, { items: disabledFirst, onValueChange });

		expectSelected(1);
		expect(bound()).toBe('Activity');
		// The default is the first enabled tab, not a correction of something the caller asked for.
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a disabled defaultValue falls back to the first enabled tab with reason initial', () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: disabledFirst,
			defaultValue: 'Overview',
			onValueChange
		});

		expectSelected(1);
		expect(bound()).toBe('Activity');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
			value: 'Activity',
			item: 'Activity',
			index: 1,
			reason: 'initial'
		});
	});

	test('an unknown value shows the first enabled tab next to its own panel', () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: ['Overview', 'Activity'],
			initialValue: 'Archive',
			onValueChange
		});

		expectSelected(0);
		expect(bound()).toBe('Overview');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
			value: 'Overview',
			item: 'Overview',
			index: 0,
			reason: 'initial'
		});
	});

	test('removing the active tab selects its following neighbour with reason missing', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(TabsFallbackHarness, {
			items: ['Overview', 'Activity', 'Settings'],
			initialValue: 'Activity',
			onValueChange
		});
		expectSelected(1);

		await rerender({ items: ['Overview', 'Settings'] });

		expectSelected(1);
		expect(bound()).toBe('Settings');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
			value: 'Settings',
			item: 'Settings',
			index: 1,
			reason: 'missing'
		});
	});

	test('removing the last tab while it is active selects the previous one', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(TabsFallbackHarness, {
			items: ['Overview', 'Activity', 'Settings'],
			initialValue: 'Settings',
			onValueChange
		});

		await rerender({ items: ['Overview', 'Activity'] });

		expectSelected(1);
		expect(bound()).toBe('Activity');
		expect(onValueChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ value: 'Activity', reason: 'missing' })
		);
	});

	test('the nearest neighbour skips disabled tabs', async () => {
		const { rerender } = renderInTheme(TabsFallbackHarness, {
			items: ['Overview', 'Activity', 'Settings', 'Billing'],
			initialValue: 'Activity'
		});

		await rerender({ items: ['Overview', { label: 'Settings', disabled: true }, 'Billing'] });

		// Settings took Activity's slot but is disabled; Overview is as close and comes first.
		expectSelected(0);
		expect(bound()).toBe('Overview');
	});

	test('disabling the active tab selects the first enabled tab with reason disabled', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(TabsFallbackHarness, {
			items: ['Overview', 'Activity', 'Settings'],
			initialValue: 'Settings',
			onValueChange
		});

		await rerender({ items: ['Overview', 'Activity', { label: 'Settings', disabled: true }] });

		expectSelected(0);
		expect(bound()).toBe('Overview');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
			value: 'Overview',
			item: 'Overview',
			index: 0,
			reason: 'disabled'
		});
	});

	test('an external value naming no tab keeps the tab that was shown', async () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: ['Overview', 'Activity', 'Settings'],
			initialValue: 'Activity',
			externalValue: 'Archive',
			onValueChange
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Set external value' }));

		expectSelected(1);
		expect(bound()).toBe('Activity');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ value: 'Activity', reason: 'missing' })
		);
	});

	test('a user pick reports reason user', async () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: ['Overview', 'Activity'],
			initialValue: 'Overview',
			onValueChange
		});

		await fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));

		expectSelected(1);
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
			value: 'Activity',
			item: 'Activity',
			index: 1,
			reason: 'user'
		});
	});

	test('the api handle cannot activate a disabled tab', async () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: ['Overview', { label: 'Activity', disabled: true }, 'Settings'],
			initialValue: 'Overview',
			onValueChange
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Go to 1' }));

		expectSelected(0);
		expect(bound()).toBe('Overview');
		expect(onValueChange).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('button', { name: 'Go to 2' }));

		expectSelected(2);
		expect(bound()).toBe('Settings');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ value: 'Settings', index: 2, reason: 'user' })
		);
	});

	test('with every tab disabled the selected disabled tab stays shown', () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: [
				{ label: 'Overview', disabled: true },
				{ label: 'Activity', disabled: true }
			],
			initialValue: 'Activity',
			onValueChange
		});

		expectSelected(1);
		expect(bound()).toBe('Activity');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('with no enabled tab an unknown value selects nothing and shows no panel', () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: [
				{ label: 'Overview', disabled: true },
				{ label: 'Activity', disabled: true }
			],
			initialValue: 'Archive',
			onValueChange
		});

		for (const tab of screen.getAllByRole('tab')) {
			expect(tab).toHaveAttribute('aria-selected', 'false');
		}
		expect(document.querySelectorAll('[role="tabpanel"][data-step-active="true"]')).toHaveLength(0);
		expect(bound()).toBe('Archive');
		expect(onValueChange).not.toHaveBeenCalled();
	});
});
