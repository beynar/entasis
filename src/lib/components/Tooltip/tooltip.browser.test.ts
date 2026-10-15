// Tooltips in real browsers (Chromium and WebKit): focus rings, real pointer travel between a
// trigger and its content, restored focus and the shared surface across presses (DF-6, DF-7,
// DF-8, TT-1).
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tab } from '$lib/testing/browser.test-helper.js';
import TooltipOptionsHarness from './TooltipOptionsHarness.test.svelte';

type Props = Parameters<typeof TooltipOptionsHarness>[1];
// The mouse stays where the last test left it, possibly over a trigger of this one: park it on a
// control without a tooltip so only what a test does opens something.
async function mount(props: Props = {}) {
	const result = render(TooltipOptionsHarness, { props });
	await userEvent.hover(page.getByRole('button', { name: 'After' }));
	await wait(160);
	await expect.poll(surface).toBeNull();
	return result;
}
const trigger = (name: string) => page.getByRole('button', { name });
const element = (name: string) => trigger(name).element() as HTMLElement;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const surface = () => document.querySelector<HTMLElement>('[role="tooltip"]');

describe('focus (DF-6)', () => {
	test('Tab onto the trigger opens it and Tab away hands the surface to the next trigger', async () => {
		await mount();
		element('Before').focus();
		await tab();
		expect(document.activeElement).toBe(element('First'));
		await expect.poll(() => surface()?.textContent).toBe('First content');
		await tab();
		expect(document.activeElement).toBe(element('Second'));
		await expect.poll(() => surface()?.textContent).toBe('Second content');
		await tab();
		expect(document.activeElement).toBe(element('After'));
		await expect.poll(surface).toBeNull();
	});

	test('a11y:tooltip.focus-ring-only focus from a mouse press does not open it', async () => {
		await mount({ first: { hoverable: false } });
		await userEvent.click(trigger('First'));
		// The press closed whatever the hover had opened; focus from the press shows no ring.
		await wait(60);
		expect(element('First').matches(':focus-visible')).toBe(false);
		expect(surface()).toBeNull();
	});

	test('focus a closing dialog hands back does not open it, the next Tab onto it does', async () => {
		await mount({ dialog: true });
		element('Before').focus();
		await tab();
		await expect.poll(surface).not.toBeNull();
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await expect.poll(() => document.activeElement).toBe(element('First'));
		// The ring is back on the trigger, yet no tooltip comes with it.
		expect(element('First').matches(':focus-visible')).toBe(true);
		await wait(80);
		expect(surface()).toBeNull();

		await tab({ shift: true });
		await tab();
		expect(document.activeElement).toBe(element('First'));
		await expect.poll(() => surface()?.textContent).toBe('First content');
	});
});

describe('press and shared surface (DF-7)', () => {
	test('a press closes it, and hovering other triggers afterwards still shows their tooltips', async () => {
		await mount();
		await userEvent.hover(trigger('First'));
		await expect.poll(() => surface()?.textContent).toBe('First content');
		await userEvent.click(trigger('First'));
		await expect.poll(surface).toBeNull();

		await userEvent.hover(trigger('Second'));
		await expect.poll(() => surface()?.textContent).toBe('Second content');
		await userEvent.unhover(trigger('Second'));
		await expect.poll(surface).toBeNull();

		// The first trigger comes back once the pointer has left and entered again.
		await userEvent.hover(trigger('First'));
		await expect.poll(() => surface()?.textContent).toBe('First content');
	});

	test('closeOnClick false keeps it open through a press', async () => {
		await mount({ first: { closeOnClick: false } });
		await userEvent.click(trigger('First'));
		await expect.poll(() => surface()?.textContent).toBe('First content');
		await wait(80);
		expect(surface()).not.toBeNull();
	});
});

describe('dismissal and the shared surface', () => {
	test('Escape closes it, and hovering a trigger afterwards shows its tooltip again', async () => {
		await mount();
		await userEvent.hover(trigger('First'));
		await expect.poll(() => surface()?.textContent).toBe('First content');
		await userEvent.keyboard('{Escape}');
		await expect.poll(surface).toBeNull();

		await userEvent.hover(trigger('After'));
		await userEvent.hover(trigger('Second'));
		await expect.poll(() => surface()?.textContent).toBe('Second content');
		await userEvent.unhover(trigger('Second'));
		await expect.poll(surface).toBeNull();
		await userEvent.hover(trigger('First'));
		await expect.poll(() => surface()?.textContent).toBe('First content');
	});

	test('an outside press closes a focus tooltip, and the next hover still shows one', async () => {
		await mount();
		element('Before').focus();
		await tab();
		await expect.poll(() => surface()?.textContent).toBe('First content');
		await userEvent.click(trigger('Before'));
		await expect.poll(surface).toBeNull();

		await userEvent.hover(trigger('Second'));
		await expect.poll(() => surface()?.textContent).toBe('Second content');
	});
});

describe('hoverable content and handoff (TT-1, DF-8)', () => {
	test('the pointer can travel from the trigger onto the content and read it', async () => {
		await mount();
		await userEvent.hover(trigger('First'));
		await expect.poll(surface).not.toBeNull();
		const content = surface()!;
		await userEvent.hover(content);
		await wait(250);
		expect(surface()).toBe(content);
		await userEvent.unhover(content);
		await expect.poll(surface).toBeNull();
	});

	test('a handoff during the open transition reports the lifecycle of the new tooltip once', async () => {
		const slow = { in: { duration: 400 }, out: { duration: 0 } };
		const events: string[] = [];
		const record = (name: string) => () => events.push(name);
		await mount({
			first: {
				transition: slow,
				onAfterOpen: record('first open'),
				onAfterClose: record('first close')
			},
			second: {
				transition: slow,
				onAfterOpen: record('second open'),
				onAfterClose: record('second close')
			}
		});
		await userEvent.hover(trigger('First'));
		await expect.poll(surface).not.toBeNull();
		await userEvent.hover(trigger('Second'));
		await wait(700);
		expect(events).toEqual(['second open']);
	});

	test('the surface carries its exit hooks while it fades out, and only the new one opens', async () => {
		await mount({ first: { transition: { in: { duration: 0 }, out: { duration: 400 } } } });
		await userEvent.hover(trigger('First'));
		await expect.poll(() => surface()?.hasAttribute('data-open')).toBe(true);
		const fading = surface()!;
		await userEvent.unhover(trigger('First'));
		await expect.poll(() => fading.hasAttribute('data-closed')).toBe(true);
		expect(fading.isConnected).toBe(true);
		expect(fading.hasAttribute('data-exiting')).toBe(true);
		await expect.poll(() => fading.isConnected, { timeout: 2000 }).toBe(false);

		await userEvent.hover(trigger('First'));
		await expect.poll(() => surface()?.hasAttribute('data-open')).toBe(true);
		expect(surface()).not.toBe(fading);
		expect(fading.hasAttribute('data-open')).toBe(false);
	});

	test('moving to the next trigger keeps the same surface', async () => {
		await mount();
		await userEvent.hover(trigger('First'));
		await expect.poll(surface).not.toBeNull();
		const content = surface()!;
		await userEvent.hover(trigger('Second'));
		await expect.poll(() => surface()?.textContent).toBe('Second content');
		expect(surface()).toBe(content);
		expect(content.hasAttribute('data-instant')).toBe(true);
	});
});
