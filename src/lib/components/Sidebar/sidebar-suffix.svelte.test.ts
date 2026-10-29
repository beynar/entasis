// A row's `suffix` sits beside its link or button, never inside it: it may hold its own controls,
// which never follow the row's href nor toggle it, and Tab reaches them right after the row. The
// row reserves its width, keeps it visible before the action, and is described by it. Geometry is
// measured in the browser (`sidebar.browser.test.ts`); these pin the structure.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import type { SidebarApi } from './sidebar.props.js';
import SidebarSuffixHarness from './SidebarSuffixHarness.test.svelte';
import SidebarSubItemHarness from './SidebarSubItemHarness.test.svelte';
import { createRawSnippet } from 'svelte';

// A text icon (« D ») and a badge join the accessible name around the label.
const link = (name: string) => screen.getByRole('link', { name: new RegExp(name) });
const suffixOf = (row: HTMLElement) => {
	const id = row.getAttribute('aria-describedby');
	const suffix = id ? document.getElementById(id) : null;
	if (!suffix) throw new Error('no suffix');
	return suffix;
};

describe('row suffix', () => {
	test('renders beside the row link, not inside it, and receives the Sidebar API', () => {
		const onsuffixapi = vi.fn();
		render(SidebarSuffixHarness, { props: { onsuffixapi } });

		const row = link('Dossiers');
		const suffix = suffixOf(row);
		expect(suffix).toHaveAttribute('data-sidebar', 'menu-suffix');
		expect(suffix).toHaveTextContent('20');
		expect(row).not.toContainElement(suffix);
		expect(row.nextElementSibling).toBe(suffix);
		expect(onsuffixapi).toHaveBeenCalled();
		const api = onsuffixapi.mock.calls[0]?.[0] as SidebarApi;
		expect(api.displayState).toBe('expanded');
		expect(typeof api.toggle).toBe('function');
	});

	test('receives its row entry, so one snippet serves rows built as data', () => {
		render(SidebarSuffixHarness);
		expect(link('Factures')).toHaveAccessibleDescription('7 · Factures');
		expect(link('Devis')).toHaveAccessibleDescription('2 · Devis');
		expect(suffixOf(link('Devis'))).toHaveAttribute('data-sidebar', 'menu-sub-suffix');
	});

	test('describes the row link, so the row reads with its suffix', () => {
		render(SidebarSuffixHarness);
		expect(link('Dossiers')).toHaveAccessibleDescription('20');
		expect(link('Archive')).toHaveAccessibleDescription('Publié');
	});

	test('a sub entry renders its suffix beside its link', () => {
		render(SidebarSuffixHarness);
		const row = link('Archive');
		const suffix = suffixOf(row);
		expect(suffix).toHaveAttribute('data-sidebar', 'menu-sub-suffix');
		expect(row).not.toContainElement(suffix);
		expect(row.nextElementSibling).toBe(suffix);
	});

	test('a click or a keypress inside it never follows nor toggles the row', async () => {
		const onrowclick = vi.fn();
		const onsuffixclick = vi.fn();
		render(SidebarSuffixHarness, { props: { onrowclick, onsuffixclick } });

		const [trigger] = screen.getAllByRole('button', { name: 'Page menu' });
		await fireEvent.click(trigger!);
		expect(onsuffixclick).toHaveBeenCalledOnce();
		await fireEvent.keyDown(trigger!, { key: 'Enter' });
		await fireEvent.keyDown(trigger!, { key: ' ' });
		await fireEvent.click(screen.getByTestId('count'));
		expect(onrowclick).not.toHaveBeenCalled();
		expect(trigger!.closest('a, [data-sidebar="menu-button"]')).toBeNull();
		expect(location.hash).not.toBe('#clients');
	});

	test('Tab reaches its controls right after the row, before the action', async () => {
		render(SidebarSuffixHarness);

		// Every control in document order, which is the Tab order: no positive tabindex is set.
		const tabbables = [
			...document.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
		].filter((element) => !element.closest('[inert]') && element.tabIndex >= 0);
		const at = tabbables.indexOf(link('Clients'));
		expect(tabbables[at + 1]).toHaveAccessibleName('Page menu');
		expect(tabbables[at + 2]).toHaveAccessibleName('Client actions');
		const draft = tabbables.indexOf(link('Brouillons partagés avec toute l’équipe'));
		expect(tabbables[draft + 1]).toHaveAccessibleName('Page menu');
		expect(tabbables[draft + 2]).toHaveAccessibleName('Draft actions');
	});

	test('with an action it stays before the action at every width, and the badge stays put', () => {
		render(SidebarSuffixHarness);

		const row = link('Clients');
		const classes = row.className.split(' ');
		expect(classes).toContain(
			'pe-[calc(var(--sidebar-suffix-width,40%)+var(--layout-space-lg)+var(--space-sm))]'
		);
		expect(classes.some((name) => name.startsWith('max-md:pe-'))).toBe(false);

		const suffix = suffixOf(row);
		expect(suffix.className.split(' ')).toContain('end-[var(--layout-space-lg)]');
		expect(suffix.className).not.toMatch(/opacity-0/);
		const badge = row.querySelector('[data-sidebar="menu-badge"]') as HTMLElement;
		expect(badge.className).not.toMatch(/group-hover\/menu-row:opacity-0/);
		expect(suffix.nextElementSibling).toHaveAttribute('data-sidebar', 'menu-action');
	});

	test('without an action it ends on the row’s own end padding', () => {
		render(SidebarSuffixHarness);

		const row = link('Dossiers');
		expect(row.className.split(' ')).toContain(
			'pe-[calc(var(--sidebar-suffix-width,40%)+var(--space-md)+var(--space-sm))]'
		);
		const suffix = suffixOf(row);
		expect(suffix.className.split(' ')).toContain('end-[var(--space-md)]');
		expect(suffix.className.split(' ')).toContain('max-w-[40%]');
	});

	test('the measured width is reserved through --sidebar-suffix-width', async () => {
		const observers: { callback: ResizeObserverCallback; target?: Element }[] = [];
		const Original = window.ResizeObserver;
		window.ResizeObserver = class {
			entry: (typeof observers)[number];
			constructor(callback: ResizeObserverCallback) {
				this.entry = { callback };
				observers.push(this.entry);
			}
			observe(target: Element) {
				this.entry.target = target;
			}
			unobserve() {}
			disconnect() {}
		} as unknown as typeof ResizeObserver;
		try {
			render(SidebarSuffixHarness);
			const row = link('Dossiers');
			const suffix = suffixOf(row);
			const observer = observers.find((entry) => entry.target === suffix);
			observer!.callback(
				[{ borderBoxSize: [{ inlineSize: 24, blockSize: 20 }] } as unknown as ResizeObserverEntry],
				{} as ResizeObserver
			);
			await Promise.resolve();
			await Promise.resolve();
			expect(row.parentElement?.style.getPropertyValue('--sidebar-suffix-width')).toBe('24px');
		} finally {
			window.ResizeObserver = Original;
		}
	});

	test('is hidden and inert in icon-collapsed mode, and no longer describes the row', () => {
		render(SidebarSuffixHarness, { props: { displayState: 'collapsed' } });

		const row = link('Dossiers');
		expect(row).not.toHaveAttribute('aria-describedby');
		const suffix = row.parentElement?.querySelector('[data-sidebar="menu-suffix"]');
		expect((suffix as HTMLElement).inert).toBe(true);
		expect(suffix).toHaveAttribute('aria-hidden', 'true');
		expect(suffix?.className).toContain('group-data-[collapsible=icon]:hidden');
	});

	test('a collapsed sub row keeps its suffix out of reach', () => {
		const suffix = createRawSnippet(() => ({ render: () => '<button type="button">Go</button>' }));
		render(SidebarSubItemHarness, {
			props: { sub: { label: 'Archive', href: '#archive', suffix }, iconCollapsed: true }
		});
		const row = link('Archive');
		expect(row).not.toHaveAttribute('aria-describedby');
		const wrapper = row.parentElement?.querySelector('[data-sidebar="menu-sub-suffix"]');
		expect((wrapper as HTMLElement).inert).toBe(true);
		expect(wrapper).toHaveAttribute('aria-hidden', 'true');
	});
});
