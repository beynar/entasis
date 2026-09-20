# Tasks dashboard template: design-system stress-test findings

The template at `/templates/tasks-dashboard` is built from entasis components, their props, the layout
primitives and one root token block, and nothing else (`tooling/check-template-purity.mjs` enforces it).
Everywhere the library could not express the reference, the template uses the closest thing the
library can do and the gap is recorded here. Each entry is a candidate change to the library.

Findings: 48 across 17 components — 21 resolved (Chart 7, Sidebar 5, Stat 4, AppShell 2, Tabs 2, Grid 1), 27 open.
Recorded 2026-09-14.

## GanttChart (14)

- **Gap.** Task-bar height is a hard-coded size metric (TASK_METRICS 16/20/24px in ganttChart.layout.ts, mirrored by `--gantt-task-height`) and is completely independent of `layout.rowHeight`. With rowHeight 64 and size="large" the rows are 64px tall but every bar is exactly 24px, so the reference's card-like bar carrying a title, a Chip, a percentage and a Meter cannot be produced — and because the bar is overflow:visible, anything taller spills onto neighbouring rows instead of clipping.
  **Suggestion.** Add `layout.taskHeight` (a number, `'fill'`, or a 0-1 fraction of rowHeight) alongside `layout.rowHeight` so bar geometry follows the row the consumer asked for.

- **Gap.** `render.task` replaces the whole bar body, including the built-in progress fill. A bar can have the library's progress painting OR custom content, never both, unless the consumer re-renders `defaultContent` and absolutely positions their own content over it — exactly the hand-positioning templates are supposed to avoid.
  **Suggestion.** Either layer `render.task` over the default progress fill instead of replacing it, or add a separate `render.taskContent` slot composited on top of whatever `progress` / `segments` already drew.

- **Gap.** `render.task` content is rendered inside the bar's `<button>` element (GanttTaskBar.svelte trigger). Any realistic bar body — a `Stack` (div), a `Meter` (divs + spring-animated divs), an interactive `Chip` — is invalid HTML inside a button, and an interactive Chip would also be a nested interactive control.
  **Suggestion.** Render the bar as a div with an inner button-role hit area (or expose `render.task` on a non-button wrapper) so composed library content is legal; failing that, document the phrasing-content-only contract on the `task` renderer.

- **Gap.** The task label and the resource-assignment avatars are always rendered in a wrapper positioned OUTSIDE the bar (`taskLabelLeft = endX + 6`), and only `render.header` accepts `false` to switch a part off. Putting the duration text and avatars at/inside the end of the bar meant moving the duration into `render.task` and passing `render.taskLabel` an intentionally empty snippet — done twice, in both panels.
  **Suggestion.** Add `timeline.labelPlacement: 'outside' | 'inside' | 'none'` (and the same for resource assignments), and accept `false` on the optional decoration renderers (`taskLabel`, `taskTooltip`, `dragPreview`) the way `header` already does.

- **Gap.** The resource-assignment avatars are not vertically centred on their own row: in the My Tasks hour schedule each AvatarGroup sits roughly half a row above the centre line of the bar it belongs to (visible for all three rows in overview-mytasks.png), so a bar and its assignees read as belonging to different rows.
  **Suggestion.** Centre the resource-assignment wrapper on the row's own centre line (the same baseline the bar uses) rather than on the label band.

- **Gap.** `GanttHeaderPayload` exposes `today`, `fitProject`, `zoomIn`, `zoomOut`, `zoomControl` and `actions`, but nothing for stepping the visible window. The reference's month previous/next had to be hand-built from `api.getVisibleRange()` + `api.scrollToDate()` with manual month arithmetic, and the month title re-derived by formatting the midpoint of `visibleRange`.
  **Suggestion.** Add `previous` / `next` snippets to the header payload and an `api.panBy({ value, unit })`, plus a `rangeTitle` / period label in the payload, so period navigation is the chart's own behaviour.

- **Gap.** `render.header` is all-or-nothing (`Snippet | false`). Embedding the chart in a `Card` whose header already owns the range control (the My Tasks panel) means dropping the zoom/today controls entirely — they cannot be mounted elsewhere.
  **Suggestion.** Expose the header controls as standalone snippets/API off the chart instance so a host header can render `today` / `zoomControl` without keeping the built-in bar.

