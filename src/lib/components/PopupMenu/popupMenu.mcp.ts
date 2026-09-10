export const popupMenuDescription = `
# PopupMenu Component

The PopupMenu component is a wrapper around Popover that renders a Menu inside. It provides all Popover functionality (positioning, transitions, triggers) with integrated Menu rendering for quick menu implementations.

## Basic Usage

\`\`\`svelte
<script>
	import { PopupMenu } from '$lib/components/PopupMenu';
	import { userIcon, gearIcon, signOutIcon } from '$lib/components/Icons';
	
	const menuItems = [
		{ type: 'option', prefix: userIcon, title: 'Profile' },
		{ type: 'option', prefix: gearIcon, title: 'Settings' },
		{ type: 'separator' },
		{ type: 'option', prefix: signOutIcon, title: 'Logout', color: 'danger' }
	];
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

- **hoverDelay**: number (default: 100) - Delay before opening on hover (ms)

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
<script>
	const items = [
		{ type: 'option', title: 'New File' },
		{ type: 'option', title: 'Open...' },
		{ type: 'option', title: 'Save' },
		{ type: 'separator' },
		{ type: 'option', title: 'Exit' }
	];
</script>

<PopupMenu
	trigger={{ content: 'File', variant: 'ghost' }}
	position="bottom-start"
	menu={{ items }}
/>
\`\`\`

### User Profile Menu
\`\`\`svelte
<script>
	import { userIcon, gearIcon, questionIcon, signOutIcon } from '$lib/components/Icons';
	
	const items = [
		{ type: 'option', prefix: userIcon, title: 'Profile', href: '/profile' },
		{ type: 'option', prefix: gearIcon, title: 'Settings', href: '/settings' },
		{ type: 'option', prefix: questionIcon, title: 'Help' },
		{ type: 'separator' },
		{ type: 'option', prefix: signOutIcon, title: 'Log Out', color: 'danger' }
	];
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
	import { trashIcon, copyIcon, shareIcon } from '$lib/components/Icons';
	
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
	];
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
<script>
	let open = $state(false);

	const items = [
		{ type: 'option', title: 'Option 1' },
		{ type: 'option', title: 'Option 2' }
	];
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
<script>
	const items = [
		{ type: 'option', title: 'Quick Action 1' },
		{ type: 'option', title: 'Quick Action 2' }
	];
</script>

<PopupMenu
	trigger={{ content: 'Hover Me', variant: 'ghost' }}
	openOnHover={true}
	openOnClick={false}
	hoverDelay={200}
	closeOnMouseLeave={true}
	menu={{ items }}
/>
\`\`\`

### Actions Menu with Buttons
\`\`\`svelte
<script>
	const items = [
		{ type: 'button', children: 'Save Draft', variant: 'ghost', fullWidth: true },
		{ type: 'button', children: 'Publish', variant: 'solid', color: 'primary', fullWidth: true },
		{ type: 'separator' },
		{ type: 'button', children: 'Delete', variant: 'soft', color: 'danger', fullWidth: true }
	];
</script>

<PopupMenu
	trigger={{ content: 'Actions' }}
	position="bottom-end"
	menu={{ items }}
/>
\`\`\`

### External Control with Bindable State
\`\`\`svelte
<script>
	let menuOpen = $state(false);
	
	const items = [
		{ type: 'option', title: 'Item 1' },
		{ type: 'option', title: 'Item 2' }
	];
	
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
<script>
	const items = [
		{ type: 'option', title: 'Top Start' },
		{ type: 'option', title: 'Example' }
	];
</script>

<div class="flex gap-2">
	<PopupMenu trigger={{ content: 'Top Start' }} position="top-start" menu={{ items }} />
	<PopupMenu trigger={{ content: 'Bottom' }} position="bottom" menu={{ items }} />
	<PopupMenu trigger={{ content: 'Right' }} position="right" menu={{ items }} />
</div>
\`\`\`

### With Custom Theme
\`\`\`svelte
<script>
	const items = [
		{ type: 'option', title: 'Themed Option 1' },
		{ type: 'option', title: 'Themed Option 2' }
	];
	
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
<script>
	let selections = $state([]);
	
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
	];
</script>

<PopupMenu
	trigger={{ content: 'Select Multiple' }}
	closeOnItemClick={false}
	menu={{ items }}
/>
\`\`\`

### Nested Submenus
\`\`\`svelte
<script>
	import { caretRightIcon } from '$lib/components/Icons';
	
	let submenuOpen = $state(false);
	
	const mainItems = [
		{ type: 'option', title: 'New File' },
		{ type: 'option', title: 'More Options', suffix: caretRightIcon, onclick: () => submenuOpen = true }
	];
	
	const subItems = [
		{ type: 'option', title: 'Sub Option 1' },
		{ type: 'option', title: 'Sub Option 2' }
	];
</script>

<PopupMenu
	trigger={{ content: 'Main Menu' }}
	position="bottom-start"
	menu={{ items: mainItems }}
/>

{#if submenuOpen}
	<PopupMenu
		trigger={false}
		bind:open={submenuOpen}
		position="right-start"
		menu={{ items: subItems }}
	/>
{/if}
\`\`\`

## Accessibility

- Inherits all Popover accessibility features
- Menu items have appropriate roles and keyboard navigation
- Escape key closes the menu (configurable)
- Click outside closes the menu (configurable)
- Focus trap available through Popover

## Notes

- PopupMenu is a lightweight wrapper - all Popover props work as expected
- Menu styling inherits from Popover's dialog theme
- Use \`closeOnClickOutside={true}\` (default) for typical dropdown menus
- Use \`closeOnMouseLeave={true}\` for hover-triggered quick menus; a prediction cone toward the submenu keeps it open during the diagonal move while sibling rows stay hoverable.
- The \`menu\` prop accepts full MenuProps including theme forwarding to child components
`;
