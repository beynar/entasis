// Sidebar on the shared foundations (Base UI adoption plan, lane R4, SB-1). Collapsible groups,
// inline submenus and tree branches are disclosure panels: the toggle controls the panel by id,
// the panel carries data-open / data-closed and data-entering / data-exiting, and a closing
// panel stays inert until its collapse finishes. Collapsed to icons, a row whose press only
// reveals its submenu opens its entries in a flyout of links instead of doing nothing.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import type { SidebarGroup } from './sidebar.props.js';
import SidebarRowsHarness from './SidebarRowsHarness.test.svelte';

const onGuide = vi.fn();
const items = (): SidebarGroup[] => [
	{
		label: 'Projects',
		collapsible: true,
		items: [{ label: 'Atlas', href: '#atlas', icon: 'A' }]
	},
	{
		label: 'Pages',
		items: [
			{
				label: 'Planning',
				icon: 'P',
				items: [
					{ label: 'Roadmap', href: '#roadmap', isActive: true },
					{ label: 'Specs', href: '#specs', disabled: true },
					{ label: 'Guide', onclick: onGuide }
				]
			},
			{ label: 'Docs', icon: 'D', href: '#docs', items: [{ label: 'Intro', href: '#intro' }] }
		]
	},
	{
		label: 'Files',
		tree: [{ label: 'src', icon: 'S', children: [{ label: 'index.ts', href: '#index' }] }]
	}
];

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const controlled = (trigger: HTMLElement) => {
	const id = trigger.getAttribute('aria-controls');
	return id ? document.getElementById(id) : null;
};

describe('disclosure panels', () => {
	test('a collapsible group toggle controls its content, which closes through its exit', async () => {
		render(SidebarRowsHarness, { props: { items: items() } });
		const toggle = button('Projects');
		const content = controlled(toggle);
		expect(content).toHaveAttribute('data-sidebar', 'group-content');
		expect(content).toHaveAttribute('data-open');
		expect(content).not.toHaveAttribute('data-closed');

		await fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		// Still on screen while it collapses, closed and out of reach.
		expect(content).toHaveAttribute('data-closed');
		expect(content).toHaveAttribute('data-exiting');
		expect(content).toHaveAttribute('inert');
		await waitFor(() => expect(content).not.toBeInTheDocument());
		expect(toggle).not.toHaveAttribute('aria-controls');

		await fireEvent.click(toggle);
		const reopened = controlled(toggle);
		expect(reopened).toHaveAttribute('data-open');
		await waitFor(() => expect(reopened).not.toHaveAttribute('data-entering'));
		expect(screen.getByRole('link', { name: /Atlas/ })).toBeInTheDocument();
	});

	test('an inline submenu is a disclosure panel of its row', async () => {
		render(SidebarRowsHarness, { props: { items: items() } });
		const row = button(/Planning/);
		expect(row).toHaveAttribute('aria-expanded', 'false');
		expect(row).not.toHaveAttribute('aria-controls');

		await fireEvent.click(row);
		const submenu = controlled(row);
		expect(submenu).toHaveAttribute('data-sidebar', 'menu-sub');
		expect(submenu).toHaveAttribute('data-open');
		expect(submenu).toContainElement(screen.getByRole('link', { name: 'Roadmap' }));

		await fireEvent.click(row);
		expect(submenu).toHaveAttribute('data-exiting');
		expect(submenu).toHaveAttribute('aria-hidden', 'true');
		await waitFor(() => expect(submenu).not.toBeInTheDocument());
	});

	test("a link row's submenu toggle controls the submenu", async () => {
		render(SidebarRowsHarness, { props: { items: items() } });
		const toggle = screen
			.getAllByRole('button', { name: 'Toggle submenu' })
			.find((element) => element.closest('li')?.textContent?.includes('Docs'))!;
		await fireEvent.click(toggle);
		expect(controlled(toggle)).toContainElement(screen.getByRole('link', { name: 'Intro' }));
	});

	test('a tree branch is a disclosure panel of its folder row', async () => {
		render(SidebarRowsHarness, { props: { items: items() } });
		const folder = button(/src/);
		expect(folder).not.toHaveAttribute('aria-controls');
		await fireEvent.click(folder);
		const branch = controlled(folder);
		expect(branch).toHaveAttribute('data-open');
		expect(branch).toContainElement(screen.getByRole('link', { name: /index\.ts/ }));
		await fireEvent.click(folder);
		await waitFor(() => expect(branch).not.toBeInTheDocument());
	});
});

describe('collapsed submenu flyout', () => {
	const collapsed = async () => {
		render(SidebarRowsHarness, { props: { items: items(), displayState: 'collapsed' } });
		await tick();
		return button(/Planning/);
	};

	test('the row is a disclosure button opening a named nav of its entries', async () => {
		const row = await collapsed();
		expect(row).toHaveAttribute('aria-expanded', 'false');
		expect(row).not.toHaveAttribute('aria-haspopup', 'menu');

		await fireEvent.click(row);
		await waitFor(() => expect(row).toHaveAttribute('aria-expanded', 'true'));
		expect(controlled(row)).toBeInTheDocument();
		const nav = await screen.findByRole('navigation', { name: 'Planning' });
		expect(nav.querySelector('[role="menu"], [role="menuitem"]')).toBeNull();
		const roadmap = screen.getByRole('link', { name: 'Roadmap' });
		expect(roadmap).toHaveAttribute('href', '#roadmap');
		expect(roadmap).toHaveAttribute('aria-current', 'page');
		// A disabled entry stays visible without a destination.
		expect(nav.querySelector('[aria-disabled="true"]')?.textContent).toContain('Specs');
		expect(screen.queryByRole('link', { name: 'Specs' })).toBeNull();
	});

	test('a press on an entry runs its handler and closes the flyout', async () => {
		onGuide.mockClear();
		const row = await collapsed();
		await fireEvent.click(row);
		await fireEvent.click(await screen.findByRole('button', { name: 'Guide' }));
		expect(onGuide).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(row).toHaveAttribute('aria-expanded', 'false'));
	});

	test('Escape closes it and returns focus to the row', async () => {
		const row = await collapsed();
		row.focus();
		await fireEvent.click(row);
		const roadmap = await screen.findByRole('link', { name: 'Roadmap' });
		await fireEvent.keyDown(roadmap, { key: 'Escape' });
		await waitFor(() => expect(row).toHaveAttribute('aria-expanded', 'false'));
		expect(row).toHaveFocus();
	});

	test('a link row keeps navigating when collapsed', async () => {
		await collapsed();
		expect(screen.getByRole('link', { name: /Docs/ })).toHaveAttribute('href', '#docs');
	});
});
