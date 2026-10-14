export { default as Slider } from './Slider.svelte';
export type {
	SliderMark,
	SliderMarkPayload,
	SliderMode,
	SliderProps,
	SliderRangeLabelPayload,
	SliderThumbCollisionBehavior,
	SliderVariant
} from './slider.props.js';
export { SliderState } from './slider.state.svelte.js';
export type {
	SliderFormatValue,
	SliderOrientation,
	SliderRangePayload,
	SliderValue,
	SliderValuePayload
} from './slider.state.svelte.js';
export {
	sliderTheme,
	setSliderTheme,
	useSliderTheme,
	type SliderTheme,
	type SliderThemeProps
} from './slider.theme.js';
