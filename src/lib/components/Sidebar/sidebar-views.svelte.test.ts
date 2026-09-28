// Sidebar views: named panel contents addressed by key. A row with `view` opens one, a nested
// view opens on a back row to its parent, and header and footer props inherit down the parent
// chain. Views that share their header and footer keep one panel and only the menu slides; a view
// that changes them slides the whole panel as one page.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import SidebarViewsHarness from './SidebarViewsHarness.test.svelte';
import type { SidebarView } from './sidebar.props.js';
import { resolveSlot, viewChain } from './sidebar.views.svelte.js';

const views: Record<string, SidebarView> = {
	settings: {
		label: 'Settings',
		search: { placeholder: 'Search settings' },
		items: [
			{
				label: 'Settings',
				items: [
					{ label: 'Members', icon: 'M', view: 'members' },
					{ label: 'Billing', icon: 'B', view: 'billing' }
				]
			}
		]
	},
	members: {
		label: 'Members',
		parent: 'settings',
		items: [{ items: [{ label: 'People', icon: 'P', href: '#people' }] }]
	},
	billing: {
		label: 'Billing',
		parent: 'settings',
		search: null,
		footerButton: { icon: 'Z', title: 'Upgrade' },
		items: [{ items: [{ label: 'Invoices', icon: 'I', href: '#invoices' }] }]
	},
	workspace: { items: [{ items: [{ label: 'Overview', icon: 'O', href: '#overview' }] }] }
};

// String icons render as text, so a row's name is "<icon> <label>": match on the label.
// The mocked Web Animations API finishes on the next macrotask, which lets outros leave.
const settle = () => new Promise((resolve) => setTimeout(resolve, 10));
const layers = (kind: 'panel' | 'body') =>
	Array.from(
		document.querySelectorAll<HTMLElement>(
			`[data-slot="sidebar-view-stage"][data-view-kind="${kind}"] > *`
		)
	);
const bodyView = () => layers('body').map((layer) => layer.dataset.view);

describe('sidebar views', () => {
	test('opens on the first view; a view row opens its view and reports the change', async () => {
		const onViewChange = vi.fn();
		render(SidebarViewsHarness, { props: { views, onViewChange } });
		expect(bodyView()).toEqual(['settings']);

		await fireEvent.click(screen.getByRole('button', { name: /Members$/ }));
		await settle();
		expect(onViewChange).toHaveBeenCalledExactlyOnceWith('members');
		expect(bodyView()).toEqual(['members']);
		// A nested view opens on a row back to its parent, named like a back button.
		expect(screen.getByRole('button', { name: 'Back, Settings' })).toHaveAttribute(
			'data-sidebar-view-target',
			'settings'
		);
	});

	test('focus goes to the back row going deeper, and to the opening row coming back', async () => {
		render(SidebarViewsHarness, { props: { views } });
		const members = screen.getByRole('button', { name: /Members$/ });
		members.focus();
		await fireEvent.click(members);
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Back, Settings' }));

		await settle();
		await fireEvent.click(screen.getByRole('button', { name: 'Back, Settings' }));
		expect(document.activeElement).toBe(screen.getByRole('button', { name: /Members$/ }));
	});

	test('views sharing their chrome slide only the menu; a chrome change slides the whole panel', async () => {
		render(SidebarViewsHarness, { props: { views } });
		expect(screen.getByPlaceholderText('Search settings')).toBeInTheDocument();

		// Members sets no header or footer prop: it keeps Settings' panel, and only the menu moves.
		await fireEvent.click(screen.getByRole('button', { name: /Members$/ }));
		expect(layers('panel')).toHaveLength(1);
		expect(layers('body')).toHaveLength(2);
		await settle();
		expect(screen.getByPlaceholderText('Search settings')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Back, Settings' }));
		await settle();
		// Billing clears the search and swaps the footer button: the whole panel slides as one.
		await fireEvent.click(screen.getByRole('button', { name: /Billing$/ }));
		expect(layers('panel')).toHaveLength(2);
		await settle();
		expect(layers('panel')).toHaveLength(1);
		expect(screen.queryByPlaceholderText('Search settings')).not.toBeInTheDocument();
		expect(document.querySelector('[data-slot="sidebar-footer"]')).toHaveTextContent('Upgrade');
	});

	test('a controlled view follows the prop without reporting a change', async () => {
		const onViewChange = vi.fn();
		const { rerender } = render(SidebarViewsHarness, {
			props: { views, view: 'members', onViewChange }
		});
		expect(bodyView()).toEqual(['members']);

		await rerender({ views, view: 'workspace', onViewChange });
		await settle();
		expect(bodyView()).toEqual(['workspace']);
		expect(onViewChange).not.toHaveBeenCalled();
		// A top-level view has nothing to go back to.
		expect(screen.queryByRole('button', { name: /^Back/ })).not.toBeInTheDocument();
	});

	test('the parent chain stops at a missing parent or a cycle', () => {
		expect(viewChain(views, 'members')).toEqual(['members', 'settings']);
		expect(viewChain({ a: { parent: 'b' }, b: { parent: 'a' } }, 'a')).toEqual(['a', 'b']);
		expect(viewChain({ a: { parent: 'gone' } }, 'a')).toEqual(['a']);
	});

	test('a slot resolves to the nearest owner in the chain, the Sidebar when none sets it', () => {
		const root = { headerButton: { title: 'Acme' } };
		expect(resolveSlot(views, 'members', 'search', root)).toEqual({
			owner: 'settings',
			value: { placeholder: 'Search settings' }
		});
		// `null` is an owner too: Billing clears the search Settings set.
		expect(resolveSlot(views, 'billing', 'search', root)).toEqual({
			owner: 'billing',
			value: undefined
		});
		expect(resolveSlot(views, 'billing', 'headerButton', root)).toEqual({
			owner: null,
			value: { title: 'Acme' }
		});
	});
});
