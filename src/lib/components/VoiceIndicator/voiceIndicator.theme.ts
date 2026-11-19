import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

// `--voice-indicator-size` is INTERNAL: the root publishes the resolved size. It follows the
// `size` and `diameter` props, which are the public way to change it; a class sizing the root
// works too, since the drawing follows the root's box.
const defaultRoot = cva({
	base: 'relative inline-block shrink-0 align-middle size-[var(--voice-indicator-size)] select-none',
	variants: {
		size: {
			small: '[--voice-indicator-size:3rem]',
			normal: '[--voice-indicator-size:8rem]',
			large: '[--voice-indicator-size:14rem]'
		},
		interactive: {
			true: 'cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 outline-none transition-[scale,opacity] duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-focus/50 active:scale-(--motion-press-scale)',
			false: ''
		},
		disabled: {
			true: 'cursor-default opacity-50 active:scale-none',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		interactive: false,
		disabled: false
	}
});

// The engine sizes the canvas itself: a leaning ring is drawn wider than the root.
const defaultCanvas = cva({
	base: 'pointer-events-none absolute inset-y-0 left-0 block h-full w-full'
});

export const voiceIndicatorTheme = {
	root: defaultRoot,
	canvas: defaultCanvas
};

export type VoiceIndicatorTheme = typeof voiceIndicatorTheme;
export type VoiceIndicatorThemeProps = InferComponentTheme<VoiceIndicatorTheme>;
export const setVoiceIndicatorTheme = setComponentTheme<VoiceIndicatorTheme>('voice-indicator');
export const useVoiceIndicatorTheme = useComponentTheme<VoiceIndicatorTheme>(
	'voice-indicator',
	voiceIndicatorTheme
);
