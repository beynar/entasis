// The swatch paints a colour, never the stored text: a value carrying extra declarations must not
// reach the swatch's style attribute.
import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';
import ColorInput from './ColorInput.svelte';

const swatchPaint = () =>
	screen
		.getByRole('button', { name: /color/i })
		.querySelector<HTMLElement>('[style*="background"]');

describe('ColorInput swatch', () => {
	test('a value carrying extra declarations adds none to the swatch', () => {
		renderInTheme(ColorInput, {
			label: 'Accent',
			value: 'red;background-image:url(https://example.com/track.png)'
		});
		expect(document.body.innerHTML).not.toContain('background-image');
		expect(swatchPaint()).toBeNull();
	});

	test('a leniently parsed value is painted as its canonical hex', () => {
		renderInTheme(ColorInput, { label: 'Accent', value: 'rgb(1, 2, 3);color:red' });
		const paint = swatchPaint();
		expect(paint?.getAttribute('style')).not.toContain('color:red');
		expect(paint?.style.backgroundColor).toBe('rgb(1, 2, 3)');
		expect(paint?.style.length).toBe(1);
	});

	test('a valid colour is painted', () => {
		renderInTheme(ColorInput, { label: 'Accent', value: '#5f62ef' });
		expect(swatchPaint()?.style.backgroundColor).toBe('rgb(95, 98, 239)');
	});
});
