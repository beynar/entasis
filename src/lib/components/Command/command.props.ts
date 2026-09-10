import type { Snippet } from 'svelte';
import type { Density, Sizes } from '$lib/types/index.js';
import type { Slot, WithSlot } from '../Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { CommandThemeProps } from './command.theme.js';

/** A selectable command. `value` is the filter key + `onSelect` payload; `label` is the visible
 *  (and searchable) text. For rich rows (avatars, etc.) pass an `item` snippet to `<Command>`. */
export type CommandItem<Value extends string = string> = {
	/** Unique value — used for filtering, the option id, and the `onSelect` payload. */
	value: Value;
	/** Visible label. Also matched against the search query (alongside `value`/`keywords`). */
	label: string;
	/** Leading icon — a string or a snippet (typically an icon snippet from `$lib/components/Icons`). */
	icon?: Slot;
	/** Trailing keybind hint, e.g. `⌘K`. */
	shortcut?: string;
	/** Extra terms to match against the search query. */
	keywords?: string[];
	/** Disable selection/highlight. */
	disabled?: boolean;
	/** Render the row as a link. */
	href?: string;
	/** Fires when this item is chosen (click or Enter). */
	onSelect?: (value: Value) => void;
	/** Extra classes for the row. */
	class?: string;
};

/** A labelled group of commands. Omit `heading` for an unlabelled group. */
export type CommandGroup<Value extends string = string> = {
	/** Group heading rendered above the group's items. */
	heading?: string;
	/** The items of the group. */
	items: CommandItem<Value>[];
	/** Extra classes for the group container. */
	class?: string;
};

/** Payload passed to the `trigger`, `footer`, and `empty` slots. */
export type CommandSlotPayload = {
	/** Opens the palette dialog (dialog mode only). */
	open: () => void;
	/** Closes the palette dialog (dialog mode only). */
	close: () => void;
};

export type CommandProps<Value extends string = string> = WithAttachments<
	WithSlot<
		{
			/**
			 * The class name applied to the command root element.
			 */
			class?: string;
			/**
			 * The commands, grouped.
			 */
			items: CommandGroup<Value>[];
			/**
			 * Render the palette inside a modal Dialog instead of inline.
			 */
			dialog?: boolean;
			/**
			 * Dialog open state. Bindable. Dialog mode only.
			 */
			open?: boolean;
			/** Initial dialog open state when `open` is omitted. */
			defaultOpen?: boolean;
			/**
			 * Fires once after a library action changes the dialog state. External updates are silent.
			 */
			onOpenChange?: (open: boolean) => void;
			/**
			 * ⌘/Ctrl + this key toggles the dialog (e.g. `'k'`). `false` disables. Dialog mode only.
			 */
			shortcut?: string | false;
			/**
			 * Accessible (visually hidden) dialog title announced by screen readers. Dialog mode only.
			 */
			title?: string;
			/**
			 * Close the dialog when an item is selected. Dialog mode only.
			 */
			closeOnSelect?: boolean;
			/**
			 * Search query. Bindable.
			 */
			value?: string;
			/** Initial search query when `value` is omitted. */
			defaultValue?: string;
			/**
			 * Fires once after user input changes the search query. External updates are silent.
			 */
			onValueChange?: (value: string) => void;
			/**
			 * Search input placeholder.
			 */
			placeholder?: string;
			/**
			 * Render the search input row. Set `false` for externally controlled palettes.
			 */
			showInput?: boolean;
			/**
			 * Filter items by the search query internally. Set `false` to filter externally.
			 */
			shouldFilter?: boolean;
			/**
			 * Custom match predicate. Defaults to a case-insensitive substring match on `label` + `keywords` + `value`.
			 */
			filter?: (item: CommandItem<Value>, search: string) => boolean;
			/**
			 * Fires for any selected item, after the item's own `onSelect`.
			 */
			onSelect?: (value: Value) => void;
			/**
			 * Fires when keyboard, pointer, or item changes move the highlighted option.
			 */
			onHighlightChange?: (value: Value | undefined) => void;
			/**
			 * Custom row renderer — receives the item. Overrides the default icon/label/shortcut layout.
			 */
			item?: Snippet<[CommandItem<Value>]>;
			/**
			 * The size of the command palette (typography and spacing).
			 */
			size?: Sizes;
			/**
			 * Spacing density forwarded to the option rows (paddings, gaps, min-height).
			 * @default 'normal'
			 */
			density?: Density;
			/**
			 * Theme overrides for the command palette parts (command, input, list, group, item, ...).
			 */
			theme?: CommandThemeProps;
		},
		'empty' | 'trigger' | 'footer',
		CommandSlotPayload
	>
>;
