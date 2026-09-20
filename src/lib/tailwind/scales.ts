// The design scales shared by the Tailwind plugin (build time) and the runtime token
// compiler (`Theme designTokens`), so both emit identical CSS variables.

import { easingBezierStrings, type Easing } from '../transitions/easingFunctions.js';
import { geometryVariables } from './geometry.js';

export type ThemeSpacing = 'small' | 'normal' | 'large' | number;
export type ThemeRadius = 'none' | 'subtile' | 'small' | 'normal' | 'large' | 'round' | number;
export type ThemeElevation = 'flat' | 'normal' | 'high';
export type ThemeSpacingStep = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ThemeSpacingScale = Record<ThemeSpacingStep, number>;

export type TypeScaleRatio =
	| 'minorSecond'
	| 'majorSecond'
	| 'minorThird'
	| 'majorThird'
	| 'perfectFourth'
	| 'augmentedFourth'
	| 'perfectFifth'
	| 'goldenRatio';

export type TypeScaleOptions = {
	baseMinPx?: number;
	baseMaxPx?: number;
	minViewport?: number;
	maxViewport?: number;
	scale?: TypeScaleRatio;
	remValueInPx?: number;
};

export type TypeScalePreset = 'compact' | 'default' | 'comfortable' | 'large';

export const spacingFactors = { small: 0.8, normal: 1, large: 1.2 } as const;

export const defaultThemeSpacingScale = {
	xs: 1,
	sm: 1.5,
	md: 2,
	lg: 3,
	xl: 4
} as const satisfies ThemeSpacingScale;

export const radiusFactors = {
	none: 0,
	subtile: 0.5,
	small: 0.75,
	normal: 1,
	large: 1.5,
	round: 2.5
} as const;

/** Distinct steps in rem at factor 1 — `rounded-xs` … `rounded-4xl` are all different. */
export const radiusSteps = {
	xs: 0.125,
	sm: 0.25,
	md: 0.5, // controls (buttons, inputs) keep the radius they always had
	lg: 0.75, // panels: cards, popovers, menus, alerts
	xl: 1, // dialogs, drawers, large surfaces
	'2xl': 1.25,
	'3xl': 1.5,
	'4xl': 2
} as const;

export const typeScaleRatios = {
	minorSecond: 1.067,
	majorSecond: 1.125,
	minorThird: 1.2,
	majorThird: 1.25,
	perfectFourth: 1.32,
	augmentedFourth: 1.414,
	perfectFifth: 1.5,
	goldenRatio: 1.618
} as const;

export const typeScalePresets = {
	compact: { baseMinPx: 14, baseMaxPx: 16, scale: 'minorThird' },
	default: { baseMinPx: 16, baseMaxPx: 18, scale: 'majorThird' },
	comfortable: { baseMinPx: 16, baseMaxPx: 20, scale: 'majorThird' },
	large: { baseMinPx: 18, baseMaxPx: 22, scale: 'perfectFourth' }
} as const satisfies Record<TypeScalePreset, TypeScaleOptions>;

/**
 * The whole `--text-*` namespace, so no step is left at Tailwind's static default —
 * a partial ramp would put the generated `4xl` above the stock `5xl`.
 */
export const typeScaleSteps = [
	'xs',
	'sm',
	'base',
	'lg',
	'xl',
	'2xl',
	'3xl',
	'4xl',
	'5xl',
	'6xl',
	'7xl',
	'8xl',
	'9xl'
] as const;

/**
 * Legibility floors for the two steps below `base`, in px. They apply to both ends of
 * the clamp so a step can never render below its floor, and they match the flat sizes
 * `text-xs` / `text-sm` had before the ramp became a build-time default.
 */
const smallStepFloorPx = [12, 14] as const;

export const elevationLevels = [0, 1, 2, 3, 4, 5] as const;
export type ElevationLevel = (typeof elevationLevels)[number];

const finiteNumber = (value: number, name: string, minimum = 0) => {
	if (!Number.isFinite(value) || value < minimum) {
		throw new Error(`${name} must be a finite number greater than or equal to ${minimum}.`);
	}
	return value;
};

const positiveNumber = (value: number, name: string) => {
	if (!Number.isFinite(value) || value <= 0) {
		throw new Error(`${name} must be a finite number greater than 0.`);
	}
	return value;
};

