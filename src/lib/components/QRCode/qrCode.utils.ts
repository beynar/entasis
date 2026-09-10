import qrcodegen from './qrcodegen.js';
import type { Sizes } from '../../types/index.js';
import type {
	DataModulesStyle,
	DownloadFileFormat,
	ErrorCorrectionLevel,
	FinderPatternInnerStyle,
	FinderPatternOuterStyle,
	ImageSettings
} from './qrCode.props.js';

/**
 * Ported from https://github.com/LGLabGreg/react-qr-code (MIT).
 */

export type Modules = ReturnType<qrcodegen.QrCode['getModules']>;
export type Excavation = { x: number; y: number; w: number; h: number };

export interface CalculatedImageSettings {
	x: number;
	y: number;
	h: number;
	w: number;
	excavation: Excavation | null;
	opacity: number;
	crossOrigin: ImageSettings['crossOrigin'];
}

export interface DataModulesNeighbours {
	left: boolean;
	right: boolean;
	top: boolean;
	bottom: boolean;
	count: number;
}

/** A renderable QR code shape: a raw path or a rounded rect, optionally rotated around its own center. */
export type QRCodeShape =
	| { kind: 'path'; d: string; rotation?: number }
	| { kind: 'rect'; x: number; y: number; size: number; rx: number; rotation?: number };

/**
 * Constants.
 */
export const ERROR_LEVEL_MAP: Record<ErrorCorrectionLevel, qrcodegen.QrCode.Ecc> = {
	L: qrcodegen.QrCode.Ecc.LOW,
	M: qrcodegen.QrCode.Ecc.MEDIUM,
	Q: qrcodegen.QrCode.Ecc.QUARTILE,
	H: qrcodegen.QrCode.Ecc.HIGH
};

/** Nominal pixel size of each `size` variant, used for image settings and raster export math. */
export const QR_PIXEL_SIZES: Record<Sizes, number> = {
	small: 96,
	normal: 128,
	large: 192
};

export const DEFAULT_LEVEL: ErrorCorrectionLevel = 'M';
export const DEFAULT_MINVERSION = 1;
export const DEFAULT_MARGIN_SIZE = 4;
export const DEFAULT_NUM_STAR_POINTS = 5;

export const DEFAULT_COLOR = 'currentColor';
export const DEFAULT_FINDER_PATTERN_OUTER_STYLE: FinderPatternOuterStyle = 'square';
export const DEFAULT_FINDER_PATTERN_INNER_STYLE: FinderPatternInnerStyle = 'square';
export const DEFAULT_DATA_MODULES_STYLE: DataModulesStyle = 'square';
export const CIRCUIT_BOARD_LINE_WIDTH = 0.5;
export const CIRCUIT_BOARD_PAD_RADIUS = 0.5;

export const DEFAULT_FILENAME = 'qr-code';

// This is *very* rough estimate of max amount of QRCode allowed to be covered.
// It is "wrong" in a lot of ways (area is a terrible way to estimate, it
// really should be number of modules covered), but if for some reason we don't
// get an explicit height or width, I'd rather default to something than throw.
const DEFAULT_IMG_SCALE = 0.1;

/**
 * Finder pattern.
 */
export const FINDER_PATTERN_SIZE = 7;
export const FINDER_PATTERN_INNER_SIZE = 3;

const FINDER_PATTERN_OUTER_MASK = [
	[1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1]
];

const FINDER_PATTERN_OUTER_ROTATIONS = {
	'inpoint-sm': [0, 90, -90],
	inpoint: [0, 90, -90],
	'inpoint-lg': [0, 90, -90],
	'outpoint-sm': [180, -90, 90],
	outpoint: [180, -90, 90],
	'outpoint-lg': [180, -90, 90],
	'leaf-sm': [0, 90, -90],
	leaf: [0, 90, -90],
	'leaf-lg': [0, 90, -90]
};

const FINDER_PATTERN_OUTER_RADIUSES = {
	'rounded-sm': 3,
	rounded: 4,
	'rounded-lg': 5,
	'leaf-sm': 3,
	leaf: 4,
	'leaf-lg': 5,
	'inpoint-sm': 3,
	inpoint: 4,
	'inpoint-lg': 5,
	'outpoint-sm': 3,
	outpoint: 4,
	'outpoint-lg': 5
};

const FINDER_PATTERN_INNER_RADIUSES = {
	square: 0,
	diamond: 0,
	circle: 3,
	'rounded-sm': 0.5,
	rounded: 0.9,
	'rounded-lg': 1.1,
	'leaf-sm': 1.5,
	leaf: 2,
	'leaf-lg': 2.3,
	'inpoint-sm': 1.5,
	inpoint: 2,
	'inpoint-lg': 2.3,
	'outpoint-sm': 1.5,
	outpoint: 2,
	'outpoint-lg': 2.3
};

const FINDER_PATTERN_INNER_MASK = [
	[0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0],
	[0, 0, 1, 1, 1, 0, 0],
	[0, 0, 1, 1, 1, 0, 0],
	[0, 0, 1, 1, 1, 0, 0],
	[0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0]
];

/**
 * QR code encoding.
 */
export const encodeQRCode = (
	value: string | string[],
	level: ErrorCorrectionLevel,
	minVersion: number,
	boostLevel?: boolean
): qrcodegen.QrCode => {
	const values = Array.isArray(value) ? value : [value];
	const segments = values.reduce<qrcodegen.QrSegment[]>((accum, v) => {
		accum.push(...qrcodegen.QrSegment.makeSegments(v));
		return accum;
	}, []);
	return qrcodegen.QrCode.encodeSegments(
		segments,
		ERROR_LEVEL_MAP[level],
		minVersion,
		undefined,
		undefined,
		boostLevel
	);
};

export const excavateModules = (modules: Modules, excavation: Excavation): Modules => {
	return modules.slice().map((row, y) => {
		if (y < excavation.y || y >= excavation.y + excavation.h) {
			return row;
		}
		return row.map((cell, x) => {
			if (x < excavation.x || x >= excavation.x + excavation.w) {
				return cell;
			}
			return false;
		});
	});
};

