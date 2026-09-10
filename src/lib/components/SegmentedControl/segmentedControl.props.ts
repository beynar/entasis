import type { Slot } from '../Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { Snippet } from 'svelte';
import type { SegmentedControlThemeProps } from './segmentedControl.theme.js';

export type SegmentedControlVariant = 'normal' | 'pill';

export type SegmentedControlItem<Value extends string = string> = {
	/** Unique value used by the bound selection. */
	value: Value;
	/** Visible label rendered after the optional icon. */
	label?: Slot;
	/** Optional leading icon snippet. */
	icon?: Slot;
	/** Accessible name, especially useful for icon-only items. Defaults to the string label or value. */
	ariaLabel?: string;
	/** Prevents this item from being selected or focused. */
	disabled?: boolean;
};

export type SegmentedControlProps<
	Items extends readonly SegmentedControlItem[] = readonly SegmentedControlItem[]
> = WithAttachments<{
	/** Mutually exclusive options. Values must be unique. */
	items: Items;
	/** Selected item value. Bindable; defaults to the first enabled item. */
	value?: Items[number]['value'];
	/** Initial selected value when `value` is omitted. */
	defaultValue?: Items[number]['value'];
	/** Called when pointer or keyboard interaction changes the selected value. */
	onValueChange?: (value: Items[number]['value']) => void;
	/** Custom renderer receiving the original item object. */
	item?: Snippet<[Items[number]]>;
	/** Size applied to the track and every segment. */
	size?: Sizes;
	/** Semantic color applied to the active indicator and focus ring. */
	color?: Colors;
	/** Shape of the track and segments. */
	variant?: SegmentedControlVariant;
	/** Disables every segment. */
	disabled?: boolean;
	/** Accessible name for the radiogroup. */
	ariaLabel?: string;
	/** Additional classes on the root track. */
	class?: string;
	/** Theme overrides for the component parts. */
	theme?: SegmentedControlThemeProps;
}>;
