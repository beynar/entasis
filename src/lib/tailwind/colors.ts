import {
	contrast,
	convertCSS,
	formatHex,
	darken,
	lighten,
	saturate,
	formatCSS,
	hex2oklch,
	oklch2hex,
	toGamut
} from 'colorizr';

/** Any CSS color (hex, rgb(), hsl(), named) as a 6-digit hex string. */
const toHex = (color: string) =>
	color.startsWith('#') ? formatHex(color) : convertCSS(color, 'hex');
/** WCAG contrast below `threshold` (3:1 for large/UI, 4.5:1 for body text). */
const hasBadContrast = (foreground: string, background: string, threshold = 3) =>
	contrast(foreground, background) < threshold;

const isHex = (color: string): color is `#${string}` => {
	if (!color) {
		return false;
	}
	return color.startsWith('#');
};
// Solid surfaces carry body-size text (buttons, badges), so the on-colour text must clear AA:
// white when it reaches 4.5:1, otherwise black (amber, lime, yellow).
const readableColorIsBlack = (color: string) => hasBadContrast(baseWhiteColor, color, 4.5);

export const tailwindColors = {
	slate: {
		'50': '#f8fafc',
		'100': '#f1f5f9',
		'200': '#e2e8f0',
		'300': '#cbd5e1',
		'400': '#94a3b8',
		'500': '#64748b',
		'600': '#475569',
		'700': '#334155',
		'800': '#1e293b',
		'900': '#0f172a',
		'950': '#020617'
	},
	gray: {
		'50': '#f9fafb',
		'100': '#f3f4f6',
		'200': '#e5e7eb',
		'300': '#d1d5db',
		'400': '#9ca3af',
		'500': '#6b7280',
		'600': '#4b5563',
		'700': '#374151',
		'800': '#1f2937',
		'900': '#111827',
		'950': '#030712'
	},
	zinc: {
		'50': '#fafafa',
		'100': '#f4f4f5',
		'200': '#e4e4e7',
		'300': '#d4d4d8',
		'400': '#a1a1aa',
		'500': '#71717a',
		'600': '#52525b',
		'700': '#3f3f46',
		'800': '#27272a',
		'900': '#18181b',
		'950': '#09090b'
	},
	neutral: {
		'50': '#fafafa',
		'100': '#f5f5f5',
		'200': '#e5e5e5',
		'300': '#d4d4d4',
		'400': '#a3a3a3',
		'500': '#737373',
		'600': '#525252',
		'700': '#404040',
		'800': '#262626',
		'900': '#171717',
		'950': '#0a0a0a'
	},
	stone: {
		'50': '#fafaf9',
		'100': '#f5f5f4',
		'200': '#e7e5e4',
		'300': '#d6d3d1',
		'400': '#a8a29e',
		'500': '#78716c',
		'600': '#57534e',
		'700': '#44403c',
		'800': '#292524',
		'900': '#1c1917',
		'950': '#0c0a09'
	},
	red: {
		'50': '#fef2f2',
		'100': '#fee2e2',
		'200': '#fecaca',
		'300': '#fca5a5',
		'400': '#f87171',
		'500': '#ef4444',
		'600': '#dc2626',
		'700': '#b91c1c',
		'800': '#991b1b',
		'900': '#7f1d1d',
		'950': '#450a0a'
	},
	orange: {
		'50': '#fff7ed',
		'100': '#ffedd5',
		'200': '#fed7aa',
		'300': '#fdba74',
		'400': '#fb923c',
		'500': '#f97316',
		'600': '#ea580c',
		'700': '#c2410c',
		'800': '#9a3412',
		'900': '#7c2d12',
		'950': '#431407'
	},
	amber: {
		'50': '#fffbeb',
		'100': '#fef3c7',
		'200': '#fde68a',
		'300': '#fcd34d',
		'400': '#fbbf24',
		'500': '#f59e0b',
		'600': '#d97706',
		'700': '#b45309',
		'800': '#92400e',
		'900': '#78350f',
		'950': '#451a03'
	},
	yellow: {
		'50': '#fefce8',
		'100': '#fef9c3',
		'200': '#fef08a',
		'300': '#fde047',
		'400': '#facc15',
		'500': '#eab308',
		'600': '#ca8a04',
		'700': '#a16207',
		'800': '#854d0e',
		'900': '#713f12',
		'950': '#422006'
	},
	lime: {
		'50': '#f7fee7',
		'100': '#ecfccb',
		'200': '#d9f99d',
		'300': '#bef264',
		'400': '#a3e635',
		'500': '#84cc16',
		'600': '#65a30d',
		'700': '#4d7c0f',
		'800': '#3f6212',
		'900': '#365314',
		'950': '#1a2e05'
	},
	green: {
		'50': '#f0fdf4',
		'100': '#dcfce7',
		'200': '#bbf7d0',
		'300': '#86efac',
		'400': '#4ade80',
		'500': '#22c55e',
		'600': '#16a34a',
		'700': '#15803d',
		'800': '#166534',
		'900': '#14532d',
		'950': '#052e16'
	},
	emerald: {
		'50': '#ecfdf5',
		'100': '#d1fae5',
		'200': '#a7f3d0',
		'300': '#6ee7b7',
		'400': '#34d399',
		'500': '#10b981',
		'600': '#059669',
		'700': '#047857',
		'800': '#065f46',
		'900': '#064e3b',
		'950': '#022c22'
	},
	teal: {
		'50': '#f0fdfa',
		'100': '#ccfbf1',
		'200': '#99f6e4',
		'300': '#5eead4',
		'400': '#2dd4bf',
		'500': '#14b8a6',
		'600': '#0d9488',
		'700': '#0f766e',
		'800': '#115e59',
		'900': '#134e4a',
		'950': '#042f2e'
	},
	cyan: {
		'50': '#ecfeff',
		'100': '#cffafe',
		'200': '#a5f3fc',
		'300': '#67e8f9',
		'400': '#22d3ee',
		'500': '#06b6d4',
		'600': '#0891b2',
		'700': '#0e7490',
		'800': '#155e75',
		'900': '#164e63',
		'950': '#083344'
	},
	sky: {
		'50': '#f0f9ff',
		'100': '#e0f2fe',
		'200': '#bae6fd',
		'300': '#7dd3fc',
		'400': '#38bdf8',
		'500': '#0ea5e9',
		'600': '#0284c7',
		'700': '#0369a1',
		'800': '#075985',
		'900': '#0c4a6e',
		'950': '#082f49'
	},
	blue: {
		'50': '#eff6ff',
		'100': '#dbeafe',
		'200': '#bfdbfe',
		'300': '#93c5fd',
		'400': '#60a5fa',
		'500': '#3b82f6',
		'600': '#2563eb',
		'700': '#1d4ed8',
		'800': '#1e40af',
		'900': '#1e3a8a',
		'950': '#172554'
	},
	indigo: {
		'50': '#eef2ff',
		'100': '#e0e7ff',
		'200': '#c7d2fe',
		'300': '#a5b4fc',
		'400': '#818cf8',
		'500': '#5f62ef',
		'600': '#4f46e5',
		'700': '#4338ca',
		'800': '#3730a3',
		'900': '#312e81',
		'950': '#1e1b4b'
	},
	violet: {
		'50': '#f5f3ff',
		'100': '#ede9fe',
		'200': '#ddd6fe',
		'300': '#c4b5fd',
		'400': '#a78bfa',
		'500': '#8b5cf6',
		'600': '#7c3aed',
		'700': '#6d28d9',
		'800': '#5b21b6',
		'900': '#4c1d95',
		'950': '#2e1065'
	},
	purple: {
		'50': '#faf5ff',
		'100': '#f3e8ff',
		'200': '#e9d5ff',
		'300': '#d8b4fe',
		'400': '#c084fc',
		'500': '#a855f7',
		'600': '#9333ea',
		'700': '#7e22ce',
		'800': '#6b21a8',
		'900': '#581c87',
		'950': '#3b0764'
	},
	fuchsia: {
		'50': '#fdf4ff',
		'100': '#fae8ff',
		'200': '#f5d0fe',
		'300': '#f0abfc',
		'400': '#e879f9',
		'500': '#d946ef',
		'600': '#c026d3',
		'700': '#a21caf',
		'800': '#86198f',
		'900': '#701a75',
		'950': '#4a044e'
	},
	pink: {
		'50': '#fdf2f8',
		'100': '#fce7f3',
		'200': '#fbcfe8',
		'300': '#f9a8d4',
		'400': '#f472b6',
		'500': '#ec4899',
		'600': '#db2777',
		'700': '#be185d',
		'800': '#9d174d',
		'900': '#831843',
		'950': '#500724'
	},
	rose: {
		'50': '#fff1f2',
		'100': '#ffe4e6',
		'200': '#fecdd3',
		'300': '#fda4af',
		'400': '#fb7185',
		'500': '#f43f5e',
		'600': '#e11d48',
		'700': '#be123c',
		'800': '#9f1239',
		'900': '#881337',
		'950': '#4c0519'
	},
	black: {
		'50': '#a3a3a3',
		'100': '#999',
		'200': '#888',
		'300': '#777',
		'400': '#666',
		'500': '#555',
		'600': '#444',
		'700': '#333',
		'800': '#222',
		'900': '#111111',
		'950': '#000000'
	}
} as const;

