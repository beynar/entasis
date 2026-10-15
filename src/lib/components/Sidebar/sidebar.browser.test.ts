// Sidebar rows in a real browser (Base UI adoption plan, lane R4, SB-1): menus, flyouts and
// tooltips open toward the page from either screen edge and in either reading direction, and a
// collapsed row's flyout of links takes Tab like NavigationMenu's panels: in from the open
// trigger, out past the last link (closing it), back with Shift+Tab.
import { beforeEach, describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { animationsSettled, tab } from '$lib/testing/browser.test-helper.js';
import type { SidebarGroup, SidebarMenuSide } from './sidebar.props.js';
import SidebarRowsHarness from './SidebarRowsHarness.test.svelte';

const items = (menuSide?: SidebarMenuSide): SidebarGroup[] => [
	{
		label: 'Pages',
		items: [
			{
				label: 'Planning',
				icon: 'P',
				items: [
					{ label: 'Roadmap', href: '#roadmap' },
					{ label: 'Guide', href: '#guide' }
				]
			},
			{ label: 'Docs', icon: 'D', href: '#docs' },
			{
				label: 'Workspace',
				icon: 'W',
				menuSide,
				menu: [{ type: 'option', title: 'Rename' }]
			}
		]
	}
];

const button = (name: RegExp) => page.getByRole('button', { name }).element() as HTMLElement;
const link = (name: RegExp) => page.getByRole('link', { name }).element() as HTMLElement;
const rect = (element: Element) => element.getBoundingClientRect();
/** The placed panel of the popup `trigger` opened. */
const panelOf = (trigger: HTMLElement) => {
	const id = trigger.getAttribute('aria-controls');
	const owner = id ? document.getElementById(id) : null;
	return owner?.closest<HTMLElement>('[data-side]') ?? owner;
};
const openMenu = async (name: RegExp) => {
	const trigger = button(name);
	await userEvent.click(trigger);
	await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true');
	await expect.poll(() => trigger.getAttribute('data-popup-side')).not.toBeNull();
	await animationsSettled();
	const panel = panelOf(trigger);
	if (!panel) throw new Error('no panel');
	return { trigger, panel };
};

// The pointer stays where the last test left it; park it away from the sidebar.
beforeEach(async () => {
	await userEvent.hover(document.documentElement, {
		position: { x: window.innerWidth - 2, y: window.innerHeight - 2 }
	});
});

describe('positions toward the page', () => {
	test('a row menu of a left sidebar opens at its inline end', async () => {
		render(SidebarRowsHarness, { props: { items: items() } });
		const { trigger, panel } = await openMenu(/Workspace/);
		expect(trigger.getAttribute('data-popup-side')).toBe('inline-end');
		expect(rect(panel).left).toBeGreaterThanOrEqual(rect(trigger).right - 1);
	});

	test('a row menu of a right sidebar opens at its inline start, on its left', async () => {
		render(SidebarRowsHarness, { props: { items: items(), side: 'right' } });
		const { trigger, panel } = await openMenu(/Workspace/);
		expect(trigger.getAttribute('data-popup-side')).toBe('inline-start');
		expect(rect(panel).right).toBeLessThanOrEqual(rect(trigger).left + 1);
	});

	test('in right-to-left a left sidebar sits on the right and its menus open on the left', async () => {
		render(SidebarRowsHarness, { props: { items: items(), dir: 'rtl' } });
		const { trigger, panel } = await openMenu(/Workspace/);
		expect(rect(trigger).left).toBeGreaterThan(500);
		expect(trigger.getAttribute('data-popup-side')).toBe('inline-end');
		expect(rect(panel).right).toBeLessThanOrEqual(rect(trigger).left + 1);
	});

	test('an explicit menuSide wins over the default', async () => {
		render(SidebarRowsHarness, { props: { items: items('bottom') } });
		const { trigger, panel } = await openMenu(/Workspace/);
		expect(trigger.getAttribute('data-popup-side')).toBe('bottom');
		expect(rect(panel).top).toBeGreaterThanOrEqual(rect(trigger).bottom - 1);
	});

	for (const [side, dir] of [
		['right', 'ltr'],
		['left', 'rtl']
	] as const) {
		test(`a collapsed ${side} sidebar in ${dir} opens its flyout and tooltips on its left`, async () => {
			render(SidebarRowsHarness, {
				props: { items: items(), side, dir, displayState: 'collapsed' }
			});
			const row = button(/Planning/);
			await userEvent.hover(row);
			const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');
			await expect.poll(() => tooltip()?.textContent).toBe('Planning');
			await animationsSettled();
			expect(rect(tooltip()!).right).toBeLessThanOrEqual(rect(row).left + 1);

			const { panel } = await openMenu(/Planning/);
			expect(row.getAttribute('data-popup-side')).toBe(
				side === 'right' ? 'inline-start' : 'inline-end'
			);
			expect(rect(panel).right).toBeLessThanOrEqual(rect(row).left + 1);
		});
	}

	test('a tooltip follows a reading direction changed after the rows rendered', async () => {
		render(SidebarRowsHarness, { props: { items: items(), displayState: 'collapsed' } });
		const row = button(/Planning/);
		// Nothing reactive changes: only the computed direction does, as with `document.dir`.
		row.closest('[dir]')!.setAttribute('dir', 'rtl');
		await expect.poll(() => rect(row).left).toBeGreaterThan(500);
		await userEvent.hover(row);
		const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');
		await expect.poll(() => tooltip()?.textContent).toBe('Planning');
		await animationsSettled();
		expect(rect(tooltip()!).right).toBeLessThanOrEqual(rect(row).left + 1);
	});
});

describe('collapsed flyout keyboard', () => {
	const mount = () =>
		render(SidebarRowsHarness, { props: { items: items(), displayState: 'collapsed' } });

	test('a11y:sidebar.flyout-tab opening keeps focus on the row; Tab walks in and out past the last link, closing it', async () => {
		mount();
		const row = button(/Planning/);
		row.focus();
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => row.getAttribute('aria-expanded')).toBe('true');
		expect(document.activeElement).toBe(row);
		expect(row).not.toHaveAttribute('aria-haspopup', 'menu');

		await tab();
		await expect.poll(() => document.activeElement).toBe(link(/Roadmap/));
		await tab();
		expect(document.activeElement).toBe(link(/Guide/));
		await tab();
		// Past the last link, focus continues after the row and the flyout closes.
		await expect.poll(() => document.activeElement).toBe(link(/Docs/));
		await expect.poll(() => row.getAttribute('aria-expanded')).toBe('false');
	});

	test('Shift+Tab from the first link returns to the row', async () => {
		mount();
		const row = button(/Planning/);
		row.focus();
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => row.getAttribute('aria-expanded')).toBe('true');
		await tab();
		await expect.poll(() => document.activeElement).toBe(link(/Roadmap/));
		await tab({ shift: true });
		expect(document.activeElement).toBe(row);
		expect(row.getAttribute('aria-expanded')).toBe('true');
	});
});
