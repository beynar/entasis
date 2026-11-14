// A glimm sweep over one element: the iridescent WebGL band of the `glimm` package crosses the
// element. A `change` made with it lands behind the band, while the content ahead of the band
// keeps showing what was there before.
//
// The band is drawn on a canvas laid over the element in the top layer, so it shows above
// anything the element sits in, dialogs included, and is clipped to the element's rounded box and
// to the scroll containers around it. The before/after split comes from a view transition scoped
// to the element where the browser has one (`element.startViewTransition`). Elsewhere a curtain in
// the element's background colour covers it behind the band, the change runs under the curtain,
// and a second pass reveals the result, which is glimm's own fallback.

import { BROWSER } from 'esm-env';
import { tick } from 'svelte';
import type {
	Direction,
	Easing,
	EasingName,
	Palette,
	PaletteName,
	ShaderController,
	SweepHandle,
	SweepOptions
} from 'glimm';
import type { Colors } from '../../types/theme.js';
import { applyCspNonce } from '../cspNonce.js';
import { prefersReducedMotion } from '../motion.svelte.js';
import {
	createShapeShader,
	shapeGeometry,
	type GlimmShape,
	type ShapeGeometry
} from './glimm.shapes.js';

export type { GlimmShape } from './glimm.shapes.js';

/** The side the band leaves from: left to right, right to left, top to bottom, bottom to top. */
export type GlimmDirection = Direction;

/** A named glimm palette. */
export type GlimmPaletteName = PaletteName;

/**
 * The band's colours, instead of the ones `color` makes: a glimm palette name, or semantic roles of
 * the theme blended along the band (`['primary', 'info']`).
 */
export type GlimmPalette = PaletteName | readonly Colors[];

/**
 * A set of defaults for one use, each its own shape and timing. `reveal` (the default with
 * `change`) is one wide band that crosses the element. `glint` (the default without) is a thin,
 * quick streak of light from a corner. `ripple` is a ring that grows from the centre, or from the
 * point given as `origin` (a click). `double` is two soft bands, one from each side, that meet in the middle;
 * `split` is the reverse, two bands that open from the middle towards both sides. `wave` is a
 * bent band whose edge ripples. Options passed with a preset win over its values.
 */
export type GlimmPreset = 'reveal' | 'glint' | 'ripple' | 'double' | 'split' | 'wave';

type PresetValues = Pick<
	GlimmOptions,
	| 'shape'
	| 'sweepMs'
	| 'outroMs'
	| 'easing'
	| 'bandTight'
	| 'peakAlpha'
	| 'brightness'
	| 'waveAmount'
	| 'rippleAmount'
	| 'waveSpeed'
	| 'swellAmount'
	| 'curve'
>;

/** The values each preset sets. */
export const glimmPresets: Record<GlimmPreset, Readonly<PresetValues>> = {
	reveal: { shape: 'line', sweepMs: 1000, outroMs: 220, bandTight: 16, easing: 'ease' },
	glint: {
		shape: 'glint',
		sweepMs: 900,
		outroMs: 180,
		bandTight: 9,
		peakAlpha: 0.85,
		rippleAmount: 0.4,
		easing: 'easeOutCubic'
	},
	ripple: {
		shape: 'ring',
		sweepMs: 1100,
		outroMs: 240,
		bandTight: 11,
		rippleAmount: 1,
		easing: 'easeOutCubic'
	},
	double: {
		shape: 'double',
		sweepMs: 1100,
		outroMs: 220,
		bandTight: 9,
		rippleAmount: 0.5,
		easing: 'easeOutCubic'
	},
	split: {
		shape: 'split',
		sweepMs: 1100,
		outroMs: 220,
		bandTight: 7,
		rippleAmount: 0.5,
		easing: 'easeOutCubic'
	},
	wave: {
		shape: 'line',
		sweepMs: 1250,
		outroMs: 240,
		bandTight: 18,
		waveAmount: 1.2,
		rippleAmount: 1.4,
		curve: 0.16,
		easing: 'easeOutCubic'
	}
};

