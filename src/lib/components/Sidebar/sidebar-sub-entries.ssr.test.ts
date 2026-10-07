import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import type { SidebarGroup } from './sidebar.props.js';
import SidebarSurfaceHarness from './SidebarSurfaceHarness.test.svelte';

const items: SidebarGroup[] = [
	{
		label: 'Pages',
		items: [
			{
				label: 'Planning',
				collapsible: false,
				items: [
					{
						label: 'Roadmap',
						href: '#roadmap',
						badge: 2,
						action: {
							label: 'More options for Roadmap',
							menu: [{ type: 'option', title: 'Rename' }]
						}
					}
				]
			}
		]
	}
];

describe('submenu entry SSR', () => {
	test('the action and badge render on the server, so nothing pops in on mount', () => {
		const { body } = render(SidebarSurfaceHarness, { props: { items } });

		const row = body.match(/<li[^>]*data-sidebar="menu-sub-item"[\s\S]*?<\/li>/)?.[0] ?? '';
		expect(row).toContain('data-sidebar="menu-sub-action"');
		expect(row).toContain('aria-label="More options for Roadmap"');
		expect(row).toContain('aria-haspopup="menu"');
		expect(row).toContain('data-sidebar="menu-sub-badge"');
	});
});
