import type { Slot } from '$lib/components/Slot/slot.js';
import type { Colors } from '$lib/types/theme.js';
import type { Messages } from '$lib/i18n/en.js';
import type { InputProps } from '../Field/field.js';
import type {
	SliderFormatValue,
	SliderRangePayload,
	SliderValuePayload
} from './slider.state.svelte.js';
import type { SliderThemeProps } from './slider.theme.js';

export type SliderMarkPayload = SliderValuePayload & {
	mark: SliderMark;
};

export type SliderMark = {
	value: number;
	label?: Slot<SliderMarkPayload>;
};

export type SliderRangeLabelPayload = SliderRangePayload;
export type SliderMode = 'single' | 'range';
export type SliderVariant = 'default' | 'thick' | 'contained';

export type SliderProps = Omit<
	InputProps<'slider'>,
	'value' | 'defaultValue' | 'onValueChange' | 'onValidate'
> & {
	/** The field's value, bindable with `bind:value`; arrays render multiple thumbs. */
	value?: number | number[] | null;
	/** Initial field value when `value` is omitted. */
	defaultValue?: number | number[] | null;
	/** Minimum selectable value. */
	min?: number;
	/** Maximum selectable value. */
	max?: number;
	/** Value increment used by pointer and keyboard changes. */
	step?: number;
	/** Rendering mode; range defaults to two thumbs and range Form semantics. */
	mode?: SliderMode;
	/** Visual track style; contained places the label and optional value inside an input-like rail. */
	variant?: SliderVariant;
	/** Number of thumbs to render when value is null or a single number. */
	thumbs?: number;
	/** Horizontal or vertical track direction. */
	orientation?: 'horizontal' | 'vertical';
	/** Minimum distance between neighboring thumbs, expressed in step units. */
	minStepsBetweenThumbs?: number;
	/** Allows dragging the filled range segment when multiple thumbs are rendered. */
	dragRange?: boolean;
	/** Semantic color used for the filled track and thumb. */
	color?: Colors;
	/** Optional tick marks rendered below the track. */
	marks?: SliderMark[];
	/** Renders the current value beside the track. */
	showValue?: boolean;
	/** Formats the current value for the value label and aria-valuetext. */
	formatValue?: SliderFormatValue;
	/** Custom value label slot; receives the current value payload. */
	valueLabel?: Slot<SliderValuePayload>;
	/** Custom range label slot; receives the selected range payload. */
	rangeLabel?: Slot<SliderRangeLabelPayload>;
	/** Per-thumb accessible labels. */
	thumbLabels?: string[];
	/** Per-instance i18n overrides, merged over the global catalog. */
	i18n?: Partial<Messages>;
	/** Called whenever the field value changes. */
	onValueChange?: (value: number | number[] | null) => void;
	/** Validates the current value, returning error messages (or false) when invalid. */
	onValidate?: (value: number | number[]) => string[] | boolean;
	/** Theme overrides for slider parts and inherited Field parts. */
	theme?: SliderThemeProps & InputProps<'slider'>['theme'];
};
