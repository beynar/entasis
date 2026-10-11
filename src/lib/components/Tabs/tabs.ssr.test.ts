import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Tabbar from '../Tabbar/Tabbar.svelte';
import ThemeProviderHarness from '../Theme/ThemeProviderHarness.test.svelte';
import TabsFallbackHarness from './TabsFallbackHarness.test.svelte';

const tabTags = (body: string) => body.match(/<(?:button|a)[^>]*role="tab"[^>]*>/g) ?? [];
const selectedIds = (body: string) =>
	tabTags(body)
		.filter((tag) => tag.includes('aria-selected="true"'))
		.map((tag) => tag.match(/\sid="([^"]+)"/)?.[1]);

const renderTabs = (props: Record<string, unknown>) =>
	render(ThemeProviderHarness, {
		props: {
			component: TabsFallbackHarness as unknown as Component<Record<string, unknown>>,
			...props
		}
	});

// The fallback must already be in the server markup: hydration only writes it back.
describe('server-rendered fallback', () => {
	test('Tabbar marks the first enabled tab, with its static indicator', () => {
		const { body } = render(Tabbar, {
			props: { id: 'ssr', items: [{ label: 'Drafts', disabled: true }, 'Inbox'] }
		});

		expect(selectedIds(body)).toEqual(['ssr-tab-1']);
		const inbox = body.slice(body.indexOf('id="ssr-tab-1"'));
		expect(inbox.slice(0, inbox.indexOf('</button>'))).toContain('data-slot="tabbar-indicator"');
	});

	test('Tabs shows the panel of the tab it marks for an unknown defaultValue', () => {
		const { body } = renderTabs({
			items: [{ label: 'Overview', disabled: true }, 'Activity'],
			defaultValue: 'Gone'
		});

		const [selected] = selectedIds(body);
		expect(selected).toMatch(/-tabs-tab-1$/);
		const activePanel = body.match(/<div[^>]*data-step-active="true"[^>]*>/)?.[0] ?? '';
		expect(activePanel).toContain(`aria-labelledby="${selected}"`);
		expect(activePanel).toContain('role="tabpanel"');
	});

	test('Tabs marks no tab and shows no panel for a bound value naming no tab', () => {
		const { body } = renderTabs({ items: ['Overview', 'Activity'], initialValue: 'Gone' });

		expect(selectedIds(body)).toEqual([]);
		expect(body).not.toContain('data-step-active="true"');
		expect(body).not.toContain('Panel 0');
		expect(body).toContain('<output>Gone</output>');
	});
});