- **Gap.** The built-in `zoomControl` snippet renders a visible "Zoom level" field label stacked above its select. Dropped into a custom `render.header` row next to Today and Filter buttons it is visibly taller than its siblings and pushes the header off its baseline (see tab-timeline.png).
  **Suggestion.** Make the zoom control's label visually hidden by default (or add `zoomControl.hideLabel`) so it composes with plain buttons in a custom header.

- **Gap.** There is no prop for hiding rows. Implementing the "Filter" control meant passing a `$derived` subset to `tasks`, which forfeits `bind:tasks`; drag/resize edits then had to be merged back into the full collection by id through `mutations.task.onTasksChange`.
  **Suggestion.** Add `filter` / `visibleTaskIds` (or a predicate on `layout`) that hides rows without changing the bound source collection, so filtering and two-way binding can coexist.

- **Gap.** At `day` zoom the default snap granularity is 15 minutes (BUILT_IN_SNAP_DURATIONS.day), so dragging a bar on a day-scale plan produces starts like "Sep 2, 2026, 2:00" instead of landing on a day boundary. Verified by drag: the bar moved to a non-midnight start until `timeline.snapDuration` was set to 1 day.
  **Suggestion.** Default `snapDuration` to the active scale's own unit/step (1 day at day zoom, 1 hour at hour zoom) and keep the explicit prop as an override.

- **Gap.** `GanttTimeHeaderPayload` / `GanttScaleCell` carry only `{ start, end, index, zoom, timeZone, locale }` — no `isToday` / `isWeekend` / `isNonWorking` flags. The reference's black rounded-square badge on today's day header cannot be produced from the payload without the consumer recomputing "today" in its own time zone.
  **Suggestion.** Add `isToday`, `isWeekend` and `isNonWorking` to the time-header payload, and a `today` variant on the `timeHeaderLower` theme part.

- **Gap.** The visible range does not follow a changed `tasks` array. Switching the Today/Tomorrow/Upcoming control moved the tasks to the next day and every bar vanished off-screen; the My Tasks panel only works because `schedule.validRange` is recomputed to clamp the viewport — a framing device being used as a mutation boundary.
  **Suggestion.** Re-frame (or expose `timeline.followTasks` / an auto `fitProject`) when the task collection moves entirely outside the current visible range.

- **Gap.** Contained scrolling needs an explicit height on the chart root and there is no 'fit rows' mode, so a three-row schedule leaves guessed-at dead space below the last row (`class="h-64"` in the My Tasks card), and the Timeline panel had to fall back to `scrollMode: 'page'` because the only non-arbitrary height class (`h-full`) would need a sized ancestor the tab panel does not provide.
  **Suggestion.** Add `layout.scrollMode: 'auto'` that sizes the root to header + rows when the content is shorter than the viewport, so neither a magic height class nor page mode is needed.

- **Gap.** `timeZone` is a required prop with no default, so every consumer that just wants "the user's calendar" has to write `Intl.DateTimeFormat().resolvedOptions().timeZone` themselves — an expression that is SSR/CSR sensitive.
  **Suggestion.** Default `timeZone` to the resolved local zone, with the explicit prop as the override, so a simple day plan does not need time-zone plumbing.

## Chart (7, all resolved)

- **Gap.** A stacked bar mark requires long-format rows (`series` / `colorBy` channel). `monthlyStatus` is wide (one row per month with three numeric columns) and had to be melted by hand into 36 rows before it could be stacked.
  **Suggestion.** Accept an array of value fields on the bar mark — `y: ['completed', 'inProgress', 'pending']` — and melt internally, deriving the series keys from the field names.
  **Resolved** by `y: readonly NumericField[]` on the `variant: 'stack'` bar mark (and on a `layout: { type: 'stack' }` area series): the template passes `monthlyStatus` straight through and the 36-row `flatMap` is gone.

