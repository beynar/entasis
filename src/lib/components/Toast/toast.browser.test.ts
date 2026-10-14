// Toast with real input in Chromium and WebKit (DF-2, DF-4): keyboard focus pauses timers, a
// click does not, focus follows a dismissed toast, and the hover safe area does not outlive the
// toasts that made it.
import { afterEach, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './ToasterHarness.test.svelte';
import { toast, type Toaster } from './toast.state.svelte.js';

const toaster = () => window.toaster as Toaster;
const items = () => [...document.querySelectorAll<HTMLElement>('section[data-live-region] > li')];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(async () => {
	toast.dismiss();
	await sleep(500);
	await userEvent.hover(document.documentElement, { position: { x: 600, y: 400 } });
});

test('keyboard focus holds the timers of a toast and blur releases them', async () => {
	// Something to Tab from and back to: the region itself is not a tab stop.
	// An input: WebKit does not Tab to buttons by default.
	const before = document.createElement('input');
	document.body.prepend(before);
	await render(Harness, { props: { position: 'bottom-right' } });
	const shown = toast.info({ title: 'Focus me', duration: 60_000 });
	await expect.poll(() => items().length).toBe(1);
	await sleep(100);

	before.focus();
	await userEvent.keyboard('{Tab}');
	expect(document.activeElement).toBe(items()[0]);
	await expect.poll(() => shown.timer?.heldBy).toEqual(['focus']);
	const remaining = shown.timer!.remaining;
	await sleep(300);
	expect(shown.timer!.remaining).toBe(remaining);

	await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
	expect(document.activeElement).toBe(before);
	await expect.poll(() => shown.timer?.paused).toBe(false);
	before.remove();
});

test('a mouse click that focuses a toast does not hold its timer', async () => {
	await render(Harness, { props: { position: 'bottom-right' } });
	const shown = toast.info({ title: 'Click me', duration: 60_000 });
	await expect.poll(() => items().length).toBe(1);
	await userEvent.click(items()[0], { position: { x: 20, y: 10 } });
	expect(document.activeElement).toBe(items()[0]);
	// The pointer is over the toast, so only the hover holds it.
	expect(shown.timer?.heldBy).toEqual(['hover']);
	await userEvent.hover(document.documentElement, { position: { x: 5, y: 5 } });
	await expect.poll(() => shown.timer?.paused, { timeout: 2000 }).toBe(false);
	expect(document.activeElement).toBe(items()[0]);
});

test('closing the last toast with the mouse leaves no focus hold on the next toast', async () => {
	await render(Harness, { props: { position: 'bottom-right' } });
	toast.info({ title: 'One', duration: 60_000 });
	await expect.poll(() => items().length).toBe(1);
	await userEvent.click(items()[0].querySelector('button')!);
	await expect.poll(() => items().length).toBe(0);
	await userEvent.hover(document.documentElement, { position: { x: 5, y: 5 } });
	await sleep(100);
	expect(toaster().regionFocused).toBe(false);

	const next = toast.info({ title: 'Two', duration: 60_000 });
	await expect.poll(() => items().length).toBe(1);
	await expect.poll(() => next.timer?.paused).toBe(false);
	expect(next.timer?.heldBy).toEqual([]);
});

test('dismissing the focused toast with the keyboard moves focus to the next toast', async () => {
	await render(Harness, { props: { position: 'bottom-right' } });
	toast.info({ title: 'Older', duration: false });
	toast.info({ title: 'Newer', duration: false });
	await expect.poll(() => items().length).toBe(2);

	await userEvent.keyboard('{Tab}');
	expect(document.activeElement).toBe(items()[0]);
	// The close button of the older toast (WebKit does not Tab to buttons by default).
	items()[0].querySelector('button')!.focus();
	await userEvent.keyboard('{Enter}');
	await expect.poll(() => items().length).toBe(1);
	expect(document.activeElement).toBe(items()[0]);
	expect(items()[0].textContent).toContain('Newer');
});

for (const [name, dismissTogether, hoverFirst] of [
	['dismissed together', true, false],
	['expiring together', false, false],
	['dismissed together under the pointer', true, true]
] as const) {
	test(`the hover safe area does not outlive two toasts ${name}`, async () => {
		await render(Harness, { props: { position: 'bottom-center' } });
		const options = { duration: dismissTogether ? (false as const) : 300 };
		const a = toast.info({ title: 'One', ...options });
		const b = toast.info({ title: 'Two', ...options });
		await expect.poll(() => items().length).toBe(2);
		if (hoverFirst) {
			await userEvent.hover(items()[1]);
			await expect.poll(() => toaster().hovering).toBe('bottom-center');
		}
		if (dismissTogether) {
			a.remove();
			b.remove();
		}
		await expect.poll(() => items().length, { timeout: 3000 }).toBe(0);
		await sleep(900);
		expect(toaster().hovering).toBeNull();

		toast.info({ title: 'Probe', duration: false });
		await expect.poll(() => items().length).toBe(1);
		await userEvent.hover(items()[0]);
		await expect.poll(() => toaster().hovering).toBe('bottom-center');
		// The top-left corner is far from the probe: the pointer left the stack.
		await userEvent.hover(document.documentElement, { position: { x: 5, y: 5 } });
		await expect.poll(() => toaster().hovering, { timeout: 2000 }).toBeNull();
	});
}

test('F6 moves focus into the region from anywhere, and Tab continues to the first toast', async () => {
	await render(Harness, { props: { position: 'bottom-right' } });
	toast.info({ title: 'Reach me', duration: false });
	await expect.poll(() => items().length).toBe(1);
	expect(toaster().element?.tabIndex).toBe(-1);

	await userEvent.keyboard('{F6}');
	expect(document.activeElement).toBe(toaster().element);
	await userEvent.keyboard('{Tab}');
	expect(document.activeElement).toBe(items()[0]);
});
