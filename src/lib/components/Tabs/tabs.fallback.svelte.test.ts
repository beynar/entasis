import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import TabsFallbackHarness from './TabsFallbackHarness.test.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import type { TabItem } from '../Tabbar/tabbar.props.js';

const bound = () => screen.getByRole('status').textContent;
const tabsRoot = () => within(screen.getByTestId('tabs'));

/** The selected tab and the shown panel must name each other, whatever the value was. */
const expectSelected = (index: number) => {
	const tabs = tabsRoot().getAllByRole('tab');
	const selected = tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true');
	expect(selected).toEqual([tabs[index]]);
	const panels = document.querySelectorAll('[role="tabpanel"][data-step-active="true"]');
	expect(panels).toHaveLength(1);
	expect(panels[0].id).toBe(tabs[index].getAttribute('aria-controls'));
	expect(panels[0]).toHaveAttribute('aria-labelledby', tabs[index].id);
	expect(panels[0]).toHaveTextContent(`Panel ${index}`);
};

/** No tab is selected and no panel is shown, not even the one shown before. */
const expectNothingSelected = () => {
	for (const tab of tabsRoot().getAllByRole('tab')) {
		expect(tab).toHaveAttribute('aria-selected', 'false');
	}
	const panels = Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
	expect(panels.filter((panel) => panel.dataset.stepActive === 'true')).toEqual([]);
	expect(panels.filter((panel) => !panel.hidden)).toEqual([]);
	expect(screen.queryByText(/^Panel \d$/)).toBeNull();
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

	test('an unknown defaultValue shows the first enabled tab next to its own panel', () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: ['Overview', 'Activity'],
			defaultValue: 'Archive',
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

	test('a bound value naming no tab selects nothing, shows no panel and is kept', () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: ['Overview', 'Activity'],
			initialValue: 'Archive',
			onValueChange
		});

		expectNothingSelected();
		expect(bound()).toBe('Archive');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a bound value naming a disabled tab is shown as the parent set it', () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: ['Overview', { label: 'Activity', disabled: true }],
			initialValue: 'Activity',
			onValueChange
		});

		expectSelected(1);
		expect(bound()).toBe('Activity');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a deep-linked value survives tabs that arrive in two steps', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(TabsFallbackHarness, {
			items: ['Overview'],
			initialValue: 'Settings',
			onValueChange
		});
		expectNothingSelected();

		await rerender({ items: ['Overview', 'Settings'] });

		expectSelected(1);
		expect(bound()).toBe('Settings');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('tabs loaded after mount select the first enabled tab without a report', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(TabsFallbackHarness, { items: [], onValueChange });

		await rerender({ items: [{ label: 'Overview', disabled: true }, 'Activity'] });

		expectSelected(1);
		expect(bound()).toBe('Activity');
		expect(onValueChange).not.toHaveBeenCalled();
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

	test('an external value naming no tab is kept and selects nothing', async () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: ['Overview', 'Activity', 'Settings'],
			initialValue: 'Activity',
			externalValue: 'Archive',
			onValueChange
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Set external value' }));

		expectNothingSelected();
		expect(bound()).toBe('Archive');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a narrower tab list bound to the same value does not undo a pick it cannot show', async () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: ['A', 'B', 'C', 'D'],
			mirrorItems: ['A', 'B', 'C'],
			initialValue: 'A',
			onValueChange
		});

		await fireEvent.click(tabsRoot().getByRole('tab', { name: 'D' }));
		await tick();

		expectSelected(3);
		expect(bound()).toBe('D');
		const mirrorTabs = within(screen.getByTestId('mirror')).getAllByRole('tab');
		for (const tab of mirrorTabs) expect(tab).toHaveAttribute('aria-selected', 'false');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ value: 'D', reason: 'user' })
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

	test('removing the last enabled tab hides every panel, including the one that was shown', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(TabsFallbackHarness, {
			items: [{ label: 'Drafts', disabled: true }, 'Review', { label: 'Archived', disabled: true }],
			onValueChange
		});
		expectSelected(1);

		await rerender({
			items: [
				{ label: 'Drafts', disabled: true },
				{ label: 'Archived', disabled: true }
			]
		});

		expectNothingSelected();
		expect(bound()).toBe('Review');
		expect(onValueChange).not.toHaveBeenCalled();

		await rerender({ items: [{ label: 'Drafts', disabled: true }, 'Review'] });

		expectSelected(1);
	});

	test('with no selectable tab the api cannot reveal a disabled panel', async () => {
		renderInTheme(TabsFallbackHarness, {
			items: [
				{ label: 'Overview', disabled: true },
				{ label: 'Activity', disabled: true }
			],
			initialValue: 'Archive'
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Api go to 0' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Api next' }));

		expectNothingSelected();
		expect(bound()).toBe('Archive');
	});

	test('api next and previous step over disabled tabs', async () => {
		const onValueChange = vi.fn();
		renderInTheme(TabsFallbackHarness, {
			items: ['Overview', { label: 'Activity', disabled: true }, 'Settings'],
			initialValue: 'Overview',
			onValueChange
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Api next' }));

		expectSelected(2);
		expect(bound()).toBe('Settings');
		expect(onValueChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ value: 'Settings', index: 2, reason: 'user' })
		);

		await fireEvent.click(screen.getByRole('button', { name: 'Api next' }));
		expectSelected(2);

		await fireEvent.click(screen.getByRole('button', { name: 'Api previous' }));

		expectSelected(0);
		expect(bound()).toBe('Overview');
		expect(onValueChange).toHaveBeenCalledTimes(2);
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
