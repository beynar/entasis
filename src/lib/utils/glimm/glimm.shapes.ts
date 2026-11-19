// The shapes a glimm sweep can take besides glimm's own straight band: a ring that grows from a
// point, a glint that crosses from a corner, two parallel lines, and an arc that leaves a control.
// Each shape is a field `f` over the element (0 where it starts, 1 where it ends): the band sits
// where `f` equals its position, the change shows where `f` is below it. The shader, the cut of
// the content, the curtain and the blur all read the same field, so the band and the edge of what
// it reveals stay together.
//
// One shader draws every shape, glimm's straight band included, and what goes with it: the breath
// the band takes before it leaves, sparks that ride it and burn out, and the edges it lights where
// it meets them, in its own colour.

import type { Direction, Palette, ShaderController } from 'glimm';

/**
 * The form of the band: glimm's straight `line`, a `double` band from both sides that meets in the
 * middle, a `split` band that opens from the middle towards both sides, a corner `glint`, a `ring`,
 * and an `arc` that leaves a control (`source`) and swells over the element.
 */
export type GlimmShape = 'line' | 'double' | 'split' | 'glint' | 'ring' | 'arc';

export type ShapeGeometry = {
	/** The band's position, in field units, at a sweep progress from 0 to 1. */
	position: (progress: number) => number;
	/** `clip-path` of the part the band has passed, where the new content shows. */
	clip: (position: number) => string;
	/** CSS mask of a curtain covering what the band has passed (`covering`) or what it has not. */
	mask: (position: number, covering: boolean) => string;
	/**
	 * CSS mask of a soft halo around the band at `position`, `ahead` and `behind` it in field units,
	 * at `alpha`: where the content blurs as the band crosses it.
	 */
	halo: (position: number, ahead: number, behind: number, alpha: number) => string;
	/**
	 * The field at a point in CSS pixels from the element's top-left, with the band at `position`
	 * (an arc's straight part depends on it): what the shader computes, without its ripple.
	 */
	field: (x: number, y: number, position: number) => number;
	/** A point on the band at `position`, `along` it from 0 to 1, in CSS pixels from the top-left. */
	point: (position: number, along: number) => [number, number];
	/** How far ahead of and behind its position the band shows, in field units. */
	reach: { ahead: number; behind: number };
	/** The arc's frame, for the shader. */
	arc?: ArcFrame;
	/** The part of the element the field spans: its content, in CSS pixels from its top-left. */
	area: SourceRect;
	/** A ring's radius in CSS pixels: the distance to the content's farthest corner. */
	ringRadius?: number;
	/**
	 * A line's position as a share of the element from the side it leaves, for glimm's own shader,
	 * which spans the whole element.
	 */
	travel?: (position: number) => number;
};

type Box = { width: number; height: number };

/** A rectangle in CSS pixels from the element's top-left. */
export type SourceRect = { x: number; y: number; width: number; height: number };

/**
 * The arc's frame: the front is a stadium around the source that opens as it grows, flattened along
 * the source's long side (`squash`), so a wide button sends up a dome and a tall tab a sideways one.
 */
export type ArcFrame = {
	/** The source's centre. */
	center: [number, number];
	/** Whether the source is taller than wide: the front then travels sideways. */
	sideways: boolean;
	squash: number;
	/** The source's half thickness, in field units: where the front starts. */
	start: number;
	/** Half the source's straight length, in pixels, which the front loses as it opens. */
	spine: number;
	/** Pixels per field unit. */
	scale: number;
	/** The sharp edge ahead of the front and its long trail, in field units. */
	lead: number;
	tail: number;
};

// The band's half width in field units: `exp(-(d * tight)^2)` is below 1% past 2.2 / tight.
const reach = (bandTight: number) => 2.2 / Math.max(0.1, bandTight);
// The softer falloff of a glint and a double band, exp(-|d * tight|^1.4), is below 1% past this.
const softReach = (bandTight: number) => 3 / Math.max(0.1, bandTight);

const percent = (value: number) => `${Math.round(value * 10000) / 100}%`;
const pixels = (value: number) => `${Math.round(value * 100) / 100}px`;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (from: number, to: number, value: number) => {
	const t = clamp01((value - from) / (to - from));
	return t * t * (3 - 2 * t);
};
const veil = (alpha: number) => `rgba(0, 0, 0, ${Math.round(clamp01(alpha) * 1000) / 1000})`;

// The corner a glint starts from, as 0 (left, top) or 1 (right, bottom) on each axis.
export const glintCorner = (direction: Direction): [number, number] =>
	direction === 'rtl' ? [1, 0] : direction === 'btt' ? [0, 1] : [0, 0];

const towards: Record<Direction, string> = {
	ltr: 'right',
	rtl: 'left',
	ttb: 'bottom',
	btt: 'top'
};

const gradient = (direction: string, at: number, covering: boolean, soft = 3) => {
	const before = covering ? '#000' : 'transparent';
	const after = covering ? 'transparent' : '#000';
	return `linear-gradient(${direction}, ${before} ${at - soft}%, ${after} ${at + soft}%)`;
};

// A halo along a gradient line: transparent at `from`, `alpha` on the band at `at`, transparent
// again at `to`.
const halo = (
	unit: (value: number) => string,
	from: number,
	at: number,
	to: number,
	alpha: number
) => `transparent ${unit(from)}, ${veil(alpha)} ${unit(at)}, transparent ${unit(to)}`;

/**
 * Where the band of a straight line is at a progress, for glimm's own shader: its centre travels
 * from -overscan to 1 + overscan across a canvas that does not fill the viewport.
 */
export const lineOverscan = (bandTight: number) =>
	Math.max(0.2, Math.sqrt(4.6 / Math.max(0.1, bandTight)));

// How much flatter the arc is along its source than across it.
const ARC_SQUASH = 1.35;

/**
 * The source an arc leaves when none is given: the middle of the side the direction leaves from,
 * as a bar along it two fifths of that side long.
 */
export const sideSource = (direction: Direction, box: Box): SourceRect => {
	const { width, height } = box;
	if (direction === 'ltr') return { x: 0, y: height * 0.3, width: 0, height: height * 0.4 };
	if (direction === 'rtl') return { x: width, y: height * 0.3, width: 0, height: height * 0.4 };
	if (direction === 'ttb') return { x: width * 0.3, y: 0, width: width * 0.4, height: 0 };
	return { x: width * 0.3, y: height, width: width * 0.4, height: 0 };
};

