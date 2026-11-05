// Every component that draws a link from a prop: what would run code is not a link, and anything else
// still is, an app's own scheme and a `data:` download included.
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Breadcrumbs from './Breadcrumbs/Breadcrumbs.svelte';
import Button from './Button/Button.svelte';
import Card from './Card/Card.svelte';
import Chip from './Chip/Chip.svelte';
import LinksHarness from './LinksHarness.test.svelte';
import LinkPreview from './LinkPreview/LinkPreview.svelte';
import MenuOption from './MenuOption/MenuOption.svelte';
import MetadataList from './MetadataList/MetadataList.svelte';
import NavigationMenu from './NavigationMenu/NavigationMenu.svelte';
import Pagination from './Pagination/Pagination.svelte';
import Sidebar from './Sidebar/Sidebar.svelte';
import Tabbar from './Tabbar/Tabbar.svelte';

type Case = [name: string, component: unknown, props: (href: string) => Record<string, unknown>];

const CASES: Case[] = [
	['Button', Button, (href) => ({ href })],
	['Card', Card, (href) => ({ href })],
	['Chip', Chip, (href) => ({ href })],
	['MenuOption', MenuOption, (href) => ({ href, title: 'Row' })],
	['LinkPreview', LinkPreview, (href) => ({ href })],
	['Breadcrumbs', Breadcrumbs, (href) => ({ items: [{ label: 'Crumb', href }, { label: 'End' }] })],
	['NavigationMenu', NavigationMenu, (href) => ({ items: [{ label: 'Nav', href }] })],
	['Pagination', Pagination, (href) => ({ totalPages: 3, getHref: () => href })],
	['Sidebar row', Sidebar, (href) => ({ items: [{ items: [{ label: 'Row', href }] }] })],
	[
		'Sidebar sub row',
		Sidebar,
		(href) => ({
			items: [{ items: [{ label: 'Parent', collapsible: false, items: [{ label: 'Sub', href }] }] }]
		})
	],
	['Sidebar tree', Sidebar, (href) => ({ items: [{ tree: [{ label: 'Node', href }] }] })],
	['Tabbar', Tabbar, (href) => ({ items: [{ label: 'Tab', href }] })],
	[
		'MetadataList',
		MetadataList,
		(href) => ({ items: [{ label: 'Site', type: 'url', value: 'x', href }] })
	]
];

const draw = (component: unknown, props: Record<string, unknown>) =>
	render(LinksHarness, { props: { component, props } as never }).body;

describe.each(CASES)('%s', (_, component, props) => {
	test.each([
		'javascript:alert(1)',
		' JaVa\tScRiPt:alert(1)',
		'vbscript:msgbox(1)',
		'data:text/html,x',
		'data:image/svg+xml,x'
	])('%j is not followed', (href) => {
		const body = draw(component, props(href));
		expect(body).not.toMatch(/href="[^"]*(?:script:|data:)/i);
	});

	test.each([
		'/dashboard',
		'https://example.com/a',
		'mailto:a@example.com',
		'myapp://open/a',
		'file:///a/report.pdf',
		'data:text/plain,notes'
	])('%s is a link', (href) => {
		expect(draw(component, props(href))).toContain(`href="${href}"`);
	});
});

describe('what a refused address falls back to', () => {
	const REFUSED = 'javascript:alert(1)';

	test('a Button is a button', () => {
		const body = draw(Button, { href: REFUSED });
		expect(body).toMatch(/^(?:<!--.*?-->)*<button/);
		expect(body).not.toContain('<a ');
		// A link that lost its address must not start submitting the form around it.
		expect(body).toContain('type="button"');
	});

	test('a Card is not a link', () => {
		expect(draw(Card, { href: REFUSED })).not.toContain('<a ');
	});

	test('a MenuOption is a button', () => {
		expect(draw(MenuOption, { href: REFUSED, title: 'Row' })).toContain('<button');
	});

	test('a Breadcrumbs item is a button', () => {
		const body = draw(Breadcrumbs, {
			items: [{ label: 'Crumb', href: REFUSED }, { label: 'End' }]
		});
		expect(body).toContain('Crumb');
		expect(body).toContain('<button');
	});

	test('a Sidebar row is a button', () => {
		const body = draw(Sidebar, { items: [{ items: [{ label: 'Row', href: REFUSED }] }] });
		expect(body).toContain('Row');
		expect(body).toContain('<button');
		expect(body).not.toContain('script:');
	});
});
