import { getContext, setContext } from 'svelte';
import { cva, cx } from './engine.js';
import type { ClassValue, VariantProps } from './types.js';
import type { AnyMotionResolver, DeepPartial, MotionSpec } from '$lib/utils/motion/index.js';

export type ComponentVariant<T extends (...args: never[]) => unknown> = VariantProps<T>;

type StringKey<T> = T extends infer S | undefined ? (S extends string ? S : never) : never;

type CustomTheme<T> = {
	[K in keyof T]: Partial<{
		[KK in StringKey<T[K]>]: string;
	}>;
} & {
	base?: string;
};

/**
 * A slot is either a `cva` part (classes) or a `motion()` preset. `motion` is a
 * reserved slot name: it carries the component's transition, not classes, so the
 * `theme` prop covers both.
 */
type ComponentTheme = {
	[K in string]: ReturnType<typeof cva> | AnyMotionResolver;
};

// Naked type parameter so the check distributes: a `ComponentTheme` whose slots are
// only known through the index signature hands us the `cva | motion` union.
type SlotTheme<Slot> = Slot extends AnyMotionResolver
	? DeepPartial<MotionSpec>
	: Slot extends ReturnType<typeof cva>
		? CustomTheme<VariantProps<Slot>> & { base?: string }
		: never;

export type InferComponentTheme<T extends ComponentTheme> = Partial<{
	[K in keyof T]: SlotTheme<T[K]>;
}> & {
	override?: boolean;
};

export const setComponentTheme =
	<T extends ComponentTheme>(component: string) =>
	(theme: InferComponentTheme<T>) => {
		setContext(`${component}Theme`, theme);
	};

type SlotOverride = Record<string, string | Record<string, string> | undefined>;

// An override contributes its `base` plus one class per variant value actually
// passed. Resolved lazily inside the final cx call — the merge engine caches the
// merged string, so there is nothing to precompute or memoise.
const pick = (o: SlotOverride | undefined, props: Record<string, unknown>) =>
	o && [
		o.base,
		Object.keys(props).map((key) => {
			const value = props[key];
			return value === undefined
				? undefined
				: (o[key] as Record<string, string> | undefined)?.[`${value}`];
		})
	];

type ThemeSource = (Record<string, SlotOverride> & { override?: boolean }) | null | undefined;

// `<Theme components>` is the registry every subtree inherits. Read through the Theme
// context key so this module stays free of Theme imports.
const registryTheme = (component: string) =>
	getContext<{ componentThemes?: Record<string, ThemeSource> } | null | undefined>('entasisTheme')
		?.componentThemes?.[component];

/** The resolver `useComponentTheme` returns: the theme's class slots, optionally pre-bound. */
export type UseComponentTheme<T extends ComponentTheme> = {
	/** With shared variant values: every class slot already carrying them (`slots.root()`). */
	(theme: InferComponentTheme<T> | undefined, shared: SharedThemeProps<T>): BoundTheme<T>;
	/** The resolved theme, one class function per slot. Last, so `ReturnType` reads this one. */
	(theme?: InferComponentTheme<T>): T;
};

/**
 * Resolves a component's class slots through the same ladder `useComponentMotion` walks,
 * lowest first: the component's own theme, the `<Theme components>` registry, a
 * `set<Component>Theme` subtree, then the instance `theme` prop. Each rung layers on the
 * one below it — a subtree that restyles one slot must not drop the registry's others.
 */