type ColorName = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral';
type ColorVariant = 'light' | 'lighter' | 'dark' | 'muted' | 'contrast';
type SurfaceName =
	'surface' | 'surface-recessed' | 'surface-canvas' | 'surface-raised' | 'surface-floating';

export type ColorTheme = {
	[K in ColorName | `${ColorName}-${ColorVariant}`]?: string;
} & {
	[K in SurfaceName]?: string;
};

export type TailwindColor = keyof typeof tailwindColors;
export type TailwindColorShades =
	`${keyof typeof tailwindColors}-${keyof (typeof tailwindColors)[TailwindColor]}`;

type LowerFirstLetter<T extends string> = T extends `${infer First}${infer Rest}`
	? `${Lowercase<First>}${Rest}`
	: T;

type ColorRecord = Record<LowerFirstLetter<(typeof variants)[number]>, string | null> & {
	DEFAULT: string;
	// Accent pushed to a readable lightness for a given surface, hue/chroma kept.
	// `readable` = on the page background (ghost/outline/link); `muted-readable` = on this color's muted tint (soft).
	readable?: string | null;
	'muted-readable'?: string | null;
};
type Colors = {
	primary: ColorRecord;
	secondary: ColorRecord;
	danger: ColorRecord;
	success: ColorRecord;
	warning: ColorRecord;
	info: ColorRecord;
	neutral: ColorRecord;
};

