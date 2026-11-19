// Reading colours off the page for output that cannot use a token, such as a canvas.

/** An sRGB colour, each channel from 0 to 255. */
export type Rgb = [number, number, number];

const linear = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

let reader: CanvasRenderingContext2D | null = null;

/**
 * Any CSS colour (a token may resolve to `oklab()`) as an sRGB triple, read back from a pixel.
 * Null for a colour that is not one, or is fully transparent, such as a token that is not set.
 */
export function readCssColor(value: string): Rgb | null {
	if (typeof document === 'undefined' || !value) return null;
	reader ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext(
		'2d',
		{ willReadFrequently: true }
	);
	if (!reader) return null;
	reader.clearRect(0, 0, 1, 1);
	// A value the canvas does not take leaves the fill as it was: transparent.
	reader.fillStyle = 'rgba(0,0,0,0)';
	reader.fillStyle = value;
	reader.fillRect(0, 0, 1, 1);
	const [r, g, b, alpha] = reader.getImageData(0, 0, 1, 1).data;
	return alpha === 0 ? null : [r, g, b];
}

/** How light a colour reads, 0 to 1. */
export const luminance = ([r, g, b]: Rgb) =>
	0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
