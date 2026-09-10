import type { SliderProps } from '../Form/Slider/slider.props.js';
import { getMediaVolumeControlSliderTheme } from '../MediaVolume/mediaVolumeControl.slider.theme.js';

export const audioPlayerVolumeControlSliderTheme = {
	...getMediaVolumeControlSliderTheme('vertical'),
	valueLabel: { base: 'min-w-14 border-neutral-muted bg-surface text-center text-neutral' }
} satisfies NonNullable<SliderProps['theme']>;
