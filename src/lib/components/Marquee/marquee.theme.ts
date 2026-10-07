import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// `--marquee-animation-*` is INTERNAL: the `pauseOnHover` and `reverse` variants use it to
// reach the track's animation. Consumers use the props, not the properties.
//
// `--gap` is the marquee's one spacing value. The size variant sets it from the spacing scale on
// the root; the track spaces its copies with it, every copy spaces its items with it, and the loop
// steps by one copy plus that same gap. Declaring it once is what keeps the loop seamless at every
// size and theme spacing factor — a copy that redeclared it would step by a different distance
// than the gap it is drawn with, and jump once per cycle. Respace a marquee by setting `--gap` on
// the root (`class="[--gap:…]"`), never on the copies.
const defaultMarquee = cva({
	base: 'group flex overflow-hidden relative gap-(--gap)',
	variants: {
		direction: {
			left: 'flex-row',
			up: 'flex-col'
		},
		size: {
			small: '[--gap:var(--space-md)]',
			normal: '[--gap:var(--space-xl)]',
			large: '[--gap:var(--layout-space-md)]'
		},
		fade: {
			true: 'scroll-fade-static',
			false: ''
		}
	},
	compoundVariants: [
		{ fade: true, direction: 'left', class: 'scroll-fade-x' },
		{ fade: true, direction: 'up', class: 'scroll-fade-y' }
	],
	defaultVariants: {
		direction: 'left',
		size: 'normal',
		fade: true
	}
});

const defaultInner = cva({
	base: 'flex shrink-0 justify-around gap-(--gap) whitespace-nowrap',
	variants: {
		direction: {
			left: 'flex-row animate-marquee-left',
			up: 'flex-col animate-marquee-up'
		},
		// The copy inherits the root's `--gap`; the variant stays so per-size theme overrides of
		// the copy keep a slot to land in.
		size: {
			small: '',
			normal: '',
			large: ''
		},
		pauseOnHover: {
			true: 'group-hover:[--marquee-animation-play-state:paused]',
			false: ''
		},
		reverse: {
			true: '[--marquee-animation-direction:reverse]',
			false: ''
		}
	},
	defaultVariants: {
		direction: 'left',
		size: 'normal',
		pauseOnHover: false,
		reverse: false
	}
});

export const marqueeTheme = {
	root: defaultMarquee,
	inner: defaultInner
};

export type MarqueeTheme = typeof marqueeTheme;
export type MarqueeThemeProps = InferComponentTheme<MarqueeTheme>;
export const setMarqueeTheme = setComponentTheme<MarqueeTheme>('marquee');
export const useMarqueeTheme = useComponentTheme<MarqueeTheme>('marquee', marqueeTheme);
