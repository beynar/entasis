// Handler composition (CX-4): a row's own `onclick` runs first on the native event, and
// `event.preventDefault()` there skips the built-in behaviour.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import SidebarHandlersHarness from './SidebarHandlersHarness.test.svelte';
import SidebarViewsHarness from './SidebarViewsHarness.test.svelte';
import type { SidebarView } from './sidebar.props.js';

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const activityItem = (label: string) =>
	Array.from(
		document.querySelectorAll<HTMLElement>('[data-slot="sidebar-activity-bar-item"]')
	).find((item) => item.getAttribute('aria-label') === label || item.textContent?.includes(label))!;

describe('sidebar handler composition', () => {
	test('an activity bar item whose onclick calls preventDefault does not report a selection', async () => {
		const onSelect = vi.fn();
		const onItemClick = vi.fn((event: MouseEvent) => event.preventDefault());
		render(SidebarHandlersHarness, { props: { onItemClick, onSelect } });

		await fireEvent.click(activityItem('Files'));
		expect(onItemClick).toHaveBeenCalledOnce();
		expect(onSelect).not.toHaveBeenCalled();

		// An item with no handler of its own still selects.
		await fireEvent.click(activityItem('Search'));
		expect(onSelect).toHaveBeenCalledExactlyOnceWith('Search');
	});

	test('an activity bar item runs its onclick before the selection', async () => {
		const order: string[] = [];
		const onSelect = vi.fn(() => order.push('select'));
		const onItemClick = vi.fn(() => order.push('item'));
		render(SidebarHandlersHarness, { props: { onItemClick, onSelect } });

		await fireEvent.click(activityItem('Files'));
		expect(order).toEqual(['item', 'select']);
	});

	test('a view row whose onclick calls preventDefault keeps the current view', async () => {
		const onViewChange = vi.fn();
		const guarded = vi.fn((event: MouseEvent) => event.preventDefault());
		const views: Record<string, SidebarView> = {
			home: {
				items: [
					{
						items: [
							{ label: 'Guarded', icon: 'G', view: 'other', onclick: guarded },
							{ label: 'Open', icon: 'O', view: 'other' }
						]
					}
				]
			},
			other: { parent: 'home', items: [{ items: [{ label: 'Inside', icon: 'I', href: '#in' }] }] }
		};
		render(SidebarViewsHarness, { props: { views, onViewChange } });

		await fireEvent.click(screen.getByRole('button', { name: /Guarded$/ }));
		await settle();
		expect(guarded).toHaveBeenCalledOnce();
		expect(onViewChange).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('button', { name: /Open$/ }));
		await waitFor(() => expect(onViewChange).toHaveBeenCalledExactlyOnceWith('other'));
	});
});
