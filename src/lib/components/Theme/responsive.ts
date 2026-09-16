import type { Breakpoint, ResponsiveProps } from './theme.js';

/**
 * The breakpoint ladder, narrowest first. `xs` is the floor and has no threshold: it is whatever
 * is left below `sm`.
 */
export const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'] as const satisfies readonly Breakpoint[];

/** Every breakpoint that has a width threshold — the ladder without its `xs` floor. */
export type ContainerBreakpoint = Exclude<Breakpoint, 'xs'>;

/**
 * The ONE container breakpoint table. Grid, Stack and Carousel all reflow on these widths, so
 * `sm` means the same box width in every component instead of each one inventing its own steps.
 *
 * These are CONTAINER widths, not viewport widths: the component measures the width it was
 * actually handed, so a grid in a 400px sidebar of a 1600px page is `xs` and the same grid run
 * full-bleed is `xl`. The names are kept from the viewport era so `columns={{ sm: 2 }}` keeps
 * reading the way people expect — they now mean "the component is at least this wide".
 *
 * Chosen once, by intent, for a generic host-sized block: each step is the width at which one
 * more ~17-18rem content column fits next to the ones already there, gaps included.
 *   xs  base          — a phone column, a narrow sidebar: one column.
 *   sm  36rem / 576px — two ~17rem columns fit.
 *   md  42rem / 672px — two roomier ~20rem columns, the classic two-pane content width.
 *   lg  56rem / 896px — three ~17rem columns fit.
 *   xl  72rem / 1152px — four ~17rem columns fit.
 * They are also exactly the thresholds the Carousel shipped with, so its slides-per-view lands on
 * the same comfortable slide widths as before this table was shared.
 *
 * A Svelte `<style>` block and a Tailwind class string cannot import a value, so the components
 * hand-write these widths as `@min-[36rem]:` container variants. `responsiveContainerClasses`
 * builds the exact literal they must contain, and each component's test asserts its theme string
 * still equals it — editing a width here fails those tests until the literals follow.
 */
export const containerBreakpoints: Record<ContainerBreakpoint, string> = {
	sm: '36rem',
	md: '42rem',
	lg: '56rem',
	xl: '72rem'
};

/**
 * `rem` in a container query resolves against the DOCUMENT ROOT font size, not the container's
 * own font size, so the JS side has to read the same number. Falls back to the CSS initial 16px
 * off the browser (SSR, jsdom without layout).
 */
const rootFontSize = () => {
	if (typeof document === 'undefined') return 16;
	const parsed = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 16;
};

/**
 * Named breakpoint for a container of `width` CSS pixels, matching the `@min-[…]` container
 * queries built from `containerBreakpoints`. Only components that need the active step in JS
 * (Carousel: dot count and `next()`/`prev()` step size) should call this — a component that only
 * needs to STYLE per breakpoint writes `responsiveVariables` + `responsiveContainerClasses` and
 * stays correct on first paint with no measurement at all.
 */
export const resolveContainerBreakpoint = (
	width: number,
	remInPx: number = rootFontSize()
): Breakpoint => {
	for (let index = breakpoints.length - 1; index > 0; index--) {
		const breakpoint = breakpoints[index] as ContainerBreakpoint;
		if (width >= Number.parseFloat(containerBreakpoints[breakpoint]) * remInPx) return breakpoint;
	}
	return 'xs';
};

/**
 * Whether a value is the `Partial<Record<Breakpoint, T>>` form rather than a `T` that happens to
 * be an object. An object is read as the record form only when EVERY own key is a breakpoint
 * name, so `{ in, out }` transitions and `{ minWidth, max }` column configs stay values. The
 * empty object has no key that disagrees, so it reads as an empty record and resolves to the
 * fallback.
 */
const isBreakpointRecord = <T>(
	props: ResponsiveProps<T>
): props is Partial<Record<Breakpoint, T>> =>
	typeof props === 'object' &&
	props !== null &&
	!Array.isArray(props) &&
	Object.keys(props).every((key) => (breakpoints as readonly string[]).includes(key));

