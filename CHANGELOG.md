# Changelog

All notable changes to entasis are recorded here. The format follows Keep a Changelog; releases
are cut with `npm run release <patch|minor|major>` (see `tooling/release.mjs`), which moves the
Unreleased section under the new version.

## Unreleased

## 0.7.0 — 2026-09-24
### Renamed

- Every `<Theme components>` registry key is kebab-case, the component's import-subpath name:
  `ai-chat`, `data-table`, `date-input`, `network-indicator`, `video-player`, and so on. 54 keys
  were still camelCase (`aiChat`, `dateInput`, `networkIndicator`, …); the new name is the old one
  with a hyphen before each capital, lowercased, and every key is listed in the skill's
  `theme-parts/` folder. A registry entry under an old key resolves nothing; the `set*Theme`
  setters and `theme` props are unaffected. The contract generator now refuses a key that is not
  kebab-case.

### Added

- A generated theme-part reference in the entasis skill, `theme-parts/<registry-key>.md`, one file
  per component: for each part, the element it lands on, its variants with the default marked, and
  the exact classes each value adds. Built by `generate:component-contract` from the same extractor
  the docs site's Theme tab uses, and checked for drift with the rest of the contract.
- Theming docs: how to scope an override to one colour or variant through the `data-color` /
  `data-variant` attributes component roots publish, and the radius step table.
- Theming docs: an override only replaces a default written under a variant prefix when it repeats
  the same prefixes; otherwise the two coexist and the browser keeps the default. Stated, with
  Sidebar's active row as the example.
- Sidebar restyle recipes in its MCP description — dark panel, active row in your colour, no hover
  change, flat panel, row height, icon size — each rendered and asserted by a test so it cannot drift.

### Fixed

- Sidebar `iconSize` (0.6.0) only reached the collapsed-mode padding math: the row, sub-row,
  trailing, group-label and action icons and the leading media were sized by tokens keyed on
  `size`. They now read the `--sidebar-icon-size` / `--sidebar-media-size` variables the panel
  publishes, so `iconSize` scales them as documented, and a `size-*` override on any of them still
  wins.

## 0.6.0 — 2026-09-23

### Added

- `state-layer-none`: switches the hover / pressed overlay off on one element. The tint is a
  `::before`, so `hover:bg-*` on the element never reached it; the merge engine treats the pair as
  one group, so the last one wins.
- Sidebar `iconSize`: the icon and leading-media scale inside the panel on its own, defaulting to
  `size`. The `panel` and `mobilePanel` theme parts gain the matching `iconSize` variant; the
  existing `size` variant is untouched.
- Theming docs: a "Switching a house utility off" table naming the switch for each utility that is
  not a plain class. The merge test suite now proves every house class group either yields to its
  Tailwind counterpart or carries a `none` value, so the table stays true when a token is added.

## 0.5.0 — 2026-09-22

### Renamed

- Sidebar theme variants now spell both of the component's size axes in the shared scale. The
  Sidebar's own scale is `size` on every slot (it was `componentSize` on all but `groupContent`),
  and a row's own scale is `itemSize: 'small' | 'normal' | 'large'` (it was `size` spelled
  `default | sm | lg` on `menuButton`, `sm | md` on `subButton` and `default | compact` on `media`).
  The brand and user menu button's `data-size` follows: `normal` / `large` instead of `default` / `lg`.
  Theme overrides written against the old names resolve no class; there is no forwarding alias.

### Added

- `use{Component}Theme(theme, shared)`: a second argument binds one set of variant values to every
  class slot, so a template calls `slots.root()` and `slots.prefix()` instead of threading the same
  props into each call; a slot can still add its own (`slots.root({ className })`). Every slot now
  sees every prop, so an override keyed on a variant a component used to pass only to its root
  reaches the slot it names. The one-argument form is unchanged. `Button` is the first consumer.
- `designTokens.drawerInset`: how far a drawer `Dialog` stands off the screen edge, a spacing step
  or `'none'`, default `'layout-md'` (the distance drawers always had). At `'none'` the drawer is
  edge to edge and its edge corners square off by themselves — `min(--radius-xl, --drawer-inset ×
9999)` — while the corners facing the page keep their radius. The drawer types used to square the
  wrong side (`rounded-l-none` on a right drawer) whatever the inset. A single dialog overrides the
  theme with the same values through its `inset` prop; the docs playground's Design tokens panel
  exposes the token next to the other geometry.

### Changed

- Dark themes: `neutral-muted`, the kit's edge colour, is now derived from `surface-floating`
  instead of the base surface. It used to land at the same lightness as a floating panel and 0.04
  above a raised one, so a Card's ring and a Popover's edge were invisible in dark mode; every
  `ring-neutral-muted`, `border-neutral-muted` and `--raised-border` now clears the lightest
  surface by 0.06. Light themes are unchanged.
- `AITool` status is a bare mark instead of a ringed, tinted badge: a spinner while a call runs, a
  small dot once it has settled, coloured by outcome, for the tool rows and the group title alike.
- `HoverCard` and `LinkPreview` panels now wear the `Popover` surface — `raised-3` on
  `bg-surface-floating` with its 1px edge — instead of an in-page Card's `lift-1` and ring on
  `bg-surface-raised`, and take their width from the Popover size step (16 / 20 / 24rem) rather than
  their own 16 / 18 / 24rem. Three floating panels opened from the same page used to show two
  different surfaces.
- The `<Theme>` context key is now `entasisTheme`; it was still spelled `sveltaiTheme` after the 0.4.0
  rename. Only code that reached past `useTheme()` with a raw `getContext` call notices.

## 0.4.1 — 2026-09-21

### Changed

- `svelte-streamdown` 4.0.0 → 4.2.0 under `Markdown` and `AIMessage`. What a consumer sees: wide tables
  gain a fullscreen toggle beside copy and download (`controls={{ table: { fullscreen: false } }}`
  removes it), a half-typed HTML tag at the streaming tail no longer flashes as text, and a finished
  block keeps an incomplete PascalCase tag instead of losing its tail. Opt-in and off by default:
  `customTags`, `literalTagContent`, `normalizeHtmlIndentation` and code `lineNumbers`, all forwarded
  through `Markdown`'s rest props.

## 0.4.0 — 2026-09-20

This is a breaking release. Renamed APIs have no forwarding aliases.

### Renamed

- The package is now `entasis` (npm `entasis`, imports `entasis/<subpath>`, the Tailwind plugin
  `entasis/tailwind-plugin/theme`, the `<Theme>` from `entasis/theme`). Every `svelai` spelling
  went with it: the `data-entasis-*` attributes, the `entasis:*` context keys, the `entasis-mcp`
  server, the Cloudflare worker and the `entasis` skill folder. Entasis is the slight swelling
  given to a column so that it reads as straight, which is what this library does to colour,
  spacing and radius: things are bent so they look right. `svelai` 0.1.x stays on npm as is; there
  is no forwarding package.

### Added

- Docs: a "Tokens" page (`/docs/tokens`) is the single reference for every consumer-facing token —
  the twelve `designTokens` keys with their type, default and meaning; the CSS variable families a
  consumer may read or set (the per-role colour kits and their companions, the surfaces, the
  current-role family, the four state roles, elevation, spacing, radius, type, geometry, motion and
  the window properties); the container and viewport breakpoint tables; and the utility families
  that read them back. The tables are derived from `src/lib/tailwind/scales.ts`,
  `geometry.ts`, `colors.ts` and `Theme/responsive.ts` rather than restated, so a retuned scale
  cannot leave the page stale. A closing "Private variables" section states that every
  component-prefixed custom property (`--page-shell-*`, `--sidebar-*`, `--carousel-*`, `--stack-*`,
  `--grid-*`, `--timeline-*`, `--gantt-*`, `--event-calendar-*`, `--spinner-size`) is an
  implementation detail with no stability guarantee.

- Docs: a "Consistency rules" page (`/docs/consistency`) states the nine harmonised axes (focus
  ring, elevation, sizes, muted text, hover, selected, type ramp, container queries, concentric
  radius) with live components for each, the tokens behind them, and the checker that keeps the
  eight written ones from drifting (the concentric radius is computed, so it has nothing to
  police). The concentric-radius demo renders the same markup twice, once at the page's radius
  preset and once at `round` (compiled by `compileThemeDesignTokens` and moved off `html` onto the
  box), because a hand-written child radius keeps cutting across the container's corner as the
  preset moves: inside a `rounded-lg p-xs` panel a `rounded-md-concentric` row is
  `min(8px, 12 − 4)` = 8px at `normal` and `min(20px, 30 − 4)` = 20px at `round`, while a
  hand-written `rounded-lg` row is 12px and then 30px against corners that allow 8px and 26px. The
  two "Pinning the role" demos wear the literal output of `compileThemeDesignTokens` — the function
  `<Theme designTokens>` compiles with — so the page cannot claim a behaviour the compiler does not
  have.
- Templates: a new `/templates` section in the docs app with a first full-page template, the Tasks
  dashboard (`/templates/tasks-dashboard`, Overview and Timeline tabs). It is a stress test of the
  design system: AppShell, Sidebar, PageShell, Tabs, Stat, Chart, GanttChart, Meter and
  SegmentedControl do all the work, the look comes from one root token block (scale helpers, a colour
  kit, one font), and `tooling/check-template-purity.mjs` (wired into `prepack` and CI) rejects
  arbitrary classes, component theme overrides, inline styles, raw px and hex outside that block.
  The gaps the library could not express are recorded in
  `src/routes/templates/tasks-dashboard/FINDINGS.md` as candidate library changes.
- Shared overlay architecture: one layer stack (`ThemeState.layers`) owns Escape (topmost layer
  only), outside-press dismissal (every layer above the one pressed, descendants protected), open
  order and z-index for dialogs, popovers, menus, tooltips and floating windows.
- `useFocusScope`: initial focus (`[autofocus]`, `[data-autofocus]`, first tabbable, container),
  Tab containment, `inert` on the rest of the page for modals, focus restore to the opener.
- Type-ahead in menus, the menubar and `Select`; RTL-aware arrow keys everywhere `useNavigation`
  runs (menus, tabs, segmented controls, slider, carousel).
- Popover `inline`: renders the panel in normal document flow (no portal, no floating-ui placement,
  no scroll lock, no outside-press dismissal) with the same panel classes and motion, so an open
  popover can be shown statically.
- Popover `focusOnOpen` and `haspopup`; triggers receive `aria-haspopup`/`aria-expanded`/
  `aria-controls` automatically. Tooltips open on focus and link to their trigger via
  `aria-describedby`.
- Tabs/Tabbar use string values (`TabItem.value`), with `id`/`aria-selected`/`aria-controls` on tabs
  and `role="tabpanel"` + `aria-labelledby` on panels (`Stepper.panelId`).
- `ToggleButtonGroup type="single"` (radiogroup) and roving tabindex; `ToggleButton role="radio"`.
- ContextMenu opens on Shift+F10 / the ContextMenu key and on touch long-press.
- Toast: `role="region"` landmark, F6 focuses it, per-toast `theme`, and `toast()` queues until a
  `<Toaster/>` mounts instead of throwing. Confirmation hosts register on `ThemeState`.
- Sidebar `activityBar` (persistent icon rail with header/footer, badges, tooltips, roving
  arrow keys) and `expandOnHover`; hover-revealed sidebars stay open while focus or an open menu is
  inside them.