export const presetFactor = <Preset extends Record<string, number>>(
	value: keyof Preset | number,
	presets: Preset,
	name: string
) => {
	if (typeof value === 'number') return finiteNumber(value, name);
	const factor = presets[value];
	if (factor === undefined) throw new Error(`Unknown ${name} preset "${String(value)}".`);
	return factor;
};

const round = (value: number) => Number(value.toFixed(3));
export const formatRem = (value: number) => `${Number(value.toFixed(6))}rem`;

export const spacingVariable = (spacing: ThemeSpacing) => ({
	'--spacing': formatRem(0.25 * presetFactor(spacing, spacingFactors, 'spacing')),
	// Re-declared alongside `--spacing` so control heights, rows and icons follow a scoped
	// override instead of staying pinned to the html-level value.
	...geometryVariables
});

export const spacingScaleVariables = (spacingScale: Partial<ThemeSpacingScale>) => {
	const resolvedScale: ThemeSpacingScale = { ...defaultThemeSpacingScale, ...spacingScale };
	const entries = Object.entries(resolvedScale) as [ThemeSpacingStep, number][];
	entries.forEach(([step, value], index) => {
		positiveNumber(value, `spacingScale.${step}`);
		const previousEntry = entries[index - 1];
		if (previousEntry && value <= previousEntry[1]) {
			throw new Error(
				`spacingScale.${step} must be greater than spacingScale.${previousEntry[0]}.`
			);
		}
	});
	return Object.fromEntries(
		entries.map(([step, multiplier]) => [`--space-${step}`, `calc(var(--spacing) * ${multiplier})`])
	);
};

export const radiusVariables = (radius: ThemeRadius) => {
	const factor = presetFactor(radius, radiusFactors, 'radius');
	const variables = Object.fromEntries(
		Object.entries(radiusSteps).map(([step, rem]) => [`--radius-${step}`, formatRem(rem * factor)])
	);
	return { '--radius': variables['--radius-md'], ...variables };
};

export const typeScaleVariables = (typeScale: TypeScalePreset | TypeScaleOptions) => {
	const preset: TypeScaleOptions =
		typeof typeScale === 'string' ? typeScalePresets[typeScale] : typeScale;
	if (!preset) throw new Error(`Unknown typeScale preset "${String(typeScale)}".`);

	const baseMinPx = positiveNumber(preset.baseMinPx ?? 16, 'typeScale.baseMinPx');
	const baseMaxPx = positiveNumber(preset.baseMaxPx ?? 18, 'typeScale.baseMaxPx');
	const minViewport = finiteNumber(preset.minViewport ?? 375, 'typeScale.minViewport');
	const maxViewport = positiveNumber(preset.maxViewport ?? 1440, 'typeScale.maxViewport');
	const remValueInPx = positiveNumber(preset.remValueInPx ?? 16, 'typeScale.remValueInPx');
	const scale = preset.scale ?? 'majorThird';
	const ratio = typeScaleRatios[scale];

	if (!ratio) throw new Error(`Unknown typeScale ratio "${String(scale)}".`);
	if (baseMaxPx < baseMinPx) {
		throw new Error('typeScale.baseMaxPx must be greater than or equal to typeScale.baseMinPx.');
	}
	if (maxViewport <= minViewport) {
		throw new Error('typeScale.maxViewport must be greater than typeScale.minViewport.');
	}

	const ramp = (basePx: number) => {
		const sizes = typeScaleSteps.map((_, index) => basePx * Math.pow(ratio, index - 2));
		// Raise the small steps to their legibility floor, working upwards from the
		// smallest so a floor can never push a step past the one above it.
		for (let index = smallStepFloorPx.length - 1; index >= 0; index--) {
			sizes[index] = Math.min(Math.max(sizes[index], smallStepFloorPx[index]), sizes[index + 1]);
		}
		return sizes;
	};
	const minSizes = ramp(baseMinPx);
	const maxSizes = ramp(baseMaxPx);

	return Object.fromEntries(
		typeScaleSteps.map((step, index) => {
			const minPx = minSizes[index];
			const maxPx = maxSizes[index];
			const slope = (maxPx - minPx) / (maxViewport - minViewport);
			const intercept = minPx - slope * minViewport;
			const value = `clamp(${round(minPx / remValueInPx)}rem, ${round(slope * 100)}vw + ${round(intercept / remValueInPx)}rem, ${round(maxPx / remValueInPx)}rem)`;
			return [`--text-${step}`, value];
		})
	);
};

