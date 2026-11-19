import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

// `--thinking-orb-size` is INTERNAL: the root publishes the resolved size. It follows the `size`
// and `diameter` props, which are the public way to change it; a class sizing the root works
// too, since the drawing follows the root's box.
//
// The ink is the root's text colour: the drawing is painted with it, so a text colour class on
// the root recolours the orb.
const defaultRoot = cva({
	base: 'relative inline-block shrink-0 align-middle size-[var(--thinking-orb-size)] select-none',
	variants: {
		size: {
			small: '[--thinking-orb-size:1.25rem]',
			normal: '[--thinking-orb-size:2rem]',
			large: '[--thinking-orb-size:4rem]'
		},
		color: {
			primary: 'text-primary-readable',
			secondary: 'text-secondary-readable',
			danger: 'text-danger-readable',
			success: 'text-success-readable',
			warning: 'text-warning-readable',
			info: 'text-info-readable',
			neutral: 'text-neutral'
		}
	},
	defaultVariants: {
		size: 'normal',
		color: 'neutral'
	}
});

const defaultCanvas = cva({
	base: 'pointer-events-none absolute inset-0 block h-full w-full'
});

export const thinkingOrbTheme = {
	root: defaultRoot,
	canvas: defaultCanvas
};

export type ThinkingOrbTheme = typeof thinkingOrbTheme;
export type ThinkingOrbThemeProps = InferComponentTheme<ThinkingOrbTheme>;
export const setThinkingOrbTheme = setComponentTheme<ThinkingOrbTheme>('thinking-orb');
export const useThinkingOrbTheme = useComponentTheme<ThinkingOrbTheme>(
	'thinking-orb',
	thinkingOrbTheme
);