- Theme engine options `radius`, `spacing`, `typeScale`, `elevation` on the Tailwind plugin; a
  real 8-step radius scale; `--elevation-0…5` shadows with dark-mode tonal tint (`raised-0…5`); the
  default fluid type scale is emitted at build time.
- Motion system: `<Theme motion>` duration/easing tokens, CSS `duration-*`/`ease-*` utilities, a
  `motion` slot in every animated component's theme with the class-theme override ladder, and
  `<Theme components>` as a central registry for class and motion overrides. `reduceMotion` prop.
- Heading, ContextMenu, PopupMenu, Confirmation and AIConversation gained theme files; Table rows
  gained a `selected` theme variant; RadioInput exposes `theme`.
- i18n catalog covers every user-facing string (511 keys, 8 locales, RTL metadata).
- Tooling: `check:doc-fences` compiles every documentation code fence against the packed
  library; `check:feature-chips` requires accessibility claims on docs pages to be backed by a
  named test; an axe-core end-to-end sweep over every component page and block preview;
  `release` script and tag-driven publish workflow.

- Chart wide data: a `variant: 'stack'` bar mark (and an area series with `layout: { type: 'stack' }`)
  accepts a list of numeric field names as its value channel — `y: ['completed', 'inProgress', 'pending']`.
  Rows are melted internally, the field name becomes the series key, and the declared field order is
  the stack order, the legend order and the color-discovery order, so a wide table no longer has to be
  hand-melted into long format.
- Chart `palette` accepts a record as well as an array: `{ completed: 'secondary', inProgress: 'primary' }`
  names a color per series key and falls back to the default palette for unnamed series, so the color
  mapping no longer depends on the order rows happen to appear in `data`.
- Chart `legend.format?: (key: ChartKey) => string` sets the display text for a series key in the
  legend and in every tooltip series label, and widens the legend entry to fit the formatted label
  instead of wrapping it. Display text is now independent of the data key.
- Chart stacked bars take `gap` (pixels of surface between consecutive segments of one stack). Only
  the painted rectangle shrinks, on the edge it shares with the previous segment, so the baseline,
  the stack total, the tooltip values and hit-testing are unchanged.
