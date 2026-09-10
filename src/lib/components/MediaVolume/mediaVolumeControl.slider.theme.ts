import type { SliderProps } from '../Form/Slider/slider.props.js';

export function getMediaVolumeControlSliderTheme(
	orientation: 'horizontal' | 'vertical'
): NonNullable<SliderProps['theme']> {
	return {
		root: {
			base: orientation === 'vertical' ? 'w-auto justify-items-center gap-0' : 'w-full gap-0'
		},
		header: {
			base: 'sr-only'
		},
		label: {
			base: 'sr-only'
		},
		inputContainer: {
			base: orientation === 'vertical' ? 'w-auto gap-0' : 'w-full gap-0'
		},
		control: {
			base: orientation === 'vertical' ? 'w-auto flex-col items-center gap-md' : 'w-full gap-md'
		},
		track: {
			base:
				orientation === 'vertical'
					? 'h-36 focus-visible:ring-offset-0'
					: 'min-w-0 focus-visible:ring-offset-0'
		},
		valueLabels: {
			base: orientation === 'vertical' ? 'mt-xs ml-0 justify-center' : 'ml-xs'
		},
		valueLabel: {
			base: 'min-w-14 text-center'
		}
	};
}