// Elevation: a shadow stack per level plus a tonal tint (Material-style) that lifts
// surfaces in dark mode, where shadows alone read as nothing.
const shadowStacks: Record<ElevationLevel, [y: number, blur: number, alpha: number][]> = {
	0: [],
	1: [[1, 2, 0.06]],
	2: [
		[1, 3, 0.08],
		[1, 2, 0.06]
	],
	3: [
		[4, 6, 0.08],
		[2, 4, 0.06]
	],
	4: [
		[10, 15, 0.1],
		[4, 6, 0.06]
	],
	5: [
		[20, 25, 0.12],
		[8, 10, 0.08]
	]
};

const elevationFactors: Record<ThemeElevation, { alpha: number; blur: number }> = {
	flat: { alpha: 0, blur: 1 },
	normal: { alpha: 1, blur: 1 },
	high: { alpha: 1.5, blur: 1.3 }
};

const tintAlpha: Record<ElevationLevel, number> = {
	0: 0,
	1: 0.03,
	2: 0.05,
	3: 0.07,
	4: 0.09,
	5: 0.11
};

/** An empty stack still has to be a shadow value — `none` cannot sit in a shadow list. */
const EMPTY_SHADOW = '0 0 #0000';

const elevationFactor = (elevation: ThemeElevation) => {
	const factors = elevationFactors[elevation];
	if (!factors) throw new Error(`Unknown elevation preset "${String(elevation)}".`);
	return factors;
};

const shadowStack = (level: ElevationLevel, elevation: ThemeElevation, dark: boolean) => {
	const { alpha, blur } = elevationFactor(elevation);
	const stack = shadowStacks[level];
	if (stack.length === 0 || alpha === 0) return EMPTY_SHADOW;
	return stack
		.map(([y, b, a]) => {
			const strength = Math.min(1, a * alpha * (dark ? 1.8 : 1));
			return `0 ${y}px ${Math.round(b * blur)}px rgb(0 0 0 / ${round(strength)})`;
		})
		.join(', ');
};

/**
 * `--elevation-N` shadows and `--elevation-tint-N` overlays for one colour scheme.
 *
 * The tint is a plain `rgb()` with an alpha channel rather than a `color-mix()` of the
 * theme neutral: Tailwind rewrites `color-mix()` into an unguarded fallback that drops
 * the percentage, which would paint every dark raised surface fully opaque on engines
 * without `color-mix` support.
 */
export const elevationVariables = (elevation: ThemeElevation, scheme: 'light' | 'dark') => {
	const { alpha, blur } = elevationFactor(elevation);
	// How far the largest shadow on this scale reaches past its box: sideways by its blur, and
	// downwards by its offset plus blur. Scroll and clip containers (Carousel, Stepper) pay this
	// as a bleed allowance so content flush with their edge is never cropped.
	const layers = elevationLevels.flatMap((level) => shadowStacks[level]);
	// Floored: the outermost blur pixel is fully transparent, and a gutter of the same size as the
	// bleed must not scroll by one pixel.
	const bleedX = alpha === 0 ? 0 : Math.max(...layers.map(([, b]) => Math.floor(b * blur)));
	const bleedY = alpha === 0 ? 0 : Math.max(...layers.map(([y, b]) => y + Math.round(b * blur)));
	return {
		...Object.fromEntries(
			elevationLevels.flatMap((level) => [
				[`--elevation-${level}`, shadowStack(level, elevation, scheme === 'dark')],
				[
					`--elevation-tint-${level}`,
					scheme === 'dark' && tintAlpha[level] > 0 && elevation !== 'flat'
						? `rgb(255 255 255 / ${tintAlpha[level]})`
						: 'transparent'
				]
			])
		),
		'--elevation-bleed-x': `${bleedX}px`,
		'--elevation-bleed-y': `${bleedY}px`
	};
};

/** Scale options a `@plugin` block can pass to bootstrap the engine. */
export type EngineOptions = {
	radius?: ThemeRadius;
	spacing?: ThemeSpacing;
	typeScale?: TypeScalePreset | TypeScaleOptions;
	elevation?: ThemeElevation;
	motion?: DeepPartial<MotionTokens>;
};