- Chart tooltips are controllable: `tooltip.value` / `tooltip.defaultValue` / `tooltip.onValueChange`
  pin a row (identified by the mark's `key` channel when it has one, by its x value otherwise). A
  pinned row shows without hover, hover moves the tooltip, pointer leave restores the pin, and a
  click pins or unpins.
- `ChartColor` accepts the surface family — `surface`, `surface-recessed`, `surface-canvas`,
  `surface-raised`, `surface-floating` — alongside the seven semantic roles, so a point marker filled
  with the card background is `fill: 'surface'` instead of a raw `var(--color-surface)`.
- Stat `unit`: a slot rendered baseline-aligned after `value` one type step down at every size, so
  `value="147" unit="task"` reads as a number with a unit rather than one run of text.
- Stat `trendIcon`: a leading slot in neutral ink next to the trend text, and the component appends
  its own direction arrow from `trendDirection`, so only the text and the arrow take the trend color.
- Stat `action` + `onAction` / `actionLabel` / `actionDisabled`: a real ghost icon button in the
  top-right corner, stacked above `indicator` in the same column, so a card can carry a status
  indicator and a menu affordance at once.

- `Sidebar` `activeVariant: 'soft' | 'outline' | 'solid'` (default `'soft'`) chooses how an active
  row paints: the shared `selectedSoft` recipe, a bordered surface card, or `selectedSolid`. Every
  menu, submenu and tree row carries the choice as `data-active-variant`, so restyling selection
  needs no descendant selector.
- `SidebarMenuEntry` takes `iconColor?: Colors` and `iconVariant?: 'bare' | 'tile'`. `tile` paints a
  role-tinted rounded square around the glyph from the row's own `data-color`, and the tile scales
  with the Sidebar `size` on icon tokens only.
- `SidebarMenuButtonItem.trailing` accepts an action descriptor `{ icon, label, onclick }`, rendered
  as a sibling control beside the row (never nested inside it), so a workspace card can carry its own
  collapse button without a custom `header` snippet.
- `AppShell` `variant="framed"` draws one rounded card (`rounded-xl` plus `raised-1`, through the
  elevation engine) on the canvas, containing both the sidebar and the page; the sidebar keeps its
  recessed well inside it: `framed` is a `SidebarVariant`, forwarded unchanged, whose well is
  `surface-recessed`.
- `AppShell` `label` names the page's `main` landmark, forwarded to the `PageShell` it renders.
- Sidebar theme gained the `actionSlot`, `menuIcon` and `buttonRow` parts; AppShell theme gained
  `frame`.
- `Button` takes `pressed`, `selected`, `expanded` and `haspopup`; `PageShell` and `Tabbar` take
  `label`, and `Tabs` forwards `label` to its tab list. These are the semantic replacements for the
  ARIA attributes those components no longer accept as props.
- `entasis/theme` exports the shared container breakpoint table and its resolvers:
  `containerBreakpoints`, `breakpoints`, `resolveResponsive`, `resolveContainerBreakpoint`,
  `responsiveVariables` and `responsiveContainerClasses`, plus the `Breakpoint`,
  `ContainerBreakpoint` and `ResponsiveProps` types. `responsiveVariables` flattens a responsive
  prop into the five custom properties a container rule reads; `responsiveContainerClasses` is the
  codegen/comparison helper a theme test asserts its hand-written `@min-[…]` chain against, since a
  class concatenated at runtime is never generated by Tailwind.
- `Chip` takes `selected`, one prop for the whole chosen/unchosen axis: it stamps `data-selected`,
  paints the shared soft selected fill on top of `variant`, and is the chip's accessible state —
  `aria-pressed` when the chip resolved to a button, `aria-current` when it resolved to a link, and
  nothing at all on a chip with neither `onclick` nor `href`, which has no interactive role to carry
  one. `TagGroup` uses it instead of reaching the recipe through its own `item` theme part.
- `Stepper` and `Tabs` take `mount: 'eager' | 'lazy' | 'once'`. A `lazy` panel is created the first
  time it is activated and destroyed once the slide away from it finishes, `once` keeps it
  afterwards, `eager` creates every panel up front. `Tabs` defaults to `lazy`, `Stepper` to `eager`. `entasis/stepper` exports the
  `StepperMount` type.
- `TabsProps['tabbar']` forwards `variant` and `scrollFade`, so Tabbar's `underline` / `pill` looks
  and its scroll fade are reachable from `Tabs`.
- `PopoverState.triggerProps` carries `{ haspopup, expanded, controls }` for a built-in trigger;
  a snippet trigger gets the same state through `{@attach popover.reference}`.
- Docs: `/docs/consistency` gained a seventh rule card and a "Type ramp" section showing the three
  ramps side by side with a live Button / MenuOption / Card / Stat matrix at all three sizes.
- **Four state roles a theme can pin once.** `designTokens.focusColor`, `selectedColor`,
  `hoverColor` and `pressedColor` (each a `Colors` role, each optional) fix the colour of the focus
  ring, of persistent selection and of the transient hover/pressed state layer for the whole theme,
  instead of letting each of them follow the colour of the control they sit on. They compile to
  `--color-focus`, `--color-selected` (plus its `-muted`, `-contrast`, `-readable` and
  `-muted-readable` companions), `--color-hover` and `--color-pressed` on the theme root. None of
  those variables is declared at `:root`: every use site falls back to the matching current-role
  variable — `ring-focus` resolves to `var(--color-focus, var(--color))`, the state layer's
  `::before` to `var(--color-hover, currentColor)` and, on `:active`, to
  `var(--color-pressed, var(--color-hover, currentColor))`. A theme that pins none of the four
  therefore looks exactly as it did, and `[data-color]` keeps re-pointing `--color` with the states
  following it. An unknown role throws the way `defaultColor` does. Theme-only: there is no
  per-component override.
- Tailwind utilities for the state roles, each falling back to its current-role twin and each
  accepting an opacity modifier (`ring-focus/50`, `bg-selected-muted/40`): `ring-focus`,
  `border-focus`; `bg-selected`, `bg-selected-muted`, `text-selected`, `text-selected-contrast`,
  `text-selected-muted-readable`, `border-selected`, `ring-selected`. The set is deliberately
  exactly what the library uses — there is no `outline-focus`, `text-focus`,
  `text-selected-readable`, `fill-selected` or `stroke-selected`.
- `focusRing` recipe (`entasis/theme`) — `'focus-visible:ring-2 focus-visible:ring-focus/50'`, the
  one focus ring for new code. `selectedSoft` and `selectedSolid` now read
  `'bg-selected-muted text-selected-muted-readable'` and `'bg-selected text-selected-contrast'`, so
  everything already importing them moved to the selected state role on its own.
- Concentric radius, computed by the cascade instead of declared. A flush child takes
  `rounded-<step>-concentric` (also `rounded-t-<step>-concentric` / `rounded-b-<step>-concentric`,
  `<step>` one of `xs sm md lg xl 2xl 3xl 4xl`) and gets
  `min(var(--radius-<step>), calc(var(--radius-parent, calc(infinity * 1px)) - max(var(--pad-parent-x, 0px), var(--pad-parent-y, 0px))))`
  — a cap, not a subtraction: the child keeps its own step on the radius ramp and only gives ground
  when the container's corner cannot hold it, because a child rounder than that cuts across the
  corner while a child less round merely reads as an ordinary control. Outside any rounded
  container the parent radius is infinite, so the child is exactly its step. A concentric box also
  publishes its nominal step to its own children like every other `rounded-<step>`, so two-level
  nesting is bounded by the step instead of reading nothing at all.
  The container declares nothing, because every `rounded-<step>` now also emits
  `.rounded-<step> > * { --radius-parent: var(--radius-<step>) }` and `p` / `px` / `py` publish
  `--pad-parent-x/-y` to their children (`rounded-full` publishes infinity and `rounded-none`
  `0px`; one-sided padding, arbitrary radii and the side and corner forms publish nothing). Both variables inherit, so an
  unrounded, unpadded wrapper in between is transparent, and every `rounded-<step>` resets
  `--pad-parent-*` to `0px` for its children — at zero specificity, so the box's own `p-*` publish
  still wins — so padding never crosses a rounded boundary and never accumulates: one level of
  nesting is exact, which is every nesting in the library. Both halves ride
  `designTokens.radius` and `designTokens.spacing`, so the child can never cut the container's
  corner at any preset, and a box tighter than its own padding squares off because CSS clamps a
  negative radius to 0. The child half stays opt-in because CSS cannot tell a flush child (a menu row) from a
  floating one (an avatar, a `Button`, a `Chip` in a `TagsInput`), which clamping every rounded
  child would square or shrink.

### Changed

- **Breaking: `buildStreamdownTheme` is now `buildMarkdownStreamdownTheme`** (`entasis/markdown`).
  The old name did not carry its owner, which is what kept it outside
  `tooling/check-semantic-theme-tokens.mjs` when the sweep learned to read theme factories. Same
  signature, same return value.
- Markdown prose follows the theme-class rules the rest of the library follows, now that the sweep
  reaches it: a link no longer dims to `text-primary-readable/80` on hover (it is underlined at
  `underline-offset-4` and keeps its colour, as `RichTextInput`'s prose links do), the description
  list spaces on the scale (`space-y-md`, the same 8px), and the inline-citation popover takes
  `raised-3` from the elevation engine instead of a raw `shadow` beside a hand-drawn border — so it
  matches the real Popover panel and follows `designTokens.elevation`.
- **Breaking: `ResponsiveProps<T>` is record-only.** The third form,
  `(breakpoint: Breakpoint) => T`, is gone: the type is now `T | Partial<Record<Breakpoint, T>>`.
  A record is declarative and inspectable, and the five steps it produces cannot disagree the way a
  function reading outside state could. Every call site that passed a function moved to the
  equivalent record with identical output — `Toaster`'s `collapseHorizontalAxis` default is
  `{ xs: false, sm: true, md: false }`, `MenuFloating`'s `submenuPosition` is
  `{ xs: 'bottom-start', md: 'right-start' }`, and `Dialog`'s documented responsive `type` is
  `{ xs: 'drawerBottom', md: 'modal' }`. A function passed to a `ResponsiveProps` prop is now
  returned unchanged as the value instead of being invoked. `resolveResponsive`,
  `responsiveVariables` and `ThemeState.resolveResponsiveProps` keep their signatures; only the
  accepted shape narrowed.

- **Breaking: focus rings are `ring-focus/50`; selection is the selected family.** Every focus ring
  in the library moved from `ring-color/50` (and the handful that hard-pinned `ring-primary/50` or
  `ring-current/50`) to `ring-focus/50` — including the ones written behind a composed variant,
  where the ring is on the box and the focus lands on a range input inside it
  (`has-[input:focus-visible]:` in AudioPlayer's waveform and scrubber and in VoiceInput's
  waveform, `group-focus-visible:` on the Slider thumb and the Map marker). Every persistent
  selection surface — selected DataTable row, active Sidebar row and activity-bar item, active
  MenuOption, Tabbar and SegmentedControl indicator, current page in Pagination, checked Switch /
  Checkbox / Radio and the checked Checkbox / Radio _card_, toggled AudioPlayer control, selected
  GanttChart row, the Calendar's selected day / selected range / selected picker option, the
  selected option in TimeInput and PhoneInput, MenuBar's open trigger, DocumentViewer's current
  page thumbnail and sheet tab, and AIAskUserQuestion's current step — moved from `bg-color` /
  `bg-color-muted` (or a hard-pinned `bg-primary` / `bg-neutral-muted`) to the `bg-selected*`
  family, with its text moving to
  `text-selected-contrast` / `text-selected-muted-readable`. The justified resting selection rings
  are re-keyed to `ring-selected/NN`. It is breaking for any theme override or test that matches
  the old class strings. Chrome that was never role-coloured is deliberately left alone: the
  VideoPlayer's `ring-white/60` and `bg-white/20` over video, Sidebar's neutral `outline` active
  variant, MiniCalendar's per-role selected day (the caller picks that colour with `color`, so a
  pinned `selectedColor` must not overrule it), EventCalendar's "today" marker and Timeline's
  per-node marker dot.
- **What this looks like with no theme override.** A surface that was on the _current_ role does
  not move: `ring-color/50` -> `ring-focus/50` and `bg-color-muted` -> `bg-selected-muted` resolve
  to `var(--color-focus, var(--color))` and `var(--color-selected-muted, var(--color-muted))`, so
  with nothing pinned they compute exactly what they computed before. A surface that was
  _hard-pinned_ to a role does move, because it now falls back to the current role instead of the
  one it named: the ~43 `focus-visible:ring-primary/50` / `focus-within:ring-primary/50` /
  `ring-primary/40` rings (Card's clickable variant, Accordion's trigger, AIThread's scroll region
  and the rest) ring neutral on a neutral component, DataTable's keyboard-focused cell
  (`bg-primary-muted/20 ring-primary/70` -> `bg-selected-muted/20 ring-selected/70`) marks in
  neutral, and the Calendar day, TimeInput / PhoneInput option, MenuBar trigger, DocumentViewer
  thumbnail and sheet tab and AIAskUserQuestion step listed above lose their pinned blue. That is the point of the move — those
  surfaces were the drift — and `designTokens.focusColor` / `selectedColor` is how an app gets a
  colour back, on all of them at once.
- `tooling/check-semantic-theme-tokens.mjs` enforces the state roles. The focus-ring rule now
  requires `ring-focus/50` and reports `ring-color/50` as "focus rings use the focus state role
  (ring-focus/50)" (`ring-danger/50` for error states is still allowed); it reads the ring behind
  _any_ focus variant, composed ones included (`has-[input:focus-visible]:`,
  `group-focus-visible:`, `peer-focus:`), not just a bare `focus*:` prefix. The selected-fill rule
  requires the `bg-selected*` family on `selected` / `active` / `pressed` / `checked` / `current`
  selection and reports `bg-color` / `bg-color-muted` / a hard-pinned role there as "persistent
  selection uses the selected state role (selectedSoft / selectedSolid)"; it reads both spellings
  of a selection — the Tailwind variant prefix (`data-active:bg-…`) off the class string, and the
  cva variant key (`active: { true: '…' }`, `compoundVariants: [{ checked: true, class: '…' }]`)
  and the theme part named for the state it paints (`thumbnailActive`) off the AST, which is how
  nearly every component in the library writes it. Deliberate exceptions
  carry a justification and are rot-checked like every other exception map. Both rules have cases
  in `tooling/component-contract/verify-checks.mjs`.
- **Carousel** — the default chrome moved out from over the slides into a footer row beneath them:
  a progress line fills the leading side, the prev/next pair sits at the trailing end, and nothing
  overlays the slides any more. The root is a vertical stack (slider, then footer) and the footer
  clears the slider's `--space-xl` block margin, so the bleed that keeps a slide's ring and shadow
  from being cropped is untouched. The progress line is the new default pagination: a recessed
  track whose fill is `CarouselState.progress` — the fraction of the scrollable range already
  scrolled, so it follows a free drag as closely as it follows `next()` — reported as
  `role="progressbar"` with `aria-valuenow/min/max` and an i18n accessible name
  (`carouselProgress`, added to all eight locales). It is a readout, not a control: not focusable,
  not clickable. **Breaking.** `dots` is replaced by
  `pagination?: false | Snippet | { variant?: 'line' | 'dots'; color?; size? }`, default
  `{ variant: 'line' }` — pass `pagination={{ variant: 'dots' }}` for the old dots, which keep
  their aria-current behaviour but now sit in the footer slot (their `position` theme variant is
  gone). `navigationButton` keeps its shape, defaults to the built-in buttons
  (`{ color: 'neutral' }`) and accepts `false`; the buttons lost their `direction` variant and
  their absolute positioning, gained a focus ring, and are sized from the geometry scale. With
  `pagination={false}` and `navigationButton={false}` no footer is rendered at all; with
  `pagination={false}` alone the prev/next pair stays at the trailing end, because the `navigation`
  part carries `ms-auto` rather than relying on the footer's `justify-between` having two children.
  The scrollable range behind `progress` is re-measured whenever slides are added or removed, not
  only on resize and scroll, so a growing `items` array cannot leave the line reading a stale
  fraction. New theme parts: `footer`, `progress`, `progressFill`, `navigation`.

- **VideoPlayer** — lays itself out against its own width: the root is a container and every
  breakpoint is a container query, replacing viewport `md:`/`lg:` queries. The compact controls now
  take over below `@md` (28rem / 448px of _player_ width) — the width at which the full control row
  stops fitting — and the roomy padding/gap step moved to `@xl` (36rem). **Breaking.** A player in
  a 448–768px column keeps the full control row where it previously dropped to the phone-sized
  compact chrome. The compact layout, previously CSS in the docs app only, now ships in the theme
  as `compactTransport`, `compactSettings` and `secondaryControls` parts, and the floating compact
  transport yields while a no-source, error or loading panel occupies the centre.
- **Every host-sized component now lays itself out by container query, never by viewport media
  query.** A component that fills its host sizes to the width it was actually handed, so the same
  card, table or player reflows identically in a page, a split pane, a drawer and a sidebar. Only
  app chrome whose host _is_ the viewport (Sidebar, AppShell, PageShell) and overlays that size to
  their own content keep device breakpoints. The converted roots each carry a comment mapping the
  old viewport breakpoint to the container width that replaced it.
- **`ResponsiveProps<T>` is one shape behind two resolvers.** A responsive prop accepts a plain
  value or a partial per-breakpoint record (`{ sm: 2, lg: 4 }`). The nearest **defined** key at or
  below the active breakpoint wins, and below the narrowest key the component's own default applies.
  An object is read as a breakpoint record only when every one of its keys is a breakpoint name, so
  `{ in, out }` transitions and Grid's `{ minWidth, max, repeat }` track configuration still pass
  through as values. `Breakpoint` stays `xs | sm | md | lg | xl`. The existing **viewport** resolver
  (`theme.resolveResponsiveProps`, behind Dialog `type`/`size`/`scroll`, Popover `position`/`size`,
  Toast `position`/`collapseHorizontalAxis` and every `transition` prop) is unchanged in role and
  now understands the record form; it still steps at Tailwind's device widths (640/768/1024/1280px),
  which are **not** the container widths below. Host-sized layout components use a **container**
  resolver instead: the component evaluates the prop for all five breakpoints while rendering,
  writes them as custom properties on its layout element, and static `@min-[…]` container rules pick
  the one for the active width — so the first paint and the server render are already correct, with
  no measurement and no JavaScript.
- **One container breakpoint table** — `xs` base, `sm` 36rem, `md` 42rem, `lg` 56rem, `xl` 72rem —
  is exported from `entasis/theme` and shared by Grid, Stack and Carousel, so `sm` means the same box
  width in all three. Each step is the width at which one more ~17–18rem content column fits, gaps
  included; they are the four widths Carousel already shipped, so nothing moves visually. These
  breakpoints measure the component's own width, not the viewport's: `md` on a Grid in a sidebar is
  not `md` on the page.
- **Grid / GridSpan** — **Breaking.** `columns`, `gap`, `rowGap` and `columnGap` on `Grid` and
  `columns` / `rows` on `GridSpan` resolve against the grid's own width
  (`columns={{ xs: 1, sm: 2, lg: 4 }}`). `columnGap` and `rowGap` now fall back to `gap` per
  breakpoint rather than per prop: `gap="sm" columnGap={{ lg: 'xl' }}` keeps `sm` on both axes until
  the grid reaches 56rem. A `GridSpan` has no width of its own, so its breakpoints are those of the
  `Grid` it sits in — a responsive span steps at the same widths as the tracks it spans, and outside
  a Grid only the `xs` value applies. Grid renders a root plus the grid inside it, because a
  container query cannot style its own container: `class`, `style`, forwarded attributes, `ref` and
  the sizing props stay on the root, while the grid itself is the new `tracks` theme part — which is
  also where the `gap` / `rowGap` / `columnGap` theme variants went, the gap now being a custom
  property. The root is a query container, so it fills its host's inline size (it no longer shrinks
  to fit as a flex item) and is a containing block for `position: fixed` descendants.
  `GridSpanColumns` (`number | 'full'`) is exported from `entasis/grid`.
