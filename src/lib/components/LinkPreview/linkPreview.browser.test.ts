// A link in prose wraps across lines, and its card anchors to the line the pointer entered (OV-20b).
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import LinkPreviewWrapHarness from './LinkPreviewWrapHarness.test.svelte';

type Props = Parameters<typeof LinkPreviewWrapHarness>[1];
const mount = (props: Props = {}) => render(LinkPreviewWrapHarness, { props });
const link = () => page.getByRole('link').element() as HTMLElement;
const card = () => document.querySelector<HTMLElement>('dialog[open] > div');
// The line boxes of the wrapped link, which sits inside the trigger wrapper.
const lines = () => [...(link().parentElement as HTMLElement).getClientRects()];

/** Hovers the middle of a line box of the link. */
async function hoverLine(index: number) {
	const rect = lines()[index];
	const box = link().getBoundingClientRect();
	await userEvent.hover(link(), {
		position: { x: rect.left + rect.width / 2 - box.left, y: rect.top + rect.height / 2 - box.top }
	});
}

describe('a link that wraps (OV-20b)', () => {
	test('the link flows with the text and breaks across lines', async () => {
		mount();
		expect(lines().length).toBeGreaterThan(1);
		expect(getComputedStyle(link()).display).toBe('inline');
		expect(getComputedStyle(link().parentElement as HTMLElement).display).toBe('inline');
	});

	test('the card sits under the line the pointer entered, and stays there while it is open', async () => {
		mount();
		const all = lines();
		expect(all.length).toBeGreaterThan(1);
		await hoverLine(1);
		await expect.poll(card).not.toBeNull();
		await expect.poll(() => card()!.getBoundingClientRect().height).toBeGreaterThan(0);
		const second = card()!.getBoundingClientRect();
		// Below the second line, not below the box spanning both.
		expect(Math.abs(second.top - (all[1].bottom + 4))).toBeLessThan(2);

		// Moving to the first line while it is open leaves the card where it is.
		await hoverLine(0);
		await new Promise((resolve) => setTimeout(resolve, 150));
		expect(Math.abs(card()!.getBoundingClientRect().top - second.top)).toBeLessThan(2);
	});

	test('entering on the first line anchors there', async () => {
		mount();
		const all = lines();
		await hoverLine(0);
		await expect.poll(card).not.toBeNull();
		await expect.poll(() => card()!.getBoundingClientRect().height).toBeGreaterThan(0);
		expect(Math.abs(card()!.getBoundingClientRect().top - (all[0].bottom + 4))).toBeLessThan(2);
	});

	test('wrap={false} keeps the link one box that does not break', async () => {
		mount({ link: { wrap: false } });
		// A flex item inside the inline-flex trigger wrapper.
		expect(getComputedStyle(link()).display).toBe('flex');
		expect(getComputedStyle(link().parentElement as HTMLElement).display).toBe('inline-flex');
		expect(lines()).toHaveLength(1);
	});
});
