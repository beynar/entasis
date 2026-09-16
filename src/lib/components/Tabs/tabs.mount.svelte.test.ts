import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import TabsMountHarness from './TabsMountHarness.test.svelte';
import type { StepperMount } from '../Stepper/stepper.props.js';

const items = ['Overview', 'Timeline', 'Files'];

const panels = () => Array.from(document.querySelectorAll('[role="tabpanel"]'));
const mountedLabels = () =>
	panels()
		.map((panel) => panel.textContent?.trim() ?? '')
		.filter(Boolean);

const renderTabs = (mount?: StepperMount) =>
	render(TabsMountHarness, { props: { items, value: 'Overview', mount } });

describe('Tabs panel mounting', () => {
	test('creates only the active panel by default', () => {
		renderTabs();

		expect(panels()).toHaveLength(items.length);
		expect(mountedLabels()).toEqual(['Panel Overview']);
	});

	test('eager creates every panel up front', () => {
		renderTabs('eager');

		expect(mountedLabels()).toEqual(['Panel Overview', 'Panel Timeline', 'Panel Files']);
	});

	test('lazy destroys a panel once it is left', async () => {
		const { rerender } = renderTabs('lazy');

		await rerender({ items, value: 'Timeline', mount: 'lazy' });

		expect(mountedLabels()).toEqual(['Panel Timeline']);
	});

	test('once keeps a panel after it has been activated', async () => {
		const { rerender } = renderTabs('once');

		expect(mountedLabels()).toEqual(['Panel Overview']);

		await rerender({ items, value: 'Timeline', mount: 'once' });

		expect(mountedLabels()).toEqual(['Panel Overview', 'Panel Timeline']);
	});
});

describe('Tabs panel exposure', () => {
	for (const mount of ['eager', 'lazy', 'once'] as const)
		test(`hides and inerts the inactive panels in ${mount} mode`, () => {
			renderTabs(mount);

			// jsdom does not reflect `inert` to an attribute, so the property is what to assert on.
			const isInert = (panel: Element) =>
				(panel as HTMLElement).inert || panel.hasAttribute('inert');
			const [active, ...inactive] = panels();
			expect(active).not.toHaveAttribute('hidden');
			expect(isInert(active)).toBe(false);
			for (const panel of inactive) {
				expect(panel).toHaveAttribute('hidden');
				expect(isInert(panel)).toBe(true);
			}
			expect(document.querySelectorAll('[role="tabpanel"]:not([hidden])')).toHaveLength(1);
		});

	test('keeps every tab pointing at a panel that exists', () => {
		renderTabs();

		for (const tab of screen.getAllByRole('tab')) {
			const controlled = tab.getAttribute('aria-controls');
			expect(controlled).toBeTruthy();
			expect(document.getElementById(controlled as string)).not.toBeNull();
		}
	});
});