/** Where a `ring` grows from: a point in CSS pixels from the element's top-left, or a pointer event. */
export type GlimmOrigin = readonly [x: number, y: number] | { clientX: number; clientY: number };

export type GlimmOptions = {
	/**
	 * The update the sweep reveals. It runs as the sweep starts and may return a promise; the
	 * content it produces shows behind the band while the content ahead still shows the old one. A
	 * change that takes longer than 200 ms is not held back: the element updates when it is done
	 * and the band then sweeps over the result. It always runs, even when the sweep is cancelled,
	 * motion is reduced or WebGL is missing.
	 */
	change?: () => unknown;
	/**
	 * The semantic role the band is made from: that colour of the theme, flanked by its two hue
	 * neighbours so the band keeps its sheen. Default `'primary'`.
	 */
	color?: Colors;
	/** Colours that replace the ones `color` makes. */
	palette?: GlimmPalette;
	/** A set of defaults: `'reveal'` with `change`, `'glint'` without. */
	preset?: GlimmPreset;
	/** The form of the band, which the preset sets: `'line'`, `'double'`, `'split'`, `'glint'`, `'ring'`. */
	shape?: GlimmShape;
	/**
	 * Where a `ring` grows from: a point in CSS pixels from the element's top-left, or the pointer
	 * event that started it, so the ring spreads from the click. Default: the centre.
	 */
	origin?: GlimmOrigin;
	/**
	 * Where the band goes: `'ltr'` (default, `'rtl'` when the element reads right to left), `'rtl'`,
	 * `'ttb'`, `'btt'`. A glint starts from the top-left corner, the top-right one for `'rtl'` and
	 * the bottom-left one for `'btt'`; a double band comes from (a split band goes to) the left and
	 * right sides for `'ltr'` and `'rtl'`, the top and bottom otherwise; a ring ignores it.
	 */
	direction?: GlimmDirection;
	/** Milliseconds the band takes to cross the element. 1100 in `reveal`. */
	sweepMs?: number;
	/** Milliseconds the band takes to fade once across. 220 in `reveal`. */
	outroMs?: number;
	/** How the band moves across: a glimm easing name or a `(progress) => progress` function. Default `'ease'`. */
	easing?: EasingName | Easing;
	/** How tight the band is; higher is narrower. 14 in `reveal`. */
	bandTight?: number;
	/** 0 to 1.5, the band's peak opacity. 1 in `reveal`. */
	peakAlpha?: number;
	/** 0 to 1.5, multiplies the band's colour. Default 1, or 0.8 over a dark surface. */
	brightness?: number;
	/** 0 to 2, how much the band's edge waves. Default 0 (straight). */
	waveAmount?: number;
	/** 0 to 2, the ripple texture inside the band. Default 1. */
	rippleAmount?: number;
	/** 0 to 3, multiplies the speed of the band's own motion. Default 1. */
	waveSpeed?: number;
	/** 0 to 1, the depth and sheen of the band's crest. Default 0.55. */
	swellAmount?: number;
	/** How far the band's ends trail its middle, as a share of the element. Default 0 (straight). */
	curve?: number;
	/** 0 to 1, the share of the element's cross axis the band covers, centred. Default 1. */
	span?: number;
	/** CSS pixels over which the band fades out at the element's edges, or `'auto'` (up to 24). */
	feather?: number | 'auto';
	/** Cancels the sweep when it aborts, like `cancel()`. */
	signal?: AbortSignal;
};

export type GlimmHandle = {
	/** Resolves once `change` has run and its update is in the DOM (right away without one). */
	changed: Promise<void>;
	/** Resolves when the band has faded out, or when the sweep is cancelled. */
	done: Promise<void>;
	/**
	 * Stops the sweep: the band and the old content go, and the element shows what it holds now.
	 * A `change` that has not run yet runs right away.
	 */
	cancel: () => void;
};

type GlimmModule = typeof import('glimm');

// How long the element may stay frozen on its old picture while `change` works.
const FREEZE_MS = 200;

