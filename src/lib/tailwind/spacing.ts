import type { PluginAPI } from 'tailwindcss/plugin';

const spacingVariables = {
	'--space-micro': 'calc(var(--spacing) * 0.5)',
	'--space-xs': 'calc(var(--spacing) * 1)',
	'--space-sm': 'calc(var(--spacing) * 1.5)',
	'--space-md': 'calc(var(--spacing) * 2)',
	'--space-lg': 'calc(var(--spacing) * 3)',
	'--space-xl': 'calc(var(--spacing) * 4)',
	'--layout-space-sm': 'calc(var(--spacing) * 5)',
	'--layout-space-md': 'calc(var(--spacing) * 6)',
	'--layout-space-lg': 'calc(var(--spacing) * 8)',
	'--layout-space-xl': 'calc(var(--spacing) * 12)',
	// How far a drawer Dialog stands off the screen edge. A spacing step or `0px`, overridden by
	// `designTokens.drawerInset`; the drawer's edge corners round only when this is not zero.
	'--drawer-inset': 'var(--layout-space-md)'
} as const;

export const spacingValues = {
	micro: 'var(--space-micro)',
	xs: 'var(--space-xs)',
	sm: 'var(--space-sm)',
	md: 'var(--space-md)',
	lg: 'var(--space-lg)',
	xl: 'var(--space-xl)',
	'layout-sm': 'var(--layout-space-sm)',
	'layout-md': 'var(--layout-space-md)',
	'layout-lg': 'var(--layout-space-lg)',
	'layout-xl': 'var(--layout-space-xl)'
};

export type SpacingStep = keyof typeof spacingValues;

const gapUtilities = {
	gap: (value: string) => ({ gap: value }),
	'gap-x': (value: string) => ({ 'column-gap': value }),
	'gap-y': (value: string) => ({ 'row-gap': value })
};

// `p`, `px` and `py` also publish their gap to their children as `--pad-parent-x/-y`, the
// padding half of the cap `rounded-<step>-concentric` computes (see `radius.ts`).
// One-sided padding (`pt-*`, `ps-*`) is not the uniform gap a concentric corner is derived
// from, so it publishes nothing.
const paddingUtilities = {
	p: (value: string) => ({
		padding: value,
		'& > *': { '--pad-parent-x': value, '--pad-parent-y': value }
	}),
	px: (value: string) => ({ 'padding-inline': value, '& > *': { '--pad-parent-x': value } }),
	py: (value: string) => ({ 'padding-block': value, '& > *': { '--pad-parent-y': value } }),
	pt: (value: string) => ({ 'padding-top': value }),
	pr: (value: string) => ({ 'padding-right': value }),
	pb: (value: string) => ({ 'padding-bottom': value }),
	pl: (value: string) => ({ 'padding-left': value }),
	ps: (value: string) => ({ 'padding-inline-start': value }),
	pe: (value: string) => ({ 'padding-inline-end': value })
};

// `px-<step>-concentric` / `py-<step>-concentric`: the padding half of NESTED RADIUS (see
// `radius.ts`) read the other way. A flush bar's content sits in its container's corner, so its
// padding is the step, or half the container's corner radius when that is larger. A very round
// theme on a compact bar needs it: at `radius: 2.25` a 36px window corner sits over a 36px title
// bar, and `px-md` (8px) puts the title's first glyphs inside the curve. Capped at three steps,
// because a pill container publishes an infinite radius. It only departs from the plain step when
// the corner is more than twice the step. It publishes what it pads, like `px` / `py`.
const cornerClearance = (value: string) =>
	`max(${value}, min(calc(var(--radius-parent, 0px) / 2), calc(${value} * 3)))`;
const concentricPaddingValues = Object.fromEntries(
	Object.entries(spacingValues).map(([step, value]) => [
		`${step}-concentric`,
		cornerClearance(value)
	])
);
const concentricPaddingUtilities = {
	px: (value: string) => ({ 'padding-inline': value, '& > *': { '--pad-parent-x': value } }),
	py: (value: string) => ({ 'padding-block': value, '& > *': { '--pad-parent-y': value } })
};

const marginUtilities = {
	m: (value: string) => ({ margin: value }),
	mx: (value: string) => ({ 'margin-inline': value }),
	my: (value: string) => ({ 'margin-block': value }),
	mt: (value: string) => ({ 'margin-top': value }),
	mr: (value: string) => ({ 'margin-right': value }),
	mb: (value: string) => ({ 'margin-bottom': value }),
	ml: (value: string) => ({ 'margin-left': value }),
	ms: (value: string) => ({ 'margin-inline-start': value }),
	me: (value: string) => ({ 'margin-inline-end': value })
};

const insetUtilities = {
	top: (value: string) => ({ top: value }),
	right: (value: string) => ({ right: value }),
	bottom: (value: string) => ({ bottom: value }),
	left: (value: string) => ({ left: value })
};

export const applySpacingEngine = ({ addBase, matchUtilities }: PluginAPI) => {
	addBase({ html: spacingVariables });
	matchUtilities(gapUtilities, { values: spacingValues });
	matchUtilities(paddingUtilities, { values: spacingValues });
	matchUtilities(concentricPaddingUtilities, { values: concentricPaddingValues });
	matchUtilities(marginUtilities, { values: spacingValues, supportsNegativeValues: true });
	matchUtilities(insetUtilities, { values: spacingValues });
};