type SurfaceRecord = {
	DEFAULT: string;
	recessed: string | null;
	canvas: string | null;
	raised: string | null;
	floating: string | null;
};
type SurfacePalette = DeepNonNullable<SurfaceRecord>;

type DeepNonNullable<T> = {
	[K in keyof T]: T[K] extends object
		? DeepNonNullable<T[K]>
		: T[K] extends string | null
			? string
			: T[K];
};

export const variants = ['Light', 'Lighter', 'Dark', 'Muted', 'Contrast'] as const;
export const colors = [
	'primary',
	'secondary',
	'danger',
	'success',
	'warning',
	'info',
	'neutral'
] as const;

const baseBlackColor = '#000000';
const baseWhiteColor = '#FFFFFF';
const defaultSurfaceLight = '#fafafa';
const defaultSurfaceDark = '#09090b';

const defaultColorsLight = {
	primary: '#5f62ef',
	secondary: '#e4e4e7',
	danger: '#dc2626',
	success: '#15803d',
	warning: '#f59e0b',
	info: '#2563eb',
	neutral: '#18181b'
} as const;
const defaultColorsDark = {
	primary: '#5f62ef',
	secondary: '#27272a',
	danger: '#dc2626',
	success: '#15803d',
	warning: '#f59e0b',
	info: '#2563eb',
	neutral: '#fafafa'
} as const;

