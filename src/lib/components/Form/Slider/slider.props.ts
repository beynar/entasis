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
/**
 * What a thumb does when it meets a neighbour.
 *
 * - `none`: stops against the neighbour (and `minStepsBetweenThumbs`).
 * - `push`: moves the neighbour along, as long as there is room.
 * - `swap`: passes through; the thumbs trade places and focus follows the moving one.
 *
 * A disabled thumb never moves, and no other thumb passes or pushes it.
 */
export type SliderThumbCollisionBehavior = 'none' | 'push' | 'swap';

export type SliderProps = Omit<
	InputProps<'slider'>,
	'value' | 'defaultValue' | 'onValueChange' | 'onValidate'
> & {
	/**
	 * The field's value, bindable with `bind:value`. An array renders one thumb per entry and keeps
	 * its array shape, even with a single entry: `[25]` becomes `[26]`, never `26`.
	 */
	value?: number | number[] | null;
	/** Initial field value when `value` is omitted. */
	defaultValue?: number | number[] | null;
	/** Minimum selectable value. */
	min?: number;
	/** Maximum selectable value. */
	max?: number;
	/** Value increment used by pointer and keyboard changes. */
	step?: number;
	/**
	 * Amount PageUp, PageDown and Shift+Arrow change the value by; the result still snaps to
	 * `step`. Defaults to ten times `step`.
	 */
	largeStep?: number;
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
	/** What a thumb does when it meets a neighbour. @default 'none' */
	thumbCollisionBehavior?: SliderThumbCollisionBehavior;
	/**
	 * Disables individual thumbs by index. A disabled thumb keeps its value (and its place in the
	 * submitted value) but cannot be focused or moved, and it blocks the thumbs next to it. Range
	 * dragging is off while any thumb is disabled.
	 */
	thumbDisabled?: boolean[];
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
	/** Called whenever the field value changes, with the same scalar or array shape as `value`. */
	onValueChange?: (value: number | number[] | null) => void;
	/**
	 * Called when an interaction ends with a value that differs from the one it started with: on
	 * pointer release, on pointer cancel, after each accepted key press, and when assistive
	 * technology finishes an adjustment. It never fires for a no-op. The value has the same scalar
	 * or array shape as `value`. Use it to save on release instead of on every move.
	 */
	onValueCommit?: (value: number | number[]) => void;
	/** Validates the current value, returning error messages (or false) when invalid. */
	onValidate?: (value: number | number[]) => string[] | boolean;
	/** Theme overrides for slider parts and inherited Field parts. */
	theme?: SliderThemeProps & InputProps<'slider'>['theme'];
};
