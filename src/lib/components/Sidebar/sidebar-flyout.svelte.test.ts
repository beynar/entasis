// A collapsed Sidebar's tree flyout (Base UI adoption plan, lane C4, NM-2) is a disclosure of
// links, not a menu: the trigger reports aria-expanded and aria-controls, and the panel is a named
// nav of links with nested folders as named sub-lists.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import type { SidebarTreeNode } from './sidebar.props.js';
import SidebarFlyoutHarness from './SidebarFlyoutHarness.test.svelte';

const onSettings = vi.fn();
const node: SidebarTreeNode = {
	label: 'Workspace',
	children: [
		{ label: 'Overview', href: '#overview', isActive: true },
		{ label: 'Settings', onclick: onSettings },
		{
			label: 'Teams',
			children: [
				{ label: 'Design', href: '#design' },
				{ label: 'Engineering', href: '#engineering' }
			]
		}
	]
};

const mount = async () => {
	render(SidebarFlyoutHarness, { props: { node } });
	await tick();
};
const trigger = () => screen.getByRole('button', { name: 'Workspace' });

describe('collapsed tree flyout', () => {
	test('the trigger is a disclosure button and the flyout holds no menu roles', async () => {
		await mount();
		expect(trigger()).toHaveAttribute('aria-expanded', 'false');
		expect(trigger()).not.toHaveAttribute('aria-haspopup', 'menu');
		await fireEvent.click(trigger());
		await waitFor(() => expect(trigger()).toHaveAttribute('aria-expanded', 'true'));
		const panelId = trigger().getAttribute('aria-controls');
		expect(panelId).toBeTruthy();
		expect(document.getElementById(panelId!)).toBeInTheDocument();
		expect(document.querySelector('[role="menu"], [role="menuitem"]')).toBeNull();
		expect(trigger()).not.toHaveAttribute('aria-haspopup', 'menu');
	});

	// Pending: NavigationMenu disclosure semantics mean no `aria-haspopup` at all and no `<dialog>`
	// around the nav, which needs a Popover option for a popup that is not a dialog (deferred from
	// lane R4 to the Popover owner). Switch to `test` when that option lands and the flyout uses it.
	test.fails(
		'the trigger has no aria-haspopup and the nav is not wrapped in a dialog',
		async () => {
			await mount();
			await fireEvent.click(trigger());
			await waitFor(() => expect(trigger()).toHaveAttribute('aria-expanded', 'true'));
			expect(trigger()).not.toHaveAttribute('aria-haspopup');
			const nav = await screen.findByRole('navigation', { name: 'Workspace' });
			expect(nav.closest('dialog')).toBeNull();
		}
	);

	test('the links are a named nav, nested folders named sub-lists', async () => {
		await mount();
		await fireEvent.click(trigger());
		const nav = await screen.findByRole('navigation', { name: 'Workspace' });
		expect(nav.querySelectorAll('ul')).toHaveLength(2);
		expect(screen.getByRole('list', { name: 'Teams' })).toBeInTheDocument();
		const overview = screen.getByRole('link', { name: 'Overview' });
		expect(overview).toHaveAttribute('href', '#overview');
		expect(overview).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('link', { name: 'Design' })).toHaveAttribute('href', '#design');
		// A row without a destination is a plain button.
		expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
	});

	test('a press on a row runs its handler and closes the flyout', async () => {
		onSettings.mockClear();
		await mount();
		await fireEvent.click(trigger());
		await fireEvent.click(await screen.findByRole('button', { name: 'Settings' }));
		expect(onSettings).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(trigger()).toHaveAttribute('aria-expanded', 'false'));
	});

	test('a link whose handler calls preventDefault keeps the flyout open', async () => {
		const stay: SidebarTreeNode = {
			label: 'Folder',
			children: [{ label: 'Stay', href: '#stay', onclick: (event) => event.preventDefault() }]
		};
		render(SidebarFlyoutHarness, { props: { node: stay } });
		await tick();
		await fireEvent.click(screen.getByRole('button', { name: 'Folder' }));
		await fireEvent.click(await screen.findByRole('link', { name: 'Stay' }));
		await tick();
		expect(screen.getByRole('button', { name: 'Folder' })).toHaveAttribute('aria-expanded', 'true');
	});

	test('Escape closes it and returns focus to the trigger', async () => {
		await mount();
		trigger().focus();
		await fireEvent.click(trigger());
		await screen.findByRole('navigation', { name: 'Workspace' });
		await fireEvent.keyDown(screen.getByRole('link', { name: 'Overview' }), { key: 'Escape' });
		await waitFor(() => expect(trigger()).toHaveAttribute('aria-expanded', 'false'));
		expect(trigger()).toHaveFocus();
	});
});
