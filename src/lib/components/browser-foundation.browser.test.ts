// Foundation checks that need a real engine: tab order, layout-dependent tabbability, panel
// placement and keyboard focus movement, in Chromium and WebKit. They pin today's behaviour that
// the focus (CX-3), positioning (CX-5) and keyboard-list (CX-7) work builds on; jsdom reports no
// layout, so each of them fails or is meaningless there.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { getTabbableElements, isTabbable } from '$lib/utils/focus.js';
import { tab, tabSequence } from '$lib/testing/browser.test-helper.js';
import BrowserFoundationHarness from './BrowserFoundationHarness.test.svelte';

const mount = (scenario: 'tabbables' | 'popover' | 'dialog' | 'menu') =>
	render(BrowserFoundationHarness, { props: { scenario } });

const byText = (text: string) =>
	Array.from(document.querySelectorAll<HTMLElement>('button, a, input, [tabindex]')).find(
		(element) => element.textContent?.trim() === text || element.getAttribute('aria-label') === text
	)!;

test('isTabbable rejects elements hidden by layout, which jsdom cannot see', async () => {
	await mount('tabbables');
	expect(isTabbable(byText('Visible'))).toBe(true);
	expect(isTabbable(byText('Display none'))).toBe(false);
	expect(isTabbable(byText('Visibility hidden'))).toBe(false);
	expect(isTabbable(byText('Inside display contents'))).toBe(true);
	expect(isTabbable(byText('Clipped to zero height'))).toBe(true);
});

test('getTabbableElements matches the order real Tab presses visit', async () => {
	await mount('tabbables');
	const region = page.getByTestId('region').element() as HTMLElement;
	const before = page.getByTestId('before').element() as HTMLElement;
	const visited = await tabSequence(before, region);
	expect(visited.map((element) => element.textContent?.trim() || element.ariaLabel)).toEqual([
		'Visible',
		'Link',
		'Text field',
		'Pro',
		'Inside display contents',
		'Custom stop',
		'Clipped to zero height'
	]);
	expect(getTabbableElements(region)).toEqual(visited);
});

test('a bottom-start popover sits below its trigger, start-aligned, and Escape returns focus', async () => {
	await mount('popover');
	const trigger = page.getByRole('button', { name: 'Open popover' });
	await userEvent.click(trigger);
	const inside = page.getByRole('button', { name: 'Inside popover' });
	await expect.element(inside).toBeVisible();
	const triggerBox = trigger.element().getBoundingClientRect();
	const panel = inside.element().closest('dialog')!.firstElementChild as HTMLElement;
	await expect
		.poll(() => {
			const box = panel.getBoundingClientRect();
			return {
				below: box.top >= triggerBox.bottom && box.top - triggerBox.bottom <= 16,
				startAligned: Math.abs(box.left - triggerBox.left) <= 1
			};
		})
		.toEqual({ below: true, startAligned: true });

	await userEvent.keyboard('{Escape}');
	await expect.element(inside).not.toBeInTheDocument();
	expect(document.activeElement).toBe(trigger.element());
});

test('a modal dialog keeps Tab and Shift+Tab inside it', async () => {
	await mount('dialog');
	await userEvent.click(page.getByRole('button', { name: 'Open dialog' }));
	const dialog = page.getByRole('dialog');
	await expect.element(dialog).toBeVisible();
	const first = page.getByLabelText('First field').element();
	await expect.poll(() => document.activeElement).toBe(first);
	for (let step = 0; step < 6; step += 1) {
		await tab();
		expect(dialog.element().contains(document.activeElement)).toBe(true);
	}
	first.focus();
	await tab({ shift: true });
	expect(dialog.element().contains(document.activeElement)).toBe(true);
	expect(document.activeElement).not.toBe(first);
});

test('menu items take focus from real arrow, Home and End keys', async () => {
	await mount('menu');
	const trigger = page.getByRole('button', { name: 'Actions' });
	(trigger.element() as HTMLElement).focus();
	await userEvent.keyboard('{Enter}');
	await expect.element(page.getByRole('menu')).toBeVisible();
	const focused = () => document.activeElement?.textContent?.trim();
	await userEvent.keyboard('{ArrowDown}');
	await expect.poll(focused).toBe('Archive');
	await userEvent.keyboard('{ArrowDown}');
	await expect.poll(focused).toBe('Copy');
	await userEvent.keyboard('{End}');
	await expect.poll(focused).toBe('Delete');
	await userEvent.keyboard('{Home}');
	await expect.poll(focused).toBe('Archive');
});
