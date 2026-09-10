export const contextMenuDescription = `
# ContextMenu Component

Wraps a target and opens a menu anchored at the cursor on right-click. Built on PopupMenu using a
floating-ui virtual element, so the menu appears exactly at the pointer (and flips near viewport edges).

## Basic Usage

\`\`\`svelte
<script>
	import { ContextMenu } from 'svelai/context-menu';
	import { copyIcon } from 'svelai/icons/copy';
	import { trashIcon } from 'svelai/icons/trash';
</script>

<ContextMenu
	items={[
		{ type: 'option', prefix: copyIcon, title: 'Copy' },
		{ type: 'option', title: 'Paste' },
		{ type: 'separator' },
		{ type: 'option', prefix: trashIcon, title: 'Delete', color: 'danger' }
	]}
>
	<div class="rounded border p-10">Right-click me</div>
</ContextMenu>
\`\`\`

## Props

### Core Props
- **items**: MenuItem[] (required) - Menu entries shown on right-click. Same item shapes as Menu: type 'button', 'option', 'separator', or 'submenu'.
- **children**: Snippet (required) - The right-click target content.
- **disabled**: boolean (default: false) - When true, right-click is ignored and the native context menu shows.

### Bindable Props
- **open**: boolean - Open state of the context menu.
- **defaultOpen**: boolean (default: false) - Initial state when open is not provided.
- **onOpenChange**: (open: boolean) => void - Called once for each library-requested state change.
- **onAfterOpen**: (popover) => void - Called after the open transition finishes.
- **onAfterClose**: (popover) => void - Called after the close transition finishes.

### Advanced Props
- **menu**: Omit<MenuProps, 'items'> - Overrides forwarded to the underlying Menu (header, footer, theme).
- **popup**: PopupMenu/Popover overrides (offset, closeOnEscape, ...). position and ref are managed internally.
- **class**: string - Class on the wrapper around the target content.

## Behavior

- Right-click on the target opens the menu at the cursor via a virtual reference element.
- A second right-click elsewhere re-mounts the menu at the new point.
- Left-click outside, Escape, or selecting an item closes it.
- Submenus, keyboard navigation, and highlighting are inherited from Menu.

## Accessibility

The menu is a role="menu" with role="menuitem" children and full keyboard navigation (arrows, Home/End,
Enter, Escape, and ArrowRight/Left for submenus). The target wrapper is a plain element with an
oncontextmenu handler.

## Notes

- Anchoring uses a floating-ui virtual element (a zero-size DOMRect at clientX/clientY).
- For a menu flush with the cursor, pass \`popup={{ offset: 0 }}\`.
`;
