export const breadcrumbsDescription = `
# Breadcrumbs Component

A navigation component that displays a hierarchical path of links, helping users understand their location within a website or application. Supports keyboard navigation, dropdown menus for nested items, customizable separators, and ellipsis for long paths. Uses semantic HTML structure (\`<nav><ol><li>\`) following accessibility best practices.

## Basic Usage

\`\`\`svelte
<script>
  import { Breadcrumbs } from 'entasis/breadcrumbs';
  
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Electronics', href: '/products/electronics', active: true }
  ];
</script>

<Breadcrumbs {items} />
\`\`\`

## Props

### Core Props

- **items**: BreadcrumbItem[] (required)
  - Array of breadcrumb items to display
  - Each item is a config object with: label, href, active, disabled, onclick, icon, menu

- **home**: Omit<BreadcrumbItem, 'menu' | 'label'> & { label?: string | Snippet } (optional)
  - Optional home breadcrumb item to prepend to the items array
  - If provided, it will be rendered as the first breadcrumb
  - When \`label\` is omitted a house icon is rendered

- **maxItems**: number (optional)
  - Maximum number of items to show before using ellipsis
  - When set, shows first item, ellipsis, and last N items
  - Example: \`maxItems={3}\` shows first item + ellipsis + last 2 items
  - If maxItems >= items.length, all items are shown (no ellipsis)

- **showSeparator**: boolean (default: true)
  - Whether to display separators between breadcrumb items

- **class**: string
  - Additional CSS classes for the breadcrumbs container

- **theme**: BreadcrumbsThemeProps
  - Custom theme overrides for styling

### BreadcrumbItem Properties

- **label**: string | Snippet (required)
  - The text or snippet to display for the breadcrumb item
  - Can be a string or a snippet without parameters

- **href**: string (optional)
  - URL to navigate to. If provided, renders as an anchor element

- **active**: boolean (default: false)
  - Whether this breadcrumb represents the current page
  - Active items render as \`<span>\` with \`font-normal\` styling and \`aria-current="page"\`

- **disabled**: boolean (default: false)
  - Whether the breadcrumb item is disabled
  - Disabled items are not navigable and have reduced opacity

- **onclick**: (event: MouseEvent) => void (optional)
  - Native click event handler for the breadcrumb item

- **icon**: string | Snippet (optional)
  - Icon snippet or string to display before the label

- **menu**: MenuItem[] (optional)
  - Array of menu items for dropdown functionality
  - If provided, the breadcrumb renders as a PopupMenu

### Content Props (Slots)

- **separator**: Snippet
  - Custom separator between breadcrumb items
  - Default: \`arrowRightIcon\` (chevron right icon)
  - No parameters passed to the snippet

- **ellipsis**: Snippet
  - Custom rendering for the ellipsis indicator
  - Default: \`dotsThreeOutlineIcon\` with "More" screen reader text
  - No parameters passed to the snippet

## Examples

### Basic Breadcrumbs with Links

\`\`\`svelte
<script>
  import { Breadcrumbs } from 'entasis/breadcrumbs';
  
  const items = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Team', href: '/about/team', active: true }
  ];
</script>

<Breadcrumbs {items} />
\`\`\`

### Breadcrumbs with Home Item

\`\`\`svelte
<script>
  import { Breadcrumbs } from 'entasis/breadcrumbs';
  
  const items = [
    { label: 'Products', href: '/products' },
    { label: 'Electronics', href: '/products/electronics', active: true }
  ];
</script>

<Breadcrumbs home={{ label: 'Home', href: '/' }} {items} />
<!-- Or with the default house icon -->
<Breadcrumbs home={{ href: '/' }} {items} />
\`\`\`

### Breadcrumbs with Icons

\`\`\`svelte
<script lang="ts">
  import { Breadcrumbs } from 'entasis/breadcrumbs';
  import { houseIcon } from 'entasis/icons/house';
  import { folderIcon } from 'entasis/icons/folder';
  import { fileIcon } from 'entasis/icons/file';
  
  const items = [
    { label: 'Home', href: '/', icon: houseIcon },
    { label: 'Documents', href: '/docs', icon: folderIcon },
    { label: 'Report.pdf', href: '/docs/report', icon: fileIcon, active: true }
  ];
</script>

<Breadcrumbs {items} />
\`\`\`

### Breadcrumbs with Dropdown Menus

\`\`\`svelte
<script lang="ts">
  import { Breadcrumbs, type BreadcrumbItem } from 'entasis/breadcrumbs';
  
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { 
      label: 'Products', 
      menu: [
        { type: 'option', children: 'All Products', href: '/products' },
        { type: 'option', children: 'Electronics', href: '/products/electronics' },
        { type: 'option', children: 'Clothing', href: '/products/clothing' }
      ]
    },
    { label: 'Electronics', href: '/products/electronics', active: true }
  ];
</script>

<Breadcrumbs {items} />
\`\`\`

### Custom Separator

\`\`\`svelte
<script>
  import { Breadcrumbs } from 'entasis/breadcrumbs';
  
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Details', href: '/products/details', active: true }
  ];
</script>

<Breadcrumbs {items}>
  {#snippet separator()}
    <span class="text-neutral/70">›</span>
  {/snippet}
</Breadcrumbs>
\`\`\`

### Breadcrumbs with Ellipsis

\`\`\`svelte
<script>
  import { Breadcrumbs } from 'entasis/breadcrumbs';
  
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Category 1', href: '/cat1' },
    { label: 'Category 2', href: '/cat2' },
    { label: 'Category 3', href: '/cat3' },
    { label: 'Category 4', href: '/cat4' },
    { label: 'Current Page', href: '/current', active: true }
  ];
</script>

<!-- Shows first item + ellipsis + last 2 items -->
<Breadcrumbs {items} maxItems={3} />
\`\`\`

### Inline Items

\`\`\`svelte
<script>
  import { Breadcrumbs } from 'entasis/breadcrumbs';
</script>

<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Electronics', active: true }
  ]}
/>
\`\`\`

### Items with Snippet Labels

\`\`\`svelte
<script>
  import { Breadcrumbs } from 'entasis/breadcrumbs';
</script>

{#snippet productsLabel()}
  <strong>Products</strong>
{/snippet}

<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: productsLabel, href: '/products' },
    { label: 'Details', href: '/products/details', active: true }
  ]}
/>
\`\`\`

### Disabled Items

\`\`\`svelte
<script>
  import { Breadcrumbs } from 'entasis/breadcrumbs';
  
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products', disabled: true },
    { label: 'Details', href: '/products/details', active: true }
  ];
</script>

<Breadcrumbs {items} />
\`\`\`


### Without Separators

\`\`\`svelte
<script>
  import { Breadcrumbs } from 'entasis/breadcrumbs';
  
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Details', href: '/products/details', active: true }
  ];
</script>

<Breadcrumbs {items} showSeparator={false} />
\`\`\`

## BreadcrumbItem Type

Each item in the \`items\` array is a config object with properties like \`label\`, \`href\`, \`active\`, etc.

The \`label\` property can be a string or a snippet without parameters.

## Keyboard Navigation

The Breadcrumbs component supports full keyboard navigation via the \`useNavigation\` hook:

- **Arrow Left**: Navigate to previous breadcrumb item
- **Arrow Right**: Navigate to next breadcrumb item
- **Home**: Navigate to first breadcrumb item
- **End**: Navigate to last breadcrumb item
- **Enter/Space**: Activate the focused breadcrumb item
- **Escape**: Clear focus

Disabled items are automatically skipped during keyboard navigation.

## Accessibility

- Uses semantic \`<nav>\` element with \`aria-label="Breadcrumbs"\`
- Active items use \`aria-current="page"\` attribute
- Disabled items use \`aria-disabled\` attribute
- Proper focus management with roving tabindex pattern
- Keyboard navigation support for all interactive elements
- Screen reader friendly with proper ARIA attributes

## Structure

The component uses semantic HTML structure:
- \`<nav>\` element with \`aria-label="Breadcrumbs"\`
- \`<ol>\` (ordered list) for the breadcrumb list
- \`<li>\` elements for each breadcrumb item
- \`<li>\` elements for separators with \`role="presentation"\` and \`aria-hidden="true"\`
- Active items render as \`<span>\` with \`role="link"\`, \`aria-disabled="true"\`, and \`aria-current="page"\`
- Non-active items render as links (\`<a>\`) or buttons (\`<button>\`)
- Ellipsis indicator for long paths
- PopupMenu integration for items with nested menus

## Notes

- Items with \`href\` render as anchor elements, others render as buttons
- Active items render as \`<span>\` elements with \`font-normal\` styling (not bold)
- Disabled items cannot be navigated and have reduced opacity
- Separators are not shown after the last item
- The default separator is \`arrowRightIcon\` (chevron right) but can be customized via the \`separator\` slot
- Items with \`menu\` property automatically render as PopupMenu components
- Ellipsis is shown when \`maxItems\` is set and there are more items than the limit
- Uses semantic HTML structure (\`<nav><ol><li>\`) for better accessibility
- Styling matches shadcn/ui breadcrumb component patterns
- Items can be simple strings/snippets or full config objects
- Labels and icons can be strings or snippets (no parameters)

## Theme Customization

The Breadcrumbs component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main breadcrumbs container styles
- **item**: Individual breadcrumb item styles
- **link**: Breadcrumb link/button styles
- **separator**: Separator icon/styles
- **ellipsis**: Ellipsis indicator styles
- **icon**: Icon styles

### Available Variants

**root**:
- base: Base classes for main container

**item**:
- base: Base classes for breadcrumb items
- Variants:
  - disabled: boolean - Disabled state styling
  - active: boolean - Active/current page styling

**link**:
- base: Base classes for links/buttons
- Variants:
  - disabled: boolean - Disabled state styling
  - active: boolean - Active state styling

**separator**:
- base: Base classes for separator icons

**ellipsis**:
- base: Base classes for ellipsis indicator

**icon**:
- base: Base classes for icons
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Breadcrumbs 
  items={items}
  theme={{
    root: {
      base: 'flex items-center gap-2 text-sm'
    },
    item: {
      active: {
        true: 'text-primary font-semibold'
      }
    }
  }}
/>
\`\`\`

**Custom Link Styling**:
\`\`\`svelte
<Breadcrumbs 
  items={items}
  theme={{
    link: {
      base: 'hover:text-primary transition-colors',
      active: {
        true: 'text-gray-900 font-semibold'
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed'
      }
    },
    separator: {
      base: 'text-gray-400 mx-2'
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setBreadcrumbsTheme } from 'entasis/breadcrumbs';
  
  setBreadcrumbsTheme({
    root: {
      base: 'flex items-center gap-2 text-sm'
    },
    item: {
      active: {
        true: 'text-primary'
      }
    },
    separator: {
      base: 'text-gray-400'
    }
  });
</script>
\`\`\`
`;
