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
import { createDistortion, type Distortion } from './glimm.distort.js';
import { prefersReducedMotion } from '../motion.svelte.js';
import {
	createShapeShader,
	shapeGeometry,
	type GlimmShape,
	type ShapeGeometry,
	type SourceRect
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
 * bent band whose edge ripples. `surge` (the default with a `source`) draws its breath at the
 * control that started it, then leaves it as an arc that swells over the element, sparks riding
 * it, and leaves its colour on the edges. Options passed with a preset win over its values.
 */
export type GlimmPreset = 'reveal' | 'glint' | 'ripple' | 'double' | 'split' | 'wave' | 'surge';

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
	| 'anticipation'
	| 'sparks'
	| 'edges'
	| 'blur'
	| 'distort'
>;

/** The values each preset sets. */
export const glimmPresets: Record<GlimmPreset, Readonly<PresetValues>> = {
	reveal: {
		shape: 'line',
		sweepMs: 1000,
		outroMs: 220,
		bandTight: 16,
		easing: 'ease',
		edges: 0.5,
		blur: 4
	},
	glint: {
		shape: 'glint',
		sweepMs: 900,
		outroMs: 180,
		bandTight: 9,
		peakAlpha: 0.85,
		rippleAmount: 0.4,
		easing: 'easeOutCubic',
		sparks: 12
	},
	ripple: {
		shape: 'ring',
		sweepMs: 1100,
		outroMs: 240,
		bandTight: 11,
		rippleAmount: 1,
		easing: 'easeOutCubic',
		sparks: 20,
		edges: 0.7,
		blur: 4,
		distort: 6
	},
	double: {
		shape: 'double',
		sweepMs: 1100,
		outroMs: 220,
		bandTight: 9,
		rippleAmount: 0.5,
		easing: 'easeOutCubic',
		edges: 0.5
	},
	split: {
		shape: 'split',
		sweepMs: 1100,
		outroMs: 220,
		bandTight: 7,
		rippleAmount: 0.5,
		easing: 'easeOutCubic',
		edges: 0.5
	},
	wave: {
		shape: 'line',
		sweepMs: 1250,
		outroMs: 240,
		bandTight: 18,
		waveAmount: 1.2,
		rippleAmount: 1.4,
		curve: 0.16,
		easing: 'easeOutCubic',
		edges: 0.6,
		blur: 6,
		distort: 6
	},
	surge: {
		shape: 'arc',
		sweepMs: 1300,
		outroMs: 260,
		bandTight: 7,
		rippleAmount: 0.6,
		easing: 'easeOutCubic',
		anticipation: 240,
		sparks: 32,
		edges: 0.9,
		blur: 8,
		distort: 12
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
	/** A set of defaults: `'surge'` with a `source`, else `'reveal'` with `change`, `'glint'` without. */
	preset?: GlimmPreset;
	/**
	 * The form of the band, which the preset sets: `'line'`, `'double'`, `'split'`, `'glint'`,
	 * `'ring'`, `'arc'`.
	 */
	shape?: GlimmShape;
	/**
	 * The control the sweep starts from, inside the element or beside it: an `arc` leaves it, flat
	 * along its long side (a wide button sends up a dome, a tall tab a sideways one), and a `ring`
	 * grows from its centre and leaves it clear. Without one, an arc leaves the middle of the side
	 * `direction` starts from.
	 */
	source?: Element;
	/**
	 * Where a `ring` grows from: a point in CSS pixels from the element's top-left, or the pointer
	 * event that started it, so the ring spreads from the click. Default: the centre, or the
	 * `source`'s. An `arc` without a `source` leaves this point.
	 */
	origin?: GlimmOrigin;
	/**
	 * Milliseconds the band takes to draw its breath before it leaves: it shows a little inside the
	 * element and is drawn back to where it starts. 240 in `surge`, 0 elsewhere.
	 */
	anticipation?: number;
	/** How many sparks ride the band and burn out behind it, up to 32. 32 in `surge`. */
	sparks?: number;
	/**
	 * 0 to 1, how much the band lights the element's edges where it meets them: the same band, in
	 * its colour, hugging the rounded edge with a white hairline. 0.9 in `surge`.
	 */
	edges?: number;
	/** CSS pixels of blur the content takes where the band crosses it. 8 in `surge`, 0 to turn off. */
	blur?: number;
	/**
	 * CSS pixels the content swells by where the band crosses it, its colours parting slightly: a
	 * lens over the element's old and new content while they change. Only with `change`, in browsers
	 * with scoped view transitions (Chromium); elsewhere the content stays still. 12 in `surge`, 6 in
	 * `ripple` and `wave`, 0 to turn off.
	 */
	distort?: number;
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
	/**
	 * CSS pixels over which the band fades out before the element's edges, or `'auto'` (up to 24).
	 * Default 0: the band runs to the edges, where the element's rounded shape clips it.
	 */
	feather?: number | 'auto';
	/** Cancels the sweep when it aborts, like `cancel()`. */
	signal?: AbortSignal;
};

export type GlimmHandle = {
	/** Resolves once `change` has run and its update is in the DOM (right away without one). */
	changed: Promise<void>;
	/** Resolves when the band and its sparks have faded out, or when the sweep is cancelled. */
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
			...glimmPresets[
				options.preset ?? (options.source ? 'surge' : options.change ? 'reveal' : 'glint')
			]
		};
		for (const [key, value] of Object.entries(options)) {
			if (value !== undefined) (settings as Record<string, unknown>)[key] = value;
		}
		settings.brightness ??= isDark(surfaceColor(element)) ? 0.8 : 1;
		const direction = settings.direction ?? defaultDirection(element);
		const bandTight = settings.bandTight ?? 16;
		const shape = settings.shape ?? 'line';
		const box = element.getBoundingClientRect();
		const source = settings.source ? sourceRect(settings.source, box) : undefined;
		const origin = resolveOrigin(settings.origin, box, source);
		const content = contentRect(element, box);
		const geometry = shapeGeometry(
			shape,
			direction,
			bandTight,
			box,
			origin,
			source ?? (settings.origin ? { x: origin[0], y: origin[1], width: 0, height: 0 } : undefined),
			content
		);
		const palette = settings.palette
			? resolvePalette(lib, settings.palette, element)
			: rolePalette(lib, settings.color ?? 'primary', element);

		const anticipation = Math.max(0, settings.anticipation ?? 0);
		const overlay = createOverlay(element, { blur: Math.max(0, settings.blur ?? 0) });
		cleanups.push(overlay.destroy);
		const band = createShapeShader({
			canvas: overlay.canvas,
			shape,
			geometry,
			palette,
			direction,
			bandTight,
			origin,
			feather: settings.feather,
			curve: settings.curve,
			span: settings.span,
			sparks: Math.max(0, settings.sparks ?? 0),
			edges: Math.max(0, Math.min(1, settings.edges ?? 0)),
			corner: parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0,
			blurLayer: overlay.blur,
			sweepMs: settings.sweepMs ?? 1000,
			// A ring from a control leaves the control clear, so it can change in place.
			hold:
				shape === 'ring' && source && !settings.origin
					? Math.min(source.width, source.height) / 2
					: 0
		});
		if (!band) return;
		cleanups.push(() => {
			band.setAlpha(0);
			band.destroy();
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
		let gathered = false;
		const play: Play = async (controller, extra = {}, withEdges = true) => {
			// The breath before the first pass.
			if (!gathered) {
				gathered = true;
				await band.gather(anticipation);
				if (cancelled) return;
			}
			band.launch(withEdges);
			active = lib.playSweep(controller, { ...sweep, ...extra });
			return active.done;
		};

		if (!options.change) {
			await play(band);
		} else if (typeof (element as ScopedElement).startViewTransition === 'function') {
			await maskedSweep(
				element,
				geometry,
				band,
				play,
				change,
				cleanups,
				(next) => {
					transition = next;
				},
				() => cancelled,
				Math.max(0, settings.distort ?? 0)
			);
		} else {
			await coveredSweep(element, overlay, geometry, band, play, change, sweep, () => cancelled);
		}
		// The element is itself again while the last sparks burn out.
		if (!cancelled) {
			transition?.skipTransition();
			await band.settled();
		}
	})()
		.catch((error) => console.error('[entasis/glimm] sweep failed:', error))
		.finally(finish);

	return { changed, done, cancel };
}

const defaultDirection = (element: Element): Direction =>
	getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';

const resolveOrigin = (
	origin: GlimmOrigin | undefined,
	box: DOMRect,
	source?: SourceRect
): [number, number] => {
	if (!origin) {
		return source
			? [source.x + source.width / 2, source.y + source.height / 2]
			: [box.width / 2, box.height / 2];
	}
	if ('clientX' in origin) return [origin.clientX - box.left, origin.clientY - box.top];
	return [origin[0], origin[1]];
};

/**
 * The part of the element its content takes, from its top-left: the box its children occupy less
 * their own padding (a Card's slots carry its inner spacing), or the element's own content box when
 * it holds no element. The sweep's field spans it, so no time goes on empty padding.
 */
function contentRect(element: HTMLElement, box: DOMRect): SourceRect {
	const lengths = (style: CSSStyleDeclaration, side: 'Top' | 'Right' | 'Bottom' | 'Left') =>
		(parseFloat(style[`padding${side}`]) || 0) + (parseFloat(style[`border${side}Width`]) || 0);
	const inner = (rect: DOMRect, style: CSSStyleDeclaration) => ({
		left: rect.left + lengths(style, 'Left'),
		top: rect.top + lengths(style, 'Top'),
		right: rect.right - lengths(style, 'Right'),
		bottom: rect.bottom - lengths(style, 'Bottom')
	});
	const own = inner(box, getComputedStyle(element));
	let union: { left: number; top: number; right: number; bottom: number } | undefined;
	for (const child of element.children) {
		const style = getComputedStyle(child);
		if (style.display === 'none' || style.position === 'absolute' || style.position === 'fixed') {
			continue;
		}
		const rect = child.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) continue;
		const part = child instanceof HTMLElement ? inner(rect, style) : rect;
		union = union
			? {
					left: Math.min(union.left, part.left),
					top: Math.min(union.top, part.top),
					right: Math.max(union.right, part.right),
					bottom: Math.max(union.bottom, part.bottom)
				}
			: { left: part.left, top: part.top, right: part.right, bottom: part.bottom };
	}
	const area = union
		? {
				left: Math.max(own.left, union.left),
				top: Math.max(own.top, union.top),
				right: Math.min(own.right, union.right),
				bottom: Math.min(own.bottom, union.bottom)
			}
		: own;
	// Nothing left once the padding is out: the whole element.
	if (area.right - area.left < 8 || area.bottom - area.top < 8) {
		return { x: 0, y: 0, width: box.width, height: box.height };
	}
	return {
		x: area.left - box.left,
		y: area.top - box.top,
		width: area.right - area.left,
		height: area.bottom - area.top
	};
}

