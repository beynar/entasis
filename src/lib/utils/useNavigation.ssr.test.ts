// Server HTML already holds the single roving tab stop (law 7): a keyboard user who tabs into a
// list before hydration lands on the selected item, or the first enabled one, and nowhere else.
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Tabbar from '../components/Tabbar/Tabbar.svelte';
import SegmentedControl from '../components/SegmentedControl/SegmentedControl.svelte';
import ToggleButtonGroup from '../components/ToggleButtonGroup/ToggleButtonGroup.svelte';
import ThemeProviderHarness from '../components/Theme/ThemeProviderHarness.test.svelte';
import TabsFallbackHarness from '../components/Tabs/TabsFallbackHarness.test.svelte';
import RadioInput from '../components/Form/RadioInput/RadioInput.svelte';
import MenuBar from '../components/MenuBar/MenuBar.svelte';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs.svelte';
import ToggleMenu from '../components/ToggleMenu/ToggleMenu.svelte';
import CalendarMonthYearPicker from '../components/Form/Calendar/CalendarMonthYearPicker.svelte';
import TagsInput from '../components/Form/TagsInput/TagsInput.svelte';
import SidebarActivityPopoverHarness from '../components/Sidebar/SidebarActivityPopoverHarness.test.svelte';

/** The tabindex of each item: the opening tags carrying `marker` (a role or `aria-pressed`). */
const tabIndexes = (body: string, marker: string) =>
	(body.match(new RegExp(`<(?:button|a)[^>]*${marker}[^>]*>`, 'g')) ?? []).map(
		(tag) => tag.match(/\stabindex="(-?\d+)"/)?.[1] ?? null
	);

const inTheme = (component: unknown, props: Record<string, unknown>) =>
	render(ThemeProviderHarness, {
		props: { component: component as Component<Record<string, unknown>>, ...props }
	}).body;

