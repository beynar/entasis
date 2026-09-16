// Surface laws: the header region's order, the active-state axis, the icon tile, the group's
// action row, and the trailing action a header button can carry. Each is a prop the template
// needed and could not express before (see src/routes/templates/tasks-dashboard/FINDINGS.md).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import type { SidebarApi, SidebarMenuButtonItem } from './sidebar.props.js';
import SidebarSurfaceHarness from './SidebarSurfaceHarness.test.svelte';

const headerRegion = () => {
	const node = document.querySelector('[data-slot="sidebar-header"]');
	if (!(node instanceof HTMLElement)) throw new Error('sidebar header not rendered');
	return node;
};
const activeRow = () => {
	const node = document.querySelector('[data-sidebar="menu-button"][data-active="true"]');
	if (!(node instanceof HTMLElement)) throw new Error('no active row rendered');
	return node;
};

describe('sidebar header order', () => {
	test('renders the header snippet before the header button, search and header menu', () => {
		render(SidebarSurfaceHarness, {
			props: {
				headerButton: { icon: 'W', title: 'Acme', onclick: () => {} } as SidebarMenuButtonItem
			}
		});

		const order = Array.from(headerRegion().children).map((child) =>
			child.getAttribute('data-slot')
		);
		expect(order[0]).toBe(null);
		expect(headerRegion().firstElementChild).toBe(screen.getByTestId('custom-header'));
		// Everything the library owns comes after the consumer's own card, no `-order-*` needed.
		expect(order).toContain('sidebar-search');
		expect(order.indexOf('sidebar-search')).toBeGreaterThan(0);
	});
});

describe('sidebar activeVariant', () => {
	test('defaults to the soft selected recipe', () => {
		render(SidebarSurfaceHarness);

		const row = activeRow();
		expect(row).toHaveAttribute('data-active-variant', 'soft');
		expect(row.className).toContain('data-[active-variant=soft]:data-active:bg-selected-muted');
	});

	test('outline paints a bordered surface card and solid the loud recipe', () => {
		const outline = render(SidebarSurfaceHarness, { props: { activeVariant: 'outline' } });
		expect(activeRow()).toHaveAttribute('data-active-variant', 'outline');
		expect(activeRow().className).toContain('data-[active-variant=outline]:data-active:bg-surface');
		expect(activeRow().className).toContain(
			'data-[active-variant=outline]:data-active:border-neutral-muted'
		);
		outline.unmount();

		render(SidebarSurfaceHarness, { props: { activeVariant: 'solid' } });
		expect(activeRow()).toHaveAttribute('data-active-variant', 'solid');
		expect(activeRow().className).toContain('data-[active-variant=solid]:data-active:bg-selected');
	});
});

describe('sidebar menu entry icon', () => {
	test('iconVariant tile paints a role-tinted square and a bare row keeps no wrapper', () => {
		render(SidebarSurfaceHarness);

		const tile = document.querySelector('[data-slot="sidebar-menu-icon"]');
		if (!(tile instanceof HTMLElement)) throw new Error('icon tile not rendered');
		expect(tile).toHaveAttribute('data-color', 'success');
		expect(tile.className).toContain('bg-color-muted');
		expect(tile.className).toContain('text-color-muted-readable');
		// One tile only: the untinted row must not inherit the ambient role.
		expect(document.querySelectorAll('[data-slot="sidebar-menu-icon"]')).toHaveLength(1);
	});
});

describe('sidebar group action', () => {
	test('accepts an array and sizes each trigger from its own descriptor', () => {
		render(SidebarSurfaceHarness);

		const region = document.querySelector('[data-sidebar="group-action"]');
		if (!(region instanceof HTMLElement)) throw new Error('group action not rendered');
		const triggers = region.querySelectorAll('button');
		expect(triggers).toHaveLength(2);
		expect(screen.getByRole('button', { name: 'Add project' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Reorder projects' })).toBeInTheDocument();
		// `size: 'large'` on the first descriptor, the Sidebar's own size on the second.
		const [first, second] = Array.from(region.children) as HTMLElement[];
		expect(first.className).toContain('h-control-lg');
		expect(second.className).toContain('h-control-md');
	});
});

describe('sidebar header button', () => {
	test('a trailing action descriptor renders its own control beside the row', async () => {
		const trailingClick = vi.fn();
		render(SidebarSurfaceHarness, {
			props: {
				headerButton: {
					icon: 'W',
					title: 'Acme',
					subtitle: 'Operations',
					trailing: { icon: 'C', label: 'Collapse sidebar', onclick: trailingClick },
					onclick: () => {}
				} as SidebarMenuButtonItem
			}
		});

		const trailing = screen.getByRole('button', { name: 'Collapse sidebar' });
		const row = screen.getByRole('button', { name: /Acme/ });
		// Siblings, not nested: a button inside a button would be invalid and unclickable.
		expect(row.contains(trailing)).toBe(false);
		await fireEvent.click(trailing);
		expect(trailingClick).toHaveBeenCalledTimes(1);
		// The descriptor handler is `onclick(event, api)`, so `api.toggle()` is reachable from it.
		const [, api] = trailingClick.mock.calls[0] as [MouseEvent, SidebarApi];
		expect(typeof api.toggle).toBe('function');
	});

	test('onclick receives the SidebarApi beside the event', async () => {
		let received: SidebarApi | undefined;
		render(SidebarSurfaceHarness, {
			props: {
				headerButton: {
					icon: 'W',
					title: 'Acme',
					onclick: (_event, api) => {
						received = api;
					}
				} as SidebarMenuButtonItem
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: /Acme/ }));
		expect(typeof received?.toggle).toBe('function');
		expect(received?.displayState).toBe('expanded');
	});
});
