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
	ToggleButtonGroupItems,
	ToggleButtonGroupThemeProps,
	ToggleButtonGroupValue
} from '../ToggleButtonGroup/index.js';
import type { ToggleMenuThemeProps } from './toggleMenu.theme.js';

export type ToggleMenuGroupButtons = ToggleButtonGroupItems;

export type ToggleMenuRadioGroupButton = Pick<
	WithoutAttachments<ToggleButtonProps>,
	'ariaLabel' | 'prefix' | 'suffix' | 'children' | 'disabled' | 'class'
>;

export type ToggleMenuRadioGroupButtons = Record<string, ToggleMenuRadioGroupButton>;

export type ToggleMenuMenuItem = Pick<
	WithoutAttachments<ToggleButtonProps>,
	| 'ariaLabel'
	| 'prefix'
	| 'suffix'
	| 'children'
	| 'size'
	| 'color'
	| 'variant'
	| 'disabled'
	| 'class'
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

export type ToggleMenuGroupItem<Items extends ToggleMenuGroupButtons = ToggleMenuGroupButtons> = {
	type: 'group';
	items: Items;
	ariaLabel: string;
	value?: ToggleButtonGroupValue<Items>;
	defaultValue?: ToggleButtonGroupValue<Items>;
	onValueChange?: (value: ToggleButtonGroupValue<Items>) => void;
	joined?: boolean;
	size?: Sizes;
	color?: Colors;
	variant?: ToggleButtonVariant;
	disabled?: boolean;
	class?: string;
	theme?: ToggleButtonGroupThemeProps;
};

export type ToggleMenuRadioGroupItem<
	Items extends ToggleMenuRadioGroupButtons = ToggleMenuRadioGroupButtons
> = {
	type: 'radio-group';
	items: Items;
	ariaLabel: string;
	value?: Extract<keyof Items, string>;
	defaultValue?: Extract<keyof Items, string>;
	onValueChange?: (value: Extract<keyof Items, string>) => void;
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
	/** Bindable ordered toggles, groups, menu buttons, and custom controls. */
	value?: ToggleMenuItem[];
	/** Initial toolbar value when `value` is omitted. */
	defaultValue?: ToggleMenuItem[];
	/** Accessible name for the toolbar. */
	ariaLabel: string;
	/** Default size inherited by every item. */
	size?: Sizes;
	/** Default color inherited by every item. */
	color?: Colors;
	/** Default visual variant inherited by every item. */
	variant?: ToggleButtonVariant;
	/** When true, disables every item in the menu. */
	disabled?: boolean;
	/** Called once with the complete updated value after any control state changes. */
	onValueChange?: (value: ToggleMenuItem[]) => void;
	/** Class name on the root toolbar element. */
	class?: string;
	/** Theme overrides for the toolbar root, rail, units, and overflow trigger. */
	theme?: ToggleMenuThemeProps;
}>;
