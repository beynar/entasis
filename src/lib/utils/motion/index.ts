/**
 * Motion presets, the `cva` of transitions.
 *
 * `motion()` is to a component's `{ in, out }` transition what `cva()` is to its
 * classes: a base spec, optional variants, and a resolver that merges them. The
 * spec's `duration` / `easing` are *tokens* (`normal`, `enter`, ...) resolved against
 * the Theme's motion scale at call time, so a `<Theme motion>` retune reaches every
 * component and a reduced-motion preference collapses every duration to 0.
 *
 * A component keeps its preset in its `xxx.theme.ts` under a `motion` slot, which
 * makes the `theme` prop cover motion as well as classes — see `useComponentMotion`
 * for the override ladder.
 */

import { useTheme } from '$lib/components/Theme/theme.state.svelte.js';
import type { ResponsiveProps } from '$lib/components/Theme/theme.js';
import { resolveResponsive } from '$lib/components/Theme/responsive.js';
import { resolveMotionTokens, type DeepPartial, type MotionTokens } from '$lib/tailwind/scales.js';
import type { Easing } from '$lib/transitions/easingFunctions.js';
import type { FSOParams, FSOProps } from '$lib/transitions/transition.js';
import { getContext } from 'svelte';

export type { DeepPartial, MotionTokens };
export type { MotionDurationToken, MotionEasingToken } from '$lib/tailwind/scales.js';
export { defaultMotionTokens, resolveMotionTokens } from '$lib/tailwind/scales.js';

/** One component's motion: the two directions plus the tokens they resolve against. */
export type MotionSpec = {
	in: FSOParams;
	out: FSOParams;
	/** Duration token name, or an explicit value in ms. Defaults to `normal`. */
	duration?: keyof MotionTokens['duration'] | number;
	/** Easing role name, or an easing function name. Defaults to the `standard` role. */
	easing?: keyof MotionTokens['easing'] | Easing;
};

/** A resolved preset: FSO params whose `duration` is in ms and `easing` is a function name. */
export type ResolvedMotion = { in: FSOParams; out: FSOParams };

/** What the resolver needs from a Theme. `ThemeState` satisfies it. */
export type MotionTheme = {
	/** The resolved global motion scale. */
	motion: MotionTokens;
	/** When true every resolved duration is 0. */
	preferReducesMotion: boolean;
};

export type MotionVariantShape = Record<string, Record<string, DeepPartial<MotionSpec>>>;
export type MotionVariantSchema<V extends MotionVariantShape> = {
	[Variant in keyof V]?: keyof V[Variant] | undefined;
};

export type MotionConfig<V extends MotionVariantShape> = {
	base: MotionSpec;
	variants?: V;
	defaultVariants?: MotionVariantSchema<V>;
};

export type MotionOverride = DeepPartial<MotionSpec> | undefined | null;

export type MotionResolveOptions = {
	/** Theme whose tokens resolve `duration` / `easing`; defaults to the library scale. */
	theme?: MotionTheme;
	/** Partial specs deep-merged after base + variants, lowest priority first. */
	overrides?: MotionOverride | readonly MotionOverride[];
	/**
	 * An instance transition prop, already resolved for the current breakpoint. A side
	 * it names replaces the merged one; the flat form replaces both directions (the
	 * behaviour `ThemeState.splitTransition` has).
	 */
	transition?: FSOProps;
};

export type MotionResolver<V extends MotionVariantShape = MotionVariantShape> = (
	props?: MotionVariantSchema<V>,
	options?: MotionResolveOptions
) => ResolvedMotion;

/** Structural match for any `motion()` resolver, used to type the `motion` theme slot. */
export type AnyMotionResolver = (...args: never[]) => ResolvedMotion;

const fallbackTokens = resolveMotionTokens();
const fallbackTheme: MotionTheme = { motion: fallbackTokens, preferReducesMotion: false };

type Dictionary = Record<string, unknown>;

const isDictionary = (value: unknown): value is Dictionary =>
	!!value && typeof value === 'object' && !Array.isArray(value);

/** Deep-merges `source` into `target` in place, skipping `undefined` leaves. */
const mergeInto = (target: Dictionary, source?: unknown): Dictionary => {
	if (!isDictionary(source)) return target;
	for (const key in source) {
		const value = source[key];
		if (value === undefined) continue;
		if (isDictionary(value)) {
			const existing = target[key];
			target[key] = mergeInto(isDictionary(existing) ? { ...existing } : {}, value);
		} else {
			target[key] = value;
		}
	}
	return target;
};

const durationInMs = (duration: MotionSpec['duration'], tokens: MotionTokens) =>
	typeof duration === 'number' ? duration : tokens.duration[duration ?? 'normal'];

