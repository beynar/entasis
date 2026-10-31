import { describe, expect, test } from 'vitest';
import {
	exportStrokes,
	strokeShapes,
	strokesBounds,
	strokesToSvg,
	strokeWidthAt,
	type SignatureStroke
} from './signatureInput.strokes.js';

const line: SignatureStroke = [
	{ x: 10, y: 10, pressure: 0.5 },
	{ x: 20, y: 15, pressure: 0.5 },
	{ x: 30, y: 10, pressure: 0.5 },
	{ x: 40, y: 20, pressure: 0.5 }
];

describe('signature strokes', () => {
	test('a pen thins and thickens the line; a mouse draws at the base width', () => {
		expect(strokeWidthAt(0.5, 2)).toBe(2);
		expect(strokeWidthAt(0, 2)).toBe(1);
		expect(strokeWidthAt(1, 2)).toBe(3);
		expect(strokeWidthAt(4, 2)).toBe(3);
	});

	test('a stroke at one width is one smoothed path through its samples', () => {
		const shapes = strokeShapes(line, 2);
		expect(shapes).toHaveLength(1);
		expect(shapes[0]).toEqual({
			kind: 'path',
			d: 'M10 10Q20 15 25 12.5Q30 10 35 15Q40 20 40 20',
			width: 2
		});
	});

	test('a pen stroke splits where its width changes', () => {
		const pen: SignatureStroke = line.map((point, index) => ({ ...point, pressure: index / 3 }));
		const shapes = strokeShapes(pen, 2);
		expect(shapes.length).toBeGreaterThan(1);
		expect(new Set(shapes.map((shape) => (shape.kind === 'path' ? shape.width : 0))).size).toBe(
			shapes.length
		);
	});

	test('a tap is a dot', () => {
		expect(strokeShapes([{ x: 5, y: 6, pressure: 0.5 }], 2)).toEqual([
			{ kind: 'dot', x: 5, y: 6, r: 1 }
		]);
	});

	test('the bounds cover the ink, line width included', () => {
		expect(strokesBounds([line], 2)).toEqual({ x: 9, y: 9, width: 32, height: 12 });
		expect(strokesBounds([], 2)).toBeNull();
	});

	test('the SVG export is cropped to the ink plus its padding', () => {
		const svg = strokesToSvg([line], { color: '#000', width: 2, padding: 4 })!;
		expect(svg).toContain('width="40" height="20" viewBox="0 0 40 20"');
		// Shifted by the crop: the first sample sits at the padding plus half the line width.
		expect(svg).toContain('d="M5 5Q');
		expect(svg).toContain('stroke="#000"');
		expect(strokesToSvg([], { color: '#000', width: 2, padding: 4 })).toBeNull();
	});

	test('an SVG export is a data URL, and nothing exports to null', () => {
		const options = { format: 'svg' as const, color: '#000', width: 2, padding: 4, scale: 2 };
		expect(exportStrokes([line], options)).toMatch(/^data:image\/svg\+xml;charset=utf-8,%3Csvg/);
		expect(exportStrokes([], options)).toBeNull();
		expect(exportStrokes([], { ...options, format: 'png' })).toBeNull();
	});
});
