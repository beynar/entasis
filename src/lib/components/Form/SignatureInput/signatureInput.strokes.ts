/**
 * Strokes of a signature and the images they export to. Pure geometry: no DOM except the
 * canvas context a caller passes in, so it runs the same in a test, on the pad and on export.
 */

/** One sampled pointer position, in CSS pixels of the pad. */
export type SignaturePoint = {
	x: number;
	y: number;
	/** Pen pressure from 0 to 1. Mouse and touch report 0.5. */
	pressure: number;
};

/** One continuous line, from a pointer down to its pointer up. */
export type SignatureStroke = readonly SignaturePoint[];

export type SignatureBounds = { x: number; y: number; width: number; height: number };

/** Exported image format: a PNG or an SVG, each as a data URL. */
export type SignatureFormat = 'png' | 'svg';

export type SignatureRenderOptions = {
	/** CSS color of the ink. */
	color: string;
	/** Base line width in CSS pixels, at a pressure of 0.5. */
	width: number;
};

/** Width of a segment drawn at `pressure`: half the base at no pressure, 1.5 times at full. */
export const strokeWidthAt = (pressure: number, width: number) =>
	width * (0.5 + Math.min(Math.max(pressure, 0), 1));

const midpoint = (a: SignaturePoint, b: SignaturePoint): SignaturePoint => ({
	x: (a.x + b.x) / 2,
	y: (a.y + b.y) / 2,
	pressure: (a.pressure + b.pressure) / 2
});

/**
 * The segments a stroke is drawn as: quadratic curves through the midpoints of its samples, so
 * the line is smooth however coarse the pointer events were. Each segment carries the pressure it
 * is drawn at, so a pen's line thickens and thins along the way.
 */
export function strokeSegments(stroke: SignatureStroke) {
	const segments: {
		from: SignaturePoint;
		control: SignaturePoint;
		to: SignaturePoint;
		pressure: number;
	}[] = [];
	if (stroke.length < 2) return segments;
	let from = stroke[0]!;
	for (let index = 1; index < stroke.length - 1; index++) {
		const control = stroke[index]!;
		const to = midpoint(control, stroke[index + 1]!);
		segments.push({ from, control, to, pressure: control.pressure });
		from = to;
	}
	const last = stroke[stroke.length - 1]!;
	segments.push({ from, control: last, to: last, pressure: last.pressure });
	return segments;
}

/** Draws `strokes` on a 2D context already scaled to CSS pixels. A tap draws a dot. */
export function drawStrokes(
	context: CanvasRenderingContext2D,
	strokes: readonly SignatureStroke[],
	{ color, width }: SignatureRenderOptions
) {
	context.save();
	context.strokeStyle = color;
	context.fillStyle = color;
	context.lineCap = 'round';
	context.lineJoin = 'round';
	for (const stroke of strokes) {
		if (stroke.length === 1) {
			const [dot] = stroke;
			context.beginPath();
			context.arc(dot!.x, dot!.y, strokeWidthAt(dot!.pressure, width) / 2, 0, Math.PI * 2);
			context.fill();
			continue;
		}
		for (const segment of strokeSegments(stroke)) {
			context.beginPath();
			context.lineWidth = strokeWidthAt(segment.pressure, width);
			context.moveTo(segment.from.x, segment.from.y);
			context.quadraticCurveTo(segment.control.x, segment.control.y, segment.to.x, segment.to.y);
			context.stroke();
		}
	}
	context.restore();
}

/** The box the ink covers, line width included, or null when there is no ink. */
export function strokesBounds(
	strokes: readonly SignatureStroke[],
	width: number
): SignatureBounds | null {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const stroke of strokes) {
		for (const point of stroke) {
			const half = strokeWidthAt(point.pressure, width) / 2;
			minX = Math.min(minX, point.x - half);
			minY = Math.min(minY, point.y - half);
			maxX = Math.max(maxX, point.x + half);
			maxY = Math.max(maxY, point.y + half);
		}
	}
	if (minX === Infinity) return null;
	return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