function arcFrame(
	source: SourceRect,
	corners: Array<[number, number]>,
	bandTight: number
): ArcFrame {
	const sideways = source.height > source.width;
	const center: [number, number] = [source.x + source.width / 2, source.y + source.height / 2];
	const thickness = Math.min(source.width, source.height) / 2;
	const length = (sideways ? source.height : source.width) / 2;
	const spine = Math.max(0, length - thickness);
	// The farthest corner, in the arc's own metric (opened, so without the spine).
	let farthest = 1;
	for (const [x, y] of corners) {
		const along = (sideways ? y - center[1] : x - center[0]) * ARC_SQUASH;
		const across = sideways ? x - center[0] : y - center[1];
		farthest = Math.max(farthest, Math.hypot(along, across));
	}
	const tail = farthest * reach(bandTight);
	const lead = tail * 0.4;
	// One field unit carries the front past the farthest corner with its whole trail, so nothing
	// of it lingers on the far edges at the end.
	const scale = farthest + tail;
	return {
		center,
		sideways,
		squash: ARC_SQUASH,
		start: thickness / scale,
		spine,
		scale,
		lead: lead / scale,
		tail: tail / scale
	};
}

/** Half the arc's straight length at a position: it opens over the first part of its way. */
export const arcSpine = (frame: ArcFrame, position: number) =>
	frame.spine * (1 - smooth(frame.start, frame.start + 0.45 * (1 - frame.start), position));

