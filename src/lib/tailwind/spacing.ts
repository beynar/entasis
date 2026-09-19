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
	'--layout-space-xl': 'calc(var(--spacing) * 12)'
} as const;

const spacingValues = {
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
	matchUtilities(marginUtilities, { values: spacingValues, supportsNegativeValues: true });
	matchUtilities(insetUtilities, { values: spacingValues });
};
