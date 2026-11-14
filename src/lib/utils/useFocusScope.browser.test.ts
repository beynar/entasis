// Focus return and containment with real focus, `inert` and input modality (Chromium and WebKit).
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tab, webkitOnLinux } from '$lib/testing/browser.test-helper.js';
import FocusScopeHarness from './FocusScopeHarness.test.svelte';
import FocusSurvivorHarness from './FocusSurvivorHarness.test.svelte';

type Scenario = Parameters<typeof FocusScopeHarness>[1]['scenario'];
const mount = (scenario: Scenario) => render(FocusScopeHarness, { props: { scenario } });
const element = (name: string) => page.getByRole('button', { name }).element() as HTMLElement;

describe('stacked overlays (OV-2)', () => {
	// Skipped in WebKit on Linux: on the GitHub runners this overlay never settles (see webkitOnLinux).
	test.skipIf(webkitOnLinux)(
		'a11y:dialog.stacked-restore closing a Confirmation over a Dialog returns focus, with a ring, to the button that asked',
		async () => {
			mount('stacked');
			element('Open parent').focus();
			await userEvent.keyboard('{Enter}');
			await expect.element(page.getByRole('dialog', { name: 'Parent' })).toBeVisible();
			await expect.poll(() => document.activeElement).toBe(page.getByLabelText('Name').element());

			const ask = element('Delete');
			ask.focus();
			await userEvent.keyboard('{Enter}');
			await expect.element(page.getByRole('alertdialog')).toBeVisible();
			await expect.poll(() => document.activeElement).toBe(element('Keep'));

			await userEvent.keyboard('{Enter}');
			await expect.poll(() => document.querySelector('[role="alertdialog"]')).toBeNull();
			await expect.poll(() => document.activeElement).toBe(ask);
			expect(ask.closest('[inert]')).toBeNull();
			expect(ask.matches(':focus-visible')).toBe(true);
		}
	);
});

describe('visible restore (CX-3)', () => {
	test('a dialog opened with the pointer and closed with Escape shows the focus ring on its trigger', async () => {
		mount('focus-on-close');
		await userEvent.click(page.getByRole('button', { name: 'Open dialog' }));
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
		const trigger = element('Open dialog');
		await expect.poll(() => document.activeElement).toBe(trigger);
		expect(trigger.matches(':focus-visible')).toBe(true);
	});

	// Skipped in WebKit on Linux: on the GitHub runners this overlay never settles (see webkitOnLinux).
	test.skipIf(webkitOnLinux)(
		'a disabled opener hands focus to the field that last had it',
		async () => {
			mount('disabled-opener');
			const notes = page.getByLabelText('Notes').element() as HTMLElement;
			notes.focus();
			await tab();
			expect(document.activeElement).toBe(element('Open and disable'));
			await userEvent.keyboard('{Enter}');
			await expect.element(page.getByRole('dialog')).toBeVisible();
			await userEvent.keyboard('{Escape}');
			await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
			await expect.poll(() => document.activeElement).toBe(notes);
		}
	);
});

describe('Tab containment in every engine', () => {
	test('plain Tab inside an alert dialog cycles between its buttons and never reaches the page', async () => {
		mount('stacked');
		element('Open parent').focus();
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('dialog', { name: 'Parent' })).toBeVisible();
		element('Delete').focus();
		await userEvent.keyboard('{Enter}');
		const alert = page.getByRole('alertdialog');
		await expect.element(alert).toBeVisible();
		await expect.poll(() => document.activeElement).toBe(element('Keep'));

		// Plain Tab, which WebKit on macOS would otherwise send past the buttons to <body>.
		const seen: Array<string | null> = [];
		for (let step = 0; step < 4; step += 1) {
			await userEvent.keyboard('{Tab}');
			const active = document.activeElement as HTMLElement | null;
			expect(alert.element().contains(active)).toBe(true);
			seen.push(active?.textContent?.trim() ?? null);
		}
		expect(seen).toEqual(['Remove', 'Keep', 'Remove', 'Keep']);
	});
});

