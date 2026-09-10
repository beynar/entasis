import type { PluginAPI } from 'tailwindcss/plugin';
import { colors, variants } from './colors.js';
import { applyGeometryEngine } from './geometry.js';
import { applyRadiusEngine } from './radius.js';
import { addScrollFadeUtilities, scrollFadeKeyframes } from './scrollFade.js';
import { addShimmerUtilities, shimmerKeyframes } from './shimmer.js';
import { applySpacingEngine } from './spacing.js';
import { getSpinner } from './spinner.js';
import type { ThemeOptions } from './theme.js';

const dataColors = colors.reduce(
	(acc, color) => {
		acc[`[data-color="${color}"]`] = variants.reduce(
			(acc, variant) => {
				const v = variant.toLowerCase();
				Object.assign(acc, {
					[`--color-${v}`]: `var(--color-${color}-${v})`
				});
				return acc;
			},
			{
				'--color': `var(--color-${color})`,
				'--color-readable': `var(--color-${color}-readable)`,
				'--color-muted-readable': `var(--color-${color}-muted-readable)`
			} as Record<string, string>
		);
		return acc;
	},
	{} as Record<string, Record<string, string>>
);

export const globalKeyframes = (options?: ThemeOptions) => ({
	...getSpinner(options).keyframes,
	...shimmerKeyframes,
	...scrollFadeKeyframes
});

/**
 * Registers the palette-agnostic layer: custom color utilities, variants,
 * `.ui-spinner`, `raised-*`, shimmer, and scroll-fade utilities. It must run
 * exactly once per build — the `theme` plugin bootstraps it from the default
 * theme, and the standalone `index` plugin calls it directly for consumers who
 * want the engine without a generated palette.
 */
export const applyGlobalEngine = (api: PluginAPI, options?: ThemeOptions) => {
	const { addBase, addComponents, matchUtilities, addUtilities, theme, addVariant } = api;

	applyGeometryEngine(api);
	applyRadiusEngine(api);
	applySpacingEngine(api);
	addBase({ ...dataColors });

	const parseUtility =
		(attribute: string) =>
		(value: string, { modifier }: { modifier: string | null }) => {
			if (modifier) {
				const suffixPattern = /(-muted-readable|-lighter|-light|-dark|-muted|-contrast|-readable)/;
				const match = value.match(suffixPattern);
				const suffix = match?.[1] || '';
				return {
					[`${attribute}`]: `color-mix(in oklab, var(--color${suffix}) ${modifier}%, transparent)`
				};
			} else {
				return {
					[`${attribute}`]: `var(--color${value})`
				};
			}
		};

	matchUtilities(
		{
			'text-color': parseUtility('color'),
			'bg-color': parseUtility('background-color'),
			'ring-color': parseUtility('--tw-ring-color'),
			'ring-offset-color': parseUtility('--tw-ring-offset-color'),
			'border-color': parseUtility('border-color'),
			'border-top-color': parseUtility('border-top-color'),
			'border-right-color': parseUtility('border-right-color'),
			'border-bottom-color': parseUtility('border-bottom-color'),
			'border-left-color': parseUtility('border-left-color'),
			'border-s-color': parseUtility('border-inline-start-color'),
			'border-e-color': parseUtility('border-inline-end-color'),
			'shadow-color': parseUtility('--tw-shadow-color')
		},
		{
			values: {
				DEFAULT: '',
				light: '-light',
				lighter: '-lighter',
				dark: '-dark',
				muted: '-muted',
				contrast: '-contrast',
				readable: '-readable',
				'muted-readable': '-muted-readable'
			},
			type: 'color',
			modifiers: 'any'
		}
	);

	// DYNAMIC WINDOW UTILITIES
	addUtilities({
		'.h-window': {
			height: 'var(--window-height, 100dvh)'
		},
		'.w-window': {
			width: 'var(--window-width)'
		}
	});

	addBase({
		'body *': {
			'border-color': 'var(--color-neutral-muted)',
			'--tw-ring-offset-color': 'var(--color-surface-canvas)'
		},
		'[data-color-scheme="dark"]': {
			'--dark-raised-border': '1px solid var(--current-border, var(--color-neutral-muted))',
			'--dark-raised-shadow': 'none'
		},
		':has([data-chip-position])': {
			position: 'relative'
		},
		':focus': {
			outline: 'none'
		}
	});
	addComponents({
		'.ui-spinner': getSpinner(options).style,
		'.state-layer': {
			position: 'relative',
			isolation: 'isolate',
			'&::before': {
				content: "''",
				position: 'absolute',
				inset: '0',
				'z-index': '-1',
				'pointer-events': 'none',
				'border-radius': 'inherit',
				'background-color': 'currentColor',
				opacity: '0',
				'transition-property': 'opacity',
				'transition-duration': '100ms',
				'transition-timing-function': 'ease-out'
			},
			'@media (hover: hover)': {
				'&:not(:disabled):not([data-disabled]):not([aria-disabled="true"]):hover::before': {
					opacity: 'var(--state-hover-opacity)'
				}
			},
			'&:not(:disabled):not([data-disabled]):not([aria-disabled="true"])[data-highlighted="true"]::before':
				{
					opacity: 'var(--state-hover-opacity)'
				},
			'&:not(:disabled):not([data-disabled]):not([aria-disabled="true"]):active::before': {
				opacity: 'var(--state-pressed-opacity)'
			}
		}
	});
	addShimmerUtilities(api);
	addScrollFadeUtilities(api);

	addVariant('checked', ['&:checked', "&[data-checked='true']"]);
	addVariant('not-checked', ['&:not(:checked)', "&[data-checked='false']"]);
	addVariant('child', '& > *');
	addVariant('first-child', '& > *:first-child');
	addVariant('last-child', '& > *:last-child');
	addVariant('not-first-child', '& > *:not(:first-child)');
	addVariant('not-last-child', '& > *:not(:last-child)');
	addVariant('not-first-not-last-child', '& > *:not(:first-child):not(:last-child)');
	addVariant('active', ['&:active', '&[data-active="true"]']);
	addVariant('inactive', ['&:not(:active)', '&[data-active="false"]']);

	addVariant('highlight', ['&[data-highlighted="true"]']);
	addVariant('dark', ['html[data-theme="dark"] &', '.dark &', '[data-color-scheme="dark"] &']);
	addVariant('disabled', ['&:disabled', '&[data-disabled="true"]']);

	addBase({
		'border-color': 'var(--color-neutral-muted)',
		'border-width': '1px'
	});

	matchUtilities(
		{
			raised: (value) => {
				if (value !== 'none') {
					const valueWithoutRgb = value.replace(/rgb\((.*?)\)/g, 'var(--tw-shadow-color)');
					return {
						border:
							'var(--raised-border, 1px solid var(--current-border, var(--color-neutral-muted)))',
						'--tw-shadow': value as string,
						'--tw-shadow-colored': valueWithoutRgb as string,
						'box-shadow':
							'var(--dark-raised-shadow, var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow))'
					};
				} else {
					return {
						'box-shadow': 'none',
						'--tw-shadow': 'none',
						'--tw-shadow-colored': 'none',
						border: '0px'
					};
				}
			}
		},
		{
			values: theme('boxShadow')
		}
	);
};
