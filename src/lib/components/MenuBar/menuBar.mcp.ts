export const menuBarDescription = `
# MenuBar Component

MenuBar composes several PopupMenu and Menu instances into one horizontal application menu. A click or keyboard action opens the first menu. While any menu is open, moving the pointer or keyboard focus across another top-level trigger switches to that menu immediately.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { MenuBar, type MenuBarMenu } from 'svelai/menu-bar';

	const menus: MenuBarMenu[] = [
		{
			label: 'File',
			items: [
				{ type: 'option', title: 'New file' },
				{ type: 'option', title: 'Open...' },
				{ type: 'separator' },
				{ type: 'option', title: 'Save' }
			]
		},
		{
			label: 'Edit',
			items: [
				{ type: 'option', title: 'Undo' },
				{ type: 'option', title: 'Redo' }
			]
		}
	];
</script>

<MenuBar {menus} />
\`\`\`

## Interaction

- Click, Enter, Space, ArrowDown, or ArrowUp opens the focused top-level menu.
- ArrowLeft and ArrowRight move between closed top-level triggers (mirrored in RTL).
- Typing letters jumps to the next top-level trigger whose label starts with the typed text; the same type-ahead works inside each open menu.
- Once a menu is open, hovering or focusing a sibling trigger switches the open menu immediately.
- ArrowLeft and ArrowRight inside an open root menu switch to the adjacent top-level menu.
- ArrowRight on a submenu trigger remains owned by Menu and opens that submenu.
- Escape and outside-click dismissal remain owned by Popover.
- Selecting a leaf item closes the active menu by default.

## Props

- **menus**: MenuBarMenu[] (required) - Top-level menus. Each entry accepts a label, optional prefix/suffix, disabled state, and normal Menu props such as items, theme, header, footer, and submenuMode.
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Size shared by every top-level trigger.
- **dir**: 'ltr' | 'rtl' (optional) - Explicit text direction for horizontal keyboard navigation. When omitted it is auto-detected from the i18n direction context, else from the menubar's computed CSS direction.
- **closeOnItemClick**: boolean (default: true) - Closes the active popup after a leaf item is selected.
- **class**: string - Additional classes for the root menubar.
- **theme**: MenuBarThemeProps - Theme overrides for the root and trigger parts.

## Menu Entry

\`\`\`typescript
type MenuBarMenu = Omit<MenuProps, 'focusOnMount'> & {
	label: string | Snippet;
	prefix?: string | Snippet;
	suffix?: string | Snippet;
	disabled?: boolean;
};
\`\`\`

## Structure

\`\`\`
<div role="menubar">
	<Button role="menuitem" haspopup="menu" />
	<PopupMenu>
		<Menu />
	</PopupMenu>
</div>
\`\`\`

## Accessibility

MenuBar uses the ARIA menubar/menu pattern. Its triggers use roving tabindex, expose expanded state and popup relationships, skip disabled entries, loop at either edge, and preserve nested submenu keyboard behavior.
`;
