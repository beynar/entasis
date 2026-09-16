import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Slot } from '$lib/components/Slot/slot.js';
import type { MenuItem } from '$lib/components/Menu/menu.props.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Density, DisclosureIndicator, Sizes } from '$lib/types/theme.js';
import type { SidebarThemeProps } from './sidebar.theme.js';

export type SidebarDisplayState = 'expanded' | 'collapsed' | 'hidden';
export type SidebarState = SidebarDisplayState;
export type SidebarSide = 'left' | 'right';
/**
 * Sidebar geometry. `admin`, `floating`, `inset` and `split` sit on the canvas; `framed` is the
 * admin geometry for a sidebar hosted inside a raised card (AppShell `variant="framed"`), whose
 * well is `surface-recessed` so it reads as an inset of that card rather than as the canvas.
 */
export type SidebarVariant = 'admin' | 'floating' | 'inset' | 'split' | 'framed';
export type SidebarSize = Sizes;
export type SidebarDensity = Density;
export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none';
export type SidebarMode = 'layout' | 'panel';
export type SidebarFrame = 'viewport' | 'contained';
export type SidebarMenuButtonVariant = 'default' | 'outline';
export type SidebarMenuButtonSize = Sizes;
export type SidebarTooltipMode = 'auto' | 'always';
export type SidebarRail = boolean | 'line' | 'thumb';
export type SidebarMenuSide = 'top' | 'right' | 'bottom' | 'left';
export type SidebarMenuAlign = 'start' | 'center' | 'end';
export type SidebarIcon = Slot | string;
/** How an active row is painted. Soft is the shared selected recipe, solid its loud counterpart. */
export type SidebarActiveVariant = 'soft' | 'outline' | 'solid';
/** How a menu entry's leading icon is drawn: bare glyph, or a tinted rounded square around it. */
export type SidebarIconVariant = 'bare' | 'tile';

export type SidebarWidthChangePayload = {
	/** The sidebar's expanded width after the change. */
	width: string;
	/** True when the width changed because of direct pointer or keyboard input. */
	isUserInteraction: boolean;
};

export type SidebarResizableOptions = {
	/** Minimum expanded width before the sidebar collapses to icons. */
	minWidth?: string | number;
	/** Maximum expanded width. */
	maxWidth?: string | number;
	/** Width below which dragging collapses the sidebar. Defaults to 75% past minWidth. */
	collapseThreshold?: string | number;
	/** Keyboard resize step in pixels. */
	keyboardStep?: number;
	/** Optional localStorage key used to persist the expanded width. */
	storageKey?: string;
	/**
	 * Fires on every expanded-width change: continuously while the user resizes
	 * (`isUserInteraction: true`) and once when a stored width is restored
	 * (`isUserInteraction: false`).
	 */
	onWidthChange?: (payload: SidebarWidthChangePayload) => void;
};

export type SidebarResizable = boolean | SidebarResizableOptions;

export type SidebarApi = {
	/** Desktop open state. */
	readonly open: boolean;
	/** Expanded or collapsed desktop state. */
	readonly state: SidebarState;
	/** Semantic desktop display state, with offcanvas collapse reported as hidden. */
	readonly displayState: SidebarDisplayState;
	/** True while a hover peek renders the collapsed panel at full width over the page. */
	readonly isPeeking: boolean;
	/** Whether the viewport is below the mobile breakpoint. */
	readonly isMobile: boolean;
	/** Mobile drawer open state. */
	readonly openMobile: boolean;
	/** Collapse behavior used by the sidebar. */
	readonly collapsible: SidebarCollapsible;
	/** Side the sidebar is anchored to. */
	readonly side: SidebarSide;
	/** Toggle the mobile drawer or desktop sidebar depending on viewport. */
	toggle: () => void;
	/** Set the desktop open state. */
	setOpen: (open: boolean) => void;
	/** Set the semantic desktop display state. */
	setDisplayState: (state: SidebarDisplayState) => void;
	/** Set the mobile drawer open state. */
	setOpenMobile: (open: boolean) => void;
};