let modulePromise: Promise<GlimmModule> | undefined;
const loadGlimm = () => (modulePromise ??= import('glimm'));

// One sweep per element: a new one takes over from the running one.
const running = new WeakMap<Element, () => void>();

/**
 * Plays a glimm sweep over `element`. With `change`, the update is revealed behind the band;
 * without, the band is a passing highlight. Starting another sweep on the same element cancels
 * this one. Browser only.
 */
export function glimm(element: HTMLElement, options: GlimmOptions = {}): GlimmHandle {
	let changeTask: Promise<void> | undefined;
	const runChange = () =>
		(changeTask ??= (async () => {
			try {
				await options.change?.();
				await tick();
			} catch (error) {
				console.error('[entasis/glimm] change failed:', error);
			}
		})());

	let resolveDone!: () => void;
	const done = new Promise<void>((resolve) => (resolveDone = resolve));
	let resolveChanged!: () => void;
	const changed = new Promise<void>((resolve) => (resolveChanged = resolve));
	const change = () => {
		const task = runChange();
		void task.then(resolveChanged);
		return task;
	};

	if (!BROWSER || prefersReducedMotion() || options.signal?.aborted) {
		void change().then(resolveDone);
		return { changed, done, cancel: () => {} };
	}

	running.get(element)?.();

	let cancelled = false;
	let finished = false;
	const cleanups: Array<() => void> = [];
	let active: SweepHandle | undefined;
	let transition: ViewTransition | undefined;

	const finish = () => {
		if (finished) return;
		finished = true;
		active?.cancel();
		transition?.skipTransition();
		for (const cleanup of cleanups.splice(0).reverse()) cleanup();
		if (running.get(element) === cancel) running.delete(element);
		options.signal?.removeEventListener('abort', cancel);
		void change().then(resolveDone);
	};
	const cancel = () => {
		if (finished) return;
		cancelled = true;
		finish();
	};
	running.set(element, cancel);
	options.signal?.addEventListener('abort', cancel, { once: true });

	void (async () => {
		let lib: GlimmModule;
		try {
			lib = await loadGlimm();
		} catch (error) {
			console.error('[entasis/glimm] could not load glimm:', error);
			return;
		}
		if (cancelled) return;

		const settings: GlimmOptions = {
			...glimmPresets[options.preset ?? (options.change ? 'reveal' : 'glint')]
		};
		for (const [key, value] of Object.entries(options)) {
			if (value !== undefined) (settings as Record<string, unknown>)[key] = value;
		}
		settings.brightness ??= isDark(surfaceColor(element)) ? 0.8 : 1;
		const direction = settings.direction ?? defaultDirection(element);
		const bandTight = settings.bandTight ?? 16;
		const shape = settings.shape ?? 'line';
		const box = element.getBoundingClientRect();
		const origin = resolveOrigin(settings.origin, box);
		const geometry = shapeGeometry(shape, direction, bandTight, box, origin);
		const palette = settings.palette
			? resolvePalette(lib, settings.palette, element)
			: rolePalette(lib, settings.color ?? 'primary', element);
		const overlay = createOverlay(element);
		cleanups.push(overlay.destroy);
		const ctrl =
			shape === 'line'
				? lib.createShader({
						canvas: overlay.canvas,
						palette,
						direction,
						bandTight,
						curve: settings.curve,
						span: settings.span,
						feather: settings.feather
					})
				: createShapeShader({
						canvas: overlay.canvas,
						shape,
						geometry,
						palette,
						direction,
						bandTight,
						origin,
						feather: settings.feather
					});
		if (!ctrl) return;
		cleanups.push(() => {
			ctrl.setAlpha(0);
			ctrl.destroy();
			overlay.canvas.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext();
		});

		const sweep: SweepOptions = {
			sweepMs: settings.sweepMs,
			outroMs: settings.outroMs,
			easing: settings.easing,
			peakAlpha: settings.peakAlpha,
			brightness: settings.brightness,
			waveAmount: settings.waveAmount,
			rippleAmount: settings.rippleAmount,
			waveSpeed: settings.waveSpeed,
			swellAmount: settings.swellAmount
		};
		const play = (controller: ShaderController, extra: SweepOptions = {}) => {
			active = lib.playSweep(controller, { ...sweep, ...extra });
			return active.done;
		};

		if (!options.change) {
			await play(ctrl);
		} else if (typeof (element as ScopedElement).startViewTransition === 'function') {
			await maskedSweep(
				element,
				geometry,
				ctrl,
				play,
				change,
				cleanups,
				(next) => {
					transition = next;
				},
				() => cancelled
			);
		} else {
			await coveredSweep(element, overlay, geometry, ctrl, play, change, sweep, () => cancelled);
		}
	})()
		.catch((error) => console.error('[entasis/glimm] sweep failed:', error))
		.finally(finish);

	return { changed, done, cancel };
}