/** The field, cut and curtain of a shape over an element of `box` size. */
export function shapeGeometry(
	shape: GlimmShape,
	direction: Direction,
	bandTight: number,
	box: Box,
	origin: [number, number],
	source?: SourceRect,
	content?: SourceRect
): ShapeGeometry {
	const { width, height } = box;
	// The field spans the element's content, not the padding around it: the band's timeline is the
	// content's, and it only passes through the padding on its way in and out.
	const area = content ?? { x: 0, y: 0, width, height };
	const corners: Array<[number, number]> = [
		[area.x, area.y],
		[area.x + area.width, area.y],
		[area.x, area.y + area.height],
		[area.x + area.width, area.y + area.height]
	];
	// A field coordinate across the content's width (u) or height (v): in pixels in the element, and
	// as a share of the element.
	const px = (u: number) => area.x + u * area.width;
	const py = (v: number) => area.y + v * area.height;
	const fx = (u: number) => px(u) / Math.max(width, 1e-3);
	const fy = (v: number) => py(v) / Math.max(height, 1e-3);
	// The same, sent to the element's edge at either end of the content, for cuts that must reach it.
	const edgeX = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : fx(u));
	const edgeY = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : fy(v));
	const shared = { area };

	if (shape === 'arc') {
		const frame = arcFrame(source ?? sideSource(direction, box), corners, bandTight);
		const [cx, cy] = frame.center;
		// The front at a position: its half extent along the source and across it, in pixels.
		const extent = (position: number) => {
			const radius = Math.max(0.01, position * frame.scale);
			const flat = arcSpine(frame, position) / frame.squash;
			return { radius, flat, along: flat + radius / frame.squash };
		};
		const ellipse = (position: number) => {
			const { radius, along } = extent(position);
			const [x, y] = frame.sideways ? [radius, along] : [along, radius];
			return `ellipse ${pixels(x)} ${pixels(y)} at ${pixels(cx)} ${pixels(cy)}`;
		};
		return {
			...shared,
			position: (progress) => frame.start + progress * (1 - frame.start),
			// A stadium flattened along the source: two straight sides and two half ellipses.
			clip: (position) => {
				const { radius: r, flat: f } = extent(position);
				const a = r / frame.squash;
				const n = (value: number) => Math.round(value * 100) / 100;
				const path = frame.sideways
					? `M ${n(cx + r)} ${n(cy - f)} L ${n(cx + r)} ${n(cy + f)} A ${n(r)} ${n(a)} 0 0 1 ${n(cx - r)} ${n(cy + f)} L ${n(cx - r)} ${n(cy - f)} A ${n(r)} ${n(a)} 0 0 1 ${n(cx + r)} ${n(cy - f)} Z`
					: `M ${n(cx - f)} ${n(cy - r)} L ${n(cx + f)} ${n(cy - r)} A ${n(a)} ${n(r)} 0 0 1 ${n(cx + f)} ${n(cy + r)} L ${n(cx - f)} ${n(cy + r)} A ${n(a)} ${n(r)} 0 0 1 ${n(cx - f)} ${n(cy - r)} Z`;
				return `path('${path}')`;
			},
			mask: (position, covering) => {
				const soft = Math.min(30, (12 / extent(position).radius) * 100);
				const before = covering ? '#000' : 'transparent';
				const after = covering ? 'transparent' : '#000';
				return `radial-gradient(${ellipse(position)}, ${before} ${100 - soft}%, ${after} ${100 + soft}%)`;
			},
			halo: (position, ahead, behind, alpha) => {
				const at = (value: number) => percent(value / Math.max(position, 1e-3));
				return `radial-gradient(${ellipse(position)}, transparent ${at(position - behind)}, ${veil(alpha)} 100%, transparent ${at(position + ahead)})`;
			},
			field: (x, y, position) => {
				const lengthwise = frame.sideways ? y - cy : x - cx;
				const crosswise = frame.sideways ? x - cx : y - cy;
				const open = Math.max(Math.abs(lengthwise) * frame.squash - arcSpine(frame, position), 0);
				return Math.hypot(open, crosswise) / frame.scale;
			},
			point: (position, along) => {
				const { radius, flat } = extent(position);
				const angle = along * Math.PI * 2;
				const cos = Math.cos(angle);
				const lengthwise = Math.sign(cos) * flat + (cos * radius) / frame.squash;
				const crosswise = Math.sin(angle) * radius;
				return frame.sideways
					? [cx + crosswise, cy + lengthwise]
					: [cx + lengthwise, cy + crosswise];
			},
			reach: { ahead: frame.lead, behind: frame.tail },
			arc: frame
		};
	}

	if (shape === 'ring') {
		const [x, y] = origin;
		const radius = Math.max(...corners.map(([cx, cy]) => Math.hypot(cx - x, cy - y)), 1);
		const margin = reach(bandTight);
		return {
			...shared,
			position: (progress) => -margin + progress * (1 + 2 * margin),
			clip: (position) => `circle(${Math.max(0, position * radius)}px at ${x}px ${y}px)`,
			mask: (position, covering) => {
				const at = position * radius;
				const before = covering ? '#000' : 'transparent';
				const after = covering ? 'transparent' : '#000';
				return `radial-gradient(circle at ${x}px ${y}px, ${before} ${at - 12}px, ${after} ${at + 12}px)`;
			},
			halo: (position, ahead, behind, alpha) =>
				`radial-gradient(circle at ${x}px ${y}px, ${halo(pixels, (position - behind) * radius, position * radius, (position + ahead) * radius, alpha)})`,
			field: (px, py) => Math.hypot(px - x, py - y) / radius,
			point: (position, along) => {
				const angle = along * Math.PI * 2;
				const r = Math.max(0, position) * radius;
				return [x + Math.cos(angle) * r, y + Math.sin(angle) * r];
			},
			reach: { ahead: margin, behind: margin },
			ringRadius: radius
		};
	}

	if (shape === 'glint') {
		const [cx, cy] = glintCorner(direction);
		const margin = softReach(bandTight);
		// u and v run from the starting corner of the content.
		const corner = (u: number, v: number) =>
			`${percent(edgeX(cx ? 1 - u : u))} ${percent(edgeY(cy ? 1 - v : v))}`;
		// The field's lines, (u + v) / 2 = position, cross the content's diagonal: a gradient along
		// their normal, with its stops in pixels along the gradient line.
		const k = [
			(cx ? -1 : 1) / Math.max(area.width, 1e-3),
			(cy ? -1 : 1) / Math.max(area.height, 1e-3)
		];
		const norm = Math.hypot(k[0], k[1]);
		const n = [k[0] / norm, k[1] / norm];
		const angle = Math.round(((Math.atan2(n[0], -n[1]) * 180) / Math.PI) * 100) / 100;
		const length = Math.abs(width * n[0]) + Math.abs(height * n[1]);
		const start = [width / 2 - (n[0] * length) / 2, height / 2 - (n[1] * length) / 2];
		const origin0 = [px(cx), py(cy)];
		const offset = (origin0[0] - start[0]) * n[0] + (origin0[1] - start[1]) * n[1];
		const along = (position: number) => (2 * position) / norm + offset;
		const diagonal = (stops: string) => `linear-gradient(${angle}deg, ${stops})`;
		return {
			...shared,
			position: (progress) => -margin + progress * (1 + 2 * margin),
			// The part where (u + v) / 2 < position: a triangle, then a pentagon past the middle.
			// Always five points, so it interpolates.
			clip: (position) => {
				const k = Math.max(0, Math.min(2, position * 2));
				const points =
					k <= 1
						? [corner(0, 0), corner(k, 0), corner(k, 0), corner(0, k), corner(0, k)]
						: [corner(0, 0), corner(1, 0), corner(1, k - 1), corner(k - 1, 1), corner(0, 1)];
				return `polygon(${points.join(', ')})`;
			},
			mask: (position, covering) => {
				const at = along(position);
				const before = covering ? '#000' : 'transparent';
				const after = covering ? 'transparent' : '#000';
				return diagonal(`${before} ${pixels(at - 10)}, ${after} ${pixels(at + 10)}`);
			},
			halo: (position, ahead, behind, alpha) =>
				diagonal(
					halo(pixels, along(position - behind), along(position), along(position + ahead), alpha)
				),
			field: (x, y) => {
				const u = (x - area.x) / Math.max(area.width, 1e-3);
				const v = (y - area.y) / Math.max(area.height, 1e-3);
				return ((cx ? 1 - u : u) + (cy ? 1 - v : v)) / 2;
			},
			point: (position, at) => {
				const sum = 2 * position;
				const u = Math.max(0, sum - 1) + at * (Math.min(1, sum) - Math.max(0, sum - 1));
				const v = sum - u;
				return [px(cx ? 1 - u : u), py(cy ? 1 - v : v)];
			},
			reach: { ahead: margin, behind: margin }
		};
	}

	const horizontal = direction === 'ltr' || direction === 'rtl';
	// Along the travel axis (0 to 1 from the left or the top of the content), as a share of the
	// element, and a point at `at` along it and `across` it.
	const share = horizontal ? fx : fy;
	const point = (at: number, across: number): [number, number] =>
		horizontal ? [px(at), py(across)] : [px(across), py(at)];
	const axis = horizontal ? 'right' : 'bottom';
	// Along the travel axis in content units, at a point in pixels.
	const alongAt = (x: number, y: number) =>
		horizontal
			? (x - area.x) / Math.max(area.width, 1e-3)
			: (y - area.y) / Math.max(area.height, 1e-3);
	const share100 = (value: number) => share(value) * 100;

	if (shape === 'double') {
		// Two bands, one from each side (left and right for ltr and rtl, top and bottom otherwise),
		// meeting in the middle: the field is the distance to the nearer side, 0 to 0.5.
		const margin = softReach(bandTight);
		const edge = horizontal ? edgeX : edgeY;
		const at = (along: number, across: number) =>
			horizontal ? `${percent(along)} ${percent(across)}` : `${percent(across)} ${percent(along)}`;
		return {
			...shared,
			position: (progress) => -margin + progress * (0.5 + 1.5 * margin),
			// Both edge strips as one polygon, joined along the starting edge (a zero-area seam).
			clip: (position) => {
				const k = Math.max(0, Math.min(0.5, position));
				const near = k > 0 ? edge(k) : 0;
				const far = k > 0 ? edge(1 - k) : 1;
				return `polygon(${[
					at(0, 0),
					at(near, 0),
					at(near, 1),
					at(0, 1),
					at(0, 0),
					at(1, 0),
					at(1, 1),
					at(far, 1),
					at(far, 0),
					at(0, 0)
				].join(', ')})`;
			},
			mask: (position, covering) => {
				const near = share100(position);
				const far = share100(1 - position);
				const outer = covering ? '#000' : 'transparent';
				const middle = covering ? 'transparent' : '#000';
				return `linear-gradient(to ${axis}, ${outer} ${near - 3}%, ${middle} ${near + 3}%, ${middle} ${far - 3}%, ${outer} ${far + 3}%)`;
			},
			halo: (position, ahead, behind, alpha) =>
				`linear-gradient(to ${axis}, ${halo(percent, share(position - behind), share(position), share(position + ahead), alpha)}, ${halo(percent, share(1 - position - ahead), share(1 - position), share(1 - position + behind), alpha)})`,
			field: (x, y) => {
				const along = alongAt(x, y);
				return Math.min(along, 1 - along);
			},
			point: (position, along) =>
				along < 0.5 ? point(position, along * 2) : point(1 - position, along * 2 - 1),
			reach: { ahead: margin, behind: margin }
		};
	}

	if (shape === 'split') {
		// Two bands leaving the middle for both sides: the field is the distance to the middle,
		// 0 there and 1 at both sides.
		const margin = softReach(bandTight);
		const edge = horizontal ? edgeX : edgeY;
		return {
			...shared,
			position: (progress) => -margin + progress * (1 + 2 * margin),
			clip: (position) => {
				const open = clamp01(position) / 2;
				const near = percent(edge(0.5 - open));
				const far = percent(1 - edge(0.5 + open));
				return horizontal ? `inset(0% ${far} 0% ${near})` : `inset(${near} 0% ${far} 0%)`;
			},
			mask: (position, covering) => {
				const near = share100(0.5 - position / 2);
				const far = share100(0.5 + position / 2);
				const middle = covering ? '#000' : 'transparent';
				const outer = covering ? 'transparent' : '#000';
				return `linear-gradient(to ${axis}, ${outer} ${near - 3}%, ${middle} ${near + 3}%, ${middle} ${far - 3}%, ${outer} ${far + 3}%)`;
			},
			halo: (position, ahead, behind, alpha) => {
				const near = (value: number) => share(0.5 - value / 2);
				const far = (value: number) => share(0.5 + value / 2);
				return `linear-gradient(to ${axis}, ${halo(percent, near(position + ahead), near(position), near(position - behind), alpha)}, ${halo(percent, far(position - behind), far(position), far(position + ahead), alpha)})`;
			},
			field: (x, y) => Math.abs(alongAt(x, y) - 0.5) * 2,
			point: (position, along) =>
				along < 0.5
					? point(0.5 - position / 2, along * 2)
					: point(0.5 + position / 2, along * 2 - 1),
			reach: { ahead: margin, behind: margin }
		};
	}

	// A line along the direction, measured from where the band leaves.
	const margin = lineOverscan(bandTight);
	const side = { ltr: 1, rtl: 3, ttb: 2, btt: 0 }[direction];
	const flipped = direction === 'rtl' || direction === 'btt';
	// glimm's band, exp(-d² · tight), is down to a third of its height here.
	const band = Math.sqrt(1.1 / Math.max(0.1, bandTight));
	// How far into the element a position is, as a share of it, from the side the band leaves.
	const travel = (position: number) => (flipped ? 1 - share(1 - position) : share(position));
	return {
		...shared,
		position: (progress) => -margin + progress * (1 + 2 * margin),
		clip: (position) => {
			const insets = [0, 0, 0, 0];
			insets[side] = 1 - clamp01(travel(position));
			return `inset(${insets.map(percent).join(' ')})`;
		},
		mask: (position, covering) =>
			gradient(`to ${towards[direction]}`, travel(position) * 100, covering),
		halo: (position, ahead, behind, alpha) =>
			`linear-gradient(to ${towards[direction]}, ${halo(percent, travel(position - behind), travel(position), travel(position + ahead), alpha)})`,
		field: (x, y) => (flipped ? 1 - alongAt(x, y) : alongAt(x, y)),
		point: (position, along) => point(flipped ? 1 - position : position, along),
		reach: { ahead: band, behind: band },
		travel
	};
}

