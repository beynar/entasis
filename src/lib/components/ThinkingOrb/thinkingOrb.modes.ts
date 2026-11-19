// The orb's nine drawings. Each is pure maths over (size, time, options) with no drawing
// surface: it returns the dots and lines of one instant, which the player paints.
//
// @license Adapted from thinking-orbs (github.com/Jakubantalik/Libraries.dev).
// Copyright (c) 2026 Jakub Antalik. SPDX-License-Identifier: MIT. Full notice in
// `thinkingOrb.core.ts`.

import {
	angleDelta,
	fibDir,
	finalizeFrame,
	frac,
	hashD,
	lerp,
	makeProj,
	radiusScale,
	vnoise,
	type ThinkingOrbDot,
	type ThinkingOrbFrameFunction,
	type ThinkingOrbLine
} from './thinkingOrb.core.js';

/** The drawings by name; a state shows one of them. */
export type ThinkingOrbMode =
	'orbits' | 'globe' | 'rubik' | 'wave' | 'web' | 'braid' | 'ribbon' | 'ring' | 'morph';

// --- Orbits: particles on tilted orbits (working) -----------------------------------------------
// No nucleus: only faint paths and the particles running on them.

const frameOrbits: ThinkingOrbFrameFunction = (size, t, o) => {
	const cx = size / 2;
	const cy = size / 2;
	const R = (size / 2) * 0.82;
	const pt = makeProj(t * 0.12, 0.3, cx, cy, 1);
	const rs = radiusScale(size, o.rsPow ?? 0.6);

	const dots: ThinkingOrbDot[] = [];
	const orbitN = o.orbitN ?? 12;
	const ghostN = o.ghostN ?? 40;
	const particles = o.particles ?? 3;

	for (let orb = 0; orb < orbitN; orb++) {
		const h1 = hashD(orb, 1.7);
		const h2 = hashD(orb, 5.2);
		const h3 = hashD(orb, 8.9);
		const ro = R * (0.45 + 0.52 * h1);
		const th = h1 * 2 * Math.PI;
		const phi = Math.acos(2 * h2 - 1);
		// The orbit's plane: u and v at right angles to the normal n.
		const nx = Math.sin(phi) * Math.cos(th);
		const ny = Math.cos(phi);
		const nz = Math.sin(phi) * Math.sin(th);
		let ux = -ny;
		let uy = nx;
		const uz = 0;
		const ul = Math.max(1e-6, Math.sqrt(ux * ux + uy * uy));
		ux /= ul;
		uy /= ul;
		const vx = ny * uz - nz * uy;
		const vy = nz * ux - nx * uz;
		const vz = nx * uy - ny * ux;
		const speed = (0.25 + 0.55 * h3) * (h3 > 0.5 ? 1 : -1);

		// The faint path.
		for (let k = 0; k < ghostN; k++) {
			const a = (k / ghostN) * 2 * Math.PI;
			const [px, py, z] = pt(
				(ux * Math.cos(a) + vx * Math.sin(a)) * ro,
				(uy * Math.cos(a) + vy * Math.sin(a)) * ro,
				(uz * Math.cos(a) + vz * Math.sin(a)) * ro
			);
			const depth = (z / ro + 1) / 2;
			dots.push({
				x: px,
				y: py,
				z,
				r: (o.ghostR ?? 0.9) * rs,
				white: 0.72,
				a: (o.ghostA ?? 0.5) * (0.4 + 0.6 * depth)
			});
		}
		// The particles doing the work.
		for (let m = 0; m < particles; m++) {
			const a = t * speed + (m / particles) * 2 * Math.PI + h2 * 6;
			const [px, py, z] = pt(
				(ux * Math.cos(a) + vx * Math.sin(a)) * ro,
				(uy * Math.cos(a) + vy * Math.sin(a)) * ro,
				(uz * Math.cos(a) + vz * Math.sin(a)) * ro
			);
			const depth = (z / ro + 1) / 2;
			dots.push({
				x: px,
				y: py,
				z,
				r: ((o.partR ?? 1.2) + (o.partRDepth ?? 1.6) * depth) * rs,
				white: 0.3 - 0.22 * depth
			});
		}
	}
	return finalizeFrame(dots, [], o.rMin);
};