// --- MOTION ---------------------------------------------------------------------
// Durations in ms and easing roles named after `easingFunctions`. The runtime side
// (`ThemeState.motion`, the `motion()` presets) resolves the same tokens the CSS
// variables below carry, so a `duration-fast` class and an FSO transition agree.

/** Duration steps, in milliseconds. */
export type MotionDurationTokens = {
	instant: number;
	fast: number;
	normal: number;
	slow: number;
	slower: number;
};

/** Easing roles, each an easing name from `$lib/transitions/easingFunctions`. */
export type MotionEasingTokens = {
	standard: Easing;
	enter: Easing;
	exit: Easing;
	emphasized: Easing;
};

/** The global motion scale: duration steps plus easing roles. */
export type MotionTokens = {
	duration: MotionDurationTokens;
	easing: MotionEasingTokens;
};

export type MotionDurationToken = keyof MotionDurationTokens;
export type MotionEasingToken = keyof MotionEasingTokens;

/** Recursive `Partial`, so a caller can retune a single token without restating a scale. */
export type DeepPartial<T> = T extends readonly unknown[] | ((...args: never[]) => unknown)
	? T
	: T extends object
		? { [K in keyof T]?: DeepPartial<T[K]> }
		: T;

export const motionDurationSteps = [
	'instant',
	'fast',
	'normal',
	'slow',
	'slower'
] as const satisfies readonly MotionDurationToken[];

export const motionEasingRoles = [
	'standard',
	'enter',
	'exit',
	'emphasized'
] as const satisfies readonly MotionEasingToken[];

export const defaultMotionTokens = {
	duration: { instant: 0, fast: 100, normal: 200, slow: 300, slower: 500 },
	easing: { standard: 'cubicInOut', enter: 'cubicOut', exit: 'cubicIn', emphasized: 'backOut' }
} as const satisfies MotionTokens;

const easingName = (value: string, name: string): Easing => {
	if (!(value in easingBezierStrings)) throw new Error(`Unknown ${name} easing "${value}".`);
	return value as Easing;
};

/** Fills a partial motion scale with the defaults, validating every token it names. */
export const resolveMotionTokens = (motion?: DeepPartial<MotionTokens>): MotionTokens => {
	const duration = { ...defaultMotionTokens.duration } as MotionDurationTokens;
	const easing = { ...defaultMotionTokens.easing } as MotionEasingTokens;
	for (const step of motionDurationSteps) {
		const value = motion?.duration?.[step];
		if (value !== undefined) duration[step] = finiteNumber(value, `motion.duration.${step}`);
	}
	for (const role of motionEasingRoles) {
		const value = motion?.easing?.[role];
		if (value !== undefined) easing[role] = easingName(value, `motion.easing.${role}`);
	}
	return { duration, easing };
};

/**
 * Attribute `Theme` mirrors onto `<html>` while motion should be reduced. It lives here
 * because both the Tailwind plugin (which zeroes the `--duration-*` scale under it) and
 * the runtime `Theme` need it; `$lib/utils/motion.svelte` re-exports it for components.
 */
export const REDUCED_MOTION_ATTRIBUTE = 'data-entasis-reduce-motion';

/**
 * Layers one partial motion scale over another, per token. Keeps the CSS variables and
 * the JS scale reading the same numbers when `<Theme motion>` and a per-theme
 * `designTokens.motion` block are both present.
 */
export const mergeMotionTokens = (
	base?: DeepPartial<MotionTokens>,
	override?: DeepPartial<MotionTokens>
): DeepPartial<MotionTokens> | undefined => {
	if (!base) return override;
	if (!override) return base;
	return {
		duration: { ...base.duration, ...override.duration },
		easing: { ...base.easing, ...override.easing }
	};
};

/**
 * `--duration-*` / `--ease-*` declarations for a (possibly partial) motion scale.
 * Shared by the Tailwind motion engine and the runtime `Theme designTokens` compiler.
 */
export const motionVariables = (motion?: DeepPartial<MotionTokens>) => {
	const tokens = resolveMotionTokens(motion);
	return {
		...Object.fromEntries(
			motionDurationSteps.map((step) => [`--duration-${step}`, `${tokens.duration[step]}ms`])
		),
		...Object.fromEntries(
			motionEasingRoles.map((role) => [`--ease-${role}`, easingBezierStrings[tokens.easing[role]]])
		)
	} as Record<string, string>;
};
