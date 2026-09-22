import type { Colors } from '$lib/types/theme.js';
import { spacingValues, type SpacingStep } from '$lib/tailwind/spacing.js';
import {
	defaultThemeSpacingScale,
	elevationVariables,
	formatRem,
	mergeMotionTokens,
	motionVariables,
	presetFactor,
	radiusVariables,
	spacingFactors,
	spacingScaleVariables,
	typeScalePresets,
	typeScaleVariables,
	type DeepPartial,
	type MotionTokens,
	type ThemeElevation,
	type ThemeRadius,
	type ThemeSpacing,
	type ThemeSpacingScale,
	type ThemeSpacingStep,
	type TypeScaleOptions,
	type TypeScalePreset,
	type TypeScaleRatio
} from '$lib/tailwind/scales.js';

// The design scales live in `$lib/tailwind/scales` so the Tailwind plugin and this
// runtime compiler emit identical variables; they are re-exported here because the
// public `entasis/theme` entry point has always surfaced them from this module.
export { defaultThemeSpacingScale, typeScalePresets };
export type {
	MotionTokens,
	ThemeElevation,
	ThemeRadius,
	ThemeSpacing,
	ThemeSpacingScale,
	ThemeSpacingStep,
	TypeScaleOptions,
	TypeScalePreset,
	TypeScaleRatio
};

export const themeColorRoles = [
	'primary',
	'secondary',
	'danger',
	'success',
	'warning',
	'info',
	'neutral'
] as const satisfies readonly Colors[];

export type ThemeDesignTokens = {
	spacing?: ThemeSpacing;
	spacingScale?: Partial<ThemeSpacingScale>;
	radius?: ThemeRadius;
	typeScale?: TypeScalePreset | TypeScaleOptions;
	elevation?: ThemeElevation;
	/** Per-theme motion scale: `--duration-*` steps in ms and `--ease-*` roles. */
	motion?: DeepPartial<MotionTokens>;
	raisedWithBorder?: boolean;
	/** Semantic role kit chrome inherits when a control omits `color`. Defaults to `neutral`. */
	defaultColor?: Colors;
	/**
	 * State role — the focus ring. Pinned once here, every `ring-focus` in the library rings in
	 * this role instead of the control's own. Omit and each ring keeps following `--color`.
	 */
	focusColor?: Colors;
	/**
	 * State role — persistent highlight: the active sidebar row, the current menu option, a
	 * pressed toggle, a selected table row, the current pagination pill, a tabbar indicator.
	 * Emits the whole `--color-selected*` kit so soft and solid selections stay legible.
	 */
	selectedColor?: Colors;
	/** State role — the transient hover tint the `state-layer` paints. */
	hoverColor?: Colors;
	/** State role — the transient pressed tint; falls back to `hoverColor` when omitted. */
	pressedColor?: Colors;
	/**
	 * How far a drawer `Dialog` stands off the screen edge: a spacing step (`'md'`,
	 * `'layout-sm'`, …) or `'none'` for edge to edge. Defaults to `'layout-md'`. At `'none'` the
	 * drawer's edge corners square off and only the corners facing the page keep their radius.
	 * Writes `--drawer-inset`.
	 */
	drawerInset?: SpacingStep | 'none';
};

export type ThemeDesignTokenMap<T extends readonly string[] = readonly string[]> = Partial<
	Record<T[number], ThemeDesignTokens>
>;

type CompileThemeDesignTokensOptions<T extends readonly string[]> = {
	designTokens?: ThemeDesignTokenMap<T>;
	attribute: string;
	value?: Partial<Record<T[number], string>>;
	colorScheme?: Partial<Record<T[number], 'light' | 'dark' | 'normal'>>;
	/**
	 * The `<Theme motion>` scale. Emitted on `html` so the `duration-*` / `ease-*`
	 * utilities follow the prop the same way `ThemeState.motion` does, and layered under
	 * any per-theme `designTokens.motion` block.
	 */
	motion?: DeepPartial<MotionTokens>;
};

const themeNamePattern = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const dataAttributePattern = /^data-[A-Za-z_][A-Za-z0-9_-]*$/;

// Every colour-valued token resolves the same way: a role from the kit, or a throw naming the
// token that carried the unknown value.
const resolveColorRole = (token: string, color: Colors): Colors => {
	if (!(themeColorRoles as readonly string[]).includes(color)) {
		throw new Error(`Unknown ${token} "${String(color)}".`);
	}
	return color;
};

const resolveDefaultColor = (color?: Colors): Colors =>
	color === undefined ? 'neutral' : resolveColorRole('defaultColor', color);

const defaultColorVariables = (defaultColor: Colors) => ({
	'--color': `var(--color-${defaultColor})`,
	'--color-readable': `var(--color-${defaultColor}-readable)`,
	'--color-muted-readable': `var(--color-${defaultColor}-muted-readable)`,
	'--color-light': `var(--color-${defaultColor}-light)`,
	'--color-lighter': `var(--color-${defaultColor}-lighter)`,
	'--color-dark': `var(--color-${defaultColor}-dark)`,
	'--color-muted': `var(--color-${defaultColor}-muted)`,
	'--color-contrast': `var(--color-${defaultColor}-contrast)`,
	'--default-color': defaultColor
});