/* ---------------------------------------------------------------------------------------------- */
/* Shader                                                                                         */
/* ---------------------------------------------------------------------------------------------- */

/** The most sparks a sweep throws. */
export const MAX_SPARKS = 32;

const VERTEX = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

// One band along the shape's field (seen twice for `double`, whose field folds at the middle),
// coloured by the cosine palette along the band and across it, with a white core and a ripple that
// drifts with time. Over it, the colour left on the element's edges, its white hairline, and the
// sparks. Dithered, so the soft gradients do not band.
const FRAGMENT = `
precision highp float;
#define MAX_SPARKS ${MAX_SPARKS}
uniform vec2 uRes;
uniform float uDpr;
uniform float uShape;
uniform float uTime;
uniform float uPos;
uniform float uBreath;
uniform float uProgress;
uniform float uAlpha;
uniform float uTight;
uniform float uBrightness;
uniform float uRipple;
uniform float uSpeed;
uniform float uFeather;
uniform float uAxis;
uniform float uFlip;
uniform vec2 uCorner;
uniform vec2 uOrigin;
uniform float uRadius;
uniform vec4 uArea;
uniform float uHold;
uniform vec2 uArcCenter;
uniform float uArcSideways;
uniform float uArcSquash;
uniform float uArcStart;
uniform float uArcSpine;
uniform float uArcScale;
uniform float uLead;
uniform float uTail;
uniform float uEdges;
uniform float uCurve;
uniform float uWave;
uniform float uSpan;
uniform float uSwell;
uniform float uEdgeWidth;
uniform float uRound;
uniform vec3 uSparks[MAX_SPARKS];
uniform float uSparkSize;
uniform float uHue;
uniform vec3 uPalA;
uniform vec3 uPalB;
uniform vec3 uPalC;
uniform vec3 uPalD;

vec3 palette(float t) {
	return uPalA + uPalB * cos(6.28318 * (uPalC * t + uPalD));
}

float dither(vec2 p) {
	return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))) - 0.5;
}

void main() {
	vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
	vec2 css = px / uDpr;
	vec2 size = uRes / uDpr;
	// The field spans the content, not the padding around it.
	vec2 uv = (css - uArea.xy) / max(uArea.zw, vec2(1.0));
	float time = uTime * uSpeed;
	int shape = int(uShape + 0.5);
	float f;
	float across;
	if (shape == 5) {
		vec2 q = css - uArcCenter;
		float lengthwise = uArcSideways > 0.5 ? q.y : q.x;
		float crosswise = uArcSideways > 0.5 ? q.x : q.y;
		float opening = smoothstep(uArcStart, uArcStart + 0.45 * (1.0 - uArcStart), uPos);
		float spine = uArcSpine * (1.0 - opening);
		vec2 v = vec2(max(abs(lengthwise) * uArcSquash - spine, 0.0), crosswise);
		f = length(v) / uArcScale;
		// Measured on the opened front, so its straight part reads as one direction.
		float angle = atan(crosswise, sign(lengthwise) * v.x);
		across = 0.3 * sin(angle) + 0.15 * cos(2.0 * angle);
	} else if (shape == 3) {
		vec2 offset = css - uOrigin;
		f = length(offset) / uRadius;
		// A periodic function of the angle: no seam where atan wraps around.
		float angle = atan(offset.y, offset.x);
		across = 0.3 * sin(angle) + 0.15 * cos(2.0 * angle);
	} else if (shape == 2) {
		vec2 c = abs(uv - uCorner);
		f = (c.x + c.y) * 0.5;
		across = (c.x - c.y) * 0.5;
	} else {
		float along = uAxis < 0.5 ? uv.x : uv.y;
		if (shape == 4) f = abs(along - 0.5) * 2.0;
		else if (shape == 1) f = min(along, 1.0 - along);
		else f = uFlip > 0.5 ? 1.0 - along : along;
		across = uAxis < 0.5 ? uv.y : uv.x;
	}
	// The ripple bends the other shapes' edges; a line keeps its silhouette and ripples its colour.
	if (shape != 0) f += uRipple * 0.012 * sin(across * 23.0 + time * 2.4) * sin(across * 7.0 - time * 1.3);

	// The band, drawn back by its breath before it leaves.
	float d = f - (uPos + uBreath);
	float band = 0.0;
	// What lights the edges: the band itself, or for the arc only its front, not its long trail.
	float touching = 0.0;
	vec3 color;
	vec3 rgb;
	float alpha;
	float enter = smoothstep(0.0, 0.12, uProgress) * (1.0 - smoothstep(0.88, 1.0, uProgress));
	float fade = mix(0.3, 1.0, enter);
	float paletteAt = across * 0.75 + time * 0.05 + uHue;
	if (shape == 0) {
		// glimm's own straight band (MIT, glimm 0.4), over the content: a wide crest with a faint
		// wake, its colour turning with a synthesised surface normal, and a highlight on the crest.
		float along = uAxis < 0.5 ? uv.x : uv.y;
		float tw = time;
		float waveX = sin(across * 4.2 + tw * 0.08 + 0.3) * 0.004 * uWave;
		float spanAt = (across - 0.5) / max(0.5 * uSpan, 0.001);
		float lag = uCurve * clamp(spanAt, -1.0, 1.0) * clamp(spanAt, -1.0, 1.0);
		float spanMask = uSpan >= 1.0 ? 1.0 : 1.0 - smoothstep(0.45, 1.0, abs(spanAt));
		d = d - waveX + lag;
		band = exp(-d * d * uTight) * spanMask;
		float slope = -2.0 * d * uTight * exp(-d * d * uTight) * (uFlip > 0.5 ? -1.0 : 1.0);
		vec3 n = normalize(uAxis < 0.5 ? vec3(-slope * 0.18, 0.0, 1.0) : vec3(0.0, slope * 0.18, 1.0));
		float behind = max(-d, 0.0);
		float wake = smoothstep(0.0, 0.08, behind) * (1.0 - smoothstep(0.12, 0.65, behind)) * 0.10;
		float midway = 4.0 * uProgress * (1.0 - uProgress);
		float glow = exp(-d * d * 2.5) * 0.05 * midway;
		float intensity = clamp(max(band, wake * spanMask) + glow * (1.0 - band), 0.0, 1.0);
		float ripple = sin(across * 12.0 + along * 3.0 + tw * 0.40) * 0.015 * uRipple;
		float t = n.x * 0.12 + n.y * 0.08 + along * 0.90 + across * 0.16 + ripple + uHue + uTime * 0.04;
		color = palette(t) * 0.5 + palette(t - 0.18) * 0.25 + palette(t + 0.18) * 0.25;
		vec3 lit = color * uBrightness;
		vec3 h = normalize(normalize(vec3(0.35, 0.55, 0.9)) + vec3(0.0, 0.0, 1.0));
		float fresnel = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);
		float spec = pow(clamp(dot(n, h), 0.0, 1.0), 80.0);
		float entry = mix(0.2, 1.0, midway);
		fade = entry;
		float bodyA = intensity * uAlpha * entry;
		float highMask = band * uAlpha * entry * uSwell;
		rgb = lit * bodyA + (lit * fresnel * 0.55 + vec3(spec) * 1.1) * highMask;
		alpha = min(bodyA + (fresnel * 0.4 + spec * 0.9) * highMask, 1.0);
	} else {
		if (shape == 5) {
			// A sharp edge ahead, a long trail behind whose length breathes along the front.
			float lobes = 0.5 + 0.5 * sin(across * 9.0 + time * 1.4) * cos(across * 4.0 - time * 0.7 + 1.2);
			if (d >= 0.0) {
				float k = clamp(1.0 - d / uLead, 0.0, 1.0);
				band = k * k * k * (k * (k * 6.0 - 15.0) + 10.0);
			} else {
				band = pow(1.0 - clamp(-d / (uTail * mix(0.6, 1.3, lobes)), 0.0, 1.0), 2.3);
			}
		} else {
			band = exp(-pow(d * uTight, 2.0));
		}
		if (shape == 2) {
			// A glint: a softer falloff across it, and it fades out towards both of its ends.
			band = exp(-pow(abs(d * uTight), 1.4)) * (1.0 - smoothstep(0.12, 0.5, abs(across)));
			// Short near the corners it starts and ends in: it fades there instead of pooling.
			band *= smoothstep(-0.05, 0.25, uPos) * (1.0 - smoothstep(0.75, 1.05, uPos));
		}
		if (shape == 1) {
			// Two soft bands from both sides; they fade as they meet in the middle.
			band = exp(-pow(abs(d * uTight), 1.4)) * (1.0 - smoothstep(0.34, 0.56, uPos));
		}
		if (shape == 4) {
			// Two soft bands leaving the middle; they grow in as they part, so they do not start as a blob.
			band = exp(-pow(abs(d * uTight), 1.4)) * smoothstep(-0.1, 0.25, uPos);
		}
		if (shape == 5 && uArcStart > 0.0) {
			// The control the arc leaves stays clear: it was just pressed, and shows its change at once.
			band *= smoothstep(uArcStart * 0.9, uArcStart * 1.25 + 0.005, f);
		}
		if (uHold > 0.0) {
			// The control the band leaves stays clear, so it can change in place.
			band *= smoothstep(uHold * 0.9, uHold * 1.8, length(css - uOrigin));
		}
		color = palette(paletteAt + d * (shape == 5 ? 3.0 : 1.6));
		if (shape == 5) {
			// The front's crest catches the light.
			float crest = exp(-pow((d + uLead * 0.15) / max(uLead * 0.45, 1e-3), 2.0));
			color = mix(color, vec3(1.0), crest * 0.4);
		} else {
			color = mix(color, vec3(1.0), pow(band, 7.0) * (0.12 + 0.24 * uSwell));
		}
		alpha = clamp(band * uAlpha * fade, 0.0, 1.0);
		rgb = color * uBrightness * alpha;
	}
	touching = shape == 5 ? exp(-pow((d + uLead * 0.2) / max(uLead * 0.9, 1e-3), 2.0)) : band;

	// Off the element's edges, where the band hands over to the edges' own light.
	if (uFeather > 0.0) {
		float nearest = min(min(css.x, css.y), min(size.x - css.x, size.y - css.y));
		float edge = smoothstep(0.0, uFeather, nearest);
		rgb *= edge;
		alpha *= edge;
	}

	// Where the band meets the element's edges it lights them: the same band, in the same colour,
	// at the same place, hugging the rounded edge a little wider than it is inside, with a white
	// hairline on the very edge. It comes and goes with the band.
	if (uEdges > 0.0 && touching > 0.001) {
		vec2 c = css - size * 0.5;
		float r = min(uRound, min(size.x, size.y) * 0.5);
		vec2 qq = abs(c) - (size * 0.5 - r);
		float inset = max(-(length(max(qq, 0.0)) + min(max(qq.x, qq.y), 0.0) - r), 0.0);
		if (inset < uEdgeWidth * 4.0) {
			float around = atan(c.y / size.y, c.x / size.x);
			float thickness = max(1.0 + 0.4 * sin(3.0 * around + time * 1.3) * sin(5.0 * around - time * 0.9 + 1.7), 0.3);
			float hk = inset / (uEdgeWidth * thickness);
			float touch = pow(touching, shape == 0 ? 0.9 : 0.7) * clamp(uAlpha * fade, 0.0, 1.0) * uEdges;
			float shimmer = 0.5 + 0.5 * sin(time * 3.4 - around * 2.0);
			float rimA = exp(-hk * hk) * touch * mix(0.75, 1.0, shimmer);
			float hairA = (1.0 - smoothstep(0.5, 1.25, inset)) * touch * (0.4 + 0.3 * shimmer);
			vec3 rim = mix(color, vec3(1.0), 0.12) * uBrightness;
			rgb = rgb * (1.0 - rimA) + rim * rimA;
			alpha = alpha + rimA * (1.0 - alpha);
			vec3 hair = mix(color, vec3(1.0), 0.7);
			rgb = rgb * (1.0 - hairA) + hair * hairA;
			alpha = alpha + hairA * (1.0 - alpha);
		}
	}

	// Sparks: small discs of light with a faint glow, tinted by the palette.
	float sparkA = 0.0;
	for (int i = 0; i < MAX_SPARKS; i++) {
		vec3 spark = uSparks[i];
		if (spark.z <= 0.0) continue;
		float dist = length(css - spark.xy);
		float disc = clamp(uSparkSize * 0.5 - dist + 0.5, 0.0, 1.0);
		float glow = exp(-dist * dist / (uSparkSize * uSparkSize * 2.5)) * 0.35;
		sparkA = max(sparkA, max(disc, glow) * spark.z);
	}
	if (sparkA > 0.0) {
		vec3 sparkColor = mix(palette(paletteAt + 0.3), vec3(1.0), 0.75);
		rgb = rgb * (1.0 - sparkA) + sparkColor * sparkA;
		alpha = alpha + sparkA * (1.0 - alpha);
	}

	if (alpha > 0.002) rgb += dither(gl_FragCoord.xy) * 1.5 / 255.0;
	gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`;

