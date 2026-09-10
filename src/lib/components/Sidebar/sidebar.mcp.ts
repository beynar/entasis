export const sidebarDescription = `
# Sidebar Component

Sidebar navigation with data-driven groups, icon collapse, mobile drawer behavior,
recursive tree groups, header/footer rows, search, actions, and snippet escape hatches.

## Import

\`\`\`svelte
<script lang="ts">
	import { Sidebar, type SidebarGroup } from 'svelai/sidebar';
</script>
\`\`\`

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { Sidebar, type SidebarGroup } from 'svelai/sidebar';
	import { houseIcon } from 'svelai/icons/house';
	import { gearIcon } from 'svelai/icons/gear';

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
2. Use local Svelai icon snippets such as \`houseIcon\`, not Lucide component constructors.
3. Use \`MenuItem[]\` from \`svelai/menu\` for \`menu\` and action dropdowns.
4. Do not combine \`menu\` with \`href\` or \`onclick\` on the same row; use \`action\` for a trailing row menu.
5. Keep \`children\`, \`header\`, \`content\`, \`footer\`, \`banner\`, and action snippets pure; they receive \`SidebarApi\`.
6. Use \`collapsible="icon"\` for icon rail behavior, \`collapsible="offcanvas"\` for hidden desktop panels, and \`collapsible="none"\` for fixed sidebars. Icon collapse automatically falls back to offcanvas when any data-driven row lacks an icon.
7. Offcanvas sidebars reveal over the content from the screen edge by default when hidden; set \`edgeReveal={false}\` to disable that. A revealed hidden sidebar keeps its resize handle and dismisses through a small rectangular pointer tolerance.
8. Set \`keyboardShortcut={false}\` when embedding Sidebar inside another shortcut-heavy surface.
9. Sidebar owns navigation, resize mechanics, the lower application wall, and variant surface geometry. AppShell forwards its variant and composes PageShell inside that surface.
10. Use \`size\` for typography, icon scale, and item height. Use \`density\` independently for section padding, gaps, and submenu spacing.

## Data Model

### SidebarGroup
- **label**: string - Group label, hidden in icon-collapsed mode.
- **items**: SidebarMenuEntry[] - Menu rows.
- **tree**: SidebarTreeNode[] - Recursive tree rows instead of menu items.
- **action**: SidebarMenuActionDescriptor | Snippet<[SidebarApi]> - Top-right group action.
- **collapsible**: boolean - Makes the group label a toggle.
- **defaultOpen**: boolean - Initial collapsible group state.
- **separator**: boolean - Divider before the group.

### SidebarMenuEntry
- **label**: string - Visible row label.
- **icon**: SidebarIcon - Svelai icon snippet or string.
- **href**: string - Render as an anchor. Mutually exclusive with menu.
- **onclick**: (event: MouseEvent) => void - Native click handler for button or anchor rows. Mutually exclusive with menu.
- **isActive**: boolean - Adds active styling and \`aria-current="page"\`.
- **disabled**: boolean - Disables button rows and marks anchor rows disabled.
- **badge**: string | number - Trailing count/status, hidden in icon mode.
- **tooltip**: string - Svelai Tooltip content in icon mode. Defaults to label.
- **items**: SidebarMenuSubEntry[] - Inline nested menu.
- **collapsible**: boolean - Set false for an always-open submenu.
- **defaultOpen**: boolean - Initial nested menu state.
- **menu**: MenuItem[] - Popup menu opened from the full row. Mutually exclusive with href/onclick.
- **action**: SidebarMenuActionDescriptor | Snippet<[SidebarApi]> - Hover/focus trailing action.

### SidebarMenuButtonItem
Use for \`headerButton\`, \`footerButton\`, or direct \`<SidebarMenuButton />\` rows.
- **icon**: SidebarIcon - Leading logo/icon.
- **avatar**: { src?: string; alt?: string; fallback?: string } - Leading avatar.
- **variant**: 'default' | 'brand' | 'compact'.
- **title**: string - Primary text.
- **subtitle**: string - Secondary text.
- **href** / **onclick** / **menu** - Choose link, button, or popup behavior.
- **menuIconClass**: string - Class override for option icons inside the popup menu.

## Props

### State
- **open**: boolean (bindable, default true) - Desktop expanded state.
- **defaultOpen**: boolean (default true) - Initial desktop state when \`open\` is omitted.
- **onOpenChange**: (open: boolean) => void - Called once for a library-originated desktop state change. Repeated requests and parent prop updates stay silent.
- **onDisplayStateChange**: (state: SidebarDisplayState) => void - Called once for a library-originated semantic display-state change.
- **api.displayState**: 'expanded' | 'collapsed' | 'hidden' - Semantic desktop state; hidden means closed offcanvas.
- **keyboardShortcut**: string | false (default 'b') - Ctrl/Cmd shortcut key.

### Layout
- **side**: 'left' | 'right' - Desktop and mobile side.
- **variant**: 'admin' | 'floating' | 'inset' | 'split' - Sidebar geometry. \`admin\` renders the conventional full-height navigation column; \`inset\` integrates navigation into the lower wall with an inset content surface; \`split\` renders detached sidebar and content surfaces.
- **size**: 'small' | 'normal' | 'large' (default 'normal') - Typography, icon, avatar, badge, leading-media, item-height, and search-height scale.
- **density**: 'small' | 'normal' | 'large' (default 'normal') - Section padding, group padding, gaps, horizontal inset, and submenu spacing.
- **collapsible**: 'offcanvas' | 'icon' | 'none' - Collapse behavior. Icon mode requires icons on every data-driven row and otherwise resolves to offcanvas.
- **mode**: 'layout' | 'panel' - Full resizing layout or only the visible navigation panel.
- **frame**: 'viewport' | 'contained' - Standalone Sidebar positioning. Viewport mode uses Theme's dynamic window-height token; contained mode fills a positioned parent.
- **width**: string - Expanded width.
- **widthIcon**: string - Icon-collapsed width.
- **widthMobile**: string - Mobile drawer width.
- **rail**: boolean | 'line' | 'thumb' - Edge toggle rail. \`true\` keeps the thin line style; \`thumb\` renders a short visible handle with the same full-height hitbox. The appearance is preserved when the rail shares the resize control.
- **edgeReveal**: boolean (default true) - Pointer/focus edge preview for hidden offcanvas sidebars. Hover reveal overlays content, remains resizable when configured, and re-hides after the pointer leaves its small rectangular tolerance. Dragging the sidebar closed suppresses immediate hover reopening until the pointer leaves the edge trigger; toggle/click opens persistently.
- **resizable**: boolean | SidebarResizableOptions - Enables pointer and keyboard resizing while expanded, icon-collapsed, or temporarily edge-revealed. By default, collapse requires dragging 75% of \`minWidth\` beyond the minimum; override \`collapseThreshold\` for a custom boundary. Use \`storageKey\` to restore and persist the expanded width across sessions.
  - \`onWidthChange(width)\` reports continuous width state.
  - \`onWidthChanged({ width, isUserInteraction })\` reports a committed resize or restored width with one named payload.

### Content
- **items**: SidebarGroup[] - Data-driven body navigation.
- **headerButton** / **footerButton**: SidebarMenuButtonItem - Sticky large rows.
- **search**: SidebarSearch - Header search input; use its native \`oninput\` handler.
- **headerMenu** / **footerMenu**: SidebarMenuEntry[] - Sticky quick menus.
- Menu entries and nested entries accept \`size: 'small' | 'normal' | 'large'\` for row geometry.
- **header**, **content**, **footer**, **children**, **banner**: Snippet<[SidebarApi]> - Escape hatches.

### Styling
- **class**: string - Classes applied to the Sidebar root.
- **theme**: SidebarThemeProps - Semantic part overrides such as \`panel\`, \`header\`, \`nav\`, \`footer\`, menu, search, rail, and mobile drawer parts.

## Accessibility

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

## Notes

- Dropdown menus use Svelai \`PopupMenu\` and \`MenuItem[]\`.
- The component uses semantic Svelai tokens. Do not add shadcn \`sidebar-*\` color tokens.
- Snippet icons from \`svelai/icons/*\` are the preferred icon format.
`;
