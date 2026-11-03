import type { PluginAPI } from 'tailwindcss/plugin';

type CssRule = {
	[key: string]: string | string[] | CssRule | CssRule[];
};

type UtilityRules = Record<string, CssRule | CssRule[]>;

type BareValue = {
	value: string;
};

type MatchUtilityValues = Record<string, string> & {
	__BARE_VALUE__?: (value: BareValue) => string | undefined;
};

type EdgeFadeOptions = {
	sizeVariable: string;
	sizeProperty: string;
	mask: string;
	rtlMask?: string;
	animationName: string;
	timeline: string;
	range: string;
	fallbackProperty: string;
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

const defaultFadeSize = 'var(--scroll-fade-size, min(12%, calc(var(--spacing) * 10)))';
const revealSize = 'var(--scroll-fade-reveal, calc(var(--spacing) * 24))';

const isInteger = (value: string) => {
	const number = Number(value);
	return Number.isInteger(number) && number >= 0 && String(number) === value;
};

const spacingValue = ({ value }: BareValue) =>
	isInteger(value) ? `calc(var(--spacing) * ${value})` : undefined;

const maskProperties: CssRule = {
	'-webkit-mask-composite': 'source-in',
	'mask-composite': 'intersect',
	'-webkit-mask-repeat': 'no-repeat',
	'mask-repeat': 'no-repeat'
};

const scrollFadeProperties: CssRule = {
	'@property --scroll-fade-t': {
		syntax: '"<length-percentage>"',
		inherits: 'false',
		'initial-value': '0px'
	},
	'@property --scroll-fade-b': {
		syntax: '"<length-percentage>"',
		inherits: 'false',
		'initial-value': '0px'
	},
	'@property --scroll-fade-s': {
		syntax: '"<length-percentage>"',
		inherits: 'false',
		'initial-value': '0px'
	},
	'@property --scroll-fade-e': {
		syntax: '"<length-percentage>"',
		inherits: 'false',
		'initial-value': '0px'
	},
	'@property --scroll-fade-mask': {
		syntax: '"*"',
		inherits: 'false'
	},
	// Only the faded element reads these. Left inheritable, they gave its whole subtree a new
	// inherited variable set on every mount, which WebKit's style cache keys on: each descendant
	// missed it and added an entry, so memory grew with every mount.
	...Object.fromEntries(
		[
			'--_scroll-fade-size-t',
			'--_scroll-fade-size-b',
			'--_scroll-fade-size-s',
			'--_scroll-fade-size-e',
			'--scroll-fade-block',
			'--scroll-fade-inline'
		].map((name) => [`@property ${name}`, { syntax: '"*"', inherits: 'false' }])
	)
};

export const scrollFadeKeyframes = {
	'scroll-fade-reveal-t': {
		from: {
			'--scroll-fade-t': '0px'
		},
		to: {
			'--scroll-fade-t': `var(--_scroll-fade-size-t, ${defaultFadeSize})`
		}
	},
	'scroll-fade-reveal-b': {
		from: {
			'--scroll-fade-b': `var(--_scroll-fade-size-b, ${defaultFadeSize})`
		},
		to: {
			'--scroll-fade-b': '0px'
		}
	},
	'scroll-fade-reveal-s': {
		from: {
			'--scroll-fade-s': '0px'
		},
		to: {
			'--scroll-fade-s': `var(--_scroll-fade-size-s, ${defaultFadeSize})`
		}
	},
	'scroll-fade-reveal-e': {
		from: {
			'--scroll-fade-e': `var(--_scroll-fade-size-e, ${defaultFadeSize})`
		},
		to: {
			'--scroll-fade-e': '0px'
		}
	}
};

const blockFadeSizeProperties = {
	'--_scroll-fade-size-t': `var(--scroll-fade-t-size, ${defaultFadeSize})`,
	'--_scroll-fade-size-b': `var(--scroll-fade-b-size, ${defaultFadeSize})`
};

const inlineFadeSizeProperties = {
	'--_scroll-fade-size-s': `var(--scroll-fade-s-size, ${defaultFadeSize})`,
	'--_scroll-fade-size-e': `var(--scroll-fade-e-size, ${defaultFadeSize})`
};

const blockFadeUtility: CssRule = {
	...blockFadeSizeProperties,
	'--scroll-fade-block':
		'linear-gradient(to bottom, transparent 0, #000 var(--scroll-fade-t, 0px), #000 calc(100% - var(--scroll-fade-b, 0px)), transparent 100%)',
	'-webkit-mask-image': 'var(--scroll-fade-mask, var(--scroll-fade-block))',
	'mask-image': 'var(--scroll-fade-mask, var(--scroll-fade-block))',
	...maskProperties,
	'@supports (animation-timeline: scroll())': {
		animation: 'scroll-fade-reveal-t 1ms ease-in-out, scroll-fade-reveal-b 1ms ease-in-out',
		'animation-timeline': 'scroll(self y), scroll(self y)',
		'animation-range': `0 ${revealSize}, calc(100% - ${revealSize}) 100%`,
		'animation-fill-mode': 'both'
	},
	'@supports not (animation-timeline: scroll())': {
		'--scroll-fade-t': 'var(--_scroll-fade-size-t)',
		'--scroll-fade-b': 'var(--_scroll-fade-size-b)'
	}
};

const inlineFadeUtility: CssRule = {
	...inlineFadeSizeProperties,
	'--scroll-fade-inline':
		'linear-gradient(to right, transparent 0, #000 var(--scroll-fade-s, 0px), #000 calc(100% - var(--scroll-fade-e, 0px)), transparent 100%)',
	'&:where([dir="rtl"], [dir="rtl"] *)': {
		'--scroll-fade-inline':
			'linear-gradient(to left, transparent 0, #000 var(--scroll-fade-s, 0px), #000 calc(100% - var(--scroll-fade-e, 0px)), transparent 100%)'
	},
	'-webkit-mask-image': 'var(--scroll-fade-mask, var(--scroll-fade-inline))',
	'mask-image': 'var(--scroll-fade-mask, var(--scroll-fade-inline))',
	...maskProperties,
	'@supports (animation-timeline: scroll())': {
		animation: 'scroll-fade-reveal-s 1ms ease-in-out, scroll-fade-reveal-e 1ms ease-in-out',
		'animation-timeline': 'scroll(self inline), scroll(self inline)',
		'animation-range': `0 ${revealSize}, calc(100% - ${revealSize}) 100%`,
		'animation-fill-mode': 'both'
	},
	'@supports not (animation-timeline: scroll())': {
		'--scroll-fade-s': 'var(--_scroll-fade-size-s)',
		'--scroll-fade-e': 'var(--_scroll-fade-size-e)'
	}
};

const createEdgeFadeUtility = ({
	sizeVariable,
	sizeProperty,
	mask,
	rtlMask,
	animationName,
	timeline,
	range,
	fallbackProperty
}: EdgeFadeOptions): CssRule => ({
	[sizeVariable]: `var(${sizeProperty}, ${defaultFadeSize})`,
	'--scroll-fade-mask': mask,
	...(rtlMask
		? {
				'&:where([dir="rtl"], [dir="rtl"] *)': {
					'--scroll-fade-mask': rtlMask
				}
			}
		: {}),
	'-webkit-mask-image': 'var(--scroll-fade-mask)',
	'mask-image': 'var(--scroll-fade-mask)',
	...maskProperties,
	'@supports (animation-timeline: scroll())': {
		animation: `${animationName} 1ms ease-in-out`,
		'animation-timeline': timeline,
		'animation-range': range,
		'animation-fill-mode': 'both'
	},
	'@supports not (animation-timeline: scroll())': {
		[fallbackProperty]: `var(${sizeVariable})`
	}
});

const scrollFadeUtilities: UtilityRules = {
	'.scroll-fade': blockFadeUtility,
	'.scroll-fade-y': blockFadeUtility,
	'.scroll-fade-x': inlineFadeUtility,
	'.scroll-fade-t': createEdgeFadeUtility({
		sizeVariable: '--_scroll-fade-size-t',
		sizeProperty: '--scroll-fade-t-size',
		mask: 'linear-gradient(to bottom, transparent 0, #000 var(--scroll-fade-t, 0px), #000 100%)',
		animationName: 'scroll-fade-reveal-t',
		timeline: 'scroll(self y)',
		range: `0 ${revealSize}`,
		fallbackProperty: '--scroll-fade-t'
	}),
	'.scroll-fade-b': createEdgeFadeUtility({
		sizeVariable: '--_scroll-fade-size-b',
		sizeProperty: '--scroll-fade-b-size',
		mask: 'linear-gradient(to bottom, #000 0, #000 calc(100% - var(--scroll-fade-b, 0px)), transparent 100%)',
		animationName: 'scroll-fade-reveal-b',
		timeline: 'scroll(self y)',
		range: `calc(100% - ${revealSize}) 100%`,
		fallbackProperty: '--scroll-fade-b'
	}),
	'.scroll-fade-l': createEdgeFadeUtility({
		sizeVariable: '--_scroll-fade-size-s',
		sizeProperty: '--scroll-fade-s-size',
		mask: 'linear-gradient(to right, transparent 0, #000 var(--scroll-fade-s, 0px), #000 100%)',
		animationName: 'scroll-fade-reveal-s',
		timeline: 'scroll(self x)',
		range: `0 ${revealSize}`,
		fallbackProperty: '--scroll-fade-s'
	}),
	'.scroll-fade-r': createEdgeFadeUtility({
		sizeVariable: '--_scroll-fade-size-e',
		sizeProperty: '--scroll-fade-e-size',
		mask: 'linear-gradient(to right, #000 0, #000 calc(100% - var(--scroll-fade-e, 0px)), transparent 100%)',
		animationName: 'scroll-fade-reveal-e',
		timeline: 'scroll(self x)',
		range: `calc(100% - ${revealSize}) 100%`,
		fallbackProperty: '--scroll-fade-e'
	}),
	'.scroll-fade-s': createEdgeFadeUtility({
		sizeVariable: '--_scroll-fade-size-s',
		sizeProperty: '--scroll-fade-s-size',
		mask: 'linear-gradient(to right, transparent 0, #000 var(--scroll-fade-s, 0px), #000 100%)',
		rtlMask: 'linear-gradient(to left, transparent 0, #000 var(--scroll-fade-s, 0px), #000 100%)',
		animationName: 'scroll-fade-reveal-s',
		timeline: 'scroll(self inline)',
		range: `0 ${revealSize}`,
		fallbackProperty: '--scroll-fade-s'
	}),
	'.scroll-fade-e': createEdgeFadeUtility({
		sizeVariable: '--_scroll-fade-size-e',
		sizeProperty: '--scroll-fade-e-size',
		mask: 'linear-gradient(to right, #000 0, #000 calc(100% - var(--scroll-fade-e, 0px)), transparent 100%)',
		rtlMask:
			'linear-gradient(to left, #000 0, #000 calc(100% - var(--scroll-fade-e, 0px)), transparent 100%)',
		animationName: 'scroll-fade-reveal-e',
		timeline: 'scroll(self inline)',
		range: `calc(100% - ${revealSize}) 100%`,
		fallbackProperty: '--scroll-fade-e'
	}),
	'.scroll-fade-static': {
		animation: 'none',
		'--scroll-fade-t': 'var(--_scroll-fade-size-t)',
		'--scroll-fade-b': 'var(--_scroll-fade-size-b)',
		'--scroll-fade-s': 'var(--_scroll-fade-size-s)',
		'--scroll-fade-e': 'var(--_scroll-fade-size-e)'
	},
	'.scroll-fade-none': {
		'--scroll-fade-mask': 'none'
	}
};

export const addScrollFadeUtilities = ({ addBase, addUtilities, matchUtilities }: PluginAPI) => {
	addBase(scrollFadeProperties);
	addUtilities(scrollFadeUtilities);

	const spacingValues = withBareValue({}, spacingValue);

	matchUtilities(
		{
			'scroll-fade': (value) => ({
				'--scroll-fade-size': value
			}),
			'scroll-fade-t': (value) => ({
				'--scroll-fade-t-size': value
			}),
			'scroll-fade-b': (value) => ({
				'--scroll-fade-b-size': value
			}),
			'scroll-fade-s': (value) => ({
				'--scroll-fade-s-size': value
			}),
			'scroll-fade-e': (value) => ({
				'--scroll-fade-e-size': value
			})
		},
		{
			values: spacingValues,
			type: ['length', 'percentage']
		}
	);
};