export const getImageSettings = (
	cells: Modules,
	size: number,
	margin: number,
	imageSettings?: ImageSettings
): CalculatedImageSettings | null => {
	if (imageSettings == null) {
		return null;
	}
	const numCells = cells.length + margin * 2;
	const defaultSize = Math.floor(size * DEFAULT_IMG_SCALE);
	const scale = numCells / size;
	const w = (imageSettings.width || defaultSize) * scale;
	const h = (imageSettings.height || defaultSize) * scale;
	const x = imageSettings.x == null ? cells.length / 2 - w / 2 : imageSettings.x * scale;
	const y = imageSettings.y == null ? cells.length / 2 - h / 2 : imageSettings.y * scale;
	const opacity = imageSettings.opacity == null ? 1 : imageSettings.opacity;

	let excavation = null;
	if (imageSettings.excavate) {
		const floorX = Math.floor(x);
		const floorY = Math.floor(y);
		const ceilW = Math.ceil(w + x - floorX);
		const ceilH = Math.ceil(h + y - floorY);
		excavation = { x: floorX, y: floorY, w: ceilW, h: ceilH };
	}

	const crossOrigin = imageSettings.crossOrigin;

	return { x, y, h, w, excavation, opacity, crossOrigin };
};

export const getMarginSize = (marginSize?: number): number => {
	if (marginSize != null) {
		return Math.max(Math.floor(marginSize), 0);
	}
	return DEFAULT_MARGIN_SIZE;
};

/**
 * Settings sanitizers.
 */
export const sanitizeDataModulesSettings = (settings?: {
	color?: string;
	style?: DataModulesStyle;
	randomSize?: boolean;
	scale?: number;
	lineWidth?: number;
}) => {
	const style = settings?.style || DEFAULT_DATA_MODULES_STYLE;
	const defaultLineWidth = style === 'circuit-board' ? CIRCUIT_BOARD_LINE_WIDTH : 1;
	return {
		color: settings?.color || DEFAULT_COLOR,
		style,
		randomSize: settings?.randomSize || false,
		scale: settings?.scale ?? 1,
		lineWidth: settings?.lineWidth ?? defaultLineWidth
	};
};

export const sanitizeFinderPatternOuterSettings = (settings?: {
	color?: string;
	style?: FinderPatternOuterStyle;
}) => {
	return {
		color: settings?.color || DEFAULT_COLOR,
		style: settings?.style || DEFAULT_FINDER_PATTERN_OUTER_STYLE
	};
};

export const sanitizeFinderPatternInnerSettings = (settings?: {
	color?: string;
	style?: FinderPatternInnerStyle;
}) => {
	return {
		color: settings?.color || DEFAULT_COLOR,
		style: settings?.style || DEFAULT_FINDER_PATTERN_INNER_STYLE
	};
};

/**
 * SVG shape helpers.
 */
const trailingZeros = /\.?0+$/;

export function numToAttr(value: number) {
	return value.toFixed(7).replace(trailingZeros, '');
}

export const calculateGradientVectors = (rotation: number) => {
	const angle = (rotation % 360) * (Math.PI / 180);

	const x1 = Math.max(0, Math.min(100, 50 - 50 * Math.cos(angle)));
	const y1 = Math.max(0, Math.min(100, 50 - 50 * Math.sin(angle)));
	const x2 = Math.max(0, Math.min(100, 50 + 50 * Math.cos(angle)));
	const y2 = Math.max(0, Math.min(100, 50 + 50 * Math.sin(angle)));

	return {
		x1: `${x1}%`,
		y1: `${y1}%`,
		x2: `${x2}%`,
		y2: `${y2}%`
	};
};

export const star = (cx: number, cy: number, size: number, spikes: number): string => {
	const outerRadius = size / 2;
	const innerRadius = outerRadius / 2;
	const step = Math.PI / spikes;
	let path = '';

	for (let i = 0; i < 2 * spikes; i++) {
		const angle = i * step - Math.PI / 2;
		const radius = i % 2 === 0 ? outerRadius : innerRadius;
		const px = cx + radius * Math.cos(angle);
		const py = cy + radius * Math.sin(angle);
		path += `${i === 0 ? 'M' : 'L'} ${px},${py} `;
	}
	return path + 'Z';
};

export const pinchedSquare = (x: number, y: number, size: number, controlOffset: number) =>
	`M ${x} ${y}` +
	`Q ${x + controlOffset} ${y + size / 2}, ${x} ${y + size}` +
	`Q ${x + size / 2} ${y + size - controlOffset}, ${x + size} ${y + size}` +
	`Q ${x + size - controlOffset} ${y + size / 2}, ${x + size} ${y}` +
	`Q ${x + size / 2} ${y + controlOffset}, ${x} ${y}` +
	'Z';

const MICROCHIP_LEG_HEIGHT_RATIO = 0.15;
const MICROCHIP_LEG_WIDTH_RATIO = 0.1;
const MICROCHIP_LEG_SPAN_RATIO = 0.7;
const MICROCHIP_NUM_LEGS = 4;

export const microchip = (x: number, y: number, size: number) => {
	const legH = size * MICROCHIP_LEG_HEIGHT_RATIO;
	const legW = size * MICROCHIP_LEG_WIDTH_RATIO;
	const bodyH = size - legH * 2;
	const body = `M${x},${y + legH}h${size}v${bodyH}h${-size}Z`;
	const legSpan = size * MICROCHIP_LEG_SPAN_RATIO;
	const legStart = x + (size - legSpan) / 2;
	const legStep = (legSpan - legW) / (MICROCHIP_NUM_LEGS - 1);
	const legs = Array.from({ length: MICROCHIP_NUM_LEGS }, (_, i) => {
		const lx = legStart + legStep * i;
		return (
			`M${lx},${y}h${legW}v${legH}h${-legW}Z` +
			`M${lx},${y + size - legH}h${legW}v${legH}h${-legW}Z`
		);
	}).join('');
	return body + legs;
};

