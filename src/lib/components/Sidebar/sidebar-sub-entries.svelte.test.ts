// Submenu entries carry the row features top-level entries have: a pinned action, a role-tinted
// or tiled icon, a badge, a tooltip and classes. An entry that sets none of them renders exactly
// as before.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import type { SidebarGroup, SidebarMenuSubEntry } from './sidebar.props.js';
import { sidebarTheme } from './sidebar.theme.js';
import SidebarSubItemHarness from './SidebarSubItemHarness.test.svelte';
import SidebarSurfaceHarness from './SidebarSurfaceHarness.test.svelte';

const nested = (items: SidebarMenuSubEntry[]): SidebarGroup[] => [
	{
		label: 'Pages',
		items: [{ label: 'Planning', icon: 'P', collapsible: false, items }]
	}
];

const subRow = (label: string) => {
	const row = screen.getByText(label).closest('[data-sidebar="menu-sub-item"]');
	if (!(row instanceof HTMLElement)) throw new Error(`no submenu row for ${label}`);
	return row;
};

describe('submenu entry action', () => {
	test('renders the trigger, opens its menu, fires the item onclick, and Escape returns focus', async () => {
		const onRename = vi.fn();
		render(SidebarSurfaceHarness, {
			props: {
				items: nested([
					{
						label: 'Roadmap',
						href: '#roadmap',
						action: {
							label: 'More options for Roadmap',
							menu: [{ type: 'option', title: 'Rename', onclick: onRename }]
						}
					}
				])
			}
		});

		const row = subRow('Roadmap');
		const wrapper = row.querySelector('[data-sidebar="menu-sub-action"]');
		expect(wrapper).toHaveAttribute('data-slot', 'sidebar-menu-sub-action');
		const trigger = screen.getByRole('button', { name: 'More options for Roadmap' });
		expect(wrapper).toContainElement(trigger);
		expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');

		// Tab order: the action button comes right after its own row's link.
		const tabbable = Array.from(
			document.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
		).filter((element) => element.tabIndex >= 0);
		const link = row.querySelector('[data-sidebar="menu-sub-button"]') as HTMLElement;
		expect(tabbable.indexOf(trigger)).toBe(tabbable.indexOf(link) + 1);

		trigger.focus();
		await fireEvent.pointerDown(trigger);
		await fireEvent.click(trigger);
		await screen.findByRole('menu');
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		// An open menu keeps the action visible even without hover.
		expect(wrapper?.className).toContain('has-[[aria-expanded=true]]:opacity-100');

		await fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
		expect(onRename).toHaveBeenCalledTimes(1);

		await fireEvent.click(trigger);
		await screen.findByRole('menu');
		await fireEvent.keyDown(window, { key: 'Escape' });
		await vi.waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
		await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
	});

	test('a plain action descriptor calls its onclick with the Sidebar API', async () => {
		const onPin = vi.fn();
		render(SidebarSurfaceHarness, {
			props: {
				items: nested([
					{ label: 'Retro', href: '#retro', action: { label: 'Pin', onclick: onPin } }
				])
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
		expect(onPin).toHaveBeenCalledTimes(1);
		expect(onPin.mock.calls[0][1]).toHaveProperty('setView');
	});

	test('shows on row hover or focus from md, stays for an open menu, and reserves the row end', () => {
		render(SidebarSurfaceHarness, {
			props: { items: nested([{ label: 'Specs', href: '#specs', action: { label: 'More' } }]) }
		});

		const row = subRow('Specs');
		expect(row.className).toContain('group/menu-sub-item');
		const wrapper = row.querySelector('[data-sidebar="menu-sub-action"]') as HTMLElement;
		for (const visibility of [
			'opacity-100',
			'md:opacity-0',
			'group-hover/menu-sub-item:opacity-100',
			'group-focus-within/menu-sub-item:opacity-100',
			'has-[[aria-expanded=true]]:opacity-100'
		]) {
			expect(wrapper.className.split(' ')).toContain(visibility);
		}
		const button = row.querySelector('[data-sidebar="menu-sub-button"]') as HTMLElement;
		expect(button.className).toContain('pr-layout-lg');
	});

	test('is inert and hidden from assistive technology while the Sidebar is collapsed to icons', () => {
		render(SidebarSubItemHarness, {
			props: {
				sub: { label: 'Archive', href: '#archive', action: { label: 'More' } },
				iconCollapsed: true
			}
		});

		const wrapper = document.querySelector('[data-sidebar="menu-sub-action"]') as HTMLElement;
		expect(wrapper.inert).toBe(true);
		expect(wrapper).toHaveAttribute('aria-hidden', 'true');
	});
});

describe('submenu entry without the new fields', () => {
	test('renders exactly as before: same classes, no wrapper, badge or action', () => {
		render(SidebarSurfaceHarness, {
			props: { items: nested([{ label: 'Plain', href: '#plain', icon: 'X' }]) }
		});

		const row = subRow('Plain');
		expect(row.className).toBe('group/menu-sub-item relative');
		expect(row.children).toHaveLength(1);
		const link = row.firstElementChild as HTMLElement;
		expect(link.tagName).toBe('A');
		expect(link.className).toBe(
			sidebarTheme.subButton({ size: 'normal', activeVariant: 'soft', density: 'normal' })
		);
		expect(link.className).not.toContain('pr-layout-lg');
		expect(link.querySelector('[data-slot="sidebar-menu-icon"]')).toBeNull();
		expect(Array.from(link.children).map((child) => child.tagName)).toEqual(['SPAN', 'SPAN']);
		expect(link).not.toHaveAttribute('aria-describedby');
	});
});

describe('submenu entry parity fields', () => {
	test('iconVariant tile with iconColor paints a role-tinted square', () => {
		render(SidebarSurfaceHarness, {
			props: {
				items: nested([
					{ label: 'Q3 plan', href: '#q3', icon: 'Q', iconVariant: 'tile', iconColor: 'success' },
					{ label: 'Q4 plan', href: '#q4', icon: 'R', iconColor: 'warning' }
				])
			}
		});

		const tile = subRow('Q3 plan').querySelector('[data-slot="sidebar-menu-icon"]');
		expect(tile).toHaveAttribute('data-color', 'success');
		expect(tile?.className).toContain('bg-color-muted');
		expect(tile?.className).toContain('text-color-muted-readable');

		// A bare tint wraps the glyph too, and sizes it like the row's own icon.
		const bare = subRow('Q4 plan').querySelector('[data-slot="sidebar-menu-icon"]');
		expect(bare).toHaveAttribute('data-color', 'warning');
		expect(bare?.className).toContain('text-color');
		expect(bare?.className).toContain('[&_svg]:size-[var(--sidebar-icon-size)]');
	});

	test('badge, tooltip and class follow the top-level semantics', async () => {
		render(SidebarSurfaceHarness, {
			props: {
				items: nested([
					{
						label: 'Inbox zero',
						href: '#inbox-zero',
						badge: 3,
						tooltip: 'Three pages need review',
						class: 'italic'
					}
				])
			}
		});

		const row = subRow('Inbox zero');
		const badge = row.querySelector('[data-sidebar="menu-sub-badge"]');
		expect(badge).toHaveTextContent('3');
		const link = row.querySelector('[data-sidebar="menu-sub-button"]') as HTMLElement;
		expect(link.className).toContain('italic');
		expect(link.className).toContain('pr-layout-lg');

		await fireEvent.mouseEnter(link);
		await vi.waitFor(() =>
			expect(screen.getByRole('tooltip')).toHaveTextContent('Three pages need review')
		);
	});
});
