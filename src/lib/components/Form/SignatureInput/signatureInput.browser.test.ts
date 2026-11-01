// The pad in a real browser: a real mouse drag draws and exports a PNG cropped to the ink, the
// page does not scroll or select under a stroke, and the ink follows the theme's text color.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render as renderBare } from 'vitest-browser-svelte';
import type { Component } from 'svelte';
import ThemeProviderHarness from '../../Theme/ThemeProviderHarness.test.svelte';
import SignatureInputHarness from './SignatureInputHarness.test.svelte';
import type { SignatureInputProps } from './signatureInput.props.js';

const render = (_: typeof SignatureInputHarness, props: SignatureInputProps) =>
	renderBare(ThemeProviderHarness, {
		props: {
			component: SignatureInputHarness as unknown as Component<Record<string, unknown>>,
			...props
		}
	});

const pad = () => document.querySelector<HTMLElement>('[data-slot="signature-pad"]')!;

/** Loads a data URL into an image and reads its natural size. */
const imageSize = (src: string) =>
	new Promise<{ width: number; height: number }>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
		image.onerror = reject;
		image.src = src;
	});

describe('SignatureInput in a browser', () => {
	test('a mouse drag draws a stroke and exports a PNG cropped to the ink', async () => {
		let value: string | null = null;
		render(SignatureInputHarness, {
			format: 'png',
			label: 'Signature',
			onValueChange: (next: string | null) => (value = next)
		});
		await userEvent.dragAndDrop(pad(), pad(), {
			sourcePosition: { x: 40, y: 60 },
			targetPosition: { x: 240, y: 100 }
		});

		await expect.poll(() => value).toMatch(/^data:image\/png;base64,/);
		expect(document.querySelectorAll('[data-slot="signature-ink"] path').length).toBe(1);
		expect(pad()).toHaveFocus();
		// 200 × 40 CSS px of travel, plus the line width and a padding of twice it, at 2×.
		const size = await imageSize(value!);
		expect(size.width).toBeGreaterThanOrEqual(400);
		expect(size.width).toBeLessThan(460);
		expect(size.height).toBeGreaterThanOrEqual(80);
		expect(size.height).toBeLessThan(140);
	});

	test('the pad stops the page from scrolling or selecting under a stroke', () => {
		render(SignatureInputHarness, { label: 'Signature' });
		const style = getComputedStyle(pad());
		expect(style.touchAction).toBe('none');
		expect(style.userSelect).toBe('none');
	});

	test('the ink on screen takes the text color, and the export stays black', async () => {
		let value: string | null = null;
		render(SignatureInputHarness, {
			format: 'svg',
			onValueChange: (next: string | null) => (value = next)
		});
		await userEvent.dragAndDrop(pad(), pad(), {
			sourcePosition: { x: 40, y: 60 },
			targetPosition: { x: 200, y: 90 }
		});
		await expect.poll(() => value).not.toBeNull();
		const ink = document.querySelector('[data-slot="signature-ink"]')!;
		expect(getComputedStyle(ink).color).toBe(getComputedStyle(pad()).color);
		expect(decodeURIComponent(value!)).toContain('stroke="#000000"');
	});

	test('a saved black signature shows in the pad ink color, not in black', async () => {
		// A black PNG on a transparent background, as the pad exports with the default inkColor.
		const canvas = document.createElement('canvas');
		canvas.width = 200;
		canvas.height = 60;
		const context = canvas.getContext('2d')!;
		context.fillStyle = '#000000';
		context.fillRect(20, 20, 160, 20);
		const saved = canvas.toDataURL('image/png');

		// A pad ink no theme uses, so the pixels tell the mask from the image.
		render(SignatureInputHarness, {
			defaultValue: saved,
			format: 'png',
			theme: { pad: { base: 'text-[rgb(255,0,0)] bg-[rgb(0,0,255)]' } }
		});
		const image = document.querySelector<HTMLElement>('[data-slot="signature-image"]')!;
		expect(image.dataset.ink).toBe('theme');
		expect(getComputedStyle(image).backgroundColor).toBe('rgb(255, 0, 0)');

		const shot = await page.screenshot({ element: pad(), base64: true, save: false });
		const bitmap = await createImageBitmap(
			await (await fetch(`data:image/png;base64,${shot}`)).blob()
		);
		const surface = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d')!;
		surface.drawImage(bitmap, 0, 0);
		const pixels = surface.getImageData(0, 0, bitmap.width, bitmap.height).data;
		let red = 0;
		let black = 0;
		for (let index = 0; index < pixels.length; index += 4) {
			const [r, g, b] = [pixels[index]!, pixels[index + 1]!, pixels[index + 2]!];
			if (r > 200 && g < 60 && b < 60) red += 1;
			if (r < 40 && g < 40 && b < 40) black += 1;
		}
		expect(red).toBeGreaterThan(500);
		expect(black).toBe(0);
	});

	test('a cross-origin value that refuses CORS falls back to the image itself', async () => {
		render(SignatureInputHarness, { defaultValue: 'http://127.0.0.1:9/signature.png' });
		await expect
			.poll(() => document.querySelector<HTMLElement>('[data-slot="signature-image"]')?.dataset.ink)
			.toBe('as-is');
		expect(document.querySelector('[data-slot="signature-image"]')!.tagName).toBe('IMG');
	});

	test('a stroke focuses the pad without a keyboard focus ring', async () => {
		await page.viewport(700, 400);
		render(SignatureInputHarness, { label: 'Signature', description: 'Sign with your mouse.' });
		await userEvent.dragAndDrop(pad(), pad(), {
			sourcePosition: { x: 40, y: 90 },
			targetPosition: { x: 260, y: 50 }
		});
		expect(pad()).toHaveFocus();
		expect(pad().matches(':focus-visible')).toBe(false);
		// The clear button empties the pad and brings back the signing line.
		await userEvent.click(page.getByRole('button', { name: 'Clear signature' }));
		await expect
			.poll(() => document.querySelector('[data-slot="signature-placeholder"]'))
			.not.toBeNull();
		expect(document.querySelectorAll('[data-slot="signature-ink"] path')).toHaveLength(0);
	});
});