- **Stack** — **Breaking.** `orientation`, `gap`, `align`, `justify` and `wrap` resolve against the
  stack's own width (`orientation={{ md: 'horizontal' }}`), so a stack in a sidebar and the same
  stack full-bleed reflow differently on one page. Stack renders a container root plus a layout
  child: the root (`data-slot="stack"`) is the `as` element and keeps `class`, `style`, the size
  props, padding and `scrollable`, while the flex line moved to `data-slot="stack-layout"`, themed
  through the new `inner` slot — a consumer overriding the flex axis targets `inner`, not `root`.
  The root is now `w-full` and an inline-size container, so a Stack used as a content-sized flex
  item fills its host instead of shrinking to its children. The `direction`, `mainAlign`,
  `crossAlign`, `gap` and `wrap` variants are gone from the `root` recipe — those axes are custom
  properties now — and Stack no longer emits `data-orientation` / `data-wrap`, because a responsive
  stack has a different orientation at different widths. `as` no longer accepts `'ul'`, `'ol'` or
  `'li'`: the root always contains exactly one layout `<div>`, and the content model of `ul`/`ol`
  admits only `li`, `script` and `template`, so `<Stack as="ul">` emitted invalid markup. Write the
  list element yourself and put a stack inside an `<li>` when a row needs a flex line.
- **Carousel** — the root is a named container (`@container/carousel`) and slides-per-view comes
  from `@container carousel (width >= 36rem/42rem/56rem/72rem)` for `sm`/`md`/`lg`/`xl`. The active
  breakpoint is resolved from a `ResizeObserver` on the track instead of `window.innerWidth`, so
  `CarouselState.breakpoint`, `resolvedLayout`, `resolvedGaps` and the dot grouping all follow the
  carousel. The track no longer clamps itself to `100vw`.
  **Breaking.** The `xs`/`sm`/`md`/`lg`/`xl` keys on `layout`, `gaps` and `partialDelta` keep their
  names but now mean "the carousel is at least this wide": a 360px carousel on a wide page is `xs`.
  The root recipe gains `w-full min-w-0` — inline-size containment removes intrinsic width, so a
  `root` theme override must keep `@container/carousel` and a width that fills the host or the
  carousel measures zero.
- **Form / Field / Ask** — a Field with `labelPosition="left"` switches to its two-column
  label/control grid once the _field_ is 32rem wide; form group `columns` switch at 42rem (2),
  56rem (3) and 72rem (4) of form width, stepping through 2 columns on the way up instead of
  jumping straight to 3 or 4; the `Ask` dialog's footer (`Form/Ask`) makes its own wrapper the
  container and puts Cancel/Confirm on a single line at 24rem of _footer_ width. A form in a narrow drawer or split pane stacks correctly on any screen size.
  **Breaking.** A horizontal form rendered narrow inside a wide viewport now stacks its labels
  where it previously placed them to the left, and the action row of a horizontal Form shares the
  field label grid instead of switching to a flex row, so its label column matches the other field
  labels and a long action description wraps one line earlier.
- **AudioPlayer** — the root is a container: the block layout moves the transport row beside the
  title at `@lg` (32rem of player width) instead of the `md` viewport breakpoint, and the inline
  layout becomes a row at `@md` (28rem) instead of `sm`. A narrow AudioPlayer on a wide screen gets
  the stacked compact chrome. VideoPlayer lost three redundant `max-[360px]:hidden` classes: the
  picture-in-picture and download buttons, plus the timecode readout, all sit inside blocks that
  are already hidden below `@md` of player width.
- **DocumentViewer** — the root is a container: the thumbnail sidebar leaves the flow and floats
  over the page as a drawer below 42rem (672px) _of the viewer_, so a viewer in a split pane,
  drawer or dialog gets the compact layout it actually needs.
- **DataTable** — the root is a container: the toolbar search field pins to 16rem at 28rem (448px)
  of table width and spans the toolbar row below that. The column header menu panel is portaled out
  of the table and sizes to its content, so it takes its width from the mode the Popover already
  chose (`theme.isMobile`, < 768px) instead of a CSS breakpoint — which also closes a 640–768px gap
  where the panel was a bottom sheet wearing a floating panel's width.
- **Command** — the root is a container: item shortcuts appear at 24rem (384px) of palette width,
  so a narrow mention popover hides them and a wide `⌘K` dialog shows them regardless of window
  size.
- **Breadcrumbs** — **Breaking.** The item gap no longer widens at the `sm` viewport breakpoint.
  The trail is inline-sized (a flex item in `PageShellHeader`), so it cannot be a query container;
  the gap is `gap-sm` at every width and desktop breadcrumbs sit ~10px tighter. Override
  `breadcrumbs.root` to restore a wider gap.
- **Carousel** — **Breaking.** `layout`, `gaps` and `partialDelta` take the shared
  `ResponsiveProps<number>`: a plain number or a per-breakpoint record. The Carousel-private
  `ResponsiveProperty` type and its required `default` key are gone — `{ default: 1, md: 2, xl: 3 }`
  is now `{ xs: 1, md: 2, xl: 3 }`, and a value that applied at every width is just that value
  (`gaps={16}`). Keys cascade to the nearest smaller defined key, matching the `min-width` container
  queries they feed, so that example holds at 2 between 56rem and 72rem where it previously fell
  back to `default` and showed **fewer** slides than a 42rem carousel. The `CarouselBreakpoint` type
  is removed and `CarouselState.breakpoint` is the shared `Breakpoint`; the widths now come from the
  shared `containerBreakpoints` table instead of a Carousel-private copy of the same four numbers,
  so no carousel changes its slide count. The layout custom properties are namespaced —
  `--layout-*`, `--gap-*`, `--partial-delta-*` and `--snap-align` are now `--carousel-layout-*`,
  `--carousel-gap-*`, `--carousel-partial-delta-*` and `--carousel-snap-align`.
- **Confirmation** — the footer reads `useTheme().isMobile` instead of its own
  `new MediaQuery('(max-width: 768px)')`. Same threshold, one source: the stacked footer and the
  full-width action buttons now switch with the value the Dialog itself used to pick
  sheet-versus-floating, as `DataTable`'s column header menu already did.
- Docs: `/docs/consistency` rule 8 pins its two demo hosts to `18rem` and `34rem` and scrolls the
  pair instead of laying them out in a `md:` grid. The grid collapsed both hosts to one width on a
  narrow screen, so the page teaching "never lay out by viewport" used to render two identical
  Fields under captions describing two different ones.
- Tooling: `check:semantic-theme-tokens` now rejects viewport breakpoint variants (`sm:`, `md:`,
  `max-lg:`, `max-[360px]:`) in `*.theme.ts` files, in component markup, in plain helper `.ts`
  modules under a component folder, and in `.mcp.ts` snippets, pointing at the container-query
  equivalent on an `@container` root. The helper-module and snippet sweeps close the two holes the
  rule had: a class list assembled in JS reached the DOM unchecked, and an agent-facing snippet
  teaching `md:grid-cols-3` re-seeded the drift the engine exists to remove (`RadioInput` and
  `CheckboxesInput` had four such snippets; they now show the `@container` root + `@md:` grid
  pattern). Detection is AST-based over string literals, so the `md:` a root recipe's comment
  quotes to record what it replaced is prose, not a class. Detection is segment-based, so bracketed
  selectors and arbitrary values containing a colon are never mistaken for a variant and `@`-prefixed
  container variants are excluded. App chrome (Sidebar, AppShell, PageShell), the DateSelector panel
  inside its content-sized Popover, and the docs-only DesignSystem page are listed by path prefix in
  `viewportExceptions`, each with a justification and an unused-entry rot check.
- **Command** — the highlighted row paints the shared soft selected recipe (`bg-color-muted`,
  `text-color-muted-readable`) instead of a solid current-role fill with important overrides.
- **Elevation tokens** — `elevationVariables()` also emits `--elevation-bleed-x` and
  `--elevation-bleed-y`: how far the scale's largest shadow reaches sideways and downwards (`0px`
  on `flat`). Scroll and clip containers pay them as a bleed allowance.
- **Card** — `elevation: 1 | 2 | 3 | 4 | 5` (default 1) chooses the `lift` step a `solid` card casts;
  a clickable card rises one step on hover. Other variants cast no shadow, as before.
- **Carousel** — the slider bleeds on both axes by at least `--space-sm` and as far as the
  elevation scale's largest shadow (negative margin paid back by padding and matching scroll
  padding, so slides stay aligned with the host and the visible block padding stays `--space-xl`),
  and the root no longer clips, so slides' rings and elevation shadows are never cropped at the
  scroller's edge. Programmatic scrolling aims at the snap position. The bleed zone no longer takes
  pointer input: the track is `pointer-events: none` and the slides take it back, so a press, drag
  or wheel that starts on a slide still reaches the scroller by bubbling, while the invisible
  padding above and below the slides — up to 34px of a scroll container lying over whatever the host
  drew there — stops swallowing the clicks meant for a tab bar above it or the carousel's own
  footer below it. The track also keeps its stretch width instead of an inline `width: 100%`, so the
  negative margins GROW its border box past the host by the bleed rather than shifting it: the slide
  clip edge now lines up with the footer's trailing arrow and the host's own edge (they were two
  bleeds apart). The breakpoint is measured on the root, the element that carries
  `@container/carousel`, so the JS and CSS slides-per-view still flip on the same pixel.
- **Stepper / Tabs** — the panel track is one viewport wide at rest, with only the shown panel
  laid out, and widens to `steps × 100%` only for a slide, so nothing overflows the root, nothing
  is clipped at rest (rings and elevation shadows of content flush with the edge render in full)
  and the page never scrolls to hidden panels; the root clips only while a transition runs. The
  outgoing panel stays laid out until the slide settles and fades out again, and an incoming panel
  fades in through `@starting-style`.
- **PageShell** — the header row wraps: when the actions do not fit beside the title they drop
  under it, instead of the title being truncated to an ellipsis.
- Focus rings are one value everywhere: `ring-2 ring-color/50`, the **current** role, so neutral
  chrome rings neutral, a coloured control rings in its colour, and `<Theme defaultColor>` moves all
  of them together. The 32 `ring-neutral/50` and 27 `ring-primary/50` sites were converted; only
  `ring-danger/50` (input error states) is still allowed. Enforced by the focus-ring role rule in
  `tooling/check-semantic-theme-tokens.mjs`, which rejects a `focus*:ring-<role>/50` naming any
  other role.
- Shadows come from the elevation engine only. Bordered surfaces use `raised-N`, borderless ones
  (thumbs, indicators, pills, drag previews, OSD panels, tooltips) use the new shadow-only `lift-N`;
  the 41 raw `shadow-sm…2xl` in 27 theme files were mapped `sm→1, md→3, lg→4, xl→5, 2xl→5`, and the
  now-redundant `border border-neutral-muted` next to a converted `raised-N` was dropped since
  `raised-N` draws that hairline itself. This is what makes `designTokens.elevation: 'flat'`
  actually flatten the library. Enforced by the raw-shadow rule in the checker.