// The four STATE ROLES. None of these variables exists until a theme pins one, and every use
// site falls back to the current role — `ring-focus` to `--color`, `bg-selected-muted` to
// `--color` at `--state-selected-opacity`, the state layer to `currentColor` — so an unpinned theme renders exactly as
// before and `[data-color]` keeps re-pointing the states along with `--color`.
const focusColorVariables = (role: Colors) => ({ '--color-focus': `var(--color-${role})` });
// `selected` is the one state role that paints a surface, so it emits the whole kit: the fill
// and the three inks tuned for it. There is no `--color-selected-muted`: the soft fill is
// `bg-selected-muted`, which composites `--color-selected` at `--state-selected-opacity` so the
// same selection reads on `surface`, `surface-raised` and `surface-floating` alike. Pinning an
// opaque tint here would put the pinned theme straight back on the surface it was mixed over.
const selectedColorVariables = (role: Colors) => ({
	'--color-selected': `var(--color-${role})`,
	'--color-selected-contrast': `var(--color-${role}-contrast)`,
	'--color-selected-muted-readable': `var(--color-${role}-muted-readable)`,
	'--color-selected-readable': `var(--color-${role}-readable)`
});
const hoverColorVariables = (role: Colors) => ({ '--color-hover': `var(--color-${role})` });
const pressedColorVariables = (role: Colors) => ({ '--color-pressed': `var(--color-${role})` });

const tokenVariables = (
	tokens: ThemeDesignTokens,
	colorScheme: 'light' | 'dark' | 'normal',
	baseMotion?: DeepPartial<MotionTokens>
) => ({
	// Like every other token: omitted when the theme does not declare it, so a theme that
	// only tweaks, say, `radius` inherits the default role instead of resetting it.
	...(tokens.defaultColor === undefined
		? {}
		: defaultColorVariables(resolveDefaultColor(tokens.defaultColor))),
	...(tokens.focusColor === undefined
		? {}
		: focusColorVariables(resolveColorRole('focusColor', tokens.focusColor))),
	...(tokens.selectedColor === undefined
		? {}
		: selectedColorVariables(resolveColorRole('selectedColor', tokens.selectedColor))),
	...(tokens.hoverColor === undefined
		? {}
		: hoverColorVariables(resolveColorRole('hoverColor', tokens.hoverColor))),
	...(tokens.pressedColor === undefined
		? {}
		: pressedColorVariables(resolveColorRole('pressedColor', tokens.pressedColor))),
	...(tokens.spacing === undefined
		? {}
		: {
				'--spacing': formatRem(0.25 * presetFactor(tokens.spacing, spacingFactors, 'spacing'))
			}),
	...(tokens.spacingScale === undefined ? {} : spacingScaleVariables(tokens.spacingScale)),
	...(tokens.radius === undefined ? {} : radiusVariables(tokens.radius)),
	...(tokens.typeScale === undefined ? {} : typeScaleVariables(tokens.typeScale)),
	// Layered over the `<Theme motion>` prop so a theme that retunes one step keeps the
	// rest of the prop's scale instead of falling back to the library defaults.
	...(tokens.motion === undefined
		? {}
		: motionVariables(mergeMotionTokens(baseMotion, tokens.motion))),
	...(tokens.raisedWithBorder === undefined
		? {}
		: {
				'--raised-border': tokens.raisedWithBorder
					? '1px solid var(--current-border, var(--color-neutral-muted))'
					: '0 solid transparent'
			}),
	...(tokens.elevation === undefined
		? {}
		: elevationVariables(tokens.elevation, colorScheme === 'dark' ? 'dark' : 'light')),
	...(tokens.drawerInset === undefined
		? {}
		: { '--drawer-inset': drawerInsetValue(tokens.drawerInset) })
});

/** `--drawer-inset` for a step: the theme token and a Dialog's `inset` prop share it. */
export const drawerInsetValue = (step: SpacingStep | 'none') => {
	if (step === 'none') return '0px';
	const value = spacingValues[step];
	if (!value) throw new Error(`Unknown drawerInset "${step}".`);
	return value;
};

const validateThemeName = (themeName: string) => {
	if (!themeNamePattern.test(themeName)) {
		throw new Error(
			`Theme name "${themeName}" must start with a letter or underscore and contain only letters, numbers, underscores, or hyphens.`
		);
	}
};

const themeSelector = (attribute: string, themeName: string) => {
	validateThemeName(themeName);
	if (attribute === 'class') return `html.${themeName}`;
	if (!dataAttributePattern.test(attribute)) {
		throw new Error(`Theme attribute "${attribute}" must be "class" or a valid data-* attribute.`);
	}
	return `html[${attribute}="${themeName}"]`;
};

export const compileThemeDesignTokens = <T extends readonly string[]>({
	designTokens,
	attribute,
	value,
	colorScheme,
	motion
}: CompileThemeDesignTokensOptions<T>) => {
	// The `<Theme motion>` prop rewrites the scale on `html`; the per-theme blocks below
	// are more specific, so a theme that declares its own `motion` still wins.
	const baseMotion = motion
		? `html{${Object.entries(motionVariables(motion))
				.map(([property, propertyValue]) => `${property}:${propertyValue};`)
				.join('')}}`
		: '';
	if (!designTokens) return baseMotion;

	return [baseMotion]
		.concat(
			(Object.entries(designTokens) as [string, ThemeDesignTokens][]).map(([themeName, tokens]) => {
				const attributeValue = value?.[themeName as T[number]] ?? themeName;
				const selector = themeSelector(attribute, attributeValue);
				const scheme =
					colorScheme?.[themeName as T[number]] ??
					(themeName === 'light' || themeName === 'dark' ? themeName : 'normal');
				const declarations = Object.entries(tokenVariables(tokens, scheme, motion))
					.map(([property, propertyValue]) => `${property}:${propertyValue};`)
					.join('');
				return declarations ? `${selector}{${declarations}}` : '';
			})
		)
		.filter(Boolean)
		.join('\n');
};
