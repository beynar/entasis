# Svelai Theming Reference

## Table of Contents

- [Tailwind Plugin Setup](#tailwind-plugin-setup)
- [Theme Plugin Config](#theme-plugin-config)
- [Color Tokens](#color-tokens)
- [Color Variants](#color-variants)
- [Surfaces](#surfaces)
- [Interaction States](#interaction-states)
- [Theme Class Rules](#theme-class-rules)
- [Design Tokens](#design-tokens)
- [Motion](#motion)
- [Responsive Props](#responsive-props)
- [Theme Svelte Component](#theme-svelte-component)
- [ThemeState](#themestate)
- [Dark / Light Mode](#dark--light-mode)
- [Component Theme Overrides](#component-theme-overrides)
- [Component Theme Registry](#component-theme-registry)

---

## Tailwind Plugin Setup

Declare `svelai/tailwind-plugin/theme` once per theme. The theme marked `default: true` also
registers the palette-agnostic engine (color utilities, variants, `.ui-spinner`, `.state-layer`,
`raised-*`, `lift-*`, shimmer and scroll-fade utilities), so two blocks cover a light/dark app:

```css
@import 'tailwindcss';
@source '../node_modules/svelai/dist';

/* Default theme also bootstraps utilities/variants/spinner */
@plugin 'svelai/tailwind-plugin/theme' {
	name: light;
	default: true;
	colorscheme: light;
}
@plugin 'svelai/tailwind-plugin/theme' {
	name: dark;
	colorscheme: dark;
}
```

Each theme emits its CSS variables on `html[data-theme="<name>"]` and `.<name>`; the default theme
also emits them on bare `html`.

The `@source` line lets Tailwind see the utility classes used inside the packaged components
(Tailwind skips `node_modules` by default).

If you manage colors yourself and only want the engine, use `@plugin 'svelai/tailwind-plugin';`
on its own instead of a default theme (never both: the engine must run exactly once).

## Theme Plugin Config

Full example with all keys. Option names are case-sensitive and the plugin throws on a key it does
not know, so the `prettier-ignore` below is load-bearing: Prettier lowercases property names inside
a `css` fence, which silently turns `prefersDark` into a dead `prefersdark`.

<!-- prettier-ignore -->
```css
@plugin 'svelai/tailwind-plugin/theme' {
	name: custom; /* string - used for the data-theme attribute */
	default: true; /* boolean - default theme, also boots the engine */
	colorscheme: light; /* 'light' | 'dark' - drives generated defaults */
	prefersDark: false; /* boolean - also apply under prefers-color-scheme: dark */

	luminance: 5; /* number - brightness adjustment applied to every accent */
	saturation: 10; /* number - saturation adjustment applied to every accent */

	primary: #5f62ef; /* hex or Tailwind color name (e.g. indigo) */
	secondary: #e4e4e7;
	danger: #dc2626;
	success: #15803d;
	warning: #f59e0b;
	info: #2563eb;
	neutral: #18181b; /* optional; derived from surface by mode when omitted */
	surface: #fafafa; /* seed for the elevation ladder */

	primary-light: #a5b4fc; /* override any auto-generated variant */
	primary-dark: #4338ca;
	surface-floating: #ffffff; /* override any surface grade */

	state-hover-opacity: 0.05;
	state-pressed-opacity: 0.1;
	state-selected-opacity: 0.07;

	spinner: spinDynamicThin; /* 'spinDynamicThin' | 'spinDynamicThick'
	                             | 'spinLargeThreeQuarter' | 'spinlargeQuarter' */

	/* Engine options — read only from the block with `default: true`. */
	spacing: normal; /* 'small' | 'normal' | 'large' | number */
	radius: normal; /* 'none' | 'subtile' | 'small' | 'normal' | 'large' | 'round' | number */
	typeScale: default; /* 'compact' | 'default' | 'comfortable' | 'large' | TypeScaleOptions */
	elevation: normal; /* 'flat' | 'normal' | 'high' */
}
```

Those keys are the `ThemeOptions` type (`src/lib/tailwind/theme.ts`), which is
`Partial<{ name, default, luminance, saturation, colorscheme, state-hover-opacity,
state-pressed-opacity, state-selected-opacity, prefersDark, spinner }>` intersected with `EngineOptions`
(`src/lib/tailwind/scales.ts`: `radius`, `spacing`, `typeScale`, `elevation`, `motion`) and the
colour seeds of `ColorTheme` — every `{color}-{variant}` / `surface-{grade}` override listed below.

`applyGlobalEngine` reads the five engine options only from the block carrying `default: true`;
they are ignored on every other theme block. `motion` is object-valued, so it is only expressible
when the plugin is configured from JavaScript — a CSS `@plugin` block carries flat values.

Radius, spacing, typography, elevation and motion therefore exist on **both** sides. The plugin
writes them on `html` at build time; `<Theme designTokens>` writes the same variables on
`html[data-theme="<name>"]`, which is more specific, so a runtime token always wins for that theme
and every key a theme omits keeps the build-time value. Use the plugin for the app-wide baseline
(it applies before hydration, with no flash) and [design tokens](#design-tokens) for what differs
per theme or changes at runtime.

## Color Tokens

| Token       | Default (light) | Default (dark)  | Accepts            |
| ----------- | --------------- | --------------- | ------------------ |
| `primary`   | `#5f62ef`       | `#5f62ef`       | hex, TW color name |
| `secondary` | `#e4e4e7`       | `#27272a`       | hex, TW color name |
| `danger`    | `#dc2626`       | `#dc2626`       | hex, TW color name |
| `success`   | `#15803d`       | `#15803d`       | hex, TW color name |
| `warning`   | `#f59e0b`       | `#f59e0b`       | hex, TW color name |
| `info`      | `#2563eb`       | `#2563eb`       | hex, TW color name |
| `neutral`   | derived (dark)  | derived (light) | hex, TW color name |
| `surface`   | `#fafafa`       | `#09090b`       | hex                |

`neutral` is the ink/chrome role (text, borders, kit controls when no `color` is set). When omitted
it is reversed from `surface` for the current mode.

## Color Variants

Each base color generates five overridable variants (`{color}-{variant}: #hex`) and two generated
text variants:

| Suffix            | Generation Rule                                            | Overridable |
| ----------------- | ---------------------------------------------------------- | ----------- |
| `-light`          | +15% lightness                                             | yes         |
| `-lighter`        | +25% lightness                                             | yes         |
| `-dark`           | -15% lightness                                             | yes         |
| `-muted`          | mixed with the base surface (10% light / 20% dark)         | yes         |
| `-contrast`       | auto black/white for text on the solid color               | yes         |
| `-readable`       | accent pinned to a readable lightness on the page surface  | no          |
| `-muted-readable` | accent pinned to a readable lightness on its `-muted` tint | no          |

Usage: `bg-primary`, `text-primary-contrast`, `bg-primary-muted text-primary-muted-readable`,
`text-danger-readable`, `border-neutral-muted`.

Inside a component, `data-color="<role>"` remaps the current-color utilities, so themed classes
can stay role-agnostic: `bg-color`, `text-color-contrast`, `border-color`, `ring-color-muted`,
`text-color-readable`, `bg-color-muted`. `html` defaults these to `neutral`. Focus, selection and
the hover/pressed layer are _not_ part of this family — they have their own state roles, which fall
back to it. See [State colours](#state-colours).

## Surfaces

Opaque surfaces use `surface-recessed` for inset wells and grouped-control tracks, followed by
the elevation ladder `surface-canvas`, `surface`, `surface-raised`, and `surface-floating`
(`bg-surface-recessed`, `bg-surface-canvas`, `bg-surface`, `bg-surface-raised`,
`bg-surface-floating`). Grades are derived from `surface` with mode-aware OKLCH lightness;
override any grade directly (`surface-raised: #ffffff`) when the generated value is not appropriate.

## Interaction States

Use surface grades for resting elevation and the global `state-layer` utility for transient
hover, virtual-focus, and pressed feedback:

```svelte
<button class="state-layer bg-primary text-primary-contrast rounded-md px-3 py-2">Save</button>
```

The utility composites `var(--color-hover, currentColor)` at `--state-hover-opacity` for pointer
hover and `data-highlighted="true"`, then `var(--color-pressed, var(--color-hover, currentColor))`
at `--state-pressed-opacity` for `:active`. Pressed takes precedence. Disabled, `data-disabled`,
and `aria-disabled="true"` elements do not receive the layer. With no `hoverColor` / `pressedColor`
pinned on the theme the layer is `currentColor`, exactly as before. Focus remains a ring concern
(`ring-focus/50`); persistent selected, checked and open states use the selected state role.

Defaults: light `0.05` / `0.10`, dark `0.16` / `0.32`. Override per theme block with
`state-hover-opacity` / `state-pressed-opacity`. The persistent selection has its own alpha,
`state-selected-opacity` (light `0.07`, dark `0.10`), because `bg-selected-muted` composites a
translucent tint of the role rather than painting an opaque colour — see rule 6.

## Theme Class Rules

Nine axes drifted across the library's theme files until each got one value. These are the rules
every `*.theme.ts` follows — `tooling/check-semantic-theme-tokens.mjs` enforces them, and an app
writing its own overrides gets a consistent kit by following them too.

**1. Focus ring — `ring-2 ring-focus/50`** (the `focusRing` recipe, exported from `svelai/theme`,
is exactly `'focus-visible:ring-2 focus-visible:ring-focus/50'`). `ring-focus` is the **focus state
role**: it resolves to `var(--color-focus, var(--color))`, so with nothing pinned the ring still
takes the _current_ role — neutral chrome rings neutral, a colored control rings in its color,
`designTokens.defaultColor` moves all of them together — and `designTokens.focusColor` pins every
focus ring in the app to one colour in one place. Never name a role (`ring-primary/50`,
`ring-color/50`, `ring-neutral/50`). The one other allowed role is `ring-danger/50`, for an error
state. `ring-<role>/NN` is a focus ring and nothing else: a resting hairline uses
`ring-neutral-muted`, `ring-color-muted` when the chrome follows the current role, or
`ring-selected/NN` when it marks a selection. The rule reads the ring behind _any_ focus variant,
composed ones included — `has-[input:focus-visible]:ring-focus/50` on a media control whose focus
lands on the range input inside it, `group-focus-visible:` on a thumb, `peer-focus:` on a sibling.

**2. Shadows come from the elevation engine.** A bordered surface uses `raised-N`; a borderless one
— thumbs, indicators, pills, drag previews, tooltips — uses `lift-N`, which emits the same shadow
without the hairline. Raw `shadow-xs … shadow-2xl` is banned in theme files, because it ignores the
theme's `elevation` token. Both utilities take `0`…`5` plus the t-shirt aliases
(`sm` → 2, `md` → 3, `lg` → 4, `xl` / `2xl` → 5) and a `none` reset. The ban reaches component
markup and MCP snippets as well as theme files, and covers `drop-shadow-*` too. The engine also
says how far its largest shadow reaches: `elevationVariables()` emits `--elevation-bleed-x` (the
blur, sideways) and `--elevation-bleed-y` (offset plus blur, downwards), `0px` on `flat`. Anything
that must clip pays that as a bleed allowance — Carousel's scroller bleeds by it on both axes
behind negative margins — and a container that does not have to clip must not: the Stepper/Tabs
track is one viewport wide at rest and only widens (and clips) for the duration of a slide.

**3. Sizes come from geometry tokens.** Interactive controls use `h-control-sm/md/lg` (28 / 32 /
36 px); rows — table rows, list rows, menu options — use `h-row-sm/md/lg` or `min-h-row-sm/md/lg`
(32 / 40 / 48 px); icons use `size-icon-xs/sm/md/lg/xl` (12 / 14 / 16 / 20 / 24 px). Numeric `h-N`,
`min-h-N` and `[&_svg]:size-N` are banned in theme files; all of these scale with
`designTokens.spacing`, so a dense theme shrinks the whole kit at once.

**4. Muted text has two steps.** `text-<role>/70` for secondary text (descriptions, captions,
placeholders, inactive tabs) and `text-<role>/45` for decorative ink only — idle icons, drag
handles, separators. `/45` does not meet AA, so it never carries running text. No other step.

**5. Hover is `state-layer`.** Every interactive surface composites the layer instead of painting a
`hover:bg-*` of its own. A reveal-on-hover affordance (a resize grip, a drag handle) is an
already-colored element at `opacity-0 hover:opacity-100`, not a fill that appears.

**6. Selected has one recipe per weight**, both on the **selected state role** and exported from
`svelai/theme`:

```ts
import { selectedSoft, selectedSolid } from 'svelai/theme';

// selectedSoft  === 'bg-selected-muted text-selected-muted-readable'  // rows, options, chips, tags
// selectedSolid === 'bg-selected text-selected-contrast'              // the loudest one: a current-page pill
```

Persistent selection — a selected table row, an active sidebar row, an active menu option, a
tabbar or segmented-control indicator, a pressed toggle, a checked switch / checkbox / radio, the
current page in a pager — paints from the `bg-selected*` family. Each token falls back to its
current-role twin — `bg-selected-muted` is
`color-mix(in oklab, var(--color-selected, var(--color)) calc(var(--state-selected-opacity) * 100%), transparent)`,
a **translucent tint of the role, not an opaque colour**, so the same selection reads identically
on `surface`, on a card's `surface-raised` and inside a popover's `surface-floating` (an opaque
tint can only be mixed over one surface, and in dark mode it went invisible on the other two).
The alpha is `--state-selected-opacity`: 0.07 light, 0.10 dark, tunable per theme block. So
with nothing pinned the fill is still the current role and follows `data-color` and `defaultColor`;
`designTokens.selectedColor` pins all of it to one colour at once. A selection may not name a
fixed role (`bg-primary-muted`, `bg-neutral-muted`) and may not ride the current role directly
(`bg-color`, `bg-color-muted`) — that is what the state role is for. The rule reads every spelling
the library uses for one: the Tailwind variant prefix (`data-active:bg-selected-muted`), the cva
variant key (`active: { true: selectedSolid }`, `compoundVariants: [{ checked: true, class: … }]`)
and the theme part named for the state it paints (`thumbnailActive`). Transient hover and pressed feedback is still rule 5's
`state-layer`, not a selected fill.

**7. The type ramp per size.** `size` grows the box, not the typeface. A control — button, input,
chip, tab, segmented control, pagination item, toggle, select trigger, menu option, kbd, badge —
walks `text-xs` → `text-sm` → `text-sm`: `large` buys `h-control-lg` and more padding and keeps the
type, so a large button and a normal button read as one voice at two scales. A content part — Card,
Alert, Toast, Empty, Timeline, a table cell, a Stat label, any description — takes the one step up:
`text-xs` → `text-sm` → `text-base`. A display value such as the Stat figure rides its own
`text-xl` → `text-2xl` → `text-3xl`.

The secondary line inside a part sits exactly one step below that part's primary text and never
below `text-xs`, which is the floor — so a control's secondary line is `xs/xs/xs`, a content part's
is `xs/xs/sm`, a display value's is `lg/xl/2xl`. Those six triples are the whole allowed set.

```ts
const button = cva({
	variants: {
		size: {
			small: 'h-control-sm px-md text-xs',
			normal: 'h-control-md px-lg text-sm',
			large: 'h-control-lg px-xl text-sm' // the box grew, the type did not
		}
	}
});
const cardTitle = cva({
	variants: { size: { small: 'text-xs', normal: 'text-sm', large: 'text-base' } }
});
const cardDescription = cva({
	variants: { size: { small: 'text-xs', normal: 'text-xs', large: 'text-sm' } }
});
```

Arbitrary type sizes are banned in theme files: `text-[11px]`, `text-[0.6875rem]` and every other
inline length round to nothing on the scale and do not move with the theme. `text-[CanvasText]` and
`text-[var(--x)]` are colors, not sizes, and stay allowed. All three sizes must name their step — a
block where only `small` sets a size has no readable ramp and fails the check.

**8. Layout is a container query, never a viewport breakpoint.** A component that fills its host
sizes itself to the width it was actually handed, so the same card, table or player reflows
identically in a page, a split pane, a drawer and a sidebar. The root recipe carries `@container`
(or a named `@container/<name>`) and the parts use `@sm:` … `@7xl:`, `@max-3xl:`, `@min-[40rem]:`.
`md:`, `max-lg:` and `max-[360px]:` measure the device instead of the component and are rejected in
theme files and in component markup alike.

```ts
// Old: `md:` — the phone breakpoint. New: `@lg` — the width at which the transport row and the
// title genuinely fit on one line (artwork 48 + meta 120 + transport 300 ≈ 512px = 32rem).
const root = cva({ base: '@container w-full min-w-0 …' });
const controls = cva({ variants: { layout: { block: 'grid @lg:flex @lg:justify-end' } } });
```

Three things the mechanics force:

- **Only on an element that already fills its host** (`w-full`, `block`, `flex-1`). Inline-size
  containment removes intrinsic width, so `@container` on a popover panel, a menu or an inline chip
  collapses it to zero. `Breadcrumbs` is the worked example: it is a flex item beside the back
  button in `PageShellHeader`, so it is not a container and has no responsive gap at all.
- **A container never queries itself.** Put the query on the parts, not on the root that declares
  it — `Field`'s `left` root declares its two-column template unconditionally and the header and
  control parts carry `@lg:col-end-2` / `@lg:col-start-2`.
- **The nearest ancestor container wins.** Nothing inside a component declares a second `@container`
  unless that nesting is intended, and a named container (`@container/carousel`, queried as
  `@container carousel (…)`) is how a component stays addressable through one.

Map each old viewport breakpoint to the width at which that layout genuinely fits — by intent, not
by copying the number — and write the mapping in a comment on the root recipe. Reusing the old
number because it is the old number is the failure mode: `VideoPlayer`'s compact controls sit at
`@md` (28rem — the width at which the timecode, transport cluster and secondary controls stop
overflowing one row), not at the 48rem that `md:`'s 768px would have transliterated to.

The checker enforces the rule in all four places a class list is written: `.theme.ts` files,
component markup, plain helper `.ts` modules under a component folder, and `.mcp.ts` snippets. The
sweep is AST-based over string literals, so the `md:` a root comment quotes to record what it
replaced stays prose.

Three kinds of carve-out, across five path prefixes in `viewportExceptions` in the checker, each
with a justification:

- **App chrome whose host _is_ the viewport** — `src/lib/components/Sidebar/`,
  `src/lib/components/AppShell/`, `src/lib/components/PageShell/`.
- **Overlays that size to their own content** — `src/lib/components/Form/DateSelector/`, the panel
  inside a Popover, which inline-size containment would collapse.
- **Not a shipped component** — `src/lib/components/DesignSystem/`, the docs-only palette page.

That is the whole list: if the checker rejects a viewport variant in a file under one of those five
prefixes, the prefix is already exempt and something else is wrong. A portaled overlay that needs a
device decision takes it from JS rather than CSS — `DataTable`'s column header menu and
`Confirmation`'s footer both read `useTheme().isMobile`, the same `< 768px` value the Popover used
to pick sheet-versus-floating, instead of each hard-coding its own `matchMedia`.

**9. A flush child rounds with `rounded-<step>-concentric`; the container publishes on its own.**
Two concentric rounded boxes read as concentric only when the inner radius is no larger than the
outer one minus the gap between them, and that gap is the container's padding. Guessing it by eye
is what produced the drift — a `rounded-lg p-xs` panel whose rows were `rounded-md`, a
`rounded-xl p-sm` card whose header was `rounded-lg`. Both halves of that formula are already on
the container as utilities, so the utilities publish them to its children and the cascade does the
arithmetic: **nothing is declared; a child sitting flush against the padding box keeps its own
design step and writes `rounded-<step>-concentric` to cap it at what the corner allows.**

```ts
// rounded-lg publishes --radius-parent to its children, p-xs publishes --pad-parent-x/-y
const panel = cva({ base: 'bg-surface-raised rounded-lg p-xs' });
const row = cva({ base: 'state-layer rounded-md-concentric px-md min-h-row-sm w-full' });
```

Every `rounded-<step>` also emits `.rounded-<step> > * { --radius-parent: var(--radius-<step>) }`
beside core's own `border-radius` rule; `rounded-full` publishes infinity (a pill's flush children
stay pills) and `rounded-none` publishes `0px`; an arbitrary value (`rounded-[3px]`) and the side
and corner forms publish nothing, because there is no step to pass on.
`p-<step>` publishes `--pad-parent-x` and `--pad-parent-y`, `px-*` and `py-*` publish one axis
each, and one-sided padding publishes nothing — `pt-*` is not the uniform gap a concentric corner
is derived from. `rounded-<step>-concentric` (plus `rounded-t-<step>-concentric` and
`rounded-b-<step>-concentric` for a flush header or footer; the step is one of
`xs sm md lg xl 2xl 3xl 4xl`) is
`min(var(--radius-<step>), calc(var(--radius-parent, calc(infinity * 1px)) - max(var(--pad-parent-x, 0px), var(--pad-parent-y, 0px))))`.
It is a **cap, not a subtraction**: the child keeps its own step on the design ramp and only gives
ground when the container's corner cannot hold it. A child rounder than parent minus padding cuts
across the parent's corner, which is the ugly case worth preventing; a child less round than that
merely reads as an ordinary control, which is fine. Both halves are the theme's own `--radius-*`
and `--space-*`, so `designTokens.radius` and `designTokens.spacing` keep the two boxes concentric
at every preset. The parent fallback is **infinite**, so a row placed outside any rounded container
is exactly its own step; and a tight box needs no floor: CSS clamps a negative radius to 0, which
is the square corner the geometry asks for — a `rounded-sm-concentric` box inside `rounded-sm p-md`
is `min(4px, 4 - 8)` → 0. At the default theme a menu row inside a `rounded-lg p-md` panel is
`min(8px, 12 - 8)` = 4px.

Both variables inherit, because the flush child is rarely a direct child: a menu's rows sit in a
`role="menu"` group inside the padded panel, so an unrounded, unpadded wrapper in between is
transparent. What must not cross a rounded boundary is the padding — a `Button` inside a padded
`Card` is a new box, and its children owe nothing to the `Card`'s padding — so every
`rounded-<step>` also resets `--pad-parent-x/-y` to `0px` for its children, at zero specificity
(`:where(.rounded-lg) > *`) so the same box's own `.p-md > *` publish wins whichever order the two
are emitted in. The nearer padded wrapper wins outright rather than accumulating, which makes
exactly one level exact — every nesting in the library. Two known
limits, both accepted: a concentric box cannot publish its own _computed_ radius (the child rule
would read the value it sets, which is the cycle), so it publishes its **nominal** step like every
other `rounded-<step>` — its own children are therefore bounded by that step and can be slightly
over-rounded at two levels, rather than reading nothing at all; and the corner subtracts the larger
of the two axes instead of being elliptical.

The child half stays opt-in because CSS cannot tell a flush child from a floating one. A menu row
fills its panel's padding box and has to follow the container's shape; an avatar, a `Button`, a
`Chip` inside a `TagsInput` float inside the padding and have to keep their own. Clamping every
rounded child automatically would square the avatars and shrink the chips, so the container side is
fully automatic and the child is the one that says it is flush.

One more thing the sweep reaches, because it did not used to: a theme is an object literal **or a
factory that returns one**. An exported `*Theme` arrow function is read as well now — reading only
object literals is how `buildMarkdownStreamdownTheme` shipped a raw `shadow`, an off-scale `/80`
muted step and a numeric `space-y-2`.

## Design Tokens

Geometry tokens are runtime values compiled by `<Theme designTokens={...}>` onto each theme
selector. The map is keyed by theme name, so light and dark can differ:

```svelte
<script lang="ts">
	import { Theme, type ThemeDesignTokenMap } from 'svelai/theme';

	let { children } = $props();
	const designTokens: ThemeDesignTokenMap = {
		light: { spacing: 'normal', radius: 'normal', typeScale: 'default', raisedWithBorder: true },
		dark: { spacing: 'normal', radius: 'normal', typeScale: 'default', raisedWithBorder: false }
	};
</script>

<Theme {designTokens}>{@render children()}</Theme>
```

Eleven presets ship with the library (`dense`, `compact`, `balanced`, `comfortable`, `spacious`,
`sharp`, `rounded`, `display`, `editorial`, `glass`, `terminal`), the same ones the docs
playground offers. Start from one and override what you need:

```svelte
<script lang="ts">
	import { Theme, themePresets } from 'svelai/theme';

	let { children } = $props();
	const tokens = { ...themePresets.glass.tokens, raisedWithBorder: true };
</script>

<Theme designTokens={{ light: tokens, dark: tokens }}>{@render children()}</Theme>
```

### `radius`

Scales the radius tokens (`rounded-sm` ... `rounded-4xl` and bare `rounded`) proportionally.
A `number` is used as the multiplier directly.

| Preset    | Multiplier  |
| --------- | ----------- |
| `none`    | 0× (sharp)  |
| `subtile` | 0.5×        |
| `small`   | 0.75×       |
| `normal`  | 1× (native) |
| `large`   | 1.5×        |
| `round`   | 2.5×        |

### `spacing`

Scales `--spacing` (the base of `p-*`, `gap-*`, `m-*`, `size-*` ...). A `number` is used as the
multiplier directly.

| Preset   | Multiplier   |
| -------- | ------------ |
| `small`  | 0.8× (dense) |
| `normal` | 1× (native)  |
| `large`  | 1.2× (roomy) |

### `spacingScale`

Multipliers of `--spacing` for the semantic steps `--space-xs` ... `--space-xl` (used by `p-md`,
`gap-lg` ...). Defaults: `{ xs: 1, sm: 1.5, md: 2, lg: 3, xl: 4 }`; values must increase.

### `typeScale`

Fluid `--text-xs` ... `--text-4xl` clamps. Either a preset or an options object
`{ baseMinPx?, baseMaxPx?, minViewport?, maxViewport?, scale?, remValueInPx? }`.

| Preset        | Base (min-max px) | Ratio           |
| ------------- | ----------------- | --------------- |
| `compact`     | 14-16             | `minorThird`    |
| `default`     | 16-18             | `majorThird`    |
| `comfortable` | 16-20             | `majorThird`    |
| `large`       | 18-22             | `perfectFourth` |

Ratios: `minorSecond` 1.067, `majorSecond` 1.125, `minorThird` 1.2, `majorThird` 1.25,
`perfectFourth` 1.32, `augmentedFourth` 1.414, `perfectFifth` 1.5, `goldenRatio` 1.618.

### `raisedWithBorder`

`true` gives `raised-*` elements a 1px `neutral-muted` border in addition to their shadow;
`false` removes it. Dark themes always drop the raised shadow, so leave it `true` there.

### `defaultColor`

Kit chrome role when a control omits `color`. Defaults to `'neutral'`. Set `'primary'` to
restore an accent-colored kit. Compiles `--color` and `--default-color` onto the theme selector;
do not set `data-color` on `html`.

### State colours

Four more roles, each a `Colors` and each optional, pin what a _state_ looks like across the whole
kit — independently of the colour of the control the state happens to land on. They are
Theme-level only: no component takes a per-instance override.

| Token           | Pins                                                            | CSS variable(s)                                                                                                 |
| --------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `focusColor`    | every focus ring                                                | `--color-focus`                                                                                                 |
| `selectedColor` | every persistent selection (rows, options, indicators, checked) | `--color-selected`, `--color-selected-contrast`, `--color-selected-readable`, `--color-selected-muted-readable` |
| `hoverColor`    | the transient hover layer                                       | `--color-hover`                                                                                                 |
| `pressedColor`  | the transient pressed layer (falls back to `hoverColor`)        | `--color-pressed`                                                                                               |

```svelte
<Theme
	designTokens={{
		light: { focusColor: 'primary', selectedColor: 'primary' },
		dark: { focusColor: 'primary', selectedColor: 'primary' }
	}}
>
	{@render children()}
</Theme>
```

None of these variables is declared at `:root`. **Every use site falls back to the matching
current-role variable**, so a theme that pins none of the four renders exactly as it did:

- `ring-focus` → `var(--color-focus, var(--color))`
- `bg-selected-muted` →
  `color-mix(in oklab, var(--color-selected, var(--color)) calc(var(--state-selected-opacity) * 100%), transparent)`
  — a tint of the role, so there is no `--color-selected-muted` to pin; `selectedColor` moves the
  fill through `--color-selected` and the ink through `--color-selected-muted-readable`
- the `state-layer`'s `::before` → `var(--color-hover, currentColor)`, and on `:active`
  `var(--color-pressed, var(--color-hover, currentColor))`

`[data-color]` keeps re-pointing `--color`, and anything not pinned follows it. Pin one, and that
state stops following the control's role everywhere at once — a neutral input focus-rings in
primary, a neutral sidebar row selects in primary.

Utilities (all take an opacity modifier — `ring-focus/50`, `bg-selected-muted/40`):
`ring-focus`, `border-focus`; `bg-selected`, `bg-selected-muted`, `text-selected`,
`text-selected-contrast`, `text-selected-muted-readable`, `border-selected`, `ring-selected`.

An unknown role throws, the way `defaultColor` does.

## Motion

Motion is a token scale like spacing and radius: five duration steps and four easing roles, shared
by CSS transitions and Svelte transitions. `<Theme motion>` retunes them app-wide; an omitted token
keeps its default.

| Duration  | Default | CSS variable         | Utility            |
| --------- | ------- | -------------------- | ------------------ |
| `instant` | 0ms     | `--duration-instant` | `duration-instant` |
| `fast`    | 100ms   | `--duration-fast`    | `duration-fast`    |
| `normal`  | 200ms   | `--duration-normal`  | `duration-normal`  |
| `slow`    | 300ms   | `--duration-slow`    | `duration-slow`    |
| `slower`  | 500ms   | `--duration-slower`  | `duration-slower`  |

| Easing role  | Default      | CSS variable        | Utility           |
| ------------ | ------------ | ------------------- | ----------------- |
| `standard`   | `cubicInOut` | `--ease-standard`   | `ease-standard`   |
| `enter`      | `cubicOut`   | `--ease-enter`      | `ease-enter`      |
| `exit`       | `cubicIn`    | `--ease-exit`       | `ease-exit`       |
| `emphasized` | `backOut`    | `--ease-emphasized` | `ease-emphasized` |

Easing values are names from the library's easing set (`linear`, `quadOut`, `cubicInOut`,
`expoOut`, `backOut`, ...). The Tailwind plugin writes the variables on `html` at build time;
`<Theme motion>` rewrites them on `html` at runtime and `designTokens.motion` rewrites them again
per theme, layered over the prop — so the utilities and the Svelte transitions never disagree.

```svelte
<script lang="ts">
	import { Theme } from 'svelai/theme';

	let { children } = $props();
</script>

<Theme motion={{ duration: { normal: 150, slow: 260 }, easing: { standard: 'quintOut' } }}>
	{@render children()}
</Theme>
```

`ThemeState.motion` exposes the resolved scale (`theme.motion.duration.normal`,
`theme.motion.easing.enter`) — including the active theme's `designTokens.motion` block.
`ThemeState.transition` is a deprecated alias for the `normal` duration and `standard` easing.
Reduced motion (`reduceMotion` or the OS setting) resolves every duration to 0.

### The `motion` slot

Components keep their transition in a reserved `motion` slot on their own theme, so the `theme`
prop and `set{Component}Theme` cover motion as well as classes. A spec takes `in` / `out` params
plus a `duration` / `easing` token (or an explicit ms value and easing name):

```svelte
<script lang="ts">
	import { Dialog } from 'svelai/dialog';
</script>

<Dialog theme={{ motion: { duration: 'fast', easing: 'emphasized' } }} title="Quick">Body</Dialog>
```

`motion()` is to a transition what `cva()` is to classes: a base spec, optional variants, and a
resolver. This is the shape a component declares — keep `duration` / `easing` as _token names_ so a
`<Theme motion>` retune and reduced motion reach the component:

```ts
import { motion, useComponentMotion } from 'svelai/motion';

const defaultDialogMotion = motion({
	base: {
		in: { x: 0, y: 0, scale: 0.98, opacity: 0 },
		out: { x: 0, y: 0, scale: 0.98, opacity: 0 },
		duration: 'normal',
		easing: 'standard'
	},
	variants: {
		type: {
			modal: {},
			drawerRight: { in: { x: '100%' }, out: { x: '100%' } }
		}
	},
	defaultVariants: { type: 'modal' }
});

const useDialogMotion = () => useComponentMotion('dialog', defaultDialogMotion);
```

### Motion override ladder

Motion overrides are always deep-merged — `override: true` is a class-only flag. Lowest priority
first:

1. the component's own preset, from the `motion` slot of its theme;
2. `<Theme components={{ dialog: { motion } }}>` — the app-wide registry;
3. `set{Component}Theme({ motion })` — every instance in that subtree;
4. the instance `theme={{ motion }}` slot;
5. the instance `transition` prop — a side it names (`in` / `out`) replaces the merged one and then
   picks the tokens back up, so it wins over every motion override. The flat form (neither `in` nor
   `out`) replaces both directions.

```svelte
<script lang="ts">
	import { Theme } from 'svelai/theme';
	import { Dialog, setDialogTheme } from 'svelai/dialog';

	// Every dialog below this component.
	setDialogTheme({ motion: { duration: 'slow', easing: 'emphasized' } });
</script>

<Theme components={{ dialog: { motion: { easing: 'enter' } } }}>
	<Dialog theme={{ motion: { duration: 'fast' } }} title="Instance override" />
	<Dialog transition={{ in: { y: 24 }, out: { y: 24 } }} title="Explicit transition" />
</Theme>
```

### Reduced motion

`reduceMotion` on `<Theme>` forces the preference; omitted, the OS `prefers-reduced-motion` setting
decides. When it resolves to true every duration is set to 0 _last_, after every override, and the
preference is mirrored onto `<html>` as `data-svelai-reduce-motion`, which also collapses the
`--duration-*` variables so `duration-*` CSS transitions and CSS-only animations honour it too.

```svelte
<script lang="ts">
	import { Theme } from 'svelai/theme';

	let { children } = $props();
</script>

<Theme reduceMotion={true}>
	{@render children()}
</Theme>
```

## Responsive Props

A prop typed `ResponsiveProps<T>` takes one of two forms:

```svelte
<script lang="ts">
	import { Stack } from 'svelai/stack';
</script>

<!-- a value: the same at every width -->
<Stack gap="md">
	<span>One</span>
</Stack>

<!-- a partial record: one value per breakpoint -->
<Stack orientation={{ md: 'horizontal' }} gap={{ xs: 'sm', lg: 'xl' }}>
	<span>One</span>
</Stack>
```

`Breakpoint` is `'xs' | 'sm' | 'md' | 'lg' | 'xl'` everywhere, and `xs` is the floor.

**There is no function form.** A record is declarative and inspectable; the five steps it
produces cannot disagree.

Three rules govern every responsive prop in the library:

- **The nearest _defined_ key at or below the active breakpoint wins.** `{ sm: 2, lg: 4 }` is 2 at
  `sm` and `md`, 4 at `lg` and `xl`; at `xs` nothing is defined at or below, so the component's own
  default applies. Skipped keys are not holes — a value holds until a wider key overrides it,
  exactly like the `min-width` queries the record feeds. You never have to fill in the steps
  between.
- **An object is read as a record only when _every_ one of its own keys is a breakpoint name.**
  That is what keeps `transition={{ in, out }}` and `columns={{ minWidth: 320, max: 3 }}` values
  rather than records. `{}` has no key that disagrees, so it reads as an empty record and resolves
  to the default.
- **Only `undefined` and `null` fall back.** `false`, `0` and `''` are values you meant:
  `gaps={0}` is a zero gap, not the default gap.

### Two resolvers behind one shape

What the breakpoint names measure depends on what the component is sized by:

- **Viewport** — overlays and chrome whose host _is_ the window.
  `ThemeState.resolveResponsiveProps(props, default)` resolves these against
  `theme.currentBreakpoint`, which follows `window`.
- **Container** — host-sized layout: `Grid`, `GridSpan`, `Stack` and `Carousel`. The component
  resolves the prop for all five breakpoints while rendering, writes them as custom properties on
  its layout element, and static container-query rules pick the one matching the width its host
  actually handed it. No measurement and no JavaScript, so the first paint and the server render
  are already correct.

> **The two resolvers use different widths.** `xs | sm | md | lg | xl` name five steps in both, but
> the viewport resolver steps at Tailwind's device widths and the container resolver at the table
> below. `<Popover size={{ md: 'large' }} />` switches at a **768px window**;
> `<Stack orientation={{ md: 'horizontal' }} />` switches at a **672px stack**. Read the prop's
> JSDoc — a container-resolved prop says it measures the component's own width.

Every viewport-resolved prop in the library:

| Component                                             | Props                                                            |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `Dialog`                                              | `type`, `size`, `scroll`                                         |
| `Popover`, `PopupMenu` (which extends `PopoverProps`) | `position`, `size`                                               |
| `HoverCard`, `LinkPreview`                            | `position` only — their `size` is a plain `Sizes`                |
| `ContextMenu`                                         | `position` and the rest, forwarded through its Popover overrides |
| `Toast`                                               | `position`, `collapseHorizontalAxis`                             |
| every overlay and disclosure with motion              | `transition` (`ResponsiveProps<FSOProps>`)                       |

`Confirmation` is viewport-driven too, but through `theme.isMobile` (below `md`, i.e. < 768px),
which stacks its footer buttons full-width — it exposes no `ResponsiveProps` of its own.

### The viewport breakpoint table

`ThemeState.currentBreakpoint` is a `min-width` ladder over Tailwind's default device widths, so a
responsive overlay prop steps where the rest of your app's `sm:` / `md:` utilities do:

| Breakpoint | Viewport width |
| ---------- | -------------- |
| `xs`       | below 640px    |
| `sm`       | 640px          |
| `md`       | 768px          |
| `lg`       | 1024px         |
| `xl`       | 1280px         |

On the server there is no viewport to measure, so `currentBreakpoint` is `md`.

### The container breakpoint table

One table, exported from `svelai/theme` and shared by Grid, Stack and Carousel, so `sm` means the
same box width in all three:

| Breakpoint | Container width   | Chosen because             |
| ---------- | ----------------- | -------------------------- |
| `xs`       | base, below 36rem | one column                 |
| `sm`       | 36rem / 576px     | two ~17rem columns fit     |
| `md`       | 42rem / 672px     | two roomier ~20rem columns |
| `lg`       | 56rem / 896px     | three ~17rem columns fit   |
| `xl`       | 72rem / 1152px    | four ~17rem columns fit    |

Each step is the width at which one more ~17-18rem content column fits next to the ones already
there, gaps included.

**These measure the component's own width, not the viewport's.** A Grid in a 400px sidebar of a
1600px page is `xs`; the same grid run full-bleed is `xl`. `md` on a Stack in a drawer is not `md`
on the page.

```ts
import { containerBreakpoints, resolveContainerBreakpoint, resolveResponsive } from 'svelai/theme';

containerBreakpoints.lg; // '56rem'
resolveContainerBreakpoint(900); // 'lg' -- the step a 900px-wide container sits at
resolveResponsive({ sm: 2, lg: 4 }, 'md', 1); // 2 -- nearest defined key at or below `md`
```

`resolveContainerBreakpoint` is only for the rare component that needs the active step _in JS_
(Carousel uses it for the dot count and the `next()` / `prev()` step size). A component that only
needs to style per breakpoint never measures anything.

### Writing a container-responsive theme

`responsiveVariables(name, props, fallback, toCss?)` returns the five `--<name>-xs` ...
`--<name>-xl` custom properties with the cascade already flattened, so each step's rule reads one
property and never falls back through the others. Put them on an element **inside** the
`@container` root — a container query cannot style its own container, which is why Grid, Stack and
Carousel each render an outer container root and an inner layout element.

The matching `@min-[...]` class chain must be a **literal** in the `.theme.ts`. Tailwind generates
classes by scanning source text, so a chain concatenated at runtime never exists.
`responsiveContainerClasses(name, property, container?)` builds the exact literal the theme must
contain, and each component's test asserts the two are still equal — editing a width in
`containerBreakpoints` then fails those tests until the literals follow.

```ts
import { responsiveContainerClasses } from 'svelai/theme';

// Hand-written in stack.theme.ts; stack.theme.test.ts asserts it still equals this.
responsiveContainerClasses('stack-gap', 'gap', 'stack');
// '[gap:var(--stack-gap-xs)] @min-[36rem]/stack:[gap:var(--stack-gap-sm)] ...'
```

Pass `container` when the root is a **named** container (`@container/stack`), so each variant
queries that root by name instead of the nearest container — which would be whatever ancestor a
consumer happened to wrap it in. Omit it for an unnamed one.

The `--<component>-*` properties this pair writes are **internal**: they are the component's own
wiring between its resolver and its container queries, not a public hook. A consumer changes the
layout through the prop (`gap`, `columns`, `layout`), never by declaring one of these.

## Theme Svelte Component

Wrap your app once in `+layout.svelte`. The `children` snippet receives the shared
[`ThemeState`](#themestate):

```svelte
<script>
	import { Theme } from 'svelai/theme';

	let { children } = $props();
</script>

<Theme>
	{@render children()}
</Theme>
```

**Props:**

- `children`: `Snippet<[ThemeState]>` (required)
- `themes`: string[] (default `['light', 'dark']`; `'system'` is appended when `systemTheme`)
- `defaultTheme`: string (default `'system'`, or `'light'` when `systemTheme` is false)
- `systemTheme`: boolean (default `true`) -- follow `prefers-color-scheme`
- `forcedTheme`: string -- pin a theme for the current page
- `attribute`: `'class'` | `data-*` (default `'data-theme'`) -- must match the plugin's `html[data-theme]` selector
- `value`: `Record<theme, string>` -- map theme names to attribute values
- `colorScheme`: `Record<theme, 'light' | 'dark'>` -- `color-scheme` per theme (custom names only; `light`/`dark` are inferred)
- `storageKey`: string (default `'theme'`) -- `localStorage` key
- `transitionOnChange`, `syncColorScheme`: boolean (both default `true`) -- keep CSS transitions running across a theme swap; mirror the resolved scheme onto `color-scheme`
- `designTokens`: `ThemeDesignTokenMap` (`Record<theme, ThemeDesignTokens>`) -- see [Design Tokens](#design-tokens)
- `transition`: `ThemeTransition` -- view transition on theme change (`'radial-top-left'`, `'line-top'`, `'shutter-left'`, `'random-grid'`, ...; full list in `themeTransitions`)
- `spinnerVariant`: `SpinnerVariant` -- global default for loading indicators
- `reduceMotion`: boolean -- force reduced motion on/off for every svelai animation, overriding the OS `prefers-reduced-motion` setting (omit to follow the OS); also toggles `data-svelai-reduce-motion` on `html`

The component also renders the shared tooltip, dialog backdrop and floating-window layer, so it
must be the outermost svelai element.

## ThemeState

The instance passed to `<Theme>`'s `children` snippet. Also exported as a type from
`svelai/theme` (`ThemeState`), together with `useDefaultColor(color?)` for custom controls.

**Theme:** `theme` (get/set, `'light' | 'dark' | 'system' | ...`), `resolvedTheme`,
`systemTheme`, `themes`

**Viewport:** `currentBreakpoint` (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`), `isMobile` (below `md`),
`resolveResponsiveProps(props)`

**Reactive state:** `tooltip`, `dialogs`, `openDialogs`, `popovers`, `defaultColor`,
`spinnerVariant`, `preferReducesMotion` (live: the `reduceMotion` prop when set, else the OS
setting)

## Dark / Light Mode

Switching writes `theme.theme`, which updates the `html` attribute (through `transition` when
set) and persists under `storageKey`:

```svelte
<script>
	import { Theme } from 'svelai/theme';
	import { Button } from 'svelai/button';

	let { children: page } = $props();
</script>

<Theme transition="radial-top-right">
	{#snippet children(theme)}
		<Button onclick={() => (theme.theme = theme.resolvedTheme === 'dark' ? 'light' : 'dark')}>
			{theme.resolvedTheme === 'dark' ? 'Light' : 'Dark'}
		</Button>
		{@render page()}
	{/snippet}
</Theme>
```

Force a theme with `forcedTheme="dark"`, or opt out of the system preference with
`systemTheme={false} defaultTheme="light"`.

CSS-level fallback without `<Theme>`: add `prefersDark: true` to the dark plugin block so its
variables also apply under `@media (prefers-color-scheme: dark)`.

## Component Theme Overrides

Every component exports `set{Component}Theme` from its subpath and accepts a `theme` prop. Both take
the same shape: one entry per slot (`root`, `prefix`, `suffix`, ...), each with an optional `base`
string and one map per variant keyed by variant value.

**Global** (affects all instances below the caller in the component tree):

```svelte
<script>
	import { setButtonTheme } from 'svelai/button';
	import { setDialogTheme } from 'svelai/dialog';

	setButtonTheme({
		root: {
			base: 'tracking-wide',
			color: { primary: 'ring-1 ring-primary/30' },
			variant: { solid: 'shadow-md' },
			size: { large: 'text-base' }
		},
		prefix: { base: 'opacity-80' }
	});
	setDialogTheme({ content: { base: 'bg-surface-floating' } });
</script>
```

**Per-instance** (via `theme` prop):

```svelte
<script>
	import { Button } from 'svelai/button';
</script>

<Button theme={{ root: { base: 'rounded-lg' } }} color="primary">Themed</Button>
```

Override classes are appended after the defaults (Tailwind conflicts resolve in your favor);
`class` on the instance lands last. Pass `override: true` to drop the default classes entirely:

```svelte
<script>
	import { Button } from 'svelai/button';
</script>

<Button theme={{ override: true, root: { base: 'inline-flex rounded px-3 py-1' } }}>Bare</Button>
```

Global setters use Svelte context, so call them in a layout or wrapper component; per-instance
overrides layer on top of the global ones.

## Component Theme Registry

`<Theme components>` holds app-wide component theme defaults without one wrapper component per
component. It is keyed by theme name (`dialog`, `button`, ...); each entry takes the same slots as
that component's `theme` prop, the `motion` slot included.

```svelte
<script lang="ts">
	import { Theme } from 'svelai/theme';

	let { children } = $props();
</script>

<Theme
	components={{
		dialog: { motion: { duration: 'fast' }, content: { base: 'rounded-2xl' } },
		button: { root: { base: 'tracking-wide' } }
	}}
>
	{@render children()}
</Theme>
```

Precedence, lowest first: the component's own theme, `<Theme components>`, `set{Component}Theme`
for a subtree, then the instance `theme` prop. Every rung layers on the one below it, per slot — a
subtree that restyles one slot keeps the registry's others.

### Newly themeable surfaces

These components used to hard-code their classes and now carry a theme file, a `theme` prop, and a
registry key like every other component:

| Registry key      | Setter                   | Slots                                                        |
| ----------------- | ------------------------ | ------------------------------------------------------------ |
| `heading`         | `setHeadingTheme`        | `root` (size, weight, align, balanced, underline, muted)     |
| `context-menu`    | `setContextMenuTheme`    | `root`, `panel`                                              |
| `popup-menu`      | `setPopupMenuTheme`      | `panel` — the menu's minimum width lives here, not in markup |
| `confirmation`    | `setConfirmationTheme`   | `root`, `footer` (layout)                                    |
| `ai-conversation` | `setAIConversationTheme` | `root`                                                       |

Two existing themes changed shape:

- `toast` — a single toast takes its own `theme` in its options, layered over `<Toaster theme>`.
- `table` — row selection is a `selected` variant on the `row` slot, driven by `<TableRow selected>`,
  instead of `data-[state=selected]:` classes baked into `row.base`. Restyle a selected row with
  `table: { row: { selected: { true: '...' } } }` rather than out-specifying an attribute selector.
