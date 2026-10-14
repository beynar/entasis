// What a crawler (and a visitor before hydration) gets from the server: the bar always, and with
// `keepMounted` every panel's links under `hidden`. Without it a closed panel is not rendered.
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import NavigationMenuHarness from './NavigationMenuHarness.test.svelte';

describe('NavigationMenu on the server', () => {
	test('renders the nav, its disclosure buttons and plain links', () => {
		const { body } = render(NavigationMenuHarness, { props: {} });
		expect(body).toContain('<nav');
		expect(body).toContain('aria-label="Main"');
		expect(body).toMatch(
			/aria-expanded="false"[^>]*data-slot="navigation-menu-trigger"|data-slot="navigation-menu-trigger"[^>]*aria-expanded="false"/
		);
		expect(body).toContain('href="#pricing"');
		// Closed panels are not in the HTML.
		expect(body).not.toContain('href="#components"');
	});

	test('keepMounted puts every panel in the HTML, hidden', () => {
		const { body } = render(NavigationMenuHarness, { props: { menu: { keepMounted: true } } });
		for (const href of ['#components', '#blocks', '#about']) {
			expect(body).toContain(`href="${href}"`);
		}
		const panel = body.match(/<div[^>]*id="[^"]*-panel-0"[^>]*>/)?.[0] ?? '';
		expect(panel).toContain('hidden');
		// The popup is hidden as a whole while nothing is open.
		expect(body).toMatch(
			/<div[^>]*data-side="bottom"[^>]*hidden|<div[^>]*hidden[^>]*data-side="bottom"/
		);
	});

	test('an open defaultValue is server-rendered open', () => {
		const { body } = render(NavigationMenuHarness, {
			props: { menu: { defaultValue: 'company' } }
		});
		expect(body).toContain('href="#about"');
		expect(body).not.toContain('href="#components"');
	});
});