export const hashtag = (x: number, y: number, size: number) => {
	const eigth = size / 8;
	return `M ${x + size} ${y + eigth * 3}
   V ${y + eigth}
   h -${eigth}
   V ${y}
   H ${x + eigth * 5}
   v ${eigth}
   H ${x + eigth * 3}
   V ${y}
   H ${x + eigth}
   v ${eigth}
   H ${x}
   v ${eigth * 2}
   h ${eigth}
   v ${eigth * 2}
   H ${x}
   v ${eigth * 2}
   h ${eigth}
   v ${eigth}
   h ${eigth * 2}
   v -${eigth}
   h ${eigth * 2}
   v ${eigth}
   h ${eigth * 2}
   v -${eigth}
   h ${eigth}
   V ${y + eigth * 5}
   h -${eigth}
   V ${y + eigth * 3}
   h ${eigth}
   Z`;
};

// prettier-ignore
const HEART_COMMANDS: Array<string | number> = [
	'M', 1, 0.3262506,
	'c', 0, 0.0383376, -0.0064626, 0.0758377, -0.0193751, 0.1125001,
	's', -0.0356247, 0.076875, -0.0681248, 0.1206252,
	'c', -0.0325, 0.0437499, -0.0762503, 0.0931247, -0.1312501, 0.1481249,
	'C', 0.7262502, 0.7625008, 0.6566626, 0.8279132, 0.5724999, 0.9037505,
	'L', 0.5, 0.9687506,
	'L', 0.4275001, 0.9037505,
	'C', 0.3433374, 0.8279132, 0.2737499, 0.7625005, 0.21875, 0.7075007,
	'C', 0.1637501, 0.6525008, 0.1199999, 0.6031258, 0.0874999, 0.5593758,
	'S', 0.0322876, 0.4754133, 0.0193751, 0.4387506,
	'S', 0, 0.3645881, 0, 0.3262506,
	'c', 0, -0.0783374, 0.0262499, -0.1437498, 0.07875, -0.1962499,
	's', 0.1179124, -0.07875, 0.1962499, -0.07875,
	'c', 0.0433376, 0, 0.0845875, 0.0091625, 0.12375, 0.0274999,
	'S', 0.4716623, 0.1229131, 0.5, 0.1562506,
	'c', 0.0283374, -0.0333375, 0.0620874, -0.0591625, 0.1012502, -0.0775,
	'c', 0.0391627, -0.0183375, 0.0804126, -0.0274999, 0.12375, -0.0274999,
	'c', 0.0783374, 0, 0.1437497, 0.0262499, 0.1962501, 0.07875,
	'S', 1, 0.2479131, 1, 0.3262506,
	'z'
];

export const heart = (x: number, y: number, size: number) => {
	let move = false;
	let i = 0;
	return HEART_COMMANDS.map((v) => {
		if (typeof v == 'string') {
			i = 0;
			move = v.toUpperCase() == v;
			return v;
		}
		i++;
		v = v * size;
		if (move) {
			v += i % 2 == 1 ? x : y;
		}
		return numToAttr(v);
	}).join(' ');
};

/**
 * Data modules helpers.
 */
export const dataModuleCanBeRandomSize = (style: DataModulesStyle): boolean =>
	style === 'square' ||
	style === 'pinched-square' ||
	style === 'circle' ||
	style === 'star' ||
	style === 'heart' ||
	style === 'diamond' ||
	style === 'hashtag';

export const getScaleFactor = (style: string, isRandom: boolean, size = 1) => {
	if (style === 'square-sm') {
		return 0.75;
	} else if (isRandom) {
		return Math.random() * (1 - 0.75) + 0.75;
	} else if (dataModuleCanBeRandomSize(style as DataModulesStyle)) {
		return size;
	}
	return 1;
};

export const getModuleNeighbours = (
	x: number,
	y: number,
	modules: Modules
): DataModulesNeighbours => {
	const sides = {
		left: x === 0 ? false : modules[y][x - 1],
		right: x === modules[y].length - 1 ? false : modules[y][x + 1],
		top: y === 0 ? false : modules[y - 1][x],
		bottom: y === modules.length - 1 ? false : modules[y + 1][x]
	};

	return {
		...sides,
		count: Object.values(sides).filter(Boolean).length
	};
};

export const isRenderableDataModule = ({
	x,
	y,
	modules,
	numCells
}: {
	x: number;
	y: number;
	modules: Modules;
	numCells: number;
}) => {
	return (
		y >= 0 &&
		y < modules.length &&
		x >= 0 &&
		x < modules[y].length &&
		modules[y][x] &&
		!isFinderPatternOuterModule({ x, y, numCells }) &&
		!isFinderPatternInnerModule({ x, y, numCells })
	);
};

export const getRenderableDataModuleNeighbours = (
	x: number,
	y: number,
	modules: Modules,
	numCells: number
): DataModulesNeighbours => {
	const sides = {
		left: isRenderableDataModule({ x: x - 1, y, modules, numCells }),
		right: isRenderableDataModule({ x: x + 1, y, modules, numCells }),
		top: isRenderableDataModule({ x, y: y - 1, modules, numCells }),
		bottom: isRenderableDataModule({ x, y: y + 1, modules, numCells })
	};

	return {
		...sides,
		count: Object.values(sides).filter(Boolean).length
	};
};

export const rect = (x: number, y: number, width: number, height: number) =>
	`M${x},${y}h${width}v${height}h${-width}Z`;

export const square = (x: number, y: number, size: number) => rect(x, y, size, size);

export const circle = (x: number, y: number, size: number) =>
	`M${x},${y + size / 2}a${size / 2},${size / 2} 0 1,0 ${size},0a${size / 2},${size / 2} 0 1,0 -${size},0Z`;

export const diamond = (x: number, y: number, size: number) =>
	`M${x},${y + size / 2}l${size / 2},-${size / 2}l${size / 2},${size / 2}l-${size / 2},${size / 2}Z`;