const defaultDirection = (element: Element): Direction =>
	getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';

const resolveOrigin = (origin: GlimmOrigin | undefined, box: DOMRect): [number, number] => {
	if (!origin) return [box.width / 2, box.height / 2];
	if ('clientX' in origin) return [origin.clientX - box.left, origin.clientY - box.top];
	return [origin[0], origin[1]];
};

/* ---------------------------------------------------------------------------------------------- */
/* Before and after                                                                               */
/* ---------------------------------------------------------------------------------------------- */

type Play = (controller: ShaderController, extra?: SweepOptions) => Promise<void>;

// Element-scoped view transitions (Chromium) are not in TypeScript's DOM types yet.
type ScopedElement = HTMLElement & {
	startViewTransition?: (update: () => Promise<void>) => ViewTransition;
};

const SCOPE_ATTRIBUTE = 'data-glimm-scope';

// The new picture lies over the old one, cut to the part the band has passed (no cross-fade, no
// blend), and the element's own parts are captured with it as one picture.
const scopeStyles = `
[${SCOPE_ATTRIBUTE}] * { view-transition-name: none !important; }
[${SCOPE_ATTRIBUTE}]::view-transition { pointer-events: none; }
[${SCOPE_ATTRIBUTE}]::view-transition-group(root) {
	animation: glimm-hold 86400s linear both !important;
}
[${SCOPE_ATTRIBUTE}]::view-transition-group-children(root) {
	animation: glimm-hold 86400s linear both !important;
}
[${SCOPE_ATTRIBUTE}]::view-transition-image-pair(root) { isolation: auto; }
[${SCOPE_ATTRIBUTE}]::view-transition-old(root),
[${SCOPE_ATTRIBUTE}]::view-transition-new(root) {
	animation: none !important;
	mix-blend-mode: normal;
	opacity: 1;
}
[${SCOPE_ATTRIBUTE}]::view-transition-old(root) { z-index: 1; }
[${SCOPE_ATTRIBUTE}]::view-transition-new(root) { z-index: 2; }
@keyframes glimm-hold { from { opacity: 1; } to { opacity: 1; } }
`;

