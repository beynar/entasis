import { describe, expect, it } from 'vitest';
import type {
	DataModulesStyle,
	FinderPatternInnerStyle,
	FinderPatternOuterStyle
} from './qrCode.props.js';
import {
	encodeQRCode,
	excavateModules,
	getDataModulesPath,
	getFinderPatternsInner,
	getFinderPatternsOuter,
	getMarginSize,
	sanitizeDataModulesSettings
} from './qrCode.utils.js';

const modules = encodeQRCode('https://svelai.dev', 'M', 1).getModules();

describe('qrCode.utils', () => {
	it('encodes a square module matrix with finder patterns in the corners', () => {
		expect(modules.length).toBeGreaterThanOrEqual(21);
		expect(modules.length % 4).toBe(1); // 21 + 4n
		modules.forEach((row) => expect(row.length).toBe(modules.length));
		// Center of each finder pattern is dark
		expect(modules[3][3]).toBe(true);
		expect(modules[3][modules.length - 4]).toBe(true);
		expect(modules[modules.length - 4][3]).toBe(true);
	});

	it('builds non-empty shapes for every style', () => {
		const dataStyles: DataModulesStyle[] = [
			'square',
			'square-sm',
			'pinched-square',
			'rounded',
			'leaf',
			'vertical-line',
			'horizontal-line',
			'circuit-board',
			'circle',
			'diamond',
			'star',
			'heart',
			'hashtag'
		];
		for (const style of dataStyles) {
			const path = getDataModulesPath(modules, 4, sanitizeDataModulesSettings({ style }));
			expect(path.length, `data modules style ${style}`).toBeGreaterThan(0);
		}

		const outerStyles: FinderPatternOuterStyle[] = [
			'square',
			'rounded',
			'circle',
			'leaf',
			'inpoint',
			'outpoint',
			'pinched-square'
		];
		for (const style of outerStyles) {
			const shapes = getFinderPatternsOuter(modules, 4, style);
			expect(shapes.length, `outer style ${style}`).toBeGreaterThanOrEqual(1);
			shapes.forEach((s) => expect(s.kind === 'path' && s.d.length > 0).toBe(true));
		}

		const innerStyles: FinderPatternInnerStyle[] = [
			'square',
			'circle',
			'diamond',
			'leaf',
			'heart',
			'star',
			'microchip',
			'hashtag'
		];
		for (const style of innerStyles) {
			expect(getFinderPatternsInner(modules, 4, style).length, `inner style ${style}`).toBe(3);
		}
	});

	it('preserves the configured data module scale', () => {
		expect(sanitizeDataModulesSettings({ scale: 0.8 }).scale).toBe(0.8);
		expect(sanitizeDataModulesSettings().scale).toBe(1);
	});

	it('excavates a region and defaults the margin to 4', () => {
		const excavated = excavateModules(modules, { x: 10, y: 10, w: 3, h: 3 });
		expect(excavated[11][11]).toBe(false);
		expect(getMarginSize()).toBe(4);
		expect(getMarginSize(2.7)).toBe(2);
		expect(getMarginSize(-1)).toBe(0);
	});
});