export const useComponentTheme = <T extends ComponentTheme>(
	component: string,
	defaultTheme: T
): UseComponentTheme<T> => {
	const resolve = (rawTheme?: InferComponentTheme<T>): T => {
		const ctx = getContext<ThemeSource>(`${component}Theme`);
		const registry = registryTheme(component);
		const { override: localOverride, ...local } = rawTheme ?? {};
		// `override` is read from whichever rung declares it first, top down, so the
		// registry can drop a component's own classes app-wide the way an instance can.
		const override = localOverride ?? ctx?.override ?? registry?.override ?? false;
		if (!ctx && !registry && !Object.keys(local).length) return defaultTheme;

		const theme = { ...defaultTheme } as Record<string, unknown>;
		let changed = false;
		for (const slot in defaultTheme) {
			// Motion is not a class slot; `useComponentMotion` resolves it from the same sources.
			if (slot === 'motion') continue;
			const registrySlot = registry?.[slot];
			const ctxSlot = ctx?.[slot];
			const localSlot = (local as Record<string, SlotOverride | undefined>)[slot];
			if (!registrySlot && !ctxSlot && !localSlot) continue;
			changed = true;
			const defaultSlot = defaultTheme[slot] as ReturnType<typeof cva>;
			theme[slot] = (props?: Record<string, unknown>) => {
				// Instance class/className must land after theme overrides.
				const { class: klass, className, ...variants } = props ?? {};
				return cx(
					override ? null : defaultSlot(variants),
					pick(registrySlot, variants),
					pick(ctxSlot, variants),
					pick(localSlot, variants),
					klass as ClassValue,
					className as ClassValue
				);
			};
		}
		return changed ? (theme as T) : defaultTheme;
	};
	return ((rawTheme?: InferComponentTheme<T>, shared?: SharedThemeProps<T>) =>
		shared ? bindTheme(resolve(rawTheme), shared) : resolve(rawTheme)) as UseComponentTheme<T>;
};

/**
 * One component's entry in the `<Theme components>` registry: the same object a
 * `set<Component>Theme` call takes — class slots plus the reserved `motion` slot.
 */
export type ComponentThemeOverride = {
	/**
	 * Drops the component's own classes instead of merging on top of them. Read from the
	 * highest rung that declares it: instance `theme`, then `set<Component>Theme`, then here.
	 */
	override?: boolean;
	/** Motion preset override for the component. */
	motion?: DeepPartial<MotionSpec>;
	/** Class overrides, one entry per theme slot. */
	[slot: string]: unknown;
};

/** App-wide component theme defaults, keyed by the component's theme context name. */
export type ComponentThemeRegistry = Record<string, ComponentThemeOverride>;

type SlotFn = (props?: Record<string, unknown>) => string;
type SlotProps<S> = S extends (props?: infer P) => string ? NonNullable<P> : never;
type KeysOfUnion<U> = U extends unknown ? keyof U : never;
type ValueIn<U, K> = U extends unknown ? (K extends keyof U ? U[K] : never) : never;
// The class slots of a theme — `motion` resolves a transition, not a string, and drops out.
type ClassSlots<T> = { [K in keyof T as T[K] extends (props?: never) => string ? K : never]: T[K] };
type AnySlotProps<T> = SlotProps<ClassSlots<T>[keyof ClassSlots<T>]>;

/** Every variant any class slot of the theme accepts, each valued as the union the slots take. */
export type SharedThemeProps<T extends ComponentTheme> = {
	[K in Exclude<KeysOfUnion<AnySlotProps<T>>, 'class' | 'className'>]?: ValueIn<AnySlotProps<T>, K>;
};

/** The theme's class slots, each already carrying the shared props. */
export type BoundTheme<T extends ComponentTheme> = {
	[K in keyof ClassSlots<T>]: (props?: SlotProps<ClassSlots<T>[K]>) => string;
};

/**
 * The primitive behind a `use{Component}Theme(theme, shared)` resolver's second argument.
 *
 * Binds a component's variant values to every class slot at once, so a template reads
 * `slots.root()` instead of threading the same props into each call. A slot can still add its
 * own on top — `slots.panel({ placement: 'static' })`, `slots.root({ className })` — and a
 * slot ignores any shared variant it does not declare, exactly as `cva` always has.
 *
 * Every slot now sees every prop, so a theme override keyed on a variant the component used
 * to pass only to its root (`prefix: { color: { primary } }`) reaches the slot it names.
 * Each slot still resolves and merges its own classes; what this removes is the threading.
 */
export const bindTheme = <T extends ComponentTheme>(
	theme: T,
	shared: SharedThemeProps<T>
): BoundTheme<T> => {
	const bound: Record<string, SlotFn> = {};
	for (const slot in theme) {
		if (slot === 'motion') continue;
		const resolve = theme[slot] as SlotFn;
		bound[slot] = (props) => resolve(props ? { ...shared, ...props } : shared);
	}
	return bound as BoundTheme<T>;
};