export type SidebarActivityBarItem = {
	/** Stable identity used as the render key. Defaults to the label and index. */
	id?: string;
	/** Icon rendered inside the square. Required: the row has no visible label. */
	icon: Slot | string;
	/** Accessible name, and the default tooltip text. */
	label: string;
	/** Link href. Renders an anchor instead of a button. */
	href?: string;
	/** Anchor target, used only with href. */
	target?: string;
	/** Anchor rel, used only with href. */
	rel?: string;
	/** Native click handler. */
	onclick?: (event: MouseEvent) => void;
	/** Whether this item represents the current page. Adds aria-current="page". */
	isActive?: boolean;
	/**
	 * Badge rendered at the outer top corner. An empty string renders a bare dot; any other
	 * value renders as the badge content. A string or number badge joins the accessible name;
	 * a dot is decorative, so put its meaning in `label`.
	 */
	badge?: Slot | string | number;
	/** Disable interaction. */
	disabled?: boolean;
	/** Tooltip text. Defaults to label; set false to suppress the tooltip. */
	tooltip?: string | false;
};

export type SidebarActivityBarSelectPayload = {
	/** The activated item. */
	item: SidebarActivityBarItem;
	/** Position in the rendered column, counting items then footerItems. */
	index: number;
};

export type SidebarActivityBar = {
	/** Items rendered from the top of the column. */
	items: SidebarActivityBarItem[];
	/** Items pinned to the end of the column. */
	footerItems?: SidebarActivityBarItem[];
	/** Custom content rendered before the first item. */
	header?: Snippet;
	/** Custom content rendered after the pinned items. */
	footer?: Snippet;
	/** Column thickness. Defaults to '3rem'. */
	width?: string;
	/** Accessible name for the column landmark. */
	label?: string;
	/** Fires when an item is activated, with the item and its position in one payload. */
	onSelect?: (payload: SidebarActivityBarSelectPayload) => void;
};

export type SidebarMenuActionDescriptor = {
	/** Trigger icon. Defaults to the horizontal dots icon. */
	icon?: SidebarIcon;
	/** Accessible label for the trigger. */
	label?: string;
	/** Icon-only ghost button scale. Defaults to the Sidebar size, so the trigger matches the row. */
	size?: Sizes;
	/** Menu items rendered in a PopupMenu. */
	menu?: MenuItem[];
	/** Native click handler for a plain action button, with the Sidebar API beside the event. */
	onclick?: (event: MouseEvent, api: SidebarApi) => void;
	/** Classes applied to the popup menu surface. */
	menuClass?: string;
	/** Preferred popup side. */
	menuSide?: SidebarMenuSide;
	/** Preferred popup alignment. */
	menuAlign?: SidebarMenuAlign;
};

export type SidebarMenuSubEntry = {
	/** Visible label. */
	label: string;
	/** Link href. */
	href?: string;
	/** Native click handler. */
	onclick?: (event: MouseEvent) => void;
	/** Leading icon. */
	icon?: SidebarIcon;
	/** Whether this entry represents the current page. */
	isActive?: boolean;
	/** Disable interaction. */
	disabled?: boolean;
	/** Submenu row geometry scale. Defaults to the Sidebar size. */
	size?: Sizes;
};

type SidebarMenuEntryBase = {
	/** Visible label. */
	label: string;
	/** Leading icon. */
	icon?: SidebarIcon;
	/** Role tint applied to the leading icon, through `data-color`. */
	iconColor?: Colors;
	/** Leading icon treatment. 'tile' paints a tinted rounded square around the glyph. */
	iconVariant?: SidebarIconVariant;
	/** Whether this entry represents the current page. */
	isActive?: boolean;
	/** Trailing badge hidden in icon-collapsed mode. */
	badge?: string | number;
	/** Tooltip text for icon-collapsed mode. Defaults to label. */
	tooltip?: string;
	/** Disable interaction. */
	disabled?: boolean;
	/** Button style. */
	variant?: SidebarMenuButtonVariant;
	/** Button size. */
	size?: SidebarMenuButtonSize;
	/** Classes applied to the row button. */
	class?: string;
	/** Nested entries rendered as an inline submenu. */
	items?: SidebarMenuSubEntry[];
	/** Classes applied to the popup menu surface. */
	menuClass?: string;
	/** Preferred popup side. */
	menuSide?: SidebarMenuSide;
	/** Preferred popup alignment. */
	menuAlign?: SidebarMenuAlign;
	/** Set false to render nested items as an always-open submenu. */
	collapsible?: boolean;
	/** Classes applied to this entry's submenu. */
	subClass?: string;
	/** Whether the submenu starts open. */
	defaultOpen?: boolean;
	/** Secondary action pinned to the row edge. */
	action?: Snippet<[SidebarApi]> | SidebarMenuActionDescriptor;
};

