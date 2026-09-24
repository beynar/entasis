# Entasis Layout and Navigation Components

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
- [Sidebar](#sidebar)
- [AppShell](#appshell)
- [Stack](#stack)
- [Grid and GridSpan](#grid-and-gridspan)

---

## Tabs

`import { Tabs } from 'entasis/tabs'`

Combines Tabbar + Stepper for a complete tabbed interface with animated content panels.

**Props:**

- `items`: `Array<string | TabItem>` (required)
- `value`: string (default: the first tab's value, bindable), `defaultValue` -- a string item is its own value; object items use `value`, else their string label
- `placement`: `'top' | 'bottom' | 'left' | 'right'` (default: `'top'`) -- auto-sets orientation
- `onValueChange`: `({ value, item, index }) => void`
- `api`: TabsApi (bindable) -- programmatic control: `next()`, `previous()`, `goTo(index)`
- `transition`: `ResponsiveProps<FSOProps>` -- panel swap timing (`duration` ms, `easing`); beats the `motion` theme slot (default token `slow`)
- `tabbar`: one object forwarded to the inner Tabbar -- `{ size, variant, color, orientation, alignment, fullWidth, scrollFade, label, class, theme }`
- `mount`: `'eager' | 'lazy' | 'once'` (default: `'lazy'`) -- when a panel's content exists. `lazy` builds it on first activation and tears it down once the slide away from it finishes, `once` keeps it after the first visit, `eager` builds every panel up front. A tab panel is usually a whole screen, which is why Tabs defaults to `lazy`. At rest the panel track is one viewport wide with only the shown panel laid out, so nothing overflows and nothing is clipped; it widens and clips only for the duration of a slide.

**Content snippet:** `children` receives `{ api, item, index }` and renders the panel of the given index. Each panel is a `role="tabpanel"` with `id` and `aria-labelledby` wired to its tab (`aria-selected`, `aria-controls`). Inactive panels are `inert` and `aria-hidden` at once and `hidden` as soon as the slide settles, so at rest `[role=tabpanel]:not([hidden])` is exactly the selected panel. The panel the track slides away from stays laid out for the length of the slide: `hidden` is `display:none`, so a panel dropped on the value change could neither slide nor fade out

```svelte
<script>
	import { Tabs } from 'entasis/tabs';

	let activeTab = $state('Home');
</script>

<Tabs items={['Home', 'Settings']} bind:value={activeTab} placement="left">
	{#snippet children({ index })}
		{#if index === 0}
			<div>Home content</div>
		{:else}
			<div>Settings content</div>
		{/if}
	{/snippet}
</Tabs>
```

**Theme parts:** `root` (variants: placement), `content` (variants: placement)

---

## Tabbar

`import { Tabbar } from 'entasis/tabbar'`

Standalone tab navigation bar with active indicator.

**Props:**

- `items`: `Array<string | TabItem>` (required) -- TabItem: `{ value?, label, prefix?, suffix?, href?, disabled?, target?, rel?, menu?, onSelect? }`
- `value`: string (default: the first tab's value, bindable), `defaultValue` -- a string item is its own value; object items use `value`, else their string label
- `id`: string -- id prefix for tabs (`{id}-tab-{index}`); `controlsPanels`: boolean -- add `aria-controls="{id}-panel-{index}"` (set by Tabs)
- `variant`: `'underline' | 'pill'`, `position`: `'top' | 'bottom' | 'left' | 'right'`, `scrollFade`: boolean
- `size`: `'small' | 'normal' | 'large'` (default: `'normal'`)
- `color`: Colors (default: theme `defaultColor`, `neutral`)
- `orientation`: `'horizontal' | 'vertical'`
- `alignment`: `'start' | 'center' | 'end'`
- `fullWidth`: boolean
- `onValueChange`: `(value: string) => void`

When `href` is provided, tab renders as `<a>`. Roving tabindex + full keyboard nav (Arrow keys, Home, End); each tab carries `id`, `aria-selected`, and (with `controlsPanels`) `aria-controls`.

```svelte
<script>
	import { Tabbar } from 'entasis/tabbar';

	let activeTab = $state('Tab 1');
</script>

<Tabbar items={['Tab 1', 'Tab 2']} bind:value={activeTab} color="primary" />
```

**Theme parts:** `root` (variants: orientation, size, color), `tab` (variants: active, disabled, size, color), `prefix` (variants: size), `suffix` (variants: size), `indicator` (variants: orientation, color), `staticIndicator`

---

## Stepper

`import { Stepper } from 'entasis/stepper'`

Animated multi-step content container with smooth height transitions.

**Props:**

- `items`: `Array<Item>` (required) -- any type
- `value`: number (default: 0, bindable), `defaultValue`
- `mode`: `'classic' | 'vertical'`
- `mount`: `StepperMount` -- `'eager' | 'lazy' | 'once'` (default: `'eager'`). Same meaning as on Tabs, but a bare Stepper defaults to `eager` because a wizard's earlier steps stay live. Inactive steps are `inert` and `aria-hidden` at once and `hidden` as soon as the slide settles. At rest the track is one viewport wide (no overflow, no clip); it widens to `steps × 100%` and clips only while a slide runs.
- `api`: StepperApi (bindable) -- `next()`, `previous()`, `goTo(index)`, `activeStep`, `items`, `stepHeights`
- `onValueChange`: `({ value, item, index }) => void`
- `transition`: `ResponsiveProps<FSOProps>` -- step translation timing (`duration` ms, `easing`); beats the `motion` theme slot (default token `slow`)
- `theme`: StepperThemeProps -- class slots plus the `motion` slot

**Content snippet:** `children` receives `{ api, item, index }` and renders the active step

```svelte
<script>
	import { Stepper } from 'entasis/stepper';
	import { Button } from 'entasis/button';
</script>

<Stepper items={['Step 1', 'Step 2']}>
	{#snippet children({ api, item, index })}
		<p>{item}</p>
		{#if index === 0}
			<Button onclick={() => api.next()}>Next</Button>
		{:else}
			<Button onclick={() => api.previous()}>Back</Button>
		{/if}
	{/snippet}
</Stepper>
```

**Theme parts:** `root` (variants: mode), `container` (variants: mode), `step` (variants: mode)

---

## Breadcrumbs

`import { Breadcrumbs } from 'entasis/breadcrumbs'`

Hierarchical navigation path. Semantic `<nav><ol><li>` structure.

**Props:**

- `items`: `BreadcrumbItem[]` (required) -- `{ label, href?, active?, disabled?, onclick?, icon?, menu? }`
- `home`: BreadcrumbItem -- prepended first item
- `maxItems`: number -- shows first + ellipsis + last N items
- `showSeparator`: boolean (default: true)

**Snippets:** `separator`, `ellipsis`

Items with `menu` render as PopupMenu. Items can be strings or config objects.

```svelte
<script>
	import { Breadcrumbs } from 'entasis/breadcrumbs';
</script>

<Breadcrumbs
	home={{ label: 'Home', href: '/' }}
	items={[
		{ label: 'Products', href: '/products' },
		{ label: 'Details', active: true }
	]}
	maxItems={3}
/>
```

**Theme parts:** `root`, `item` (variants: disabled, active), `link` (variants: disabled, active), `separator`, `ellipsis`, `icon`

Breadcrumbs is inline-sized: it is a flex item next to the back button in `PageShellHeader`, so it
is NOT a query container — adding `@container` would collapse it to zero width. Its item gap is a
single unconditional `gap-sm` at every width; there is no responsive gap to override per breakpoint.

---

## Accordion

`import { Accordion } from 'entasis/accordion'`

Collapsible content sections with single/multiple expand modes.

**Props:**

- `items`: `Array<Item>` (bindable)
- `titleKey` / `contentKey` / `descriptionKey`: string -- custom keys (defaults: `'title'`, `'content'`, `'description'`)
- `variant`: `'classic' | 'card' | 'outline'`
- `size`: `'small' | 'normal' | 'large'` (default: `'normal'`)
- `splitted`: boolean -- spacing between items
- `oneAtATime`: boolean (default: true)
- `value`: `string[]` (bindable) -- expanded item ids, `defaultValue`, `onValueChange: (value: string[]) => void`
- `icon`: `DisclosureIndicator | Slot` -- `'chevron' | 'plus-minus' | 'none'` (default: `'chevron'`)
- `onItemOpenChange`: `({ item, index, open }) => void` -- one item's open state; `onValueChange` reports the whole set
- `transitions`: SlideTransitionProps

**Snippets:** `title`, `description`, `content`, `icon` (receives `{ isOpen }`)

```svelte
<script>
	import { Accordion } from 'entasis/accordion';
</script>

<Accordion
	items={[{ question: 'Q?', answer: 'A.' }]}
	titleKey="question"
	contentKey="answer"
	variant="card"
	splitted
/>
```

**Theme parts:** `root`, `item`, `header`, `trigger`, `title`, `description`, `icon`, `iconWrapper`, `content` -- all have size + variant variants

---

## Collapsible

`import { Collapsible } from 'entasis/collapsible'`

Single toggle show/hide with slide transition.

**Props:**

- `open`: boolean (controlled mode)
- `defaultOpen`: boolean (default: false, uncontrolled)
- `size`: `'small' | 'normal' | 'large'` (default: `'normal'`)
- `disabled`: boolean
- `onOpenChange`: `(open: boolean) => void`
- `icon`: `DisclosureIndicator | Slot` -- `'chevron' | 'plus-minus' | 'none'` (default: `'chevron'`)
- `variant`: `'default' | 'peek'`, `peekHeight`: number | string -- peek keeps a preview of the content visible when closed

**Snippets:** `trigger` (receives `{ open }`), `children` (the content, receives `{ open }`), `srOnlyContent`

Uses Svelte slide transition (200ms). Content removed from DOM when closed.

```svelte
<script>
	import { Collapsible } from 'entasis/collapsible';

	let isOpen = $state(false);
</script>

<Collapsible bind:open={isOpen}>
	{#snippet trigger()}Toggle{/snippet}
	<p>Hidden content</p>
</Collapsible>
```

**Theme parts:** `root`, `trigger` (variants: disabled), `content`, `icon` -- all have size variants

---

## Separator

`import { Separator } from 'entasis/separator'`

Visual divider with optional label.

**Props:**

- `orientation`: `'horizontal' | 'vertical'`
- `color`: Colors (default: `'neutral'`)
- `thickness`: number (default: 1) -- thickness in px
- `decorative`: boolean -- sets role none when true, role separator when false

**Content:** `children` snippet or `children="OR"` string for label in the middle.

```svelte
<script>
	import { Separator } from 'entasis/separator';
</script>

<Separator color="primary" thickness={2}>
	{#snippet children()}OR{/snippet}
</Separator>
```

**Theme parts:** `root` (variants: orientation, color), `label` (variants: orientation)

---

## Menu

`import { Menu } from 'entasis/menu'`

Renders an array of items: buttons, options, separators, and submenus.

**Props:**

- `items`: `MenuItem[]` (required) -- discriminated union by `type`
- `header` / `footer`: Snippet

**Item types:**

- `{ type: 'option', title, description?, prefix?, suffix?, onclick?, href?, color?, size? }`
- `{ type: 'button', children, variant?, color?, onclick? }`
- `{ type: 'separator', color?, thickness?, children? }`
- `{ type: 'submenu', title, menu: MenuItem[], openOnHover?, openOnClick?, delay?, closeOnMouseLeave? }`

```svelte
<script>
	import { Menu } from 'entasis/menu';
	import { userIcon } from 'entasis/icons/user';
</script>

<Menu
	items={[
		{ type: 'option', title: 'Profile', prefix: userIcon },
		{ type: 'separator' },
		{
			type: 'submenu',
			title: 'Settings',
			menu: [
				{ type: 'option', title: 'General' },
				{ type: 'option', title: 'Privacy' }
			]
		},
		{ type: 'button', children: 'Logout', color: 'danger', variant: 'ghost' }
	]}
/>
```

**Theme parts:** `root` (variants: gap), `header`, `footer`. Item styling is forwarded to the child components (`MenuOption`, `Button`, `Separator`) via each item's own `theme`.

---

## PopupMenu

`import { PopupMenu } from 'entasis/popup-menu'`

Popover + Menu combo. Inherits all Popover props.

**Key props:**

- `menu`: `{ items: MenuItem[], class?, theme? }` (required)
- `trigger`: `Snippet | ButtonProps | false`
- `closeOnItemClick`: boolean (default: true)
- `position`, `offset`, `open` (bindable), `openOnClick`, `openOnHover`, `delay`, `closeOnClickOutside`, `closeOnEscape`, `closeOnMouseLeave`

```svelte
<script lang="ts">
	import { PopupMenu } from 'entasis/popup-menu';
	import type { MenuItem } from 'entasis/menu';

	const menuItems: MenuItem[] = [
		{ type: 'option', title: 'Edit' },
		{ type: 'option', title: 'Delete', color: 'danger' }
	];
</script>

<PopupMenu
	trigger={{ content: 'Open', variant: 'outline' }}
	position="bottom-start"
	menu={{ items: menuItems }}
/>
```

---

## MenuOption

`import { MenuOption } from 'entasis/menu-option'`

Individual menu item with title/description layout.

**Props:**

- `title` / `description` / `children`: Snippet (title+description OR children, mutually exclusive)
- `prefix` / `suffix`: Snippet
- `size`: `'small' | 'normal' | 'large'` (default: `'normal'`)
- `color`: Colors (default: `'neutral'`)
- `onclick`, `onpointerenter`, `onpointerleave`
- `href`, `target`, `rel`
- `as`: string -- override element type

**Auto element detection:** href renders a, onclick renders button, else div.

```svelte
<script>
	import { MenuOption } from 'entasis/menu-option';
	import { gearIcon } from 'entasis/icons/gear';
</script>

<MenuOption href="/settings" color="primary">
	{#snippet prefix()}{@render gearIcon()}{/snippet}
	{#snippet title()}Settings{/snippet}
	{#snippet description()}Manage preferences{/snippet}
</MenuOption>
```

**Theme parts:** `root` (variants: size, color), `title`, `description`, `prefix` (variants: size, align), `suffix`, `content`

---

## Carousel

`import { Carousel } from 'entasis/carousel'`

Scrollable item collection with drag/touch support and a chrome footer row under the slides.

**Props:**

- `items`: `Array<Item>` (required) -- one slide per item
- `layout`: `ResponsiveProps<number>` (default: `1`) -- slides per view
- `gaps`: `ResponsiveProps<number>` (default: `20`) -- gap in px
- `partialDelta`: `ResponsiveProps<number>` (default: `0`) -- px to peek next item

The slider clips itself (it is a scroll container) but bleeds on both axes by at least `--space-sm` and as far as `--elevation-bleed-x/y`: negative margins grow its border box past the host by that allowance on each side and matching padding and scroll padding put the slides back on the host's edges, so a slide's ring or shadow is never cropped at its edge while the slides, the footer row and the host all share one edge. The root does not clip. The bleed zone takes no pointer input — the track is `pointer-events: none` and the slides take it back — so it never swallows clicks meant for whatever the host drew above or below the slides, and a press, drag or wheel that starts on a slide still scrolls the track. Do not give the `slider` theme part a width (`w-full`, `inline-size`): pinning its border box to the host's width turns the bleed back into a shift and pulls the slide clip edge two allowances inside the footer's arrows.

- `dragFree`: boolean -- free drag vs snap
- `navigationButton`: `{ color, size }`, Snippet or `false` (default: `{ color: 'neutral' }`)
- `pagination`: `{ variant, color, size }`, Snippet or `false` (default: `{ variant: 'line' }`)
- `snapAlign`: `'start' | 'center' | 'end'`

Nothing overlays the slides. The chrome is a footer row below the slider: pagination on the leading
side, the prev/next pair at the trailing end. `pagination` defaults to `variant: 'line'` — a
recessed track whose fill is the fraction of the scrollable range already scrolled
(`CarouselState.progress`, 0..1). It is a readout, not a control: `role="progressbar"` with
`aria-valuenow/min/max` and an i18n accessible name, not focusable and not clickable.
`variant: 'dots'` is the other built-in style, one clickable dot per page in the same slot. With
`pagination={false}` and `navigationButton={false}` no footer is rendered at all; with
`pagination={false}` alone the prev/next pair stays at the trailing end.

**Children snippet** renders one slide and receives `{ carousel, item, index }`; `carousel` is the CarouselState: `next(count?)`, `prev(count?)`, `moveToSlide()`, `canScrollNext`, `canScrollPrev`, `currentSlide`, `sortedSlides`, `dots`, `progress`

```svelte
<script>
	import { Carousel } from 'entasis/carousel';

	const items = [{ content: 'One' }, { content: 'Two' }, { content: 'Three' }];
</script>

<Carousel
	{items}
	layout={{ xs: 1, md: 2, lg: 3 }}
	gaps={16}
	navigationButton={{ color: 'primary' }}
	pagination={{ color: 'primary' }}
>
	{#snippet children({ item })}
		<div>{item.content}</div>
	{/snippet}
</Carousel>
```

**Theme parts:** `root`, `slider`, `slide`, `footer`, `progress` (variants: size), `progressFill` (variants: color), `navigation`, `navigationButton` (variants: size, color, disabled), `dots` (variants: size), `dot` (variants: size, color, active)

The three responsive props take a number or a per-breakpoint record,
and the nearest defined key at or below the active step wins — so `layout={{ xs: 1, md: 2 }}` shows
two slides from 42rem up, and a record that starts at `md` leaves the narrow bands on the prop
default. See [Responsive props](theming.md#responsive-props) for the full rules.

**Breakpoints are container queries on the carousel itself**, not viewport media queries, and the
widths are the shared container breakpoint table exported from `entasis/theme` — the same table Grid
and Stack use: `sm` from 36rem (576px), `md` from 42rem (672px), `lg` from 56rem (896px), `xl` from
72rem (1152px) of carousel width, with `xs` below that. A 360px carousel in a sidebar of a wide page
is `xs`; the same carousel run full-bleed is `xl`. The slide width, gap and peek are resolved on the
server into the carousel's own internal custom properties, so the first
paint is already right; `CarouselState.breakpoint` reads a `ResizeObserver` only for the dot
grouping and the `next()` / `prev()` step size. The root is `w-full` and must be able to fill its
host — if you override the `root` theme part, keep `@container/carousel` and a full-width class, or
the carousel measures zero and sticks at `xs`.

---

## ScrollArea

`import { ScrollArea } from 'entasis/scroll-area'`

Custom scrollbar container.

**Props:**

- `type`: `'auto' | 'always' | 'scroll' | 'hover'` -- scrollbar visibility strategy
- `scrollFade`: boolean -- fade the content edges while more content is scrollable
- `scrollOnEdges`: boolean, `delay`: number, `label`: string
- `ref` / `viewportRef`: HTMLDivElement (bindable), `onscroll`

Scrolls in both directions; size the container (`class="h-64"`) to constrain it.

```svelte
<script>
	import { ScrollArea } from 'entasis/scroll-area';
</script>

<ScrollArea class="h-64" type="hover" scrollFade>
	<!-- long content -->
</ScrollArea>
```

**Theme parts:** `root`, `viewport`, `content`, `scrollbar`, `scrollbarX`, `scrollbarThumb`

---

## AspectRatio

`import { AspectRatio } from 'entasis/aspect-ratio'`

Maintains aspect ratio for content (images, videos, etc.).

**Props:**

- `ratio`: `'2x1' | '2x3' | '16x9' | '4x3' | '1x1' | '3x4' | '3x2' | '9x16' | '1x2'` (default: `'2x1'`)
- `ref`: HTMLElement

```svelte
<script>
	import { AspectRatio } from 'entasis/aspect-ratio';
</script>

<AspectRatio ratio="16x9">
	{#snippet children()}
		<img src="/img.jpg" alt="" class="h-full w-full object-cover" />
	{/snippet}
</AspectRatio>
```

**Theme parts:** `root`, `content`

---

## Marquee

`import { Marquee } from 'entasis/marquee'`

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
<script>
	import { Marquee } from 'entasis/marquee';

	const items = [{ text: 'Alpha' }, { text: 'Beta' }, { text: 'Gamma' }];
</script>

<Marquee speed="normal" fade direction="up" class="h-[400px]">
	{#each items as item}
		<div class="bg-surface-raised rounded px-4 py-2">{item.text}</div>
	{/each}
</Marquee>
```

**Theme parts:** `root` (variants: direction, size), `inner` (variants: direction, size, pauseOnHover, reverse)

---

## Sidebar

`import { Sidebar } from 'entasis/sidebar'`

Application navigation panel. Owns its own display state, resizing, the mobile drawer, and the
page column beside it. Compose it through `AppShell` for full application layouts.

**Props (navigation):**

- `items`: `SidebarGroup[]` -- data-driven groups: `{ label?, items?, tree?, action?, collapsible?, defaultOpen?, separator? }`
- `headerButton` / `footerButton`: `SidebarMenuButtonItem`, `headerMenu` / `footerMenu`: `SidebarMenuEntry[]`, `search`: `SidebarSearch`
- `header`, `content`, `footer`, `children`, `banner`: `Snippet<[SidebarApi]>` escape hatches. The
  `header` snippet renders **first** in the header region, above `headerButton`, `search` and
  `headerMenu`.
- `SidebarMenuEntry` also takes `iconColor`: `Colors` and `iconVariant`: `'bare' | 'tile'`. `tile`
  paints a rounded square (`bg-color-muted text-color-muted-readable`) around the glyph from the
  row's own `data-color` -- use it for per-item colour chips instead of a hand-built span.
- `SidebarGroup.action` takes `SidebarMenuActionDescriptor | SidebarMenuActionDescriptor[] |
Snippet<[SidebarApi]>`; pass an array to pin several affordances to one group header. Each
  descriptor takes `size`, defaulting to the Sidebar `size`, so a `+` lands at row scale.
- `SidebarMenuButtonItem.trailing` takes `SidebarIcon | false | SidebarMenuActionDescriptor`. A
  descriptor renders its own icon-only ghost button beside the row (siblings, never nested), so a
  workspace card needs no custom `header` snippet.
- Every handler on that path is `onclick(event, api)`: `headerButton.onclick`, `footerButton.onclick`
  and `SidebarMenuActionDescriptor.onclick` all receive the `SidebarApi` beside the event.

**Props (state and layout):**

- `collapsible`: `'offcanvas' | 'icon' | 'none'` (default: `'offcanvas'`) -- icon mode needs an `icon` on every data-driven row, otherwise it resolves to offcanvas
- `open` (bindable), `defaultOpen`, `displayState` (bindable): `'expanded' | 'collapsed' | 'hidden'`
- `side`: `'left' | 'right'`, `variant`: `'admin' | 'floating' | 'inset' | 'split' | 'framed'` (`framed` is the admin geometry with a `surface-recessed` well, for a sidebar hosted inside a raised card), `frame`: `'viewport' | 'contained'`, `mode`: `'layout' | 'panel'`
- `size`: `'small' | 'normal' | 'large'` (default: `'normal'`) -- scales type and item height
- `iconSize`: `'small' | 'normal' | 'large'` (default: follows `size`) -- scales icons and leading media inside the panel on their own
- `activeVariant`: `'soft' | 'outline' | 'solid'` (default: `'soft'`) -- how an active row paints: `soft` is the shared selected recipe (`selectedSoft`, `bg-selected-muted text-selected-muted-readable`), `solid` is `selectedSolid` (`bg-selected text-selected-contrast`), `outline` is a bordered surface card on the tinted well. Read it off each row's own `data-active-variant`; never restyle selection with a descendant selector.
- `density`: `'compact' | 'normal' | 'comfortable'` (default: `'normal'`) -- scales padding and gaps
- `width`, `widthIcon`, `widthMobile`: string; `resizable`: `boolean | SidebarResizableOptions`
- `rail`: `boolean | 'line' | 'thumb'`, `keyboardShortcut`: `string | false` (default: `'b'`)
- `onWidthChange`: `({ width, isUserInteraction }) => void` -- reports every expanded-width change: continuously while the user resizes (`isUserInteraction: true`), and once when a stored width is restored (`isUserInteraction: false`)
- `collapseIcon`: `DisclosureIndicator` -- `'chevron' | 'plus-minus' | 'none'`, the indicator on collapsible menu items

**Props (peeks):**

- `edgeReveal`: boolean (default: true) -- a hidden offcanvas sidebar reveals over the page when the pointer reaches the screen edge
- `expandOnHover`: boolean (default: false) -- with `collapsible="icon"`, hovering or focusing into the collapsed panel expands it to `width` over the page (`data-peek="true"`) while the reserved column stays at `widthIcon`, so page content does not reflow. It is a peek, not a toggle: the persisted collapsed state is untouched.

A peeked panel renders with expanded semantics, not just expanded width: group headers, badges,
search, inline submenus, and inline tree branches come back, and the rail or resize handle travels
to the panel's inner edge. `api.displayState` still reports `'collapsed'` -- `api.isPeeking` is the
flag a snippet reads when it hides its own content in icon mode.

Both peeks stay open while focus is inside the panel or while an overlay opened from inside it
is open (including nested submenus). A hover expand releases about 120ms after the pointer, focus,
and every such overlay are gone; an unpinned edge reveal dismisses through its own pointer
tolerance rectangle. A hidden offcanvas panel is `inert`, so Tab never reaches a panel parked off
screen.

**Props (activity bar):**

- `activityBar`: `SidebarActivityBar` -- `{ items, footerItems?, header?, footer?, width?, label?, onSelect? }`
- `SidebarActivityBarItem`: `{ icon, label, id?, href?, target?, rel?, onclick?, isActive?, badge?, disabled?, tooltip? }`

The activity bar is an icon-only rail pinned to the outer edge of the sidebar, in layout mode only
(`mode="panel"` renders the navigation panel alone and ignores it). It stays on screen
in every display state -- only the panel takes the offcanvas offset -- and the reserved layout
column becomes the panel width plus the activity bar width (default `3rem`, set through
`width`). The rail wears the surface of the variant's panel: a hairline column on the canvas beside
`admin`, a column in the card's recessed well for `framed`, borderless on the canvas with the same
vertical gutter for `inset`, and a card of its own, with the panel's radius, edge and gutter, for
`floating` and `split` (their reserved column adds that gutter). On mobile it renders as a
horizontal row at the top of the drawer. It is its own `<nav>`
landmark -- the body navigation carries its own name, so the two are distinguishable -- with a
roving tabindex and ArrowUp/ArrowDown/Home/End navigation that loops and skips
disabled items; Tab lands on the `isActive` item, and each square takes its accessible name and
tooltip from `label`. A string or number `badge` joins that name (`"Alerts, 3"`); an empty-string
badge renders a bare dot and a Snippet badge is decorative, so put their meaning in `label`.

```svelte
<script lang="ts">
	import { Sidebar, type SidebarActivityBar, type SidebarGroup } from 'entasis/sidebar';
	import { bellIcon } from 'entasis/icons/bell';
	import { filesIcon } from 'entasis/icons/files';
	import { gearIcon } from 'entasis/icons/gear';
	import { houseIcon } from 'entasis/icons/house';
	import { userIcon } from 'entasis/icons/user';

	let section = $state('files');

	const activityBar: SidebarActivityBar = {
		label: 'Workspace sections',
		items: [
			{ id: 'files', label: 'Files', icon: filesIcon, isActive: section === 'files' },
			{ id: 'alerts', label: 'Alerts', icon: bellIcon, badge: 3 }
		],
		footerItems: [{ id: 'account', label: 'Account', icon: userIcon }],
		onSelect: ({ item }) => {
			if (item.id) section = item.id;
		}
	};

	const items: SidebarGroup[] = [
		{
			label: 'Workspace',
			items: [
				{ label: 'Dashboard', href: '/', icon: houseIcon, isActive: true },
				{ label: 'Settings', href: '/settings', icon: gearIcon }
			]
		}
	];
</script>

<Sidebar {items} {activityBar} collapsible="icon" expandOnHover>
	{#snippet children()}
		<main>Page content</main>
	{/snippet}
</Sidebar>
```

**Theme parts:** `root`, `panel`, `header`, `nav`, `footer`, `group`, `groupLabel`, `groupAction`,
`groupContent`, `actionSlot`, `menu`, `menuItem`, `menuButton`, `menuIcon`, `buttonRow`,
`menuLabel`, `menuSecondary`, `menuTrailing`,
`subMenu`, `treeSubMenu`, `subButton`, `menuAction`, `actionTrigger`, `badge`, `searchContainer`,
`search`, `searchIcon`, `separator`, `rail`, `activityBar`, `activityBarList`, `activityBarItem`,
`activityBarBadge`, `activityBarHeader`, `activityBarFooter`, `resizeHandle`, `edgeTrigger`,
`overlay`, `mobilePanel`, `main`, `media`, `avatar`

## AppShell

`import { AppShell } from 'entasis/app-shell'`

Composes `Sidebar` with `PageShell` and forwards one shared surface treatment to both. Use it when
routes share the same application navigation and page chrome; reach for `Sidebar` alone only when
you are building a custom shell.

**Props:**

- `variant`: `'admin' | 'floating' | 'inset' | 'split' | 'framed'` (default: `'admin'`) -- the shared
  shell treatment, forwarded to the Sidebar unchanged. For `framed` the root paints the canvas
  and one frame element draws a `rounded-xl` card with the elevation engine's border and shadow
  (`raised-1`) around both the sidebar and the page; the Sidebar's own `framed` variant paints
  its well as `surface-recessed`, an inset of the card, and the page header sits on the page
  surface.
- `sidebar`: `AppShellSidebarProps` -- every Sidebar prop except `children`, `mode`, `frame` and
  `variant`, which AppShell owns.
- `label`: string -- names the page's `main` landmark, forwarded to PageShell.
- `eyebrow`, `breadcrumbs`, `breadcrumbsMaxItems`, `back`, `title`, `subtitle`, `header`,
  `headerActions`, `footer`, `footerActions`, `contentPadding`, `contentWidth`, `actionOverflow`,
  `mobileActionCount` -- the PageShell chrome. Snippet regions receive
  `{ pageShell: PageShellApi, sidebar: SidebarApi }`.
- `pageShellTheme`: `PageShellThemeProps` -- theme overrides for the PageShell inside the frame.

AppShell renders one `data-slot="app-shell-frame"` element between its root and the Sidebar. It is
`display: contents` for every variant but `framed`, so the other four layouts are unchanged.

**Theme parts:** `root`, `frame`, `page`

---

## Stack

`import { Stack } from 'entasis/stack'`

Flex row or column with token spacing, sized by its host. Every layout axis is responsive to the
**stack's own width** (see [Responsive props](theming.md#responsive-props) and the container
breakpoint table there), so a stack in a sidebar and the same stack full-bleed reflow differently on
one page with no JavaScript and no measurement.

**Props:**

- `orientation`: `ResponsiveProps<'horizontal' | 'vertical'>` (default: `'vertical'`)
- `gap`: `ResponsiveProps<LayoutSpacing>` (default: `'none'`) -- `none | xs | sm | md | lg | xl`
- `align`: `ResponsiveProps<'start' | 'center' | 'end' | 'stretch'>` (default: `'stretch'`) -- cross axis
- `justify`: `ResponsiveProps<'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'>` (default: `'start'`) -- main axis
- `wrap`: `ResponsiveProps<'nowrap' | 'wrap' | 'wrap-reverse'>` (default: `'nowrap'`)
- `padding`, `paddingInline`, `paddingBlock`: `LayoutSpacing` -- axis values beat `padding`
- `scrollable`: boolean -- native overflow scrolling
- `width`, `height`, `maxWidth`, `minHeight`: number (px) or string
- `as`: `'div' | 'span' | 'section' | 'article' | 'aside' | 'main' | 'nav' | 'header' | 'footer' | 'form' | 'fieldset'` (default: `'div'`) -- no list elements, see **Structure**

```svelte
<script lang="ts">
	import { Card } from 'entasis/card';
	import { Stack } from 'entasis/stack';
</script>

<Stack orientation={{ md: 'horizontal' }} gap={{ xs: 'sm', md: 'lg' }} align="center">
	<Card title="Revenue" />
	<Card title="Churn" />
</Stack>
```

**Structure.** Stack renders two elements, because a container query cannot style its own container:

- **root** (`data-slot="stack"`) — the `as` element and the `@container`. It takes `class`,
  `style`, forwarded attributes, `ref`, the size props, `padding` and `scrollable`.
- **layout child** (`data-slot="stack-layout"`, the `inner` theme slot) — carries the flex line.
  A consumer overriding the flex axis or styling `> *` children targets `inner`, not `root`.

The root is `w-full` and an inline-size container: containment strips intrinsic width, so a Stack
fills its host rather than shrinking to its children. A content-sized row of stacks needs an
explicit `width` or a non-Stack wrapper. Stack emits no `data-orientation` / `data-wrap` — a
responsive stack has a different orientation at different widths.

Because the root always contains exactly one layout child, `as` does **not** accept `'ul'`, `'ol'`
or `'li'`: `<ul>`/`<ol>` admit only `li`, `script` and `template`, so a stack list would emit
invalid markup. Write the list element yourself and put a stack inside an `<li>` when a row needs a
flex line:

```svelte
<script>
	import { Stack } from 'entasis/stack';
</script>

<ul class="gap-sm flex flex-col">
	<li>
		<Stack orientation="horizontal" align="center" gap="sm">
			<span>Icon</span>
			<span>Label</span>
		</Stack>
	</li>
</ul>
```

**Theme parts:** `root` (variants: padding, paddingInline, paddingBlock, scrollable), `inner`. The
`direction`, `mainAlign`, `crossAlign`, `gap` and `wrap` variants are gone from `root`: those axes
are custom properties now.

---

## Grid and GridSpan

`import { Grid, GridSpan } from 'entasis/grid'`

Responsive grid without hand-written `grid-cols-*` / `col-span-*` classes, laid out against the
**grid's own width**.

**Grid props:**

- `columns`: `ResponsiveProps<GridColumns>` -- a fixed count, or `{ minWidth, max?, repeat? }` for
  intrinsic auto-fit tracks
- `gap`, `rowGap`, `columnGap`: `ResponsiveProps<LayoutSpacing>`
- `rowHeight`: number (px) -- height of implicit rows, useful with `GridSpan rows`
- `align`, `justify`: `'start' | 'center' | 'end' | 'stretch'` -- items inside their grid areas
- `width`, `height`, `maxWidth`, `minHeight`: number (px) or string

**GridSpan props:**

- `columns`: `ResponsiveProps<number | 'full'>` (`GridSpanColumns`)
- `rows`: `ResponsiveProps<number>`

Use `<Grid columns={{ minWidth, max }}>` with `<GridSpan columns={2}>` for an asymmetric row, such
as a two-thirds chart beside a one-third panel:

```svelte
<script lang="ts">
	import { Card } from 'entasis/card';
	import { Grid, GridSpan } from 'entasis/grid';
</script>

<Grid columns={{ minWidth: 320, max: 3 }} gap="lg">
	<GridSpan columns={2}>
		<Card title="Task status breakdown" />
	</GridSpan>
	<GridSpan>
		<Card title="Weekly progress" />
	</GridSpan>
</Grid>
```

Or step the track count by hand, per breakpoint of the grid's own width:

```svelte
<script lang="ts">
	import { Card } from 'entasis/card';
	import { Grid, GridSpan } from 'entasis/grid';
</script>

<Grid columns={{ xs: 1, sm: 2, lg: 4 }} gap={{ xs: 'sm', lg: 'lg' }}>
	<GridSpan columns={{ xs: 'full', md: 2 }}>
		<Card title="Featured" />
	</GridSpan>
	<GridSpan>
		<Card title="Detail" />
	</GridSpan>
</Grid>
```

`{ minWidth, max, repeat }` is still a **track configuration, not a breakpoint record** — an object
is read as a record only when every one of its keys is a breakpoint name, so the auto-fit form
passes through as a value and can itself be placed at a breakpoint.

`columnGap` and `rowGap` fall back to `gap` **per breakpoint**, not per prop:
`gap="sm" columnGap={{ lg: 'xl' }}` keeps `sm` on both axes until the grid reaches 56rem.

**A GridSpan has no width of its own,** so its breakpoints are those of the Grid it sits in: a
responsive span steps at exactly the widths its tracks step on. Outside a Grid no grid container
matches and only the `xs` value applies.

**Structure.** Grid renders a root plus the grid inside it, because a container query cannot style
its own container. `class`, `style`, forwarded attributes, `ref` and the sizing props stay on the
root (the `@container`); the grid itself is the `tracks` theme part, which is where the `gap` /
`rowGap` / `columnGap` theme variants went — the gap is a custom property now, so theme overrides
for the layout target `tracks`. The root is a query container, so it fills its host's inline size
(it no longer shrinks to fit as a flex item) and is a containing block for `position: fixed`
descendants.

**Theme parts:** `root`, `tracks`.