- Sizes come from tokens: interactive controls use `h-control-sm/md/lg`, list and table rows the new
  `h-row-sm/md/lg` / `min-h-row-*` (32/40/48 px density), icons `size-icon-xs/sm/md/lg/xl` (new `xs`
  = 12 px, `xl` = 24 px). The 22 files that hard-coded `h-8/9/10/11/12` as size variants and the 10
  that pinned `[&_svg]:size-N` now track the tokens. Enforced by the height and icon-size rules in
  the checker, whose `geometryExceptions` map is the only hatch (thumbs, tracks, grips, waveform
  canvases — each entry carries a justification and is rot-checked for staleness).
- Muted text has two steps and only two: `text-<role>/70` for secondary and running text
  (placeholders included) and `text-<role>/45` for decorative ink (idle icons, handles, star bases).
  The 66 uses spread across `/40…/90` collapsed onto them — `/60…/80` → `/70` (neutral at 60 % sits at 4.5:1 on a plain surface and fails AA on any tinted one; 70 % clears 6:1 on both), `/85` and `/90` drop
  the opacity for full colour, `/40`–`/55` → `/70` for text and `/45` for decoration. Enforced by
  the muted-text rule in the checker.
- Hover feedback on an interactive surface is `state-layer`. The ad-hoc `hover:bg-*` fills in
  GanttChart (`row`, `expander`), Resizable and PhoneInput were converted or removed, and
  reveal-on-hover affordances (the DataTable resize grip, the Resizable handle) are now an
  already-coloured element revealed with `hover:opacity-100` instead of a background that appears.
  Enforced by the hover-fill rule in the checker, with a `hoverExceptions` map for the rare case.
- Selected state has one soft recipe, `selectedSoft` (`bg-color-muted text-color-muted-readable`),
  exported from `src/lib/components/Theme/theme.recipes.ts` alongside the solid `selectedSolid`
  (`bg-color text-color-contrast`) that "current page" pills keep. The four coexisting recipes were
  folded into it: Sidebar's active menu button, sub button and activity-bar item (their text is now
  `color-muted-readable`, not `color`), the Table and DataTable selected rows (previously
  `bg-neutral-muted` and `bg-primary-muted/40`), the Tree selected background and foreground CSS
  overrides (now `var(--color-muted)` / `var(--color-muted-readable)`), and ToggleButton's checked
  compounds. Chip and TagGroup gained a real `selected: true` variant on the recipe; Pagination
  keeps `selectedSolid`. A selected or active variant may no longer name a fixed role, which the
  checker's selected-fill rule enforces.
- The neutral `outline` variant is `border-neutral-muted` on ToggleButton, Chip and Pagination too
  (a compound variant mirroring `button.theme.ts`), Kbd's border moved from `border-neutral/20` to
  `border-neutral-muted`, and every placeholder is `placeholder:text-neutral/70`, so outline chrome
  and placeholder text read the same across the library.
- TagGroup's chip variants follow the selected recipe: `selectedVariant` defaults to `'soft'`
  (the fill itself comes from `selectedSoft` on the item class) and `unselectedVariant` to
  `'outline'`, so a selected tag stays distinct from an unselected one at the neutral role. It was
  `'solid'` / `'soft'`.

- Mermaid fullscreen is a `fullScreen` Dialog hosting a second instance of the diagram instead
  of a hand-rolled fixed overlay, so it sits in the layer stack with the focus trap, scroll lock
  and Escape handling every other overlay has. The panzoom utility lost its `expand` /
  `toggleExpand` / `expanded` API and `expandTarget` option; it gained `touchPan`, which Mermaid
  exposes as a prop (off inline so the page still scrolls, on inside the dialog).
- `label` is the only prop that names a component: every `ariaLabel` is renamed to `label`
  (Button, ToggleButton, ToggleButtonGroup, ToggleMenu, SelectionMenu, SegmentedControl,
  Pagination, ScrollArea, Chart, QRCode, TableOfContents, AudioPlayer, VideoPlayer,
  CalendarPrimitive, Sidebar `activityBar`, `AIContextLabels`), and the components that already
  painted a visible `label` drop theirs (CalendarInput, Checkbox, Select, Switch) so the visible
  label is also the accessible name -- Checkbox `mode="control"`, which paints none, speaks its
  string `label` as `aria-label`. `SegmentedControlItem.label` is one `Slot` that is both painted
  and spoken, and `VoiceInput.ariaLabel` becomes `startLabel` beside its `stopLabel`/`playLabel`
  siblings. Pagination `getItemAriaLabel` / `PaginationItemAriaLabel` become `getItemLabel` / `PaginationItemLabel`.
- Every callback taking a single object names that parameter `payload` (was `detail`, `snapshot`,
  `info`, `change`, `proposal`, `context`, or a component noun like `window`/`dialog`/`toast`);
  plain-value callbacks keep their name. Types: `AIAskUserQuestionSubmitDetail` ->
  `AIAskUserQuestionSubmitPayload`, `AIComposerSubmitDetail` -> `AIComposerSubmitPayload`,
  `ConfirmationDetail` -> `ConfirmationPayload`, and `AIConversationSubmitDetail`/
  `AIConversationRetryDetail` -> `AIConversationSubmitOptions`/`AIConversationRetryOptions`
  (those `...Payload` names already belong to the callback payloads).
- Selection callbacks use exactly two names: `onSelect` for the event of picking one item and
  `onSelectionChange` for a selection-model state change (always paired with a controlled
  `selection` prop and its `defaultSelection`). `AISuggestions`/`AIThread`/`AIChat`
  `onSuggestionSelect`, `EventCalendar.onSlotSelect`, GanttChart `events.onEmptyRangeSelect`,
  `TabItem.onMenuSelect` and `DateInput.onCalendarSelect` are all `onSelect`;
  `SelectionMenu.onSelectionChange` is `onSelect` (the document owns the selection); Diff's
  `selectedLines`/`onSelectedLinesChange` are `selection`/`defaultSelection`/`onSelectionChange`;
  EventCalendar and GanttChart gained `defaultSelection`; AIComposer's `onCommandSelect`/
  `onMentionSelect`/`onSkillSelect` are `onCommandInsert`/`onMentionInsert`/`onSkillInsert`.
- Boolean props are bare adjectives or `show*` chrome: `isStreaming` is `streaming` (AIChat,
  AIConversation, AIReasoning, AIThread, and `AIConversationState.streaming`),
  `RatingInput.allowHalf` is `halfSteps`, `TagsInput.allowCustom` is `customTags`,
  `Resizable.withHandle` is `handle`, `Stack.isScrollable` is `scrollable`,
  `SidebarMenuButton.isMobile` is `mobile`, and Theme's `enableSystem` / `enableColorScheme` /
  `disableTransitionOnChange` are `systemTheme` / `syncColorScheme` / `transitionOnChange` (the
  last inverted, defaulting to `true`, so the behaviour is unchanged). The public API contract
  check now rejects `is`/`enable`/`disable`/`allow`/`with`/`has`/`can`/`no`-prefixed boolean props.
- DataTable now runs on `@tanstack/table-core` 9. Features are registered explicitly and every row
  model stage is a `create*RowModel()` slot on that feature set; the column-def `sortingFn` slot is
  now `sortFn`, custom aggregations are `constructAggregationFn` definitions asked for the group's
  full leaf descent, and the library's logical `start`/`end` column pinning is translated back to
  DataTable's `columnPinning.left`/`.right` at the table boundary. `aggregated` in the cell payload
  keeps its previous meaning rather than v9's narrower `cell.getIsAggregated()`. No public prop or
  documented DataTable behaviour changed.
- Chart now renders on `@tanstack/charts` 0.18. Facet cells compile to a chart _spec_ only: the
  host options (`focus`, `focusRing`, `keyboard`, `pointer`, `svgAnimation`, `controls`, `tooltip`)
  live on the outer definition, which 0.18 requires and which already owned focus and tooltips for
  facet points. The chart surface is now sized from the plot host's content box, so padding or a
  border on the `plot` theme slot shrinks the scene instead of being drawn over. No public prop or
  documented Chart behaviour changed.
- Dependencies updated to latest across the board (Svelte 5.57, SvelteKit 2.70, Vite 8.3,
  Vitest 5, jsdom 30, Lexical 0.50, file-selector 5, `@pierre/diffs` 1.4, Playwright 1.63,
  ESLint 10.10, Prettier 3.9.6). One stays pinned on purpose: TypeScript 6 (svelte-check and
  typescript-eslint do not run on the TypeScript 7 Go compiler yet). `svelte-streamdown` 4
  drops Shiki for `@tanstack/highlight`, the same engine entasis's Code already uses, so Markdown
  no longer carries a second highlighter or a loading skeleton for code fences (the removed
  `code.skeleton` theme key went with it).
- Removed the `AIMcpApp` component, the `entasis/ai-mcp-app` and `entasis/ai-mcp-app/sandbox`
  subpath exports, and with them the `@modelcontextprotocol/sdk` and `@modelcontextprotocol/ext-apps`
  dependencies. `AIThread` and `AIChat` no longer accept `mcpHost` or the `app` renderer snippet, and
  MCP App tool calls render as ordinary grouped tool rows.
- EventCalendar and GanttChart undo/redo share one internal `useUndoStack` utility (past/future
  stacks, the entry limit, trimming and the revision signal behind `canUndo`/`canRedo`). Restoring a
  snapshot and judging whether an entry is still replayable stay with each component, so
  GanttChart keeps its signature chain and EventCalendar its model-boundary check; behaviour,
  limits and the guarded revert are unchanged.
- The Dialog drawer swipe-to-dismiss runs on the shared `createPointerDrag` helper like every other
  drag in the library. The helper grew the options that gesture needs — `capture: 'on-activate'`
  (capture the pointer only once the drag is promoted, so a press on a button inside the drawer
  still clicks), `shouldActivate` (the consumer decides when a press becomes a drag),
  `onDown` and `preventTouchMove`. Existing consumers and the swipe itself behave exactly as
  before.
- AudioPlayer and VideoPlayer share one internal `MediaPlayerState` base (playback, seeking,
  volume, error reporting, media events, keyboard): each player keeps its own error wording through
  a media noun, and both now use one keyboard ignore rule — a shortcut is skipped when the key was
  typed inside an `input`, `textarea`, `select`, `button`, `a[href]` or contenteditable element
  (audio previously ignored every anchor; video previously missed keys inside nested markup). Their
  two icon buttons collapse into one internal `MediaIconButton`, and `MediaVolumeControl` renders
  the default trigger and mute buttons for both players via the new `buttonClass`/`buttonColor`
  props.
- Shared runtime helpers replace five copies of the same logic: `createId` (`$lib/utils/id`),
  `useOverflowObserver` (Tabbar, Timeline, Kanban, Diff), `useLiveAnnouncer` (EventCalendar,
  GanttChart), a generic `interactionResolution` ADT behind the calendar and Gantt re-exports, and
  `useBoundingClientRect` now composing `useResizeObserver`.
- `useRovingRegistry` (`$lib/utils/useRovingRegistry`) owns the roving-focus plumbing the
  EventCalendar repeated for day cells, time-grid targets and occurrence controls — the key → node
  registry, the pending key a departing node leaves behind, and the version-guarded restore — and
  its `clampRovingKey` picks the neighbour that inherits the GanttChart tab stop after a removal.
- One disabled look and one focus ring: every disabled control dims to `opacity-50` (was 50, 55
  or 60) and every focus ring is `ring-2` at 50% of its role colour (was five opacities);
  `check:semantic-theme-tokens` now fails on any other value.
