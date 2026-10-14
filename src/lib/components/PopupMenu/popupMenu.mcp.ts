export const popupMenuDescription = `
# PopupMenu Component

The PopupMenu component is a wrapper around Popover that renders a Menu inside. It provides all Popover functionality (positioning, transitions, triggers) with integrated Menu rendering for quick menu implementations.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	import { PopupMenu } from 'entasis/popup-menu';
	import { userIcon } from 'entasis/icons/user';
	import { gearIcon } from 'entasis/icons/gear';
	import { signOutIcon } from 'entasis/icons/signOut';
	
	const menuItems = [
		{ type: 'option', prefix: userIcon, title: 'Profile' },
		{ type: 'option', prefix: gearIcon, title: 'Settings' },
		{ type: 'separator' },
		{ type: 'option', prefix: signOutIcon, title: 'Logout', color: 'danger' }
	] satisfies MenuItem[];
</script>

<PopupMenu
	trigger={{ content: 'Open Menu' }}
	position="bottom-start"
	menu={{ items: menuItems }}
/>
\`\`\`

## Props

### Menu Props
- **menu**: MenuProps (required)
  - items: MenuItem[] - Array of menu items (buttons, options, separators, submenus, checkbox items, radio groups, groups)
  - filter / search / defaultSearch / onSearchChange / onHighlightChange / empty: a search field above the rows (see the Menu docs)
  - focusOnMount: boolean | 'container' | 'last' - leave it out and the menu decides from how it opened (see Accessibility)
  - class: string - Custom class for the menu container
  - theme: MenuThemeProps - Theme overrides for menu and its items
  - submenuMode: 'auto' | 'popover' | 'stack' - defaults to auto; mobileSheet menus stack submenus automatically

- **closeOnItemClick**: boolean (default: true)
  - Whether to close the menu when a menu item (button or link) is clicked
  - Choosing an item inside a submenu closes every open submenu and the menu together, once each; a floating menu then returns focus to its trigger (a mobile sheet hands focus back through its Dialog)
  - Submenus follow this setting; an item (or an ancestor) with data-menu-keep-open="true" never closes the menu
  - A PopupMenu placed in another menu's header, footer or trigger is a menu of its own: it keeps its own closeOnItemClick and closes only itself
  - Set to false for menus that should stay open for multiple selections

### Popover Props (All Available)

#### Positioning & Layout
- **position**: ResponsiveProps<Placement> - Popover position relative to trigger
  - Values: 'top', 'bottom', 'left', 'right', 'top-start', 'bottom-start', etc.
  
- **offset**: number - Distance from trigger in pixels

- **size**: ResponsiveProps<'small' | 'normal' | 'large'> - Popover size

- **fitTrigger**: boolean - Make popover width match trigger width

#### Trigger Configuration
- **trigger**: Snippet | ButtonProps | false
  - Snippet: Custom trigger rendering with popover state
  - ButtonProps: Render a button with these props
  - false: No trigger (control externally via open)

#### Interaction Behavior
- **open**: boolean (bindable) - Control open state externally

- **openOnClick**: boolean (default: true) - Open on trigger click

- **openOnHover**: boolean (default: false) - Open on trigger hover. Touch taps and disabled triggers never hover-open it, and a submenu row that lands under a resting pointer (a menu reopened from the keyboard) opens only once the pointer moves

- **delay**: number (default: 100) - Delay before opening on hover (ms)

- **closeOnClickOutside**: boolean (default: true) - Close when clicking outside

- **closeOnEscape**: boolean (default: true) - Close on Escape key

- **closeOnMouseLeave**: boolean (default: false) - Close when the pointer leaves the hover safe area. The safe area is the trigger, the panel, and a prediction cone toward the submenu, so a diagonal move into the submenu keeps it open while sibling rows stay hoverable.
- **closeDelay**: number (default: 120) - Milliseconds the pointer may spend outside the hover safe area before \`closeOnMouseLeave\` closes the menu

- **debugSafeArea**: boolean (default: false) - Show hover safe-area overlays. Trigger/panel rectangles render in blue; the prediction cone toward the submenu renders in orange.

#### Visual & Animation
- **transition**: ResponsiveProps<FSOProps> - Custom transition configuration

- **directedTransition**: boolean (default: true) - Transition direction based on position

- **lockScroll**: boolean (default: true) - Lock body scroll when open

- **class**: string - Custom class for popover dialog

- **mobileSheet**: boolean (default: false) - Render as a bottom sheet on mobile viewports. With menu.submenuMode='auto', nested submenus become stacked views.

#### Advanced
- **id**: string - Custom ID for popover element

- **ref**: HTMLElement | null - External reference element (instead of trigger)

- **onOpenChange**: (open: boolean, details: OpenChangeDetails) => void - Called before component-owned state changes, with \`details.reason\` (\`'trigger-press'\`, \`'trigger-hover'\`, \`'item-press'\` when a chosen item closes the menu, \`'escape-key'\`, \`'outside-press'\`…), \`details.event\` and \`details.cancel()\`, which keeps the menu as it is (cancelling an \`'item-press'\` close also keeps its open submenus and focus where they were)

- **onAfterOpen**: (popover: PopoverState) => void - Called after the popover opens

- **onAfterClose**: (popover: PopoverState) => void - Called after the popover closes

- **theme**: PopoverThemeProps - Theme overrides for popover

## Structure

PopupMenu renders as:
\`\`\`
<Popover {...popoverProps}>
  <Menu {...menuProps} />
</Popover>
\`\`\`

The Menu inherits the Popover's dialog styling (background, border, shadow, etc.)

## Examples

### Basic Dropdown Menu
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	const items = [
		{ type: 'option', title: 'New File' },
		{ type: 'option', title: 'Open...' },
		{ type: 'option', title: 'Save' },
		{ type: 'separator' },
		{ type: 'option', title: 'Exit' }
	] satisfies MenuItem[];
</script>

<PopupMenu
	trigger={{ content: 'File', variant: 'ghost' }}
	position="bottom-start"
	menu={{ items }}
/>
\`\`\`

### User Profile Menu
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	import { userIcon } from 'entasis/icons/user';
	import { gearIcon } from 'entasis/icons/gear';
	import { questionIcon } from 'entasis/icons/question';
	import { signOutIcon } from 'entasis/icons/signOut';
	
	const items = [
		{ type: 'option', prefix: userIcon, title: 'Profile', href: '/profile' },
		{ type: 'option', prefix: gearIcon, title: 'Settings', href: '/settings' },
		{ type: 'option', prefix: questionIcon, title: 'Help' },
		{ type: 'separator' },
		{ type: 'option', prefix: signOutIcon, title: 'Log Out', color: 'danger' }
	] satisfies MenuItem[];
</script>

<PopupMenu
	trigger={{ content: 'John Doe', variant: 'outline' }}
	position="bottom-end"
	menu={{ items }}
/>
\`\`\`

### Context Menu (Right Click)
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	import { trashIcon } from 'entasis/icons/trash';
	import { copyIcon } from 'entasis/icons/copy';
	import { shareIcon } from 'entasis/icons/share';
	
	let open = $state(false);
	let contextMenuRef = $state<HTMLElement | null>(null);
	
	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		contextMenuRef = e.currentTarget as HTMLElement;
		open = true;
	}
	
	const items = [
		{ type: 'option', title: 'Open' },
		{ type: 'option', prefix: copyIcon, title: 'Copy' },
		{ type: 'option', prefix: shareIcon, title: 'Share' },
		{ type: 'separator' },
		{ type: 'option', prefix: trashIcon, title: 'Delete', color: 'danger' }
	] satisfies MenuItem[];
</script>

<div oncontextmenu={handleContextMenu}>
	Right-click me
</div>

<PopupMenu
	trigger={false}
	bind:open
	ref={contextMenuRef}
	position="bottom-start"
	menu={{ items }}
/>
\`\`\`

### With Custom Trigger Snippet
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	let open = $state(false);

	const items = [
		{ type: 'option', title: 'Option 1' },
		{ type: 'option', title: 'Option 2' }
	] satisfies MenuItem[];
</script>

<PopupMenu bind:open position="bottom" menu={{ items }}>
	{#snippet trigger(popover)}
		<button onclick={() => popover.toggle()}>
			Custom Trigger {open ? '▲' : '▼'}
		</button>
	{/snippet}
</PopupMenu>
\`\`\`

### Hover Menu
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	const items = [
		{ type: 'option', title: 'Quick Action 1' },
		{ type: 'option', title: 'Quick Action 2' }
	] satisfies MenuItem[];
</script>

<PopupMenu
	trigger={{ content: 'Hover Me', variant: 'ghost' }}
	openOnHover={true}
	openOnClick={false}
	delay={200}
	closeOnMouseLeave={true}
	menu={{ items }}
/>
\`\`\`

### Actions Menu with Buttons
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	const items = [
		{ type: 'button', children: 'Save Draft', variant: 'ghost', fullWidth: true },
		{ type: 'button', children: 'Publish', variant: 'solid', color: 'primary', fullWidth: true },
		{ type: 'separator' },
		{ type: 'button', children: 'Delete', variant: 'soft', color: 'danger', fullWidth: true }
	] satisfies MenuItem[];
</script>

<PopupMenu
	trigger={{ content: 'Actions' }}
	position="bottom-end"
	menu={{ items }}
/>
\`\`\`

### External Control with Bindable State
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	let menuOpen = $state(false);
	
	const items = [
		{ type: 'option', title: 'Item 1' },
		{ type: 'option', title: 'Item 2' }
	] satisfies MenuItem[];
	
	function openMenu() {
		menuOpen = true;
	}
</script>

<button onclick={openMenu}>Open Menu Externally</button>

<PopupMenu
	trigger={{ content: 'Menu' }}
	bind:open={menuOpen}
	menu={{ items }}
/>
\`\`\`

### Positioned Menu
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	const items = [
		{ type: 'option', title: 'Top Start' },
		{ type: 'option', title: 'Example' }
	] satisfies MenuItem[];
</script>

<div class="flex gap-2">
	<PopupMenu trigger={{ content: 'Top Start' }} position="top-start" menu={{ items }} />
	<PopupMenu trigger={{ content: 'Bottom' }} position="bottom" menu={{ items }} />
	<PopupMenu trigger={{ content: 'Right' }} position="right" menu={{ items }} />
</div>
\`\`\`

### With Custom Theme
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	const items = [
		{ type: 'option', title: 'Themed Option 1' },
		{ type: 'option', title: 'Themed Option 2' }
	] satisfies MenuItem[];
	
	const menuTheme = {
		root: { base: 'gap-3' },
		option: {
			root: { base: 'px-4 py-3' }
		}
	};
</script>

<PopupMenu
	trigger={{ content: 'Themed Menu' }}
	menu={{ items, theme: menuTheme }}
/>
\`\`\`

### Keep Menu Open for Multiple Interactions
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	let selections = $state<string[]>([]);
	
	const items = [
		{ 
			type: 'option', 
			title: 'Option 1',
			onclick: () => selections.push('Option 1')
		},
		{ 
			type: 'option', 
			title: 'Option 2',
			onclick: () => selections.push('Option 2')
		},
		{ type: 'separator' },
		{ 
			type: 'button', 
			children: 'Done',
			variant: 'solid',
			fullWidth: true
		}
	] satisfies MenuItem[];
</script>

<PopupMenu
	trigger={{ content: 'Select Multiple' }}
	closeOnItemClick={false}
	menu={{ items }}
/>
\`\`\`

### Checkbox Items and Radio Groups
Checkbox and radio rows keep the menu open on their own, so a menu of settings needs no \`closeOnItemClick={false}\`:
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';

	const items = [
		{ type: 'checkbox', title: 'Show hidden files', defaultValue: false },
		{
			type: 'radio-group',
			label: 'Sort by',
			defaultValue: 'name',
			items: [
				{ value: 'name', title: 'Name' },
				{ value: 'date', title: 'Date modified' }
			]
		},
		{ type: 'separator' },
		{ type: 'option', title: 'Done' }
	] satisfies MenuItem[];
</script>

<PopupMenu trigger={{ content: 'View' }} menu={{ items }} />
\`\`\`

### Nested Submenus
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';

	const items = [
		{ type: 'option', title: 'New File' },
		{
			type: 'submenu',
			title: 'More Options',
			menu: [
				{ type: 'option', title: 'Sub Option 1' },
				{ type: 'option', title: 'Sub Option 2' }
			]
		}
	] satisfies MenuItem[];
</script>

<PopupMenu trigger={{ content: 'Main Menu' }} position="bottom-start" menu={{ items }} />
\`\`\`

## Accessibility

- Inherits all Popover accessibility features: the trigger carries \`aria-haspopup="menu"\`, \`aria-expanded\`, and \`aria-controls\`, and focus returns to it on close
- Menu items have appropriate roles (\`menuitem\`, \`menuitemcheckbox\` and \`menuitemradio\` with \`aria-checked\`, or \`menuitemradio\` for options that set \`selected\`) and keyboard navigation
- Where focus goes when the menu opens depends on how it opened. Enter, Space or a screen reader's press on the button, and ArrowDown, put focus on the first row; ArrowUp on the last; a mouse or touch press focuses the menu itself with no row highlighted; hovering it open leaves focus where it was. ArrowDown and ArrowUp on the button open the menu (Alt, Ctrl and Meta with them are left to the browser); on an already open menu they move into it
- Tab closes the whole menu tree and moves on to the control after the trigger, Shift+Tab closes it and stays on the trigger; \`onOpenChange\` reports \`reason: 'focus-out'\`. Focus left where Tab put it is not taken back when the close finishes. A field or link in the menu's header or footer keeps Tab until the last one
- A submenu closes when focus returns to a row of the menu that opened it
- The panel carries the reading direction of its trigger: in right-to-left text submenus open to the left, carets and back arrows mirror, and ArrowLeft opens a submenu while ArrowRight leaves it
- Type-ahead: typing letters moves the highlight to the next matching item
- Escape closes only the topmost open layer, so a submenu closes before its parent (configurable)
- An outside press closes every layer above the one pressed (configurable)
- Choosing an item at any depth closes the whole menu tree at once; a floating menu returns focus straight to the trigger, without stopping on a submenu row

## Notes

- PopupMenu is a lightweight wrapper - all Popover props work as expected
- Menu styling inherits from Popover's dialog theme
- Use \`closeOnClickOutside={true}\` (default) for typical dropdown menus
- Use \`closeOnMouseLeave={true}\` for hover-triggered quick menus; a prediction cone toward the submenu keeps it open during the diagonal move while sibling rows stay hoverable.
- The \`menu\` prop accepts full MenuProps including theme forwarding to child components
`;
