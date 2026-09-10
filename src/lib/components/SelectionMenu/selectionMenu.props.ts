import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments, WithoutAttachments } from '$lib/types/props.js';
import type { PopoverProps, PopoverThemeProps } from '../Popover/index.js';
import type { ToggleMenuProps } from '../ToggleMenu/index.js';
import type { SelectionMenuThemeProps } from './selectionMenu.theme.js';

export type SelectionMenuTarget = HTMLElement | string | null;

export type SelectionMenuSelection = {
	/** Element containing both ends of the current document selection. */
	target: HTMLElement;
	/** Stable clone of the selected DOM range. */
	range: Range;
	/** Plain text represented by the selected range. */
	text: string;
};

export type SelectionMenuPayload = {
	/** Current selection. It is non-null whenever the menu is visible. */
	selection: SelectionMenuSelection | null;
	/** Resolved target element used to filter document selections. */
	target: HTMLElement | null;
	/** Dismisses the menu until the document selection changes. */
	close: () => void;
};

type ToggleMenuPassThroughProps = Pick<
	WithoutAttachments<ToggleMenuProps>,
	| 'value'
	| 'defaultValue'
	| 'ariaLabel'
	| 'color'
	| 'variant'
	| 'disabled'
	| 'onValueChange'
	| 'class'
	| 'theme'
>;

type SelectionMenuBaseProps = {
	/** Optional replacement for the ToggleMenu body while preserving the same selection tracker. */
	children?: Slot<SelectionMenuPayload>;
	/**
	 * Selection container. Omit it to use the component's parent, pass a selector resolved in the
	 * same document or shadow root, pass an element for an exact target, or pass null to disable it.
	 */
	target?: SelectionMenuTarget;
	/** Enables selection tracking and rendering. */
	enabled?: boolean;
	/** Preferred placement relative to the selected range. */
	position?: PopoverProps['position'];
	/** Gap in pixels between the selected range and the menu. */
	offset?: PopoverProps['offset'];
	/** Default ToggleMenu item size and Popover size. */
	size?: ToggleMenuProps['size'];
	/** Fly/scale opacity transition overrides passed to Popover. */
	transition?: PopoverProps['transition'];
	/** When true, the transition enters from the resolved placement. */
	directedTransition?: PopoverProps['directedTransition'];
	/** When true, Escape dismisses the menu until the selection changes. */
	closeOnEscape?: PopoverProps['closeOnEscape'];
	/** When true, clicking outside dismisses the menu until the selection changes. */
	closeOnClickOutside?: PopoverProps['closeOnClickOutside'];
	/** Additional classes merged onto the floating Popover panel. */
	popoverClass?: string;
	/** Additional classes merged onto the custom-content wrapper. */
	contentClass?: string;
	/** Called when a valid selection is created, changed, or cleared. */
	onSelectionChange?: (selection: SelectionMenuSelection | null) => void;
	/** Called after the opening transition completes. */
	onAfterOpen?: (selectionMenu: SelectionMenuPayload) => void;
	/** Called after the closing transition completes. */
	onAfterClose?: (selectionMenu: SelectionMenuPayload) => void;
	/** Theme overrides for the selection Popover panel and custom-content wrapper. */
	selectionTheme?: SelectionMenuThemeProps;
	/** Theme overrides passed to the underlying Popover. */
	popoverTheme?: PopoverThemeProps;
};

export type SelectionMenuProps = WithAttachments<
	SelectionMenuBaseProps & ToggleMenuPassThroughProps
>;
