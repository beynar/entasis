type RuntimeColorPalette = {
	label: string;
	primary: string;
	secondary: string;
	contrast: string;
};

export const runtimeColorPaletteNames = [
	'default',
	'graphite',
	'violet',
	'indigo',
	'emerald',
	'amber',
	'cyan',
	'rose',
	'plum'
] as const;

export type RuntimeColorPaletteName = (typeof runtimeColorPaletteNames)[number];

export const runtimeColorPalettes = {
	default: {
		label: 'Engine default',
		primary: 'var(--color-primary)',
		secondary: 'var(--color-secondary)',
		contrast: 'var(--color-primary-contrast)'
	},
	graphite: {
		label: 'Graphite',
		primary: 'light-dark(#475569, #94a3b8)',
		secondary: 'light-dark(#64748b, #cbd5e1)',
		contrast: 'light-dark(#ffffff, #0f172a)'
	},
	violet: {
		label: 'Violet',
		primary: 'light-dark(#7c3aed, #a78bfa)',
		secondary: 'light-dark(#9333ea, #c084fc)',
		contrast: 'light-dark(#ffffff, #2e1065)'
	},
	indigo: {
		label: 'Indigo',
		primary: 'light-dark(#4f46e5, #818cf8)',
		secondary: 'light-dark(#2563eb, #60a5fa)',
		contrast: 'light-dark(#ffffff, #1e1b4b)'
	},
	emerald: {
		label: 'Emerald',
		primary: 'light-dark(#059669, #34d399)',
		secondary: 'light-dark(#0d9488, #2dd4bf)',
		contrast: 'light-dark(#ffffff, #022c22)'
	},
	amber: {
		label: 'Amber',
		primary: 'light-dark(#d97706, #fbbf24)',
		secondary: 'light-dark(#ea580c, #fb923c)',
		contrast: '#111827'
	},
	cyan: {
		label: 'Cyan',
		primary: 'light-dark(#0891b2, #22d3ee)',
		secondary: 'light-dark(#2563eb, #60a5fa)',
		contrast: 'light-dark(#ffffff, #083344)'
	},
	rose: {
		label: 'Rose',
		primary: 'light-dark(#e11d48, #fb7185)',
		secondary: 'light-dark(#db2777, #f472b6)',
		contrast: 'light-dark(#ffffff, #4c0519)'
	},
	plum: {
		label: 'Plum',
		primary: 'light-dark(#9333ea, #d946ef)',
		secondary: 'light-dark(#c026d3, #e879f9)',
		contrast: 'light-dark(#ffffff, #3b0764)'
	}
} as const satisfies Record<RuntimeColorPaletteName, RuntimeColorPalette>;

const semanticColorVariables = (
	name: 'primary' | 'secondary',
	color: string,
	contrast: string
) => ({
	[`--color-${name}`]: color,
	[`--color-${name}-light`]: `color-mix(in oklab, ${color} 82%, white)`,
	[`--color-${name}-lighter`]: `color-mix(in oklab, ${color} 65%, white)`,
	[`--color-${name}-dark`]: `color-mix(in oklab, ${color} 78%, black)`,
	[`--color-${name}-muted`]: `color-mix(in oklab, ${color} 18%, var(--color-surface))`,
	[`--color-${name}-contrast`]: contrast,
	[`--color-${name}-readable`]: `color-mix(in oklab, ${color} 68%, light-dark(black, white))`,
	[`--color-${name}-muted-readable`]: `color-mix(in oklab, ${color} 50%, light-dark(black, white))`
});

/** CSS custom properties a palette overrides; empty for the engine default (no overrides). */
export const runtimeColorPaletteVariables = (
	paletteName: RuntimeColorPaletteName
): Record<string, string> => {
	if (paletteName === 'default') return {};
	const palette = runtimeColorPalettes[paletteName];
	return {
		...semanticColorVariables('primary', palette.primary, palette.contrast),
		...semanticColorVariables('secondary', palette.secondary, palette.contrast)
	};
};

export const runtimeColorPaletteStyle = (paletteName: RuntimeColorPaletteName) =>
	Object.entries(runtimeColorPaletteVariables(paletteName))
		.map(([property, value]) => `${property}:${value}`)
		.join(';');
