import type { Colors, Density, Sizes } from '$lib/types/theme.js';
import type { Slot, WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Messages } from '$lib/i18n/en.js';
import type { MetadataListThemeProps } from './metadataList.theme.js';

/** Rendering type of a metadata value; controls formatting and the value markup. */
export type MetadataListItemType =
	'text' | 'number' | 'boolean' | 'date' | 'url' | 'email' | 'phone' | 'chip' | 'chips';

/** Accepted raw value shapes for a metadata item. */
export type MetadataListValue = string | number | boolean | Date | string[] | null | undefined;

export type MetadataListItem = {
	/** Stable identity for the item; also the last-resort key label. */
	id?: string;
	/** Left-column label. Resolution order: key ?? title ?? id. */
	key?: string;
	/** Alias for key. */
	title?: string;
	/**
	 * Raw value; rendering depends on the resolved type. Read-only display data:
	 * MetadataList never writes item values, so there is no `defaultValue` counterpart.
	 */
	value?: MetadataListValue;
	/** Explicit rendering type; auto-detected from the value when omitted. */
	type?: MetadataListItemType;
	/** Icon rendered before the key label (string or snippet). */
	icon?: Slot;
	/** Chip color for boolean/chip/chips values. */
	color?: Colors;
	/** Explicit link target; overrides the derived url/mailto:/tel: href. */
	href?: string;
};

export type MetadataListItemPayload = {
	/** The source item being rendered. */
	item: MetadataListItem;
	/** Zero-based index of the item within `items`. */
	index: number;
	/** Type after auto-detection. */
	type: MetadataListItemType;
	/** Resolved key label. */
	label: string;
	/** Default localized string for the value (dates/numbers via Intl). */
	formatted: string;
};

type MetadataListBaseProps = {
	/** Bindable reference to the root element. */
	ref?: HTMLElement | null;
	/** Additional CSS classes for the root element. */
	class?: string;
	/** Key/value rows to display. */
	items?: MetadataListItem[];
	/** Size token controlling typography only — key/value/toggle text, key icons, and chip sizing. */
	size?: Sizes;
	/**
	 * Spacing density controlling all gaps — section, row, label/value, and
	 * chip-list gaps. 'normal' matches the previous normal-size spacing,
	 * 'small' the previous small, 'large' the previous large.
	 */
	density?: Density;
	/** Number of grid columns the items flow into. */
	columns?: number;
	/** When set and `items.length` exceeds it, the extra items collapse behind a "Show more" toggle. */
	maxItems?: number;
	/** Bindable open state of the "Show more" toggle. */
	expanded?: boolean;
	/** Initial open state of the "Show more" toggle when `expanded` is omitted. */
	defaultExpanded?: boolean;
	/** Per-instance i18n overrides merged over the global catalog. */
	i18n?: Partial<Messages>;
	/** Theme overrides for the metadata list parts. */
	theme?: MetadataListThemeProps;
};

export type MetadataListProps = WithAttachments<
	WithSlot<
		WithSlot<MetadataListBaseProps, 'title' | 'description'>,
		'key' | 'value',
		MetadataListItemPayload
	>
>;
