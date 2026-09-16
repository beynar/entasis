import type { Density, DisclosureIndicator, Sizes } from '$lib/types/theme.js';
import type { Slot, WithSlot } from '../Slot/slot.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { ResponsiveProps } from '$lib/components/Theme/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { AccordionThemeProps } from './accordion.theme.js';

export type ConditionalKeys<Base, Condition> = NonNullable<
	{
		[Key in keyof Base]: Base[Key] extends Condition ? Key : never;
	}[keyof Base]
>;

export type AccordionProps<Item extends Record<string, unknown>> = WithAttachments<
	WithSlot<
		{
			/**
			 * The class name to apply to the accordion. First element appended into the DOM.
			 */
			class?: string;
			/**
			 * The items to display in the accordion. An array of anything.
			 */
			items: Item[];
			/** Bindable ids of the currently expanded items. */
			value?: string[];
			/** Initially expanded item ids when `value` is omitted. */
			defaultValue?: string[];
			/** Called after the expanded item ids change. */
			onValueChange?: (value: string[]) => void;
			/**
			 * Called after one item's open state changes. Receives the item, its index, and the
			 * resulting open state; `onValueChange` reports the whole expanded set.
			 */
			onItemOpenChange?: (payload: { item: Item; index: number; open: boolean }) => void;
			/**
			 * Whether the accordion should only allow one item to be open at a time.
			 */
			oneAtATime?: boolean;
			/**
			 * The key to use to get the title from the item. By default, the accordion will use the 'title' property of the item.
			 * Usefull if the title is a string but you can pass a slot to display a custom title.
			 */
			titleKey?: ConditionalKeys<Item, Slot>;
			/**
			 * The key to use to get the content from the item. By default, the accordion will use the 'content' property of the item.
			 * Usefull if the content is a string but you can pass a slot to display a custom content.
			 */
			contentKey?: ConditionalKeys<Item, Slot>;
			/**
			 * The key to use to get the description from the item. By default, the accordion will use the 'description' property of the item.
			 * Usefull if the description is a string but you can pass a slot to display a custom description.
			 */
			descriptionKey?: ConditionalKeys<Item, Slot>;
			/**
			 * The indicator marking the expand state: a rotating 'chevron' (default),
			 * a 'plus-minus' glyph, or 'none' to hide it. Pass a Slot for a custom icon.
			 */
			icon?: DisclosureIndicator | Slot;
			/**
			 * Size token controlling the typography scale (title, description,
			 * content text and icon).
			 */
			size?: Sizes;
			/**
			 * Spacing density controlling paddings and gaps (trigger padding,
			 * content padding, header gap, splitted gap). 'small' for dense
			 * lists, 'large' for roomy surfaces.
			 */
			density?: Density;
			/**
			 * Visual variant: 'classic' is the flat default (rows with a muted
			 * separator), 'card' wraps the rows in a raised surface, 'outline' in a
			 * muted border.
			 */
			variant?: 'classic' | 'card' | 'outline';
			/**
			 * Heading level announced for each item title (`aria-level` on the item heading).
			 * @default 3
			 */
			headingLevel?: 2 | 3 | 4 | 5 | 6;
			/**
			 * Breaks the list into one surface per item (with a gap) instead of a
			 * single shared container.
			 */
			splitted?: boolean;
			/**
			 * Slide transition overrides for the expanded content; supports responsive
			 * values and wins over the `motion` theme slot.
			 */
			transition?: ResponsiveProps<FSOProps>;
			/**
			 * Theme overrides for the accordion root and item sub-parts (header, trigger, title, description, icon, content).
			 */
			theme?: AccordionThemeProps;
			/**
			 * Whether the accordion should be accessible when not expanded.
			 * This is useful for screen readers to skip the content when not expanded.
			 */
			accessible?: boolean;
		},
		'title' | 'description' | 'content',
		{
			/** Current accordion item passed to the slot. */
			item: Item;
		}
	>
>;