// --- The solver's heartbeat (rubik) --------------------------------------------------------------
// Quick eased moves scramble the sphere, then replay backwards so everything clicks back into
// place, rests, and starts again.

type Move = { axis: 0 | 1 | 2; lo: number; hi: number; ang: number };
type Cycle = { amount: number[]; active: number };

function solveCycle(time: number, count: number, slotDur: number, rest: number): Cycle {
	const cyc = 2 * count * slotDur + rest;
	const tc = time % cyc;
	const amount = new Array<number>(count).fill(0);
	let active = -1;
	if (tc < 2 * count * slotDur) {
		const slot = Math.floor(tc / slotDur);
		const p = (tc - slot * slotDur) / slotDur;
		const cl = Math.min(1, p / 0.7);
		const ep = 1 - (1 - cl) ** 3;
		if (slot < count) {
			for (let i = 0; i < slot; i++) amount[i] = 1;
			amount[slot] = ep;
			active = slot;
		} else {
			const u = 2 * count - 1 - slot;
			for (let i = 0; i < u; i++) amount[i] = 1;
			amount[u] = 1 - ep;
			active = u;
		}
	}
	return { amount, active };
}

function applyMoves(
	point: [number, number, number],
	moves: Move[],
	cycle: Cycle
): [number, number, number, boolean] {
	let [x, y, z] = point;
	let inActive = false;
	for (let i = 0; i < moves.length; i++) {
		if (cycle.amount[i] <= 0) continue;
		const mv = moves[i];
		const coord = mv.axis === 0 ? x : mv.axis === 1 ? y : z;
		if (coord < mv.lo || coord >= mv.hi) continue;
		if (i === cycle.active) inActive = true;
		const a = mv.ang * cycle.amount[i];
		const ca = Math.cos(a);
		const sa = Math.sin(a);
		if (mv.axis === 0) {
			const y2 = y * ca - z * sa;
			z = y * sa + z * ca;
			y = y2;
		} else if (mv.axis === 1) {
			const x2 = x * ca + z * sa;
			z = -x * sa + z * ca;
			x = x2;
		} else {
			const x2 = x * ca - y * sa;
			y = x * sa + y * ca;
			x = x2;
		}
	}
	return [x, y, z, inActive];
}

// The moves depend on their count alone: built once per count, not once per frame.
const movesByCount = new Map<number, Move[]>();

function makeMoves(count: number): Move[] {
	let moves = movesByCount.get(count);
	if (moves) return moves;
	moves = [];
	for (let i = 0; i < count; i++) {
		const axis = Math.min(2, Math.floor(hashD(i, 2.3) * 3)) as 0 | 1 | 2;
		const lo = -1.0 + 0.5 * Math.min(3, Math.floor(hashD(i, 5.9) * 4));
		const dir = hashD(i, 7.7) < 0.5 ? 1 : -1;
		moves.push({ axis, lo, hi: lo + 0.5, ang: (dir * Math.PI) / 2 });
	}
	movesByCount.set(count, moves);
	return moves;
}

// --- Globe: a scan meridian sweeps a dotted globe (searching) -----------------------------------