type ColorThemeOption = {
	saturation?: number;
	luminance?: number;
	colorscheme?: 'dark' | 'light';
	'state-hover-opacity'?: number;
	'state-pressed-opacity'?: number;
	'state-selected-opacity'?: number;
} & ColorTheme;

export const generateBaseColors = (theme: ColorThemeOption) => {
	const defaultSurface = theme.colorscheme === 'dark' ? defaultSurfaceDark : defaultSurfaceLight;
	const surface = {
		DEFAULT: theme.surface || defaultSurface,
		recessed: theme['surface-recessed'] || null,
		canvas: theme['surface-canvas'] || null,
		raised: theme['surface-raised'] || null,
		floating: theme['surface-floating'] || null
	} satisfies SurfaceRecord;
	const baseColors = colors.reduce(
		(acc, color) => {
			const configuredColor = theme[color];
			const isTailwindColor = configuredColor && configuredColor in tailwindColors;
			const isHexColor = isHex(configuredColor || '');
			const defaultColor = isHexColor
				? configuredColor
				: isTailwindColor
					? tailwindColors[configuredColor as TailwindColor]['500']
					: configuredColor ||
						(theme.colorscheme === 'dark' ? defaultColorsDark[color] : defaultColorsLight[color]);

			Object.assign(acc[color], {
				DEFAULT: defaultColor
			});

			variants.forEach((variant) => {
				const variantName = variant.toLowerCase() as Lowercase<typeof variant>;
				const variantKey = `${color}-${variantName}` as keyof ColorTheme;
				Object.assign(acc[color as keyof typeof acc], {
					[variantName]: theme[variantKey] || null
				});
			});

			return acc;
		},
		{
			primary: {},
			secondary: {},
			danger: {},
			success: {},
			warning: {},
			info: {},
			neutral: {}
		} as Colors
	);

	return { colors: baseColors, surface };
};

