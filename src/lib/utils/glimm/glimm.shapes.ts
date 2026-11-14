// The shapes a glimm sweep can take besides glimm's own straight band: a ring that grows from a
// point, a glint that crosses from a corner, and two parallel lines. Each shape is a field `f` over
// the element (0 where it starts, 1 where it ends): the band sits where `f` equals its position,
// the change shows where `f` is below it. The shader, the cut of the content and the curtain all
// read the same field, so the band and the edge of what it reveals stay together.

import type { Direction, Palette, ShaderController } from 'glimm';

/**
 * The form of the band: glimm's straight `line`, a `double` band from both sides that meets in the
 * middle, a `split` band that opens from the middle towards both sides, a corner `glint`, a `ring`.
 */
export type GlimmShape = 'line' | 'double' | 'split' | 'glint' | 'ring';

export type ShapeGeometry = {
	/** The band's position, in field units, at a sweep progress from 0 to 1. */
	position: (progress: number) => number;
	/** `clip-path` of the part the band has passed, where the new content shows. */
	clip: (position: number) => string;
	/** CSS mask of a curtain covering what the band has passed (`covering`) or what it has not. */
	mask: (position: number, covering: boolean) => string;
};

type Box = { width: number; height: number };

// The band's half width in field units: `exp(-(d * tight)^2)` is below 1% past 2.2 / tight.
const reach = (bandTight: number) => 2.2 / Math.max(0.1, bandTight);
// The softer falloff of a glint and a double band, exp(-|d * tight|^1.4), is below 1% past this.
const softReach = (bandTight: number) => 3 / Math.max(0.1, bandTight);

const percent = (value: number) => `${Math.round(value * 10000) / 100}%`;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

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

/**
 * Where the band of a straight line is at a progress, for glimm's own shader: its centre travels
 * from -overscan to 1 + overscan across a canvas that does not fill the viewport.
 */
export const lineOverscan = (bandTight: number) =>
	Math.max(0.2, Math.sqrt(4.6 / Math.max(0.1, bandTight)));

/** The field, cut and curtain of a shape over an element of `box` size. */
export function shapeGeometry(
	shape: GlimmShape,
	direction: Direction,
	bandTight: number,
	box: Box,
	origin: [number, number]
): ShapeGeometry {
	if (shape === 'ring') {
		const [x, y] = origin;
		const radius = Math.max(
			Math.hypot(x, y),
			Math.hypot(box.width - x, y),
			Math.hypot(x, box.height - y),
			Math.hypot(box.width - x, box.height - y),
			1
		);
		const margin = reach(bandTight);
		return {
			position: (progress) => -margin + progress * (1 + 2 * margin),
			clip: (position) => `circle(${Math.max(0, position * radius)}px at ${x}px ${y}px)`,
			mask: (position, covering) => {
				const at = position * radius;
				const before = covering ? '#000' : 'transparent';
				const after = covering ? 'transparent' : '#000';
				return `radial-gradient(circle at ${x}px ${y}px, ${before} ${at - 12}px, ${after} ${at + 12}px)`;
			}
		};
	}

	if (shape === 'glint') {
		const [cx, cy] = glintCorner(direction);
		const margin = softReach(bandTight);
		const corner = (u: number, v: number) =>
			`${percent(cx ? 1 - u : u)} ${percent(cy ? 1 - v : v)}`;
		const to = `to ${cy ? 'top' : 'bottom'} ${cx ? 'left' : 'right'}`;
		return {
			position: (progress) => -margin + progress * (1 + 2 * margin),
			// The part where (u + v) / 2 < position, u and v measured from the starting corner: a
			// triangle, then a pentagon past the middle. Always five points, so it interpolates.
			clip: (position) => {
				const k = Math.max(0, Math.min(2, position * 2));
				const points =
					k <= 1
						? [corner(0, 0), corner(k, 0), corner(k, 0), corner(0, k), corner(0, k)]
						: [corner(0, 0), corner(1, 0), corner(1, k - 1), corner(k - 1, 1), corner(0, 1)];
				return `polygon(${points.join(', ')})`;
			},
			mask: (position, covering) => gradient(to, position * 100, covering)
		};
	}

	if (shape === 'double') {
		// Two bands, one from each side (left and right for ltr and rtl, top and bottom otherwise),
		// meeting in the middle: the field is the distance to the nearer side, 0 to 0.5.
		const horizontal = direction === 'ltr' || direction === 'rtl';
		const margin = softReach(bandTight);
		const point = (along: number, across: number) =>
			horizontal ? `${percent(along)} ${percent(across)}` : `${percent(across)} ${percent(along)}`;
		return {
			position: (progress) => -margin + progress * (0.5 + 1.5 * margin),
			// Both edge strips as one polygon, joined along the starting edge (a zero-area seam).
			clip: (position) => {
				const k = Math.max(0, Math.min(0.5, position));
				return `polygon(${[
					point(0, 0),
					point(k, 0),
					point(k, 1),
					point(0, 1),
					point(0, 0),
					point(1, 0),
					point(1, 1),
					point(1 - k, 1),
					point(1 - k, 0),
					point(0, 0)
				].join(', ')})`;
			},
			mask: (position, covering) => {
				const at = position * 100;
				const edge = covering ? '#000' : 'transparent';
				const middle = covering ? 'transparent' : '#000';
				return `linear-gradient(to ${horizontal ? 'right' : 'bottom'}, ${edge} ${at - 3}%, ${middle} ${at + 3}%, ${middle} ${100 - at - 3}%, ${edge} ${100 - at + 3}%)`;
			}
		};
	}

	if (shape === 'split') {
		// Two bands leaving the middle for both sides: the field is the distance to the middle,
		// 0 there and 1 at both sides.
		const horizontal = direction === 'ltr' || direction === 'rtl';
		const margin = softReach(bandTight);
		return {
			position: (progress) => -margin + progress * (1 + 2 * margin),
			clip: (position) => {
				const side = percent(0.5 - clamp01(position) / 2);
				return horizontal ? `inset(0% ${side} 0% ${side})` : `inset(${side} 0% ${side} 0%)`;
			},
			mask: (position, covering) => {
				const near = 50 - (position * 100) / 2;
				const far = 50 + (position * 100) / 2;
				const middle = covering ? '#000' : 'transparent';
				const edge = covering ? 'transparent' : '#000';
				return `linear-gradient(to ${horizontal ? 'right' : 'bottom'}, ${edge} ${near - 3}%, ${middle} ${near + 3}%, ${middle} ${far - 3}%, ${edge} ${far + 3}%)`;
			}
		};
	}

	// A line along the direction, measured from where the band leaves.
	const margin = lineOverscan(bandTight);
	const side = { ltr: 1, rtl: 3, ttb: 2, btt: 0 }[direction];
	return {
		position: (progress) => -margin + progress * (1 + 2 * margin),
		clip: (position) => {
			const insets = [0, 0, 0, 0];
			insets[side] = 1 - clamp01(position);
			return `inset(${insets.map(percent).join(' ')})`;
		},
		mask: (position, covering) => gradient(`to ${towards[direction]}`, position * 100, covering)
	};
}

