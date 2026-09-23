export const sidebarDescription = `
# Sidebar Component

Sidebar navigation with data-driven groups, icon collapse, mobile drawer behavior,
recursive tree groups, header/footer rows, search, actions, and snippet escape hatches.

## Import

\`\`\`svelte
<script lang="ts">
	import { Sidebar, type SidebarGroup } from 'entasis/sidebar';
</script>
\`\`\`

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { Sidebar, type SidebarGroup } from 'entasis/sidebar';
	import { houseIcon } from 'entasis/icons/house';
	import { gearIcon } from 'entasis/icons/gear';

	const items: SidebarGroup[] = [
		{
			label: 'Workspace',
			items: [
				{ label: 'Dashboard', href: '/', icon: houseIcon, isActive: true },
				{ label: 'Settings', href: '/settings', icon: gearIcon }
			]
		}
	];
</script>

<Sidebar items={items}>
	{#snippet children({ toggle })}
		<header>
			<button type="button" onclick={toggle}>Toggle</button>
		</header>
		<main>Page content</main>
	{/snippet}
</Sidebar>
\`\`\`

## AI-Safe Usage Contract

1. Use \`items\` for normal navigation. Use \`content\` only when data-driven rows cannot express the layout.
2. Use local Entasis icon snippets such as \`houseIcon\`, not Lucide component constructors.
3. Use \`MenuItem[]\` from \`entasis/menu\` for \`menu\` and action dropdowns.
4. Do not combine \`menu\` with \`href\` or \`onclick\` on the same row; use \`action\` for a trailing row menu.
5. Keep \`children\`, \`header\`, \`content\`, \`footer\`, \`banner\`, and action snippets pure; they receive \`SidebarApi\`.
6. Use \`collapsible="icon"\` for icon rail behavior, \`collapsible="offcanvas"\` for hidden desktop panels, and \`collapsible="none"\` for fixed sidebars. Icon collapse automatically falls back to offcanvas when any data-driven row lacks an icon.
7. Offcanvas sidebars reveal over the content from the screen edge by default when hidden; set \`edgeReveal={false}\` to disable that. A revealed hidden sidebar keeps its resize handle and dismisses through a small rectangular pointer tolerance.
8. Set \`keyboardShortcut={false}\` when embedding Sidebar inside another shortcut-heavy surface.
9. Sidebar owns navigation, resize mechanics, the lower application wall, and variant surface geometry. AppShell forwards its variant and composes PageShell inside that surface.
10. Use \`size\` for typography, icon scale, and item height. Use \`density\` independently for section padding, gaps, and submenu spacing.
11. Use \`activityBar\` for a persistent icon rail outside the panel (section switching, workspaces). Every item needs an \`icon\` and a \`label\`; the label is the accessible name and the tooltip. It is layout mode only: \`mode="panel"\` renders the navigation panel alone.
12. Use \`expandOnHover\` only with \`collapsible="icon"\`. It is a temporary peek, not a toggle: the persisted collapsed state never changes, while the peeked panel renders with expanded semantics.

## Data Model

### SidebarGroup
- **label**: string - Group label, hidden in icon-collapsed mode.
- **items**: SidebarMenuEntry[] - Menu rows.
- **tree**: SidebarTreeNode[] - Recursive tree rows instead of menu items.
- **action**: SidebarMenuActionDescriptor | SidebarMenuActionDescriptor[] | Snippet<[SidebarApi]> - Top-right group actions. Pass an array to pin several affordances (a \`+\` and a drag handle) to one group header; each renders as its own icon-only ghost button.
- **collapsible**: boolean - Makes the group label a toggle.
- **defaultOpen**: boolean - Initial collapsible group state.
- **separator**: boolean - Divider before the group.

### SidebarMenuEntry
- **label**: string - Visible row label.
- **icon**: SidebarIcon - Entasis icon snippet or string.
- **iconColor**: Colors - Role tint for the leading icon, applied through \`data-color\`.
- **iconVariant**: 'bare' | 'tile' - Leading icon treatment. \`tile\` paints a rounded square (\`bg-color-muted text-color-muted-readable\`) around the glyph, so per-project colour chips come from the role scale instead of hand-built markup.
- **href**: string - Render as an anchor. Mutually exclusive with menu.
- **onclick**: (event: MouseEvent) => void - Native click handler for button or anchor rows. Mutually exclusive with menu.
- **isActive**: boolean - Adds active styling and \`aria-current="page"\`.
- **disabled**: boolean - Disables button rows and marks anchor rows disabled.
- **badge**: string | number - Trailing count/status, hidden in icon mode.
- **tooltip**: string - Entasis Tooltip content in icon mode. Defaults to label.
- **items**: SidebarMenuSubEntry[] - Inline nested menu.
- **collapsible**: boolean - Set false for an always-open submenu.
- **defaultOpen**: boolean - Initial nested menu state.
- **menu**: MenuItem[] - Popup menu opened from the full row. Mutually exclusive with href/onclick.
- **action**: SidebarMenuActionDescriptor | Snippet<[SidebarApi]> - Hover/focus trailing action.

### SidebarActivityBar
Icon rail pinned to the outer edge of the sidebar, visible in every display state.
- **items**: SidebarActivityBarItem[] - Items rendered from the top.
- **footerItems**: SidebarActivityBarItem[] - Items pinned to the end of the column.
- **header** / **footer**: Snippet - Custom content before the first item and after the pinned ones.
- **width**: string (default '3rem') - Column thickness, published as \`--sidebar-width-activity\`.
- **label**: string - Accessible name for the column landmark. Set it whenever the panel also renders navigation.
- **onSelect**: ({ item, index }) => void - Fires after an item is activated. \`index\` counts \`items\` then \`footerItems\`.

### SidebarActivityBarItem
- **icon**: SidebarIcon (required) - Icon rendered in the square.
- **label**: string (required) - Accessible name and default tooltip; the square shows no text.
- **id**: string - Stable render key.
- **href** / **target** / **rel** - Render an anchor instead of a button.
- **onclick**: (event: MouseEvent) => void - Native click handler.
- **isActive**: boolean - Adds active styling and \`aria-current="page"\`.
- **badge**: string | number | Snippet - Corner badge pinned to the outer top corner. An empty string renders a bare dot. A string or number badge joins the accessible name (\`"Alerts, 3"\`); a dot and a Snippet badge are decorative, so put their meaning in \`label\`.
- **disabled**: boolean - Blocks activation and skips the item during keyboard navigation.
- **tooltip**: string | false - Tooltip override; \`false\` suppresses it.

### SidebarMenuButtonItem
Use for \`headerButton\`, \`footerButton\`, or direct \`<SidebarMenuButton />\` rows.
- **icon**: SidebarIcon - Leading logo/icon.
- **avatar**: { src?: string; alt?: string; fallback?: string } - Leading avatar.
- **variant**: 'default' | 'brand' | 'compact'.
- **title**: string - Primary text.
- **subtitle**: string - Secondary text.
- **trailing**: SidebarIcon | false | SidebarMenuActionDescriptor - Trailing content. An icon is decorative; an action descriptor (\`{ icon, label, onclick }\`, the same shape as a group action) renders its own icon-only ghost button beside the row, so a workspace card can carry its own collapse control without a custom \`header\` snippet. Descriptor handlers are \`onclick(event, api)\`, so \`api.toggle()\` is reachable.
- **href** / **onclick** / **menu** - Choose link, button, or popup behavior. \`onclick(event, api)\` receives the SidebarApi beside the event, so \`api.toggle()\` is reachable from the row itself.
- **menuIconClass**: string - Class override for option icons inside the popup menu.

## Props

### State
- **open**: boolean (bindable, default true) - Desktop expanded state.
- **defaultOpen**: boolean (default true) - Initial desktop state when \`open\` is omitted.
- **onOpenChange**: (open: boolean) => void - Called once for a library-originated desktop state change. Repeated requests and parent prop updates stay silent.
- **onDisplayStateChange**: (state: SidebarDisplayState) => void - Called once for a library-originated semantic display-state change.
- **api.displayState**: 'expanded' | 'collapsed' | 'hidden' - Semantic desktop state; hidden means closed offcanvas. A hover peek does not change it.
- **api.isPeeking**: boolean - True while a hover peek renders the collapsed panel at full width. Read it alongside \`displayState\` when a snippet hides content in icon mode.
- **keyboardShortcut**: string | false (default 'b') - Ctrl/Cmd shortcut key.

### Layout
- **side**: 'left' | 'right' - Desktop and mobile side.
- **variant**: 'admin' | 'floating' | 'inset' | 'split' | 'framed' - Sidebar geometry. \`framed\` is the admin geometry for a sidebar hosted inside a raised card (AppShell variant framed), with a \`surface-recessed\` well. \`admin\` renders the conventional full-height navigation column; \`inset\` integrates navigation into the lower wall with an inset content surface; \`split\` renders detached sidebar and content surfaces.
- **size**: 'small' | 'normal' | 'large' (default 'normal') - Typography, icon, avatar, badge, leading-media, item-height, and search-height scale.
- **iconSize**: 'small' | 'normal' | 'large' - Icon and leading-media scale inside the panel on its own; defaults to \`size\`. Menu rows, sub rows, group labels and the header button follow it; the activity bar keeps \`size\`.
- **activeVariant**: 'soft' | 'outline' | 'solid' (default 'soft') - How active rows are painted. \`soft\` is the shared selected recipe (\`selectedSoft\`: \`bg-selected-muted text-selected-muted-readable\`), \`solid\` its loud counterpart (\`selectedSolid\`: \`bg-selected text-selected-contrast\`), \`outline\` a bordered surface card (\`bg-surface border border-neutral-muted text-neutral\`) that reads as a raised card on a tinted well. Each row carries the choice as \`data-active-variant\`, so no descendant selector is needed to restyle selection.
- **density**: 'compact' | 'normal' | 'comfortable' (default 'normal') - Section padding, group padding, gaps, horizontal inset, and submenu spacing.
- **collapsible**: 'offcanvas' | 'icon' | 'none' - Collapse behavior. Icon mode requires icons on every data-driven row and otherwise resolves to offcanvas.
- **collapseIcon**: DisclosureIndicator — 'chevron' | 'plus-minus' | 'none' (default 'chevron') - Disclosure indicator drawn on collapsible menu rows. 'none' renders no indicator.
- **mode**: 'layout' | 'panel' - Full resizing layout or only the visible navigation panel.
- **frame**: 'viewport' | 'contained' - Standalone Sidebar positioning. Viewport mode uses Theme's dynamic window-height token; contained mode fills a positioned parent.
- **width**: string - Expanded width.
- **widthIcon**: string - Icon-collapsed width.
- **widthMobile**: string - Mobile drawer width.
- **rail**: boolean | 'line' | 'thumb' - Edge toggle rail. \`true\` keeps the thin line style; \`thumb\` renders a short visible handle with the same full-height hitbox. The appearance is preserved when the rail shares the resize control.
- **activityBar**: SidebarActivityBar - Icon rail pinned outside the panel, in layout mode only (\`mode="panel"\` renders the panel alone and ignores it). It never slides off screen: only the panel takes the offcanvas offset, and the reserved layout column is the panel width plus the rail width. On mobile it renders as a horizontal row at the top of the drawer.
- **expandOnHover**: boolean (default false) - With \`collapsible="icon"\`, hovering or focusing into the collapsed panel expands it to \`width\` over the page (\`data-peek="true"\`) while the reserved column stays at \`widthIcon\`, so page content does not reflow. The persisted collapsed state is untouched, and the peeked panel renders exactly like an expanded one: group headers, badges, search, inline submenus, and inline tree branches all come back, and the rail or resize handle travels to its inner edge.
- **edgeReveal**: boolean (default true) - Pointer/focus edge preview for hidden offcanvas sidebars. Hover reveal overlays content, remains resizable when configured, and re-hides after the pointer leaves its small rectangular tolerance. Dragging the sidebar closed suppresses immediate hover reopening until the pointer leaves the edge trigger; toggle/click opens persistently.
- **resizable**: boolean | SidebarResizableOptions - Enables pointer and keyboard resizing while expanded, icon-collapsed, or temporarily edge-revealed. By default, collapse requires dragging 75% of \`minWidth\` beyond the minimum; override \`collapseThreshold\` for a custom boundary. Use \`storageKey\` to restore and persist the expanded width across sessions.
  - \`onWidthChange({ width, isUserInteraction })\` reports every expanded-width change with one named payload: continuously while the user resizes (\`isUserInteraction: true\`) and once when a stored width is restored (\`isUserInteraction: false\`).

### Content
- **items**: SidebarGroup[] - Data-driven body navigation.
- **headerButton** / **footerButton**: SidebarMenuButtonItem - Sticky large rows.
- **search**: SidebarSearch - Header search input; use its native \`oninput\` handler.
- **headerMenu** / **footerMenu**: SidebarMenuEntry[] - Sticky quick menus.
- Menu entries and nested entries accept \`size: 'small' | 'normal' | 'large'\` for row geometry.
- **header**, **content**, **footer**, **children**, **banner**: Snippet<[SidebarApi]> - Escape hatches. The \`header\` snippet renders **first** in the header region, above \`headerButton\`, \`search\` and \`headerMenu\`.

### Styling
- **class**: string - Classes applied to the Sidebar root.
- **theme**: SidebarThemeProps - Semantic part overrides such as \`panel\`, \`header\`, \`nav\`, \`footer\`, menu, search, rail, and mobile drawer parts.

## Motion

- **motion** theme slot: the y-axis slide shared by collapsible groups, inline submenus, and
  tree branches. Takes \`in\` / \`out\` slide params plus a \`duration\` / \`easing\` motion token.
- Ladder: \`<Theme components={{ sidebar: { motion } }}>\` → \`setSidebarTheme({ motion })\` →
  \`theme.motion\`. Reduced motion collapses it to 0.

## Accessibility

- The body navigation renders inside a named \`<nav>\` landmark (\`data-sidebar="nav"\`), so assistive tech can jump straight to it and tell it apart from the activity bar's own landmark.
- Active links set \`aria-current="page"\`.
- Collapsible rows and groups set \`aria-expanded\`.
- Disabled buttons use \`disabled\`; disabled links omit \`href\`, use \`aria-disabled\` and \`tabindex=-1\`, and block activation.
- Mobile drawer includes a backdrop button labelled "Close Sidebar".
- Icon-collapsed rows keep their labels mounted and visually fade them, preserving accessible names and stable icon geometry.
- Search, group controls, actions, and nested rows become inert before collapse can remove or hide them; focus returns to the owning visible row.
- Nested groups, tree branches, and inline submenus use reversible height transitions for open, close, and sidebar-collapse changes.
- Tree roots use menu-row styling and nested tree nodes use submenu-row styling. In desktop icon mode, root folders open a PopupMenu and descendants remain navigable through recursive Menu submenu popovers; root leaves retain direct navigation and tooltips.
- When \`rail\` and \`resizable\` are both enabled, one edge control owns click-to-toggle, drag resize, and keyboard resize without overlapping hitboxes.
- Hidden offcanvas sidebars keep that combined edge control while temporarily revealed. Resizing does not pin the sidebar open; leaving the panel, trigger, and handle tolerance re-hides it without discarding the configured width.
- Both peeks (edge reveal and \`expandOnHover\`) stay open while focus is inside the panel or while an overlay opened from inside it is open, including nested submenus. They release about 120ms after the pointer, focus, and every such overlay are gone.
- The activity bar is its own \`<nav>\` landmark with a \`<ul>\` of items, a roving tabindex, and ArrowUp/ArrowDown/Home/End navigation that loops and skips disabled items. Tab lands on the \`isActive\` item. Each square takes its accessible name from \`label\`, with a string or number \`badge\` appended to it, and shows \`label\` as a tooltip on hover and focus.
- A hidden offcanvas panel is \`inert\`, so Tab never lands in a panel parked off screen; a peek makes it interactive again.

## Notes

- Dropdown menus use Entasis \`PopupMenu\` and \`MenuItem[]\`.
- The component uses semantic Entasis tokens. Do not add shadcn \`sidebar-*\` color tokens.
- Snippet icons from \`entasis/icons/*\` are the preferred icon format.
`;
