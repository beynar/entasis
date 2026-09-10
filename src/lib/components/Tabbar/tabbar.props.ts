import type { Sizes, Colors } from '$lib/types/theme.js';
import type { Snippet } from 'svelte';
import type { WithAttachments } from '$lib/types/props.js';
import type { TabbarThemeProps } from './tabbar.theme.js';
import type { HTMLAttributes } from 'svelte/elements';

export type TabAlignment = 'start' | 'center' | 'end';
export type TabOrientation = 'horizontal' | 'vertical';
export type TabbarPosition = 'top' | 'bottom' | 'left' | 'right';
export type TabbarVariant = 'underline' | 'pill';

/**
 * A tab item can be either:
 * - A simple string (label only)
 * - An object with label, optional prefix/suffix snippets, optional href, and optional disabled state
 */
export type TabItem =
	| string
	| {
			/**
			 * The label of the tab. Can be a string or a Snippet for custom rendering.
			 */
			label: string | Snippet;
			/**
			 * Optional prefix content (typically an icon).
			 */
			prefix?: Snippet;
			/**
			 * Optional suffix content (typically an icon or badge).
			 */
			suffix?: Snippet;
			/**
			 * Optional URL to navigate to. If provided, the tab renders as a link.
			 */
			href?: string;
			/**
			 * Whether this tab is disabled.
			 * @default false
			 */
			disabled?: boolean;
			/**
			 * Link target attribute (only used when href is provided).
			 */
			target?: string;
			/**
			 * Link rel attribute (only used when href is provided).
			 */
			rel?: string;
			/**
			 * Entries shown in a popover menu opened by this tab (overflow pattern).
			 * Selecting an entry activates this tab and displays the entry's label on
			 * it; the tab's own label is used as the menu header.
			 */
			menu?: string[];
			/**
			 * Called with the selected entry index when a menu entry is picked
			 * (only used when menu is provided).
			 */
			onMenuSelect?: (menuIndex: number) => void;
	  };

type TabbarRootAttributes = Omit<
	HTMLAttributes<HTMLDivElement>,
	'children' | 'class' | 'role' | 'aria-orientation'
>;

export type TabbarProps = WithAttachments<
	TabbarRootAttributes & {
		/** Bindable reference to the tab list element. */
		ref?: HTMLDivElement | null;
		/**
		 * Items to render as tabs. Each item can be a simple string or an object with label, prefix, suffix, href, and disabled properties.
		 */
		items: TabItem[];
		/**
		 * The index of the currently active tab. This is bindable.
		 * @default 0
		 */
		value?: number;
		/** Initial active tab index when `value` is omitted. */
		defaultValue?: number;
		/**
		 * Callback function called when the active tab changes.
		 * Receives the new tab index as an argument.
		 */
		onValueChange?: (value: number) => void;
		/**
		 * The size of the tabs.
		 * @default 'normal'
		 */
		size?: Sizes;
		/**
		 * The orientation of the tabbar.
		 * @default 'horizontal'
		 */
		orientation?: TabOrientation;
		/**
		 * The color scheme of the tabs.
		 * @default 'primary'
		 */
		color?: Colors;
		/**
		 * The alignment of the tabs within the container.
		 * @default 'start'
		 */
		alignment?: TabAlignment;
		/**
		 * The position of the tabbar (affects underline indicator placement).
		 * @default 'top'
		 */
		position?: TabbarPosition;
		/**
		 * Visual variant: 'underline' shows a sliding bar along the tab edge;
		 * 'pill' renders a rounded track where the active tab is a raised pill that
		 * slides between tabs with the same animation.
		 * @default 'underline'
		 */
		variant?: TabbarVariant;
		/**
		 * Additional CSS classes for the tabbar container.
		 */
		class?: string;
		/**
		 * Custom theme overrides.
		 */
		theme?: TabbarThemeProps;

		/**
		 * Whether the tabbar should be full width.
		 * @default false
		 */
		fullWidth?: boolean;
		/**
		 * Applies the shared scroll-fade utility when the tab list overflows.
		 * @default true
		 */
		scrollFade?: boolean;
	}
>;
