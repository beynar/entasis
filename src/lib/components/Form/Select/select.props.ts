import type { Density } from '$lib/types/theme.js';
import type { Messages } from '$lib/i18n/en.js';
import type { OpenChangeHandler } from '$lib/utils/openChange.js';
import type { InputProps } from '../Field/field.js';
import type { FieldValidatorResult } from '../Field/field.state.svelte.js';
import type { SelectThemeProps } from './select.theme.js';
import type { HTMLButtonAttributes, HTMLInputAttributes } from 'svelte/elements';

export type SelectTriggerAttributes = Omit<
	HTMLButtonAttributes,
	| 'aria-activedescendant'
	| 'aria-controls'
	| 'aria-expanded'
	| 'aria-haspopup'
	| 'aria-multiselectable'
	| 'aria-readonly'
	| 'aria-required'
	| 'class'
	| 'disabled'
	| 'id'
	| 'role'
	| 'type'
>;

export type SelectOption = {
	/** Option value submitted when this item is chosen. */
	value: string;
	/** Text label displayed for this option. */
	label: string;
	/** Disables this option — it renders dimmed and cannot be selected or highlighted. */
	disabled?: boolean;
};

export type SelectOptionGroup = {
	/** Optional group label rendered above the group's options. */
	label?: string;
	/** The options of the group. */
	items: readonly SelectOption[];
};

/**
 * Flat options and `{ label, items }` groups can be mixed freely. Readonly arrays are accepted,
 * so `as const` data type-checks.
 */
export type SelectItems = readonly (SelectOption | SelectOptionGroup)[];

/** Props shared by the single and the multiple Select. */
type SelectSharedProps = {
	/** Text shown in the trigger when no value is selected. */
	placeholder?: string;
	/**
	 * Id of the trigger button, which an external `<label for>` can target. Defaults to a
	 * generated id.
	 */
	id?: string;
	/** Items to display — flat `{ value, label }` entries and/or `{ label, items }` groups. */
	items?: SelectItems;
	/**
	 * Spacing density forwarded to the dropdown option rows (paddings, gaps, min-height).
	 * @default 'normal'
	 */
	density?: Density;
	/** Render separators between consecutive groups. */
	separators?: boolean;
	/**
	 * Open over the trigger with the selected option (or the first, when nothing is selected) on
	 * the value, its text lined up with the value's, like a native select. A list taller than the
	 * viewport is capped and pre-scrolled to keep the option there, and a `max-height` the theme
	 * puts on the list caps it further. Only mouse and keyboard opens align: a list opened by
	 * touch is a dropdown below the trigger. `false` opens a dropdown below the trigger always.
	 * @default true
	 */
	alignItemWithTrigger?: boolean;
	/**
	 * Adds a button that clears the selection, shown while something is selected and the Select
	 * is neither disabled nor read-only. Clearing sets a single Select to `null` and a multiple
	 * Select to `[]`, then returns focus to the trigger.
	 * @default false
	 */
	clearable?: boolean;
	/**
	 * Autofill token, such as `country` or `address-level1`. The Select then renders a visually
	 * hidden text input the browser can autofill; the filled text selects the option whose value
	 * matches, else whose label matches (ignoring case and accents). Autofill does not open the
	 * list and is ignored while disabled or read-only.
	 */
	autocomplete?: HTMLInputAttributes['autocomplete'];
	/** Native attributes applied to the combobox trigger button. */
	triggerAttrs?: SelectTriggerAttributes;
	/** Per-instance i18n overrides merged over the global catalog. */
	i18n?: Partial<Messages>;
	/** Controls whether the list is open; bindable for two-way control. */
	open?: boolean;
	/** Initial open state when `open` is not provided. */
	defaultOpen?: boolean;
	/**
	 * Called before the list opens or closes, with the requested state and the change details:
	 * `reason` (`'trigger-press'`, `'list-navigation'`, `'item-press'`, `'escape-key'`,
	 * `'outside-press'`, `'focus-out'`, `'close-press'`, `'imperative-action'`…), the originating `event`, the
	 * `trigger` element, the `interaction` type and `cancel()`. Calling `details.cancel()` keeps
	 * the list as it is. Inside the callback, `open` still holds the previous state.
	 */
	onOpenChange?: OpenChangeHandler;
	/** Called once per open, after the open transition finishes. */
	onAfterOpen?: () => void;
	/** Called once per close, after the close transition finishes. */
	onAfterClose?: () => void;
};

/** The value a Select holds: a string or `null`, or a list of strings when `multiple`. */
export type SelectValue<Multiple extends boolean = false> = Multiple extends true
	? readonly string[] | null
	: string | null;

/**
 * Props of Select. The `Multiple` parameter follows the `multiple` prop: a single Select (the
 * default) holds a string or `null`; `<Select multiple>` holds a list of values in item order
 * (field type `select-multiple`), stays open while options are toggled, and a native form submits
 * one hidden input per value under the same `name`.
 */
export type SelectProps<Multiple extends boolean = false> = Omit<
	InputProps<'select'>,
	'value' | 'defaultValue' | 'onValueChange' | 'onValidate' | 'theme'
> &
	SelectSharedProps & {
		/**
		 * Makes the Select hold several values: `value` is an array in item order (`readonly`
		 * arrays are accepted), `onValueChange` receives the new array, and the list stays open
		 * while options are toggled with a click, Enter or Space.
		 * @default false
		 */
		multiple?: Multiple;
		/** The selected value, bindable: a string or `null`, or an array when `multiple`. */
		value?: SelectValue<Multiple>;
		/** Initial value when `value` is omitted. */
		defaultValue?: SelectValue<Multiple>;
		/** Called whenever the selection changes, with the new value (the values in item order when `multiple`). */
		onValueChange?: (value: Multiple extends true ? string[] | null : string | null) => void;
		/**
		 * Validates the value; messages or true mark it invalid, false/null/undefined accept it.
		 * It may return a promise, as for every field.
		 */
		onValidate?: (value: Multiple extends true ? string[] : string) => FieldValidatorResult;
		/**
		 * With `multiple`: the text the trigger shows for the selected options, which arrive in
		 * item order. The default lists the first two labels followed by `+N` for the rest
		 * (`Apple, Banana +2`).
		 */
		formatValue?: (options: SelectOption[]) => string;
		/** Theme overrides for the select trigger, dropdown, options, and field container. */
		theme?: SelectThemeProps & InputProps<'select'>['theme'];
	};
