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
	getContext<{ componentThemes?: Record<string, ThemeSource> } | null | undefined>('sveltaiTheme')
		?.componentThemes?.[component];

/**
 * Resolves a component's class slots through the same ladder `useComponentMotion` walks,
 * lowest first: the component's own theme, the `<Theme components>` registry, a
 * `set<Component>Theme` subtree, then the instance `theme` prop. Each rung layers on the
 * one below it — a subtree that restyles one slot must not drop the registry's others.
 */
export const useComponentTheme = <T extends ComponentTheme>(
	component: string,
	defaultTheme: T
): ((theme?: InferComponentTheme<T>) => T) => {
	return (rawTheme?: InferComponentTheme<T>) => {
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
