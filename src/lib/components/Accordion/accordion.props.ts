import type { Density, DisclosureIndicator, Sizes } from '$lib/types/theme.js';
import type { Slot, WithSlot } from '../Slot/slot.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { ResponsiveProps } from '$lib/components/Theme/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { OpenChangeDetails } from '$lib/utils/openChange.js';
import type { AccordionThemeProps } from './accordion.theme.js';

export type ConditionalKeys<Base, Condition> = NonNullable<
	{
		[Key in keyof Base]: NonNullable<Base[Key]> extends Condition ? Key : never;
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
			/** Called after the expanded item ids change, with the new ids. */
			onValueChange?: (value: string[]) => void;
			/**
			 * Called before one item opens or closes. Receives the item, its index, the requested open
			 * state and the open-change `details`: `details.reason` says why (`trigger-press`, or
			 * `find-in-page` for the browser's find), `details.event` carries the DOM event, and
			 * `details.cancel()` keeps the item as it was (then `onValueChange` is not called).
			 * `onValueChange` reports the whole expanded set once the change is applied.
			 */
			onItemOpenChange?: (payload: {
				item: Item;
				index: number;
				open: boolean;
				details: OpenChangeDetails;
			}) => void;
			/**
			 * Called once each time an item finishes opening: after its slide, or at once when no
			 * animation runs (reduced motion, a zero duration, find-in-page). Not called for items open
			 * at the start.
			 */
			onItemAfterOpen?: (payload: { item: Item; index: number }) => void;
			/**
			 * Called once each time an item finishes closing: after its slide, at once when no
			 * animation runs, or when the panel is removed mid-close.
			 */
			onItemAfterClose?: (payload: { item: Item; index: number }) => void;
			/**
			 * Whether the accordion should only allow one item to be open at a time.
			 */
			oneAtATime?: boolean;
			/**
			 * Disables every item: the triggers get the native `disabled` attribute, leave the tab
			 * order and cannot be toggled.
			 */
			disabled?: boolean;
			/**
			 * The key whose boolean marks one item as disabled. By default the accordion reads the
			 * `disabled` property of each item. A disabled item's trigger has the native `disabled`
			 * attribute, so it is skipped by Tab and announced as unavailable.
			 */
			disabledKey?:
				ConditionalKeys<Item, boolean> | (string extends keyof Item ? keyof Item & string : never);
			/**
			 * Keeps collapsed panels in the DOM under `hidden="until-found"`, so the browser's
			 * find-in-page, text fragments and `#id` links can reach their content and open the item
			 * (reason `find-in-page`, no animation). Collapsed content stays out of the accessibility
			 * tree and the tab order until then. A disabled item is not findable: its collapsed panel
			 * stays under plain `hidden`, so the browser never opens it. A parent that refuses the
			 * change leaves the item closed.
			 * @default false
			 */
			hiddenUntilFound?: boolean;
			/**
			 * Keeps collapsed panels mounted under `hidden`, preserving their state (form values,
			 * scroll, media). Not findable by the browser; use `hiddenUntilFound` for that.
			 * @default false
			 */
			keepMounted?: boolean;
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
			 * Level of the heading element (`h2` to `h6`) that wraps each trigger button.
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
		},
		'title' | 'description' | 'content',
		{
			/** Current accordion item passed to the slot. */
			item: Item;
		}
	>
>;