describe('shadow DOM (CX-12a)', () => {
	// Skipped in WebKit on Linux: on the GitHub runners this overlay never settles (see webkitOnLinux).
	test.skipIf(webkitOnLinux)(
		'focus returns to a trigger that lives inside a shadow root',
		async () => {
			const host = document.createElement('div');
			document.body.append(host);
			const root = host.attachShadow({ mode: 'open' });
			const target = document.createElement('div');
			root.append(target);
			try {
				render(FocusScopeHarness, { target, props: { scenario: 'focus-on-close' } });
				const trigger = [...root.querySelectorAll('button')].find(
					(candidate) => candidate.textContent?.trim() === 'Open dialog'
				) as HTMLButtonElement;
				trigger.focus();
				expect(document.activeElement).toBe(host);
				expect(root.activeElement).toBe(trigger);
				// Panels portal into the shadow root they render in.
				const dialog = () => root.querySelector('[role="dialog"]');
				await userEvent.keyboard('{Enter}');
				await expect.poll(dialog).not.toBeNull();
				await expect.poll(() => root.activeElement?.closest('[role="dialog"]')).not.toBeNull();
				await userEvent.keyboard('{Escape}');
				await expect.poll(dialog).toBeNull();
				await expect.poll(() => root.activeElement).toBe(trigger);
				expect(document.activeElement).toBe(host);
			} finally {
				host.remove();
			}
		}
	);

	test.skipIf(webkitOnLinux)(
		'a modal dialog portaled into a shadow root makes the rest of that root and the light DOM around its host inert',
		async () => {
			const neighbour = document.createElement('button');
			neighbour.textContent = 'Light neighbour';
			const host = document.createElement('div');
			document.body.append(neighbour, host);
			const root = host.attachShadow({ mode: 'open' });
			const target = document.createElement('div');
			root.append(target);
			try {
				render(FocusScopeHarness, { target, props: { scenario: 'focus-on-close' } });
				const trigger = [...root.querySelectorAll('button')].find(
					(candidate) => candidate.textContent?.trim() === 'Open dialog'
				) as HTMLButtonElement;
				trigger.focus();
				const dialog = () => root.querySelector('[role="dialog"]');
				await userEvent.keyboard('{Enter}');
				await expect.poll(dialog).not.toBeNull();
				// The page inside the shadow root, beside the portaled dialog.
				await expect.poll(() => target.hasAttribute('inert')).toBe(true);
				expect(trigger.closest('[inert]')).toBe(target);
				// The light DOM beside the shadow host.
				expect(neighbour.hasAttribute('inert')).toBe(true);
				expect(host.hasAttribute('inert')).toBe(false);
				expect(dialog()?.closest('[inert]')).toBeNull();

				await userEvent.keyboard('{Escape}');
				await expect.poll(dialog).toBeNull();
				expect(target.hasAttribute('inert')).toBe(false);
				expect(neighbour.hasAttribute('inert')).toBe(false);
				await expect.poll(() => root.activeElement).toBe(trigger);
			} finally {
				host.remove();
				neighbour.remove();
			}
		}
	);
});

describe('nearest survivor', () => {
	const mountRows = (kind: 'popover' | 'dialog') =>
		render(FocusSurvivorHarness, { props: { kind } });

	test.skipIf(webkitOnLinux)(
		"a row's menu that deletes the row hands focus to the next row's control",
		async () => {
			mountRows('popover');
			element('Actions 2').focus();
			await userEvent.keyboard('{Enter}');
			await expect.poll(() => document.activeElement).toBe(element('Delete 2'));
			await userEvent.keyboard('{Enter}');
			await expect
				.poll(() => document.querySelector('li:nth-child(2)')?.textContent)
				.toContain('Row 3');
			await expect.poll(() => document.activeElement).toBe(element('Actions 3'));
		}
	);

	test.skipIf(webkitOnLinux)('deleting the last row hands focus to the row before it', async () => {
		mountRows('popover');
		element('Actions 3').focus();
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => document.activeElement).toBe(element('Delete 3'));
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => document.querySelectorAll('li').length).toBe(2);
		await expect.poll(() => document.activeElement).toBe(element('Actions 2'));
	});

	test.skipIf(webkitOnLinux)(
		"a row's dialog that deletes the row hands focus to the next row's control",
		async () => {
			mountRows('dialog');
			element('Remove 1').focus();
			await userEvent.keyboard('{Enter}');
			await expect.element(page.getByRole('dialog')).toBeVisible();
			element('Confirm 1').focus();
			await userEvent.keyboard('{Enter}');
			await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
			await expect.poll(() => document.activeElement).toBe(element('Remove 2'));
			expect(element('Remove 2').matches(':focus-visible')).toBe(true);
		}
	);
});
