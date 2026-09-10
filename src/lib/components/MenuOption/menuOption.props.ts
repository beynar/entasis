import type { Sizes, Colors, Density } from '$lib/types/theme.js';
import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { MenuOptionThemeProps } from './menuOption.theme.js';

export type MenuOptionProps = WithAttachments<
	WithSlot<
		{
			/**
			 * The class name of the menu option. First element that the component outputs in the DOM.
			 */
			class?: string;
			/**
			 * The color of the menu option.
			 * @default 'primary'
			 */
			color?: Colors;
			/**
			 * The size of the menu option — scales typography and icons only.
			 * @default 'normal'
			 */
			size?: Sizes;
			/**
			 * Spacing density of the row — owns paddings, gaps and min-height.
			 * 'small' for dense menus, 'large' for roomy ones. Combine freely with size.
			 * @default 'normal'
			 */
			density?: Density;
			/**
			 * URL to navigate to. If provided, renders as an anchor element.
			 */
			href?: string;
			/**
			 * Link target attribute (only used when href is provided).
			 */
			target?: string;
			/**
			 * Link rel attribute (only used when href is provided).
			 */
			rel?: string;
			/** Native click event handler. */
			onclick?: (event: MouseEvent) => void;
			/** Native pointer enter event handler. */
			onpointerenter?: (event: PointerEvent) => void;
			/** Native pointer leave event handler. */
			onpointerleave?: (event: PointerEvent) => void;
			/**
			 * Custom element type to render. Overrides automatic element detection.
			 */
			as?: 'button' | 'a' | 'div';
			/**
			 * ARIA role override. Defaults to `button`/`link`/`menuitem` based on the element.
			 * Pass `option` when used inside a `listbox` (Command, Select, Combobox).
			 */
			role?: string;
			/**
			 * Highlighted (keyboard-active) state. When set, reflects to `data-highlighted` and drives
			 * the `highlight:` styling — used by the virtual-focus listbox family. Leave undefined in
			 * menus, where `useNavigation` sets `data-highlighted` on the element imperatively.
			 */
			highlighted?: boolean;
			/**
			 * Selected state — sets `aria-selected` and `data-selected` (for a check indicator passed
			 * via `suffix`). Used by single-select listboxes.
			 */
			selected?: boolean;
			/**
			 * Persistent highlight in the item's own `color` — e.g. a submenu trigger while its submenu
			 * is open. Independent of hover/keyboard highlight.
			 */
			active?: boolean;
			/**
			 * Disables the option: dims it, sets `aria-disabled`, and blocks pointer/click interaction.
			 */
			disabled?: boolean;
			/**
			 * Extra attributes/handlers spread onto the row element (`id`, `data-value`, `tabindex`,
			 * `onpointermove`, `onmousedown`, aria-*). Escape hatch for listbox wiring.
			 */
			attrs?: Record<string, unknown>;
			/**
			 * Custom theme overrides.
			 */
			theme?: MenuOptionThemeProps;
		},
		'children' | 'title' | 'description' | 'prefix' | 'suffix'
	>
>;