- **Gap.** Series colours are assigned by `palette` index in series-discovery order, so the mapping in-progress→primary / completed→secondary / pending→info silently depends on the order rows happen to appear in `data`. There is no key→colour map.
  **Suggestion.** Allow `palette` to be a record (`{ Completed: 'secondary', InProgress: 'primary', Pending: 'info' }`) alongside the ordered array.
  **Resolved** by `palette` accepting `Readonly<Record<string, ChartColor>>`: the template names `{ completed: 'secondary', inProgress: 'primary', pending: 'info' }` and the mapping no longer depends on discovery order.

- **Gap.** Legend entries take the raw series key as their text. The reference label is `In progress`, but a two-word key wraps the legend chip onto two lines and there is no per-entry label/format hook, so the data key had to be renamed to `InProgress` — visible in the screenshot as the run-together legend label.
  **Suggestion.** Add `legend.format?: (key) => string` (or a per-entry `labels` map) so display text is independent of the series key.
  **Resolved** by `legend.format?: (key: ChartKey) => string`, which also feeds the tooltip series label and widens the legend entry to fit: the key stays `inProgress` and the chip reads `In progress` on one line.

- **Gap.** Stacked bar segments are drawn flush. The reference separates them with a small gap; `inset` exists on the bar mark but insets the whole band, not the segments within a stack.
  **Suggestion.** Add `gap` (pixels) to the `variant: 'stack'` bar mark, applied between consecutive segments.
  **Resolved** by `gap?: number` on the `variant: 'stack'` bar mark; the template uses `gap: 3`. Only the painted rectangle shrinks, so stack totals and tooltip values are untouched.

- **Gap.** `tooltip` is hover-only — there is no controlled / `defaultValue` / `open` form, so the reference's permanently-pinned Friday readout on the weekly chart cannot be expressed with props.
  **Suggestion.** Make the tooltip controllable: `tooltip.value` / `tooltip.defaultValue` (a row key) plus `onValueChange`, so a datum can start pinned.
  **Resolved** by `tooltip.value` / `tooltip.defaultValue` / `tooltip.onValueChange`: the weekly chart pins Friday with `defaultValue: 'Fri'`, hover moves the readout and pointer leave restores the pin.

- **Gap.** There is no height prop. A chart needs BOTH a Tailwind height class on the root and `initialDimensions` for SSR — two values that must be kept in sync by hand (here `class="h-80"` + `{ height: 320 }`, twice).
  **Suggestion.** Accept `height` (and optional `aspectRatio`) and derive the SSR dimensions from it.
  **Resolved** by `height` and `aspectRatio` (mutually exclusive), which size the live plot and the prerendered SVG together; `initialDimensions` is gone and both charts pass `height={320}`.

- **Gap.** `ChartColor` resolves only the seven semantic roles; `surface` is not one of them, so a point marker that should be filled with the card background has to be written as `fill: 'var(--color-surface)'`.
  **Suggestion.** Let `ChartColor` accept the surface family (`surface`, `surface-raised`, `surface-recessed`) alongside the role colours.
  **Resolved** by `ChartColor` accepting `surface | surface-recessed | surface-canvas | surface-raised | surface-floating`: the weekly points are `fill: 'surface'`.

## Sidebar (5, all resolved)

- **Gap.** The header region renders in a fixed order: `headerButton` → `search` → `headerMenu` → `header` snippet. A custom workspace card (needed here because it carries its own collapse control) can therefore never sit above the built-in search.
  **Suggestion.** Either render the `header` snippet first, or expose named header slots / a `headerOrder` prop. The template has to put `-order-1` on its own header element, which only works because the header container happens to be `flex flex-col`.
  **Resolved** by reordering the header region in `SidebarPanel.svelte`: the `header` snippet now renders **first**, above `headerButton` → `search` → `headerMenu`. The template's `-order-1` workaround is gone.