const frameGlobe: ThinkingOrbFrameFunction = (size, t, o) => {
	const spin = 0.5;
	const cx = size / 2;
	const cy = size / 2;
	const radius = (size / 2) * 0.82;
	const tilt = 0.4 + 0.06 * Math.sin(t * 0.35);
	const pt = makeProj(t * spin, tilt, cx, cy, radius);
	// The scan sweeps relative to the spin; `scanMul` scales that relative rate.
	const scan = t * (spin + (1.7 - spin) * (o.scanMul ?? 1));
	const rs = radiusScale(size, o.rsPow ?? 0.6);
	const dimBase = o.dimBase ?? 1;

	const dots: ThinkingOrbDot[] = [];
	const latRings = o.latRings ?? 17;
	const lonDensity = o.lonDensity ?? 44;
	for (let li = 0; li <= latRings; li++) {
		const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
		const cosLat = Math.cos(lat);
		const sinLat = Math.sin(lat);
		const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
		for (let lj = 0; lj < lonCount; lj++) {
			const lon = (lj / lonCount) * 2 * Math.PI;
			const [px, py, z] = pt(cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon));
			const depth = (z + 1) / 2;
			// The scan is a moving meridian, read as a ripple of size and not as a shine.
			const d = angleDelta(lon + t * spin, scan);
			const boost = Math.exp(-(d * d) / 0.18) * Math.max(0, z);
			dots.push({
				x: px,
				y: py,
				z,
				r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth + (o.rBoost ?? 1) * boost) * rs,
				white: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth,
				// Under 1, `dimBase` fades the dots the scan is not on, so the meridian reads.
				a: dimBase + (1 - dimBase) * Math.min(1, boost)
			});
		}
	}
	return finalizeFrame(dots, [], o.rMin);
};

// --- Rubik: bands twist in quarter turns, scramble then solve (solving) -------------------------

const frameRubik: ThinkingOrbFrameFunction = (size, t, o) => {
	const cx = size / 2;
	const cy = size / 2;
	const R = (size / 2) * 0.82;
	const pt = makeProj(t * 0.55, 0.35 + 0.1 * Math.sin(t * 0.9), cx, cy, R);
	const rs = radiusScale(size, o.rsPow ?? 0.6);
	const moveCount = o.moveCount ?? 14;
	const moves = makeMoves(moveCount);
	const cycle = solveCycle(t, moveCount, 0.42, 1.2);

	const dots: ThinkingOrbDot[] = [];
	const latRings = o.latRings ?? 15;
	const lonDensity = o.lonDensity ?? 40;
	for (let li = 0; li <= latRings; li++) {
		const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
		const cosLat = Math.cos(lat);
		const sinLat = Math.sin(lat);
		const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
		for (let lj = 0; lj < lonCount; lj++) {
			const lon = (lj / lonCount) * 2 * Math.PI;
			const [x, y, z, inActive] = applyMoves(
				[cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon)],
				moves,
				cycle
			);
			const [px, py, zr] = pt(x, y, z);
			const depth = (zr + 1) / 2;
			// The band being turned inks a touch darker: the hand at work.
			dots.push({
				x: px,
				y: py,
				z: zr,
				r:
					((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth + (inActive ? (o.rActive ?? 0.3) : 0)) * rs,
				white: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth - (inActive ? 0.14 : 0)
			});
		}
	}
	return finalizeFrame(dots, [], o.rMin);
};

// --- Wave: a waveform rolls through the rings (listening) ---------------------------------------

const frameWave: ThinkingOrbFrameFunction = (size, t, o) => {
	const cx = size / 2;
	const cy = size / 2;
	// The undulation pulls the sphere inward, so its radius is 15% above the other lattices'.
	const R = (size / 2) * 0.874;
	const pt = makeProj(t * 0.18, 0.38, cx, cy, 1);
	const rs = radiusScale(size, o.rsPow ?? 0.6);

	const dots: ThinkingOrbDot[] = [];
	const rings = o.rings ?? 15;
	const lonDensity = o.lonDensity ?? 40;
	for (let ri = 0; ri <= rings; ri++) {
		const lat = -Math.PI / 2 + (ri / rings) * Math.PI;
		const cosLat = Math.cos(lat);
		const sinLat = Math.sin(lat);
		// Two waves at different tempi: organic, never quite repeating.
		const w = 0.62 * Math.sin(t * 2.1 - ri * 0.52) + 0.38 * Math.sin(t * 1.27 + ri * 0.83);
		const rr = R * (0.88 + 0.105 * w);
		const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
		for (let lj = 0; lj < lonCount; lj++) {
			const lon = (lj / lonCount) * 2 * Math.PI;
			const [px, py, z] = pt(cosLat * Math.cos(lon) * rr, sinLat * rr, cosLat * Math.sin(lon) * rr);
			const depth = (z / R + 1) / 2;
			const crest = Math.max(0, w);
			dots.push({
				x: px,
				y: py,
				z,
				r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth) * (1 + 0.4 * crest) * rs,
				white: 0.66 - 0.56 * depth - 0.1 * crest
			});
		}
	}
	return finalizeFrame(dots, [], o.rMin);
};