- The eleven design-token presets from the docs playground ship as `themePresets` from
  `entasis/theme` (`themePresets.glass.tokens` drops straight into `<Theme designTokens>`).
- Code highlights with TanStack Highlight instead of Shiki: synchronous, no WebAssembly, every
  shipped language bundled by default (aliases still resolve, unknown ids render as plain text),
  tokens as `th-*` classes mapped to the same `--code-token-*` palette. Diff keeps its Shiki-based
  renderer (`@pierre/diffs`) and shares the palette through `Diff/diff.syntax-theme.ts`. `shiki` is
  no longer a direct dependency.
- `Density` no longer shares the `Sizes` vocabulary: every `density` prop, theme variant and
  `data-density` value is now `'compact' | 'normal' | 'comfortable'`, so a density value can never
  type-check against a size prop. A `densities` token list ships alongside `sizes` in
  `entasis/utils/tokens`.
- The toggle family speaks one dialect: `ToggleButtonGroup` takes `items` as an array of
  `{ value, ...ToggleButton props }` and its `value`/`defaultValue`/`onValueChange` are a `string[]`
  of pressed values (`type="multiple"`) or one `string` (`type="single"`); `ToggleMenu` (and
  `SelectionMenu`) moves its toolbar list from `value`/`defaultValue` to a bindable `items` with
  `onItemsChange`, and its `group`/`radio-group` units take the same array-plus-scalar shapes.
- `Tooltip` is a real component with the same `trigger` prop as every other overlay (a snippet handed
  the tooltip attachment, or Button props), plus `open`/`defaultOpen`/`onOpenChange` to show one
  without hovering; the shared singleton surface `<Theme>` mounts is now `TooltipHost`, and the
  `tooltip()` attachment stays as the primitive (its options type is `TooltipOptions`).
- `DataTable` takes `virtualize` (default `true`): `virtualize={false}` renders every row in normal
  document flow at its natural height, so the table no longer needs a `height` or a definite-height
  parent to be dropped into a page.
- A child component is configured through one nested object, never prefixed props: `Tabs` takes
  `tabbar={{ size, orientation, color, alignment, class, theme, fullWidth }}` in place of
  `tabbarSize` and friends, `HoverCard` takes `card={{ color, variant, theme }}` in place of
  `cardColor`/`cardVariant`/`cardTheme`, and the public-API contract check now rejects new
  `tabbar*`/`card*`/`menu*`/`dialog*`/`popover*` props in `*.props.ts`.
- The last flattened child props follow that same rule: `HoverCard`, `SelectionMenu` and
  `LinkPreview` take `popover={{ class, theme }}` in place of `popoverClass`/`popoverTheme`,
  `MediaVolumeControl` takes `popover={{ class, size }}` in place of `popoverClass`/`popoverSize`,
  and `LinkPreview` takes `card={{ class, color, variant, theme }}` in place of
  `cardClass`/`cardColor`/`cardVariant`/`cardTheme` (the redundant `LinkPreviewCardVariant` export
  is gone; use `CardVariant`).
- `Meter` takes a plain number like every other progress-like component: `value` is now
  `number | MeterStep | MeterStep[]`, and a new root `color` prop (default `primary`) colors a
  numeric value and backs any segment that declares no color of its own.
- Every component accepts arbitrary `data-*` attributes and forwards them to its root element:
  `WithAttachments` now carries a `data-${string}` index signature, and Tabs and Popover spread
  their rest props onto their roots.
- Separator `color` is typed `Colors` (the dead `| 'neutral'` arm is gone).
- The AI reasoning and suggestion components are prefixed like their siblings: `Reasoning`
  is now `AIReasoning`, `Suggestion`/`Suggestions` are now `AISuggestion`/`AISuggestions`,
  and their props types are `AIReasoningProps`, `AISuggestionProps`, `AISuggestionsProps`
  and `AISuggestionRenderPayload` (the duplicate alias props files are gone).
- Pagination props are flat: `totalPages`, `totalItems` and `pageSize` are all plain optional
  props instead of a `totalPages` XOR `totalItems`+`pageSize` discriminated union. The page count
  still derives from `totalItems`/`pageSize` when `totalPages` is omitted, and a component given
  neither form warns once in the console instead of failing to type-check.
- Palette: every generated text token now clears WCAG AA. `-readable` and `-muted-readable`
  are solved to 4.75:1 (headroom for browser colour rounding), `-muted` tints sit at a fixed
  perceptual lightness above the surface so every role's soft variant looks the same weight,
  and `-contrast` (solid text) picks white only when it reaches 4.5:1 on the base, black
  otherwise (amber). Default seeds moved to AA-capable values: primary `#5f62ef`, danger
  `#dc2626`, success `#15803d`, info `#2563eb` (warning stays `#f59e0b` with dark text).
- Spinner overlay is a frosted `bg-surface/85` veil with the label on a surface pill, so its
  text stays legible over any content; Stat labels use `text-current/75`; Calendar outside-month
  days use `text-neutral/65` instead of an opacity fade.

- Vocabulary: `Sizes` is the only size union (the responsive breakpoint union is `Breakpoint`,
  shared by every component); `variant="outline"` (was `outlined` on Accordion); Chip positions are
  kebab-case (`top-right`); `delay`/`closeDelay` everywhere (`hoverDelay` removed); one
  `DisclosureIndicator` union (`chevron` | `plus-minus` | `none`) for Accordion, Collapsible,
  AITool and Sidebar; `ariaLabel` everywhere an accessible name is meant (Button, AudioPlayer,
  VideoPlayer, FieldActionButton `label` → `ariaLabel`).
- Callbacks: Tabs and Stepper both emit `onValueChange({ value, item, index })`; Accordion
  `onToggle` → `onItemOpenChange`; Sidebar keeps `onWidthChange({ width, isUserInteraction })`
  only; Pagination uses `value`/`defaultValue`/`onValueChange`; Command `value` is now the
  selection and the query is `search`/`defaultSearch`/`onSearchChange`; `defaultValue` added
  wherever a bindable `value` existed without it.
- Instance handles are uniformly `bind:api` (Tabs, Stepper, DataTable, Tree, AIChat,
  AIConversation).
- Avatar takes `src`/`alt`/`name` and `loading` (was `user` and `loadingState`); HoverCard body is
  `children` only; Kanban snippets are `Slot`s.
- Toast `animation` → `transition`; Accordion `transitions` → `transition`; Stepper/Tabs
  `keyFramesOptions` removed in favour of the `motion` theme slot; ImageZoom `transitionDuration`
  removed likewise.
- Class merging runs on shadcn's `cn` engine (drop-in for `clsx` + `tailwind-merge`, about 2.5x
  faster on cold merges, identical output on 60k differential cases from our own class corpus)
  with every plugin utility family declared: `raised-*`, `h-control-*`, `size-icon-*`,
  `min-size-hit-*`, `ps-indent-*`, `h-window`/`w-window`, `scroll-fade*`, `shimmer*`,
  `duration-*`/`ease-*` and the semantic spacing scale. A test in `merge.test.ts` fails when the
  Tailwind plugin gains a utility family the merge config does not know.
- Dependencies: removed `add`, `pnpm`, `bits-ui`, `embla-carousel*`, `libphonenumber-js`,
  `type-fest`, `color2k`, `cnfast`; `zod` and `svelte-mcp` are dev-only.
- Sidebar and DataTable column resizing drag through the shared `createPointerDrag` helper
  instead of hand-rolled window listeners, so both capture the pointer and always release it.
- DocumentViewer: the legacy and OOXML surfaces share one `createDocumentSurfaceViewport` helper
  for fit-on-resize, reading-position tracking and scroll-to-page instead of duplicating the
  frame scheduling, ResizeObserver and cancel-on-user-input teardown in each surface.

- Chart sizing is one prop: `height` (px) or `aspectRatio` (width / height), never both — passing
  both throws. Either one sizes the live plot **and** the server-rendered SVG, so `initialDimensions`
  is removed and a height class no longer has to be kept in sync with an SSR dimension by hand. With
  neither, the 320 px default moved from an inline style onto the root theme, so a consumer's own
  height class now wins through tailwind-merge.
- Stat renders the regions listed in `order` (`'label' | 'value' | 'indicator' | 'separator' |
'trend' | 'description'`), in that order, and a region left out of the list is left out of the DOM.
  `showSeparator` is removed: the hairline appears when `'separator'` is in `order`, which is also
  the only way to move it. The default (`statDefaultOrder`, exported) is today's order without the
  separator, so unchanged call sites render identically.
- Stat's `indicator` is decorative again. `StatIndicatorVariant` lost `'action'`, and with it the
  `onclick`, `indicatorLabel`, `indicatorType` and `indicatorDisabled` props — a clickable affordance
  is the new `action` slot instead of an overloaded indicator.

- **Breaking.** ARIA attributes are no longer public props anywhere in the library: components own
  accessibility, you describe the meaning and the component writes the attribute. `Button` lost
  `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-selected` and `aria-pressed` for
  `haspopup`, `expanded`, `selected` and `pressed`; `Chip` lost `aria-pressed` for `selected`, and
  `aria-disabled` is derived from `disabled`; `AISuggestion` expresses the pressed state only through
  `selected` and no longer forwards native `aria-*`; `PageShell` and the `Sidebar`/`AppShell` roots
  no longer accept `role` or `aria-label` / `aria-labelledby` / `aria-describedby`; `Tabbar` accepts
  no `aria-*` at all, taking `role="tablist"` and `aria-orientation` from its own `orientation`.
  `aria-controls` has no public prop at all — whichever surface owns the trigger (Popover, PopupMenu,
  Select, Combobox) wires it. The accessible name is always `label`.
- **Breaking.** `PopoverState.triggerAttrs` is now `PopoverState.triggerProps` and carries
  `{ haspopup, expanded, controls }` instead of ARIA attribute keys; `MediaVolumeControl`'s trigger
  snippet payload renames `ariaHaspopup` / `ariaExpanded` to `haspopup` / `expanded`, so the payload
  spreads straight onto a Button.
- **Breaking.** The `Sidebar` `header` snippet now renders first in the header region, above
  `headerButton`, `search` and `headerMenu`, so a custom workspace card sits on top without an order
  override. Header regions previously rendered `headerButton` → `search` → `headerMenu` → `header`.
- **Breaking.** `Sidebar` `headerButton` / `footerButton` `onclick` and
  `SidebarMenuActionDescriptor.onclick` now receive the `SidebarApi` as a second argument:
  `onclick(event, api)`, so a trailing or group action can call `api.toggle()`. Handlers typed with
  an explicit one-parameter signature must widen.
- `SidebarGroup.action` also accepts an array of descriptors, and a descriptor takes `size?: Sizes`.
  Group actions render as a row of icon-only ghost buttons sized from the Sidebar `size` by default,
  so a `+` lands at row scale instead of group-label scale.
- `AppShell` renders one extra `data-slot="app-shell-frame"` element between its root and the
  `Sidebar`. It is `display: contents` for every variant but `framed`, so existing layouts are
  byte-identical.