/**
 * Resolve a responsive prop at `breakpoint`. Pure — it takes the breakpoint instead of reading
 * one, so the same call works on the server, in a container-measuring component and in a test.
 *
 * Both forms of `ResponsiveProps<T>`:
 * - a plain `T` — used at every breakpoint.
 * - `Partial<Record<Breakpoint, T>>` — the nearest DEFINED key at or below `breakpoint` wins, so
 *   a value set at `md` holds at `lg` and `xl` until a wider key overrides it, exactly like the
 *   `min-width` queries the same object feeds. If no key at or below is defined, `fallback`.
 *
 * `undefined` and `null` resolve to `fallback`; every other value is kept, so `false`, `0` and
 * `''` are real values and do not fall through.
 */
export const resolveResponsive = <T>(
	props: ResponsiveProps<T> | undefined | null,
	breakpoint: Breakpoint,
	fallback: T
): T => {
	if (props === undefined || props === null) return fallback;
	if (!isBreakpointRecord(props)) return props as T;
	for (let index = breakpoints.indexOf(breakpoint); index >= 0; index--) {
		const value = props[breakpoints[index]];
		if (value !== undefined) return value;
	}
	return fallback;
};

/**
 * The five `--<name>-xs … --<name>-xl` custom properties for a responsive prop, with the cascade
 * already flattened: every breakpoint carries its own effective value, so the CSS rule for a step
 * reads one property and never has to fall back through the others.
 *
 * This is the half of the container story that runs on the SERVER. The component resolves the
 * prop for all five breakpoints while rendering, writes these properties onto its layout element,
 * and static `@min-[…]` rules (see `responsiveContainerClasses`) pick the one matching the width
 * the host actually gave it — so first paint and SSR are correct with zero JS and no measurement.
 *
 * `name` is written without the leading `--`; a leading `--` is accepted and stripped. `toCss`
 * turns a resolved value into the CSS text (default `String`), and receives the breakpoint for
 * values whose CSS depends on it.
 */
export const responsiveVariables = <T>(
	name: string,
	props: ResponsiveProps<T> | undefined | null,
	fallback: T,
	toCss: (value: T, breakpoint: Breakpoint) => string | number = String
): Record<string, string> => {
	const base = name.replace(/^--/, '');
	const variables: Record<string, string> = {};
	for (const breakpoint of breakpoints)
		variables[`--${base}-${breakpoint}`] = String(
			toCss(resolveResponsive(props, breakpoint, fallback), breakpoint)
		);
	return variables;
};

/**
 * The static class chain that reads those custom properties: `property: var(--<name>-xs)` at the
 * base, re-declared under each `@min-[…]` container variant from `containerBreakpoints`.
 *
 * Tailwind finds candidates by scanning source text, so a class built at RUNTIME is never
 * generated. This helper therefore exists to be compared against, not concatenated into markup:
 * each component hand-writes the literal chain in its `.theme.ts` and asserts in its test that
 * the literal still equals `responsiveContainerClasses(name, property)`. Changing a width in
 * `containerBreakpoints` then fails those tests until the literals follow.
 *
 * The element carrying these classes must be INSIDE the `@container` root, never the root
 * itself — a container query cannot style its own container. Pass `container` when that root is a
 * NAMED container (`@container/carousel`) so each variant queries it by name instead of the
 * nearest one, which would be whatever ancestor a consumer happened to wrap it in.
 */
export const responsiveContainerClasses = (
	name: string,
	property: string,
	container?: string
): string => {
	const base = name.replace(/^--/, '');
	const scope = container ? `/${container}` : '';
	const declaration = (breakpoint: Breakpoint) => `[${property}:var(--${base}-${breakpoint})]`;
	return [
		declaration('xs'),
		...(Object.keys(containerBreakpoints) as ContainerBreakpoint[]).map(
			(breakpoint) =>
				`@min-[${containerBreakpoints[breakpoint]}]${scope}:${declaration(breakpoint)}`
		)
	].join(' ');
};