const easingName = (easing: MotionSpec['easing'], tokens: MotionTokens): Easing => {
	if (easing === undefined) return tokens.easing.standard;
	// Role names and easing-function names are disjoint sets, so membership decides.
	return easing in tokens.easing
		? tokens.easing[easing as keyof MotionTokens['easing']]
		: (easing as Easing);
};

// A side the instance `transition` prop names replaces the merged one; the flat form
// (neither `in` nor `out`) replaces both, matching `ThemeState.splitTransition`.
const transitionSide = (transition: FSOProps | undefined, direction: 'in' | 'out') => {
	if (!transition) return undefined;
	if ('in' in transition || 'out' in transition)
		return (transition as { in?: FSOParams; out?: FSOParams })[direction];
	return transition as FSOParams;
};

const resolveSide = (params: FSOParams, spec: MotionSpec, theme: MotionTheme): FSOParams => ({
	...params,
	duration: theme.preferReducesMotion
		? 0
		: (params.duration ?? durationInMs(spec.duration, theme.motion)),
	easing: params.easing ?? easingName(spec.easing, theme.motion)
});

/**
 * Builds a motion preset resolver. Calling it with variant props deep-merges
 * `base` + the matched variants (+ any `options.overrides`) and returns
 * `{ in, out }` with `duration` in ms and `easing` as an easing-function name.
 */
export const motion = <const V extends MotionVariantShape>(
	config: MotionConfig<V>
): MotionResolver<V> => {
	return (props, options) => {
		const theme = options?.theme ?? fallbackTheme;
		const spec = mergeInto({}, config.base) as MotionSpec;
		if (config.variants) {
			for (const variant in config.variants) {
				const selected = props?.[variant] ?? config.defaultVariants?.[variant];
				if (selected === undefined) continue;
				mergeInto(spec, config.variants[variant][selected as string]);
			}
		}
		const overrides = options?.overrides;
		for (const override of Array.isArray(overrides) ? overrides : [overrides]) {
			mergeInto(spec, override);
		}
		return {
			in: resolveSide(transitionSide(options?.transition, 'in') ?? spec.in ?? {}, spec, theme),
			out: resolveSide(transitionSide(options?.transition, 'out') ?? spec.out ?? {}, spec, theme)
		};
	};
};

/** The per-instance overrides a component feeds its motion resolver. */
export type ComponentMotionOverrides = {
	/** The instance `theme.motion` slot. */
	motion?: DeepPartial<MotionSpec>;
	/** The instance shorthand prop (`transition`); responsive values are resolved here. */
	transition?: ResponsiveProps<FSOProps>;
};

export type ComponentMotion<V extends MotionVariantShape = MotionVariantShape> = (
	props?: MotionVariantSchema<V>,
	overrides?: ComponentMotionOverrides
) => ResolvedMotion;

/**
 * The motion twin of `useComponentTheme`. Call it once while a component (or its state
 * class) initialises; the returned resolver applies the override ladder, lowest first:
 *
 * 1. `defaultMotion` — the component's own preset from its `xxx.theme.ts` `motion` slot
 * 2. `<Theme components={{ <component>: { motion } }}>` — the central registry
 * 3. `set<Component>Theme({ motion })` — the surrounding subtree
 * 4. the instance `theme.motion` slot
 * 5. the instance shorthand prop (`transition`), resolved for the current breakpoint
 *
 * Tokens and the reduced-motion preference come from the surrounding `<Theme>`.
 */
export const useComponentMotion = <V extends MotionVariantShape>(
	component: string,
	defaultMotion: MotionResolver<V>
): ComponentMotion<V> => {
	const theme = useTheme() as
		| (MotionTheme & {
				componentThemes?: Record<string, { motion?: DeepPartial<MotionSpec> } | undefined>;
				resolveResponsiveProps: <T>(props?: ResponsiveProps<T>, defaultValue?: T) => T;
		  })
		| undefined;
	const context = getContext<{ motion?: DeepPartial<MotionSpec> } | undefined>(`${component}Theme`);
	return (props, overrides) => {
		const transition = overrides?.transition;
		return defaultMotion(props, {
			theme,
			overrides: [theme?.componentThemes?.[component]?.motion, context?.motion, overrides?.motion],
			// Outside a `<Theme>` there is no viewport breakpoint to read, so a responsive transition
			// resolves against `md` — the same breakpoint `ThemeState` reports during SSR.
			transition:
				transition === undefined
					? undefined
					: (theme?.resolveResponsiveProps(transition) ??
						resolveResponsive<FSOProps | undefined>(transition, 'md', undefined))
		});
	};
};
