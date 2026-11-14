// The preview image is the card's cover: flush with its top and sides, under its top corners.
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import LinkPreviewHarness from './linkPreviewHarness.test.svelte';

const image =
	'data:image/svg+xml;utf8,' +
	encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" width="380" height="200"><rect width="380" height="200" fill="teal"/></svg>'
	);
const metadata = {
	url: 'https://example.com',
	title: 'Example domain',
	description: 'A page used in documentation.',
	siteName: 'example.com',
	image
};
const card = () => document.querySelector<HTMLElement>('dialog[open] [data-color]');

describe('link preview cover', () => {
	for (const size of ['small', 'normal', 'large'] as const) {
		test(`the image is flush with the card in ${size}`, async () => {
			render(LinkPreviewHarness, {
				props: { href: 'https://example.com', metadata, size, defaultOpen: true }
			});
			await expect.poll(() => card()?.querySelector('img[loading]')).toBeTruthy();
			const root = card()!;
			const img = root.querySelector<HTMLImageElement>(`img[src^="data:image/svg"]`)!;
			await expect.poll(() => img.getBoundingClientRect().height).toBeGreaterThan(0);
			const a = root.getBoundingClientRect();
			const b = img.getBoundingClientRect();
			const title = page.getByText('Example domain').element().getBoundingClientRect();
			// The text keeps the card's inset from the sides.
			expect(title.left - a.left).toBeGreaterThan(8);
			expect(Math.abs(b.top - a.top)).toBeLessThan(1.5);
			expect(Math.abs(b.left - a.left)).toBeLessThan(1.5);
			expect(Math.abs(a.right - b.right)).toBeLessThan(1.5);
		});
	}

	test('the loading placeholder takes the cover, and an error leaves the card without one', async () => {
		let fail: (error: Error) => void = () => {};
		const fetchMetadata = () => new Promise<never>((_, reject) => (fail = reject));
		render(LinkPreviewHarness, {
			props: { href: 'https://example.com', fetchMetadata, defaultOpen: true }
		});
		await expect.poll(card).toBeTruthy();
		const root = card()!;
		const placeholder = () => root.firstElementChild!.getBoundingClientRect();
		await expect.poll(() => placeholder().height).toBeGreaterThan(0);
		// Edges within the card's 1px border.
		const box = root.getBoundingClientRect();
		expect(Math.abs(placeholder().top - box.top)).toBeLessThan(1.5);
		expect(Math.abs(placeholder().left - box.left)).toBeLessThan(1.5);
		expect(Math.abs(box.right - placeholder().right)).toBeLessThan(1.5);

		fail(new Error('Offline'));
		await expect
			.poll(() => root.querySelector('[role="status"]')?.textContent)
			.toContain('Offline');
		const status = root.querySelector<HTMLElement>('[role="status"]')!.getBoundingClientRect();
		expect(status.top - root.getBoundingClientRect().top).toBeGreaterThan(8);
	});
});