export const generateColorPalette = (opts: ColorThemeOption) => {
	const { luminance, saturation, colorscheme } = opts;
	const { colors, surface } = generateBaseColors(opts);
	const isDark = colorscheme === 'dark';

	const adjustColor = (color: string) => {
		if (luminance) {
			color = lighten(color, luminance);
		}
		if (saturation) {
			color = saturate(color, saturation);
		}

		return color;
	};

	// Colored text for a specific surface. Pin the accent to a fixed perceptual lightness in
	// OKLCH (dark in light mode, light in dark mode) while keeping its hue and chroma — vivid,
	// consistent "colored text on a tint" like a design-system -600/-700 step. Near-neutral
	// accents (e.g. secondary) keep ~0 chroma and stay gray. The surface only drives the
	// contrast-safety nudge, so each variant gets text readable against the surface it sits on.
	const readableOn = (accent: string, surface: string) => {
		const { h, c } = hex2oklch(toHex(accent));
		const surfaceHex = toHex(surface);
		// Achromatic roles (neutral, secondary) have no hue to carry legibility, so start them
		// darker — a -700 grey rather than a -500 — or they fail AA on any tinted surface.
		let l = isDark ? 0.78 : c < 0.03 ? 0.4 : 0.55;
		let text = oklch2hex({ l, c, h });
		// `-readable` is body text on this surface, so it must clear AA (4.5:1) with headroom for browser colour-space rounding.
		while (hasBadContrast(surfaceHex, text, 4.75) && l > 0.15 && l < 0.95) {
			l += isDark ? 0.02 : -0.02;
			text = oklch2hex({ l, c, h });
		}
		return text;
	};

	const surfaceLightness = isDark
		? { DEFAULT: 0.18, recessed: 0.14, canvas: 0.16, raised: 0.2, floating: 0.24 }
		: { DEFAULT: 0.985, recessed: 0.966, canvas: 0.976, raised: 0.993, floating: 1 };

	const setPerceptualLightness = (color: string, lightness: number) => {
		const { c, h } = hex2oklch(toHex(color));
		const oklch = formatCSS({ l: lightness, c, h }, { format: 'oklch' });
		return toGamut(oklch, 'hex');
	};

	const surfacePalette = {
		DEFAULT: setPerceptualLightness(surface.DEFAULT, surfaceLightness.DEFAULT),
		recessed:
			surface.recessed || setPerceptualLightness(surface.DEFAULT, surfaceLightness.recessed),
		canvas: surface.canvas || setPerceptualLightness(surface.DEFAULT, surfaceLightness.canvas),
		raised: surface.raised || setPerceptualLightness(surface.DEFAULT, surfaceLightness.raised),
		floating: surface.floating || setPerceptualLightness(surface.DEFAULT, surfaceLightness.floating)
	};
	const baseSurface = surfacePalette.DEFAULT;

	// Soft/muted tint: the surface nudged toward the role at a FIXED perceptual lightness
	// step with capped chroma, so a near-black neutral and a vivid indigo produce tints of
	// the same weight. (A fixed mix ratio made neutral's tint 3-4× heavier than the others.)
	const mutedOn = (accent: string, surface: string) => {
		const { l: surfaceL } = hex2oklch(toHex(surface));
		const { c, h } = hex2oklch(toHex(accent));
		const l = isDark ? surfaceL + 0.06 : surfaceL - 0.045;
		const chroma = Math.min(c * 0.3, isDark ? 0.06 : 0.045);
		return toGamut(formatCSS({ l, c: chroma, h }, { format: 'oklch' }), 'hex');
	};

	const generateSemanticPalette = (color: ColorRecord, surface: string) => {
		const baseColor = adjustColor(color.DEFAULT as string);
		const muted = color.muted || mutedOn(baseColor, surface);
		return {
			DEFAULT: color.DEFAULT,
			dark: color.dark || darken(baseColor, 15),
			light: color.light || lighten(baseColor, 15),
			lighter: color.lighter || lighten(baseColor, 25),
			muted,
			contrast:
				color.contrast || (readableColorIsBlack(baseColor) ? baseBlackColor : baseWhiteColor),
			readable: readableOn(color.DEFAULT as string, baseSurface),
			'muted-readable': readableOn(color.DEFAULT as string, muted)
		};
	};

	const generateNeutralPalette = (color: ColorRecord) => {
		const baseColor = opts.neutral
			? adjustColor(color.DEFAULT)
			: setPerceptualLightness(surface.DEFAULT, isDark ? 0.96 : 0.22);
		const muted = color.muted || mutedOn(baseColor, baseSurface);
		return {
			DEFAULT: baseColor,
			dark: color.dark || darken(baseColor, 2),
			light: color.light || lighten(baseColor, 5),
			lighter: color.lighter || lighten(baseColor, 15),
			muted,
			contrast:
				color.contrast || (readableColorIsBlack(baseColor) ? baseBlackColor : baseWhiteColor),
			readable: readableOn(baseColor, baseSurface),
			'muted-readable': readableOn(baseColor, muted)
		};
	};

	const colorsPalette = {
		primary: generateSemanticPalette(colors.primary, baseSurface),
		secondary: generateSemanticPalette(colors.secondary, baseSurface),
		danger: generateSemanticPalette(colors.danger, baseSurface),
		success: generateSemanticPalette(colors.success, baseSurface),
		warning: generateSemanticPalette(colors.warning, baseSurface),
		info: generateSemanticPalette(colors.info, baseSurface),
		neutral: generateNeutralPalette(colors.neutral)
	} satisfies Colors;

	const cssVariables = {
		...paletteToCssVariables(colorsPalette),
		...surfaceToCssVariables(surfacePalette),
		'--state-hover-opacity': String(opts['state-hover-opacity'] ?? (isDark ? 0.16 : 0.05)),
		'--state-pressed-opacity': String(opts['state-pressed-opacity'] ?? (isDark ? 0.32 : 0.1)),
		// The SELECTED fill is a translucent tint of the role, not an opaque colour mixed over
		// the base surface, so it reads the same on `surface`, `surface-raised` and
		// `surface-floating` instead of going invisible (dark mode) on the lighter two.
		// Measured over the base surface the engine actually paints — the seed re-lightened to
		// `surfaceLightness.DEFAULT` (oklab L 0.985 / 0.18), so #fafafa in light but #111113 in
		// dark, NOT the authored #09090b — against the opaque `-muted` tint this used to paint:
		//   light  #fafafa + 7%  #18181b -> #eaeaea vs #ebebec   (2/255 apart; dL 0.048 vs 0.045)
		//   dark   #111113 + 10% #fafafa -> #28282a vs #1f1f1f  (11/255 apart; dL 0.099 vs 0.061)
		// So light reproduces the tint it replaces and dark deliberately does not. ~0.06 is the
		// dark alpha that would match to within 2/255, and it inherits that tint's weakness with
		// it: 0.06 puts only 14/255 between a selected row and the surface behind it. 0.10 is the
		// weight at which the selection reads on a dark surface. Retune from the perceptual step
		// (dL from the surface), not from the hex match.
		'--state-selected-opacity': String(opts['state-selected-opacity'] ?? (isDark ? 0.1 : 0.07))
	};

	return {
		colorsPalette,
		cssVariables
	};
};

