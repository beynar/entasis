import type { Slot } from '../Slot/slot.js';
import type { Sizes } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { MenuProps } from '../Menu/menu.props.js';
import type { MenuBarThemeProps } from './menuBar.theme.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';

export type MenuBarMenu = Omit<MenuProps, 'focusOnMount'> & {
	/** Label rendered in the top-level menu trigger. */
	label: Slot;
	/** Optional content before the trigger label, usually an icon. */
	prefix?: Slot;
	/** Optional content after the trigger label. */
	suffix?: Slot;
	/** Prevents the menu from receiving focus or opening. */
	disabled?: boolean;
};

export type MenuBarProps = WithAttachments<{
	/** Top-level menus rendered from left to right. */
	menus: MenuBarMenu[];
	/** How this appears to AI agents under `<Theme webmcp>`: nothing to set for it to work, options to refine it, `false` to keep it from agents. */
	tool?: WebMCPToolProp;
	/** Size applied to every top-level trigger and to the menu each one drops. A per-menu
	 * `size` wins over it. */
	size?: Sizes;
	/** Text direction used by horizontal arrow-key navigation. */
	dir?: 'ltr' | 'rtl';
	/** Whether selecting a leaf item closes the active menu. */
	closeOnItemClick?: boolean;
	/** Class name applied to the menubar root. */
	class?: string;
	/** Theme overrides for the root and top-level triggers. */
	theme?: MenuBarThemeProps;
}>;
