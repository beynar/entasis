---
name: building-with-svelai
description: Builds UIs with the svelai component library for SvelteKit. Covers component usage, theming, Tailwind plugin configuration, form inputs, overlays, layout primitives, and theme customization. Use when the user asks to build UI with svelai components, customize themes, or work with svelai form inputs.
---

# svelai Component Library

A configuration-over-markup component library for SvelteKit. Components are styled via a global theme system backed by a Tailwind CSS plugin.

## Contents

- [Import Convention](#import-convention)
- [Common Props](#common-props)
- [Snippet Pattern](#snippet-pattern)
- [Theme System](#theme-system)
- [Color Tokens](#color-tokens)
- [Design Tokens](#design-tokens)
- [Component Theme Customization](#component-theme-customization)
- [Component References](#component-references)

## Import Convention

All components use kebab-case package paths with PascalCase component names:

```svelte
<script>
  import { Button } from 'svelai/button';
  import { TextInput } from 'svelai/text-input';
  import { Dialog } from 'svelai/dialog';
  import { Popover } from 'svelai/popover';
</script>
```

## Common Props

Most components share these prop patterns:

### Colors
`color`: `'primary'` | `'secondary'` | `'success'` | `'warning'` | `'danger'` | `'info'` | `'background'` | `'foreground'`

### Sizes
`size`: `'small'` | `'normal'` | `'large'`

### Variants (interactive components)
`variant`: `'solid'` | `'outline'` | `'soft'` | `'ghost'` | `'link'`

### Common
- `class`: string - Additional CSS classes
- `theme`: ComponentTheme - Per-instance theme overrides
- `ref`: HTMLElement - Bind to underlying DOM element
- `disabled`: boolean

## Snippet Pattern

Most components accept `prefix` and `suffix` snippets for composable content:

```svelte
<script>
  import { Button } from 'svelai/button';
  import { plusIcon } from 'svelai/icons/plus';
</script>

<Button>
  {#snippet prefix()}{@render plusIcon()}{/snippet}
  Add Item
</Button>
```

`Slot` utility (`import { Slot } from 'svelai/slot'`) renders strings, numbers, Snippets, or components uniformly: `<Slot render={dynamicContent} />`

## Theme System

Three layers: Tailwind plugin (colors/tokens), `<Theme>` component (wraps app), `useTheme()` (runtime access).

```css
/* Tailwind plugin - defines colors and design tokens */
@plugin 'svelai/tailwind-plugin' {
  name: custom;
  default: true;
  colorscheme: light;
  primary: #6366f1;
  secondary: #8b5cf6;
  danger: #ef4444;
  success: #22c55e;
  warning: #f59e0b;
  info: #3b82f6;
  background: #FAFAFA;
  foreground: #121212;
  radius: normal;
  spacing: large;
  scale: majorThird;
}
```

```svelte
<!-- +layout.svelte - wrap app once -->
<script>
  import { Theme } from 'svelai/theme';
</script>
<Theme colorScheme="auto">{@render children()}</Theme>
```

Dark theme via `prefersDark: true` or named theme with `colorscheme: dark`. See [theming.md](theming.md) for full details.

## Color Tokens

Each base color generates variants: `{color}-light` (+15%), `{color}-lighter` (+25%), `{color}-dark` (-15%), `{color}-muted` (mixed with background), `{color}-contrast` (auto contrast). All overridable in plugin config.

Usage: `bg-primary`, `text-primary-contrast`, `border-danger-dark`, `bg-background-muted`.

## Design Tokens

| Token | Values | Default |
|-------|--------|---------|
| `radius` | `none` \| `subtile` \| `small` \| `normal` \| `large` \| `round` \| number | `normal` |
| `spacing` | `small` \| `normal` \| `large` \| number | `normal` |
| `scale` | `minorSecond` \| `majorSecond` \| `minorThird` \| `majorThird` \| `perfectFourth` \| `augmentedFourth` | `majorThird` |
| `raised-with-border` | boolean | `false` |

## Component Theme Customization

Every component has a theme object with parts (e.g., `button`, `prefix`, `suffix`). Each part has `base` classes and variant maps.

### Per-instance override

```svelte
<Button theme={{ button: { base: 'rounded-full shadow-lg' } }}>
  Custom
</Button>
```

### Global override

```svelte
<script>
  import { setButtonTheme } from 'svelai/button';

  setButtonTheme({
    button: {
      variant: { solid: 'shadow-md hover:shadow-lg transition-shadow' }
    }
  });
</script>
```

Pattern: `import { set{Component}Theme } from 'svelai/{kebab-name}'`

## Component References

**Theming & Config**: See [theming.md](theming.md) for full Tailwind plugin config and Theme component details.

**Display**: See [display.md](display.md) for Button, ButtonGroup, Badge, Avatar, Chip, Heading, Code, Meter, MetadataList, Rating, ToggleButton, ToggleButtonGroup, QRCode, PDFViewer, Icons.

**Form Inputs**: See [form-inputs.md](form-inputs.md) for TextInput, TextArea, NumberInput, RatingInput, PasswordInput, PhoneInput, DateInput, TimeInput, ColorInput, ColorPicker, Select, Combobox, TagsInput, KeyValueInput, Switch, RadioInput, CheckboxesInput, FileInput, Calendar, MiniCalendar, Form, MultiStepForm.

**Layout & Navigation**: See [layout.md](layout.md) for Tabs, Tabbar, Stepper, Breadcrumbs, Accordion, Collapsible, Separator, Menu, PopupMenu, MenuOption, Carousel, ScrollArea, AspectRatio, Marquee.

**Overlays & Feedback**: See [overlays.md](overlays.md) for Dialog, Popover, Tooltip, Toast, Confirmation, Alert, NetworkIndicator.

**Data & Utility**: See [data-utility.md](data-utility.md) for Table, SortableList, Card, Skeleton, Slot.

## Quick Patterns

### Form with validation
```svelte
<script>
  import { Form } from 'svelai/form';
  import { Button } from 'svelai/button';
</script>

<Form inputs={{
  email: { type: 'email', label: 'Email', required: true, class: 'col-span-1' },
  password: { type: 'password', label: 'Password', required: true, class: 'col-span-1' }
}} onSubmit={handleSubmit}>
  {#snippet footer({ form })}
    <Button type="submit" disabled={!form.isValid}>Submit</Button>
  {/snippet}
</Form>
```

### Confirmation dialog
```typescript
import { confirmation } from 'svelai/confirmation';

const { confirmed, result } = await confirmation({
  title: 'Delete item?',
  description: 'This cannot be undone.',
  confirm: 'Delete',
  cancel: 'Cancel',
  onConfirm: async () => {
    await deleteItem();
  }
});
```

### Toast notifications
```typescript
import { toast } from 'svelai/toast';

toast.success({ title: 'Saved!' });
toast.danger({ title: 'Error', description: 'Something went wrong.' });

// Loading toast
const t = toast.info({ title: 'Uploading...', loading: true, duration: false });
await upload();
t.remove();
toast.success({ title: 'Done!' });
```

<!-- component-contract:inventory:start -->
## Generated Package Inventory

This section is generated from `tooling/component-contract/manifest.ts`.

### AI

- `svelai/ai-conversation` — Conversation (/components/ai-conversation)
- `svelai/ai-ask-user-question` — Ask user question (/components/ai-ask-user-question)
- `svelai/ai-chat` — Chat (/components/ai-chat)
- `svelai/ai-context` — Context (/components/ai-context)
- `svelai/ai-thread` — Thread (/components/ai-thread)
- `svelai/ai-thread-toc` — Thread TOC (/components/ai-thread-toc)
- `svelai/ai-message` — Message (/components/ai-message)
- `svelai/ai-message-actions` — Message actions (/components/ai-message-actions)
- `svelai/ai-marker` — Marker (/components/ai-marker)
- `svelai/ai-model-selector` — Model selector (/components/ai-model-selector)
- `svelai/ai-composer` — Composer (/components/ai-composer)
- `svelai/ai-reasoning` — Reasoning (/components/ai-reasoning)
- `svelai/ai-suggestion` — Suggestion (/components/ai-suggestion)
- `svelai/ai-tool` — Tool (/components/ai-tool)
- `svelai/ai-mcp-app` — MCP App (/components/ai-mcp-app)

### Layout

- `svelai/aspect-ratio` — Aspect ratio (/components/aspect-ratio)
- `svelai/card` — Card (/components/card)
- `svelai/grid` — Grid (/components/grid)
- `svelai/grid` — Grid span (/components/grid-span)
- `svelai/heading` — Heading (/components/heading)
- `svelai/resizable` — Resizable (/components/resizable)
- `svelai/scroll-area` — Scroll area (/components/scroll-area)
- `svelai/separator` — Separator (/components/separator)
- `svelai/stack` — Stack (/components/stack)

### Shells

- `svelai/app-shell` — App shell (/components/app-shell)
- `svelai/page-shell` — Page shell (/components/page-shell)
- `svelai/sidebar` — Sidebar (/components/sidebar)

### Actions

- `svelai/button` — Button (/components/button)
- `svelai/button-group` — Button group (/components/button-group)
- `svelai/segmented-control` — Segmented control (/components/segmented-control)
- `svelai/toggle-button` — Toggle button (/components/toggle-button)
- `svelai/toggle-button-group` — Toggle group (/components/toggle-button-group)
- `svelai/toggle-menu` — Toggle menu (/components/toggle-menu)
- `svelai/selection-menu` — Selection menu (/components/selection-menu)

### Forms

- `svelai/calendar` — Calendar (/components/calendar)
- `svelai/checkbox` — Checkbox (/components/checkbox)
- `svelai/checkboxes-input` — Checkboxes (/components/checkboxes)
- `svelai/color-input` — Color input (/components/color-input)
- `svelai/color-picker` — Color picker (/components/color-picker)
- `svelai/combobox` — Combobox (/components/combobox)
- `svelai/date-input` — Date input (/components/date-input)
- `svelai/date-selector` — Date selector (/components/date-selector)
- `svelai/file-input` — File (/components/file)
- `svelai/form` — Form (/components/form)
- `svelai/key-value-input` — Key value input (/components/key-value-input)
- `svelai/multi-step-form` — Multi-step form (/components/multi-step-form)
- `svelai/number-input` — Number input (/components/number-input)
- `svelai/password-input` — Password (/components/password)
- `svelai/phone-input` — Phone (/components/phone)
- `svelai/pin-input` — Pin input (/components/pin-input)
- `svelai/radio-input` — Radios (/components/radios)
- `svelai/rating-input` — Rating input (/components/rating-input)
- `svelai/rich-text-input` — Rich text input (/components/rich-text-input)
- `svelai/select` — Select (/components/select)
- `svelai/slider` — Slider (/components/slider)
- `svelai/switch` — Switch (/components/switch)
- `svelai/tag-group` — Tag group (/components/tag-group)
- `svelai/tags-input` — Tags input (/components/tags-input)
- `svelai/text-input` — Text input (/components/textinput)
- `svelai/text-area` — Textarea (/components/textarea)
- `svelai/time-input` — Time input (/components/time-input)
- `svelai/voice-input` — Voice input (/components/voice-input)

### Data display

- `svelai/avatar` — Avatar (/components/avatar)
- `svelai/avatar` — Avatar group (/components/avatar-group)
- `svelai/chart` — Chart (/components/chart)
- `svelai/chip` — Chip (/components/chip)
- `svelai/event-calendar` — Event calendar (/components/event-calendar)
- `svelai/gantt-chart` — Gantt chart (/components/gantt-chart)
- `svelai/kanban` — Kanban (/components/kanban)
- `svelai/kbd` — Kbd (/components/kbd)
- `svelai/metadata-list` — Metadata list (/components/metadata-list)
- `svelai/mini-calendar` — Mini calendar (/components/mini-calendar)
- `svelai/rating` — Rating (/components/rating)
- `svelai/sortable-list` — Sortable list (/components/sortable-list)
- `svelai/stat` — Stat (/components/stat)
- `svelai/table` — Table (/components/table)
- `svelai/data-table` — Data table (/components/data-table)
- `svelai/timeline` — Timeline (/components/timeline)
- `svelai/tree` — Tree (/components/tree)

### Feedback

- `svelai/alert` — Alert (/components/alert)
- `svelai/confirmation` — Confirmation (/components/confirmation)
- `svelai/empty` — Empty (/components/empty)
- `svelai/meter` — Meter (/components/meter)
- `svelai/network-indicator` — Network indicator (/components/network-indicator)
- `svelai/progress-circle` — Progress circle (/components/progress-circle)
- `svelai/skeleton` — Skeleton (/components/skeleton)
- `svelai/spinner` — Spinner (/components/spinner)
- `svelai/spinner-text` — Spinner text (/components/spinner-text)
- `svelai/toast` — Toast (/components/toast)

### Disclosure

- `svelai/accordion` — Accordion (/components/accordion)
- `svelai/collapsible` — Collapsible (/components/collapsible)

### Navigation

- `svelai/breadcrumbs` — Breadcrumbs (/components/breadcrumbs)
- `svelai/command` — Command (/components/command)
- `svelai/pagination` — Pagination (/components/pagination)
- `svelai/stepper` — Stepper (/components/stepper)
- `svelai/tabbar` — Tabbar (/components/tabbar)
- `svelai/table-of-contents` — Table of contents (/components/table-of-contents)
- `svelai/tabs` — Tabs (/components/tabs)

### Menus

- `svelai/context-menu` — Context menu (/components/context-menu)
- `svelai/menu` — Menu (/components/menu)
- `svelai/menu-bar` — Menu bar (/components/menu-bar)
- `svelai/menu-option` — Menu option (/components/menu-option)
- `svelai/popup-menu` — Popup menu (/components/popup-menu)

### Overlays

- `svelai/dialog` — Dialog (/components/dialog)
- `svelai/floating-window` — Floating window (/components/floating-window)
- `svelai/hover-card` — Hover card (/components/hover-card)
- `svelai/link-preview` — Link preview (/components/link-preview)
- `svelai/overlay` — Overlay (/components/overlay)
- `svelai/popover` — Popover (/components/popover)
- `svelai/tooltip` — Tooltip (/components/tooltip)

### Media

- `svelai/audio-player` — Audio player (/components/audio-player)
- `svelai/carousel` — Carousel (/components/carousel)
- `svelai/image-gallery` — Image gallery (/components/image-gallery)
- `svelai/image-zoom` — Image zoom (/components/image-zoom)
- `svelai/media-volume` — Media volume (/components/media-volume)
- `svelai/document-viewer` — Document viewer (/components/document-viewer)
- `svelai/video-player` — Video player (/components/video-player)

### Content & graphics

- `svelai/code` — Code (/components/code)
- `svelai/diff` — Diff (/components/diff)
- `svelai/globe` — Globe (/components/globe)
- `svelai/map` — Map (/components/map)
- `svelai/markdown` — Markdown (/components/markdown)
- `svelai/marquee` — Marquee (/components/marquee)
- `svelai/mermaid` — Mermaid (/components/mermaid)
- `svelai/qr-code` — QR code (/components/qr-code)

### Utilities

- `svelai/hitbox` — Hitbox (/utilities/hitbox)

### Utilities and entrypoints

- `svelai/package.json` — package-metadata
- `svelai/ai-file-preview` — svelte, component, ai
- `svelai/ask` — svelte, component, forms
- `svelai/field` — svelte, component, forms
- `svelai/slot` — svelte, component, utilities
- `svelai/theme` — svelte, component, configuration
- `svelai/i18n` — svelte, localization
- `svelai/tailwind-plugin` — tailwind, theme-configuration
- `svelai/tailwind-plugin/theme` — tailwind, theme-configuration, color-palettes
- `svelai/types` — typescript, utility
- `svelai/cva` — styling, utility
- `svelai/scheduling` — scheduling, utility
- `svelai/icons/*` — icons, snippet, wildcard-export
- `svelai/spinner-overlay` — attachment, feedback
<!-- component-contract:inventory:end -->
