import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// The countdown inherits its type from where it sits (a Stat value, a sentence, a badge), so the
// root only keeps the digits from shifting width as they tick.
const defaultCountdownRoot = cva({
	base: 'tabular-nums',
	variants: {
		format: {
			relative: '',
			clock: 'whitespace-nowrap'
		}
	},
	defaultVariants: {
		format: 'relative'
	}
});

// The clock digits are hidden from assistive technology; `spoken` reads every unit instead.
const defaultCountdownClock = cva({ base: '' });

const defaultCountdownSpoken = cva({ base: 'sr-only' });

export const countdownTheme = {
	root: defaultCountdownRoot,
	clock: defaultCountdownClock,
	spoken: defaultCountdownSpoken
};

export type CountdownTheme = typeof countdownTheme;
export type CountdownThemeProps = InferComponentTheme<CountdownTheme>;
export const setCountdownTheme = setComponentTheme<CountdownTheme>('countdown');
export const useCountdownTheme = useComponentTheme<CountdownTheme>('countdown', countdownTheme);