// --- Web: a constellation wires itself (connecting) ---------------------------------------------
// Nodes drift on the sphere under slow noise; any pair closer than `thr` grows an edge, and
// bright packets run between pairs of nodes picked again each time.

const frameWeb: ThinkingOrbFrameFunction = (size, t, o) => {
	const cx = size / 2;
	const cy = size / 2;
	const R = (size / 2) * 0.8 * (o.spread ?? 1);
	// The projector carries the radius as its scale: node vectors stay unit length, and the
	// distances below are measured on the unit sphere.
	const pt = makeProj(t * 0.12, 0.32, cx, cy, R);
	const rs = radiusScale(size, o.rsPow ?? 0.6);

	const nodeN = o.nodeN ?? 30;
	const thr = o.thr ?? 0.72;
	const nodeR = o.nodeR ?? 1.4;
	const nodeRDepth = o.nodeRDepth ?? 1.8;

	const nodes: Array<[number, number, number]> = [];
	for (let i = 0; i < nodeN; i++) {
		const d = fibDir(i, nodeN);
		const x = d[0] + 0.3 * (vnoise(i * 0.31 + 9, t * 0.24) - 0.5) * 2;
		const y = d[1] + 0.3 * (vnoise(i * 0.53 + 27, t * 0.21) - 0.5) * 2;
		const z = d[2] + 0.3 * (vnoise(i * 0.77 + 55, t * 0.27) - 0.5) * 2;
		const l = Math.sqrt(x * x + y * y + z * z);
		nodes.push([x / l, y / l, z / l]);
	}

	const lines: ThinkingOrbLine[] = [];
	const dots: ThinkingOrbDot[] = [];

	// Edges between close neighbours, their opacity by closeness and depth.
	for (let i = 0; i < nodeN; i++) {
		for (let j = i + 1; j < nodeN; j++) {
			const dx = nodes[i][0] - nodes[j][0];
			const dy = nodes[i][1] - nodes[j][1];
			const dz = nodes[i][2] - nodes[j][2];
			const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
			if (dist >= thr) continue;
			const [x1, y1, z1] = pt(nodes[i][0], nodes[i][1], nodes[i][2]);
			const [x2, y2, z2] = pt(nodes[j][0], nodes[j][1], nodes[j][2]);
			const depth = ((z1 + z2) / 2 + 1) / 2;
			lines.push({
				x1,
				y1,
				x2,
				y2,
				white: 0.42,
				a: (1 - dist / thr) * (0.3 + 0.55 * depth),
				w: Math.max(0.6, (o.lineW ?? 0.8) * rs)
			});
		}
	}

	for (let i = 0; i < nodeN; i++) {
		const [px, py, z] = pt(nodes[i][0], nodes[i][1], nodes[i][2]);
		const depth = (z + 1) / 2;
		const pulse = 1 + 0.25 * Math.sin(t * 1.4 + i * 2.7);
		dots.push({
			x: px,
			y: py,
			z,
			r: (nodeR + nodeRDepth * depth) * pulse * rs,
			white: 0.55 - 0.45 * depth
		});
	}

	// Signals: bright packets running between paired nodes.
	const signals = o.signals ?? 5;
	for (let s = 0; s < signals; s++) {
		const seg = Math.floor(t * 0.55 + s * 7.31);
		const a = Math.floor(hashD(seg, s * 3.1 + 1.7) * nodeN);
		const b = Math.floor(hashD(seg, s * 5.7 + 4.2) * nodeN);
		if (a === b) continue;
		const f = frac(t * 0.55 + s * 7.31);
		const x = lerp(nodes[a][0], nodes[b][0], f);
		const y = lerp(nodes[a][1], nodes[b][1], f);
		const z = lerp(nodes[a][2], nodes[b][2], f);
		const l = Math.max(1e-6, Math.sqrt(x * x + y * y + z * z));
		const [px, py, zr] = pt(x / l, y / l, z / l);
		const depth = (zr + 1) / 2;
		dots.push({
			x: px,
			y: py,
			z: zr,
			r: (nodeR * 1.5 + nodeRDepth * depth) * rs,
			white: 0.05,
			a: 0.5 + 0.5 * depth
		});
	}

	return finalizeFrame(dots, lines, o.rMin);
};

