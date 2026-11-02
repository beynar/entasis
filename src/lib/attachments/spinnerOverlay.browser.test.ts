// The overlay anchors on its host without moving it: a host placed by its own classes (absolute,
// fixed, sticky) keeps its place while it loads, and nothing is left on it once loading ends.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import SpinnerOverlayHarness from './SpinnerOverlayHarness.test.svelte';

const button = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const box = (element: Element) => element.getBoundingClientRect().toJSON();
const toggle = async () => {
	button('toggle').click();
	await tick();
};
const overlay = (host: HTMLElement) =>
	host.querySelector<HTMLElement>(':scope > [data-spinner-overlay]');

describe('spinnerOverlay', () => {
	test('a host placed by its classes keeps its place while it loads', async () => {
		render(SpinnerOverlayHarness, { initial: false });
		const before = box(button('placed'));
		await toggle();
		expect(overlay(button('placed'))).not.toBeNull();
		expect(getComputedStyle(button('placed')).position).toBe('absolute');
		expect(box(button('placed'))).toEqual(before);
	});

	test('the overlay covers its host exactly', async () => {
		render(SpinnerOverlayHarness, { initial: true });
		for (const id of ['placed', 'flow']) {
			const host = button(id);
			const cover = overlay(host)!;
			const inner = box(host);
			const style = getComputedStyle(host);
			const border = (side: string) => parseFloat(style.getPropertyValue(`border-${side}-width`));
			const coverBox = box(cover);
			expect(coverBox.left).toBeCloseTo(inner.left + border('left'), 0);
			expect(coverBox.top).toBeCloseTo(inner.top + border('top'), 0);
			expect(coverBox.right).toBeCloseTo(inner.right - border('right'), 0);
			expect(coverBox.bottom).toBeCloseTo(inner.bottom - border('bottom'), 0);
		}
	});

	test('the overlay follows a radius change while its host loads', async () => {
		render(SpinnerOverlayHarness, { initial: true });
		const host = button('flow');
		const before = getComputedStyle(overlay(host)!).borderTopLeftRadius;
		button('round').click();
		await tick();
		const border = parseFloat(getComputedStyle(host).borderTopWidth);
		const outer = parseFloat(getComputedStyle(host).borderTopLeftRadius);
		expect(outer).toBeGreaterThan(parseFloat(before));
		await expect
			.poll(() => parseFloat(getComputedStyle(overlay(host)!).borderTopLeftRadius))
			.toBeCloseTo(outer - border, 0);
	});

	test('a host with its own background hands it to the overlay while it loads', async () => {
		// The host's background ended on the overlay's rounded edge and showed as a dark line
		// around each corner; the overlay now paints it, opaque, and the host's own is cleared.
		render(SpinnerOverlayHarness, { initial: true });
		const host = button('flow');
		// The handover waits for the overlay's fade-in to finish, which a loaded runner can stretch.
		await expect
			.poll(() => getComputedStyle(host).backgroundColor, { timeout: 4000 })
			.toBe('rgba(0, 0, 0, 0)');
		const painted = getComputedStyle(overlay(host)!).backgroundColor;
		expect(painted).not.toMatch(/\/\s*0?\.\d+\)$|,\s*0?\.\d+\)$/);
		await toggle();
		await expect.poll(() => overlay(host)).toBeNull();
		expect(host.getAttribute('style') ?? '').toBe('');
		expect(getComputedStyle(host).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
	});

	test('an unpositioned host is anchored while it loads and given back after', async () => {
		render(SpinnerOverlayHarness, { initial: true });
		expect(getComputedStyle(button('flow')).position).toBe('relative');
		await toggle();
		await expect.poll(() => overlay(button('flow'))).toBeNull();
		expect(button('flow').style.position).toBe('');
		expect(button('placed').style.position).toBe('');
	});
});
