import type { PluginAPI } from 'tailwindcss/plugin';
import { radiusSteps, radiusVariables, type ThemeRadius } from './scales.js';

/**
 * NESTED RADIUS, computed by the cascade instead of declared by hand.
 *
 * Two concentric rounded boxes only look concentric when the inner radius is the outer one
 * minus the gap between them, and the gap is the container's padding. Both halves of that
 * formula are already on the container as utilities, so the utilities publish them to the
 * container's children:
 *
 *   `rounded-lg`  → `:where(.rounded-lg) > * { --radius-parent: var(--radius-lg); --pad-parent-*: 0px }`
 *   `p-md`        → `.p-md > * { --pad-parent-x: var(--space-md); --pad-parent-y: … }`
 *
 * and a flush child reads them with `rounded-<step>-concentric` =
 * `min(radius-<step>, radius-parent − padding)`: its own step outside any rounded container,
 * and never more than the corner allows inside one — a child rounder than that cuts across the
 * parent's corner, a child less round than it merely reads as ordinary. An element only ever
 * writes onto its children and reads what was written onto it, so nothing reads and sets the
 * same property on one element and the cascade never cycles.
 *
 * Both variables inherit, because the flush child is rarely a direct child: a menu's rows sit
 * in a `role="menu"` wrapper inside the padded panel, a list's rows in a group. What must NOT
 * leak is the padding across a rounded boundary — a Button inside a padded Card is a new box,
 * and its children owe nothing to the Card's padding — so every rounded box resets
 * `--pad-parent-*` to zero for its children. The reset is written at zero specificity
 * (`:where(.rounded-lg) > *`) so the same box's own `p-md > *` publish wins regardless of the
 * order the two utilities are emitted in. Padding does not accumulate across two padded
 * wrappers (the nearer one wins outright): exact one level deep, which is every nesting in the
 * library.
 *
 * ponytail: a concentric container cannot publish its computed radius (the child rule would
 * read the value it sets, which is the cycle), so it publishes its nominal step like any other
 * rounded box — its children are capped by that step and slightly over-rounded at two levels.
 * Revisit when CSS `inherit()` ships.
 */
const publishedRadius: Record<string, string> = {
	...Object.fromEntries(Object.keys(radiusSteps).map((step) => [step, `var(--radius-${step})`])),
	full: 'calc(infinity * 1px)',
	none: '0px'
};
const resetPadding = { '--pad-parent-x': '0px', '--pad-parent-y': '0px' };

// Tailwind does not export `CssInJs`; the annotation is what keeps the empty arm of the publish
// below (an arbitrary radius has no step to pass on) from widening the return into a union the
// `matchUtilities` signature rejects.
type Publish = Record<string, string | Record<string, string>>;

const steps = Object.keys(radiusSteps);
// Outside any rounded container the parent radius is unbounded, so the step is the result;
// inside one, a negative difference is clamped to 0 by CSS, the concentric square corner.
const concentric = (step: string) =>
	`min(var(--radius-${step}), calc(var(--radius-parent, calc(infinity * 1px)) - max(var(--pad-parent-x, 0px), var(--pad-parent-y, 0px))))`;
const publish = (step: string) => ({
	':where(&) > *': { '--radius-parent': `var(--radius-${step})`, ...resetPadding }
});
const concentricValues = Object.fromEntries(steps.map((step) => [`${step}-concentric`, step]));

export const applyRadiusEngine = (
	{ addBase, matchUtilities }: PluginAPI,
	radius: ThemeRadius = 'normal'
) => {
	addBase({ html: radiusVariables(radius) });

	// Adds the publish next to core's own `.rounded-<step> { border-radius }` rule, which stays
	// as it is. `rounded-full` publishes infinity (a pill's flush children stay pills) and
	// `rounded-none` publishes 0, so both are rounded boundaries like any step. An arbitrary
	// value (`rounded-[3px]`) has no step to publish, so it emits nothing. The reading half,
	// `rounded-<step>-concentric`, is the same utility with a value suffix: it takes the clamped
	// corner and publishes its nominal step onward.
	matchUtilities(
		{
			rounded: (value: string): Publish => {
				if (value in concentricValues) {
					const step = concentricValues[value];
					return { 'border-radius': concentric(step), ...publish(step) };
				}
				return value in publishedRadius
					? { ':where(&) > *': { '--radius-parent': publishedRadius[value], ...resetPadding } }
					: {};
			}
		},
		{
			values: Object.fromEntries(
				[...Object.keys(publishedRadius), ...Object.keys(concentricValues)].map((v) => [v, v])
			)
		}
	);

	// A flush header or footer only rounds on its open edge.
	matchUtilities(
		{
			'rounded-t': (step: string): Publish => ({
				'border-top-left-radius': concentric(step),
				'border-top-right-radius': concentric(step),
				...publish(step)
			}),
			'rounded-b': (step: string): Publish => ({
				'border-bottom-left-radius': concentric(step),
				'border-bottom-right-radius': concentric(step),
				...publish(step)
			})
		},
		{ values: concentricValues }
	);
};