/* ---------------------------------------------------------------------------------------------- */
/* Shader                                                                                         */
/* ---------------------------------------------------------------------------------------------- */

const VERTEX = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

// One band along the shape's field (seen twice for `double`, whose field folds at the middle), coloured by the cosine palette along the
// band and across it, with a white core and a ripple that drifts with time.
const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform float uShape;
uniform float uTime;
uniform float uPos;
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
uniform float uHue;
uniform vec3 uPalA;
uniform vec3 uPalB;
uniform vec3 uPalC;
uniform vec3 uPalD;

vec3 palette(float t) {
	return uPalA + uPalB * cos(6.28318 * (uPalC * t + uPalD));
}

void main() {
	vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
	vec2 uv = px / uRes;
	vec2 css = px / uDpr;
	float time = uTime * uSpeed;
	float f;
	float across;
	if (uShape > 2.5 && uShape < 3.5) {
		vec2 offset = css - uOrigin;
		f = length(offset) / uRadius;
		// A periodic function of the angle: no seam where atan wraps around.
		float angle = atan(offset.y, offset.x);
		across = 0.3 * sin(angle) + 0.15 * cos(2.0 * angle);
	} else if (uShape > 1.5 && uShape < 2.5) {
		vec2 c = abs(uv - uCorner);
		f = (c.x + c.y) * 0.5;
		across = (c.x - c.y) * 0.5;
	} else {
		float along = uAxis < 0.5 ? uv.x : uv.y;
		if (uShape > 3.5) f = abs(along - 0.5) * 2.0;
		else if (uShape > 0.5) f = min(along, 1.0 - along);
		else f = uFlip > 0.5 ? 1.0 - along : along;
		across = uAxis < 0.5 ? uv.y : uv.x;
	}
	f += uRipple * 0.012 * sin(across * 23.0 + time * 2.4) * sin(across * 7.0 - time * 1.3);

	float d = f - uPos;
	float band = exp(-pow(d * uTight, 2.0));
	if (uShape > 1.5 && uShape < 2.5) {
		// A glint: a softer falloff across it, and it fades out towards both of its ends.
		band = exp(-pow(abs(d * uTight), 1.4)) * (1.0 - smoothstep(0.12, 0.5, abs(across)));
		// Short near the corners it starts and ends in: it fades there instead of pooling.
		band *= smoothstep(-0.05, 0.25, uPos) * (1.0 - smoothstep(0.75, 1.05, uPos));
	}
	if (uShape > 0.5 && uShape < 1.5) {
		// Two soft bands from both sides; they fade as they meet in the middle.
		band = exp(-pow(abs(d * uTight), 1.4)) * (1.0 - smoothstep(0.34, 0.56, uPos));
	}
	if (uShape > 3.5) {
		// Two soft bands leaving the middle; they grow in as they part, so they do not start as a blob.
		band = exp(-pow(abs(d * uTight), 1.4)) * smoothstep(-0.1, 0.25, uPos);
	}

	vec3 color = palette(across * 0.75 + d * 1.6 + time * 0.05 + uHue);
	float core = pow(band, 7.0);
	color = mix(color, vec3(1.0), core * 0.25);

	float enter = smoothstep(0.0, 0.12, uProgress) * (1.0 - smoothstep(0.88, 1.0, uProgress));
	float fade = mix(0.3, 1.0, enter);
	float edge = 1.0;
	if (uFeather > 0.0) {
		vec2 size = uRes / uDpr;
		float nearest = min(min(css.x, css.y), min(size.x - css.x, size.y - css.y));
		edge = smoothstep(0.0, uFeather, nearest);
	}
	float alpha = clamp(band * uAlpha * fade * edge, 0.0, 1.0);
	gl_FragColor = vec4(color * uBrightness * alpha, alpha);
}
`;

const SHAPE_INDEX: Record<GlimmShape, number> = { line: 0, double: 1, glint: 2, ring: 3, split: 4 };

export type ShapeShaderOptions = {
	canvas: HTMLCanvasElement;
	shape: Exclude<GlimmShape, 'line'>;
	geometry: ShapeGeometry;
	palette: Palette;
	direction: Direction;
	bandTight: number;
	origin: [number, number];
	feather?: number | 'auto';
};

/** A controller for the ring, glint, double and split shapes that glimm's `playSweep` can drive. */
export function createShapeShader(options: ShapeShaderOptions): ShaderController | null {
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

	const uniform = (name: string) => gl.getUniformLocation(program, name);
	const state = {
		progress: 0,
		alpha: 0,
		palette: options.palette,
		bandTight: options.bandTight,
		direction: options.direction,
		ripple: 1,
		speed: 1,
		brightness: 1
	};
	const hue = Math.random() * 0.4;
	const start = performance.now();
	let dpr = 1;
	let feather = 0;
	let radius = 1;

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
			options.feather === undefined || options.feather === 'auto'
				? Math.min(24, 0.15 * Math.min(box.width, box.height))
				: Math.max(0, options.feather);
		const [x, y] = options.origin;
		radius = Math.max(
			Math.hypot(x, y),
			Math.hypot(box.width - x, y),
			Math.hypot(x, box.height - y),
			Math.hypot(box.width - x, box.height - y),
			1
		);
	};
	resize();
	const observer = new ResizeObserver(resize);
	observer.observe(canvas);

	let frame = 0;
	let destroyed = false;
	const draw = () => {
		frame = 0;
		if (destroyed) return;
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		if (state.alpha > 0) {
			const [axis, flip] =
				state.direction === 'ltr'
					? [0, 0]
					: state.direction === 'rtl'
						? [0, 1]
						: state.direction === 'ttb'
							? [1, 0]
							: [1, 1];
			const corner =
				state.direction === 'rtl' ? [1, 0] : state.direction === 'btt' ? [0, 1] : [0, 0];
			gl.uniform2f(uniform('uRes'), canvas.width, canvas.height);
			gl.uniform1f(uniform('uDpr'), dpr);
			gl.uniform1f(uniform('uShape'), SHAPE_INDEX[options.shape]);
			gl.uniform1f(uniform('uTime'), (performance.now() - start) / 1000);
			gl.uniform1f(uniform('uPos'), geometry.position(state.progress));
			gl.uniform1f(uniform('uProgress'), state.progress);
			gl.uniform1f(uniform('uAlpha'), state.alpha);
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
			gl.uniform1f(uniform('uHue'), hue);
			gl.uniform3fv(uniform('uPalA'), state.palette.a);
			gl.uniform3fv(uniform('uPalB'), state.palette.b);
			gl.uniform3fv(uniform('uPalC'), state.palette.c);
			gl.uniform3fv(uniform('uPalD'), state.palette.d);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			frame = requestAnimationFrame(draw);
		}
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
		setWaveAmount: () => {},
		setRippleAmount: (value) => (state.ripple = Math.max(0, Math.min(2, value))),
		setWaveSpeed: (value) => (state.speed = Math.max(0, Math.min(3, value))),
		setBrightness: (value) => (state.brightness = Math.max(0, Math.min(1.5, value))),
		setSwellAmount: () => {},
		getProgress: () => state.progress,
		getAlpha: () => state.alpha,
		destroy: () => {
			if (destroyed) return;
			destroyed = true;
			cancelAnimationFrame(frame);
			observer.disconnect();
			gl.deleteProgram(program);
			gl.deleteBuffer(buffer);
			gl.deleteShader(vertex);
			gl.deleteShader(fragment);
		}
	};
}