// --- Braid: three strands plait around the sphere (weaving) -------------------------------------
// Each strand runs pole to pole on a helix; breathing in and out, they trade places, which
// reads as the over and under of a plait.

const frameBraid: ThinkingOrbFrameFunction = (size, t, o) => {
	const cx = size / 2;
	const cy = size / 2;
	const R = (size / 2) * 0.76;
	const pt = makeProj(t * 0.4, 0.3, cx, cy, 1);
	const rs = radiusScale(size, o.rsPow ?? 0.6);

	const dots: ThinkingOrbDot[] = [];
	const ghostN = o.ghostN ?? 150;
	for (let i = 0; i < ghostN; i++) {
		const d = fibDir(i, ghostN);
		const [px, py, z] = pt(d[0] * R, d[1] * R, d[2] * R);
		const depth = (z / R + 1) / 2;
		dots.push({ x: px, y: py, z, r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * depth });
	}

	const strandN = o.strandN ?? 52;
	const turns = o.turns ?? 3;
	for (let s = 0; s < 3; s++) {
		const phase = (s / 3) * 2 * Math.PI;
		for (let i = 0; i < strandN; i++) {
			// u walks pole to pole; the drift slides the whole strand along.
			const u = (frac(i / strandN + t * 0.045) * 2 - 1) * 0.96;
			const surf = Math.sqrt(Math.max(0, 1 - u * u));
			const endFade = Math.min(1, (1 - Math.abs(u)) / 0.1);
			const a = u * Math.PI * turns + phase;
			const weave = 1 + 0.075 * Math.sin(u * Math.PI * turns * 2 + phase * 2 + t * 0.8);
			const rr = surf * R * weave;
			const [px, py, zr] = pt(Math.cos(a) * rr, u * R * weave, Math.sin(a) * rr);
			const depth = (zr / R + 1) / 2;
			dots.push({
				x: px,
				y: py,
				z: zr,
				r: ((o.rBase ?? 1.2) + (o.rDepth ?? 1.8) * depth) * rs,
				white: 0.55 - 0.45 * depth,
				a: endFade * (0.45 + 0.55 * depth)
			});
		}
	}
	return finalizeFrame(dots, [], o.rMin);
};

// --- Ribbon: an undulating sash of parallel strands (composing) ---------------------------------
// The sash rides a great circle; with `spin` at 0 its orientation is frozen and only the
// travelling undulation moves.
//
// With `faceOn` the same drawing is the breathing ring: a circle seen from the front whose
// radius undulates, and not its offset out of the plane, so it reads as a ring slowly changing
// shape.