async function maskedSweep(
	element: HTMLElement,
	geometry: ShapeGeometry,
	ctrl: ShaderController,
	play: Play,
	runChange: () => Promise<void>,
	cleanups: Array<() => void>,
	setTransition: (transition: ViewTransition) => void,
	isCancelled: () => boolean
) {
	const style = applyCspNonce(document.createElement('style'));
	style.textContent = scopeStyles;
	document.head.append(style);
	element.setAttribute(SCOPE_ATTRIBUTE, '');
	let clip: Animation | undefined;
	const release = () => transition.skipTransition();
	// Once the old picture is gone (cut through, skipped or never taken), the element is itself again.
	const unscope = () => {
		clip?.cancel();
		for (const type of ['pointerdown', 'wheel', 'keydown'] as const) {
			element.removeEventListener(type, release, true);
		}
		element.removeAttribute(SCOPE_ATTRIBUTE);
		style.remove();
	};
	cleanups.push(unscope);

	let late: Promise<void> | undefined;
	const transition = (element as Required<ScopedElement>).startViewTransition(async () => {
		const work = runChange();
		let timer: ReturnType<typeof setTimeout> | undefined;
		const inTime = await Promise.race([
			work.then(() => true),
			new Promise<boolean>((resolve) => (timer = setTimeout(() => resolve(false), FREEZE_MS)))
		]);
		clearTimeout(timer);
		if (!inTime) late = work;
	});
	setTransition(transition);
	void transition.finished.then(unscope, unscope);
	void transition.updateCallbackDone.catch(() => {});

	try {
		await transition.ready;
	} catch {
		// No snapshot (the element is not rendered, or another transition took over): the change
		// still runs, and the band passes over its result.
		await runChange();
		if (isCancelled()) return;
		await play(ctrl);
		return;
	}
	if (isCancelled()) return;
	if (late) {
		transition.skipTransition();
		await late;
		if (isCancelled()) return;
		await nextPaint();
		await play(ctrl);
		return;
	}

	// Touching the element shows it as it is now; the band carries on.
	for (const type of ['pointerdown', 'wheel', 'keydown'] as const) {
		element.addEventListener(type, release, { capture: true, passive: true });
	}
	// One paused animation whose keyframe is rewritten each frame: a ring's circle or a glint's
	// polygon is not a straight interpolation between two values.
	let effect: KeyframeEffect | undefined;
	try {
		const start = geometry.clip(geometry.position(0));
		clip = element.animate(
			{ clipPath: [start, start] },
			{ duration: 1, fill: 'both', pseudoElement: '::view-transition-new(root)' }
		);
		clip.pause();
		effect = clip.effect as KeyframeEffect;
	} catch {
		clip = undefined;
	}
	const cut = (progress: number) => {
		const value = geometry.clip(geometry.position(progress));
		effect?.setKeyframes([{ clipPath: value }, { clipPath: value }]);
	};
	cut(0);
	await play({
		...ctrl,
		setProgress: (progress) => {
			cut(progress);
			ctrl.setProgress(progress);
		}
	});
}

async function coveredSweep(
	element: HTMLElement,
	overlay: Overlay,
	geometry: ShapeGeometry,
	ctrl: ShaderController,
	play: Play,
	runChange: () => Promise<void>,
	sweep: SweepOptions,
	isCancelled: () => boolean
) {
	const curtain = overlay.curtain;
	curtain.style.background = surfaceColor(element);
	const mask = (progress: number, covering: boolean) => {
		const value = geometry.mask(geometry.position(progress), covering);
		curtain.style.maskImage = value;
		curtain.style.setProperty('-webkit-mask-image', value);
	};
	const show = (visible: boolean) => {
		curtain.style.display = visible ? 'block' : 'none';
	};

	const total = Number.isFinite(sweep.sweepMs) ? Math.max(0, sweep.sweepMs!) : 1100;
	const split = 0.56;
	let covering = true;
	let late = false;
	show(true);
	mask(0, true);

	// The band covers the element behind it.
	await play(
		{
			...ctrl,
			getProgress: () => 0,
			setProgress: (progress) => {
				if (covering) mask(progress, true);
				ctrl.setProgress(progress);
			}
		},
		{
			sweepMs: total * split,
			outroMs: 0,
			midpoint: 1,
			onMidpoint: async () => {
				covering = false;
				curtain.style.maskImage = 'none';
				curtain.style.removeProperty('-webkit-mask-image');
				ctrl.setAlpha(0);
				await nextPaint();
				if (isCancelled()) return;
				let timer: ReturnType<typeof setTimeout> | undefined;
				const work = runChange();
				const inTime = await Promise.race([
					work.then(() => true),
					new Promise<boolean>((resolve) => (timer = setTimeout(() => resolve(false), FREEZE_MS)))
				]);
				clearTimeout(timer);
				if (!inTime) {
					late = true;
					show(false);
				}
				await work;
				await nextPaint();
			}
		}
	);
	if (isCancelled()) return;

	// Then uncovers it, the change in place.
	await play(
		{
			...ctrl,
			getProgress: () => 0,
			setProgress: (progress) => {
				if (!late) mask(progress, false);
				ctrl.setProgress(progress);
			}
		},
		{ sweepMs: total * (1 - split), midpoint: 1, onMidpoint: () => show(false) }
	);
	show(false);
}

