import type { PluginAPI } from 'tailwindcss/plugin';
import {
	motionDurationSteps,
	motionEasingRoles,
	motionVariables,
	REDUCED_MOTION_ATTRIBUTE,
	type DeepPartial,
	type MotionTokens
} from './scales.js';

/** Motion options a `@plugin` block can pass to retune the build-time scale. */
export type MotionEngineOptions = { motion?: DeepPartial<MotionTokens> };

/**
 * Registers the motion layer: the `--duration-*` / `--ease-*` variables on `<html>`
 * and the named `duration-*` / `ease-*` utilities that read them. The variables are
 * the single source of truth, so a runtime `Theme designTokens.motion` block can
 * retune the same names per theme and every utility follows.
 */
export const applyMotionEngine = (api: PluginAPI, options?: MotionEngineOptions) => {
	api.addBase({ html: motionVariables(options?.motion) });
	// Reduced motion has to reach the CSS half of the scale too, or a `transition-transform
	// duration-normal` keeps animating while the Svelte transitions next to it resolve to 0.
	// Keyed off the attribute rather than the media query because `Theme` mirrors the
	// resolved preference there (pre-hydration, from a blocking script), so an explicit
	// `reduceMotion={false}` still wins over the OS setting — the rule Marquee already uses.
	// `0.01ms` instead of `0` keeps `transitionend` firing for the listeners that await it.
	// The attribute is doubled for specificity: `Theme`'s per-theme `designTokens.motion`
	// blocks are `html[data-theme="x"]` and are injected later in the document, so a single
	// attribute would tie on specificity and lose on source order.
	api.addBase({
		[`html[${REDUCED_MOTION_ATTRIBUTE}][${REDUCED_MOTION_ATTRIBUTE}]`]: Object.fromEntries(
			motionDurationSteps.map((step) => [`--duration-${step}`, '0.01ms'])
		)
	});
	// `--tw-duration` / `--tw-ease` are set alongside the longhand, exactly like core's
	// `duration-200` / `ease-out`, so composing with `transition-*` works whatever the
	// utility order is — `transition-colors` reads those variables.
	api.addUtilities({
		...Object.fromEntries(
			motionDurationSteps.map((step) => [
				`.duration-${step}`,
				{
					'--tw-duration': `var(--duration-${step})`,
					'transition-duration': `var(--duration-${step})`
				}
			])
		),
		...Object.fromEntries(
			motionEasingRoles.map((role) => [
				`.ease-${role}`,
				{
					'--tw-ease': `var(--ease-${role})`,
					'transition-timing-function': `var(--ease-${role})`
				}
			])
		)
	});
};