- Type ramp (seventh consistency axis): a `size` variant is a box axis, not a typeface axis. Every
  theme file now walks one of six ramps — `text-xs/sm/sm` for interactive controls (a large button,
  input, chip, tab, menu option, pagination item, toggle, select trigger, kbd or badge grows its
  `h-control-lg` and its padding and keeps `text-sm`), `text-xs/sm/base` for content parts (Card,
  Alert, Toast, Empty, Timeline, Stat label, table cells, descriptions), `text-xl/2xl/3xl` for a
  display value such as the Stat figure, plus each ramp's one-step-down form for the secondary line
  inside a part, floored at `text-xs`. Arbitrary type sizes (`text-[11px]`, `text-[0.6875rem]`,
  `text-[0.625rem]`, `text-[0.9375rem]`, …) are gone from every theme file.
- Visible consequences of the type ramp: Card, Overlay, MetadataList, AudioPlayer and LinkPreview
  titles, Markdown body, SortableList rows, PinInput cells, MiniCalendar day numbers and Timeline
  titles render one step smaller at `normal` and `large`; Chip, Tabbar, Kbd caps and the Sidebar
  badge and avatar render one step larger at `normal`; secondary lines (Card / MetadataList /
  LinkPreview / AudioPlayer descriptions, Stat trend and description, Toast description) now sit
  exactly one step under their part instead of matching it.
- Inactive `Stepper` / `Tabs` panels are now `inert` and `aria-hidden`, and `hidden` as soon as the
  slide settles, so at rest only the selected panel reaches the text and accessibility layers. The
  panel the track slides away from stays laid out for the length of the slide — `hidden` is
  `display:none`, and a panel dropped on the same tick as the value change could neither slide nor
  fade out and reported `clientHeight` 0 while the root was still animating to the new height. A
  `lazy` panel is therefore destroyed once that slide finishes rather than on the value change.
  Panels take an explicit grid column and the step track's offsets are derived from the viewport
  width, so the slide survives the hidden siblings.
- Resting hairline rings moved from `ring-neutral/10` and `ring-neutral/15` to the library's
  `ring-neutral-muted` border token in `Card`, `AITool`, `FloatingWindow` and `Kanban`. The clickable
  solid `Card` drops its hover ring and keeps `hover:lift-2`.
- Every raw `shadow-*` in component markup and in the MCP snippets moved to the elevation engine
  (`raised-N` for bordered surfaces, `lift-N` for borderless ones).
- **Breaking.** `MeterProps` and `MeterStep` no longer constrain their metadata parameters to
  `Record<string, any>` and now default to `unknown` (`MeterProps<T = unknown, S = unknown>`,
  `MeterStep<T = unknown>`); the component uses the Svelte 5 `generics` attribute instead of
  `$$Generic`.
- **Breaking.** `SegmentedControl`'s component generics are now `Value extends string` and
  `Items extends readonly SegmentedControlItem<Value>[]` instead of a single `const Items`, and
  `Breadcrumbs`' `Items` generic drops its `const` modifier. Inferred literal unions and custom
  item-snippet shapes are unchanged, and neither props type changed. The `const` type-parameter
  modifier cannot be used in a `<script generics>` attribute at all: `svelte-eslint-parser` fails to
  parse it, and a parse error cannot be suppressed. `Theme`'s `themes` generic got the same
  treatment, keeping literal inference through a `ThemeName extends string` parameter.
- **Breaking.** `Heading`'s `children` is typed `Snippet` instead of `any`; `useDebounce` is generic
  over `unknown[]`; `ClassDictionary` is `Record<string, unknown>`; `VariantProps` and
  `ComponentVariant` are constrained to `(...args: never[]) => unknown`; and the `CVA` interface no
  longer carries its phantom guard type parameter.
- `tooling/check-semantic-theme-tokens.mjs` gained three rules. `ring-<role>/NN` is a focus ring and
  nothing else — a resting hairline uses `ring-neutral-muted`, or `ring-color-muted` when the chrome
  follows the current role. The raw-shadow rule now also reads component markup and `*.mcp.ts`
  snippets, and covers `drop-shadow-*`. And the type ramp is read off the `size` (and Sidebar's
  `componentSize`) variant block, rejecting any triple outside the six, rejecting a ramp only some of
  the three sizes name, and banning `text-[<length>]`. All three carry justified exception maps with
  the same unused-entry rot check as the geometry map.
- The tasks-dashboard template's chart row is built from `Grid` plus `GridSpan` instead of raw grid
  classes.
- Internal: state classes across the library (`ChartState`, `ChartViewportState`, `CommandState`,
  `ImageGalleryState`, `MermaidState`, `PDFViewerState`, `PaginationState`, `ScrollArea`,
  `ImageZoomState`, `RichTextInputState`, `Toaster`, `ThemeState`, `CarouselState`, `PopoverState`,
  `DocumentViewerState`, `ResizableState`, `TableOfContentsState`, `FloatingWindowState`,
  `SidebarResizeState`) no longer merge with an empty same-named interface to expose their bound
  options; they extend a typed bindable base instead. Instance types and members are unchanged.
  `$lib/utils/state.svelte.js` gained `withOptions()` for that purpose.
- Internal: `ThemeState.eventListeners` is typed `SvelteMap<Events, SvelteSet<ThemeEventListener>>`
  and `ThemeState.resolveTransitionProps` takes `ResponsiveProps<FSOProps>` instead of
  `ResponsiveProps<any>`. `useHoverAction`, `usePointerDown`, `useDrag`, `usePanzoom`, `useSafeArea`
  and `LayerHandle` use `SvelteMap` / `SvelteSet`, and the scroll-lock registry is a `WeakMap` that
  no longer retains detached scrollers.
- Internal: Map marker `label`, `popup` and `tooltip` HTML strings render through a single shared
  `MapHtmlText` component.
- `Table` rows and header/footer cells are keyed, so cell DOM is reused per column key instead of by
  position.
- `RichTextInput` toolbar items, link-form draft and suggestion popover state moved to writable
  `$derived`, removing three synchronising effects (one render pass fewer per change).
- **Breaking: sixteen runtime dependencies are now optional peer dependencies.** `lexical` and the
  seven `@lexical/*` packages (`RichTextInput`, and the `AIComposer` / `AIChat` that embed it),
  `@tanstack/charts` with `d3-array`, `d3-force`, `d3-hierarchy`, `d3-sankey`, `d3-scale` and
  `d3-shape` (`Chart`), and `cobe` (`Globe`). Each is declared
  optional at a caret range, so an app that never imports those three components installs nothing
  extra; an app that does installs the row printed in the README, on the component's docs page and
  in its MCP description. A production-only install of entasis's `dependencies` goes from 38 direct /
  178 total packages to 21 direct / 149 total. `@tanstack/highlight` and `@tanstack/svelte-virtual`
  stay runtime dependencies on purpose: `Markdown` renders `Code` and `AIChat` / `AIConversation`
  render `AIThread`, so making them optional would break the library's most-used components out of
  the box, and `svelte-streamdown` depends on `@tanstack/highlight` anyway.
- **Breaking: the theme plugin throws on an option it does not know**, naming the closest known key
  (`unknown option "prefersdark" (did you mean "prefersDark"?)`) instead of ignoring it. Keys are
  case-sensitive, and a mis-cased one used to be dropped in silence. The skill doc's full-options
  example carries a `<!-- prettier-ignore -->`, because Prettier lowercases property names inside a
  `css` fence and had quietly turned its `prefersDark` and `typeScale` into dead keys.
- **Breaking: `useTheme()` throws when no `<Theme>` is above the component** —
  `entasis: <Theme> was not found above this component.` — instead of returning `undefined` and
  failing later at whichever call site dereferenced it first. Every component requires a `<Theme>`
  ancestor.
- Component docs pages and MCP descriptions for `Chart`, `Globe`, `RichTextInput`, `DataTable`,
  `AIComposer` and `AIChat` carry a "Requires" section with the exact install command. The README
  and the getting-started page also describe what a missing peer looks like: Vite substitutes a stub
  module, so the build fails with `[MISSING_EXPORT] … "__vite-optional-peer-dep:<package>:entasis"`
  rather than one unresolved-import error.
- The README documents all twelve `<Theme designTokens>` keys, the full `ThemeOptions` plugin table
  including the five build-time `EngineOptions` scales, and which of build time or runtime wins; it
  and the getting-started page gained the optional-peers table. The entasis agent skill no longer claims there are no radius, spacing or typography
  options on the plugin.
- `*.test-helper.*` files are excluded from the published package alongside `*.test.*` / `*.spec.*`.
- New `check:readme-tokens` (wired into `npm run check` and the contracts workflow) fails when a
  `ThemeDesignTokens`, `ThemeOptions` or `EngineOptions` key has no row in the README tables.
- The soft selected fill is now a translucent tint instead of an opaque colour.
  `bg-selected-muted` composites `var(--color-selected, var(--color))` at the new
  `--state-selected-opacity` (0.07 light, 0.10 dark, settable per theme block as
  `state-selected-opacity`), so a selected row, menu option, tag or pressed toggle reads
  identically on `surface`, `surface-raised` and `surface-floating`. In dark mode the fill used
  to be darker than the floating panel it sat on — an open submenu's trigger was invisible.
  `bg-selected` and the non-state `bg-color-muted` family are unchanged.
- **Breaking: `designTokens.selectedColor` no longer emits `--color-selected-muted`.** The soft
  fill is derived from `--color-selected`, so an app overriding `--color-selected-muted` by hand
  should drop it; the fill and ink still follow `selectedColor` through `--color-selected` and
  `--color-selected-muted-readable`.
- A submenu opens in a panel of the same size as the `PopupMenu` that hosts it (PopupMenu
  publishes its panel `size` through context and the nested PopupMenu reads it), so the parent
  menu and its submenus share one panel padding and one concentric radius.
- Menu forwards `size`, `density` and `color` to its submenus. A `size="small"` menu no longer
  opens a normal-sized submenu beside itself, and `MenuBar`'s `size` now reaches the menu each
  trigger drops. `Menu` gained `size` and `color` props and reflects all three axes on its root
  as `data-size` / `data-density` / `data-color`.
- Menu, select and combobox rows, and segmented-control segments, now cap their corner against the
  container instead of repeating a fixed one. `MenuOption` takes `rounded-md-concentric`: it keeps
  the `md` control step, capped by the radius and padding the `Popover` panel publishes at each of
  its three sizes, so a row can never cut across the panel's corner at any radius preset — inside
  a `rounded-lg p-md` panel it is `min(8px, 12 − 8)` = 4px. A `SegmentedControl` segment and its
  sliding indicator used to carry the track's own `rounded-md` outright, so the segment's corner
  cut across the track's; both now take `rounded-md-concentric` (8px track, `p-xs` →
  `min(8px, 8 − 4)` = 4px segment). `Markdown`'s citation item takes `rounded-sm-concentric`
  inside the `rounded-lg p-md` popover (`min(4px, 12 − 8)` = 4px); `AITool`'s section scroll area
  and `DocumentViewer`'s page thumbnail sit in boxes whose padding exceeds their radius
  (`rounded-sm p-md` → `min(4px, 4 − 8)`, `rounded-sm p-sm` → `min(4px, 4 − 6)`), so both clamp to
  0 and render square, which is the concentric answer. Nothing changes at the default radius preset
  except the segmented control.

### Removed