- **Gap (Sidebar (headerButton)).** `SidebarMenuButtonItem` is the library's own workspace card (icon/avatar + title + subtitle + trailing), but `trailing` is decorative — there is no handler for it — and `onclick` does not receive the `SidebarApi`. A workspace row with a _separate_ collapse control cannot be built from `headerButton`; you must drop to the `header` snippet and rebuild the row by hand.
  **Suggestion.** Let `trailing` accept `{ icon, label, onclick }` (like `SidebarGroup.action`), and pass the `SidebarApi` to `headerButton.onclick` so `toggle()` is reachable without a custom snippet.
  **Resolved** by `trailing?: SidebarIcon | false | SidebarMenuActionDescriptor` on `SidebarMenuButtonItem`: a descriptor renders its own icon-only ghost button as a **sibling** of the row (a button cannot nest inside a button), and every handler on that path is now `onclick(event, api)` — `headerButton.onclick` and `SidebarMenuActionDescriptor.onclick` alike. The template's workspace card is a plain `headerButton` with `trailing: { icon: sidebarSimpleIcon, label: 'Collapse sidebar', onclick: (_event, api) => api.toggle() }`; the hand-built `header` snippet is gone.

- **Gap (Sidebar (active menu item)).** The active row renders as a soft filled row. The reference's active item is a bordered white card on the tinted well. `SidebarMenuEntry.variant` is `'default' | 'outline'` but that is the _resting_ style; there is no way to say "outline when active".
  **Suggestion.** Add an active-state axis to the sidebar theme (e.g. `activeVariant?: 'soft' | 'outline' | 'solid'` on the Sidebar or per entry) instead of forcing a descendant-selector override on `class`.
  **Resolved** by `activeVariant?: 'soft' | 'outline' | 'solid'` on the Sidebar (default `'soft'`). `soft` is the shared `selectedSoft` recipe, `solid` the `selectedSolid` one, and `outline` a bordered surface card (`bg-surface border border-neutral-muted text-neutral`). Each row carries the choice as `data-active-variant`, so the paint is a variant on the row's own class — no descendant selector anywhere. The template uses `activeVariant: 'outline'`.

- **Gap (Sidebar (SidebarGroup.action)).** A group takes exactly one `action`. The reference pins two affordances to each group header (a `+` and a drag handle). The descriptor also has no `size`, so the `+` renders at the group-label scale rather than the row scale.
  **Suggestion.** Accept `action: SidebarMenuActionDescriptor | SidebarMenuActionDescriptor[]` and add a `size` to the descriptor.
  **Resolved** by `SidebarGroup.action: Snippet | SidebarMenuActionDescriptor | SidebarMenuActionDescriptor[]` plus `size?: Sizes` on the descriptor. The group-action region is now a flex row of icon-only ghost buttons, each sized from its own descriptor and defaulting to the Sidebar `size` (so the `+` renders at row scale, `h-control-*`, not at the group-label scale). The template pins a `+` and a drag handle to Projects.

