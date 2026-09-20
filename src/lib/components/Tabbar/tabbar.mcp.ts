export const tabbarDescription = `
# Tabbar Component

The Tabbar component is a flexible navigation component that displays a list of tabs with support for active state management, custom styling, icons, and links.

## Basic Usage

\`\`\`svelte
<script>
	let activeTab = $state('Home');
</script>

<Tabbar items={['Home', 'Profile', 'Settings']} bind:value={activeTab} />
\`\`\`

## Props

### Core Props
- **items**: Array<string | TabItem> (required)
  - Array of tab items. Each item can be:
    - A simple string (e.g., "Home")
    - A TabItem object with: { value?, label, prefix?, suffix?, href?, disabled?, target?, rel? }
  - Every tab resolves to a string value: its \`value\`, else its string label, else its index as a string (\`getTabValue(item, index)\` is exported from \`entasis/tabbar\`)

- **value**: string (default: the first tab's value, bindable)
  - The value of the currently active tab (a string item is its own value)
  - Can be bound with \`bind:value\`
- **defaultValue**: string - Initial active tab value when value is omitted

- **onValueChange**: (value: string) => void
  - Callback function called when the active tab changes
  - Receives the new tab's value as an argument; not called when the current tab is re-selected

### Styling Props
- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - small: Compact size with smaller padding and text
  - normal: Standard size
  - large: Larger size with more padding

- **orientation**: 'horizontal' | 'vertical' (default: 'horizontal')
  - horizontal: Tabs arranged in a row
  - vertical: Tabs arranged in a column

- **color**: 'primary' | 'secondary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info' (default: 'primary')
  - Determines the color scheme of the active tab

- **variant**: 'underline' | 'pill' (default: 'underline')
  - underline: a colored bar slides along the active tab edge (side set by position)
  - pill: a rounded track where the active tab is a raised pill; the pill slides and resizes between tabs with the same animation
  - Both variants respect the color prop: the underline bar and the pill fill use color, and the active pill's label uses the color's contrast tone (use color='neutral' for a neutral pill)
  - The indicator is correct during SSR (a CSS-only bar rendered in the active tab) and hands off to a single measured element that slides after hydration, so it adapts to variable tab widths and to the vertical orientation

- **alignment**: 'start' | 'center' | 'end' (default: 'start')
  - start: Tabs aligned to the start of the container
  - center: Tabs centered in the container
  - end: Tabs aligned to the end of the container

- **fullWidth**: boolean (default: false)
  - Whether the tabbar should be full width
  - When true, the tabbar and individual tabs will expand to fill the available width

- **scrollFade**: boolean (default: true)
  - Applies the shared logical-axis scroll fade only while the tab list overflows

### Advanced Props
- **label**: string - Accessible name for the tab list, applied as aria-label. Give one to every page that shows more than one set of tabs
- **id**: string - DOM id prefix for the tabs; each tab renders as \`{id}-tab-{index}\`. Generated when omitted
- **controlsPanels**: boolean (default: false) - Adds \`aria-controls="{id}-panel-{index}"\` to every tab. \`Tabs\` sets it and renders the matching panels; only enable it yourself when you render panels with those ids
- **ref**: HTMLDivElement | null (bindable) - Reference to the tab list element
- **class**: string - Additional CSS classes for the tabbar container
- **theme**: TabbarThemeProps - Custom theme overrides

Native div attributes and attachments are forwarded to the root, minus the ARIA the tab list owns: \`role\`, \`aria-orientation\` (from \`orientation\`), and its accessible name (from \`label\`) are written by the component and cannot be overridden. Horizontal and vertical overflow use the shared \`scroll-fade-x\` and \`scroll-fade-y\` utilities by default; non-overflowing tab lists remain unmasked, including in no-support fallback browsers.

## TabItem Structure

When using object format for items:

\`\`\`typescript
type TabItem = {
  value?: string;                // Stable identifier; defaults to the string label
  label: string | Snippet;      // Tab label (required)
  prefix?: Snippet;              // Icon or content before label
  suffix?: Snippet;              // Icon or content after label
  href?: string;                 // URL for navigation tabs
  disabled?: boolean;            // Disable the tab
  target?: string;               // Link target (e.g., "_blank")
  rel?: string;                  // Link relationship
  menu?: string[];               // Entries shown in a popover menu (overflow pattern)
  onSelect?: (menuIndex: number) => void; // Called when a menu entry is picked
}
\`\`\`

### Menu tab (overflow pattern)

A tab with \`menu\` renders with a chevron and opens a popover menu instead of activating directly. Selecting an entry activates the tab, displays the entry's label on it (the tab's own label becomes the menu header), slides the indicator to it, and calls \`onSelect(menuIndex)\`. The selected entry shows a check mark in the menu.

\`\`\`svelte
<Tabbar
	items={['Home', 'Projects', { label: 'More', menu: ['Analytics', 'Reports', 'Billing'] }]}
	bind:value={activeTab}
/>
\`\`\`

## Structure

The tabbar follows this DOM structure:
\`\`\`
<Tabbar>
	<Tab>
		<TabContent>      <!-- Optional wrapper when prefix/suffix exist -->
			<Prefix />      <!-- Optional prefix content -->
			<Label />       <!-- Tab label -->
			<Suffix />      <!-- Optional suffix content -->
		</TabContent>
	</Tab>
	<!-- More tabs... -->
</Tabbar>
\`\`\`

## Examples

### Simple String Tabs
\`\`\`svelte
<script>
	let activeTab = $state('Home');
</script>

<Tabbar 
	items={['Home', 'About', 'Contact']} 
	bind:value={activeTab}
	color="primary"
/>
\`\`\`

### Tabs with Icons
\`\`\`svelte
<script lang="ts">
	import { houseIcon } from 'entasis/icons/house';
	import { userIcon } from 'entasis/icons/user';
	import { gearIcon } from 'entasis/icons/gear';

	let activeTab = $state('Home');

	const tabs = [
		{
			label: 'Home',
			prefix: houseIcon
		},
		{
			label: 'Profile',
			prefix: userIcon
		},
		{
			label: 'Settings',
			prefix: gearIcon
		}
	];
</script>

<Tabbar items={tabs} bind:value={activeTab} />
\`\`\`

### Navigation Tabs (with links)
\`\`\`svelte
<script>
	const tabs = [
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Analytics', href: '/analytics' },
		{ label: 'Reports', href: '/reports' }
	];
</script>

<Tabbar items={tabs} />
\`\`\`

### Tabs with Disabled State
\`\`\`svelte
<script>
	let activeTab = $state('Enabled Tab');
	
	const tabs = [
		{ label: 'Enabled Tab' },
		{ label: 'Disabled Tab', disabled: true },
		{ label: 'Another Tab' }
	];
</script>

<Tabbar items={tabs} bind:value={activeTab} />
\`\`\`

### Vertical Orientation
\`\`\`svelte
<script>
	let activeTab = $state('First');
</script>

<Tabbar 
	items={['First', 'Second', 'Third']} 
	bind:value={activeTab}
	orientation="vertical"
/>
\`\`\`

### Different Alignments
\`\`\`svelte
<script>
	let activeTab = $state('One');
</script>

<!-- Centered tabs -->
<Tabbar items={['One', 'Two', 'Three']} bind:value={activeTab} alignment="center" />

<!-- Right-aligned tabs -->
<Tabbar items={['One', 'Two', 'Three']} bind:value={activeTab} alignment="end" />
\`\`\`

### Full Width Tabs
\`\`\`svelte
<script>
	let activeTab = $state('Tab 1');
</script>

<!-- Full width tabbar where tabs expand to fill available space -->
<Tabbar items={['Tab 1', 'Tab 2', 'Tab 3']} bind:value={activeTab} fullWidth />
\`\`\`

### With onValueChange Callback
\`\`\`svelte
<script lang="ts">
	let activeTab = $state('Tab 1');
	
	function handleTabChange(value: string) {
		console.log('Active tab changed to:', value); // e.g. 'Tab 2'
	}
</script>

<Tabbar 
	items={['Tab 1', 'Tab 2', 'Tab 3']} 
	bind:value={activeTab}
	onValueChange={handleTabChange}
/>
\`\`\`

### Different Sizes and Colors
\`\`\`svelte
<script>
	let activeTab = $state('Small');
</script>

<!-- Small size with secondary color -->
<Tabbar 
	items={['Small', 'Tabs']} 
	bind:value={activeTab}
	size="small"
	color="secondary"
/>

<!-- Large size with success color -->
<Tabbar 
	items={['Large', 'Tabs']} 
	bind:value={activeTab}
	size="large"
	color="success"
/>
\`\`\`

### Complex Tabs with Badges
\`\`\`svelte
<script>
	import { Chip } from 'entasis/chip';
	
	let activeTab = $state('Inbox');
</script>

{#snippet unreadCount()}
	<Chip color="danger" size="small">5</Chip>
{/snippet}

<Tabbar
	items={['Inbox', { label: 'Messages', suffix: unreadCount }, 'Sent']}
	bind:value={activeTab}
/>
\`\`\`

### External Links
\`\`\`svelte
<script>
	const tabs = [
		{ label: 'Internal', href: '/dashboard' },
		{ label: 'External', href: 'https://example.com', target: '_blank', rel: 'noopener' }
	];
</script>

<Tabbar items={tabs} />
\`\`\`

## Accessibility

The Tabbar component follows WAI-ARIA best practices for tablist patterns:

### ARIA Attributes
- Sets \`role="tablist"\` on the container
- Sets \`role="tab"\` on each tab button
- Sets \`aria-selected="true"\` on the active tab, \`"false"\` on others
- Gives each tab a stable \`id\` (\`{id}-tab-{index}\`) and, with \`controlsPanels\`, an \`aria-controls\` pointing at its panel
- Sets \`aria-disabled="true"\` on disabled tabs
- Sets \`aria-activedescendant\` on the container to reference the active tab
- Implements roving tabindex pattern (active tab has \`tabindex="0"\`, others have \`tabindex="-1"\`)

### Keyboard Navigation
Full keyboard support following WAI-ARIA best practices:

**Horizontal Orientation:**
- **Arrow Left**: Move focus to previous tab
- **Arrow Right**: Move focus to next tab
- **Home**: Move focus to first tab
- **End**: Move focus to last tab
- **Enter/Space**: Activate the focused tab

**Vertical Orientation:**
- **Arrow Up**: Move focus to previous tab
- **Arrow Down**: Move focus to next tab
- **Home**: Move focus to first tab
- **End**: Move focus to last tab
- **Enter/Space**: Activate the focused tab

**Behavior:**
- Arrow keys move keyboard **focus** (visual indicator with ring)
- Enter/Space keys **activate** the focused tab (changes selection)
- Focus automatically wraps around (loops from last to first and vice versa)
- Disabled tabs are automatically skipped during navigation
- Focused tab automatically scrolls into view (smooth scroll)
- All navigation keys are prevented from scrolling the page
- Focus ring color matches the tab's color scheme

**Visual States:**
- **Active tab**: Colored text, background, and bottom/left border
- **Focused tab**: Ring outline in theme color (keyboard navigation)
- **Inactive tab**: Neutral gray text with subtle hover effect

## Notes

- When \`href\` is provided in a tab, it renders as an \`<a>\` tag, otherwise as a \`<button>\`
- Disabled tabs cannot be clicked and do not trigger \`onValueChange\`
- The active tab is identified by its string value (a string item's label, or an object item's \`value\` / string label); give object items an explicit \`value\` when labels may change or are snippets
- The \`value\` prop is bindable for two-way data binding
- Tabs with \`href\` will not update \`value\` on click (they navigate instead)
- Icon/content sizing is automatically adjusted based on tab size
- The component is fully responsive and works with all color schemes

## Theme Customization

The Tabbar component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main tabbar container styles
- **tab**: Individual tab styles
- **indicator**: The single measured active indicator that slides between tabs
- **staticIndicator**: The CSS-only indicator rendered inside the active tab for SSR / pre-hydration
- **prefix**: Prefix icon/content styles
- **suffix**: Suffix icon/content styles

### Available Variants

**root**:
- base: Base classes for tabbar container
- Variants:
  - orientation: 'horizontal' | 'vertical' - Tab orientation
  - scrollFade: 'none' | 'x' | 'y' - Logical-axis scroll fade, applied only while the list overflows
  - alignment: 'start' | 'center' | 'end' - Tab alignment
  - size: 'small' | 'normal' | 'large' - Gap between tabs
  - variant: 'underline' | 'pill' - Track styling
  - fullWidth: boolean - Expand the tabbar to fill its container

**tab**:
- base: Base classes for tab items
- Variants:
  - size: 'small' | 'normal' | 'large' - Padding, text size and gap
  - color: Color variants
  - active: boolean - Active state styling
  - focused: boolean - Keyboard-focused state styling
  - disabled: boolean - Disabled state styling
  - orientation: 'horizontal' | 'vertical'
  - position: 'top' | 'bottom' | 'left' | 'right' - Indicator edge
  - variant: 'underline' | 'pill'
  - fullWidth: boolean

**indicator**:
- base: Base classes for the sliding active indicator
- Variants:
  - variant: 'underline' | 'pill' - Bar or raised pill

**staticIndicator**:
- base: Base classes for the SSR indicator
- Variants:
  - variant: 'underline' | 'pill'
  - position: 'top' | 'bottom' | 'left' | 'right' - Which tab edge the underline sits on

**prefix**:
- base: Base classes for prefix content
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size

**suffix**:
- base: Base classes for suffix content
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Tabbar items={tabs}
  bind:value={activeTab}
  theme={{
    root: {
      base: 'border-b-2 border-gray-200',
      size: {
        normal: 'gap-4'
      }
    },
    tab: {
      active: {
        true: 'border-b-2 border-primary'
      }
    }
  }}
/>
\`\`\`

**Custom Active State**:
\`\`\`svelte
<Tabbar items={tabs}
  bind:value={activeTab}
  theme={{
    tab: {
      active: {
        true: 'bg-primary text-white rounded-t-lg'
      }
    },
    indicator: {
      base: 'bg-primary h-1 rounded-full'
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setTabbarTheme } from 'entasis/tabbar';
  
  setTabbarTheme({
    root: {
      base: 'border-b border-gray-200',
      size: {
        normal: 'gap-2'
      }
    },
    tab: {
      base: 'transition-colors',
      active: {
        true: 'text-primary border-b-2 border-primary'
      }
    }
  });
</script>
\`\`\`
`;
