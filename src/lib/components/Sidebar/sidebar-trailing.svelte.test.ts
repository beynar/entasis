// A row's trailing parts (label, badge, chevron, pinned action) share the row's end without
// overlapping: the badge is in the row's flow, the action's room is reserved where it shows, and a
// group label stops before its pinned actions. Geometry itself is measured in the browser; these
// pin the structure and the classes that produce it.
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import type { SidebarGroup } from './sidebar.props.js';
import SidebarSurfaceHarness from './SidebarSurfaceHarness.test.svelte';

const row = (label: string) => {
	const element = screen.getByText(label).closest('[data-sidebar="menu-button"]');
	if (!(element instanceof HTMLElement)) throw new Error(`no row for ${label}`);
	return element;
};

describe('row badge and action', () => {
	const items: SidebarGroup[] = [
		{
			label: 'Workspace',
			items: [
				{ label: 'Inbox', href: '#inbox', icon: 'I', badge: 12 },
				{ label: 'Drafts', href: '#drafts', icon: 'D', badge: 4, action: { label: 'More' } },
				{ label: 'Sent', href: '#sent', icon: 'S', action: { label: 'More sent' } },
				{
					label: 'Projects',
					icon: 'P',
					badge: 2,
					action: { label: 'Project actions' },
					items: [{ label: 'Atlas', href: '#atlas' }]
				}
			]
		}
	];

	test('the badge follows the label inside the row, so the label truncates before it', () => {
		render(SidebarSurfaceHarness, { props: { items } });

		const inbox = row('Inbox');
		const badge = inbox.querySelector('[data-sidebar="menu-badge"]');
		expect(badge).toHaveTextContent('12');
		expect(badge?.previousElementSibling).toHaveTextContent('Inbox');
		expect(inbox.className).not.toContain('pe-layout-lg');
	});

	test('a badge makes way for its row action from md up and sits before it below md', () => {
		render(SidebarSurfaceHarness, { props: { items } });

		const drafts = row('Drafts');
		const badge = drafts.querySelector('[data-sidebar="menu-badge"]') as HTMLElement;
		for (const swap of [
			'md:group-hover/menu-row:opacity-0',
			'md:group-focus-within/menu-row:opacity-0',
			'md:group-has-[[data-sidebar=menu-action]_[aria-expanded=true]]/menu-row:opacity-0'
		]) {
			expect(badge.className.split(' ')).toContain(swap);
		}
		const classes = drafts.className.split(' ');
		expect(classes).toContain('max-md:pe-layout-lg');
		expect(classes).not.toContain('pe-layout-lg');
	});

	test('a row without a badge, or with a chevron after it, keeps the action room at every width', () => {
		render(SidebarSurfaceHarness, { props: { items } });

		expect(row('Sent').className.split(' ')).toContain('pe-layout-lg');
		expect(row('Projects').className.split(' ')).toContain('pe-layout-lg');
	});
});

describe('group label with pinned actions', () => {
	test('publishes the actions width and stops the label text before it', () => {
		render(SidebarSurfaceHarness, {
			props: {
				items: [
					{
						label: 'Products',
						action: [
							{ icon: '+', label: 'Add product', size: 'large' },
							{ icon: 'x', label: 'Reorder products' }
						],
						items: [{ label: 'Launchpad', href: '#launchpad', icon: 'L' }]
					}
				]
			}
		});

		const group = document.querySelector('[data-sidebar="group"]') as HTMLElement;
		expect(group.style.getPropertyValue('--sidebar-group-actions-width')).toBe(
			'calc(var(--control-height-lg) + var(--control-height-md) + 1 * var(--space-micro))'
		);
		const label = group.querySelector('[data-sidebar="group-label"]') as HTMLElement;
		expect(label.firstElementChild).toHaveTextContent('Products');
		expect(label.className).toContain(
			'pe-[calc(var(--sidebar-group-actions-width)+var(--space-md))]'
		);
	});
});
