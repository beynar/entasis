export const popupMenuDescription = `
# PopupMenu Component

The PopupMenu component is a wrapper around Popover that renders a Menu inside. It provides all Popover functionality (positioning, transitions, triggers) with integrated Menu rendering for quick menu implementations.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';
	import { PopupMenu } from 'svelai/popup-menu';
	import { userIcon } from 'svelai/icons/user';
	import { gearIcon } from 'svelai/icons/gear';
	import { signOutIcon } from 'svelai/icons/signOut';
	
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
  - items: MenuItem[] - Array of menu items (buttons, options, separators)
  - class: string - Custom class for the menu container
  - theme: MenuThemeProps - Theme overrides for menu and its items
  - submenuMode: 'auto' | 'popover' | 'stack' - defaults to auto; mobileSheet menus stack submenus automatically

- **closeOnItemClick**: boolean (default: true)
  - Whether to close the menu when a menu item (button or link) is clicked
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

- **openOnHover**: boolean (default: false) - Open on trigger hover

- **delay**: number (default: 100) - Delay before opening on hover (ms)

- **closeOnClickOutside**: boolean (default: true) - Close when clicking outside

- **closeOnEscape**: boolean (default: true) - Close on Escape key

- **closeOnMouseLeave**: boolean (default: false) - Close when the pointer leaves the hover safe area. The safe area is the trigger, the panel, and a prediction cone toward the submenu, so a diagonal move into the submenu keeps it open while sibling rows stay hoverable.

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

- **onOpenChange**: (open: boolean) => void - Called for component-owned state changes

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
	import type { MenuItem } from 'svelai/menu';
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
	import type { MenuItem } from 'svelai/menu';
	import { userIcon } from 'svelai/icons/user';
	import { gearIcon } from 'svelai/icons/gear';
	import { questionIcon } from 'svelai/icons/question';
	import { signOutIcon } from 'svelai/icons/signOut';
	
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
	import type { MenuItem } from 'svelai/menu';
	import { trashIcon } from 'svelai/icons/trash';
	import { copyIcon } from 'svelai/icons/copy';
	import { shareIcon } from 'svelai/icons/share';
	
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
	import type { MenuItem } from 'svelai/menu';
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
	import type { MenuItem } from 'svelai/menu';
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
	import type { MenuItem } from 'svelai/menu';
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
	import type { MenuItem } from 'svelai/menu';
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
	import type { MenuItem } from 'svelai/menu';
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
	import type { MenuItem } from 'svelai/menu';
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
	import type { MenuItem } from 'svelai/menu';
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

### Nested Submenus
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';

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
- Menu items have appropriate roles (\`menuitem\`, or \`menuitemradio\` with \`aria-checked\` for options that set \`selected\`) and keyboard navigation
- Type-ahead: typing letters moves the highlight to the next matching item
- Escape closes only the topmost open layer, so a submenu closes before its parent (configurable)
- An outside press closes every layer above the one pressed (configurable)

## Notes

- PopupMenu is a lightweight wrapper - all Popover props work as expected
- Menu styling inherits from Popover's dialog theme
- Use \`closeOnClickOutside={true}\` (default) for typical dropdown menus
- Use \`closeOnMouseLeave={true}\` for hover-triggered quick menus; a prediction cone toward the submenu keeps it open during the diagonal move while sibling rows stay hoverable.
- The \`menu\` prop accepts full MenuProps including theme forwarding to child components
`;
