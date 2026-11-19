// The lens a glimm sweep can bend the element's content with, where the browser has scoped view
// transitions. Bending live DOM is not possible, but during the transition the browser shows the
// element as two pictures, `::view-transition-old(root)` and `::view-transition-new(root)`, and a
// CSS filter applies to them. An SVG `feDisplacementMap` moves their pixels by a map drawn each
// frame from the shape's field: near the band, the content swells away from where the band comes
// from, less and less as the band moves on, with a slight split of the colours where it swells.
// The map is still at the element's edges, so the element keeps its outline.

import type { ShapeGeometry } from './glimm.shapes.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// The map's resolution: about one sample per this many CSS pixels, at most this many a side.
const MAP_STEP = 3;
const MAP_MAX = 160;
// How far apart the red and blue are moved, as a share of the displacement.
const ABERRATION = 0.12;
// CSS pixels over which the lens fades out towards the element's edges.
const EDGE_CALM = 14;
// CSS pixels around the element the filter covers, still, so its shadow and border are kept.
const MARGIN = 24;

let count = 0;

export type Distortion = {
	/** The CSS rule that puts the lens on both pictures of the element's view transition. */
	rule: (scope: string) => string;
	/** Draws the lens for the band at `progress` (0 to 1). */
	update: (progress: number) => void;
	destroy: () => void;
};

const smooth = (from: number, to: number, value: number) => {
	const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
	return t * t * (3 - 2 * t);
};

/**
 * A lens of `amount` CSS pixels at most over an element of `width` × `height`, following the band
 * of `geometry`. Null where the map cannot be drawn.
 */
export function createDistortion(
	geometry: ShapeGeometry,
	width: number,
	height: number,
	amount: number
): Distortion | null {
	const outerWidth = width + MARGIN * 2;
	const outerHeight = height + MARGIN * 2;
	const columns = Math.max(8, Math.min(MAP_MAX, Math.round(outerWidth / MAP_STEP)));
	const rows = Math.max(8, Math.min(MAP_MAX, Math.round(outerHeight / MAP_STEP)));
	const canvas = document.createElement('canvas');
	canvas.width = columns;
	canvas.height = rows;
	const context = canvas.getContext('2d');
	if (!context) return null;
	const image = context.createImageData(columns, rows);

	const id = `glimm-lens-${++count}`;
	const svg = document.createElementNS(SVG_NS, 'svg');
	svg.setAttribute('aria-hidden', 'true');
	svg.setAttribute('width', '0');
	svg.setAttribute('height', '0');
	svg.style.position = 'absolute';
	const scale = amount * 2;
	// Built node by node rather than from markup, so a page under Trusted Types takes it too.
	const node = (name: string, attributes: Record<string, string>, parent: Element) => {
		const child = document.createElementNS(SVG_NS, name);
		for (const [key, value] of Object.entries(attributes)) child.setAttribute(key, value);
		parent.append(child);
		return child;
	};
	const filter = node(
		'filter',
		{
			id,
			filterUnits: 'userSpaceOnUse',
			x: String(-MARGIN),
			y: String(-MARGIN),
			width: String(outerWidth),
			height: String(outerHeight),
			'color-interpolation-filters': 'sRGB',
			primitiveUnits: 'userSpaceOnUse'
		},
		svg
	);
	const feImage = node(
		'feImage',
		{
			x: String(-MARGIN),
			y: String(-MARGIN),
			width: String(outerWidth),
			height: String(outerHeight),
			preserveAspectRatio: 'none',
			result: 'map'
		},
		filter
	);
	// Three displacements of the picture, a little more for red and less for blue, each keeping its
	// own channel, screened back together: where the content swells, its colours part slightly.
	const channels: Array<[string, string, number]> = [
		['red', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 1 + ABERRATION],
		['green', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', 1],
		['blue', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', 1 - ABERRATION]
	];
	for (const [name, matrix, factor] of channels) {
		node(
			'feDisplacementMap',
			{
				in: 'SourceGraphic',
				in2: 'map',
				scale: (scale * factor).toFixed(2),
				xChannelSelector: 'R',
				yChannelSelector: 'G',
				result: `${name}-moved`
			},
			filter
		);
		node(
			'feColorMatrix',
			{ in: `${name}-moved`, type: 'matrix', values: matrix, result: name },
			filter
		);
	}
	node('feBlend', { in: 'red', in2: 'green', mode: 'screen', result: 'red-green' }, filter);
	node('feBlend', { in: 'red-green', in2: 'blue', mode: 'screen' }, filter);
	document.body.append(svg);

	// How wide the lens is around the band, in field units: wider behind it than ahead.
	const ahead = Math.max(0.02, geometry.reach.ahead * 0.9);
	const behind = Math.max(0.03, geometry.reach.behind * 1.1);
	const started = performance.now();
	const arcStart = geometry.arc?.start ?? 0;

	const field = new Float32Array(columns * rows);
	const update = (progress: number) => {
		const position = geometry.position(progress);
		// Strong as the band sets off, calmer as it settles.
		const energy = smooth(0, 0.06, progress) * (1 - smooth(0.55, 0.97, progress));
		const time = (performance.now() - started) / 1000;
		const cellX = outerWidth / columns;
		const cellY = outerHeight / rows;
		for (let row = 0; row < rows; row++) {
			for (let column = 0; column < columns; column++) {
				field[row * columns + column] = geometry.field(
					(column + 0.5) * cellX - MARGIN,
					(row + 0.5) * cellY - MARGIN,
					position
				);
			}
		}
		const data = image.data;
		for (let row = 0; row < rows; row++) {
			for (let column = 0; column < columns; column++) {
				const index = row * columns + column;
				const f = field[index];
				// The field's slope, which points away from where the band comes from.
				const left = field[row * columns + Math.max(0, column - 1)];
				const right = field[row * columns + Math.min(columns - 1, column + 1)];
				const up = field[Math.max(0, row - 1) * columns + column];
				const down = field[Math.min(rows - 1, row + 1) * columns + column];
				let nx = (right - left) / cellX;
				let ny = (down - up) / cellY;
				const length = Math.hypot(nx, ny) || 1;
				nx /= length;
				ny /= length;
				const d = f - position;
				const u = d / (d > 0 ? ahead : behind);
				// A swell that breathes along the band, so it does not read as a ruler.
				const breathing = 0.8 + 0.2 * Math.sin(Math.atan2(ny, nx) * 3 + time * 1.6);
				const x = (column + 0.5) * cellX - MARGIN;
				const y = (row + 0.5) * cellY - MARGIN;
				// Still at the element's edges and beyond, and on the control an arc leaves.
				let calm = smooth(0, EDGE_CALM, Math.min(x, y, width - x, height - y));
				if (arcStart > 0) calm *= smooth(arcStart, arcStart * 2.2, f);
				const lift = Math.exp(-u * u) * energy * breathing * calm;
				// Each pixel shows the picture from behind it, so the content swells forwards.
				data[index * 4] = Math.round(128 - nx * lift * 127);
				data[index * 4 + 1] = Math.round(128 - ny * lift * 127);
				data[index * 4 + 2] = 128;
				data[index * 4 + 3] = 255;
			}
		}
		context.putImageData(image, 0, 0);
		feImage.setAttribute('href', canvas.toDataURL());
	};
	update(0);

	return {
		rule: (scope) =>
			`${scope}::view-transition-old(root), ${scope}::view-transition-new(root) { filter: url(#${id}); }`,
		update,
		destroy: () => svg.remove()
	};
}
