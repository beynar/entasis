import type { PluginAPI } from 'tailwindcss/plugin';

type CssRule = {
	[key: string]: string | string[] | CssRule | CssRule[];
};

type UtilityRules = Record<string, CssRule | CssRule[]>;

type BareValue = {
	value: string;
};

type MatchUtilityContext = {
	modifier: string | null;
};

type MatchUtilityValues = Record<string, string> & {
	__BARE_VALUE__?: (value: BareValue) => string | undefined;
};

const withBareValue = (
	values: Record<string, string>,
	getBareValue: (value: BareValue) => string | undefined
) => {
	// Tailwind declares __BARE_VALUE__ beside a string index signature; this hook is
	// valid at runtime but impossible to express without a narrow assertion.
	return {
		...values,
		__BARE_VALUE__: getBareValue
	} as MatchUtilityValues;
};

const isInteger = (value: string) => {
	const number = Number(value);
	return Number.isInteger(number) && number >= 0 && String(number) === value;
};

const integerValue = ({ value }: BareValue) => (isInteger(value) ? value : undefined);

const spacingValue = ({ value }: BareValue) =>
	isInteger(value) ? `calc(var(--spacing) * ${value})` : undefined;

const colorVariablePattern = /^var\(--color-(.+)\)$/;
const colorMixSupport = '@supports (color: color-mix(in lab, red, red))';
const opacityMixPrefix = 'color-mix(in oklab, ';
const opacityMixSuffix = ', transparent)';
const opacityModifierPrefix = '__entasis-shimmer-integer-';
const opacityModifierSuffix = '__';

const encodeOpacityModifier = (value: string) =>
	isInteger(value) ? `${opacityModifierPrefix}${value}${opacityModifierSuffix}` : undefined;

const opacityModifiers = new Proxy<Record<string, string>>(
	{},
	{
		get: (_target, property) =>
			typeof property === 'string' ? encodeOpacityModifier(property) : undefined,
		getOwnPropertyDescriptor: (_target, property) => {
			if (typeof property !== 'string' || !encodeOpacityModifier(property)) return;

			// Tailwind does not expose whether a modifier was named or arbitrary. A
			// virtual own property marks bare integers without imposing a finite range.
			return { configurable: true, enumerable: false };
		}
	}
);

const createColorValues = (colors: Record<string, string>) =>
	Object.fromEntries(Object.keys(colors).map((color) => [color, `var(--color-${color})`]));

const resolveColorValue = (value: string, colors: Record<string, string>) => {
	const color = colorVariablePattern.exec(value)?.[1];
	if (!color) return value;

	const resolvedColor = colors[color];
	return typeof resolvedColor === 'string' && !resolvedColor.startsWith('var(')
		? resolvedColor
		: value;
};

const unwrapOpacityColor = (value: string, modifier: string | null) => {
	if (!modifier?.startsWith(opacityModifierPrefix) || !modifier.endsWith(opacityModifierSuffix))
		return;

	const opacity = modifier.slice(opacityModifierPrefix.length, -opacityModifierSuffix.length);
	if (!isInteger(opacity)) return;

	const suffix = ` ${modifier}${opacityMixSuffix}`;
	if (!value.startsWith(opacityMixPrefix) || !value.endsWith(suffix)) return;

	return {
		color: value.slice(opacityMixPrefix.length, -suffix.length),
		opacity
	};
};

const createShimmerColorRule = (
	value: string,
	{ modifier }: MatchUtilityContext,
	colors: Record<string, string>
): CssRule | CssRule[] => {
	if (!modifier) return { '--shimmer-color': value };

	const opacityColor = unwrapOpacityColor(value, modifier);
	if (!opacityColor) return {};

	const resolvedColor = resolveColorValue(opacityColor.color, colors);
	const mix = (color: string) =>
		`color-mix(in oklch, ${color} calc(${opacityColor.opacity} * 1%), transparent)`;

	return [
		{ '--shimmer-color': opacityColor.color },
		{ '--shimmer-color': mix(resolvedColor) },
		...(resolvedColor === opacityColor.color
			? []
			: [
					{
						[colorMixSupport]: {
							'--shimmer-color': mix(opacityColor.color)
						}
					}
				])
	];
};