const surfaceToCssVariables = (surface: SurfacePalette) => ({
	'--color-surface': formatCSS(surface.DEFAULT as `#${string}`, { format: 'oklab' }),
	'--color-surface-recessed': formatCSS(surface.recessed as `#${string}`, { format: 'oklab' }),
	'--color-surface-canvas': formatCSS(surface.canvas as `#${string}`, { format: 'oklab' }),
	'--color-surface-raised': formatCSS(surface.raised as `#${string}`, { format: 'oklab' }),
	'--color-surface-floating': formatCSS(surface.floating as `#${string}`, { format: 'oklab' })
});

const paletteToCssVariables = (colors: DeepNonNullable<Colors>) => {
	const colorVariables = {};
	Object.entries(colors).forEach(([key, value]) => {
		Object.entries(value).forEach(([k, v]) => {
			if (!v) {
				throw new Error(`Missing generated color value for ${key}-${k}`);
			}
			Object.assign(colorVariables, {
				[k === 'DEFAULT' ? `--color-${key}` : `--color-${key}-${k}`]: formatCSS(
					isHex(v) ? v : (toHex(v) as `#${string}`),
					{ format: 'oklab' }
				)
			});
		});
	});
	return colorVariables;
};

export const toTailwindCssTheme = () => {
	const colorTheme = colors.reduce((acc, color) => {
		Object.assign(acc, {
			[color]: variants.reduce(
				(acc, shade) => {
					Object.assign(acc, {
						[shade.toLowerCase()]: `var(--color-${color}-${shade.toLowerCase()})`
					});
					return acc;
				},
				{
					DEFAULT: `var(--color-${color})`,
					readable: `var(--color-${color}-readable)`,
					'muted-readable': `var(--color-${color}-muted-readable)`
				}
			)
		});
		return acc;
	}, {});
	return {
		...colorTheme,
		surface: {
			DEFAULT: 'var(--color-surface)',
			recessed: 'var(--color-surface-recessed)',
			canvas: 'var(--color-surface-canvas)',
			raised: 'var(--color-surface-raised)',
			floating: 'var(--color-surface-floating)'
		}
	};
};