- **Gap (Sidebar (SidebarMenuEntry.icon)).** `SidebarIcon = Slot | string` renders the icon bare. A tinted rounded-square project mark (the reference's per-project colour chips) has to be a wrapper snippet the template writes itself, and there is no `iconColor` / `iconVariant` prop to get it from the role scale.
  **Suggestion.** Add `iconColor?: Colors` + `iconVariant?: 'bare' | 'tile'` to `SidebarMenuEntry` so coloured tiles come from the role tokens instead of ad-hoc markup.
  **Resolved** by `iconColor?: Colors` + `iconVariant?: 'bare' | 'tile'` on `SidebarMenuEntry`. `tile` paints a rounded square (`bg-color-muted text-color-muted-readable`, sized from the icon scale) whose tint is the row's own `data-color`; a row with neither prop keeps a bare glyph and never inherits the ambient role. The template's project rows are `iconVariant: 'tile'` + `iconColor: project.tint`, and its hand-made tile spans are gone.

## Stat (4, all resolved)

- **Gap.** Slot order is hard-wired in the component (label → value → indicator → separator → trend → description). The reference puts the description above the hairline and the trend row last; there is no prop or grid-area escape to reorder, and `showSeparator` can only ever sit between the value and the trend.
  **Suggestion.** Add an `order` / `layout` prop (e.g. `layout: 'value-first' | 'trend-last'`), or expose the grid areas as theme parts so `description` can be placed before `separator`.
  **Resolved** by `order?: readonly StatPart[]`, which is also the visibility switch (`showSeparator` is gone): the template passes `['label', 'value', 'description', 'separator', 'trend']`.

- **Gap.** `trend` is one slot with one tone. The reference paints a leading semantic icon (lightning / check / spinner / hourglass) in neutral and a trailing direction arrow in the trend colour; both had to be hand-composed inside the single slot, so the whole row takes the trend colour.
  **Suggestion.** Split into `trendIcon` (leading, neutral by default) + `trend` (text) and let the component append its own direction arrow from `trendDirection`.
  **Resolved** by a `trendIcon` slot rendered neutral plus a `trend` text slot; the component appends the arrow from `trendDirection`, so the template no longer imports `trendUpIcon` / `trendDownIcon`.

- **Gap.** No unit/suffix slot. The reference value is `147` with a smaller `task` unit; the only way to render it is `value="147 task"`, which makes the unit the same display size as the number.
  **Suggestion.** Add a `unit` slot rendered after `value` at a reduced size, or accept `value` as `{ amount, unit }`.
  **Resolved** by a `unit` slot baseline-aligned after `value` one type step down: `value={String(stat.value)} unit="task"`.

- **Gap.** The kebab action and a status badge compete for the same `indicator` slot — `indicatorVariant='action'` turns the one indicator into a button, so a card cannot show both a status icon and a menu affordance.
  **Suggestion.** Add a separate `action` slot (like `Card.action`) so `indicator` stays decorative.
  **Resolved** by an `action` slot with `onAction` / `actionLabel` / `actionDisabled`; `indicatorVariant` lost its `'action'` value and `indicator` is decorative again, so a card can carry a badge and a kebab at once.

## AppShell (2, all resolved)

- **Gap.** The `inset` and `split` page surfaces hard-code `md:shadow-sm` and `floating` hard-codes `--page-shell-chrome-shadow: 0 1px 2px …`. These read Tailwind's stock `--shadow-sm`, not the elevation engine, so `elevationVariables('flat', 'light')` in the template's token block cannot flatten them — a "no shadows anywhere" design has to override a component theme.
  **Suggestion.** Route those shadows through the elevation engine (`raised-0` / `var(--elevation-N)`) so a flat elevation scale actually flattens the shell.
  **Resolved** by the design-axis harmonisation pass: raw `shadow-*` is now banned in theme files by `tooling/check-semantic-theme-tokens.mjs`, AppShell's `inset`/`split` surfaces went to `md:raised-1` and `floating`'s `--page-shell-chrome-shadow` to `var(--elevation-1)`, so `elevationVariables('flat', …)` flattens the shell without a component theme override.

- **Gap.** No variant puts the sidebar _and_ the page inside one rounded white frame on the canvas. `admin` frames nothing, `inset`/`split` frame only the page, `floating` frames only the chrome bars. The reference is a single white app card with a large radius containing both.
  **Suggestion.** Add a `framed` treatment (or `variant: 'card'`) where AppShell's own root carries the radius/border and both children sit inside it.
  **Resolved** by `variant="framed"` on AppShell. The root paints the canvas (`bg-surface-canvas p-md`) and its single `data-slot="app-shell-frame"` child draws the card — `rounded-xl bg-surface raised-1`, so the border and the elevation both come from the elevation engine and a flat elevation scale flattens it. The sidebar and the page live inside that card; the sidebar keeps its recessed well (`bg-surface-canvas` with a hairline against the page). Every other variant renders the frame element as `contents`, so existing layouts are byte-identical. The template switched to it.

## Tabs (2, all resolved)

- **Gap.** `TabsProps['tabbar']` is `Pick<TabbarProps, 'size' | 'orientation' | 'color' | 'alignment' | 'class' | 'theme' | 'fullWidth'>` — `variant` is not forwarded. Tabbar's `underline` / `pill` variants are unreachable from `Tabs`; you only ever get the default.
  **Suggestion.** Add `variant` (and `scrollFade`) to the forwarded Pick.
  **Resolved.** `variant` and `scrollFade` joined the forwarded `Pick`, so every Tabbar look is reachable from `Tabs`.

- **Gap (Tabs / Stepper).** Every panel is mounted eagerly and stacked absolutely in one grid: verified `document.querySelectorAll('[role=tabpanel]').length === 5` on every tab, so the GanttChart and both Charts are live while the user is on Files. Worse for a11y, inactive panels carry no `hidden` attribute — `[role=tabpanel]:not([hidden])` returns the Overview panel's full text while Timeline is the selected tab, so all five panels are exposed to the text/accessibility layer at once.
  **Suggestion.** Add `mount?: 'eager' | 'lazy' | 'once'` so heavy panels are only created when first activated, and mark inactive panels `hidden` (or `inert`) regardless of the mount mode.
  **Resolved.** `Stepper` (and therefore `Tabs`, which renders it) takes `mount?: 'eager' | 'lazy' | 'once'`: a panel is created the first time it is activated and destroyed when it is left (`lazy`), kept after the first activation (`once`), or created up front (`eager`, the old behaviour). `Tabs` defaults to `lazy` because a tab panel is a whole screen; bare `Stepper` keeps `eager` so a wizard's earlier steps stay live. Inactive panels are `hidden` and `inert` in every mode, so `[role=tabpanel]:not([hidden])` now returns exactly the selected panel. Each panel takes an explicit grid column and the track's step offsets are derived from the viewport width, so the slide survives the hidden siblings.

## Avatar (2)

- **Gap.** `AvatarProps` is `{ src, alt, name, size, prefix, suffix }` — image or initials only. It cannot render an icon and has no shape axis, so the reference's black rounded-square logo mark cannot be an Avatar.
  **Suggestion.** Add `icon?: Slot` and `shape?: 'circle' | 'square'` so brand/workspace marks stop being hand-built spans.

- **Gap (Avatar / AvatarGroup).** Initials are derived from the first letter of every space-separated word in `name`; there is no `initials` prop. A two-letter code (`AL`) renders as a single `A` unless it is faked as the two words `A L`.
  **Suggestion.** Add an explicit `initials` prop that overrides the derivation (falling back to the current behaviour).

## Meter (2)

- **Gap.** `showIndicatorAs` is documented as "hidden when undefined" but defaults to `'percentage'`, so passing `undefined` re-applies the default and the floating label cannot be turned off by prop. The only prop-level escape is passing an empty `indicator` snippet, which still renders an empty positioned span.
  **Suggestion.** Accept `showIndicatorAs={false}` / `'none'`, or make the default genuinely `undefined` so the documented behaviour is reachable.

- **Gap.** The track reserves indicator space (`mt-xl` on the track) whenever any segment's position resolves to `'top'` — the default — even when no indicator is drawn. A compact bare progress bar is only possible by setting `position: 'bottom'` on the segment as a side effect, unrelated to what the consumer actually wants.
  **Suggestion.** Reserve the label margin only when an indicator is actually rendered, or add a `trackOnly` / `compact` prop that drops the header, indicator and reserved margin.

## PageShell (1)

- **Gap.** Header title/eyebrow/subtitle typography is hard-coded in the theme (title = `truncate text-sm leading-5 font-semibold`, eyebrow 11px uppercase). There is no `size` / `titleSize` / `density` axis, so a page cannot have a display-sized, light-weight title — the most characteristic thing about the reference header.
  **Suggestion.** Add a `size` (or `titleSize`) axis that scales `titleStack` / `title` / `eyebrow` / `subtitle` together (e.g. small | normal | large | display), the way Sidebar already has `size`. Today the only route is passing a snippet as `title` and restyling inside it, which leaves the h1's own `text-sm font-semibold truncate` on the wrapper.

## PageShellActions (1)

- **Gap.** The responsive overflow machinery (`actionOverflow`, `mobileActionCount`, the `…` PopupMenu) only runs for `PageShellAction[]`. The moment the header row needs a non-Button control — here a search `TextInput` and a status `Select` — you must pass a snippet and you lose all overflow behaviour.
  **Suggestion.** Let an action entry be `{ render: Snippet }` alongside the Button descriptors so mixed rows keep the collapse-to-menu behaviour; or expose the overflow container as a standalone component the snippet can wrap.

## SidebarSearch (1)

- **Gap.** `SidebarSearch` has only `placeholder`, `label`, `value`, `oninput`, `class`. It cannot render a trailing shortcut hint (the reference shows `⌘ F` inside the field) and the magnifier is hard-coded — no `prefix` / `suffix` slot. The page header's own `TextInput` right above it does support both, so the two search fields cannot be made to match.
  **Suggestion.** Give `SidebarSearch` `prefix` / `suffix` Slots (or at least `shortcut?: string | Slot`) so it can match `TextInput`.

## Tabbar (1)

- **Gap.** `fullWidth` conflates two things: the width of the _track_ (and therefore of the 1px underline baseline) and whether each tab stretches. The reference wants a full-width baseline with left-grouped, naturally-sized tabs; the library gives full-width baseline + stretched tabs, or hugging baseline + natural tabs.
  **Suggestion.** Split into `fullWidth` (track spans the container) and `stretchTabs` (tabs flex-1), defaulting `stretchTabs` to the current coupled behaviour.

## Empty (1)

- **Gap.** `Empty` sizes its media/type from `size`, but inside a full-height tab panel it does not stretch — the placeholder sits at the top of the panel rather than centred in it.
  **Suggestion.** Add a `fill` (or `align: 'start' | 'center'`) prop that makes Empty a full-height centred region, which is the common tab/route-level usage.

## Card (1)

- **Gap.** `title` is a plain slot with no `icon` / `count` / `eyebrow` props, so the reference's `[icon] Task Overview (250+)` had to be hand-composed as a flex span inside the snippet — which also means re-declaring the muted colour and weight of the count.
  **Suggestion.** Add `icon` and `titleSuffix` (or `count`) props so header composition stays inside the component and keeps the title's own typography.

## Grid (1, resolved)

- **Gap.** `GridSpan` is referenced in `grid.props.ts` but is not exported from the `entasis/grid` subpath, so the 2/3 + 1/3 chart row falls back to a raw `grid lg:grid-cols-3` + `lg:col-span-2`.
  **Suggestion.** Export `GridSpan` from the `entasis/grid` entry point (and document it) so asymmetric dashboard rows stay in the layout primitives.
  **Resolved.** `GridSpan` is exported from `entasis/grid` and carried by the contract manifest, and the chart row in `OverviewPanel.svelte` is now `<Grid columns={{ minWidth: 320, max: 3 }} gap="lg">` with a `<GridSpan columns={2}>` around the status chart — no raw grid classes left.

## SegmentedControl (1)

- **Gap.** Both variants (`normal`, `pill`) draw a track and an active indicator. The reference's Today / Tomorrow / Upcoming row is plain text with only a weight/colour change and no chrome; there is no `ghost` / `plain` variant.
  **Suggestion.** Add `variant: 'plain'` that keeps the radiogroup semantics and drops the track and indicator.

## Theme (2)

- **Gap.** `ThemeDesignTokens` has no font-family token. The template had to write `--font-sans` by hand in
  its token block, and a scoped `--font-sans` override only takes effect on elements that carry the
  `font-sans` utility, because the body resolved the variable once at its own level. Without
  `class="font-sans"` on the template root the whole page silently stayed on the docs font.
  **Suggestion.** Add `fontFamily` (sans/mono) to `ThemeDesignTokens` and have `compileThemeDesignTokens`
  emit it, so a font is a design token like radius or spacing and `<Theme designTokens>` re-applies it.

- **Gap.** The colour kit (`-light`, `-lighter`, `-dark`, `-muted`, `-contrast`, `-readable` companions) is
  derived at build time by the Tailwind plugin only. At runtime every consumer that wants a scoped palette
  (this template, the docs playground) re-implements the same `color-mix()` formulas, and they can drift.
  **Suggestion.** Export a runtime `colorRoleVariables(role, seed)` from `entasis/theme` that emits the same
  companions the plugin does, and let `designTokens` accept per-role colour seeds.

## Deviations in the template itself

- `ListsPanel.svelte` carries a second token fence: it re-opens the elevation scale (`elevationVariables('high', 'light')`) on the panel root so the list cards in its Carousel cast real shadows, since the dashboard runs flat. It is still tokens only, applied with `style={templateStyle}`, but it is a scoped exception to the one-root-token-block rule.

Places where plain markup stands in because no component fits, or a library default had to be accepted:

- Workspace logo mark is `headerButton.icon` (`flowerIconFill`) rather than an Avatar, because Avatar still renders image-or-initials only and has no icon or square shape axis (see the Avatar gap above).
- Project row tints are the role colours success / warning / info / danger rather than the reference's per-project hexes: `data.ts` carries `tint` as a role because hex is only legal inside the token fence. The tile itself is the library's (`iconVariant: 'tile'` + `iconColor`).
- Page title is a snippet passed to PageShell's `title` slot containing `text-4xl leading-tight font-light`; PageShell's own `h1` keeps its `text-sm font-semibold truncate`. No `theme={…}` was used.
- `headerActions` is a snippet, not a `PageShellAction[]`, because the row mixes a TextInput and a Select with the buttons. This gives up the action array's mobile overflow menu.
- `Tabs` uses `tabbar={{ size: 'large', fullWidth: true }}` so the underline baseline spans the content column; the cost is evenly stretched tabs rather than left-grouped ones, because Tabbar couples the two.
- `AppShell variant="framed"` used to keep the library's `md:shadow-sm` on the page surface even though the token block sets `elevationVariables('flat', 'light')`; that surface now uses `md:raised-1`, so the flat elevation scale reaches it and no component theme override is needed.
- Tab/URL sync uses `goto(target, { replaceState: true })` where `target` is `` `${resolve('/templates/tasks-dashboard')}?tab=…` `` cast to `ResolvedPathname`. `resolve()` takes a route id and cannot express a query-string-only change, and `svelte/no-navigation-without-resolve` rejects both a bare string and a `URL` instance; the cast keeps eslint clean without a rule disable.
- Sidebar uses `collapsible: 'offcanvas'` + `rail: true` rather than `'icon'`: the reference collapses the whole panel to a rail, not to an icon strip. Verified: collapse takes the sidebar 320px → 0px and reopens.
- `Management` has no entries in `data.ts`, so it carries two real placeholder rows (Permissions, Billing) as the spec allows; the group starts closed.
- `Card` `title` snippets wrap icon + text + count in `<span class="gap-sm flex items-center">`, and the My Tasks `action` snippet wraps the SegmentedControl and the `+` Button the same way — Card has no icon/suffix props and `action` is a single slot.
- Three intentionally empty snippets are passed: `render.taskLabel` in both panels and Meter's `indicator` in TimelinePanel. None has an off switch; they render nothing rather than replacing library behaviour.
- `assigneeName` turns a two-letter code into two words (`AL` → `A L`) so AvatarGroup keeps both initials; Avatar has no `initials` prop. Verified rendering as AL / BK / CM in the schedule.
- `schedule.validRange` in OverviewPanel is used purely as a framing device (bounding the chart to the selected working day) rather than as a mutation boundary — it is the only prop that makes GanttChart re-frame when the task set moves to another day.
- The reference's hatched area under the weekly line is a flat `secondary` fill at 0.35 opacity: `ChartFillStyle` accepts one colour plus an opacity, and an inline `<svg><pattern>` + `url(#…)` fill is exactly the hand-built escape hatch v2 forbids.
- TimelinePanel's Filter passes a `$derived` subset to `tasks` (no `bind:`), merging drag/resize edits back into the full array via `mutations.task.onTasksChange` — GanttChart has no row-filter prop.
- Month previous/next are plain `Button`s inside the chart's own `render.header` slot (not beside the chart), since the header payload offers no paging snippets; the chart's own `today()` and `zoomControl()` snippets render next to them unchanged.
- TimelinePanel bar title and percentage are bare `<span>`s with token utilities (`text-sm`, `text-xs`, `text-neutral/70`, `truncate`, `tabular-nums`) — the library has no text/typography primitive to stand in for a run of text.
- TimelinePanel uses `layout.scrollMode: 'page'` instead of `'contained'`, because contained scrolling requires an explicit height on the chart root that the tab panel cannot provide. Verified no horizontal page overflow at 1600px (documentElement.scrollWidth === clientWidth).
