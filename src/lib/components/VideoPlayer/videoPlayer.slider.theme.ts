import type { SliderProps } from '../Form/Slider/slider.props.js';

export function getVideoPlayerSliderTheme(
	orientation: 'horizontal' | 'vertical'
): SliderProps['theme'] {
	const isVertical = orientation === 'vertical';

	return {
		root: {
			base: isVertical ? 'w-auto justify-items-center gap-0' : 'w-full gap-0'
		},
		header: {
			base: 'sr-only'
		},
		label: {
			base: 'sr-only'
		},
		inputContainer: {
			base: isVertical ? 'w-auto gap-0 text-white' : 'w-full gap-0 text-white'
		},
		control: {
			base: isVertical ? 'w-auto flex-col items-center gap-md' : 'w-full gap-md'
		},
		track: {
			base: isVertical
				? 'h-36 text-primary focus-visible:ring-white/60 focus-visible:ring-offset-0'
				: 'min-w-0 text-primary focus-visible:ring-white/60 focus-visible:ring-offset-0'
		},
		trackBackground: {
			base: 'bg-white/25 [background:linear-gradient(to_right,rgba(255,255,255,0.35)_0_var(--video-player-slider-buffered),rgba(255,255,255,0.25)_var(--video-player-slider-buffered)_100%)]'
		},
		range: {
			base: 'bg-primary'
		},
		valueLabels: {
			base: isVertical ? 'mt-xs ml-0' : 'ml-xs'
		},
		valueLabel: {
			base: 'min-w-14 border-white/10 bg-white/10 text-center text-white'
		}
	};
}