describe('one tab stop in server HTML', () => {
	test('Tabs puts it on the selected tab', () => {
		const body = inTheme(TabsFallbackHarness, {
			items: ['Overview', 'Activity', 'Settings'],
			defaultValue: 'Activity'
		});
		expect(tabIndexes(body, 'role="tab"')).toEqual(['-1', '0', '-1']);
	});

	test('Tabbar skips a disabled first tab', () => {
		const { body } = render(Tabbar, {
			props: { items: [{ label: 'Drafts', disabled: true }, 'Inbox', 'Sent'] }
		});
		expect(tabIndexes(body, 'role="tab"')).toEqual(['-1', '0', '-1']);
	});

	test('ToggleButtonGroup puts it on the pressed radio', () => {
		const body = inTheme(ToggleButtonGroup, {
			label: 'Alignment',
			type: 'single',
			items: [
				{ value: 'left', children: 'Left' },
				{ value: 'center', children: 'Center' },
				{ value: 'right', children: 'Right' }
			],
			defaultValue: 'right'
		});
		expect(tabIndexes(body, 'role="radio"')).toEqual(['-1', '-1', '0']);
	});

	test('ToggleButtonGroup falls back to the first enabled button when nothing is pressed', () => {
		const body = inTheme(ToggleButtonGroup, {
			label: 'Formatting',
			items: [
				{ value: 'bold', children: 'Bold', disabled: true },
				{ value: 'italic', children: 'Italic' },
				{ value: 'underline', children: 'Underline' }
			]
		});
		expect(tabIndexes(body, 'aria-pressed')).toEqual(['-1', '0', '-1']);
	});

	test('SegmentedControl puts it on the selected radio, and nowhere when disabled', () => {
		const items = [
			{ value: 'list', label: 'List' },
			{ value: 'grid', label: 'Grid' }
		];
		expect(
			tabIndexes(inTheme(SegmentedControl, { items, defaultValue: 'grid' }), 'role="radio"')
		).toEqual(['-1', '0']);
		expect(
			tabIndexes(
				inTheme(SegmentedControl, { items, defaultValue: 'grid', disabled: true }),
				'role="radio"'
			)
		).toEqual(['-1', '-1']);
	});

	test('RadioInput puts it on the checked radio, else the first enabled one', () => {
		const items = [
			{ value: 's', label: 'Small', disabled: true },
			{ value: 'm', label: 'Medium' },
			{ value: 'l', label: 'Large' }
		];
		expect(
			tabIndexes(inTheme(RadioInput, { label: 'Size', items, value: 'l' }), 'role="radio"')
		).toEqual(['-1', '-1', '0']);
		expect(tabIndexes(inTheme(RadioInput, { label: 'Size', items }), 'role="radio"')).toEqual([
			'-1',
			'0',
			'-1'
		]);
	});

	test('MenuBar puts it on the first enabled menu', () => {
		const body = inTheme(MenuBar, {
			menus: [
				{ label: 'File', disabled: true, items: [{ type: 'option', title: 'New' }] },
				{ label: 'Edit', items: [{ type: 'option', title: 'Undo' }] },
				{ label: 'View', items: [{ type: 'option', title: 'Zoom' }] }
			]
		});
		expect(tabIndexes(body, 'role="menuitem"')).toEqual(['-1', '0', '-1']);
	});

	test('Breadcrumbs puts it on the first link, never on the current page', () => {
		const body = inTheme(Breadcrumbs, {
			items: [
				{ label: 'Home', href: '/' },
				{ label: 'Docs', href: '/docs' },
				{ label: 'Guide', active: true }
			]
		});
		expect(tabIndexes(body, 'role="link"')).toEqual(['0', '-1']);
		expect(body.match(/<span[^>]*aria-current="page"[^>]*>/)?.[0]).toContain('tabindex="-1"');
	});

	test('ToggleMenu puts it on the first tool, across groups', () => {
		const body = inTheme(ToggleMenu, {
			label: 'Format',
			items: [
				{
					type: 'group',
					items: [
						{ value: 'bold', label: 'Bold', children: 'B' },
						{ value: 'italic', label: 'Italic', children: 'I' }
					]
				},
				{ type: 'toggle', label: 'Code', children: 'C', value: false },
				{
					type: 'radio-group',
					label: 'Align',
					value: 'left',
					items: [
						{ value: 'left', label: 'Left', children: 'L' },
						{ value: 'right', label: 'Right', children: 'R' }
					]
				},
				{ type: 'menu', label: 'Insert', children: 'Insert', menu: [] }
			]
		});
		// Every tool of the rail, in order; the overflow button is not in the list until it shows.
		const rail = body.slice(0, body.indexOf('data-overflow'));
		expect(tabIndexes(rail, 'aria-label="')).toEqual(['0', '-1', '-1', '-1', '-1', '-1']);
	});

	test('the Sidebar activity bar puts it on the active square', () => {
		const { body } = render(SidebarActivityPopoverHarness, { props: {} });
		expect(tabIndexes(body, 'data-sidebar="activity-bar-item"')).toEqual(['0', '-1']);
	});

	test('the Calendar month and year pickers put it on the current month and year', () => {
		const body = inTheme(CalendarMonthYearPicker, {
			id: 'picker',
			currentMonth: 4,
			currentYear: 2026,
			minDate: new Date(2025, 0, 1),
			maxDate: new Date(2027, 11, 31)
		});
		const months = tabIndexes(body, 'data-picker-column="month"');
		const years = tabIndexes(body, 'data-picker-column="year"');
		expect(months.indexOf('0')).toBe(4);
		expect(months.filter((value) => value === '0')).toHaveLength(1);
		expect(years).toEqual(['-1', '0', '-1']);
	});

	test('TagsInput puts it on the first remove button', () => {
		const body = inTheme(TagsInput, { label: 'Tags', value: ['red', 'green', 'blue'] });
		expect(tabIndexes(body, 'data-tag=')).toEqual(['0', '-1', '-1']);
	});
});
