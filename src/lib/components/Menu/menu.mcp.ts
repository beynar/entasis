export const menuDescription = `
# Menu Component

The Menu component is a flexible container that renders an array of menu items including Buttons, MenuOptions, and Separators. It provides theme forwarding capabilities and manages vertical layout with configurable spacing.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { Menu, type MenuItem } from 'svelai/menu';
	import { userIcon } from 'svelai/icons/user';
	import { gearIcon } from 'svelai/icons/gear';
	
	const items = [
		{ type: 'option', title: 'Profile', prefix: userIcon },
		{ type: 'option', title: 'Settings', prefix: gearIcon },
		{ type: 'separator' },
		{ type: 'button', children: 'Logout', color: 'danger', variant: 'ghost' }
	] satisfies MenuItem[];
</script>

<Menu {items} />

<!-- With optional header and footer -->
<Menu {items}>
	{#snippet header()}
		<div class="px-2 pb-2 border-b mb-2">
			<h3>Menu Title</h3>
		</div>
	{/snippet}
	{#snippet footer()}
		<div class="px-2 pt-2 border-t mt-2">
			<p class="text-xs">Footer content</p>
		</div>
	{/snippet}
</Menu>
\`\`\`

## Props

### Core Props
- **items**: MenuItem[] (required)
  - Array of menu items to render
  - Each item must have a \`type\` field: 'button', 'option', or 'separator'
  - Items are spread with their respective component props

- **class**: string - Additional CSS classes for the menu container

- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal') - Spacing density: controls the gap between rows and is forwarded to every MenuOption row (option, submenu trigger, back control); a per-item \`density\` wins. Items of type 'button' render a Button, which has no density axis and is unaffected.

- **header**: Snippet - Optional header content rendered at the top of the menu

- **footer**: Snippet - Optional footer content rendered at the bottom of the menu

- **theme**: MenuThemeProps - Custom theme overrides
  - menu: Theme for the container (gap spacing, layout)
  - button: Theme forwarded to Button components
  - option: Theme forwarded to MenuOption components
  - separator: Theme forwarded to Separator components
  - submenu: Theme forwarded to submenu MenuOption triggers

- **submenuMode**: 'auto' | 'popover' | 'stack' (default: 'auto')
  - auto: floating submenus normally, stacked views inside mobile-sheet popovers
  - popover: always open submenus as nested PopupMenu instances
  - stack: navigate to submenu views inside the same menu surface

## MenuItem Types

The Menu accepts a discriminated union of four item types:

### Button Item
\`\`\`typescript
import type { MenuItem } from 'svelai/menu';

const buttonItem = {
	type: 'button',
	children: 'Log out',
	variant: 'ghost',
	color: 'danger'
} satisfies MenuItem;
\`\`\`

### MenuOption Item
\`\`\`typescript
import type { MenuItem } from 'svelai/menu';

const optionItem = {
	type: 'option',
	title: 'Profile',
	description: 'Manage your account',
	href: '/profile'
} satisfies MenuItem;
\`\`\`

### Separator Item
\`\`\`typescript
import type { MenuItem } from 'svelai/menu';

const separatorItem = {
	type: 'separator',
	color: 'neutral',
	decorative: true
} satisfies MenuItem;
\`\`\`

### Submenu Item
\`\`\`typescript
import type { MenuItem } from 'svelai/menu';

const submenuItem = {
	type: 'submenu',
	title: 'Settings',
	menu: [
		{ type: 'option', title: 'General' },
		{ type: 'option', title: 'Privacy' }
	],
	openOnHover: true,
	delay: 100
} satisfies MenuItem;
\`\`\`

## Structure

The menu follows this DOM structure:
\`\`\`
<Menu>
	<div role="menu">
		<!-- Items rendered based on type -->
		<Button />
		<MenuOption />
		<Separator />
		<!-- ... -->
	</div>
</Menu>
\`\`\`

## Examples

### Simple Menu
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';
	import { fileIcon } from 'svelai/icons/file';
	import { folderIcon } from 'svelai/icons/folder';

	const items = [
		{ type: 'option', title: 'New File', prefix: fileIcon },
		{ type: 'option', title: 'Open...', prefix: folderIcon },
		{ type: 'separator' },
		{ type: 'option', title: 'Exit', color: 'danger' }
	] satisfies MenuItem[];
</script>

<Menu {items} />
\`\`\`

### Menu with Buttons
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';

	const items = [
		{ type: 'button', children: 'Save', variant: 'solid', color: 'primary' },
		{ type: 'button', children: 'Cancel', variant: 'ghost' }
	] satisfies MenuItem[];
</script>

<Menu {items} />
\`\`\`

### Menu with Descriptions
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';
	import { starIcon } from 'svelai/icons/star';
	import { checkIcon } from 'svelai/icons/check';
	import { buildingIcon } from 'svelai/icons/building';

	const items = [
		{ 
			type: 'option',
			title: 'Pro Plan',
			description: 'For growing teams',
			prefix: starIcon,
			suffix: checkIcon
		},
		{ 
			type: 'option',
			title: 'Enterprise',
			description: 'For large organizations',
			prefix: buildingIcon
		}
	] satisfies MenuItem[];
</script>

<Menu {items} />
\`\`\`

### Menu with Event Handlers
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';

	function handleProfile() {
		console.log('Profile clicked');
	}
	
	function handleLogout() {
		console.log('Logout clicked');
	}
	
	const items = [
		{ type: 'option', title: 'Profile', onclick: handleProfile },
		{ type: 'separator' },
		{ type: 'button', children: 'Logout', onclick: handleLogout, color: 'danger' }
	] satisfies MenuItem[];
</script>

<Menu {items} />
\`\`\`

### Custom Theme
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';

	const customTheme = {
		root: {
			base: 'gap-3' // More spacing between items
		},
		option: {
			root: {
				base: 'px-4 py-3'
			}
		}
	};
	
	const items = [
		{ type: 'option', title: 'Option 1' },
		{ type: 'option', title: 'Option 2' }
	] satisfies MenuItem[];
</script>

<Menu {items} theme={customTheme} />
\`\`\`

### Menu with Links
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';

	const items = [
		{ type: 'option', title: 'Dashboard', href: '/dashboard' },
		{ type: 'option', title: 'Profile', href: '/profile' },
		{ type: 'separator' },
		{ type: 'button', children: 'External Link', href: 'https://example.com', target: '_blank' }
	] satisfies MenuItem[];
</script>

<Menu {items} />
\`\`\`

### Menu with Submenus
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';
	import { gearIcon } from 'svelai/icons/gear';
	
	const items = [
		{ type: 'option', title: 'Dashboard' },
		{ type: 'option', title: 'Profile' },
		{
			type: 'submenu',
			prefix: gearIcon,
			title: 'Settings',
			menu: [
				{ type: 'option', title: 'General' },
				{ type: 'option', title: 'Privacy' },
				{ type: 'option', title: 'Security' }
			]
		},
		{ type: 'separator' },
		{ type: 'option', title: 'Log Out', color: 'danger' }
	] satisfies MenuItem[];
</script>

<Menu {items} />
\`\`\`

### Stacked Submenus
\`\`\`svelte
<Menu {items} submenuMode="stack" />
\`\`\`

### Nested Submenus
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';

	const items = [
		{ type: 'option', title: 'New File' },
		{
			type: 'submenu',
			title: 'Recent Files',
			menu: [
				{ type: 'option', title: 'document.txt' },
				{ type: 'option', title: 'project.js' },
				{
					type: 'submenu',
					title: 'More',
					menu: [
						{ type: 'option', title: 'file1.txt' },
						{ type: 'option', title: 'file2.txt' }
					]
				}
			]
		},
		{ type: 'separator' },
		{ type: 'option', title: 'Save' }
	] satisfies MenuItem[];
</script>

<Menu {items} />
\`\`\`

### Submenu with Custom Trigger Behavior
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';

	const items = [
		{ type: 'option', title: 'Option 1' },
		{
			type: 'submenu',
			title: 'Click Only',
			openOnHover: false,
			openOnClick: true,
			menu: [
				{ type: 'option', title: 'Sub Option 1' },
				{ type: 'option', title: 'Sub Option 2' }
			]
		},
		{
			type: 'submenu',
			title: 'Hover with Delay',
			openOnHover: true,
			delay: 500,
			menu: [
				{ type: 'option', title: 'Sub Option 1' },
				{ type: 'option', title: 'Sub Option 2' }
			]
		}
	] satisfies MenuItem[];
</script>

<Menu {items} />
\`\`\`

### Menu with Header
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';

	const items = [
		{ type: 'option', title: 'Profile' },
		{ type: 'option', title: 'Settings' },
		{ type: 'separator' },
		{ type: 'option', title: 'Log Out', color: 'danger' }
	] satisfies MenuItem[];
</script>

<Menu {items}>
	{#snippet header()}
		<div class="border-b pb-2 mb-2">
			<h3 class="text-sm font-semibold px-2">User Menu</h3>
			<p class="text-xs text-gray-500 px-2">Manage your account</p>
		</div>
	{/snippet}
</Menu>
\`\`\`

### Menu with Footer
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';

	const items = [
		{ type: 'option', title: 'Item 1' },
		{ type: 'option', title: 'Item 2' },
		{ type: 'option', title: 'Item 3' }
	] satisfies MenuItem[];
</script>

<Menu {items}>
	{#snippet footer()}
		<div class="border-t pt-2 mt-2">
			<div class="text-xs text-gray-500 px-2">Version 1.0.0</div>
		</div>
	{/snippet}
</Menu>
\`\`\`

### Menu with Header and Footer
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';
	import { userIcon } from 'svelai/icons/user';
	import { gearIcon } from 'svelai/icons/gear';
	import { signOutIcon } from 'svelai/icons/signOut';

	const items = [
		{ type: 'option', prefix: userIcon, title: 'Profile' },
		{ type: 'option', prefix: gearIcon, title: 'Settings' },
		{ type: 'separator' },
		{ type: 'option', prefix: signOutIcon, title: 'Log Out', color: 'danger' }
	] satisfies MenuItem[];
</script>

<Menu {items}>
	{#snippet header()}
		<div class="border-b pb-2 mb-2">
			<div class="flex items-center gap-2 px-2">
				<div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
					JD
				</div>
				<div>
					<div class="text-sm font-semibold">John Doe</div>
					<div class="text-xs text-gray-500">john@example.com</div>
				</div>
			</div>
		</div>
	{/snippet}
	{#snippet footer()}
		<div class="border-t pt-2 mt-2">
			<div class="text-xs text-gray-500 px-2 text-center">
				<a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
			</div>
		</div>
	{/snippet}
</Menu>
\`\`\`

### Mixed Size Items
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'svelai/menu';

	const items = [
		{ type: 'option', title: 'Small Option', size: 'small' },
		{ type: 'option', title: 'Normal Option', size: 'normal' },
		{ type: 'option', title: 'Large Option', size: 'large' },
		{ type: 'separator' },
		{ type: 'button', children: 'Large Button', size: 'large', variant: 'solid' }
	] satisfies MenuItem[];
</script>

<Menu {items} />
\`\`\`

### Density
\`\`\`svelte
<!-- density tightens/loosens the row gap and every option row's paddings.
     Button items are unaffected (Button has no density axis). -->
<Menu {items} density="compact" />
<Menu {items} density="normal" />
<Menu {items} density="comfortable" />
\`\`\`

## Accessibility

- Automatically sets \`role="menu"\` on the container
- Option items render \`role="menuitem"\`; an option that passes \`selected\` (true or false) renders \`role="menuitemradio"\` with \`aria-checked\`, so a check-marked choice is announced as checked rather than as a plain command
- ArrowUp / ArrowDown move the highlight, Home / End jump, Enter or Space activates, ArrowRight opens a submenu and ArrowLeft closes it (mirrored in RTL)
- Type-ahead: typing letters moves the highlight to the next item whose label starts with the typed text
- Supports keyboard navigation through child components
- MenuOption and Button items handle interactive states

## Theme Forwarding

The Menu component forwards theme props to its child components:
- \`theme.menu\` - Applied to the container (gap, layout)
- \`theme.button\` - Forwarded to all Button items
- \`theme.option\` - Forwarded to all MenuOption items
- \`theme.separator\` - Forwarded to all Separator items
- \`theme.submenu\` - Forwarded to submenu MenuOption triggers

This allows for consistent styling across all menu items while maintaining flexibility for individual customization.

## Submenu Behavior

Submenu items automatically:
- Add a caret-right icon as suffix (unless custom suffix provided)
- Open submenus positioned to the right (right-start)
- Support hover and click triggers (configurable)
- Manage submenu state internally using PopupMenu
- Support nested submenus (submenus within submenus)

Default submenu behavior:
- Opens on hover (after 100ms delay)
- Opens on click
- Closes when the pointer leaves the submenu prediction cone and rectangle tolerance
- Does not close when clicking items inside (allows multi-interaction)

## Notes

- The Menu component is a controlled component that renders based on the items array
- Items are distinguished by their \`type\` property using TypeScript discriminated unions
- Each item type spreads its respective component props for full flexibility
- The menu container uses minimal styling, focusing on vertical layout and spacing
- Theme forwarding allows global styling of all items of a specific type

## Theme Customization

The Menu component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main menu container styles
- **button**: Theme forwarded to Button items (optional)
- **option**: Theme forwarded to MenuOption items (optional)
- **separator**: Theme forwarded to Separator items (optional)
- **submenu**: Theme forwarded to submenu MenuOption triggers (optional)

### Theme Type Definition

\`\`\`typescript
import type { MenuThemeProps } from 'svelai/menu';
import type { ButtonThemeProps } from 'svelai/button';
import type { MenuOptionThemeProps } from 'svelai/menu-option';
import type { SeparatorThemeProps } from 'svelai/separator';

// Example theme customization
const customTheme: MenuThemeProps = {
  root: {
    base: 'flex flex-col w-full',
    density: {
      compact: 'gap-0',
      normal: 'gap-0.5',
      comfortable: 'gap-1'
    }
  },
  button: {
    root: {
      base: 'w-full justify-start'
    }
  },
  option: {
    root: {
      density: {
        normal: 'px-3 py-2'
      }
    }
  },
  separator: {
    root: {
      base: 'my-2'
    }
  }
};
\`\`\`

### Available Variants

**root**:
- base: Base classes for menu container
- Variants:
  - density: 'compact' | 'normal' | 'comfortable' - Spacing between menu items

**button** (optional):
- Forwards theme to all Button items in the menu
- See Button component theme documentation for available variants

**option** (optional):
- Forwards theme to all MenuOption items in the menu
- See MenuOption component theme documentation for available variants

**separator** (optional):
- Forwards theme to all Separator items in the menu
- See Separator component theme documentation for available variants

**submenu** (optional):
- Forwards theme to submenu MenuOption triggers
- See MenuOption component theme documentation for available variants

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Menu
  items={menuItems}
  theme={{
    root: {
      density: {
        normal: 'gap-2'
      }
    }
  }}
/>
\`\`\`

**Theme Forwarding to Child Components**:
\`\`\`svelte
<Menu
  items={menuItems}
  theme={{
    root: {
      density: {
        comfortable: 'gap-3'
      }
    },
    option: {
      root: {
        density: {
          normal: 'px-4 py-3 min-h-10'
        },
        color: {
          primary: 'text-blue-600 highlight:bg-blue-50'
        }
      }
    },
    separator: {
      root: {
        base: 'my-3',
		color: {
			neutral: 'before:border-gray-200 after:border-gray-200'
		}
      }
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setMenuTheme } from 'svelai/menu';
  import { setMenuOptionTheme } from 'svelai/menu-option';
  
  // The global menu theme covers the container parts (root, header, footer).
  // Option rows are themed globally through MenuOption's own setter.
  setMenuTheme({
    root: {
      density: {
        normal: 'gap-2'
      }
    }
  });
  setMenuOptionTheme({
    root: {
      base: 'rounded-lg',
      density: {
        normal: 'px-3 py-2'
      }
    }
  });
</script>
\`\`\`
`;