export const shimmerKeyframes = {
	'tw-shimmer': {
		from: {
			'background-position': '100% 0'
		},
		to: {
			'background-position': '0 0'
		}
	}
};

const shimmerProperties: CssRule = {
	'@property --shimmer-angle': {
		syntax: '"<angle>"',
		inherits: 'true',
		'initial-value': '20deg'
	},
	'@property --shimmer-image': {
		syntax: '"*"',
		inherits: 'false'
	},
	'@property --shimmer-text-fill': {
		syntax: '"*"',
		inherits: 'false'
	}
};

const shimmerUtilities: UtilityRules = {
	'.shimmer': {
		'--_spread': 'var(--shimmer-spread, calc(3ch + 40px))',
		'--_base': 'currentColor',
		'--_highlight': 'var(--shimmer-color, oklch(from currentColor l c h / calc(alpha * 0.2)))',
		'background-image':
			'var(--shimmer-image, linear-gradient(calc(90deg + var(--shimmer-angle)), var(--_base) calc(50% - var(--_spread)), color-mix(in oklch, var(--_highlight), var(--_base) 50%) calc(50% - var(--_spread) * 0.5), var(--_highlight) 50%, color-mix(in oklch, var(--_highlight), var(--_base) 50%) calc(50% + var(--_spread) * 0.5), var(--_base) calc(50% + var(--_spread))))',
		'background-repeat': 'no-repeat',
		'background-size': 'calc(200% + var(--_spread) * 2) 100%',
		'background-position': '0 0',
		'background-clip': 'text',
		'-webkit-surface-clip': 'text',
		'-webkit-text-fill-color': 'var(--shimmer-text-fill, transparent)',
		animation: 'tw-shimmer var(--shimmer-duration, 2s) linear infinite',
		'html[data-theme="dark"] &, .dark &, [data-color-scheme="dark"] &': {
			'--_highlight':
				'var(--shimmer-color, oklch(from currentColor max(0.8, calc(l + 0.4)) c h / calc(alpha + 0.4)))'
		},
		'&:where([dir="rtl"], [dir="rtl"] *)': {
			'animation-direction': 'reverse'
		},
		'@media (prefers-reduced-motion: reduce)': {
			animation: 'none',
			'background-image': 'none',
			'-webkit-text-fill-color': 'currentColor'
		}
	},
	'.shimmer-once': {
		'animation-iteration-count': '1'
	},
	'.shimmer-reverse': {
		'animation-direction': 'reverse'
	},
	'.shimmer-none': {
		'--shimmer-image': 'none',
		'--shimmer-text-fill': 'currentColor'
	}
};

export const addShimmerUtilities = ({
	addBase,
	addUtilities,
	matchUtilities,
	theme
}: PluginAPI) => {
	addBase(shimmerProperties);
	addUtilities(shimmerUtilities);

	const colors = theme('colors') as Record<string, string>;
	const colorValues = createColorValues(colors);

	matchUtilities(
		{
			'shimmer-color': (value, context) => createShimmerColorRule(value, context, colors)
		},
		{
			values: colorValues,
			type: 'color',
			modifiers: opacityModifiers
		}
	);

	matchUtilities(
		{
			'shimmer-duration': (value) => ({
				'--shimmer-duration': `calc(${value} * 1ms)`
			})
		},
		{
			values: withBareValue({}, integerValue),
			type: 'integer'
		}
	);

	matchUtilities(
		{
			'shimmer-spread': (value) => ({
				'--shimmer-spread': value
			})
		},
		{
			values: withBareValue({}, spacingValue),
			type: ['length', 'percentage']
		}
	);

	matchUtilities(
		{
			'shimmer-angle': (value) => ({
				'--shimmer-angle': `calc(${value} * 1deg)`
			})
		},
		{
			values: withBareValue({}, integerValue),
			type: 'integer'
		}
	);
};
