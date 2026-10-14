export const menuDescription = `
# Menu Component

The Menu component is a flexible container that renders an array of menu items: Buttons, MenuOptions, Separators, submenus, checkbox items, radio groups and labelled groups. It provides theme forwarding capabilities and manages vertical layout with configurable spacing.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { Menu, type MenuItem } from 'entasis/menu';
	import { userIcon } from 'entasis/icons/user';
	import { gearIcon } from 'entasis/icons/gear';
	
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
  - Each item must have a \`type\` field: 'button', 'option', 'separator', 'submenu', 'checkbox', 'radio-group' or 'group'
  - Items are spread with their respective component props
  - Every item accepts a \`key\`. A row keeps its DOM node, and with it focus, the Tab stop and hover state, while rows before it are inserted, removed or reordered, as long as its key stays the same. Without a \`key\` the identity comes from the row's plain-text title or children, its \`href\` or its \`textValue\`, so a menu built from strings needs none. A row whose text changes when it is pressed (Mute becoming Unmute) keeps its node too, as it takes over the key of the row that disappeared in the same place. Give rows whose title is a snippet, or whose text repeats, an explicit \`key\`

- **class**: string - Additional CSS classes for the menu container

- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal') - Spacing density: controls the gap between rows and is forwarded to every MenuOption row (option, submenu trigger, back control); a per-item \`density\` wins. Items of type 'button' render a Button, which has no density axis and is unaffected.

- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Type/icon scale of every MenuOption row; a per-item \`size\` wins. Items of type 'button' are unaffected.

- **color**: Colors - Role every MenuOption row follows unless the item names its own \`color\`. Left undefined, each row keeps the MenuOption default.

All three axes (\`density\`, \`size\`, \`color\`) are inherited by submenus: a submenu is the same menu one level down and opens on the axes its parent was given.

- **header**: Snippet - Optional header content rendered at the top of the menu, outside the \`role="menu"\` element: a field or a link in it is not a menu item

- **footer**: Snippet - Optional footer content rendered at the bottom of the menu, outside the \`role="menu"\` element: links and buttons in it are not menu items. A PopupMenu still closes when a button or link in the footer is pressed

- **focusOnMount**: boolean | 'container' | 'last' - Which part takes focus when the menu mounts: \`true\` the first row, \`'last'\` the last row, \`'container'\` the menu itself. A PopupMenu decides from how it opened when this is left out: a keyboard open (Enter, Space, ArrowDown, Shift+F10) highlights the first row, ArrowUp the last, a pointer open focuses the menu itself, and a hover open leaves focus where it is

- **filter**: boolean | { placeholder?, label?, match? } (default: false) - Adds a search field above the rows. See Filterable menus

- **search** / **defaultSearch** / **onSearchChange**: the text of the search field (bindable \`search\`, initial \`defaultSearch\`, \`onSearchChange(search)\` once per edit)

- **onHighlightChange**: (value: string | undefined) => void - Called when the highlighted row changes (keyboard, pointer or filter), with that row's \`value\` (its \`textValue\`, or its text when that is a string); \`undefined\` when no row is highlighted

- **empty**: Snippet - Shown in place of the rows when the search matches none of them (default: "No results found.")

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

The Menu accepts a discriminated union of seven item types:

### Button Item
\`\`\`typescript
import type { MenuItem } from 'entasis/menu';

const buttonItem = {
	type: 'button',
	children: 'Log out',
	variant: 'ghost',
	color: 'danger'
} satisfies MenuItem;
\`\`\`

### MenuOption Item
\`\`\`typescript
import type { MenuItem } from 'entasis/menu';

const optionItem = {
	type: 'option',
	title: 'Profile',
	description: 'Manage your account',
	href: '/profile'
} satisfies MenuItem;
\`\`\`

\`textValue\` sets the text type-ahead matches when the visible text should not count, for
example a row that starts with a keyboard shortcut:
\`\`\`typescript
import type { MenuItem } from 'entasis/menu';

const copyItem = {
	type: 'option',
	title: '⌘C  Copy',
	textValue: 'Copy'
} satisfies MenuItem;
\`\`\`

\`closeOnClick\` (default true) says whether pressing a button or option closes the PopupMenu it sits in; \`false\` marks the row \`data-menu-keep-open="true"\`:
\`\`\`typescript
import type { MenuItem } from 'entasis/menu';

const zoomIn = {
	type: 'option',
	title: 'Zoom in',
	closeOnClick: false
} satisfies MenuItem;
\`\`\`

### Separator Item
\`\`\`typescript
import type { MenuItem } from 'entasis/menu';

const separatorItem = {
	type: 'separator',
	color: 'neutral',
	decorative: true
} satisfies MenuItem;
\`\`\`

### Submenu Item
\`\`\`typescript
import type { MenuItem } from 'entasis/menu';

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

### Checkbox Item
A row with a checked state. It is a \`menuitemcheckbox\` with \`aria-checked\`, takes \`value\`, \`defaultValue\` and \`onValueChange\` like the other editable components, and keeps the menu open unless \`closeOnClick: true\`. The check indicator stays mounted and fades out when the row is unchecked. A consumer \`onclick\` runs first and \`preventDefault()\` there refuses the toggle.
\`\`\`typescript
import type { MenuItem } from 'entasis/menu';

const wordWrap = {
	type: 'checkbox',
	title: 'Word wrap',
	defaultValue: true,
	onValueChange: (next) => console.log(next)
} satisfies MenuItem;
\`\`\`

### Radio Group Item
Radio rows that share one value, inside a \`role="group"\` named by \`label\`. Each radio is a \`menuitemradio\`. Choosing the checked radio changes nothing; \`onValueChange\` reports the chosen value once. The group keeps the menu open unless \`closeOnClick: true\` (a radio's own \`closeOnClick\` wins).
\`\`\`typescript
import type { MenuItem } from 'entasis/menu';

const sortBy = {
	type: 'radio-group',
	label: 'Sort by',
	defaultValue: 'name',
	onValueChange: (value) => console.log(value),
	items: [
		{ value: 'name', title: 'Name' },
		{ value: 'date', title: 'Date modified' }
	]
} satisfies MenuItem;
\`\`\`

An option that passes \`selected\` still renders a \`menuitemradio\` for single-choice lists that keep their value elsewhere.

### Group Item
Rows under a label, inside a \`role="group"\` that the label names. The visible label is hidden from the accessibility tree, so it is not read twice. Arrow keys and type-ahead cross group boundaries.
\`\`\`typescript
import type { MenuItem } from 'entasis/menu';

const recent = {
	type: 'group',
	label: 'Recent',
	items: [
		{ type: 'option', title: 'notes.md' },
		{ type: 'option', title: 'todo.md' }
	]
} satisfies MenuItem;
\`\`\`

## Structure

The menu follows this DOM structure:
\`\`\`
<Menu>
	<div>                       <!-- first element: class, data attributes -->
		<!-- header snippet -->
		<div role="menu">
			<!-- Items rendered based on type -->
			<Button />
			<MenuOption />
			<div role="group">...</div>
			<Separator />
			<!-- ... -->
		</div>
		<!-- footer snippet -->
	</div>
</Menu>
\`\`\`

With \`filter\` the search field sits between the header and the \`role="menu"\` element, and the empty message (a \`role="status"\` region) after it.

## Examples

### Simple Menu
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';
	import { fileIcon } from 'entasis/icons/file';
	import { folderIcon } from 'entasis/icons/folder';

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
	import type { MenuItem } from 'entasis/menu';

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
	import type { MenuItem } from 'entasis/menu';
	import { starIcon } from 'entasis/icons/star';
	import { checkIcon } from 'entasis/icons/check';
	import { buildingIcon } from 'entasis/icons/building';

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
	import type { MenuItem } from 'entasis/menu';

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
	import type { MenuItem } from 'entasis/menu';

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
	import type { MenuItem } from 'entasis/menu';

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
	import type { MenuItem } from 'entasis/menu';
	import { gearIcon } from 'entasis/icons/gear';
	
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
	import type { MenuItem } from 'entasis/menu';

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
	import type { MenuItem } from 'entasis/menu';

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
	import type { MenuItem } from 'entasis/menu';

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
	import type { MenuItem } from 'entasis/menu';

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
	import type { MenuItem } from 'entasis/menu';
	import { userIcon } from 'entasis/icons/user';
	import { gearIcon } from 'entasis/icons/gear';
	import { signOutIcon } from 'entasis/icons/signOut';

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

### Checkbox Items and Radio Groups
\`\`\`svelte
<script lang="ts">
	import { Menu, type MenuItem } from 'entasis/menu';

	let minimap = $state(true);
	let sort = $state('name');

	const items: MenuItem[] = $derived([
		{
			type: 'checkbox',
			title: 'Minimap',
			value: minimap,
			onValueChange: (next) => (minimap = next)
		},
		{ type: 'checkbox', title: 'Word wrap', defaultValue: false },
		{ type: 'separator' },
		{
			type: 'radio-group',
			label: 'Sort by',
			value: sort,
			onValueChange: (next) => (sort = next),
			items: [
				{ value: 'name', title: 'Name' },
				{ value: 'date', title: 'Date modified' },
				{ value: 'size', title: 'Size' }
			]
		}
	]);
</script>

<Menu {items} />
\`\`\`

### Filterable Menu
A search field above the rows. Typing narrows them (case and accent insensitive, over the row's \`textValue\`, or its text, and its \`value\`); a group whose rows all drop out goes too, and separators are dropped while searching. Focus stays in the field: ArrowDown and ArrowUp highlight rows (wrapping), the first match is highlighted as you type, and Enter presses the highlighted row. ArrowRight at the end of the text opens a highlighted submenu, ArrowLeft at the start leaves a submenu. A row whose title is a snippet needs a \`textValue\` to be found.
\`\`\`svelte
<script lang="ts">
	import { PopupMenu } from 'entasis/popup-menu';
	import type { MenuItem } from 'entasis/menu';

	const items: MenuItem[] = [
		{ type: 'option', title: 'Open file' },
		{ type: 'option', title: 'Open folder' },
		{ type: 'option', title: 'Open recent' },
		{ type: 'option', title: 'Save' },
		{ type: 'option', title: 'Save as' }
	];
</script>

<PopupMenu
	trigger={{ content: 'Commands' }}
	menu={{
		items,
		filter: { placeholder: 'Find a command' },
		onSearchChange: (search) => console.log(search),
		onHighlightChange: (value) => console.log(value)
	}}
/>
\`\`\`

A submenu takes its own \`filter\` (a "Move to..." picker); it opens on its search field:
\`\`\`typescript
import type { MenuItem } from 'entasis/menu';

const moveTo = {
	type: 'submenu',
	title: 'Move to',
	filter: { placeholder: 'Pick a folder' },
	menu: [
		{ type: 'option', title: 'Inbox' },
		{ type: 'option', title: 'Archive' },
		{ type: 'option', title: 'Projects' }
	]
} satisfies MenuItem;
\`\`\`

### Mixed Size Items
\`\`\`svelte
<script lang="ts">
	import type { MenuItem } from 'entasis/menu';

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
- Option items render \`role="menuitem"\`; checkbox items render \`menuitemcheckbox\` and radio items \`menuitemradio\`, each with \`aria-checked\`; an option that passes \`selected\` (true or false) renders \`role="menuitemradio"\` too, so a check-marked choice is announced as checked rather than as a plain command
- Groups and radio groups render \`role="group"\` named (\`aria-labelledby\`) by their label, which is hidden from the accessibility tree. The header, footer and search field sit outside the \`role="menu"\` element
- ArrowUp / ArrowDown move the highlight, Home / End jump, Enter or Space activates, ArrowRight opens a submenu and ArrowLeft closes it; both are mirrored in right-to-left text, in an inline Menu as in a PopupMenu. A panel opened from a right-to-left trigger carries \`dir="rtl"\` itself, because it is portaled out of the trigger's subtree
- Tab inside a PopupMenu, ContextMenu or MenuBar menu closes every level and lets the browser carry on from the trigger, so focus lands on the control after it; Shift+Tab closes the menu and stays on the trigger. A field or link in the header or footer keeps Tab until the last one. Focus moving back to a row of the parent menu (a screen reader's cursor, a click) closes the submenus open beside it, so the arrow keys work there again
- Type-ahead: typing letters moves the highlight to the next item whose label starts with the typed text. An option or submenu item's \`textValue\` replaces its visible text for matching (useful when the title is a snippet or the row shows a shortcut); disabled and hidden items are passed over for the next match, and the typed text starts over when focus leaves the menu
- Disabled items and items hidden with CSS are skipped by the arrow keys, Home and End. The single Tab stop stays on the focused row element and follows the row that takes its place when the focused row is removed. Rows are keyed by identity (see \`key\`), so inserting, removing or reordering rows around the focused one leaves focus and the Tab stop on the same row
- Hovering a row highlights it without moving focus. While nothing on the page has focus, the arrow keys and Home / End move focus into the hovered menu; keys typed in a text field, a button or another popup stay there, and Enter or Space never activate the hovered row. A submenu row is the exception: it still opens its submenu after the hover \`delay\`, but a submenu the pointer opened does not take focus, so typing in a field elsewhere carries on
- Once focus is inside the menu, keys act on the focused row, not on the row under the pointer. When the menu panel itself has focus (a popup menu opened with the pointer), they act on the highlighted row that \`aria-activedescendant\` names, so Enter activates the row under the pointer
- Arrow, Home, End, Enter and Space pressed with Alt, Ctrl or Meta are left to the browser (Alt+ArrowLeft stays Back), including in menus opened from a MenuBar; Shift does not count as a modifier
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
- Open submenus beside their row on the reading direction's end side (\`inline-end-start\`: right in a left-to-right document, left in a right-to-left one); below \`md\` they drop below the row (\`bottom-start\`)
- Fall back below their row when neither side of the menu has room (\`fallbackAxisSide: 'end'\`), instead of covering the menu
- Support hover and click triggers (configurable)
- Manage submenu state internally using PopupMenu
- Support nested submenus (submenus within submenus)

Default submenu behavior:
- Opens on hover (after 100ms delay)
- Opens on click. A keyboard open (ArrowRight, Enter, Space) focuses the submenu's first row, a pointer click the submenu itself
- A second press on an open submenu's row closes it when it came from the keyboard or assistive technology, or follows a click; a mouse click on a submenu the pointer opened keeps it open
- On Apple platforms an open submenu's row omits \`aria-expanded\` (keeping \`aria-haspopup\` and \`aria-controls\`), because VoiceOver reads the trigger's state again when focus moves into the submenu
- Closes when the pointer leaves the submenu prediction cone and rectangle tolerance
- Closes when an item inside is chosen. Inside a PopupMenu, ContextMenu or MenuBar the submenu belongs to that menu: choosing an item at any depth closes every level at once, following the menu's closeOnItemClick. In an inline Menu, choosing an item closes the submenu and focus returns to its row
- An item (or an ancestor) with \`data-menu-keep-open="true"\` keeps every level open, for multi-select options: \`{ type: 'option', title: 'Bold', attrs: { 'data-menu-keep-open': 'true' } }\`

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
- **list**: The \`role="menu"\` element (density gap)
- **group** / **groupLabel**: A \`role="group"\` and its label
- **search** / **searchIcon** / **searchInput**: The search field of a filterable menu
- **empty**: The message shown when a search matches nothing
- **header** / **footer**: The header and footer slots
- **button**: Theme forwarded to Button items (optional)
- **option**: Theme forwarded to MenuOption items (optional)
- **separator**: Theme forwarded to Separator items (optional)
- **submenu**: Theme forwarded to submenu MenuOption triggers (optional)

### Theme Type Definition

\`\`\`typescript
import type { MenuThemeProps } from 'entasis/menu';
import type { ButtonThemeProps } from 'entasis/button';
import type { MenuOptionThemeProps } from 'entasis/menu-option';
import type { SeparatorThemeProps } from 'entasis/separator';

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
  import { setMenuTheme } from 'entasis/menu';
  import { setMenuOptionTheme } from 'entasis/menu-option';
  
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
