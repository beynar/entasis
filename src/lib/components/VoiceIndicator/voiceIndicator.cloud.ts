// The orb in light: an atmospheric sphere, drawn by one fragment shader. Two warped noise fields
// fold into each other; a wavering horizon parts an upper tone from a lower one and a pale band
// of milk runs along it. A voice quickens the flow and deepens the folds.
//
// @license Portions adapted from orb-ui (github.com/exprmntl/orb-ui).
// Copyright (c) 2026 Alexander Chen. SPDX-License-Identifier: MIT

import { blend, colourfulness, fromHsl, toHsl, type Rgb } from './voiceIndicator.color.js';

/** The four tones of the cloud: its depths, its upper and lower halves, and the pale band. */
export type CloudPalette = [deep: Rgb, upper: Rgb, lower: Rgb, milk: Rgb];

/** The cloud without a colour role: the spectrum's blue and violet above, its warm end below. */
export const SPECTRUM_CLOUD: CloudPalette = [
	[86, 88, 250],
	[172, 96, 255],
	[255, 132, 150],
	[255, 232, 224]
];

/**
 * The cloud in a colour role: the role as its depths, paler tones of it above and below, each a
 * few degrees further round the wheel so the cloud does not read as one flat tint. A dark role is
 * lifted to a mid tone first, since a cloud is lit from within.
 */
export function cloudPalette(color: Rgb): CloudPalette {
	const [hue, saturation, lightness] = toHsl(...color);
	const vivid = colourfulness(color);
	const base = Math.min(0.67, Math.max(0.5, lightness));
	const tone = (lift: number, turn: number, keep: number) =>
		fromHsl((hue + (turn / 360) * vivid + 1) % 1, saturation * keep, base + (1 - base) * lift);
	return [tone(0, 0, 1), tone(0.2, -7, 1), tone(0.55, -11, 0.9), tone(0.82, -15, 0.75)];
}

/**
 * The clouds of the solid orb, from its three tones (cool, middle, warm): the cool tone above
 * with a deeper shade of it in the folds, the warm one below, and a paler middle tone where the
 * light orb has its band of milk. Full colours and no white: the clouds are on a matt ball.
 */
export const solidCloudPalette = ([cool, middle, warm]: [Rgb, Rgb, Rgb]): CloudPalette => [
	blend(cool, [0, 0, 0], 0.28),
	cool,
	warm,
	blend(middle, [255, 255, 255], 0.38)
];

/** A palette `k` of the way from `from` to `to`, as an even blend of each tone. */
export const blendCloud = (from: CloudPalette, to: CloudPalette, k: number): CloudPalette => [
	blend(from[0], to[0], k),
	blend(from[1], to[1], k),
	blend(from[2], to[2], k),
	blend(from[3], to[3], k)
];

const VERTEX_SHADER = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_centre;
uniform float u_radius;
uniform float u_time;
uniform float u_activity;
uniform float u_glow;
uniform vec3 u_deep;
uniform vec3 u_upper;
uniform vec3 u_lower;
uniform vec3 u_milk;

float hash(vec2 p) {
  // The lattice repeats every 289 cells: the flow carries it far from the origin over the hours,
  // and a 32-bit float would otherwise lose the products below, flattening the cloud.
  p = mod(p, 289.0);
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Quintic: no crease where one cell of the lattice meets the next.
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// cell is the size of the first octave's lattice cell in device pixels. An octave whose cells
// are down to a few pixels would show as grain, more so on a small orb or a 1x screen: it fades
// to its mean instead, so the cloud keeps the detail its size can carry.
float fbm(vec2 p, float cell) {
  float value = 0.0;
  float amplitude = 0.52;
  mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);
  for (int octave = 0; octave < 5; octave++) {
    value += amplitude * mix(0.5, noise(p), smoothstep(3.0, 8.0, cell));
    p = rotation * p * 1.92 + vec2(9.7, 4.3);
    amplitude *= 0.5;
    cell /= 1.92;
  }
  return value;
}