type SidebarMenuEntryNavigation = SidebarMenuEntryBase & {
	/** Link href. Mutually exclusive with menu. */
	href?: string;
	/** Native click handler. Mutually exclusive with menu. */
	onclick?: (event: MouseEvent) => void;
	/** Popup menu rows own the whole trigger, so they cannot also navigate. */
	menu?: never;
};

type SidebarMenuEntryMenu = SidebarMenuEntryBase & {
	/** Popup menu items rendered from the whole row. Mutually exclusive with href/onclick. */
	menu: MenuItem[];
	href?: never;
	onclick?: never;
};

export type SidebarMenuEntry = SidebarMenuEntryNavigation | SidebarMenuEntryMenu;

export type SidebarSearch = {
	/** Input placeholder. */
	placeholder?: string;
	/** Accessible label. */
	label?: string;
	/** Controlled input value. */
	value?: string;
	/** Native input handler. */
	oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
	/** Extra classes for the input. */
	class?: string;
};

export type SidebarTreeNode = {
	/** Visible name. */
	label: string;
	/** Icon override. */
	icon?: SidebarIcon;
	/** Leaf href. */
	href?: string;
	/** Native click handler. */
	onclick?: (event: MouseEvent) => void;
	/** Whether this node represents the current page. */
	isActive?: boolean;
	/** Whether this folder starts open. */
	defaultOpen?: boolean;
	/** Child nodes. */
	children?: SidebarTreeNode[];
};

export type SidebarGroup = {
	/** Group label. Hidden in icon-collapsed mode. */
	label?: string;
	/** Group actions pinned to the top-right corner. Pass an array to pin several. */
	action?: Snippet<[SidebarApi]> | SidebarMenuActionDescriptor | SidebarMenuActionDescriptor[];
	/** Menu entries in this group. */
	items?: SidebarMenuEntry[];
	/** Recursive tree nodes rendered instead of items. */
	tree?: SidebarTreeNode[];
	/** Whether the group itself can collapse. */
	collapsible?: boolean;
	/** Whether a collapsible group starts open. */
	defaultOpen?: boolean;
	/** Render a separator before this group when it is not first. */
	separator?: boolean;
	/** Classes applied to the group wrapper. */
	class?: string;
};

type SidebarMenuButtonItemBase = {
	/** Leading logo icon. Mutually exclusive with avatar. */
	icon?: SidebarIcon;
	/** Leading avatar data. */
	avatar?: { src?: string; alt?: string; fallback?: string };
	/** Visual row style. */
	variant?: 'default' | 'brand' | 'compact';
	/** Primary line. */
	title: string;
	/** Secondary line. Ignored for compact variant. */
	subtitle?: string;
	/**
	 * Trailing content. An icon is decorative; an action descriptor renders its own icon-only
	 * ghost button beside the row, so the row and its trailing control stay separately clickable.
	 * Defaults to a chevron when a menu is set.
	 */
	trailing?: SidebarIcon | false | SidebarMenuActionDescriptor;
	/** Preferred popup side. */
	menuSide?: SidebarMenuSide;
	/** Preferred popup alignment. */
	menuAlign?: SidebarMenuAlign;
	/** Classes applied to the popup menu surface. */
	menuClass?: string;
	/** Classes applied to PopupMenu option icons. */
	menuIconClass?: string;
	/** Render an identity row above menu items. */
	menuShowLabel?: boolean;
	/** Open trigger background style. */
	openStyle?: 'accent' | 'muted';
	/** Classes applied to the button, link, or trigger. */
	class?: string;
	/** Classes applied to the leading media. */
	mediaClass?: string;
};

type SidebarMenuButtonLinkItem = SidebarMenuButtonItemBase & {
	/** Link href. Mutually exclusive with menu/onclick. */
	href: string;
	menu?: never;
	onclick?: never;
};

type SidebarMenuButtonActionItem = SidebarMenuButtonItemBase & {
	/** Native click handler, with the Sidebar API beside the event. Mutually exclusive with menu/href. */
	onclick?: (event: MouseEvent, api: SidebarApi) => void;
	href?: never;
	menu?: never;
};

type SidebarMenuButtonMenuItem = SidebarMenuButtonItemBase & {
	/** Popup menu items. Mutually exclusive with href/onclick. */
	menu: MenuItem[];
	href?: never;
	onclick?: never;
};