// Wound clockwise (sweep-flag 1) so the pad fills correctly when combined
// in a single path with clockwise-wound trace rects under nonzero fill.
// Switching to circle() (counter-clockwise) would XOR the overlap and
// produce donut-shaped pads.
export const circuitBoardPad = (cx: number, cy: number, radius: number) =>
	`M${cx - radius},${cy}a${radius},${radius} 0 1,1 ${radius * 2},0a${radius},${radius} 0 1,1 ${-radius * 2},0Z`;

export const circuitBoardShouldDrawPad = ({ count }: DataModulesNeighbours) => count === 1;

export const topRightRounded = (x: number, y: number) =>
	`M ${x} ${y}
   v 1
   h 1
   v -0.5
   a 0.5 0.5, 0, 0, 0, -0.5 -0.5`;

export const topLeftRounded = (x: number, y: number) =>
	`M ${x + 1} ${y}
   v 1
   h -1
   v -0.5
   a 0.5 0.5, 0, 0, 1, 0.5 -0.5`;

export const bottomRightRounded = (x: number, y: number) =>
	`M ${x} ${y}
   v 1
   h 0.5
   a 0.5 0.5, 0, 0, 0, 0.5 -0.5
   v -0.5
   h -1`;

export const bottomLeftRounded = (x: number, y: number) =>
	`M ${x + 1} ${y}
   v 1
   h -0.5
   a 0.5 0.5, 0, 0, 1, -0.5 -0.5
   v -0.5
   h 1`;

export const rightRounded = (x: number, y: number, w = 1) => {
	const cy = y + 0.5;
	const r = w / 2;
	const straight = 1 - r;
	return `M ${x} ${cy - r}
   v ${w}
   h ${straight}
   a ${r} ${r}, 0, 0, 0, 0 -${w}`;
};

export const leftRounded = (x: number, y: number, w = 1) => {
	const cy = y + 0.5;
	const r = w / 2;
	const straight = 1 - r;
	return `M ${x + 1} ${cy - r}
   v ${w}
   h -${straight}
   a ${r} ${r}, 0, 0, 1, 0 -${w}`;
};

export const topRounded = (x: number, y: number, w = 1) => {
	const cx = x + 0.5;
	const r = w / 2;
	const straight = 1 - r;
	return `M ${cx - r} ${y + 1}
   h ${w}
   v -${straight}
   a ${r} ${r}, 0, 0, 0, -${w} 0`;
};

export const bottomRounded = (x: number, y: number, w = 1) => {
	const cx = x + 0.5;
	const r = w / 2;
	const straight = 1 - r;
	return `M ${cx - r} ${y}
   h ${w}
   v ${straight}
   a ${r} ${r}, 0, 0, 1, -${w} 0`;
};

// Renders a `rounded`-style cell as the union of a central hub plus arms
// reaching toward each present neighbour. Hub corners whose two adjacent
// sides are both empty are filleted with a quarter-circle of radius lw/2,
// preserving the rounded aesthetic at any lineWidth.
export const roundedDataModule = (
	x: number,
	y: number,
	lw: number,
	neighbours: Omit<DataModulesNeighbours, 'count'>
) => {
	const { left, right, top, bottom } = neighbours;
	const cx = x + 0.5;
	const cy = y + 0.5;
	const r = lw / 2;

	const TLexp = !top && !left;
	const TRexp = !top && !right;
	const BRexp = !bottom && !right;
	const BLexp = !bottom && !left;

	const topY = top ? y : cy - r;
	const rightX = right ? x + 1 : cx + r;
	const bottomY = bottom ? y + 1 : cy + r;
	const leftX = left ? x : cx - r;

	const segments: string[] = [`M ${TLexp ? cx : cx - r} ${topY}`];
	// Top edge
	segments.push(`L ${TRexp ? cx : cx + r} ${topY}`);
	// TR transition
	if (TRexp) {
		segments.push(`A ${r} ${r} 0 0 1 ${cx + r} ${cy}`);
	} else if (top && right) {
		segments.push(`L ${cx + r} ${cy - r} L ${x + 1} ${cy - r}`);
	} else if (top) {
		segments.push(`L ${cx + r} ${cy - r}`);
	} else if (right) {
		segments.push(`L ${x + 1} ${cy - r}`);
	}
	// Right edge
	segments.push(`L ${rightX} ${BRexp ? cy : cy + r}`);
	// BR transition
	if (BRexp) {
		segments.push(`A ${r} ${r} 0 0 1 ${cx} ${cy + r}`);
	} else if (right && bottom) {
		segments.push(`L ${cx + r} ${cy + r} L ${cx + r} ${y + 1}`);
	} else if (right) {
		segments.push(`L ${cx + r} ${cy + r}`);
	} else if (bottom) {
		segments.push(`L ${cx + r} ${y + 1}`);
	}
	// Bottom edge
	segments.push(`L ${BLexp ? cx : cx - r} ${bottomY}`);
	// BL transition
	if (BLexp) {
		segments.push(`A ${r} ${r} 0 0 1 ${cx - r} ${cy}`);
	} else if (bottom && left) {
		segments.push(`L ${cx - r} ${cy + r} L ${x} ${cy + r}`);
	} else if (bottom) {
		segments.push(`L ${cx - r} ${cy + r}`);
	} else if (left) {
		segments.push(`L ${x} ${cy + r}`);
	}
	// Left edge
	segments.push(`L ${leftX} ${TLexp ? cy : cy - r}`);
	// TL transition
	if (TLexp) {
		segments.push(`A ${r} ${r} 0 0 1 ${cx} ${cy - r}`);
	} else if (left && top) {
		segments.push(`L ${cx - r} ${cy - r} L ${cx - r} ${y}`);
	} else if (left) {
		segments.push(`L ${cx - r} ${cy - r}`);
	} else if (top) {
		segments.push(`L ${cx - r} ${y}`);
	}
	segments.push('Z');
	return segments.join(' ');
};

