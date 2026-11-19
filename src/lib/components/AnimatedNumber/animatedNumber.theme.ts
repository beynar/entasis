import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

// The number is one box on its line: it takes the font, the size and the colour of the text
// round it. Digits are tabular, so a number keeps its width as its digits change; a
// `proportional-nums` class on the root gives them their own widths back.
const defaultRoot = cva({
	base: 'relative isolate inline-flex items-baseline leading-none whitespace-nowrap tabular-nums'
});

// What stands before the number: a sign, a currency, the `prefix`.
const defaultPre = cva({ base: 'inline-flex items-baseline' });

// The integer digits and their group separators.
const defaultInteger = cva({ base: 'inline-flex items-baseline' });

// The decimal point and the fraction digits.
const defaultFraction = cva({ base: 'inline-flex items-baseline' });

// What follows the number: a percent sign, a unit, a compact suffix, the `suffix`.
const defaultPost = cva({ base: 'inline-flex items-baseline' });

const defaultDigit = cva({ base: '' });

const defaultSymbol = cva({ base: '' });

export const animatedNumberTheme = {
	root: defaultRoot,
	pre: defaultPre,
	integer: defaultInteger,
	fraction: defaultFraction,
	post: defaultPost,
	digit: defaultDigit,
	symbol: defaultSymbol
};

export type AnimatedNumberTheme = typeof animatedNumberTheme;
export type AnimatedNumberThemeProps = InferComponentTheme<AnimatedNumberTheme>;
export const setAnimatedNumberTheme = setComponentTheme<AnimatedNumberTheme>('animated-number');
export const useAnimatedNumberTheme = useComponentTheme<AnimatedNumberTheme>(
	'animated-number',
	animatedNumberTheme
);
