// Law 4 in the server markup for the snippet triggers entasis renders itself: a Sidebar activity
// square, a Tabbar tab with a menu, a ToggleMenu menu or overflow button and a Menu
// submenu row announce their popup (`aria-haspopup`, `aria-expanded`) before the page hydrates.
// `popover.reference` only writes them once the client attaches it. A Sidebar flyout row is left
// out: it follows disclosure semantics (`aria-expanded` only), which it already renders.
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Menu from '../Menu/Menu.svelte';
import SidebarActivityPopoverHarness from '../Sidebar/SidebarActivityPopoverHarness.test.svelte';
import Tabbar from '../Tabbar/Tabbar.svelte';
import ThemeProviderHarness from '../Theme/ThemeProviderHarness.test.svelte';
import ToggleMenu from '../ToggleMenu/ToggleMenu.svelte';

/** The opening tags of the `tag` elements whose attributes include `marker`. */
const openingTags = (body: string, tag: string, marker: string) =>
	[...body.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))]
		.map((match) => match[0])
		.filter((candidate) => candidate.includes(marker));
const openingTag = (body: string, tag: string, marker: string) =>
	openingTags(body, tag, marker)[0] ?? '';

const inTheme = (component: unknown, props: Record<string, unknown>) =>
	render(ThemeProviderHarness, {
		props: { component: component as Component<Record<string, unknown>>, ...props }
	}).body;

const announcesPopup = (tag: string, haspopup: string) => {
	expect(tag).toContain(`aria-haspopup="${haspopup}"`);
	expect(tag).toContain('aria-expanded="false"');
};

describe('built-in snippet triggers on the server', () => {
	test('a Sidebar activity square that opens a popover', () => {
		const { body } = render(SidebarActivityPopoverHarness, { props: {} });
		announcesPopup(openingTag(body, 'button', 'aria-label="Notifications"'), 'dialog');
	});

	test('a Tabbar tab with a menu', () => {
		const body = inTheme(Tabbar, {
			items: ['Inbox', { label: 'Sort', menu: ['Newest', 'Oldest'] }]
		});
		const [plain, withMenu] = openingTags(body, 'button', 'data-slot="tabbar-tab"');
		expect(plain).not.toContain('aria-haspopup');
		announcesPopup(withMenu ?? '', 'menu');
	});

	test('a ToggleMenu menu button and its overflow button', () => {
		const body = inTheme(ToggleMenu, {
			label: 'Format',
			items: [
				{
					type: 'menu',
					label: 'Insert',
					children: 'Insert',
					menu: [{ type: 'option', title: 'Table' }]
				}
			]
		});
		announcesPopup(openingTag(body, 'button', 'aria-label="Insert"'), 'menu');
		announcesPopup(openingTag(body, 'button', 'aria-label="More tools"'), 'menu');
	});

	test('a Menu submenu row', () => {
		const body = inTheme(Menu, {
			items: [
				{ type: 'option', title: 'Open' },
				{ type: 'submenu', title: 'Share', menu: [{ type: 'option', title: 'Email' }] }
			]
		});
		const row = [...body.matchAll(/<[a-z]+\b[^>]*role="menuitem"[^>]*>/g)]
			.map((match) => match[0])
			.find((tag) => tag.includes('data-menu-keep-open'));
		announcesPopup(row ?? '', 'menu');
	});
});