void main() {
  // The sphere's own coordinates: -1 to 1 across it, whatever its size and place in the box.
  vec2 p = (gl_FragCoord.xy - u_centre) / u_radius;
  float radius = length(p);
  float pixel = 2.0 / u_radius;
  float edge = 1.0 - smoothstep(1.0 - pixel, 1.0, radius);

  // Past the sphere, a glow of its upper tone that the voice brightens.
  float halo = u_glow * exp(-max(radius - 1.0, 0.0) * 5.5);
  if (edge <= 0.0 && halo <= 0.003) discard;

  vec2 uv = p * 0.5 + 0.5;
  float t = u_time;

  vec2 warp = vec2(
    fbm(p * 1.02 + vec2(t * 0.34, -t * 0.24), u_radius / 1.02),
    fbm(p * 1.08 + vec2(-t * 0.27, t * 0.32) + vec2(6.7, 2.9), u_radius / 1.08)
  );
  vec2 curl = vec2(
    sin(p.y * 2.4 + t * 0.68 + warp.y * 3.2),
    cos(p.x * 2.1 - t * 0.61 + warp.x * 3.0)
  );
  vec2 warped =
    p +
    (warp - 0.5) * (1.18 + u_activity * 0.38) +
    curl * (0.035 + u_activity * 0.07);
  float broad = fbm(warped * 0.92 + vec2(t * 0.14, -t * 0.18), u_radius / 0.92);
  float folded = fbm(warped * 1.66 + vec2(-t * 0.23, t * 0.19) + 5.2, u_radius / 1.66);
  float field = mix(broad, folded, 0.3 + u_activity * 0.14);

  float horizon =
    0.46 +
    0.08 * sin((uv.x + warp.x * 0.2) * 5.4 + t * 0.42) +
    0.16 * (broad - 0.5);
  float upper = smoothstep(horizon - 0.12, horizon + 0.08, uv.y);
  float band = exp(-pow((uv.y - horizon) * (5.2 + u_activity * 0.8), 2.0));
  float cloud = smoothstep(0.24, 0.79, field);

  vec3 color = mix(u_lower, u_upper, upper);
  float upperDepth = upper * (0.14 + smoothstep(0.42, 0.78, folded) * 0.5);
  color = mix(color, u_deep, upperDepth);

  float milkAmount = clamp(band * (0.42 + cloud * 0.62), 0.0, 0.88);
  color = mix(color, u_milk, milkAmount);

  float lowerMist = (1.0 - upper) * smoothstep(0.58, 0.9, broad) * 0.18;
  color = mix(color, u_milk, lowerMist);

  // A grain a fraction of a step deep, against banding in the soft gradients.
  color += (noise(gl_FragCoord.xy * 0.64) - 0.5) / 255.0;

  vec3 glow = mix(u_upper, u_milk, 0.25);
  // Premultiplied: the sphere over its glow, with no seam where one hands over to the other.
  float around = halo * (1.0 - edge);
  gl_FragColor = vec4(color * edge + glow * around, edge + around);
}
`;

export type CloudFrame = {
	/** The sphere's centre and radius, in the target's pixels from its top left. */
	x: number;
	y: number;
	radius: number;
	/** The flow's clock, in seconds. */
	time: number;
	/** How stirred the cloud is, 0 to 1. */
	activity: number;
	/** The glow round the sphere, 0 to 1. */
	glow: number;
	palette: CloudPalette;
};

type Shared = {
	canvas: HTMLCanvasElement;
	gl: WebGLRenderingContext;
	uniforms: Record<
		'centre' | 'radius' | 'time' | 'activity' | 'glow',
		WebGLUniformLocation | null
	> & { tones: Array<WebGLUniformLocation | null> };
};

// One WebGL context draws every cloud on the page, each copied onto its indicator's own 2D
// canvas: a browser keeps only so many contexts alive (16 in Chromium) and drops the oldest.
// `undefined` until first asked for, `null` where WebGL is not available.
let shared: Shared | null | undefined;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
	gl.deleteShader(shader);
	return null;
}

function createShared(): Shared | null {
	if (typeof document === 'undefined') return null;
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl', {
		alpha: true,
		antialias: false,
		premultipliedAlpha: true
	});
	if (!gl) return null;
	const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
	const program = gl.createProgram();
	const buffer = gl.createBuffer();
	if (!vertex || !fragment || !program || !buffer) return null;
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

	gl.useProgram(program);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
		gl.STATIC_DRAW
	);
	const position = gl.getAttribLocation(program, 'a_position');
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
	gl.clearColor(0, 0, 0, 0);
	gl.enable(gl.SCISSOR_TEST);
	// A lost context is rebuilt the next time a cloud is drawn.
	canvas.addEventListener('webglcontextlost', () => {
		shared = undefined;
	});

	const uniform = (name: string) => gl.getUniformLocation(program, name);
	return {
		canvas,
		gl,
		uniforms: {
			centre: uniform('u_centre'),
			radius: uniform('u_radius'),
			time: uniform('u_time'),
			activity: uniform('u_activity'),
			glow: uniform('u_glow'),
			tones: [uniform('u_deep'), uniform('u_upper'), uniform('u_lower'), uniform('u_milk')]
		}
	};
}

/**
 * Paints the cloud over the whole of `target`'s canvas. False where WebGL is not available, for
 * the caller to draw the orb another way.
 */
export function paintCloud(target: CanvasRenderingContext2D, frame: CloudFrame): boolean {
	if (shared === undefined) shared = createShared();
	if (!shared) return false;
	const { canvas, gl, uniforms } = shared;
	const { width, height } = target.canvas;
	// The shared canvas only grows; each cloud is drawn in its bottom-left corner.
	if (canvas.width < width) canvas.width = width;
	if (canvas.height < height) canvas.height = height;
	gl.viewport(0, 0, width, height);
	gl.scissor(0, 0, width, height);
	gl.clear(gl.COLOR_BUFFER_BIT);
	// The shader counts from the bottom left.
	gl.uniform2f(uniforms.centre, frame.x, height - frame.y);
	gl.uniform1f(uniforms.radius, Math.max(1, frame.radius));
	gl.uniform1f(uniforms.time, frame.time);
	gl.uniform1f(uniforms.activity, frame.activity);
	gl.uniform1f(uniforms.glow, frame.glow);
	frame.palette.forEach(([r, g, b], index) =>
		gl.uniform3f(uniforms.tones[index], r / 255, g / 255, b / 255)
	);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	target.drawImage(canvas, 0, canvas.height - height, width, height, 0, 0, width, height);
	return true;
}
