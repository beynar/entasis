# Svelai Layout and Navigation Components

## Table of Contents
- [Tabs](#tabs)
- [Tabbar](#tabbar)
- [Stepper](#stepper)
- [Breadcrumbs](#breadcrumbs)
- [Accordion](#accordion)
- [Collapsible](#collapsible)
- [Separator](#separator)
- [Menu](#menu)
- [PopupMenu](#popupmenu)
- [MenuOption](#menuoption)
- [Carousel](#carousel)
- [ScrollArea](#scrollarea)
- [AspectRatio](#aspectratio)
- [Marquee](#marquee)

---

## Tabs
`import { Tabs } from 'svelai/tabs'`

Combines Tabbar + Stepper for a complete tabbed interface with animated content panels.

**Props:**
- `tabs`: `Array<string | TabItem>` (required)
- `activeTab`: number (default: 0, bindable)
- `placement`: `'top' | 'bottom' | 'left' | 'right'` (default: `'top'`) -- auto-sets orientation
- `onValueChange`: `(index: number) => void`
- `stepper`: StepperState (bindable) -- programmatic control: `next()`, `previous()`, `goTo(index)`
- `keyFramesOptions`: `{ duration: 300, easing: 'ease-in-out', fill: 'both' }`
- Tabbar passthrough: `tabbarSize`, `tabbarColor`, `tabbarOrientation`, `tabbarAlignment`, `tabbarFullWidth`, `tabbarClass`, `tabbarTheme`

**Content snippets:** `tab` (default, receives `{ stepper, item, index }`) or `tab1`, `tab2`, ... (1-based, take precedence)

```svelte
<Tabs tabs={['Home', 'Settings']} bind:activeTab placement="left">
  {#snippet tab1()}<div>Home content</div>{/snippet}
  {#snippet tab2()}<div>Settings content</div>{/snippet}
</Tabs>
```

**Theme parts:** `tabs` (variants: placement), `content` (variants: placement)

---

## Tabbar
`import { Tabbar } from 'svelai/tabbar'`

Standalone tab navigation bar with active indicator.

**Props:**
- `tabs`: `Array<string | TabItem>` (required) -- TabItem: `{ label, prefix?, suffix?, href?, disabled?, target?, rel? }`
- `activeTab`: number (default: 0, bindable)
- `size`: `'small' | 'normal' | 'large'` (default: `'normal'`)
- `color`: Colors (default: `'primary'`)
- `orientation`: `'horizontal' | 'vertical'`
- `alignment`: `'start' | 'center' | 'end'`
- `fullWidth`: boolean
- `onValueChange`: `(index: number) => void`

When `href` is provided, tab renders as `<a>`. Roving tabindex + full keyboard nav (Arrow keys, Home, End).

```svelte
<Tabbar tabs={['Tab 1', 'Tab 2']} bind:activeTab color="primary" />
```

**Theme parts:** `tabbar` (variants: orientation, size, color), `tabbarItem` (variants: active, disabled, size, color), `tabbarItemLabel` (variants: size, active), `tabbarItemPrefix` (variants: size), `tabbarItemSuffix` (variants: size), `tabbarIndicator` (variants: orientation, color)

---

## Stepper
`import { Stepper } from 'svelai/stepper'`

Animated multi-step content container with smooth height transitions.

**Props:**
- `items`: `Array<Item>` (required) -- any type
- `activeStep`: number (default: 0, bindable)
- `mode`: `'classic' | 'vertical'`
- `stepper`: StepperState (bindable) -- `next()`, `previous()`, `goTo(index)`, `activeStep`, `items`, `stepHeights`
- `onValueChange`: `(item: Item) => void`
- `keyFramesOptions`: `{ duration: 300, easing: 'ease-in-out', fill: 'both' }`

**Content snippets:** `step` (default, receives `{ stepper, item, index }`) or `step1`, `step2`, ... (1-based)

```svelte
<Stepper items={['Step 1', 'Step 2']} bind:stepper>
  {#snippet step1({ stepper })}<Button onclick={() => stepper.next()}>Next</Button>{/snippet}
  {#snippet step2({ stepper })}<Button onclick={() => stepper.previous()}>Back</Button>{/snippet}
</Stepper>
```

**Theme parts:** `stepper` (variants: mode), `container` (variants: mode), `step` (variants: mode)

---

## Breadcrumbs
`import { Breadcrumbs } from 'svelai/breadcrumbs'`

Hierarchical navigation path. Semantic `<nav><ol><li>` structure.

**Props:**
- `items`: `BreadcrumbItem[]` (required) -- `{ label, href?, active?, disabled?, onclick?, icon?, menu? }`
- `home`: BreadcrumbItem -- prepended first item
- `maxItems`: number -- shows first + ellipsis + last N items
- `showSeparator`: boolean (default: true)

**Snippets:** `separator`, `ellipsis`

Items with `menu` render as PopupMenu. Items can be strings or config objects.

```svelte
<Breadcrumbs
  home={{ label: 'Home', href: '/' }}
  items={[
    { label: 'Products', href: '/products' },
    { label: 'Details', active: true }
  ]}
  maxItems={3}
/>
```

**Theme parts:** `container`, `item` (variants: disabled, active), `link` (variants: disabled, active), `separator`, `ellipsis`, `icon`

---

## Accordion
`import { Accordion } from 'svelai/accordion'`

Collapsible content sections with single/multiple expand modes.

**Props:**
- `items`: `Array<Item>` (bindable)
- `titleKey` / `contentKey` / `descriptionKey`: string -- custom keys (defaults: `'title'`, `'content'`, `'description'`)
- `variant`: `'classic' | 'card' | 'outlined'`
- `size`: `'small' | 'normal' | 'large'` (default: `'normal'`)
- `splitted`: boolean -- spacing between items
- `oneAtATime`: boolean (default: true)
- `icon`: `'chevron' | 'math' | Snippet | false` (default: `'math'`)
- `onToggle`: `({ item, index, isOpen }) => void`
- `transitions`: SlideTransitionProps

**Snippets:** `title`, `description`, `content`, `icon` (receives `{ isOpen }`)

```svelte
<Accordion
  items={[{ question: 'Q?', answer: 'A.' }]}
  titleKey="question"
  contentKey="answer"
  variant="card"
  splitted
/>
```

**Theme parts:** `accordion`, `item`, `trigger`, `header`, `title`, `description`, `icon`, `content` -- all have size + variant variants

---

## Collapsible
`import { Collapsible } from 'svelai/collapsible'`

Single toggle show/hide with slide transition.

**Props:**
- `open`: boolean (controlled mode)
- `defaultOpen`: boolean (default: false, uncontrolled)
- `size`: `'small' | 'normal' | 'large'` (default: `'normal'`)
- `disabled`: boolean
- `onOpenChange`: `(open: boolean) => void`

**Snippets:** `trigger` (required), `content` (falls back to `children`)

Uses Svelte slide transition (200ms). Content removed from DOM when closed.

```svelte
<Collapsible bind:open={isOpen}>
  {#snippet trigger()}Toggle{/snippet}
  {#snippet content()}<p>Hidden content</p>{/snippet}
</Collapsible>
```

**Theme parts:** `container`, `trigger` (variants: disabled), `content`, `icon` -- all have size variants

---

## Separator
`import { Separator } from 'svelai/separator'`

Visual divider with optional label.

**Props:**
- `orientation`: `'horizontal' | 'vertical'`
- `color`: Colors or `'background'` (default: `'background'`)
- `thickness`: number (default: 1) -- thickness in px
- `decorative`: boolean -- sets role none when true, role separator when false

**Content:** `children` snippet or `children="OR"` string for label in the middle.

```svelte
<Separator color="primary" thickness={2}>
  {#snippet children()}OR{/snippet}
</Separator>
```

**Theme parts:** `separator` (variants: orientation, color), `label` (variants: orientation)

---

## Menu
`import { Menu } from 'svelai/menu'`

Renders an array of items: buttons, options, separators, and submenus.

**Props:**
- `items`: `MenuItem[]` (required) -- discriminated union by `type`
- `header` / `footer`: Snippet

**Item types:**
- `{ type: 'option', title, description?, prefix?, suffix?, onclick?, href?, color?, size? }`
- `{ type: 'button', children, variant?, color?, onclick? }`
- `{ type: 'separator', color?, thickness?, children? }`
- `{ type: 'submenu', title, menu: MenuItem[], openOnHover?, openOnClick?, hoverDelay?, closeOnMouseLeave? }`

```svelte
<Menu items={[
  { type: 'option', title: 'Profile', prefix: userIcon },
  { type: 'separator' },
  { type: 'submenu', title: 'Settings', menu: [
    { type: 'option', title: 'General' },
    { type: 'option', title: 'Privacy' }
  ]},
  { type: 'button', children: 'Logout', color: 'danger', variant: 'ghost' }
]} />
```

**Theme forwarding:** `menu` (variants: gap), `button`, `option`, `separator`, `submenu` -- each forwarded to child components

---

## PopupMenu
`import { PopupMenu } from 'svelai/popup-menu'`

Popover + Menu combo. Inherits all Popover props.

**Key props:**
- `menu`: `{ items: MenuItem[], class?, theme? }` (required)
- `trigger`: `Snippet | ButtonProps | false`
- `closeOnItemClick`: boolean (default: true)
- `position`, `offset`, `isOpen` (bindable), `openOnClick`, `openOnHover`, `hoverDelay`, `closeOnClickOutside`, `closeOnEscape`, `closeOnMouseLeave`

```svelte
<PopupMenu
  trigger={{ content: 'Open', variant: 'outline' }}
  position="bottom-start"
  menu={{ items: menuItems }}
/>
```

---

## MenuOption
`import { MenuOption } from 'svelai/menu-option'`

Individual menu item with title/description layout.

**Props:**
- `title` / `description` / `children`: Snippet (title+description OR children, mutually exclusive)
- `prefix` / `suffix`: Snippet
- `size`: `'small' | 'normal' | 'large'` (default: `'normal'`)
- `color`: Colors (default: `'primary'`)
- `onclick`, `onpointerenter`, `onpointerleave`
- `href`, `target`, `rel`
- `as`: string -- override element type

**Auto element detection:** href renders a, onclick renders button, else div.

```svelte
<script>
  import { MenuOption } from 'svelai/menu-option';
  import { gearIcon } from 'svelai/icons/gear';
</script>

<MenuOption href="/settings" color="primary">
  {#snippet prefix()}{@render gearIcon()}{/snippet}
  {#snippet title()}Settings{/snippet}
  {#snippet description()}Manage preferences{/snippet}
</MenuOption>
```

**Theme parts:** `menuOption` (variants: size, color), `title`, `description`, `prefix` (variants: size, align), `suffix`, `content`

---

## Carousel
`import { Carousel } from 'svelai/carousel'`

Scrollable item collection with navigation, dots, drag/touch support.

**Props:**
- `layout`: ResponsiveProperty (default: `{ default: 1 }`) -- items per breakpoint `{ xs, sm, md, lg, xl }`
- `gaps`: ResponsiveProperty (default: `{ default: 20 }`) -- gap in px
- `partialDelta`: ResponsiveProperty -- px to peek next item
- `dragFree`: boolean -- free drag vs snap
- `navigationButton`: `{ color, size }` or Snippet
- `dots`: `{ color, size }` or Snippet

**Children snippet** receives CarouselState: `next(count?)`, `prev(count?)`, `moveToSlide()`, `canScrollNext`, `canScrollPrev`, `currentSlide`, `sortedSlides`, `dots`

```svelte
<Carousel layout={{ xs: 1, md: 2, lg: 3 }} gaps={{ default: 16 }}
  navigationButton={{ color: 'primary' }} dots={{ color: 'primary' }}>
  {#each items as item}
    <div>{item.content}</div>
  {/each}
</Carousel>
```

**Theme parts:** `container`, `slider`, `navigationButton` (variants: size, color, disabled, direction), `dots` (variants: size, position), `dot` (variants: size, color, active)

---

## ScrollArea
`import { ScrollArea } from 'svelai/scroll-area'`

Custom scrollbar container.

**Props:**
- `orientation`: `'vertical' | 'horizontal' | 'both'` (default: `'vertical'`)
- `hideScrollbar`: boolean
- `fadeScrollbar`: boolean (default: true)

```svelte
<ScrollArea class="h-64" orientation="vertical">
  <!-- long content -->
</ScrollArea>
```

**Theme parts:** `base`, `viewport`, `content`, `scrollbar`, `scrollbarThumb`

---

## AspectRatio
`import { AspectRatio } from 'svelai/aspect-ratio'`

Maintains aspect ratio for content (images, videos, etc.).

**Props:**
- `ratio`: `'2x1' | '2x3' | '16x9' | '4x3' | '1x1' | '3x4' | '3x2' | '9x16' | '1x2'` (default: `'2x1'`)
- `ref`: HTMLElement

```svelte
<AspectRatio ratio="16x9">
  {#snippet children()}
    <img src="/img.jpg" alt="" class="h-full w-full object-cover" />
  {/snippet}
</AspectRatio>
```

**Theme parts:** `container`, `content`

---

## Marquee
`import { Marquee } from 'svelai/marquee'`

Infinite scrolling animation. Content auto-duplicated for seamless loop.

**Props:**
- `direction`: `'left' | 'up'` (default: `'left'`)
- `speed`: `'fast' | 'normal' | 'slow' | number` (default: `'fast'`) -- fast=20s, normal=40s, slow=80s
- `size`: `'small' | 'normal' | 'large'` (default: `'normal'`)
- `reverse`: boolean
- `pauseOnHover`: boolean (default: true)
- `fade`: boolean -- gradient mask at edges
- `numberOfCopies`: number (default: 2)
- `innerClass`: string -- class for each duplicated copy

Vertical marquees need a container with defined height.

```svelte
<Marquee speed="normal" fade direction="up" class="h-[400px]">
  {#each items as item}
    <div class="px-4 py-2 bg-background rounded">{item.text}</div>
  {/each}
</Marquee>
```

**Theme parts:** `marquee` (variants: direction, size), `inner` (variants: direction, size, pauseOnHover, reverse)