export const leaf = (x: number, y: number, size: number) => {
	return (
		`M ${x + 1} ${y}` +
		`h -${size / 2}` +
		`a ${size / 2.5} ${size / 2.5}, 0, 0, 0, ${-size / 2.5} ${size / 2.5}` +
		`v ${size / 2}` +
		`h ${size / 2}` +
		`a ${size / 2.5} ${size / 2.5}, 0, 0, 0, ${size / 2.5} ${-size / 2.5}`
	);
};

/**
 * Finder patterns helpers.
 */
export const isFinderPatternOuterModule = ({
	x,
	y,
	numCells
}: {
	x: number;
	y: number;
	numCells: number;
}): boolean => {
	if (
		FINDER_PATTERN_OUTER_MASK[x]?.[y] ||
		FINDER_PATTERN_OUTER_MASK[x - numCells + 7]?.[y] ||
		FINDER_PATTERN_OUTER_MASK[x]?.[y - numCells + 7]
	) {
		return true;
	}
	return false;
};

export const isFinderPatternInnerModule = ({
	x,
	y,
	numCells
}: {
	x: number;
	y: number;
	numCells: number;
}): boolean => {
	if (
		FINDER_PATTERN_INNER_MASK[x]?.[y] ||
		FINDER_PATTERN_INNER_MASK[x - numCells + 7]?.[y] ||
		FINDER_PATTERN_INNER_MASK[x]?.[y - numCells + 7]
	) {
		return true;
	}
	return false;
};

const finderPatternsOuterRoundedSquare = ({
	x,
	y,
	radius
}: {
	x: number;
	y: number;
	radius: number;
}) => {
	const size = FINDER_PATTERN_SIZE - radius;
	const arc = radius / 2;
	return (
		`M ${x} ${y + arc}` +
		`v ${size}` +
		`a ${arc} ${arc}, 0, 0, 0, ${arc} ${arc}` +
		`h ${size}` +
		`a ${arc} ${arc}, 0, 0, 0, ${arc} ${-arc}` +
		`v ${-size}` +
		`a ${arc} ${arc}, 0, 0, 0, ${-arc} ${-arc}` +
		`h ${-size}` +
		`a ${arc} ${arc}, 0, 0, 0, ${-arc} ${arc}` +
		`M ${x + arc} ${y + 1}` +
		`h ${size}` +
		`a ${arc - 1} ${arc - 1}, 0, 0, 1, ${arc - 1} ${arc - 1}` +
		`v ${size}` +
		`a ${arc - 1} ${arc - 1}, 0, 0, 1, ${-(arc - 1)} ${arc - 1}` +
		`h ${-size}` +
		`a ${arc - 1} ${arc - 1}, 0, 0, 1, ${-(arc - 1)} ${-(arc - 1)}` +
		`v ${-size}` +
		`a ${arc - 1} ${arc - 1}, 0, 0, 1, ${arc - 1} ${-(arc - 1)}`
	);
};

const finderPatternsOuterLeaf = ({ x, y, radius }: { x: number; y: number; radius: number }) => {
	const size = FINDER_PATTERN_SIZE - radius;
	const arc = radius / 2;
	const arcSize = FINDER_PATTERN_SIZE - arc;
	return (
		`M ${x} ${y + arc}` +
		`v ${size}` +
		`a ${arc} ${arc}, 0, 0, 0, ${arc} ${arc}` +
		`h ${arcSize}` +
		`v ${-arcSize}` +
		`a ${arc} ${arc}, 0, 0, 0, ${-arc} ${-arc}` +
		`h ${-size}` +
		`H ${x}` +
		'z' +
		`M ${x + arc} ${y + 1}` +
		`h ${size}` +
		`a ${arc - 1} ${arc - 1}, 0, 0, 1, ${arc - 1} ${arc - 1}` +
		`v ${arcSize - 1}` +
		`h ${-(arcSize - 1)}` +
		`a ${arc - 1} ${arc - 1}, 0, 0, 1, ${-(arc - 1)} ${-(arc - 1)}` +
		`v ${-(arcSize - 1)}` +
		'z'
	);
};

const finderPatternsOuterInOutPoint = ({
	x,
	y,
	radius
}: {
	x: number;
	y: number;
	radius: number;
}) => {
	const size = FINDER_PATTERN_SIZE - radius;
	const arc = radius / 2;
	const arcSize = FINDER_PATTERN_SIZE - arc;
	return (
		`M ${x} ${y + arc}` +
		`v ${size}` +
		`a ${arc} ${arc}, 0, 0, 0, ${arc} ${arc}` +
		`h ${arcSize}` +
		`v ${-arcSize}` +
		`a ${arc} ${arc}, 0, 0, 0, ${-arc} ${-arc}` +
		`h ${-size}` +
		`a ${arc} ${arc}, 0, 0, 0, ${-arc} ${arc}` +
		`M ${x + arc} ${y + 1}` +
		`h ${size}` +
		`a ${arc - 1} ${arc - 1}, 0, 0, 1, ${arc - 1} ${arc - 1}` +
		`v ${arcSize - 1}` +
		`h ${-(arcSize - 1)}` +
		`a ${arc - 1} ${arc - 1}, 0, 0, 1, ${-(arc - 1)} ${-(arc - 1)}` +
		`v ${-size}` +
		`a ${arc - 1} ${arc - 1}, 0, 0, 1, ${arc - 1} ${-(arc - 1)}`
	);
};

const finderPatternsInnerLeaf = ({ x, y, radius }: { x: number; y: number; radius: number }) => {
	const size = FINDER_PATTERN_INNER_SIZE - radius;
	const arc = radius / 2;
	const arcSize = FINDER_PATTERN_INNER_SIZE - arc;
	return (
		`M ${x} ${y + arc}` +
		`v ${size}` +
		`a ${arc} ${arc}, 0, 0, 0, ${arc} ${arc}` +
		`h ${arcSize}` +
		`v ${-arcSize}` +
		`a ${arc} ${arc}, 0, 0, 0, ${-arc} ${-arc}` +
		`h ${-size}` +
		`H ${x}` +
		'z'
	);
};