const frameRibbon: ThinkingOrbFrameFunction = (size, t, o) => {
	const cx = size / 2;
	const cy = size / 2;
	const R = (size / 2) * 0.78;
	const spin = o.spin ?? 1;
	const camTilt = 0.3;
	const pt = makeProj(t * 0.1 * spin, camTilt, cx, cy, 1);
	const rs = radiusScale(size, o.rsPow ?? 0.6);

	const dots: ThinkingOrbDot[] = [];
	const ghostN = o.ghostN ?? 150;
	for (let i = 0; i < ghostN; i++) {
		const d = fibDir(i, ghostN);
		const [px, py, z] = pt(d[0] * R, d[1] * R, d[2] * R);
		const depth = (z / R + 1) / 2;
		dots.push({ x: px, y: py, z, r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * depth });
	}

	// The band's plane. The projection squashes its great circle by cos(ta + camTilt); face on,
	// ta is -camTilt, so the band reads as a true circle and not as a tilted ellipse.
	const ya = t * 0.24 * spin;
	const ta = o.faceOn ? -camTilt : 0.55 + 0.3 * Math.sin(t * 0.18) * spin;
	const ux = Math.cos(ya);
	const uy = 0;
	const uz = Math.sin(ya);
	const vx = -uz * Math.sin(ta);
	const vy = Math.cos(ta);
	const vz = ux * Math.sin(ta);
	const nx = uy * vz - uz * vy;
	const ny = uz * vx - ux * vz;
	const nz = ux * vy - uy * vx;

	// Lobes swell past R, so the base radius is pulled in by most of the wobble: the outline
	// stays inside the frame however far the deformation is pushed.
	const wobAmp = 0.23 * (o.wobMul ?? 1);
	const baseR = o.faceOn ? R / (1 + 0.85 * wobAmp) : R;

	const baseLanes = o.lanes ?? 5;
	const segs = o.segs ?? 88;
	const lanes = Math.max(1, Math.round(baseLanes * (o.bandMul ?? 1)));
	for (let w = 0; w < lanes; w++) {
		const laneOff = (w - (lanes - 1) / 2) * 0.075;
		const edge = Math.abs(w - (lanes - 1) / 2) / Math.max(1, (lanes - 1) / 2);
		for (let k = 0; k < segs; k++) {
			const a = (k / segs) * 2 * Math.PI;
			// Two travelling waves along the band; `wobMul` scales them, 0 is a clean band.
			const wob =
				(0.16 * Math.sin(a * 3 - t * 1.7 + w * 0.22) + 0.07 * Math.sin(a * 5 + t * 1.1)) *
				(o.wobMul ?? 1);
			// The sash wobbles out of its plane and lands back on the sphere, so its outline is
			// held at R. Face on, the wobble moves the radius: lobes swell out and pinch in.
			const radial = o.faceOn ? 1 + wob : 1;
			const off = o.faceOn ? laneOff : laneOff + wob;
			const x = ux * Math.cos(a) + vx * Math.sin(a) + nx * off;
			const y = uy * Math.cos(a) + vy * Math.sin(a) + ny * off;
			const z = uz * Math.cos(a) + vz * Math.sin(a) + nz * off;
			const l = Math.sqrt(x * x + y * y + z * z);
			const rr = baseR * radial;
			const [px, py, zr] = pt((x / l) * rr, (y / l) * rr, (z / l) * rr);
			const depth = (zr / R + 1) / 2;
			dots.push({
				x: px,
				y: py,
				z: zr,
				r: ((o.rBase ?? 1.1) + (o.rDepth ?? 1.7) * depth) * (1 - 0.25 * edge) * rs,
				white: 0.52 - 0.44 * depth + 0.18 * edge,
				a: 0.4 + 0.6 * depth
			});
		}
	}
	return finalizeFrame(dots, [], o.rMin);
};

// --- Morph: a dotted outline, circle to triangle to square (shaping) ----------------------------
// Each shape is a closed path read by arc length, starting at the top and running clockwise.
// Every frame the two neighbouring paths are blended, then the dots are laid evenly along the
// blended outline: their spacing stays even while a shape holds and while it changes.

type Path = (f: number) => [number, number];

const smoothE = (x: number) => x * x * (3 - 2 * x);

function polyPath(verts: ReadonlyArray<readonly [number, number]>): Path {
	const V = verts.length;
	const L: number[] = [];
	let total = 0;
	for (let i = 0; i < V; i++) {
		const a = verts[i];
		const b = verts[(i + 1) % V];
		const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
		L.push(l);
		total += l;
	}
	return (f) => {
		let target = f * total;
		let i = 0;
		while (target > L[i] && i < V - 1) {
			target -= L[i];
			i++;
		}
		const a = verts[i];
		const b = verts[(i + 1) % V];
		const ff = L[i] ? Math.min(1, target / L[i]) : 0;
		return [a[0] + (b[0] - a[0]) * ff, a[1] + (b[1] - a[1]) * ff];
	};
}