const round = (value: number) => Math.round(value * 100) / 100;

/** One drawable piece of a stroke: a dot for a tap, or a path at one line width. */
export type SignatureShape =
	{ kind: 'dot'; x: number; y: number; r: number } | { kind: 'path'; d: string; width: number };

/**
 * The shapes a stroke draws as, in SVG path syntax, shifted by `offset`. Consecutive segments
 * at the same width share one path, so a mouse or finger stroke is a single path and only a
 * pen's changing pressure splits it.
 */
export function strokeShapes(
	stroke: SignatureStroke,
	width: number,
	offset: { x: number; y: number } = { x: 0, y: 0 }
): SignatureShape[] {
	const x = (value: number) => round(value - offset.x);
	const y = (value: number) => round(value - offset.y);
	if (stroke.length === 1) {
		const [dot] = stroke;
		return [
			{ kind: 'dot', x: x(dot!.x), y: y(dot!.y), r: round(strokeWidthAt(dot!.pressure, width) / 2) }
		];
	}
	const shapes: SignatureShape[] = [];
	for (const segment of strokeSegments(stroke)) {
		const segmentWidth = round(strokeWidthAt(segment.pressure, width));
		const curve = `Q${x(segment.control.x)} ${y(segment.control.y)} ${x(segment.to.x)} ${y(segment.to.y)}`;
		const last = shapes.at(-1);
		if (last?.kind === 'path' && last.width === segmentWidth) last.d += curve;
		else
			shapes.push({
				kind: 'path',
				d: `M${x(segment.from.x)} ${y(segment.from.y)}${curve}`,
				width: segmentWidth
			});
	}
	return shapes;
}

/** A standalone SVG of the strokes, cropped to the ink plus `padding`. */
export function strokesToSvg(
	strokes: readonly SignatureStroke[],
	{ color, width, padding }: SignatureRenderOptions & { padding: number }
) {
	const bounds = strokesBounds(strokes, width);
	if (!bounds) return null;
	const offset = { x: bounds.x - padding, y: bounds.y - padding };
	const boxWidth = round(bounds.width + padding * 2);
	const boxHeight = round(bounds.height + padding * 2);
	const shapes = strokes
		.flatMap((stroke) => strokeShapes(stroke, width, offset))
		.map((shape) =>
			shape.kind === 'dot'
				? `<circle cx="${shape.x}" cy="${shape.y}" r="${shape.r}" fill="${color}"/>`
				: `<path d="${shape.d}" stroke-width="${shape.width}"/>`
		);
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${boxWidth}" height="${boxHeight}" viewBox="0 0 ${boxWidth} ${boxHeight}">`,
		`<g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">`,
		shapes.join(''),
		'</g></svg>'
	].join('');
}

/**
 * Exports the strokes as a data URL cropped to the ink plus `padding`: an SVG, or a PNG drawn at
 * `scale` device pixels per CSS pixel so it stays sharp in a document. Null when there is no ink.
 */
export function exportStrokes(
	strokes: readonly SignatureStroke[],
	{
		format,
		color,
		width,
		padding,
		scale
	}: SignatureRenderOptions & { format: SignatureFormat; padding: number; scale: number }
): string | null {
	if (format === 'svg') {
		const svg = strokesToSvg(strokes, { color, width, padding });
		return svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : null;
	}
	const bounds = strokesBounds(strokes, width);
	if (!bounds || typeof document === 'undefined') return null;
	const canvas = document.createElement('canvas');
	canvas.width = Math.ceil((bounds.width + padding * 2) * scale);
	canvas.height = Math.ceil((bounds.height + padding * 2) * scale);
	const context = canvas.getContext('2d');
	if (!context) return null;
	context.scale(scale, scale);
	context.translate(padding - bounds.x, padding - bounds.y);
	drawStrokes(context, strokes, { color, width });
	return canvas.toDataURL('image/png');
}