// The colour the element shows: its own background, or the first opaque one around it.
function surfaceColor(element: Element) {
	for (let node: Element | null = element; node; node = parentOf(node)) {
		const color = getComputedStyle(node).backgroundColor;
		if (alphaOf(color) >= 1) return color;
	}
	return 'Canvas';
}

const alphaOf = (color: string) => {
	if (!color || color === 'transparent') return 0;
	const match = /(?:\/|,(?=[^,]*\)$))\s*([\d.]+)(%?)\s*\)$/.exec(color);
	if (!match || !/^rgba|\//.test(color)) return 1;
	return parseFloat(match[1]) / (match[2] ? 100 : 1);
};

const nextPaint = () =>
	new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
	);

/* ---------------------------------------------------------------------------------------------- */
/* Overlay                                                                                        */
/* ---------------------------------------------------------------------------------------------- */

type Overlay = {
	canvas: HTMLCanvasElement;
	curtain: HTMLElement;
	destroy: () => void;
};

const parentOf = (node: Element): Element | null => {
	if (node.parentElement) return node.parentElement;
	const root = node.parentNode;
	return root instanceof ShadowRoot ? root.host : null;
};

// The ancestors whose overflow clips the element.
const clippingAncestors = (element: Element) => {
	const ancestors: Element[] = [];
	for (let node = parentOf(element); node; node = parentOf(node)) {
		if (node === document.documentElement || node === document.body) continue;
		const style = getComputedStyle(node);
		if (style.overflowX !== 'visible' || style.overflowY !== 'visible') ancestors.push(node);
		if (style.position === 'fixed') break;
	}
	return ancestors;
};

function createOverlay(element: HTMLElement): Overlay {
	const host = document.createElement('div');
	host.setAttribute('aria-hidden', 'true');
	host.dataset.glimmOverlay = '';
	const supportsPopover = typeof host.showPopover === 'function';
	if (supportsPopover) host.popover = 'manual';
	Object.assign(host.style, {
		position: 'fixed',
		inset: 'auto',
		margin: '0',
		padding: '0',
		border: '0',
		background: 'transparent',
		overflow: 'hidden',
		pointerEvents: 'none',
		zIndex: '2147483647'
	} satisfies Partial<CSSStyleDeclaration>);

	const curtain = document.createElement('div');
	Object.assign(curtain.style, { position: 'absolute', inset: '0', display: 'none' });
	const canvas = document.createElement('canvas');
	Object.assign(canvas.style, {
		position: 'absolute',
		inset: '0',
		width: '100%',
		height: '100%',
		display: 'block'
	});
	host.append(curtain, canvas);

	const ancestors = clippingAncestors(element);
	const sync = () => {
		const box = element.getBoundingClientRect();
		host.style.left = `${box.left}px`;
		host.style.top = `${box.top}px`;
		host.style.width = `${box.width}px`;
		host.style.height = `${box.height}px`;
		const style = getComputedStyle(element);
		host.style.borderRadius = style.borderRadius;

		let top = 0;
		let right = window.innerWidth;
		let bottom = window.innerHeight;
		let left = 0;
		for (const ancestor of ancestors) {
			const outer = ancestor.getBoundingClientRect();
			const innerLeft = outer.left + ancestor.clientLeft;
			const innerTop = outer.top + ancestor.clientTop;
			left = Math.max(left, innerLeft);
			top = Math.max(top, innerTop);
			right = Math.min(right, innerLeft + (ancestor.clientWidth || outer.width));
			bottom = Math.min(bottom, innerTop + (ancestor.clientHeight || outer.height));
		}
		const cut = [
			Math.max(0, top - box.top),
			Math.max(0, box.right - right),
			Math.max(0, box.bottom - bottom),
			Math.max(0, left - box.left)
		];
		host.style.clipPath = cut.some((side) => side > 0)
			? `inset(${cut.map((side) => `${side}px`).join(' ')})`
			: '';
	};

	sync();
	document.body.append(host);
	if (supportsPopover) host.showPopover();
	let frame = requestAnimationFrame(function follow() {
		sync();
		frame = requestAnimationFrame(follow);
	});

	return {
		canvas,
		curtain,
		destroy: () => {
			cancelAnimationFrame(frame);
			host.remove();
		}
	};
}