const finderPatternsInnerInOutPoint = ({
	x,
	y,
	radius
}: {
	x: number;
	y: number;
	radius: number;
}) => {
	const size = FINDER_PATTERN_INNER_SIZE - radius;
	const arc = radius / 2;
	const arcSize = FINDER_PATTERN_INNER_SIZE - arc;
	return (
		`M ${x} ${y + arc}` +
		`v ${size}` +
		`a ${arc} ${arc}, 0, 0, 0, ${arc} ${arc}` +
		`h ${arcSize}` +
		`v ${-arcSize}` +
		`a ${arc} ${arc}, 0, 0, 0, ${-arc} ${-arc}` +
		`h ${-size}` +
		`a ${arc} ${arc}, 0, 0, 0, ${-arc} ${arc}`
	);
};

/**
 * Shape builders — the Svelte equivalents of the react-qr-code sub-components.
 */
export const getFinderPatternsOuter = (
	modules: Modules,
	margin: number,
	style: FinderPatternOuterStyle
): QRCodeShape[] => {
	const coordinates = [
		{ x: margin, y: margin },
		{ x: modules.length + margin - FINDER_PATTERN_SIZE, y: margin },
		{ x: margin, y: modules.length + margin - FINDER_PATTERN_SIZE }
	];

	if (
		style === 'rounded-sm' ||
		style === 'rounded' ||
		style === 'rounded-lg' ||
		style === 'circle' ||
		style === 'square' ||
		style === 'pinched-square'
	) {
		const ops: string[] = [];
		for (const { x, y } of coordinates) {
			if (style === 'rounded-sm' || style === 'rounded' || style === 'rounded-lg') {
				ops.push(
					finderPatternsOuterRoundedSquare({
						x,
						y,
						radius: FINDER_PATTERN_OUTER_RADIUSES[style]
					})
				);
			} else if (style === 'circle') {
				ops.push(
					`M ${x + FINDER_PATTERN_SIZE / 2} ${y}` +
						`a ${FINDER_PATTERN_SIZE / 2} ${FINDER_PATTERN_SIZE / 2} 0 1 0 0.01 0z` +
						'z' +
						'm 0 1' +
						`a ${FINDER_PATTERN_SIZE / 2 - 1} ${FINDER_PATTERN_SIZE / 2 - 1} 0 1 1 -0.01 0` +
						'Z'
				);
			} else if (style === 'pinched-square') {
				const PINCH_CONTROL_POINT = 0.5;
				const INNER_CONTROL_POINT = 1.25;
				ops.push(
					`M ${x} ${y}` +
						`Q ${x + PINCH_CONTROL_POINT} ${y + FINDER_PATTERN_SIZE / 2}, ${x} ${y + FINDER_PATTERN_SIZE}` +
						`Q ${x + FINDER_PATTERN_SIZE / 2} ${y + FINDER_PATTERN_SIZE - PINCH_CONTROL_POINT}, ${x + FINDER_PATTERN_SIZE} ${y + FINDER_PATTERN_SIZE}` +
						`Q ${x + FINDER_PATTERN_SIZE - PINCH_CONTROL_POINT} ${y + FINDER_PATTERN_SIZE / 2}, ${x + FINDER_PATTERN_SIZE} ${y}` +
						`Q ${x + FINDER_PATTERN_SIZE / 2} ${y + PINCH_CONTROL_POINT}, ${x} ${y}` +
						'z' +
						`M ${x + 1} ${y + 1}` +
						`Q ${x + FINDER_PATTERN_SIZE / 2} ${y + INNER_CONTROL_POINT}, ${x + FINDER_PATTERN_SIZE - 1} ${y + 1}` +
						`Q ${x + FINDER_PATTERN_SIZE - INNER_CONTROL_POINT} ${y + FINDER_PATTERN_SIZE / 2}, ${x + FINDER_PATTERN_SIZE - 1} ${y + FINDER_PATTERN_SIZE - 1}` +
						`Q ${x + FINDER_PATTERN_SIZE / 2} ${y + FINDER_PATTERN_SIZE - INNER_CONTROL_POINT}, ${x + 1} ${y + FINDER_PATTERN_SIZE - 1}` +
						`Q ${x + INNER_CONTROL_POINT} ${y + FINDER_PATTERN_SIZE / 2}, ${x + 1} ${y + 1}` +
						'z'
				);
			} else {
				ops.push(
					`M ${x} ${y}` +
						`v ${FINDER_PATTERN_SIZE}` +
						`h ${FINDER_PATTERN_SIZE}` +
						`v ${-FINDER_PATTERN_SIZE}` +
						'z' +
						`M ${x + 1} ${y + 1}` +
						`h ${FINDER_PATTERN_SIZE - 2}` +
						`v ${FINDER_PATTERN_SIZE - 2}` +
						`h ${-FINDER_PATTERN_SIZE + 2}` +
						'z'
				);
			}
		}
		return [{ kind: 'path', d: ops.join('') }];
	}

	const pathFn =
		style === 'leaf-sm' || style === 'leaf' || style === 'leaf-lg'
			? finderPatternsOuterLeaf
			: finderPatternsOuterInOutPoint;
	return coordinates.map(({ x, y }, index) => ({
		kind: 'path',
		d: pathFn({ x, y, radius: FINDER_PATTERN_OUTER_RADIUSES[style] }),
		rotation: FINDER_PATTERN_OUTER_ROTATIONS[style][index]
	}));
};

