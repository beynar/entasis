import plugin from 'tailwindcss/plugin.js';
import { colors, generateColorPalette, toTailwindCssTheme, type ColorTheme } from './colors.js';
import type { Spinner } from './spinner.js';
import { applyGlobalEngine, globalKeyframes } from './global.js';
import type { EngineOptions } from './scales.js';

export type ThemeOptions = Partial<{
	name: string;
	default: boolean;
	luminance?: number;
	saturation?: number;
	colorscheme?: 'light' | 'dark';
	'state-hover-opacity'?: number;
	'state-pressed-opacity'?: number;
	'state-selected-opacity'?: number;
	prefersDark?: boolean;
	spinner?: Spinner;
}> &
	// Scale options only apply on the block that bootstraps the engine (`default: true`).
	EngineOptions &
	ColorTheme;

// Every key `ThemeOptions` accepts. Tailwind hands an `@plugin` block through verbatim, so a
// mis-cased or misspelled key (`prefersdark`, `typescale`) would otherwise be dropped in silence
// and the option would do nothing — documented examples included.
const themeOptionKeys = new Set<string>([
	'name',
	'default',
	'luminance',
	'saturation',
	'colorscheme',
	'state-hover-opacity',
	'state-pressed-opacity',
	'state-selected-opacity',
	'prefersDark',
	'spinner',
	// EngineOptions
	'radius',
	'spacing',
	'typeScale',
	'elevation',
	'motion',
	// ColorTheme
	...colors.flatMap((color) => [
		color,
		...(['light', 'lighter', 'dark', 'muted', 'contrast'] as const).map(
			(variant) => `${color}-${variant}`
		)
	]),
	'surface',
	'surface-recessed',
	'surface-canvas',
	'surface-raised',
	'surface-floating'
]);

const assertKnownOptions = (theme: ThemeOptions) => {
	const unknown = Object.keys(theme).filter((key) => !themeOptionKeys.has(key));
	if (unknown.length === 0) return;
	const suggest = (key: string) =>
		[...themeOptionKeys].find((known) => known.toLowerCase() === key.toLowerCase());
	throw new Error(
		`entasis/tailwind-plugin/theme: unknown option${unknown.length > 1 ? 's' : ''} ${unknown
			.map((key) => {
				const hint = suggest(key);
				return hint ? `"${key}" (did you mean "${hint}"?)` : `"${key}"`;
			})
			.join(', ')}.`
	);
};

export default plugin.withOptions<ThemeOptions>(
	(theme = {}) => {
		assertKnownOptions(theme);
		return (api) => {
			const { addBase } = api;
			const { cssVariables } = generateColorPalette(theme);
			const root = theme.name && !theme.default ? `html[data-theme="${theme.name}"]` : 'html';
			const roots = [root, theme.name ? `.${theme.name}` : ''].filter(Boolean);
			const rootBase = Object.fromEntries(roots.map((root) => [root, cssVariables]));
			addBase(rootBase);

			if (theme.prefersDark) {
				addBase({
					'@media (prefers-color-scheme: dark)': {
						rootBase
					}
				});
			}

			addBase({
				'*': {
					'-webkit-font-smoothing': 'subpixel-antialiased'
				}
			});

			// The default theme bootstraps the palette-agnostic engine (utilities,
			// variants, spinner, raised-*) so a single @plugin declaration is enough.
			if (theme.default) {
				applyGlobalEngine(api, theme);
			}
		};
	},
	(options) => ({
		theme: {
			extend: {
				colors: toTailwindCssTheme(),
				// Keyframes belong to the engine — register them once, from the default theme.
				...(options?.default ? { keyframes: globalKeyframes(options) } : {})
			}
		}
	})
);
