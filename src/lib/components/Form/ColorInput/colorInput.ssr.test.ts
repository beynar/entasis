// On the server the swatch's style is written as text: only a canonical colour may reach it.
import { describe, expect, test } from 'vitest';
import { renderInThemeServer } from '../../Theme/renderInThemeServer.test-helper.js';
import ColorInput from './ColorInput.svelte';

describe('ColorInput swatch on the server', () => {
	test('a value carrying extra declarations adds none to the markup', async () => {
		const { body } = await renderInThemeServer(ColorInput, {
			label: 'Accent',
			value: 'red;background-image:url(https://example.com/track.png)'
		});
		expect(body).not.toContain('background-image');
	});

	test('a leniently parsed value is written as its canonical hex', async () => {
		const { body } = await renderInThemeServer(ColorInput, {
			label: 'Accent',
			value: 'rgb(1, 2, 3);color:red'
		});
		expect(body).toContain('background-color: #010203');
		expect(body).not.toContain('color:red');
	});
});
