import type { PluginAPI } from 'tailwindcss/plugin';
import { colors, variants } from './colors.js';
import { applyElevationEngine } from './elevation.js';
import { applyGeometryEngine } from './geometry.js';
import { applyMotionEngine } from './motion.js';
import { applyRadiusEngine } from './radius.js';
import { spacingVariable, typeScaleVariables, type EngineOptions } from './scales.js';
import { addScrollFadeUtilities, scrollFadeKeyframes } from './scrollFade.js';
import { addShimmerUtilities, shimmerKeyframes } from './shimmer.js';
import { applySpacingEngine } from './spacing.js';
import { getSpinner, type Spinner } from './spinner.js';

/** Everything the palette-agnostic engine reads out of a `@plugin` options block. */
export type GlobalEngineOptions = EngineOptions & { spinner?: Spinner };

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

export const globalKeyframes = (options?: GlobalEngineOptions) => ({
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
export const applyGlobalEngine = (api: PluginAPI, options?: GlobalEngineOptions) => {
	const { addBase, addComponents, matchUtilities, addUtilities, addVariant } = api;

	applyGeometryEngine(api);
	applyMotionEngine(api, { motion: options?.motion });
	applyRadiusEngine(api, options?.radius ?? 'normal');
	applySpacingEngine(api);
	applyElevationEngine(api, options?.elevation ?? 'normal');
	if (options?.spacing !== undefined) {
		addBase({ html: spacingVariable(options.spacing) });
	}
	// The default type scale must exist at build time — `--text-*` used to be runtime-only.
	addBase({ html: typeScaleVariables(options?.typeScale ?? 'default') });
	addBase({
		...dataColors,
		html: {
			'--color': 'var(--color-neutral)',
			'--color-readable': 'var(--color-neutral-readable)',
			'--color-muted-readable': 'var(--color-neutral-muted-readable)',
			'--color-light': 'var(--color-neutral-light)',
			'--color-lighter': 'var(--color-neutral-lighter)',
			'--color-dark': 'var(--color-neutral-dark)',
			'--color-muted': 'var(--color-neutral-muted)',
			'--color-contrast': 'var(--color-neutral-contrast)',
			'--default-color': 'neutral'
		}
	});

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
			'shadow-color': parseUtility('--tw-shadow-color'),
			'fill-color': parseUtility('fill'),
			'stroke-color': parseUtility('stroke')
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

	// STATE ROLES — `focus`, `selected`, `hover` and `pressed` are the four colours a theme can
	// pin once so every focus ring, every persistent selection and the transient state layer stop
	// following the control's own role. None of `--color-focus`, `--color-selected*`,
	// `--color-hover` or `--color-pressed` is declared anywhere by default: each use site falls
	// back to the matching *current role* variable, so with no override nothing changes visually
	// and `[data-color]` keeps moving the states along with `--color`.
	// `type: 'color'` is deliberately left off: it makes Tailwind pre-mix the opacity modifier
	// into the value before the handler sees it, which would bury the fallback chain inside the
	// `color-mix()` instead of wrapping it. The suffix is read back out of `value` the way
	// `parseUtility` does, so `ring-focus/50` and `text-selected-contrast/40` both stay well-formed.
	const STATE_SUFFIX = /(-muted-readable|-muted|-contrast|-readable)/;
	const stateUtility =
		(attribute: string, role: 'focus' | 'selected') =>
		(value: string, { modifier }: { modifier: string | null }) => {
			const suffix = value.match(STATE_SUFFIX)?.[1] ?? '';
			const color = `var(--color-${role}${suffix}, var(--color${suffix}))`;
			return {
				[`${attribute}`]: modifier
					? `color-mix(in oklab, ${color} ${modifier}%, transparent)`
					: color
			};
		};
	const stateOptions = { values: { DEFAULT: '' }, modifiers: 'any' } as const;

	matchUtilities(
		{
			'ring-focus': stateUtility('--tw-ring-color', 'focus'),
			'border-focus': stateUtility('border-color', 'focus')
		},
		stateOptions
	);
	// The SELECTED fill is the one state colour that has to survive being moved between surfaces:
	// a menu row is painted on `surface`, on `surface-raised` inside a card and on
	// `surface-floating` inside a popover. `--color-<role>-muted` is an *opaque* tint mixed over
	// the BASE surface, so on the lighter two it reads as a dark patch in dark mode — the
	// submenu trigger under an open submenu was invisible. So `bg-selected-muted` composites
	// instead: a translucent tint of the role at `--state-selected-opacity`, which lands on
	// whatever is behind it. `bg-color-muted` (the non-state family) keeps the opaque tint —
	// only the state family composites.
	const selectedTint = `color-mix(in oklab, var(--color-selected, var(--color)) calc(var(--state-selected-opacity) * 100%), transparent)`;
	matchUtilities(
		{
			'bg-selected': (value: string, { modifier }: { modifier: string | null }) => {
				const color = value === '-muted' ? selectedTint : `var(--color-selected, var(--color))`;
				return {
					'background-color': modifier
						? `color-mix(in oklab, ${color} ${modifier}%, transparent)`
						: color
				};
			}
		},
		{ ...stateOptions, values: { DEFAULT: '', muted: '-muted' } }
	);
	matchUtilities(
		{ 'text-selected': stateUtility('color', 'selected') },
		{
			...stateOptions,
			values: {
				DEFAULT: '',
				contrast: '-contrast',
				'muted-readable': '-muted-readable'
			}
		}
	);
	matchUtilities(
		{
			'border-selected': stateUtility('border-color', 'selected'),
			'ring-selected': stateUtility('--tw-ring-color', 'selected')
		},
		stateOptions
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
				// The tint reads the `hover` state role, falling back to the element's own ink.
				'background-color': 'var(--color-hover, currentColor)',
				opacity: '0',
				'transition-property': 'opacity',
				'transition-duration': 'var(--duration-fast)',
				'transition-timing-function': 'var(--ease-standard)'
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
				// `pressed` falls back to `hover` before it falls back to the ink, so a theme that
				// pins only `hoverColor` keeps the press on that same colour.
				'background-color': 'var(--color-pressed, var(--color-hover, currentColor))',
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

	// `raised-*` reads the elevation engine's `--elevation-N` stacks plus the dark-mode tonal
	// tint, so every level stays in sync with the theme's `elevation` option. The t-shirt
	// aliases keep the silhouettes the previous Tailwind-shadow-backed implementation had:
	// `xs` ≈ `--shadow-xs`, the bare utility and `sm` ≈ `--shadow-sm` (Tailwind's `--shadow`
	// DEFAULT), `md` ≈ `--shadow-md`, and so on.
	const raisedValues = {
		DEFAULT: '2',
		none: 'none',
		'0': '0',
		'1': '1',
		'2': '2',
		'3': '3',
		'4': '4',
		'5': '5',
		xs: '1',
		sm: '2',
		md: '3',
		lg: '4',
		xl: '5',
		'2xl': '5'
	};

	// Tailwind's own shadow composition, so `raised-*` still stacks with `ring-*`,
	// `inset-shadow-*` and friends instead of replacing `box-shadow` outright. The
	// fallbacks keep the declaration valid when no core shadow utility is in the build
	// (and therefore no `@property` registration was emitted).
	const composedBoxShadow = [
		'var(--tw-inset-shadow, 0 0 #0000)',
		'var(--tw-inset-ring-shadow, 0 0 #0000)',
		'var(--tw-ring-offset-shadow, 0 0 #0000)',
		'var(--tw-ring-shadow, 0 0 #0000)',
		'var(--tw-shadow, 0 0 #0000)'
	].join(', ');

	matchUtilities(
		{
			raised: (value) => {
				if (value === 'none' || value === '0') {
					return {
						'--tw-shadow': '0 0 #0000',
						'box-shadow': composedBoxShadow,
						border: '0px'
					};
				}
				return {
					border:
						'var(--raised-border, 1px solid var(--current-border, var(--color-neutral-muted)))',
					// The tonal tint rides along as a filling inset shadow rather than a
					// `background-image`, so a gradient or image background on the same element
					// survives. It is `transparent` in light mode, where it is a no-op.
					'--tw-shadow': `inset 0 0 0 9999px var(--elevation-tint-${value}), var(--elevation-${value})`,
					'box-shadow': composedBoxShadow
				};
			}
		},
		{
			values: raisedValues
		}
	);

	// `lift-*` is the borderless half of the same ramp: the shadow (and the dark-mode tonal
	// tint) with no border of its own. Thumbs, indicators, pills, drag previews and tooltips
	// float above their surface without a hairline, and still follow the theme's `elevation`
	// option. Same value map as `raised-*`, so `lift-md` and `raised-md` cast the same shadow.
	matchUtilities(
		{
			lift: (value) => {
				if (value === 'none' || value === '0') {
					return {
						'--tw-shadow': '0 0 #0000',
						'box-shadow': composedBoxShadow
					};
				}
				return {
					'--tw-shadow': `inset 0 0 0 9999px var(--elevation-tint-${value}), var(--elevation-${value})`,
					'box-shadow': composedBoxShadow
				};
			}
		},
		{
			values: raisedValues
		}
	);
};