export type SidebarMenuButtonItem =
	SidebarMenuButtonLinkItem | SidebarMenuButtonActionItem | SidebarMenuButtonMenuItem;

type SidebarOwnProps = {
	/** Bindable reference to the root wrapper or panel. */
	ref?: HTMLElement | null;
	/** Bindable desktop open state. */
	open?: boolean;
	/** Initial desktop open state when open is omitted. Defaults to true. */
	defaultOpen?: boolean;
	/** Fires once for each library-originated desktop open state change. */
	onOpenChange?: (open: boolean) => void;
	/** Bindable semantic desktop display state. */
	displayState?: SidebarDisplayState;
	/** Fires once for each library-originated semantic desktop display state change. */
	onDisplayStateChange?: (state: SidebarDisplayState) => void;
	/** Side the sidebar is anchored to. */
	side?: SidebarSide;
	/** Sidebar geometry and surface relationship. Inset uses an integrated navigation well; split uses detached surfaces. */
	variant?: SidebarVariant;
	/** Typography, icon, and item-height scale. */
	size?: SidebarSize;
	/** How active rows are painted. Defaults to 'soft', the shared selected recipe. */
	activeVariant?: SidebarActiveVariant;
	/** Spacing density for section padding, gaps, and nested navigation. */
	density?: SidebarDensity;
	/** Collapse behavior. Icon mode falls back to offcanvas when a data-driven row has no icon. */
	collapsible?: SidebarCollapsible;
	/** Render a full resizing layout or only the visible navigation panel. */
	mode?: SidebarMode;
	/** Use viewport sizing/fixed positioning or contained sizing/absolute positioning. */
	frame?: SidebarFrame;
	/** Text direction forwarded to the mobile drawer. */
	dir?: 'ltr' | 'rtl';
	/** Expanded desktop width. */
	width?: string;
	/** Enable pointer and keyboard resizing for the expanded sidebar width. */
	resizable?: SidebarResizable;
	/** Width when collapsed to icons. */
	widthIcon?: string;
	/** Mobile drawer width. */
	widthMobile?: string;
	/** Ctrl/Cmd shortcut key. Set false to disable. */
	keyboardShortcut?: string | false;
	/** Render an edge rail that toggles the sidebar. True uses the thin line style. */
	rail?: SidebarRail;
	/** Open hidden offcanvas sidebars when the pointer reaches the screen edge. */
	edgeReveal?: boolean;
	/** Temporarily expand an icon-collapsed sidebar while the pointer or focus is inside it. */
	expandOnHover?: boolean;
	/** Icon rail pinned outside the sidebar panel, visible in every display state. Layout mode only. */
	activityBar?: SidebarActivityBar;
	/** Items rendered in the scrollable body. Each item is a labelled sidebar group. */
	items?: SidebarGroup[];
	/** Classes applied to the outer wrapper. */
	class?: string;
	/** Indicator style for collapsible menu items. */
	collapseIcon?: DisclosureIndicator;
	/** Tooltip behavior for icon rows. */
	tooltips?: SidebarTooltipMode;
	/** Sticky top large menu row. */
	headerButton?: SidebarMenuButtonItem;
	/** Search box rendered in the header. */
	search?: SidebarSearch;
	/** Pinned menu rendered in the header. */
	headerMenu?: SidebarMenuEntry[];
	/** Sticky top custom content. */
	header?: Snippet<[SidebarApi]>;
	/** Custom scrollable nav body. Overrides items. */
	content?: Snippet<[SidebarApi]>;
	/** Sticky bottom large menu row. */
	footerButton?: SidebarMenuButtonItem;
	/** Pinned menu rendered in the footer. */
	footerMenu?: SidebarMenuEntry[];
	/** Sticky bottom custom content. */
	footer?: Snippet<[SidebarApi]>;
	/** Main content rendered beside the sidebar in layout mode. */
	children?: Snippet<[SidebarApi]>;
	/** Full-width bar rendered above the sidebar row. */
	banner?: Snippet<[SidebarApi]>;
	/** Per-instance theme overrides. */
	theme?: SidebarThemeProps;
};

type SidebarRootAttributes = Partial<
	Pick<HTMLAttributes<HTMLDivElement>, 'id' | 'style' | 'title'>
> & {
	[dataAttribute: `data-${string}`]: string | number | boolean | null | undefined;
};

export type SidebarProps = WithAttachments<SidebarRootAttributes & SidebarOwnProps>;