- The declared half of the concentric radius: the 30 `nest-radius-{sm|md|lg|xl|2xl}-{micro|xs|sm|md|lg|xl}`
  utilities, the `--radius-nested` property they published, the merge group that resolved them, and
  the `tooling/check-semantic-theme-tokens.mjs` rule that required a padded rounded container to
  carry one (with its `nestedRadiusExceptions` map). The container side is now emitted by
  `rounded-<step>` and `p` / `px` / `py` themselves, so there is nothing to declare, nothing to
  keep in sync with the radius and padding beside it, and no pair for a checker to police. Nothing
  shipped with the declared form, so there is no migration.
- The stepless child utility `rounded-nested` (with `rounded-t-nested` / `rounded-b-nested`), which
  took the container's radius minus its padding outright and fell back to `--radius-md` outside
  one. `rounded-<step>-concentric` replaces it and there is no alias, because the child should stay
  on the radius ramp rather than be pulled off it by whatever container it lands in. It was never
  published, so it is simply gone and there is no migration.
- `TagGroupThemeProps['item']` no longer has a `selected` variant; the selected fill is `Chip`'s
  `selected` prop.
- `Dialog/Test.svelte`, an unused scratch harness nothing imported.
- `AGENT.md`, which documented a library called "uy" with a `background` / `foreground` palette the
  engine does not emit. Nothing in the repository referenced it.

### Fixed

- The carousel's shadow bleed is capped, per side, at the room between the carousel and the
  viewport edge, measured from the layout position so a carousel mounted inside a tab panel that is
  still sliding in reads its resting room. A carousel flush with a phone screen's edge widened the
  page by the bleed and made it pan sideways.

- A drawer grabbed again within a frame of a release that did not dismiss it no longer has its drag
  offset zeroed by the deferred snap-back, which made a fast second swipe fail to dismiss.

- Responsive props fell back to the component default on any falsy value, not just a missing one,
  so `<Toast collapseHorizontalAxis={false} />` was silently `true` and `<Carousel gaps={0} />`
  rendered the 20px default gap. A responsive prop now falls back only when it is `undefined` or
  `null`; `false`, `0` and `''` are honoured.
- Sidebar search: the input's left padding did not account for the absolutely positioned magnifier,
  so at `size="large"` the placeholder started on the icon's last pixel. The padding now scales with
  the size (`layout-md` / `layout-lg` / `layout-xl`) and clears the icon at every size and density.
- Popover `fitTrigger` (Select, Combobox, TagsInput, menus): the panel was pinned to exactly the
  trigger's width, so a narrow trigger made its options wrap and scroll sideways. The trigger width
  is now a floor and the panel grows to fit its content up to the `size` cap.
- Sidebar group actions (`+`, menus) sat off the label's midline whenever `--spacing` was not the
  default: the group padded with spacing tokens (`p-md`) while `--sidebar-group-padding`, which
  positions the action, was a literal `0.5rem`, and the action's `top` was a hard-coded offset. The
  padding variables now resolve to the same `--space-*` tokens and the action centres on the row's
  control-height token with a half-box translate.
- Geometry tokens follow a scoped `--spacing`: control heights, row heights, icon sizes, hit areas
  and indents are multiples of `--spacing` declared on `html`, so a theme block or template root that
  overrode `--spacing` left them pinned to the html value. `spacingVariable()` now re-declares them
  alongside `--spacing`, so `designTokens.spacing` scales every control, row and icon together.
- MenuOption: at `size="large"` the option text jumped to `text-base` while the Select trigger,
  inputs and buttons stay at `text-sm` (large grows the box, not the type), so an open Select read
  two sizes at once. Options now follow the control ramp (`xs / sm / sm`) and their descriptions
  stay one step below.
- Select: the trigger had no hover state while the outline buttons beside it tinted, so a toolbar
  row hovered inconsistently. The trigger now carries the same `state-layer` hover and pressed
  tint as Button (typed inputs that share its container shape stay untinted on purpose).
- Button: a neutral `outline` button now draws the same `neutral-muted` hairline as inputs and
  selects, so toolbar rows read as one set of controls instead of one black-bordered button among
  grey ones. Coloured outline buttons keep their role-coloured border.
- Sidebar `inset` variant: an edge reveal of the hidden panel kept the column's 0.5rem vertical
  margin, so the peek floated short of the top and bottom edges over the page. A revealed panel now
  runs the full height and is raised like the overlay it is; the resting column is unchanged.
- Checkbox marks were invisible: the thumb asked for `fill-color-contrast` / `stroke-color-contrast`,
  utilities the engine never emits, so the check icon inherited `currentColor` and painted white on
  the white checked thumb in dark mode (black on black in light). The thumb now sets
  `text-color-contrast`, which the `currentColor` icon picks up. The unchecked thumb also dropped its
  stray `bg-neutral`, which showed through as a pale square on disabled rows, and Checkbox, Radio and
  Switch dim a disabled control once instead of stacking three `opacity-50` layers. The engine now
  also emits `fill-color-*` and `stroke-color-*`, completing the current-role colour family.
- Mermaid: diagrams only re-rendered on a light/dark flip, so a palette swap or a runtime
  token edit left the old colours baked into the SVG. Map and Mermaid now share one
  `observeThemeTokens` watcher (root theme attributes plus `<head>` styles) and re-derive only
  when the resolved colours actually differ.
- Map: the tokenized basemap barely reacted to token changes. Every cartographic colour was
  found by a contrast search that stopped at the first near-background step, so a palette swap
  moved one water line by a few RGB points and most land roles collapsed onto the surface
  colour. Roles are now fixed-weight mixes of `surface` with one semantic token (`primary`
  tints land, buildings and water like a monochrome basemap, `success` paints parks and points
  of interest, `danger` draws boundaries, `neutral` carries roads and labels), so palette,
  theme and runtime token edits recolour the map the moment they land.
- Tailwind plugin: the engine handed `addBase` a bare `border-color` declaration, which the CSS
  parser recovered from by discarding the rule that followed it -- the `html[data-theme="dark"]`
  palette. Dark mode set the attribute but kept the light colors. A compile test now asserts
  every theme palette lands under its own selector and no rule-level declaration is emitted.
- DataTable: selecting a row while a cell was focused could throw `effect_update_depth_exceeded`
  and drop the selection, because focus reconciliation re-published an identical focused cell on
  every table-state sync. Identical cells are no longer written.
- Overlays could stop opening after many dialogs unmounted at once (the docs Examples tab
  reproduced it): the shared layer stack kept its handles in a deep `$state` array whose length
  drifted from its entries, so every later `open` read `undefined`. The stack is now a raw array
  replaced immutably on register and remove.
- The three `bg-gradient-to-*` overlays use the Tailwind v4 spelling `bg-linear-to-*`, so a later
  background colour no longer erases the gradient in the merge step.
- Toast and Confirmation ids came from `Math.random().toString(36).substring(7)`, which returns a
  very short or empty string whenever the random mantissa is short — colliding ids silently
  dismissed or replaced the wrong toast. All id generation now goes through `createId`, which uses
  `crypto.randomUUID()` where available and never yields fewer than 8 characters.
- DocumentViewer: an OOXML document whose units report a zero natural width no longer divides by
  zero while fitting, which pinned the zoom to `maxScale`.
- DataTable column resizing never took pointer capture, so a drag was dropped (leaving the handle
  stuck in its resizing state) as soon as the pointer left the document, and its window listeners
  leaked when the header unmounted mid-drag.
- RichTextInput / AIComposer no longer steal focus or scroll the page when seeded with a value
  while unfocused (mount, external `value` change): the load runs with Lexical's
  `skip-dom-selection` tag unless the editor already has focus.
- Dialog: `aria-describedby`, initial focus, focus restore, page `inert`, correct Escape gating;
  Escape no longer closes two sibling popovers at once.
- Switch had no accessible name with its inline label; DateInput no longer opens its calendar on
  focus (click, ArrowDown or the button); reduced motion is honoured by every transition.
- README and skill docs describe the real Tailwind plugin paths, tokens and override shapes.

- `DocumentViewer`: the thumbnail sidebar renders in its correct open/closed state on first paint
  instead of flipping after hydration, and a worker that fails to start rethrows with the original
  error attached as `cause`.
- `DocumentViewer`, `Carousel`, `Confirmation`, `Spinner` and `AvatarGroup` render their lists keyed,
  so items keep their DOM nodes (and any focus or transition state) when the list changes.
- `AudioPlayer`'s `ref` and `rootRef` bindings, `Avatar`'s `loading`, `Globe`'s `scrollTo` handle and
  `RichTextInput` / `VideoPlayer`'s `ref` no longer write back to the parent when the value has not
  changed.
- `NetworkIndicator` binds `ref` straight to the root element instead of mirroring it from an
  internal reference in an effect, so it is populated a tick earlier.
- The package-consumer check resolved every bare import through the repository's own
  `node_modules`, because its fixture was created inside the repository — it could not fail the way
  a consumer's install fails. The fixture now lives outside the repository with only what a consumer
  installs, and, since `skipLibCheck` hides unresolved imports inside `dist/**/*.d.ts`, the check
  additionally reads every emitted module and asserts each bare specifier is declared in
  `dependencies` or `peerDependencies`.
- `tooling/check-semantic-theme-tokens.mjs` rejected the engine's child radius as an unsupported
  utility. It now accepts `rounded-<step>-concentric`, `rounded-t-<step>-concentric` and
  `rounded-b-<step>-concentric` — and only those, so a per-corner spelling or a missing step stays
  a caught typo rather than a class that compiles to nothing.
- `tooling/check-semantic-theme-tokens.mjs` read a theme only when it was an object literal, so
  every class string inside an exported `*Theme` **factory** was invisible to it. The sweep now
  reaches an exported arrow-function theme as well — which caught, in one file, a raw `shadow`, an
  off-scale `text-primary-readable/80` and a numeric `space-y-2`, none of which any rule had ever
  seen.
- README's plugin-option table was missing `state-selected-opacity`, so `npm run check:readme-tokens`
  — wired into `npm run check` and the contracts workflow — was red.
- Toast's duration progress bar hard-coded `rounded-b-lg` while the toast is `rounded-md` at
  `size="small"` and `rounded-none` as a banner, so its clipped corners disagreed with the toast in
  two of six configurations. The bar now takes the root's own radius per size, and squares off with
  the banner. It is the root's radius and not `rounded-b-<step>-concentric`: the bar is pinned to
  the border box, not inside the padding box, so there is no gap to subtract, while the concentric
  form would cap against the root's `px-*`/`py-*` anyway.
- `MenuBar` spread its own `size` before each menu's props, so a `MenuBarMenu` written or spread
  with an explicit `size: undefined` overwrote it and the dropped menu fell back to
  `MenuFloating`'s own `normal` default instead of inheriting the bar. The per-menu size is now
  read as `menu.size ?? size`, which is what "a per-menu size wins" was meant to say.
- The comment justifying `--state-selected-opacity`'s defaults gave a wrong worked example for dark
  mode: the engine re-lightens the surface seed to oklab L 0.18, so the base is `#111113`, not the
  authored `#09090b`, and the tint lands on `#28282a` — 11/255 from the `#1f1f1f` it claimed to
  reproduce within ~2/255. Both composites are now measured and stated, along with the fact that the
  light default does reproduce the tint it replaces and the dark one deliberately does not.

## 0.3.0

Initial tracked release.