// The source's box, from the element's top-left.
const sourceRect = (source: Element, box: DOMRect): SourceRect => {
	const rect = source.getBoundingClientRect();
	return { x: rect.left - box.left, y: rect.top - box.top, width: rect.width, height: rect.height };
};

/* ---------------------------------------------------------------------------------------------- */
/* Before and after                                                                               */
/* ---------------------------------------------------------------------------------------------- */

/** One pass of the band; `withEdges` false for a pass whose colour should not stay on the edges. */
type Play = (
	controller: ShaderController,
	extra?: SweepOptions,
	withEdges?: boolean
) => Promise<void>;

// Element-scoped view transitions (Chromium) are not in TypeScript's DOM types yet.
type ScopedElement = HTMLElement & {
	startViewTransition?: (update: () => Promise<void>) => ViewTransition;
};

const SCOPE_ATTRIBUTE = 'data-glimm-scope';
let scopes = 0;

// The new picture lies over the old one, cut to the part the band has passed (no cross-fade, no
// blend), and the element's own parts are captured with it as one picture.
const scopeStyles = (scope: string) => `
${scope} * { view-transition-name: none !important; }
${scope}::view-transition { pointer-events: none; }
${scope}::view-transition-group(root) {
	animation: glimm-hold 86400s linear both !important;
}
${scope}::view-transition-group-children(root) {
	animation: glimm-hold 86400s linear both !important;
}
${scope}::view-transition-image-pair(root) { isolation: auto; }
${scope}::view-transition-old(root),
${scope}::view-transition-new(root) {
	animation: none !important;
	mix-blend-mode: normal;
	opacity: 1;
}
${scope}::view-transition-old(root) { z-index: 1; }
${scope}::view-transition-new(root) { z-index: 2; }
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
	isCancelled: () => boolean,
	distort: number
) {
	// Each sweep marks the element with its own value: one that is taken over ends a moment after
	// the next one has started, and must neither unmark the element nor style the new pictures.
	const token = String(++scopes);
	const scope = `[${SCOPE_ATTRIBUTE}="${token}"]`;
	const style = applyCspNonce(document.createElement('style'));
	style.textContent = scopeStyles(scope);
	document.head.append(style);
	element.setAttribute(SCOPE_ATTRIBUTE, token);
	let clip: Animation | undefined;
	const release = () => transition.skipTransition();
	// Once the old picture is gone (cut through, skipped or never taken), the element is itself again.
	const unscope = () => {
		clip?.cancel();
		for (const type of ['pointerdown', 'wheel', 'keydown'] as const) {
			element.removeEventListener(type, release, true);
		}
		if (element.getAttribute(SCOPE_ATTRIBUTE) === token) element.removeAttribute(SCOPE_ATTRIBUTE);
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
	// The lens over both pictures, where the map can be drawn.
	let lens: Distortion | null = null;
	if (distort > 0) {
		const box = element.getBoundingClientRect();
		lens = createDistortion(geometry, box.width, box.height, distort);
		if (lens) {
			const drawn = lens;
			cleanups.push(() => drawn.destroy());
			style.textContent += drawn.rule(scope);
		}
	}
	await play({
		...ctrl,
		setProgress: (progress) => {
			cut(progress);
			lens?.update(progress);
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
	// An arc's quick start reaches the far side early: covering with it would leave the element
	// hidden while the band crawls on past it. It covers at an even pace, and in less of the time.
	const arc = geometry.arc !== undefined;
	const split = arc ? 0.42 : 0.56;
	let covering = true;
	let late = false;

	// The band covers the element behind it.
	await play(
		{
			...ctrl,
			getProgress: () => 0,
			// The curtain goes up as the band leaves, not while it gathers at the control.
			setProgress: (progress) => {
				if (covering) {
					show(true);
					mask(progress, true);
				}
				ctrl.setProgress(progress);
			}
		},
		{
			sweepMs: total * split,
			outroMs: 0,
			...(arc ? { easing: 'easeInOutCubic' as const } : {}),
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
		},
		// The colour stays on the edges after the pass that reveals, not this one.
		false
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
	/** A layer under the band whose backdrop blurs, when asked for. */
	blur?: HTMLElement;
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

// A box laid over the element in the top layer, out of the way of the pointer.
const layer = () => {
	const node = document.createElement('div');
	node.setAttribute('aria-hidden', 'true');
	if (typeof node.showPopover === 'function') node.popover = 'manual';
	Object.assign(node.style, {
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
	return node;
};

const fill = (node: HTMLElement) =>
	Object.assign(node.style, {
		position: 'absolute',
		inset: '0',
		width: '100%',
		height: '100%',
		display: 'block'
	});

function createOverlay(element: HTMLElement, options: { blur?: number } = {}): Overlay {
	const host = layer();
	host.dataset.glimmOverlay = '';

	const curtain = document.createElement('div');
	Object.assign(curtain.style, { position: 'absolute', inset: '0', display: 'none' });
	const canvas = document.createElement('canvas');
	fill(canvas);
	host.append(curtain, canvas);
	// The blur is a layer of its own under the band: a backdrop blurs only up to an ancestor that
	// clips or masks, and the band's layer clips to the scroll containers.
	let blur: HTMLElement | undefined;
	if (options.blur) {
		blur = layer();
		blur.dataset.glimmBlur = '';
		blur.style.visibility = 'hidden';
		blur.style.backdropFilter = `blur(${options.blur}px)`;
		blur.style.setProperty('-webkit-backdrop-filter', `blur(${options.blur}px)`);
	}
	const layers = blur ? [blur, host] : [host];

	const ancestors = clippingAncestors(element);
	const sync = () => {
		const box = element.getBoundingClientRect();
		const style = getComputedStyle(element);

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
		const clipPath = cut.some((side) => side > 0)
			? `inset(${cut.map((side) => `${side}px`).join(' ')})`
			: '';
		for (const node of layers) {
			node.style.left = `${box.left}px`;
			node.style.top = `${box.top}px`;
			node.style.width = `${box.width}px`;
			node.style.height = `${box.height}px`;
			node.style.borderRadius = style.borderRadius;
			node.style.clipPath = clipPath;
		}
	};

	sync();
	// In the top layer in the order shown: the blur first, under the band.
	for (const node of layers) {
		document.body.append(node);
		if (typeof node.showPopover === 'function') node.showPopover();
	}
	let frame = requestAnimationFrame(function follow() {
		sync();
		frame = requestAnimationFrame(follow);
	});

	return {
		canvas,
		blur,
		curtain,
		destroy: () => {
			cancelAnimationFrame(frame);
			for (const node of layers) node.remove();
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
