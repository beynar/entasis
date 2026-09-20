---
name: building-with-entasis
description: Builds UIs with the entasis component library for SvelteKit. Covers component usage, theming, Tailwind plugin configuration, form inputs, overlays, layout primitives, and theme customization. Use when the user asks to build UI with entasis components, customize themes, or work with entasis form inputs.
---

# entasis Component Library

A configuration-over-markup component library for SvelteKit. Components are styled via a global theme system backed by a Tailwind CSS plugin.

## Contents

- [Import Convention](#import-convention)
- [Common Props](#common-props)
- [Accessibility](#accessibility)
- [Snippet Pattern](#snippet-pattern)
- [Theme System](#theme-system)
- [Color Tokens](#color-tokens)
- [Design Tokens](#design-tokens)
- [Component Theme Customization](#component-theme-customization)
- [Component References](#component-references)

## Import Convention

All components use kebab-case package paths with PascalCase component names. There is no root `entasis` export; always import from the subpath.

```svelte
<script>
	import { Button } from 'entasis/button';
	import { TextInput } from 'entasis/text-input';
	import { Dialog } from 'entasis/dialog';
	import { Popover } from 'entasis/popover';
</script>
```

## Common Props

Most components share these prop patterns:

### Colors

`color`: `'primary'` | `'secondary'` | `'success'` | `'warning'` | `'danger'` | `'info'` | `'neutral'`

When `color` is omitted, controls inherit the theme's `defaultColor` (`'neutral'` unless changed via `<Theme designTokens>`).

### Sizes

`size`: `'small'` | `'normal'` | `'large'`

### Variants (interactive components)

`variant`: `'solid'` | `'outline'` | `'soft'` | `'ghost'` | `'link'`

### Common

- `class`: string - Additional CSS classes
- `theme`: ComponentTheme - Per-instance theme overrides
- `ref`: HTMLElement - Bind to underlying DOM element
- `disabled`: boolean
- `data-*`: every component accepts arbitrary `data-*` attributes and forwards them to its root
  element, so test hooks and analytics markers like `<Button data-testid="save">` always work.

### Naming rules

The same word means the same thing on every component; `tooling/check-public-api-contract.mjs`
fails the build when it does not.

- **State comes in threes.** A bindable `value` always ships with `defaultValue` and
  `onValueChange`; a bindable `open` always ships with `defaultOpen` and `onOpenChange`. Bind one,
  or drive it with the pair. Rating, Meter, ProgressCircle, and QRCode display a value they never
  edit and are marked `@readonly-value` in their props file.
- **Callbacks name the change, not the gesture**, take one payload object, and are present tense:
  `onValueChange`, `onOpenChange`, `onWidthChange`, `onSearchChange`. Never `onChange`, `onClick`,
  `onToggle`, `onPageChange`, or `onWidthChanged`.
- **`api` is the instance handle.** `bind:api` on Tabs, Stepper, DataTable, Tree, AIChat, and
  AIConversation gives the state object; the exported types are `TabsApi`, `StepperApi`,
  `DataTableApi`, `AIConversationApi`.
- **`label` is the one prop that names a component.** It is painted where the component has a
  visible label (every Field input, Select, Checkbox, Switch, Slider, Rating, Meter, Stat) and
  spoken where it has none (Button, ToggleButton, SegmentedControl, Pagination, Chart, ScrollArea,
  AudioPlayer, VideoPlayer, QRCode, field actions). There is no `ariaLabel` prop anywhere. A
  hidden visible label still names its control: Checkbox `mode="control"` speaks its string
  `label` instead of painting it. Omit `label` and the component falls back to a sensible default
  from the i18n catalog where it has one.
- **`size` is `'small' | 'normal' | 'large'`** (the exported `Sizes`) everywhere. `xs`/`sm`/`md`/
  `lg`/`xl` are Tailwind breakpoint and spacing words, never a component size.
- **Literal unions are kebab-case**: `position="top-right"`, `variant="outline"`,
  `icon="plus-minus"`. Disclosure controls (Accordion, Collapsible, AITool, Sidebar) share one
  `DisclosureIndicator` union: `'chevron' | 'plus-minus' | 'none'`.
- **Hover-opened surfaces delay with `delay`** (Popover, Menu submenus, PopupMenu), not
  `hoverDelay`.

## Accessibility

Accessibility is the library's job. Never pass an `aria-*` attribute to a entasis component: describe
the meaning and the component writes the attribute.

| You pass                                             | The component renders                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `<Button pressed={bold} />`                          | `aria-pressed`                                                                                       |
| `<Button selected={isActive} role="tab" />`          | `aria-selected`                                                                                      |
| `<Button expanded={open} haspopup="menu" />`         | `aria-expanded`, `aria-haspopup`                                                                     |
| `<Chip selected={filter === group} />`               | `aria-pressed` on a button chip, `aria-current` on a link chip (and `aria-disabled` from `disabled`) |
| `<Tabbar label="Sections" orientation="vertical" />` | `role="tablist"`, `aria-label`, `aria-orientation`                                                   |
| `<PageShell label="Invoice detail" />`               | `aria-label` on the `<main>` landmark                                                                |

An accessible name is always `label` — never `aria-label`, never `ariaLabel`.

`aria-controls` has no public prop. A trigger inside a Popover, PopupMenu, Select or Combobox is
wired by the surface itself: the built-in Button trigger gets `{...popover.triggerProps}`, and a
custom snippet trigger gets the same state through `{@attach popover.reference}`. Never set
`aria-haspopup` / `aria-expanded` / `aria-controls` on such a trigger by hand.

Escape hatches that still take raw attributes, because they are attribute bags spread onto a DOM
node rather than props: `MenuOption`'s `attrs`, `Field`'s `fieldAttrs`, `Select`'s `triggerAttrs`,
and the `attributes` object a `Carousel` dot hands its snippet. Map marker `label`, `popup` and
`tooltip` strings are likewise rendered as HTML — pass a snippet when the content is user-supplied.

## Snippet Pattern

Most components accept `prefix` and `suffix` snippets for composable content:

```svelte
<script>
	import { Button } from 'entasis/button';
	import { plusIcon } from 'entasis/icons/plus';
</script>

<Button>
	{#snippet prefix()}{@render plusIcon()}{/snippet}
	Add Item
</Button>
```

`Slot` utility (`import { Slot } from 'entasis/slot'`) renders strings, numbers, Snippets, or components uniformly: `<Slot render={dynamicContent} />`

## Theme System

Three layers: the Tailwind theme plugin (palette + engine utilities), the `<Theme>` component (wraps the app, runtime design tokens, light/dark switching), and the `ThemeState` it hands to its `children` snippet. The `@source` line lets Tailwind see the classes used inside the packaged components.

```css
/* app.css - one @plugin block per theme; the default one also bootstraps the engine */
@import 'tailwindcss';
@source '../node_modules/entasis/dist';

@plugin 'entasis/tailwind-plugin/theme' {
	name: light;
	default: true;
	colorscheme: light;
	surface: #fafafa;
	neutral: #18181b;
	primary: #5f62ef;
	secondary: #e4e4e7;
	danger: #dc2626;
	success: #15803d;
	warning: #f59e0b;
	info: #2563eb;
}
@plugin 'entasis/tailwind-plugin/theme' {
	name: dark;
	colorscheme: dark;
	surface: #09090b;
	surface-floating: #27272a;
	neutral: #fafafa;
	primary: #5f62ef;
	secondary: #27272a;
	danger: #dc2626;
	success: #15803d;
	warning: #f59e0b;
	info: #2563eb;
	state-hover-opacity: 0.16;
	state-pressed-opacity: 0.32;
	state-selected-opacity: 0.1;
}
```

```svelte
<!-- +layout.svelte - wrap app once -->
<script>
	import { Theme } from 'entasis/theme';

	let { children } = $props();
</script>

<Theme>{@render children()}</Theme>
```

Themes are applied as `html[data-theme="<name>"]`; `<Theme>` persists the choice in `localStorage` and follows the system preference by default. See [theming.md](theming.md) for full details.

## Color Tokens

Each semantic color (`primary`, `secondary`, `danger`, `success`, `warning`, `info`, `neutral`) generates variants: `{color}-light` (+15%), `{color}-lighter` (+25%), `{color}-dark` (-15%), `{color}-muted` (mixed with the base surface), `{color}-contrast` (auto contrast). All are overridable in the plugin block. Two read-only text variants are also generated: `{color}-readable` (colored text on the surface) and `{color}-muted-readable` (colored text on the muted tint).

Usage: `bg-primary`, `text-primary-contrast`, `border-danger-dark`, `bg-neutral-muted`, `text-primary-readable`.

Opaque surfaces use `surface-recessed` for inset wells and grouped-control tracks, followed by the elevation ladder `surface-canvas`, `surface`, `surface-raised`, and `surface-floating` (`bg-surface`, `bg-surface-raised`, ...). Transient hover, virtual focus, and press use the global `state-layer` utility, which composites `currentColor` without changing the resting surface. Use focus rings for focus and `*-muted` or solid colors for persistent selected, checked, open, or semantic states.

```svelte
<button class="state-layer bg-primary text-primary-contrast">Save</button>
```

`state-hover-opacity`, `state-pressed-opacity` and `state-selected-opacity` can be overridden per theme block. Their light-theme defaults are 0.05, 0.10 and 0.07; their dark-theme defaults are 0.16, 0.32 and 0.10. `state-selected-opacity` is the alpha `bg-selected-muted` composites the selected role at, which is why a selected row reads the same on `surface`, `surface-raised` and `surface-floating`.

## Design Tokens

Geometry tokens are runtime values passed to `<Theme designTokens={...}>`, keyed by theme name.
`radius`, `spacing`, `typeScale`, `elevation` and `motion` are _also_ build-time plugin options on
the `default: true` block; the runtime value wins for the theme that declares it, because it lands
on the more specific `html[data-theme="<name>"]`. The rest are runtime-only:

| Token              | Values                                                                                       | Default     |
| ------------------ | -------------------------------------------------------------------------------------------- | ----------- |
| `radius`           | `none` \| `subtile` \| `small` \| `normal` \| `large` \| `round` \| number                   | `normal`    |
| `spacing`          | `small` \| `normal` \| `large` \| number                                                     | `normal`    |
| `spacingScale`     | `{ xs?, sm?, md?, lg?, xl? }` multipliers of `--spacing`                                     | 1/1.5/2/3/4 |
| `typeScale`        | `compact` \| `default` \| `comfortable` \| `large` \| `{ baseMinPx, baseMaxPx, scale, ... }` | unset       |
| `elevation`        | `flat` \| `normal` \| `high`                                                                 | `normal`    |
| `motion`           | `{ duration?, easing? }` -- the five duration steps and four easing roles                    | unset       |
| `raisedWithBorder` | boolean                                                                                      | unset       |
| `defaultColor`     | `primary` \| `secondary` \| `danger` \| `success` \| `warning` \| `info` \| `neutral`        | `neutral`   |
| `focusColor`       | any color role -- pins every focus ring                                                      | unset       |
| `selectedColor`    | any color role -- pins every persistent selection fill                                       | unset       |
| `hoverColor`       | any color role -- pins the transient hover layer                                             | unset       |
| `pressedColor`     | any color role -- pins the transient pressed layer (falls back to `hoverColor`)              | unset       |

`focusColor`, `selectedColor`, `hoverColor` and `pressedColor` are the four **state roles**. Left
unset, each state falls back to the current role (`ring-focus` resolves to
`var(--color-focus, var(--color))`), so nothing changes visually; pin one and that state stops
following the control's own color everywhere at once. Theme-level only -- no per-component
override. See `theming.md` "State colours".

```svelte
<script lang="ts">
	import { Theme, type ThemeDesignTokenMap } from 'entasis/theme';

	let { children } = $props();
	const designTokens: ThemeDesignTokenMap = {
		light: { radius: 'large', spacing: 'normal', defaultColor: 'primary' },
		dark: { radius: 'large', spacing: 'normal', defaultColor: 'primary' }
	};
</script>

<Theme {designTokens}>{@render children()}</Theme>
```

## Component Theme Customization

Every component has a theme object with slots (e.g., `root`, `prefix`, `suffix`). Each slot has `base` classes plus one map per variant (`color`, `variant`, `size`, ...) keyed directly by variant value.

### Per-instance override

```svelte
<script>
	import { Button } from 'entasis/button';
</script>

<Button theme={{ root: { base: 'rounded-full shadow-lg' } }}>Custom</Button>
```

### Global override

```svelte
<script>
	import { setButtonTheme } from 'entasis/button';

	setButtonTheme({
		root: {
			base: 'tracking-wide',
			variant: { solid: 'shadow-md hover:shadow-lg transition-shadow' },
			color: { primary: 'ring-1 ring-primary/30' }
		}
	});
</script>
```

Pattern: `import { set{Component}Theme } from 'entasis/{kebab-name}'`. Overrides are appended to the defaults; pass `override: true` to drop the defaults entirely.

## Component References

**Theming & Config**: See [theming.md](theming.md) for full Tailwind plugin config and Theme component details.

**Display**: See [display.md](display.md) for Button, ButtonGroup, Avatar, Chip, Heading, Code, Meter, MetadataList, Rating, ToggleButton, ToggleButtonGroup, QRCode, DocumentViewer, Icons.

**Form Inputs**: See [form-inputs.md](form-inputs.md) for TextInput, TextArea, NumberInput, RatingInput, PasswordInput, PhoneInput, DateInput, TimeInput, ColorInput, ColorPicker, Select, Combobox, TagsInput, KeyValueInput, Switch, RadioInput, CheckboxesInput, FileInput, Calendar, MiniCalendar, Form, MultiStepForm.

**Layout & Navigation**: See [layout.md](layout.md) for Tabs, Tabbar, Stepper, Breadcrumbs, Accordion, Collapsible, Separator, Menu, PopupMenu, MenuOption, Carousel, ScrollArea, AspectRatio, Marquee, Sidebar, AppShell, Grid/GridSpan — including `AppShell variant="framed"`, `Sidebar activeVariant`, and the `mount` axis on Tabs and Stepper.

**Overlays & Feedback**: See [overlays.md](overlays.md) for Dialog, Popover, Tooltip, Toast, Confirmation, Alert, NetworkIndicator.

**Data & Utility**: See [data-utility.md](data-utility.md) for Table, DataTable, SortableList, Card, Skeleton, Slot.

## Quick Patterns

### Form with validation

```svelte
<script>
	import { Form } from 'entasis/form';
	import { Button } from 'entasis/button';

	const handleSubmit = async (value) => {
		console.log(value);
	};
</script>

<Form
	inputs={{
		email: { type: 'email', label: 'Email', required: true, class: 'col-span-1' },
		password: { type: 'password', label: 'Password', required: true, class: 'col-span-1' }
	}}
	onSubmit={handleSubmit}
>
	{#snippet footer(form)}
		<Button type="submit" loading={form.loading}>Submit</Button>
	{/snippet}
</Form>
```

### Confirmation dialog

```typescript
import { confirmation } from 'entasis/confirmation';

declare function deleteItem(): Promise<void>;

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
import { toast } from 'entasis/toast';

declare function upload(): Promise<void>;

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

- `entasis/ai-conversation` — Conversation (/components/ai-conversation)
- `entasis/ai-ask-user-question` — Ask user question (/components/ai-ask-user-question)
- `entasis/ai-chat` — Chat (/components/ai-chat)
- `entasis/ai-context` — Context (/components/ai-context)
- `entasis/ai-thread` — Thread (/components/ai-thread)
- `entasis/ai-thread-toc` — Thread TOC (/components/ai-thread-toc)
- `entasis/ai-message` — Message (/components/ai-message)
- `entasis/ai-message-actions` — Message actions (/components/ai-message-actions)
- `entasis/ai-marker` — Marker (/components/ai-marker)
- `entasis/ai-model-selector` — Model selector (/components/ai-model-selector)
- `entasis/ai-composer` — Composer (/components/ai-composer)
- `entasis/ai-reasoning` — Reasoning (/components/ai-reasoning)
- `entasis/ai-suggestion` — Suggestion (/components/ai-suggestion)
- `entasis/ai-tool` — Tool (/components/ai-tool)

### Layout

- `entasis/aspect-ratio` — Aspect ratio (/components/aspect-ratio)
- `entasis/card` — Card (/components/card)
- `entasis/grid` — Grid (/components/grid)
- `entasis/grid` — Grid span (/components/grid-span)
- `entasis/heading` — Heading (/components/heading)
- `entasis/resizable` — Resizable (/components/resizable)
- `entasis/scroll-area` — Scroll area (/components/scroll-area)
- `entasis/separator` — Separator (/components/separator)
- `entasis/stack` — Stack (/components/stack)

### Shells

- `entasis/app-shell` — App shell (/components/app-shell)
- `entasis/page-shell` — Page shell (/components/page-shell)
- `entasis/sidebar` — Sidebar (/components/sidebar)

### Actions

- `entasis/button` — Button (/components/button)
- `entasis/button-group` — Button group (/components/button-group)
- `entasis/segmented-control` — Segmented control (/components/segmented-control)
- `entasis/toggle-button` — Toggle button (/components/toggle-button)
- `entasis/toggle-button-group` — Toggle group (/components/toggle-button-group)
- `entasis/toggle-menu` — Toggle menu (/components/toggle-menu)
- `entasis/selection-menu` — Selection menu (/components/selection-menu)

### Forms

- `entasis/calendar` — Calendar (/components/calendar)
- `entasis/checkbox` — Checkbox (/components/checkbox)
- `entasis/checkboxes-input` — Checkboxes (/components/checkboxes)
- `entasis/color-input` — Color input (/components/color-input)
- `entasis/color-picker` — Color picker (/components/color-picker)
- `entasis/combobox` — Combobox (/components/combobox)
- `entasis/date-input` — Date input (/components/date-input)
- `entasis/date-selector` — Date selector (/components/date-selector)
- `entasis/file-input` — File (/components/file)
- `entasis/form` — Form (/components/form)
- `entasis/key-value-input` — Key value input (/components/key-value-input)
- `entasis/multi-step-form` — Multi-step form (/components/multi-step-form)
- `entasis/number-input` — Number input (/components/number-input)
- `entasis/password-input` — Password (/components/password)
- `entasis/phone-input` — Phone (/components/phone)
- `entasis/pin-input` — Pin input (/components/pin-input)
- `entasis/radio-input` — Radios (/components/radios)
- `entasis/rating-input` — Rating input (/components/rating-input)
- `entasis/rich-text-input` — Rich text input (/components/rich-text-input)
- `entasis/select` — Select (/components/select)
- `entasis/slider` — Slider (/components/slider)
- `entasis/switch` — Switch (/components/switch)
- `entasis/tag-group` — Tag group (/components/tag-group)
- `entasis/tags-input` — Tags input (/components/tags-input)
- `entasis/text-input` — Text input (/components/textinput)
- `entasis/text-area` — Textarea (/components/textarea)
- `entasis/time-input` — Time input (/components/time-input)
- `entasis/voice-input` — Voice input (/components/voice-input)

### Data display

- `entasis/avatar` — Avatar (/components/avatar)
- `entasis/avatar` — Avatar group (/components/avatar-group)
- `entasis/chart` — Chart (/components/chart)
- `entasis/chip` — Chip (/components/chip)
- `entasis/event-calendar` — Event calendar (/components/event-calendar)
- `entasis/gantt-chart` — Gantt chart (/components/gantt-chart)
- `entasis/kanban` — Kanban (/components/kanban)
- `entasis/kbd` — Kbd (/components/kbd)
- `entasis/metadata-list` — Metadata list (/components/metadata-list)
- `entasis/mini-calendar` — Mini calendar (/components/mini-calendar)
- `entasis/rating` — Rating (/components/rating)
- `entasis/sortable-list` — Sortable list (/components/sortable-list)
- `entasis/stat` — Stat (/components/stat)
- `entasis/table` — Table (/components/table)
- `entasis/data-table` — Data table (/components/data-table)
- `entasis/timeline` — Timeline (/components/timeline)
- `entasis/tree` — Tree (/components/tree)

### Feedback

- `entasis/alert` — Alert (/components/alert)
- `entasis/confirmation` — Confirmation (/components/confirmation)
- `entasis/empty` — Empty (/components/empty)
- `entasis/meter` — Meter (/components/meter)
- `entasis/network-indicator` — Network indicator (/components/network-indicator)
- `entasis/progress-circle` — Progress circle (/components/progress-circle)
- `entasis/skeleton` — Skeleton (/components/skeleton)
- `entasis/spinner` — Spinner (/components/spinner)
- `entasis/spinner-text` — Spinner text (/components/spinner-text)
- `entasis/toast` — Toast (/components/toast)

### Disclosure

- `entasis/accordion` — Accordion (/components/accordion)
- `entasis/collapsible` — Collapsible (/components/collapsible)

### Navigation

- `entasis/breadcrumbs` — Breadcrumbs (/components/breadcrumbs)
- `entasis/command` — Command (/components/command)
- `entasis/pagination` — Pagination (/components/pagination)
- `entasis/stepper` — Stepper (/components/stepper)
- `entasis/tabbar` — Tabbar (/components/tabbar)
- `entasis/table-of-contents` — Table of contents (/components/table-of-contents)
- `entasis/tabs` — Tabs (/components/tabs)

### Menus

- `entasis/context-menu` — Context menu (/components/context-menu)
- `entasis/menu` — Menu (/components/menu)
- `entasis/menu-bar` — Menu bar (/components/menu-bar)
- `entasis/menu-option` — Menu option (/components/menu-option)
- `entasis/popup-menu` — Popup menu (/components/popup-menu)

### Overlays

- `entasis/dialog` — Dialog (/components/dialog)
- `entasis/floating-window` — Floating window (/components/floating-window)
- `entasis/hover-card` — Hover card (/components/hover-card)
- `entasis/link-preview` — Link preview (/components/link-preview)
- `entasis/overlay` — Overlay (/components/overlay)
- `entasis/popover` — Popover (/components/popover)
- `entasis/tooltip` — Tooltip (/components/tooltip)

### Media

- `entasis/audio-player` — Audio player (/components/audio-player)
- `entasis/carousel` — Carousel (/components/carousel)
- `entasis/image-gallery` — Image gallery (/components/image-gallery)
- `entasis/image-zoom` — Image zoom (/components/image-zoom)
- `entasis/media-volume` — Media volume (/components/media-volume)
- `entasis/document-viewer` — Document viewer (/components/document-viewer)
- `entasis/video-player` — Video player (/components/video-player)

### Content & graphics

- `entasis/code` — Code (/components/code)
- `entasis/diff` — Diff (/components/diff)
- `entasis/globe` — Globe (/components/globe)
- `entasis/map` — Map (/components/map)
- `entasis/markdown` — Markdown (/components/markdown)
- `entasis/marquee` — Marquee (/components/marquee)
- `entasis/mermaid` — Mermaid (/components/mermaid)
- `entasis/qr-code` — QR code (/components/qr-code)

### Utilities

- `entasis/hitbox` — Hitbox (/utilities/hitbox)

### Utilities and entrypoints

- `entasis/package.json` — package-metadata
- `entasis/ai-file-preview` — svelte, component, ai
- `entasis/ask` — svelte, component, forms
- `entasis/field` — svelte, component, forms
- `entasis/slot` — svelte, component, utilities
- `entasis/theme` — svelte, component, configuration
- `entasis/i18n` — svelte, localization
- `entasis/tailwind-plugin` — tailwind, theme-configuration
- `entasis/tailwind-plugin/theme` — tailwind, theme-configuration, color-palettes
- `entasis/types` — typescript, utility
- `entasis/cva` — styling, utility
- `entasis/scheduling` — scheduling, utility
- `entasis/icons/*` — icons, snippet, wildcard-export
- `entasis/spinner-overlay` — attachment, feedback

<!-- component-contract:inventory:end -->
