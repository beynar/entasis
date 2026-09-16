import type { Colors, Sizes } from '$lib/types/theme.js';
import type { WithAttachments, WithoutAttachments } from '$lib/types/props.js';
import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { MenuItem } from '../Menu/index.js';
import type {
	ToggleButtonProps,
	ToggleButtonThemeProps,
	ToggleButtonVariant
} from '../ToggleButton/index.js';
import type {
	ToggleButtonGroupItem,
	ToggleButtonGroupThemeProps
} from '../ToggleButtonGroup/index.js';
import type { ToggleMenuThemeProps } from './toggleMenu.theme.js';

export type ToggleMenuGroupButton = ToggleButtonGroupItem;

export type ToggleMenuGroupButtons = ToggleMenuGroupButton[];

export type ToggleMenuRadioGroupButton = Pick<
	WithoutAttachments<ToggleButtonProps>,
	'label' | 'prefix' | 'suffix' | 'children' | 'disabled' | 'class'
> & {
	/** Value identifying this radio inside the group value. Must be unique. */
	value: string;
};

export type ToggleMenuRadioGroupButtons = ToggleMenuRadioGroupButton[];

export type ToggleMenuMenuItem = Pick<
	WithoutAttachments<ToggleButtonProps>,
	'label' | 'prefix' | 'suffix' | 'children' | 'size' | 'color' | 'variant' | 'disabled' | 'class'
> & {
	type: 'menu';
	/** Menu rows, or a reactive factory when row state changes independently of the toolbar items. */
	menu: MenuItem[] | (() => MenuItem[]);
	/** Whether selecting a leaf row closes the anchored menu. @default true */
	closeOnItemClick?: boolean;
	/** Theme overrides for the menu trigger button. */
	theme?: ToggleButtonThemeProps;
};

export type ToggleMenuCustomPayload = {
	/** Attach to the custom control's primary focusable element. */
	reference?: Attachment<HTMLElement>;
	/** Resolved toolbar or item size. */
	size?: Sizes;
	/** Resolved toolbar or item color. */
	color?: Colors;
	/** Resolved toolbar or item variant. */
	variant?: ToggleButtonVariant;
	/** Resolved disabled state. */
	disabled: boolean;
	/** Whether the logical unit currently lives in the More menu. */
	overflowed: boolean;
};

export type ToggleMenuToggleItem = Omit<WithoutAttachments<ToggleButtonProps>, 'type'> & {
	type: 'toggle';
};

export type ToggleMenuGroupItem = {
	type: 'group';
	/** Ordered button configurations. Each carries its own `value`; pressed state lives on the group value. */
	items: ToggleMenuGroupButtons;
	/** Accessible name for the group. */
	label: string;
	/** Pressed values of this group. */
	value?: string[];
	/** Initial pressed values when `value` is omitted. */
	defaultValue?: string[];
	/** Called with the updated pressed values after any button in this group toggles. */
	onValueChange?: (value: string[]) => void;
	joined?: boolean;
	size?: Sizes;
	color?: Colors;
	variant?: ToggleButtonVariant;
	disabled?: boolean;
	class?: string;
	theme?: ToggleButtonGroupThemeProps;
};

export type ToggleMenuRadioGroupItem = {
	type: 'radio-group';
	/** Ordered radio configurations. Each carries its own `value`. */
	items: ToggleMenuRadioGroupButtons;
	/** Accessible name for the radio group. */
	label: string;
	/** Checked value of this group. */
	value?: string;
	/** Initial checked value when `value` is omitted. */
	defaultValue?: string;
	/** Called with the newly checked value. */
	onValueChange?: (value: string) => void;
	joined?: boolean;
	size?: Sizes;
	color?: Colors;
	variant?: ToggleButtonVariant;
	disabled?: boolean;
	class?: string;
	theme?: ToggleButtonGroupThemeProps;
};

export type ToggleMenuCustomItem = {
	type: 'custom';
	/** Custom toolbar control. Attach payload.reference to its primary focusable element. */
	children: Snippet<[ToggleMenuCustomPayload]>;
	/** Explicit representation used when this logical unit moves into More. */
	overflowItems: MenuItem[] | (() => MenuItem[]);
	size?: Sizes;
	color?: Colors;
	variant?: ToggleButtonVariant;
	disabled?: boolean;
	class?: string;
};

export type ToggleMenuItem =
	| ToggleMenuToggleItem
	| ToggleMenuGroupItem
	| ToggleMenuRadioGroupItem
	| ToggleMenuMenuItem
	| ToggleMenuCustomItem;

export type ToggleMenuProps = WithAttachments<{
	/** Bindable ordered toggles, groups, menu buttons, and custom controls. Pressed state lives on the items. */
	items: ToggleMenuItem[];
	/** Accessible name for the toolbar. */
	label: string;
	/** Default size inherited by every item. */
	size?: Sizes;
	/** Default color inherited by every item. */
	color?: Colors;
	/** Default visual variant inherited by every item. */
	variant?: ToggleButtonVariant;
	/** When true, disables every item in the menu. */
	disabled?: boolean;
	/** Called once with the complete updated item list after any control state changes. */
	onItemsChange?: (items: ToggleMenuItem[]) => void;
	/** Class name on the root toolbar element. */
	class?: string;
	/** Theme overrides for the toolbar root, rail, units, and overflow trigger. */
	theme?: ToggleMenuThemeProps;
}>;