const CIRCLE: Path = (f) => {
	const a = -Math.PI / 2 + f * 2 * Math.PI;
	return [Math.cos(a) * 0.24, Math.sin(a) * 0.24];
};
const TRIANGLE = polyPath([
	[0.0, -0.26],
	[0.24, 0.16],
	[-0.24, 0.16]
]);
// Five points, so the path starts at the top centre as the other shapes do.
const SQUARE = polyPath([
	[0, -0.2],
	[0.2, -0.2],
	[0.2, 0.2],
	[-0.2, 0.2],
	[-0.2, -0.2]
]);
const CYCLE: Path[] = [CIRCLE, TRIANGLE, SQUARE];

// A low floor allows sparse outlines without letting one fall apart.
const morphN = (density: number) => Math.max(6, Math.round(34 * density));

const HOLD = 1.4;
const MORPH = 0.9;
const SEG = HOLD + MORPH;
// How finely the blended outline is sampled before the dots are laid on it.
const SAMPLES = 160;

const frameMorph: ThinkingOrbFrameFunction = (size, t, o) => {
	const K = CYCLE.length;
	const tc = t % (SEG * K);
	// `shape` 0, 1 or 2 holds one outline; anything else keeps the cycle.
	const held = o.shape != null && o.shape >= 0 && o.shape < K ? Math.floor(o.shape) : -1;
	const k = held >= 0 ? held : Math.floor(tc / SEG);
	const local = held >= 0 ? t % SEG : tc - k * SEG;
	const m = held >= 0 ? 0 : local > HOLD ? smoothE((local - HOLD) / MORPH) : 0;
	const sprd = o.spread ?? 1;

	const pA = CYCLE[k];
	const pB = held >= 0 ? pA : CYCLE[(k + 1) % K];
	const pts: Array<[number, number]> = [];
	for (let i = 0; i < SAMPLES; i++) {
		const f = i / SAMPLES;
		const a = pA(f);
		const b = pB(f);
		pts.push([(a[0] + (b[0] - a[0]) * m) * sprd, (a[1] + (b[1] - a[1]) * m) * sprd]);
	}
	const L: number[] = [];
	let total = 0;
	for (let i = 0; i < SAMPLES; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % SAMPLES];
		const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
		L.push(l);
		total += l;
	}

	// The radius depends on `rDot` alone; the count sets the gaps. A formed shape breathes a little.
	const n = morphN(o.iconD ?? 1);
	const re = (o.rDot ?? 0.021) * 1.35 * sprd;
	const pulse = 1 + 0.02 * Math.sin(local * 3.1);

	const dots: ThinkingOrbDot[] = [];
	const c2 = size / 2;
	let seg = 0;
	let acc = 0;
	for (let i = 0; i < n; i++) {
		const target = (i / n) * total;
		while (acc + L[seg] < target && seg < SAMPLES - 1) {
			acc += L[seg];
			seg++;
		}
		const a = pts[seg];
		const b = pts[(seg + 1) % SAMPLES];
		const f = L[seg] ? Math.min(1, (target - acc) / L[seg]) : 0;
		const x = (a[0] + (b[0] - a[0]) * f) * pulse;
		const y = (a[1] + (b[1] - a[1]) * f) * pulse;
		dots.push({
			x: c2 + x * size,
			y: c2 + y * size,
			z: 0,
			r: Math.max(0.35, re * size),
			white: 0.1
		});
	}
	return finalizeFrame(dots, [], o.rMin);
};

export const THINKING_ORB_FRAMES: Record<ThinkingOrbMode, ThinkingOrbFrameFunction> = {
	orbits: frameOrbits,
	globe: frameGlobe,
	rubik: frameRubik,
	wave: frameWave,
	web: frameWeb,
	braid: frameBraid,
	ribbon: frameRibbon,
	// The ring is the ribbon's drawing, switched by the `faceOn` flag of its profile.
	ring: frameRibbon,
	morph: frameMorph
};