export const getFinderPatternsInner = (
	modules: Modules,
	margin: number,
	style: FinderPatternInnerStyle
): QRCodeShape[] => {
	const coordinates = [
		{ x: margin + 2, y: margin + 2 },
		{ x: modules.length + margin - FINDER_PATTERN_SIZE + 2, y: margin + 2 },
		{ x: margin + 2, y: modules.length + margin - FINDER_PATTERN_SIZE + 2 }
	];

	if (
		style === 'rounded-sm' ||
		style === 'rounded' ||
		style === 'rounded-lg' ||
		style === 'circle' ||
		style === 'square'
	) {
		return coordinates.map(({ x, y }) => ({
			kind: 'rect',
			x,
			y,
			size: FINDER_PATTERN_INNER_SIZE,
			rx: FINDER_PATTERN_INNER_RADIUSES[style]
		}));
	}

	if (style === 'pinched-square') {
		return coordinates.map(({ x, y }) => ({
			kind: 'path',
			d: pinchedSquare(x, y, FINDER_PATTERN_INNER_SIZE, 0.25)
		}));
	}

	if (style === 'diamond') {
		const sizeDiff = Math.sqrt(1.5);
		const size = FINDER_PATTERN_INNER_SIZE / sizeDiff;
		const posDiff = size - size / sizeDiff;
		return coordinates.map(({ x, y }) => ({
			kind: 'rect',
			x: x + posDiff / 2,
			y: y + posDiff / 2,
			size,
			rx: 0,
			rotation: 45
		}));
	}

	if (
		style === 'inpoint-sm' ||
		style === 'inpoint' ||
		style === 'inpoint-lg' ||
		style === 'outpoint-sm' ||
		style === 'outpoint' ||
		style === 'outpoint-lg' ||
		style === 'leaf-sm' ||
		style === 'leaf' ||
		style === 'leaf-lg'
	) {
		const pathFn =
			style === 'leaf-sm' || style === 'leaf' || style === 'leaf-lg'
				? finderPatternsInnerLeaf
				: finderPatternsInnerInOutPoint;
		return coordinates.map(({ x, y }, index) => ({
			kind: 'path',
			d: pathFn({ x, y, radius: FINDER_PATTERN_INNER_RADIUSES[style] }),
			rotation: FINDER_PATTERN_OUTER_ROTATIONS[style][index]
		}));
	}

	if (style === 'heart') {
		return coordinates.map(({ x, y }) => ({
			kind: 'path',
			d: heart(x, y, FINDER_PATTERN_INNER_SIZE)
		}));
	}

	if (style === 'star') {
		return coordinates.map(({ x, y }) => ({
			kind: 'path',
			d: star(
				x + FINDER_PATTERN_INNER_SIZE / 2,
				y + FINDER_PATTERN_INNER_SIZE / 2,
				FINDER_PATTERN_INNER_SIZE * 1.2,
				DEFAULT_NUM_STAR_POINTS
			)
		}));
	}

	if (style === 'microchip') {
		return coordinates.map(({ x, y }) => ({
			kind: 'path',
			d: microchip(x, y, FINDER_PATTERN_INNER_SIZE)
		}));
	}

	// hashtag
	return coordinates.map(({ x, y }) => ({
		kind: 'path',
		d: hashtag(x - 0.25, y - 0.25, 3.5)
	}));
};

export const getDataModulesPath = (
	modules: Modules,
	margin: number,
	settings: ReturnType<typeof sanitizeDataModulesSettings>
): string => {
	const { style, randomSize, scale: moduleScale, lineWidth } = settings;
	const ops: string[] = [];
	const numCells = modules.length;
	const isRandom = dataModuleCanBeRandomSize(style) && randomSize;

	modules.forEach((row, y) => {
		row.forEach((cell, x) => {
			// Skip the finder patterns
			if (
				isFinderPatternOuterModule({ x, y, numCells }) ||
				isFinderPatternInnerModule({ x, y, numCells })
			) {
				return;
			}

			const scale = getScaleFactor(style, isRandom, moduleScale);
			const size = 1 * scale;
			const posOffset = (1 - 1 * scale) / 2;
			const baseX = x + margin;
			const baseY = y + margin;
			const xPos = baseX + posOffset;
			const yPos = baseY + posOffset;
			const lwOffset = (1 - lineWidth) / 2;

			if (cell) {
				if (style === 'circuit-board') {
					const cx = baseX + 0.5;
					const cy = baseY + 0.5;
					const traceHalf = lineWidth / 2;
					// Traces extend traceHalf past both endpoints so that adjacent
					// traces fully cover the cell-center square at every junction
					// (preventing white notches at L/T/+ bends under nonzero fill).
					const traceLength = 1 + lineWidth;
					const neighbours = getRenderableDataModuleNeighbours(x, y, modules, numCells);
					const { right, bottom, count } = neighbours;

					if (right) {
						ops.push(rect(cx - traceHalf, cy - traceHalf, traceLength, lineWidth));
					}
					if (bottom) {
						ops.push(rect(cx - traceHalf, cy - traceHalf, lineWidth, traceLength));
					}
					if (count === 0) {
						const isolatedSize = 0.75;
						const isolatedOffset = (1 - isolatedSize) / 2;
						ops.push(square(baseX + isolatedOffset, baseY + isolatedOffset, isolatedSize));
					} else if (circuitBoardShouldDrawPad(neighbours)) {
						ops.push(circuitBoardPad(cx, cy, CIRCUIT_BOARD_PAD_RADIUS));
					}
				} else if (style === 'square' || style === 'square-sm') {
					ops.push(square(xPos, yPos, size));
				} else if (style === 'pinched-square') {
					ops.push(pinchedSquare(xPos, yPos, size, 0.25));
				} else if (style === 'circle') {
					ops.push(circle(xPos, yPos, size));
				} else if (style === 'diamond') {
					ops.push(diamond(xPos, yPos, size));
				} else if (style === 'star') {
					ops.push(star(xPos + size / 2, yPos + size / 2, size * 1.1, DEFAULT_NUM_STAR_POINTS));
				} else if (style === 'heart') {
					ops.push(heart(xPos, yPos, size));
				} else if (style === 'hashtag') {
					ops.push(hashtag(xPos, yPos, size));
				} else if (style === 'rounded') {
					const neighbours = getModuleNeighbours(x, y, modules);
					const { left, right, top, bottom, count } = neighbours;

					if (lineWidth === 1) {
						if (count === 0) {
							ops.push(circle(xPos, yPos, 1));
						} else if (count > 2 || (left && right) || (top && bottom)) {
							ops.push(square(xPos, yPos, 1));
						} else if (count === 2) {
							if (left && top) {
								ops.push(bottomRightRounded(xPos, yPos));
							} else if (top && right) {
								ops.push(bottomLeftRounded(xPos, yPos));
							} else if (right && bottom) {
								ops.push(topLeftRounded(xPos, yPos));
							} else {
								ops.push(topRightRounded(xPos, yPos));
							}
						} else {
							if (top) {
								ops.push(bottomRounded(xPos, yPos));
							} else if (right) {
								ops.push(leftRounded(xPos, yPos));
							} else if (bottom) {
								ops.push(topRounded(xPos, yPos));
							} else {
								ops.push(rightRounded(xPos, yPos));
							}
						}
					} else {
						ops.push(roundedDataModule(baseX, baseY, lineWidth, neighbours));
					}
				} else if (style === 'leaf') {
					const { left, right, top, bottom, count } = getModuleNeighbours(x, y, modules);

					if (count === 0) {
						ops.push(leaf(xPos, yPos, size));
					} else if (!left && !top) {
						ops.push(topLeftRounded(xPos, yPos));
					} else if (!right && !bottom) {
						ops.push(bottomRightRounded(xPos, yPos));
					} else {
						ops.push(square(xPos, yPos, 1));
					}
				} else if (style === 'vertical-line') {
					const { left, right, top, bottom, count } = getModuleNeighbours(x, y, modules);

					if (count === 0 || (left && !(top || bottom)) || (right && !(top || bottom))) {
						ops.push(circle(baseX + lwOffset, baseY + lwOffset, lineWidth));
					} else if (top && bottom) {
						ops.push(rect(baseX + lwOffset, baseY, lineWidth, 1));
					} else if (top && !bottom) {
						ops.push(bottomRounded(baseX, baseY, lineWidth));
					} else if (bottom && !top) {
						ops.push(topRounded(baseX, baseY, lineWidth));
					}
				} else if (style === 'horizontal-line') {
					const { left, right, top, bottom, count } = getModuleNeighbours(x, y, modules);

					if (count === 0 || (top && !(left || right)) || (bottom && !(left || right))) {
						ops.push(circle(baseX + lwOffset, baseY + lwOffset, lineWidth));
					} else if (left && right) {
						ops.push(rect(baseX, baseY + lwOffset, 1, lineWidth));
					} else if (left && !right) {
						ops.push(rightRounded(baseX, baseY, lineWidth));
					} else if (right && !left) {
						ops.push(leftRounded(baseX, baseY, lineWidth));
					}
				}
			}
		});
	});

	return ops.join('');
};