const SHAPE_INDEX: Record<GlimmShape, number> = {
	line: 0,
	double: 1,
	glint: 2,
	ring: 3,
	split: 4,
	arc: 5
};

/** What accompanies the band: its breath before it leaves, the sparks, the edges, the blur. */
export type ShapeAccents = {
	/** How many sparks ride the band. */
	sparks?: number;
	/** 0 to 1, the colour the band drags along the element's edges. */
	edges?: number;
	/** The element's corner radius, in CSS pixels, for the edges. */
	corner?: number;
	/** A layer whose backdrop blurs, masked here to a halo around the band. */
	blurLayer?: HTMLElement;
	/** The sweep's length in milliseconds, which the sparks and edges time themselves by. */
	sweepMs?: number;
	/** Radius in CSS pixels around `origin` the band leaves clear (a ring from a control). */
	hold?: number;
};

export type ShapeShaderOptions = ShapeAccents & {
	canvas: HTMLCanvasElement;
	shape: GlimmShape;
	geometry: ShapeGeometry;
	palette: Palette;
	direction: Direction;
	bandTight: number;
	origin: [number, number];
	feather?: number | 'auto';
	/** For a line: how far its ends trail its middle, as a share of the content. */
	curve?: number;
	/** For a line: the share of the cross axis it covers, centred. */
	span?: number;
};

