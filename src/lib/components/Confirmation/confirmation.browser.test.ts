// Escape on a Confirmation stacked over a Dialog, with real focus and `inert` (Chromium and WebKit).
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { webkitOnLinux } from '$lib/testing/browser.test-helper.js';
import FocusScopeHarness from '../../utils/FocusScopeHarness.test.svelte';

const element = (name: string) => page.getByRole('button', { name }).element() as HTMLElement;

// Skipped in WebKit on Linux: on the GitHub runners this overlay never settles (see webkitOnLinux).
test.skipIf(webkitOnLinux)(
	'Escape on a Confirmation over a Dialog returns focus, with a ring, to the button that asked',
	async () => {
		render(FocusScopeHarness, { props: { scenario: 'stacked' } });
		element('Open parent').focus();
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('dialog', { name: 'Parent' })).toBeVisible();

		const ask = element('Delete');
		ask.focus();
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('alertdialog')).toBeVisible();
		await expect.poll(() => document.activeElement).toBe(element('Keep'));

		await userEvent.keyboard('{Escape}');
		await expect.poll(() => document.querySelector('[role="alertdialog"]')).toBeNull();
		// The Dialog beneath stays open and takes focus back to the button that opened the question.
		await expect.element(page.getByRole('dialog', { name: 'Parent' })).toBeVisible();
		await expect.poll(() => document.activeElement).toBe(ask);
		expect(ask.matches(':focus-visible')).toBe(true);
	}
);
