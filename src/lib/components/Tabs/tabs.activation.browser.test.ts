// Tabs keyboard activation and RTL direction in real engines (Chromium and WebKit).
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Component } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame } from '$lib/testing/browser.test-helper.js';
import ThemeProviderHarness from '../Theme/ThemeProviderHarness.test.svelte';
import TabsActivationHarness from './TabsActivationHarness.test.svelte';

const items = ['One', 'Two', 'Three'];
const mount = (props: Record<string, unknown>) =>
	render(ThemeProviderHarness, {
		props: {
			component: TabsActivationHarness as unknown as Component<Record<string, unknown>>,
			items,
			...props
		}
	});
const tabNamed = (name: string) =>
	page.getByRole('tab', { name, exact: true }).element() as HTMLElement;
const selected = () =>
	Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"]')).map((node) =>
		node.textContent?.trim()
	);
const root = () => document.querySelector<HTMLElement>('[data-activation-direction]')!;

afterEach(() => {
	document.documentElement.removeAttribute('dir');
});

describe('manual activation', () => {
	test('arrow keys follow focus and select by default', async () => {
		const onMounted = vi.fn();
		await mount({ onMounted });
		tabNamed('One').focus();

		await userEvent.keyboard('{ArrowRight}{ArrowRight}');
		await nextFrame();

		expect(document.activeElement).toBe(tabNamed('Three'));
		expect(selected()).toEqual(['Three']);
	});

	test('activateOnFocus false moves focus only; Enter and Space select', async () => {
		const onMounted = vi.fn();
		await mount({ activateOnFocus: false, onMounted });
		tabNamed('One').focus();
		onMounted.mockClear();

		await userEvent.keyboard('{ArrowRight}{ArrowRight}');
		await nextFrame();

		expect(document.activeElement).toBe(tabNamed('Three'));
		expect(selected()).toEqual(['One']);
		// No panel was created for the tabs the arrows passed over.
		expect(onMounted).not.toHaveBeenCalled();

		await userEvent.keyboard('{Enter}');
		await nextFrame();
		expect(selected()).toEqual(['Three']);
		expect(onMounted).toHaveBeenCalledExactlyOnceWith('Three');

		await userEvent.keyboard('{Home}');
		expect(selected()).toEqual(['Three']);
		await userEvent.keyboard(' ');
		await nextFrame();
		expect(selected()).toEqual(['One']);
	});

	test('a click still selects with manual activation', async () => {
		await mount({ activateOnFocus: false });

		await userEvent.click(tabNamed('Two'));
		await nextFrame();

		expect(selected()).toEqual(['Two']);
	});
});

describe('activation direction', () => {
	test('a right-to-left document mirrors the horizontal direction', async () => {
		document.documentElement.setAttribute('dir', 'rtl');
		await mount({});

		await userEvent.click(tabNamed('Three'));
		await nextFrame();
		expect(root().getAttribute('data-activation-direction')).toBe('left');

		await userEvent.click(tabNamed('One'));
		await nextFrame();
		expect(root().getAttribute('data-activation-direction')).toBe('right');
	});
});
