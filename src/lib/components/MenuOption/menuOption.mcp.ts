export const menuOptionDescription = `
# MenuOption Component

The MenuOption component is a flexible menu item that can be used in dropdown menus, navigation menus, or context menus. It supports title/description layout, custom content, icons, colors, and various interaction handlers.

## Basic Usage

\`\`\`svelte
<MenuOption>
	{#snippet title()}
		My Menu Item
	{/snippet}
</MenuOption>
\`\`\`

## Props

### Core Props
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Scales typography and icons only
- **density**: 'small' | 'normal' | 'large' (default: 'normal') - Owns paddings, gaps and min-height; reflected as \`data-density\` on the row. Combine freely with size.
- **color**: Colors (default: 'primary') - Sets the semantic text color and persistent active tint
  - Available: primary, secondary, success, warning, danger, info, neutral

### Content Slots
Either use **title/description** OR **children** (mutually exclusive):
- **title**: Snippet - Main text of the menu item
- **description**: Snippet - Secondary descriptive text below the title
- **children**: Snippet - Custom content (replaces title+description)

### Icon/Badge Slots
- **prefix**: Snippet - Icon or badge at the start of the menu item
- **suffix**: Snippet - Icon or badge at the end of the menu item

### Interaction Props
- **onclick**: (event: MouseEvent) => void - Native click event handler
- **onpointerenter**: (event: PointerEvent) => void - Native pointer enter event handler
- **onpointerleave**: (event: PointerEvent) => void - Native pointer leave event handler

### Link Props
- **href**: string - If provided, renders as an anchor element
- **target**: string - Link target attribute (e.g., '_blank')
- **rel**: string - Link rel attribute (e.g., 'noopener noreferrer')

### Listbox / option props
MenuOption is also the shared row primitive for the listbox family (Command, Select, Combobox).
- **role**: string - ARIA role override. Defaults to button/link/menuitem; pass \`option\` inside a \`listbox\`.
- **highlighted**: boolean - Keyboard-active state (virtual focus). Applies the highlight background and reflects to \`data-highlighted\`. Menus omit this and rely on \`useNavigation\` setting \`data-highlighted\` imperatively.
- **selected**: boolean - Sets \`aria-selected\`/\`data-selected\` for single-select listboxes (pass a check icon via \`suffix\`).
- **disabled**: boolean - Dims the row, sets \`aria-disabled\`, blocks pointer/click.
- **attrs**: Record<string, any> - Extra attributes/handlers spread onto the row (\`id\`, \`data-value\`, \`tabindex\`, \`onpointermove\`, \`onmousedown\`).

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: MenuOptionThemeProps - Custom theme overrides
- **as**: string - Override the automatic element type detection

## Menu Structure

\`\`\`
<MenuOption>
	<Prefix />              <!-- Icon/badge at start -->
	<Content>               <!-- Main content area -->
		<Title />           <!-- Primary text -->
		<Description />     <!-- Secondary text -->
	</Content>
	<Suffix />              <!-- Icon/badge at end -->
</MenuOption>
\`\`\`

## Examples

### Basic Menu Item with Title
\`\`\`svelte
<MenuOption>
	{#snippet title()}
		Settings
	{/snippet}
</MenuOption>
\`\`\`

### Menu Item with Title and Description
\`\`\`svelte
<MenuOption>
	{#snippet title()}
		Account Settings
	{/snippet}
	{#snippet description()}
		Manage your account preferences and security
	{/snippet}
</MenuOption>
\`\`\`

### Menu Item with Prefix Icon
\`\`\`svelte
<script>
	import { Settings } from '$lib/components/Icons/index.svelte.js';
</script>

<MenuOption>
	{#snippet prefix()}
		<Settings />
	{/snippet}
	{#snippet title()}
		Settings
	{/snippet}
</MenuOption>
\`\`\`

### Menu Item with Suffix Icon
\`\`\`svelte
<script>
	import { ChevronRight } from '$lib/components/Icons/index.svelte.js';
</script>

<MenuOption>
	{#snippet title()}
		More Options
	{/snippet}
	{#snippet suffix()}
		<ChevronRight />
	{/snippet}
</MenuOption>
\`\`\`

### Menu Item with Both Icons
\`\`\`svelte
<script>
	import { User, Check } from '$lib/components/Icons/index.svelte.js';
</script>

<MenuOption>
	{#snippet prefix()}
		<User />
	{/snippet}
	{#snippet title()}
		John Doe
	{/snippet}
	{#snippet suffix()}
		<Check class="text-success" />
	{/snippet}
</MenuOption>
\`\`\`

### Different Sizes
\`\`\`svelte
<MenuOption size="small">
	{#snippet title()}Small Menu Item{/snippet}
</MenuOption>

<MenuOption size="normal">
	{#snippet title()}Normal Menu Item{/snippet}
</MenuOption>

<MenuOption size="large">
	{#snippet title()}Large Menu Item{/snippet}
</MenuOption>
\`\`\`

### Different Densities
\`\`\`svelte
<!-- density scales paddings/gaps/min-height; size scales text/icons -->
<MenuOption density="small">
	{#snippet title()}Small row{/snippet}
</MenuOption>

<MenuOption density="normal">
	{#snippet title()}Normal row{/snippet}
</MenuOption>

<MenuOption density="large">
	{#snippet title()}Large row{/snippet}
</MenuOption>
\`\`\`

### Different Colors
\`\`\`svelte
<MenuOption color="primary">
	{#snippet title()}Primary{/snippet}
</MenuOption>

<MenuOption color="danger">
	{#snippet title()}Delete{/snippet}
</MenuOption>

<MenuOption color="success">
	{#snippet title()}Approve{/snippet}
</MenuOption>
\`\`\`

### Interactive Menu Item with Click Handler
\`\`\`svelte
<script>
	let count = $state(0);
</script>

<MenuOption onclick={() => count++}>
	{#snippet title()}
		Clicked {count} times
	{/snippet}
</MenuOption>
\`\`\`

### Menu Item with Hover Handlers
\`\`\`svelte
<script>
	let isHovered = $state(false);
</script>

<MenuOption 
	onpointerenter={() => isHovered = true}
	onpointerleave={() => isHovered = false}
>
	{#snippet title()}
		{isHovered ? 'Hovering!' : 'Hover over me'}
	{/snippet}
</MenuOption>
\`\`\`

### Menu Item as Link
\`\`\`svelte
<MenuOption href="/settings">
	{#snippet title()}
		Go to Settings
	{/snippet}
</MenuOption>
\`\`\`

### External Link
\`\`\`svelte
<MenuOption 
	href="https://example.com" 
	target="_blank" 
	rel="noopener noreferrer"
>
	{#snippet title()}
		Visit External Site
	{/snippet}
	{#snippet suffix()}
		<ExternalLink />
	{/snippet}
</MenuOption>
\`\`\`

### Custom Content with Children
\`\`\`svelte
<MenuOption>
	{#snippet children()}
		<div class="flex items-center gap-2">
			<img src="/avatar.jpg" alt="User" class="w-8 h-8 rounded-full" />
			<div>
				<div class="font-bold">John Doe</div>
				<div class="text-xs text-neutral/70">john@example.com</div>
			</div>
		</div>
	{/snippet}
</MenuOption>
\`\`\`

### Menu with Multiple Options
\`\`\`svelte
<script>
	import { Settings, User, LogOut, HelpCircle } from '$lib/components/Icons/index.svelte.js';
</script>

<div class="w-64 bg-surface rounded-xl border border-neutral-muted p-1">
	<MenuOption>
		{#snippet prefix()}<User />{/snippet}
		{#snippet title()}Profile{/snippet}
		{#snippet description()}View and edit your profile{/snippet}
	</MenuOption>
	
	<MenuOption>
		{#snippet prefix()}<Settings />{/snippet}
		{#snippet title()}Settings{/snippet}
		{#snippet description()}Manage your preferences{/snippet}
	</MenuOption>
	
	<MenuOption>
		{#snippet prefix()}<HelpCircle />{/snippet}
		{#snippet title()}Help & Support{/snippet}
	</MenuOption>
	
	<div class="border-t border-neutral-muted my-1"></div>
	
	<MenuOption color="danger">
		{#snippet prefix()}<LogOut />{/snippet}
		{#snippet title()}Log Out{/snippet}
	</MenuOption>
</div>
\`\`\`

### With Custom Theme
\`\`\`svelte
<MenuOption 
	theme={{
		root: { base: 'rounded-full' },
		title: { base: 'font-bold' }
	}}
>
	{#snippet title()}
		Custom Styled Menu Item
	{/snippet}
</MenuOption>
\`\`\`

### With Attachments
\`\`\`svelte
<script>
	import { spinnerOverlay } from '$lib/attachments/spinnerOverlay.svelte.js';
	
	let loading = $state(false);
	
	async function handleClick() {
		loading = true;
		await fetch('/api/action');
		loading = false;
	}
</script>

<MenuOption 
	onclick={handleClick}
	{@attach spinnerOverlay({ loading })}
>
	{#snippet title()}
		Perform Action
	{/snippet}
</MenuOption>
\`\`\`

### Override Element Type
\`\`\`svelte
<!-- Force render as div even with onclick -->
<MenuOption as="div" onclick={() => console.log('clicked')}>
	{#snippet title()}
		Custom Element Type
	{/snippet}
</MenuOption>
\`\`\`

## Accessibility

- Automatically sets appropriate \`role\` attribute based on element type
  - \`button\` for interactive elements
  - \`link\` for anchor elements
  - \`menuitem\` for non-interactive elements
- Supports keyboard navigation when used as button or link
- Proper semantic HTML structure
- Color foreground meets accessibility standards

## Element Type Detection

The component automatically determines the HTML element to render:
1. If \`as\` prop is provided → uses that element
2. If \`href\` is provided → renders as \`<a>\`
3. Otherwise → renders as \`<button>\`
4. Otherwise → renders as \`<div>\`

## Notes

- Title and description snippets are mutually exclusive with children snippet
- Hover states automatically apply background color based on the color prop
- Prefix icons are positioned at the start, suffix icons at the end (with ml-auto)
- Hover and virtual focus use the shared current-color state layer
- Works well within Popover or Dialog components for dropdown menus

## Theme Customization

The MenuOption component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main menu option container styles
- **title**: Menu option title text styles
- **description**: Menu option description text styles
- **prefix**: Prefix icon/content styles
- **suffix**: Suffix icon/content styles
- **content**: Content wrapper styles

### Available Variants

**root**:
- base: Base classes applied to all menu options
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size
  - density: 'small' | 'normal' | 'large' - Padding, gap, and min-height
  - color: 'primary' | 'secondary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info' - Color scheme and hover states

**title**:
- base: Base classes for title text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size

**description**:
- base: Base classes for description text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size

**prefix**:
- base: Base classes for prefix content
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size
  - align: 'start' | 'center' - Vertical alignment

**suffix**:
- base: Base classes for suffix content
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size

**content**:
- base: Base classes for content wrapper
- Variants:
  - density: 'small' | 'normal' | 'large' - Gap spacing between title and description

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<MenuOption
  theme={{
    root: {
      base: 'rounded-lg',
      density: {
        large: 'px-4 py-3 min-h-12'
      }
    },
    title: {
      size: {
        large: 'text-lg font-semibold'
      }
    }
  }}
>
  {#snippet title()}
    Custom Menu Option
  {/snippet}
</MenuOption>
\`\`\`

**Color Customization**:
\`\`\`svelte
<MenuOption 
  color="danger"
  theme={{
    root: {
      color: {
        danger: 'text-red-600 highlight:bg-red-50 highlight:text-red-700'
      }
    }
  }}
>
  {#snippet title()}
    Delete Item
  {/snippet}
</MenuOption>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setMenuOptionTheme } from 'svelai/menu-option';
  
  setMenuOptionTheme({
    root: {
      base: 'rounded-md transition-colors',
      density: {
        normal: 'px-3 py-2'
      }
    },
    prefix: {
      size: {
        normal: 'w-5 h-5'
      }
    }
  });
</script>
\`\`\`
`;