/** A controller glimm's `playSweep` can drive, with what goes with the band. */
export type ShapeController = ShaderController & {
	/**
	 * The band's breath before it leaves: it shows a little inside the element, then is drawn back
	 * to where it starts as it gathers, with sparks gathering with it. Resolves when it is done.
	 */
	gather: (ms: number) => Promise<void>;
	/** The band leaves: the sparks start their flight, and with `edges` it drags colour along the edges. */
	launch: (edges: boolean) => void;
	/** Resolves once the band and its sparks are gone. */
	settled: () => Promise<void>;
};

type Spark = {
	along: number;
	pace: number;
	life: number;
	sway: number;
	swayRate: number;
	twinkle: number;
	phase: number;
	brightness: number;
	hop: number;
};

// Low-discrepancy draws, so a handful of sparks still spread evenly along the band.
const scatter = (index: number, step: number) => (index * step) % 1;

const makeSparks = (count: number, sweepMs: number): Spark[] =>
	Array.from({ length: Math.min(MAX_SPARKS, Math.max(0, Math.round(count))) }, (_, k) => {
		const i = k + 1;
		return {
			along: scatter(i, 0.7548776662),
			pace: 0.35 + 0.72 * Math.sqrt(scatter(i, 0.8191725134)),
			life: sweepMs * (0.35 + 0.5 * scatter(i, 0.6457513111)),
			sway: 2 + 7 * scatter(i, 0.4142135624),
			swayRate: 2.5 + 3.5 * scatter(i, 0.7320508076),
			twinkle: 8 + 12 * scatter(i, 0.2360679775),
			phase: scatter(i, 0.6180339887) * Math.PI * 2,
			brightness: 0.35 + 0.65 * scatter(i, 0.6055512755),
			hop: scatter(i, 0.472135955)
		};
	});

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** A controller for the shapes glimm does not draw itself, and for what goes with any band. */
export function createShapeShader(options: ShapeShaderOptions): ShapeController | null {
	const { canvas, geometry } = options;
	const gl = canvas.getContext('webgl', {
		premultipliedAlpha: true,
		alpha: true,
		antialias: false
	});
	if (!gl) return null;

	const compile = (type: number, source: string) => {
		const shader = gl.createShader(type)!;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('[entasis/glimm]', gl.getShaderInfoLog(shader));
		}
		return shader;
	};
	const vertex = compile(gl.VERTEX_SHADER, VERTEX);
	const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
	const program = gl.createProgram()!;
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
	gl.useProgram(program);

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
	const attribute = gl.getAttribLocation(program, 'a');
	gl.enableVertexAttribArray(attribute);
	gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	const locations = new Map<string, WebGLUniformLocation | null>();
	const uniform = (name: string) => {
		if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
		return locations.get(name)!;
	};
	const state = {
		progress: 0,
		alpha: 0,
		palette: options.palette,
		bandTight: options.bandTight,
		direction: options.direction,
		ripple: 1,
		speed: 1,
		brightness: 1,
		wave: 1,
		swell: 0.55
	};
	const sweepMs = Math.max(1, options.sweepMs ?? 1000);
	const sparks = makeSparks(options.sparks ?? 0, sweepMs);
	const sparkData = new Float32Array(MAX_SPARKS * 3);
	const edges = Math.max(0, Math.min(1, options.edges ?? 0));
	const blurLayer = options.blurLayer;
	const hue = Math.random() * 0.4;
	const start = performance.now();
	let dpr = 1;
	let feather = 0;
	const radius = geometry.ringRadius ?? 1;
	const area = geometry.area;
	let edgeWidth = 8;
	let sparkSize = 2;

	// The breath before the band leaves: 1 as it starts, 0 once it has gathered.
	let breath = 0;
	let gathering = false;
	// When the band left, for the sparks; whether this pass leaves colour on the edges.
	let launchedAt: number | null = null;
	let edgesOn = false;
	const inhale = Math.max(0.06, Math.min(0.16, geometry.reach.ahead * 0.9 + 0.04));
	const startPosition = geometry.position(0);
	const settledWaiters: Array<() => void> = [];

	const resize = () => {
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		const box = canvas.getBoundingClientRect();
		const width = Math.max(1, Math.round(box.width * dpr));
		const height = Math.max(1, Math.round(box.height * dpr));
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
			gl.viewport(0, 0, width, height);
		}
		feather =
			options.feather === 'auto'
				? Math.min(24, 0.15 * Math.min(box.width, box.height))
				: Math.max(0, options.feather ?? 0);
		edgeWidth = Math.max(4, Math.min(10, 0.03 * Math.min(box.width, box.height)));
		sparkSize = Math.max(1.6, Math.min(2.6, 0.006 * Math.min(box.width, box.height) + 1));
	};
	resize();
	const observer = new ResizeObserver(resize);
	observer.observe(canvas);

	const sparksDone = (now: number) =>
		sparks.length === 0 || (launchedAt === null ? !gathering : now - launchedAt > sweepMs * 0.9);

	const placeSparks = (now: number, position: number) => {
		sparkData.fill(0);
		if (sparks.length === 0) return;
		const seconds = (now - start) / 1000;
		sparks.forEach((spark, index) => {
			const twinkle = 0.5 + 0.5 * Math.sin(seconds * spark.twinkle + spark.phase);
			const glint = spark.brightness * (0.65 + 0.35 * twinkle);
			let at: number;
			let alpha: number;
			let sway = 0;
			if (launchedAt === null) {
				// Gathering: they hop in towards where the band starts.
				const hops = seconds / 0.22 + spark.hop;
				const hop = hops - Math.floor(hops);
				const hopping = smooth(0, 0.25, hop) * (1 - smooth(0.55, 1, hop));
				at = startPosition + inhale * (0.4 + 1.6 * spark.hop) * (1 - hop * hop) + breath * inhale;
				alpha = gathering ? (1 - breath) * hopping * glint * 0.8 : 0;
			} else {
				const flying = now - launchedAt;
				at = startPosition + (position - startPosition) * spark.pace;
				const burning = 1 - smooth(spark.life * 0.55, spark.life, flying);
				alpha = burning * glint * smooth(0, 60, flying);
				sway = spark.sway * Math.sin((spark.swayRate * flying) / 1000 + spark.phase);
			}
			const [x, y] = geometry.point(at, spark.along);
			const angle = spark.phase;
			sparkData[index * 3] = x + Math.cos(angle) * sway;
			sparkData[index * 3 + 1] = y + Math.sin(angle) * sway;
			sparkData[index * 3 + 2] = Math.max(0, alpha);
		});
	};

	// The blur stays on the content, fading in over its first pixels: the padding around it is
	// left sharp, and so are the edges of the layer, where a backdrop blur smears.
	const contentMask = (() => {
		const { x, y, width, height } = area;
		const soft = Math.min(12, width / 4, height / 4);
		const along = (to: string, start: number, size: number) =>
			`linear-gradient(to ${to}, transparent ${pixels(start)}, #000 ${pixels(start + soft)}, #000 ${pixels(start + size - soft)}, transparent ${pixels(start + size)})`;
		return `${along('right', x, width)}, ${along('bottom', y, height)}`;
	})();
	if (blurLayer) {
		blurLayer.style.maskComposite = 'intersect';
		blurLayer.style.setProperty('-webkit-mask-composite', 'source-in');
	}

	// The blur follows the band: strongest on it, a little ahead, more behind.
	const placeBlur = (position: number, alpha: number) => {
		if (!blurLayer) return;
		if (alpha <= 0.001) {
			blurLayer.style.visibility = 'hidden';
			return;
		}
		const value = geometry.halo(
			position,
			geometry.reach.ahead * 1.2,
			geometry.reach.behind * 1.4,
			alpha
		);
		const masks = `${value}, ${contentMask}`;
		blurLayer.style.visibility = 'visible';
		blurLayer.style.maskImage = masks;
		blurLayer.style.setProperty('-webkit-mask-image', masks);
	};

	let frame = 0;
	let destroyed = false;
	const busy = (now: number) => state.alpha > 0 || gathering || !sparksDone(now);

	const draw = () => {
		frame = 0;
		if (destroyed) return;
		const now = performance.now();
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		if (!busy(now)) {
			placeBlur(0, 0);
			for (const resolve of settledWaiters.splice(0)) resolve();
			return;
		}
		const [axis, flip] =
			state.direction === 'ltr'
				? [0, 0]
				: state.direction === 'rtl'
					? [0, 1]
					: state.direction === 'ttb'
						? [1, 0]
						: [1, 1];
		const corner = glintCorner(state.direction);
		const position = geometry.position(state.progress);
		const enter = smooth(0, 0.12, state.progress) * (1 - smooth(0.88, 1, state.progress));
		const gatherAlpha = gathering ? (1 - breath) * 0.3 : 0;
		const bandAlpha = gathering ? gatherAlpha : state.alpha;
		placeSparks(now, position);
		// No blur while the band gathers: it gathers at the control just pressed.
		placeBlur(position, gathering ? 0 : state.alpha * (0.3 + 0.7 * enter));
		const arc = geometry.arc;
		gl.uniform2f(uniform('uRes'), canvas.width, canvas.height);
		gl.uniform1f(uniform('uDpr'), dpr);
		gl.uniform1f(uniform('uShape'), SHAPE_INDEX[options.shape]);
		gl.uniform1f(uniform('uTime'), (now - start) / 1000);
		gl.uniform1f(uniform('uPos'), position);
		gl.uniform1f(uniform('uBreath'), gathering ? breath * inhale : 0);
		gl.uniform1f(uniform('uProgress'), state.progress);
		gl.uniform1f(uniform('uAlpha'), bandAlpha);
		gl.uniform1f(uniform('uTight'), state.bandTight);
		gl.uniform1f(uniform('uBrightness'), state.brightness);
		gl.uniform1f(uniform('uRipple'), state.ripple);
		gl.uniform1f(uniform('uSpeed'), state.speed);
		gl.uniform1f(uniform('uFeather'), feather);
		gl.uniform1f(uniform('uAxis'), axis);
		gl.uniform1f(uniform('uFlip'), flip);
		gl.uniform2f(uniform('uCorner'), corner[0], corner[1]);
		gl.uniform2f(uniform('uOrigin'), options.origin[0], options.origin[1]);
		gl.uniform1f(uniform('uRadius'), radius);
		gl.uniform4f(uniform('uArea'), area.x, area.y, area.width, area.height);
		gl.uniform1f(uniform('uHold'), options.hold ?? 0);
		gl.uniform2f(uniform('uArcCenter'), arc?.center[0] ?? 0, arc?.center[1] ?? 0);
		gl.uniform1f(uniform('uArcSideways'), arc?.sideways ? 1 : 0);
		gl.uniform1f(uniform('uArcSquash'), arc?.squash ?? 1);
		gl.uniform1f(uniform('uArcStart'), arc?.start ?? 0);
		gl.uniform1f(uniform('uArcSpine'), arc?.spine ?? 0);
		gl.uniform1f(uniform('uArcScale'), arc?.scale ?? 1);
		gl.uniform1f(uniform('uLead'), geometry.reach.ahead);
		gl.uniform1f(uniform('uTail'), geometry.reach.behind);
		gl.uniform1f(uniform('uEdges'), edgesOn ? edges : 0);
		gl.uniform1f(uniform('uCurve'), options.curve ?? 0);
		gl.uniform1f(uniform('uWave'), state.wave);
		gl.uniform1f(uniform('uSpan'), Math.max(0, Math.min(1, options.span ?? 1)));
		gl.uniform1f(uniform('uSwell'), state.swell);
		gl.uniform1f(uniform('uEdgeWidth'), edgeWidth);
		gl.uniform1f(uniform('uRound'), options.corner ?? 0);
		gl.uniform3fv(uniform('uSparks'), sparkData);
		gl.uniform1f(uniform('uSparkSize'), sparkSize);
		gl.uniform1f(uniform('uHue'), hue);
		gl.uniform3fv(uniform('uPalA'), state.palette.a);
		gl.uniform3fv(uniform('uPalB'), state.palette.b);
		gl.uniform3fv(uniform('uPalC'), state.palette.c);
		gl.uniform3fv(uniform('uPalD'), state.palette.d);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		frame = requestAnimationFrame(draw);
	};
	const wake = () => {
		if (!frame && !destroyed) frame = requestAnimationFrame(draw);
	};

	return {
		canvas,
		setProgress: (progress) => {
			state.progress = progress;
			wake();
		},
		setAlpha: (alpha) => {
			state.alpha = Math.max(0, alpha);
			wake();
		},
		setPalette: (palette) => (state.palette = palette),
		setBandTight: (value) => (state.bandTight = Math.max(0.1, value)),
		setDirection: (direction) => (state.direction = direction),
		setWaveAmount: (value) => (state.wave = Math.max(0, Math.min(2, value))),
		setRippleAmount: (value) => (state.ripple = Math.max(0, Math.min(2, value))),
		setWaveSpeed: (value) => (state.speed = Math.max(0, Math.min(3, value))),
		setBrightness: (value) => (state.brightness = Math.max(0, Math.min(1.5, value))),
		setSwellAmount: (value) => (state.swell = Math.max(0, Math.min(1, value))),
		getProgress: () => state.progress,
		getAlpha: () => state.alpha,
		gather: (ms) =>
			new Promise<void>((resolve) => {
				if (ms <= 0 || destroyed) return resolve();
				gathering = true;
				breath = 1;
				const began = performance.now();
				const step = () => {
					if (destroyed) return resolve();
					const t = Math.min(1, (performance.now() - began) / ms);
					breath = 1 - easeInOut(t);
					if (t < 1) requestAnimationFrame(step);
					else {
						gathering = false;
						breath = 0;
						resolve();
					}
				};
				wake();
				requestAnimationFrame(step);
			}),
		launch: (withEdges) => {
			const now = performance.now();
			launchedAt = now;
			edgesOn = withEdges;
			wake();
		},
		settled: () =>
			new Promise<void>((resolve) => {
				if (destroyed || !busy(performance.now())) return resolve();
				settledWaiters.push(resolve);
				wake();
			}),
		destroy: () => {
			if (destroyed) return;
			destroyed = true;
			cancelAnimationFrame(frame);
			observer.disconnect();
			placeBlur(0, 0);
			for (const resolve of settledWaiters.splice(0)) resolve();
			gl.deleteProgram(program);
			gl.deleteBuffer(buffer);
			gl.deleteShader(vertex);
			gl.deleteShader(fragment);
		}
	};
}
