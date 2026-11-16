// A lightbox caption paints above the lightbox's image, also when the gallery or the zoom sits in
// a Dialog: rendered in place, its z-index only ranked it within the dialog, under the overlay
// LightGallery appends to the document.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './LightboxCaptionHarness.test.svelte';

/** Whether the caption is what paints at its own centre; `inert` hides from hit testing only. */
const captionPaints = (caption: HTMLElement) => {
	const inert = [...document.querySelectorAll('[inert]')];
	inert.forEach((element) => element.removeAttribute('inert'));
	const rect = caption.getBoundingClientRect();
	const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
	inert.forEach((element) => element.setAttribute('inert', ''));
	return !!hit && caption.contains(hit);
};

describe.each([
	['gallery', { galleryOpen: true }],
	['zoom', { zoomOpen: true }]
] as const)('%s caption', (which, open) => {
	test.each([false, true])('paints above the lightbox (in a dialog: %s)', async (inDialog) => {
		const screen = await render(Harness, { inDialog });
		await new Promise((resolve) => setTimeout(resolve, 200));
		await screen.rerender({ inDialog, ...open });
		await expect.poll(() => document.querySelector('.lg-container.lg-show')).not.toBeNull();
		const caption = () => document.querySelector<HTMLElement>(`[data-testid="${which}-caption"]`);
		await expect.poll(caption).not.toBeNull();
		// The lightbox's opening animation settles before the paint order is read.
		await new Promise((resolve) => setTimeout(resolve, 600));
		expect(captionPaints(caption()!)).toBe(true);
		screen.unmount();
	});
});