/* ---------------------------------------------------------------------------------------------- */
/* Palette                                                                                        */
/* ---------------------------------------------------------------------------------------------- */

// A semantic role, read on the element as the theme paints it there.
const roleHex = (role: Colors, element: Element) => toHex(`var(--color-${role})`, element);

// How far, in radians of OKLCH hue, the band reaches on either side of the role's colour.
const NEIGHBOUR = 0.7;

// The role's colour between its two hue neighbours, blended in OKLCH: on-brand, still iridescent.
function rolePalette(lib: GlimmModule, role: Colors, element: Element): Palette {
	const hex = roleHex(role, element);
	if (!hex) return lib.resolvePalette(undefined);
	const center = lib.rgbToOklch(lib.hexToRgb(hex));
	const turn = (by: number) =>
		rgbHex(lib.oklchToRgb({ L: center.L, C: center.C, H: center.H + by }));
	return lib.accentChain([turn(-NEIGHBOUR), hex, turn(NEIGHBOUR)]);
}

const rgbHex = (rgb: readonly number[]) =>
	`#${rgb
		.map((channel) =>
			Math.round(Math.max(0, Math.min(1, channel)) * 255)
				.toString(16)
				.padStart(2, '0')
		)
		.join('')}`;

// Whether a computed colour is dark enough for the band to be dimmed over it.
function isDark(color: string) {
	const hex = toHex(color, document.documentElement);
	if (!hex) return false;
	const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.35;
}

function resolvePalette(lib: GlimmModule, palette: GlimmPalette, element: Element) {
	if (!Array.isArray(palette)) return lib.resolvePalette(palette as PaletteName);
	if (palette.length === 1) return rolePalette(lib, palette[0], element);
	const hexes = palette
		.map((role) => roleHex(role, element))
		.filter((hex): hex is string => hex !== null);
	if (hexes.length === 0) return lib.resolvePalette(undefined);
	if (hexes.length === 1) return lib.accentPair(hexes[0], hexes[0]);
	if (hexes.length === 2) return lib.accentPair(hexes[0], hexes[1]);
	return lib.accentChain(hexes);
}

let probe: CanvasRenderingContext2D | null | undefined;

// A CSS colour as `#rrggbb`: custom properties are read on the element, then the canvas parses
// and converts the result (oklch, color-mix…) to sRGB.
export function toHex(color: string, element: Element): string | null {
	let value = color.trim();
	const style = getComputedStyle(element);
	for (let depth = 0; depth < 8; depth += 1) {
		const variable = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(value);
		if (!variable) break;
		value = style.getPropertyValue(variable[1]).trim() || variable[2]?.trim() || '';
	}
	if (/^currentcolor$/i.test(value)) value = style.color;
	if (!value) return null;

	if (probe === undefined) {
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		probe = canvas.getContext('2d', { willReadFrequently: true });
	}
	if (!probe) return null;
	// An unparsable colour leaves fillStyle as it was: try it over two different ones.
	probe.fillStyle = '#000000';
	probe.fillStyle = value;
	const overBlack = probe.fillStyle;
	probe.fillStyle = '#ffffff';
	probe.fillStyle = value;
	if (probe.fillStyle !== overBlack) return null;
	probe.clearRect(0, 0, 1, 1);
	probe.fillRect(0, 0, 1, 1);
	const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
	return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
