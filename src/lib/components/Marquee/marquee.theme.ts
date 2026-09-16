import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// `--marquee-animation-*` is INTERNAL: the `pauseOnHover` and `reverse` variants use it to
// reach the track's animation. Consumers use the props, not the properties.
const defaultMarquee = cva({
	base: 'group flex overflow-hidden relative',
	variants: {
		direction: {
			left: 'flex-row',
			up: 'flex-col'
		},
		size: {
			small: 'gap-md',
			normal: 'gap-xl',
			large: 'gap-layout-md'
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
	base: 'flex shrink-0 justify-around [--gap:1rem] whitespace-nowrap',
	variants: {
		direction: {
			left: 'flex-row animate-marquee-left',
			up: 'flex-col animate-marquee-up'
		},
		size: {
			small: 'gap-md',
			normal: 'gap-xl',
			large: 'gap-layout-md'
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