/**
 * Downloads.
 */
const triggerDownload = (href: string, fileName: string) => {
	const a = document.createElement('a');
	a.href = href;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
};

// Resolves `currentColor` fills (driven by the theme `color` classes) so the
// standalone SVG document keeps its color outside of the page stylesheet.
const cloneForExport = (svg: SVGSVGElement, fileSize: number): SVGSVGElement => {
	const cloned = svg.cloneNode(true) as SVGSVGElement;
	cloned.setAttribute('width', fileSize.toString());
	cloned.setAttribute('height', fileSize.toString());
	cloned.setAttribute('color', getComputedStyle(svg).color);
	return cloned;
};

export const downloadSVG = ({
	svg,
	fileSize,
	fileName
}: {
	svg: SVGSVGElement;
	fileSize: number;
	fileName: string;
}) => {
	const serializer = new XMLSerializer();
	const svgBlob = new Blob([serializer.serializeToString(cloneForExport(svg, fileSize))], {
		type: 'image/svg+xml'
	});
	const url = URL.createObjectURL(svgBlob);
	triggerDownload(url, `${fileName}.svg`);
	URL.revokeObjectURL(url);
};

export const downloadRaster = ({
	svg,
	fileSize,
	fileName,
	fileFormat,
	imageSettings,
	calculatedImageSettings,
	size,
	numCells,
	margin
}: {
	svg: SVGSVGElement;
	fileSize: number;
	fileName: string;
	fileFormat: DownloadFileFormat;
	imageSettings: ImageSettings | undefined;
	calculatedImageSettings: CalculatedImageSettings | null;
	size: number;
	numCells: number;
	margin: number;
}) => {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	canvas.width = fileSize;
	canvas.height = fileSize;

	const svgData = new XMLSerializer().serializeToString(cloneForExport(svg, fileSize));
	const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
	const svgUrl = URL.createObjectURL(svgBlob);

	const download = () => {
		const imageType = fileFormat === 'png' ? 'image/png' : 'image/jpeg';
		triggerDownload(canvas.toDataURL(imageType), `${fileName}.${fileFormat}`);
	};

	const qrImg = new Image();
	qrImg.crossOrigin = 'anonymous';
	qrImg.src = svgUrl;

	qrImg.onload = () => {
		ctx.drawImage(qrImg, 0, 0, fileSize, fileSize);
		URL.revokeObjectURL(svgUrl);

		if (imageSettings?.src && calculatedImageSettings) {
			const logoImg = new Image();
			logoImg.crossOrigin = 'anonymous';
			logoImg.src = imageSettings.src;

			logoImg.onload = () => {
				const ratio = fileSize / size;
				const scale = numCells / fileSize;

				const logoSize = imageSettings.width * ratio;
				const logoX = imageSettings.x
					? (calculatedImageSettings.x + margin) / scale
					: (fileSize - logoSize) / 2;
				const logoY = imageSettings.y
					? (calculatedImageSettings.y + margin) / scale
					: (fileSize - logoSize) / 2;
				ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
				download();
			};
			logoImg.onerror = (err) => console.error('Error loading logo:', err);
		} else {
			download();
		}
	};
	qrImg.onerror = (err) => console.error('Error loading QR code:', err);
};
