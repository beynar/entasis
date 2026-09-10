import type { Snippet } from 'svelte';
import type { WithSlot, Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { MenuItem, MenuProps } from '../Menu/menu.props.js';
import type { BreadcrumbsThemeProps } from './breadcrumbs.theme.js';
import type { Sizes } from '$lib/types/theme.js';
import type { MenuOptionProps } from '../MenuOption/menuOption.props.js';

export type BreadcrumbItemConfig = {
	/**
	 * The label text or snippet for the breadcrumb item.
	 */
	label: Slot;
	/**
	 * Optional URL to navigate to. If provided, renders as an anchor element.
	 */
	href?: string;
	/**
	 * Whether this breadcrumb item represents the current page.
	 * @default false
	 */
	active?: boolean;
	/**
	 * Whether the breadcrumb item is disabled.
	 * @default false
	 */
	disabled?: boolean;
	/** Native click event handler for the breadcrumb item. */
	onclick?: (event: MouseEvent) => void;
	/**
	 * Optional icon snippet to display before the label.
	 */
	icon?: Slot;
	/**
	 * Optional menu items for dropdown functionality.
	 * If provided, the breadcrumb will render as a PopupMenu.
	 */
	menu?: MenuItem[];
};

export type BreadcrumbItem = BreadcrumbItemConfig;

export type BreadcrumbsProps<Items extends BreadcrumbItem[]> = WithAttachments<
	WithSlot<
		{
			/**
			 * Optional custom item renderer.
			 */
			item?: Snippet<[Items[number]]>;
			/**
			 * Array of breadcrumb items to display.
			 */
			items: Items;
			/**
			 * Optional home breadcrumb item to prepend to the items array.
			 * If provided, it will be rendered as the first breadcrumb and will not be included in the ellipsis menu.
			 */
			home?: Omit<BreadcrumbItemConfig, 'menu' | 'label'> & { label?: Slot };
			/**
			 * Maximum number of items to show before using ellipsis.
			 * When set, shows first item, ellipsis, and last N items.
			 * If maxItems >= items.length, all items are shown (no ellipsis).
			 * @default undefined (show all items)
			 */
			maxItems?: number;
			/**
			 * Whether to show separators between items.
			 * @default true
			 */
			showSeparator?: boolean;
			/**
			 * The class name of the breadcrumbs container. First element that the component outputs in the DOM.
			 */
			class?: string;
			/**
			 * Custom theme overrides.
			 */
			theme?: BreadcrumbsThemeProps;

			/**
			 * Custom ellipsis renderer.
			 */
			ellipsis?: Snippet<[MenuItem[]]>;
		},
		'separator' | 'ellipsisIcon'
	>
>;
