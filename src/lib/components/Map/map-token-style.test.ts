import { describe, expect, it } from 'vitest';
import { deriveMapStyleColors } from './map-token-style.js';

const tokens = {
	surface: 'rgb(250, 250, 250)',
	neutral: 'rgb(24, 24, 27)',
	primary: 'rgb(95, 98, 239)',
	success: 'rgb(21, 128, 61)',
	danger: 'rgb(220, 38, 38)'
};

describe('deriveMapStyleColors', () => {
	it('lets the primary token show on water so a palette change recolors the map', () => {
		const indigo = deriveMapStyleColors(tokens, 'light');
		const amber = deriveMapStyleColors({ ...tokens, primary: 'rgb(217, 119, 6)' }, 'light');
		expect(indigo.water).not.toBe(amber.water);
		expect(indigo.water).toBe('rgb(222 223 248)');
		expect(indigo.background).toBe(tokens.surface);
		expect(indigo.halo).toBe('rgba(250, 250, 250, 0.76)');
	});

	it('keeps the dark recipe darker than the light one for the same tokens', () => {
		const dark = deriveMapStyleColors({ ...tokens, surface: 'rgb(9, 9, 11)' }, 'dark');
		expect(dark.water).toBe('rgb(35 36 79)');
		expect(dark.halo).toBe('rgba(9, 9, 11, 0.64)');
	});
});
