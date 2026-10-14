export const contextMenuDescription = `
# ContextMenu Component

Wraps a target and opens a menu anchored at the cursor on right-click. Built on PopupMenu using a
floating-ui virtual element, so the menu appears exactly at the pointer (and flips near viewport edges).

## Basic Usage

\`\`\`svelte
<script>
	import { ContextMenu } from 'entasis/context-menu';
	import { copyIcon } from 'entasis/icons/copy';
	import { trashIcon } from 'entasis/icons/trash';
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
- **items**: MenuItem[] (required) - Menu entries shown on right-click. Same item shapes as Menu: type 'button', 'option', 'separator', 'submenu', 'checkbox', 'radio-group' or 'group'.
- **children**: Snippet (required) - The right-click target content.
- **disabled**: boolean (default: false) - When true, right-click is ignored and the native context menu shows.

### Bindable Props
- **open**: boolean - Open state of the context menu.
- **defaultOpen**: boolean (default: false) - Initial state when open is not provided.
- **onOpenChange**: (open: boolean, details: OpenChangeDetails) => void - Called before each library-requested state change, with \`details.reason\` (\`'trigger-press'\` for the right-click, long-press or keyboard request, \`'item-press'\`, \`'escape-key'\`, \`'outside-press'\`), \`details.event\` and \`details.cancel()\`.
- **onAfterOpen**: (payload) => void - Called after the open transition finishes.
- **onAfterClose**: (payload) => void - Called after the close transition finishes.

### Advanced Props
- **menu**: Omit<MenuProps, 'items'> - Overrides forwarded to the underlying Menu (header, footer, theme).
- **popup**: PopupMenu/Popover overrides (position, offset, closeOnEscape, closeOnItemClick, ...). position places the menu relative to the pointer and defaults to 'bottom-start' (a responsive record keeps that default below its first breakpoint); collisionBoundary defaults to 'layoutViewport', so panning a pinch-zoomed page doesn't drag the menu along (submenus keep the visual viewport); ref is managed internally.
- **class**: string - Class on the wrapper around the target content.

## Behavior

- Right-click on the target opens the menu at the cursor via a virtual reference element.
- Keyboard: Shift+F10 or the ContextMenu key, while focus is inside the target, opens the menu anchored to the focused element.
- Touch: a 500 ms long-press opens the menu at the finger. A finger may drift up to 8 px while it presses; moving further, or lifting earlier, cancels the press. The native \`contextmenu\` event Android Chrome sends with a long-press (before or just after the finger lifts) is part of the same gesture: the menu opens once, with one \`onOpenChange(true)\`.
- A second right-click within 8 px of the point the open menu is anchored to closes it; a right-click elsewhere re-mounts the menu at the new point.
- The browser's own context menu never opens over the open panel, its padding or its submenus. While the menu is enabled the wrapper sets \`-webkit-touch-callout: none\`, so iOS Safari's long-press callout does not compete with the long-press that opens the menu.
- A pointer open (right-click, long-press) focuses the menu itself; Shift+F10 and the ContextMenu key highlight the first row.
- Left-click outside, Escape, or selecting an item closes it. Selecting an item inside a submenu closes the submenu and the menu together, and focus returns to the element that had it before the menu opened.
- Submenus, keyboard navigation, and highlighting are inherited from Menu.

## Accessibility

The menu is a role="menu" with role="menuitem" children and full keyboard navigation (arrows, Home/End,
Enter, Escape, and ArrowRight/Left for submenus, mirrored in right-to-left text), plus type-ahead. Tab closes the
menu and returns focus to the element that had it before the menu opened. Keyboard users open it with
Shift+F10 or the ContextMenu key; touch users with a long-press. The target wrapper is a plain
element with contextmenu, keydown, and pointer handlers.

## Notes

- Anchoring uses a floating-ui virtual element (a zero-size DOMRect at clientX/clientY).
- For a menu flush with the cursor, pass \`popup={{ offset: 0 }}\`.
`;
