import type { Density } from '$lib/types/theme.js';
import type { Messages } from '$lib/i18n/en.js';
import type { InputProps } from '../Field/field.js';
import type { SelectThemeProps } from './select.theme.js';
import type { HTMLButtonAttributes } from 'svelte/elements';

export type SelectTriggerAttributes = Omit<
	HTMLButtonAttributes,
	| 'aria-activedescendant'
	| 'aria-controls'
	| 'aria-expanded'
	| 'aria-haspopup'
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
	items: SelectOption[];
};

/** Flat options and `{ label, items }` groups can be mixed freely. */
export type SelectItems = (SelectOption | SelectOptionGroup)[];

export type SelectProps = InputProps<'select'> & {
	/** Text shown in the trigger when no value is selected. */
	placeholder?: string;
	/** Theme overrides for the select trigger, dropdown, options, and field container. */
	theme?: SelectThemeProps & InputProps<'select'>['theme'];
	/** Items to display — flat `{ value, label }` entries and/or `{ label, items }` groups. */
	items?: SelectItems;
	/**
	 * Spacing density forwarded to the dropdown option rows (paddings, gaps, min-height).
	 * @default 'normal'
	 */
	density?: Density;
	/** Render separators between consecutive groups. */
	separators?: boolean;
	/** Native attributes applied to the combobox trigger button. */
	triggerAttrs?: SelectTriggerAttributes;
	/** Per-instance i18n overrides merged over the global catalog. */
	i18n?: Partial<Messages>;
};
