# Changelog

All notable changes to entasis are recorded here. The format follows Keep a Changelog; releases
are cut with `npm run release <patch|minor|major>` (see `tooling/release.mjs`), which moves the
Unreleased section under the new version.

## Unreleased

This minor (0.12.0) batches the behaviour changes of the Base UI adoption. Every renamed API keeps
a deprecated alias for one minor, so code that only uses renamed names keeps compiling until the
aliases go. Some changes have no alias and need code changes before an app built on 0.11 compiles:
the removed props (Accordion and Collapsible `accessible`, Collapsible `srOnlyContent`, Meter
`steps`, Button `as`), the one-payload Tabbar `onValueChange`, and the Popover and Dialog snippet
members that `PopoverApi` and `DialogApi` no longer type (`place()`, `layer`, `focusScope`,
`computedPosition`). The notes below cover both.

### Upgrading from 0.11

- `readonly` becomes `readOnly`. Every value control now takes `readOnly`: it stays focusable and
  announced, refuses edits, and still validates and submits. Rename `RatingInput`'s `readonly` to
  `readOnly`; the old name works for one minor. Inputs still render the native `readonly`
  attribute, so `[readonly]` selectors keep matching.
- Disabled fields are left out of the Form value. A field that is disabled, directly or through a
  disabled `FormGroup` or `Form`, skips validation and is missing from `onSubmit`, `ask()` results
  and `MultiStepForm` payloads, as in a native form. In `InferFormValue`, entries and groups that
  declare `disabled` are optional keys, so code that reads them needs a fallback. Use `readOnly`
  for a value that must still be submitted while it cannot be edited.
- `PopoverState` becomes `PopoverApi`. Popover's `trigger` and `children` snippets, `onAfterOpen`,
  `onAfterClose` and `usePopoverContext()` receive a `PopoverApi`, and Dialog's receive a
  `DialogApi`. Change `import type { PopoverState } from 'entasis/popover'` to `PopoverApi`; the old
  name is a deprecated alias for one minor. The narrow type keeps the open state, `open()`,
  `close()`, `toggle()`, `setOpen()`, `placement`, `payload` and the `trigger`, `reference` and
  `triggerFor` attachments. Read `status === 'open'` instead of `hasTransitioned`, and read the
  `size`, `position` and `offset` (Popover) or `type` and `size` (Dialog) props you passed instead
  of the deprecated snippet members. Internal members such as `place()`, `layer`, `focusScope` or
  `computedPosition` are no longer typed.
- `Accordion`'s `accessible` prop is removed, as are `Collapsible`'s `accessible` and
  `srOnlyContent`. Use `hiddenUntilFound` so find-in-page can open a panel, or `keepMounted` to keep
  closed content in the DOM.
- `Tabbar` `onValueChange` takes one payload object: change `onValueChange={(value) => …}` to
  `onValueChange={({ value }) => …}`. The payload also carries `reason`. `NavigationMenu`, new in
  this release, uses the same shape: `{ value, details }`.
- `onOpenChange(open, details)` now runs before the state changes on every overlay and disclosure,
  so reading the component's open state inside the callback returns the previous value. Use the
  first argument, and `details.cancel()` to refuse a change.
- Other aliases kept for one minor: `Combobox` / `TagsInput` `showAllOnFocus` (now `openOnFocus`),
  `SelectState.selectValue` (now `activate`), `Avatar` / `AvatarGroup` `delay` (now
  `revealDelay`) and `Theme` `lastTooltipClosed` (now `hoverIntent`).
- Behaviour to check in your app (details under Changed): a `required` `Switch` must be on,
  `type="alert"` dialogs ignore outside presses, Escape in `Combobox` and `TagsInput` keeps focus in
  the input, Enter on a `Checkbox` or `RadioInput` continues the form instead of toggling, a
  `loading` `Button` stays focusable, `Tabs` and `Tabbar` fall back to the first enabled tab, and
  `Accordion` arrow keys no longer move between triggers.
- AI chat defaults follow the Claude.ai and ChatGPT conventions; each old look stays one prop away.
  `AIThread`, `AIChat` and `AIMessage` default to the `minimal` message variant (flat assistant
  prose; pass `messageVariant="bubble"` or `variant="bubble"` for the framed look). User bubbles are
  neutral grey (`messageColor="primary"` restores the saturated bubble). The message size scale
  steps down one notch: `normal` reads at 14px (the previous `small`), `large` at 16px (the
  previous `normal`) and `small` at 12px; pass `messageSize="large"` for the previous default.
  `messageActionsVisibility` defaults to `latest` (`always` for the previous behaviour). `AIChat`
  centres the transcript and composer in a 48rem column (`contentWidth="none"` spans the full
  width). The scroll-to-latest button is centred (`scrollButtonPosition="right"` keeps the corner).
- `AIComposer`: Enter sends and Shift+Enter inserts a newline (`submitShortcut` defaults to
  `'enter'`; it was `'none'`), in `AIChat` too. The selection formatting toolbar is off (`toolbar`
  defaults to `'none'`; pass `toolbar="hover"` for the bubble). A direct `onSubmit` clears the draft
  when it returns or its promise resolves and keeps it when it throws or rejects. The footer puts
  attach first and moves the `modelSelector` slot to the end, next to voice and send; `AIChat`'s
  model picker and context controls move there too.
- `AISuggestions` are one-shot by default: a pick reports `onSelect` and updates `value`, but no
  chip stays pressed and the chips are plain buttons without `aria-pressed`. Set `persistSelection`
  for toggle chips. A standalone `AISuggestion` is a toggle button only when `selected` is set.
- `AIChat` shows its default context indicator only when `maxTokens` is set or the conversation
  reports `contextUsage`; an empty 128k ring no longer shows. The compact `AIContext` shows its
  percentage.
- The theme registry keys of `AISuggestion`, `AIModelSelector` and `AIFilePreview` are kebab-case,
  matching their set functions: rename `aiSuggestion`, `aiModelSelector` and `aiFilePreview` to
  `'ai-suggestion'`, `'ai-model-selector'` and `'ai-file-preview'` in `<Theme components>`.
- `AIAskUserQuestion` questions are optional by default; set `required: true` to keep one blocking.
  `AITool` blocks are `w-full max-w-[32rem]` of their container instead of sized from the viewport,
  and its `scroll*` theme slots are removed (see Removed). `AIReasoning` has no built-in bottom
  margin; the surrounding layout owns the spacing.

### Added

- `Toast`: a toast shown again while it is on screen (the same `id`, or the same message
  deduplicated) bounces once to draw the eye back to it. `toast.update()` does not, and reduced
  motion keeps it still. The handle exposes the count as `attentionKey`.
- `AIThreadToc`: `showRange` (`tocShowRange` on `AIThread`) draws the rail and the bar marking the
  part of the thread on screen. It is off by default: the minimap shows its pins only.
- `AIReasoning`, `AITool`, `AIMarker` and `AIAskUserQuestionSummary`: a `size` prop (`small`,
  `normal`, `large`) that scales their text and icons with the `AIMessage` scale. `AIThread` and
  `AIChat` pass `messageSize` to every row, so reasoning, tool calls, sources, markers and answered
  questions follow the message size instead of a fixed one.
- `Toast`: a toast with no `id` whose color, title and description match one still on screen updates
  that toast and restarts its timer instead of stacking a duplicate, so a repeated submission shows
  once. It compares plain-text titles and descriptions only. Pass `dedupe: false` to always add a
  new toast; an explicit `id` still wins.
- `Switch`: `inputValue` sets the value a native `<form>` submits under the switch's `name` while it
  is on (default `'true'`). An off switch, or one without a `name`, submits nothing, like a native
  checkbox.
- `Switch`: a required switch sets `aria-required` and shows the required marker on its inline
  label.
- Tooling: browser-mode unit tests. `*.browser.test.ts` files run in real Chromium and WebKit
  through Vitest browser mode and Playwright, as part of `npm run test:unit` and on their own with
  `npm run test:browser`. The docs stylesheet is loaded, so focus order, tabbability and panel
  placement are measured as in the app. CI now installs WebKit next to Chromium.
- Tooling: the axe end-to-end sweep now also audits pages with a popup open: Select (including
  grouped and scrolling lists), Combobox, TagsInput and PhoneInput (including their empty results),
  a PopupMenu with its submenu, MenuBar and Dialog. Before, it only saw closed popups. Allowlist
  entries can be narrowed to one failing child with `match`, and an entry for an open popup that no
  longer suppresses anything fails the sweep, so it gets removed once its fix lands.
- Tooling: `npm run bench` measures, in Chromium: opening a 1,000-option Select, a keystroke in a
  1,000-option Combobox and Command, mounting a 500-item Menu and moving its highlight, mounting 300
  closed Popovers and Selects, and mounting a 200-row DataTable with a closed row-actions menu on
  every row. Each result is compared with a committed baseline, and `npm run bench:baseline`
  re-records the baselines. The result tables and baseline rows also print outside an interactive
  terminal.
- Tooling: jsdom unit tests get stand-ins for `CloseWatcher`, `visualViewport` and per-element
  layout rects, with controls in `src/lib/testing/jsdom.test-helper.ts`. The proposed overlay and
  accessibility laws have executable entries, which are expected to fail until each law lands.
- `PasswordInput`: `autocomplete` (`'current-password' | 'new-password' | 'off'`), `minLength` and
  `inputAttrs` props, with the exported `PasswordInputAutocomplete` and `PasswordInputAttributes`
  types.
- i18n: `passwordTooShort(min)` in all 8 locales.
- i18n: `meter` and `meterSegment(index, count)` in all 8 locales. They name a `Meter` rendered
  without a label and an unlabelled stacked segment ("Segment 2 of 3").
- `Tabs`: the `onValueChange` payload gains `reason`: `user` for a click, key, menu entry or `api`
  navigation, and `initial`, `disabled` or `missing` for an automatic fallback. The new
  `TabsValueChangePayload` and `TabsValueChangeReason` types are exported from `entasis/tabs`.
- `Popover` / `Dialog` / `Overlay` / `FloatingWindow` / `ImageZoom`: `onOpenChange(open, details)`
  receives a second argument with `reason`, `event`, `trigger`, `interaction` and `cancel()`. It
  runs before the state changes. Calling `details.cancel()` keeps the overlay as it was: a cancelled
  Escape is not `defaultPrevented` and a cancelled drawer swipe snaps back. A hover open or close
  passes the originating mouse or pointer event as `details.event`, and the Android Back gesture
  reports `reason: 'close-watcher'` with `interaction: 'touch'`. The new `OpenChangeDetails`,
  `OpenChangeHandler`, `OpenChangeReason` and `OpenChangeInteraction` types are exported from
  `entasis/types`, and `PopoverState.close()` returns `false` when `onOpenChange` cancelled the
  change.
- `Dialog`: `{@attach dialog.trigger}` and `{@attach dialog.reference}` make any element a trigger,
  with `aria-haspopup`, `aria-expanded` and `aria-controls` kept in sync. The built-in trigger
  carries the same attributes.
- `Dialog`: on Android the Back gesture closes the topmost modal dialog (a `CloseWatcher` per open
  modal layer), under the same rules as Escape, including `cancel()`.
- `Popover`: `openReason` is `hover`, `press`, `keyboard` or `programmatic`.
- `Dialog` / `Popover`: `focusOnClose` chooses where focus goes when the overlay closes: `false`
  leaves it alone, an element receives it, and a function gets the change details (`reason`,
  `interaction`) and returns one of these, or nothing to restore as usual. The `FocusOnClose` type
  is exported from `entasis/dialog` and `entasis/popover`.
- `Popover`: `position` accepts the logical sides `inline-start` and `inline-end` (and
  `inline-end-start`, `inline-start-end`, and so on). They resolve with the reading direction, so
  `inline-end` opens on the right in English and on the left in Arabic.
- `Popover`: `collisionBoundary` (`'visualViewport'` or `'layoutViewport'`) chooses the viewport a
  panel is shifted back into. `ContextMenu` uses `'layoutViewport'`, so panning a pinch-zoomed page
  no longer drags an open context menu along.
- `Popover`: `fallbackAxisSide` (`'start'`, `'end'` or `'none'`) lets a panel with no room on either
  side of its axis open on the perpendicular axis. Submenus use it, so a submenu with no room beside
  its menu opens below its row instead of covering the menu.
- `Popover`: `anchorTo` (`'box'` or `'line'`). With `'line'`, a trigger that wraps across lines
  anchors the panel to the line the pointer was on when it opened, and the panel stays there while
  it is open.
- `Popover`: the panel carries `data-side`, `data-align` and `data-anchor-hidden`, and the trigger
  carries `data-popup-side` (a `ref` anchor element gets it too). They report the side the panel
  landed on after flipping, `inline-start` or `inline-end` when a logical side was requested, or
  `none` when `positionPanel` placed it. Themes can use them to flatten the corner where trigger and
  panel meet. `PopoverState.placement` exposes the same values, and `PopoverPlacement`,
  `PopoverSide` and `PopoverPlacementState` are exported from `entasis/popover`.
- `Popover`: the panel's wrapper exposes `--available-width` and `--available-height` (the room
  between the trigger and the viewport edge on the panel's side) and pixel-snapped `--anchor-width`
  and `--anchor-height`, so a scrolling list can cap itself with
  `max-height: min(240px, var(--available-height))`.
- `Popover`: `closeDelay` (default 120 ms) is how long the pointer may stay outside the hover safe
  area before `closeOnMouseLeave` closes the popover. `PopupMenu` submenus honour it too.
- `useNavigation`: `disabledItemsFocusable` and `skipDisabled: false` keep `aria-disabled` and
  `data-disabled` items in the arrow-key order and as the tab stop (toolbars), without ever
  activating them. Natively disabled items are always skipped. `orientation: 'both'` serves radio
  groups, `focusableContainer: false` containers that must stay unfocusable, and
  `onKeyboardMove(index)` fires only when an arrow, Home, End or type-ahead moves focus.
- `MenuOption` / `Menu`: `textValue` sets the text type-ahead matches instead of the visible title
  (reflected to `data-typeahead`). Submenu rows take it too.
- `useListNavigation`: `autoHighlight` (`true`, `false` or `'always'`), `anchor`, `query`, `open`,
  `loop: 'wrap' | 'input' | false`, `scrollContainer` and `idPrefix` options. The utility also
  returns `optionId`, `pointerHighlight`, `typeahead.isTyping`, `typeahead.reset`, `reanchor` and
  `scrollToHighlighted`, and exports `createOptionIds`. `onHighlightChange` receives a second
  argument with the `reason` (`'keyboard'`, `'pointer'` or `'list'`) and the originating event.
- `Field`: every input accepts `readOnly`, so the control stays focusable and announced as read-only
  (`readonly` on text inputs, `aria-readonly` on role-based controls), refuses edits, and still
  validates and submits. A read-only `Form`, `FormGroup` or `Field as="fieldset"` makes the fields
  inside it read-only too. A disabled `Form`, `FormGroup` or fieldset `Field` disables the fields
  inside it, and a field's effective state combines its own, its group's and the form's.
- `Field`: validation messages come from the i18n catalog in all 8 locales, never from the
  validation library. An empty required field shows one message, and a required `Checkbox` or
  `Switch` says it must be on. The new `messages` prop overrides `required`, `invalid`, `email`,
  `url`, `tooShort`, `tooLong`, `rangeUnderflow`, `rangeOverflow` and `incomplete` per field or
  `Form` entry. Text controls also accept `minLength` and `maxLength`.
- `Field`: `FieldState` gains `touched`, `dirty`, `filled`, `initialValue`, `reset(value?)` and
  `focusControl()`, and the Field root carries `data-invalid`, `data-disabled`, `data-readonly`,
  `data-focused`, `data-filled`, `data-dirty` and `data-touched`. `null`, an empty string and an
  empty array count as equal.
- `Checkbox` / `Switch`: `inputAttrs` (typed `FieldButtonAttributes`) forwards native attributes
  such as `aria-label`, `title` and event handlers to the button. An `aria-label` there replaces the
  automatic `aria-labelledby`, and a handler that calls `preventDefault()` cancels the toggle.
- `Calendar` / `DateSelector` / `ColorPicker`: `readOnly` keeps them focusable and browsable,
  refuses selection and edits, and reports `aria-readonly` on their grid or sliders. A read-only
  `CheckboxesInput` marks each option with `aria-readonly`.
- Docs: a Read only control on the Usage card of every value control (`Slider`, `NumberInput`,
  `KeyValueInput`, `TextInput`, `TextArea`, `PasswordInput`, `PhoneInput`, `DateInput`,
  `TimeInput`, `ColorInput`, `ColorPicker`, `Calendar`, `DateSelector`, `Select`, `Combobox`,
  `Autocomplete`, `TagsInput`, `Checkbox`, `CheckboxesInput`, `RadioInput`, `Switch`,
  `RatingInput`, `FileInput`, `TagGroup`, `VoiceInput` and `RichTextInput`), with the `readOnly`
  value in the Usage code. The MCP docs of `TextInput`, `TextArea`, `PasswordInput`, `PhoneInput`,
  `ColorInput`, `KeyValueInput`, `TagGroup`, `VoiceInput`, `DateInput` and `TimeInput` document
  `readOnly`.
- `FieldHiddenInputs` (from `entasis/field`) renders the inputs a custom control submits in a plain
  `<form>`. It takes one value, several values under the same name, or a checkbox that submits only
  while checked, and uses the field's `name`, `required`, `disabled` and `form`. While a required
  value is missing it blocks the native submit, and the browser's report moves to the visible
  control, which shows the field's own error. With `autocomplete`, the browser can autofill the
  field, matching options by value or label.
- Inputs: every input accepts a `form` prop with the id of a native `<form>` placed elsewhere on the
  page. The control's native elements and hidden inputs submit with that form and follow its reset.
- `Form`: `FormState.advanceFrom(field)` moves on from a field the way Enter does in a text field:
  it validates the field and focuses the next one, or submits from the last field. It returns
  `false` for a hidden, disabled or unregistered field, so controls such as checkboxes and radios
  can fall back to the native form. The new `requestNativeSubmit(element)` utility submits the
  element's form through its default submit button.
- `Theme`: `nonce` is applied to every script and style entasis injects (theme and viewport boot
  scripts, design-token CSS, the `transitionOnChange` suppression style, Mermaid styles, the
  document print frame, and the PhoneInput, Map and Mermaid CDN loaders), and is readable as
  `ThemeState.nonce`. Setup for SvelteKit is documented on the Getting started page.
- `Theme`: `portalContainer` (element, shadow root or function) sets where dialogs, popovers, menus,
  tooltips and the floating-window layer mount. Inside a shadow root they now mount in that root by
  default.
- `Dialog` / `Popover`: while page scroll is locked, `--entasis-scrollbar-width` is set on `html` so
  fixed headers can compensate, and a page that already uses `scrollbar-gutter: stable` no longer
  gets a second gutter.
- `Theme`: `--keyboard-inset` on `html` is the height the on-screen keyboard covers, measured from
  the visual viewport (`0px` by default).
- `NavigationMenu`: site navigation with mega-menu panels (import from `entasis/navigation-menu`). A
  `<nav>` landmark holds a row of links and disclosure buttons (`aria-expanded`, `aria-controls`)
  and one panel area rendered inline after the row, so Tab order stays natural. Resting the pointer
  on a trigger opens its panel and moving to another switches at once; the panel area animates its
  width and height between panels and stays inside the viewport, right to left included. Opening by
  keyboard keeps focus on the trigger, Tab enters the panel and carries on after the trigger, arrow
  keys, Home and End move along the bar, and Escape returns focus to the trigger. A link press
  closes every level and reports one `onValueChange({ value: null, details })`; a consumer `onclick`
  runs first and `preventDefault()` keeps it open. Supports `value`, `defaultValue`, a generic
  `Value`, `onValueChange({ value, details })` with reasons and `cancel()`, `openOnHover`, `delay`,
  `closeDelay`, `keepMounted` (panels stay in the server-rendered HTML for crawlers), `size`,
  `density`, `color`, `dir`, `transition`, nested inline levels, `iconOnly` links and panels (only
  `prefix` is painted and the string `label` becomes the accessible name) and the typed
  `navigationMenuDataAttributes` and `navigationMenuCssVariables` maps.
- `Autocomplete`: free text with suggestions (import from `entasis/autocomplete`). The value is the
  text in the input and the input submits it in native forms, so a suggestion is a shortcut for
  typing and never required. Suggestions can be strings, options, groups, or an async function that
  receives the text and an abort signal; the function is only asked while the list is open, and a
  value listed twice appears once (first entry wins). `mode` is `'list'` (filtered), `'both'`
  (filtered with inline completion), `'inline'` (not filtered, inline completion) or `'none'`;
  inline completion previews the highlighted suggestion in the input, Escape or blur restore the
  typed text, and Tab or the arrow keys accept it. Also `autoHighlight`, `openOnFocus`,
  `shouldFilter`, `filter`, `limit`, `loop`, `onSelect`, `open`/`onOpenChange(open, details)`,
  `readOnly`, and `inputAttrs` whose event handlers run before the built-in behaviour
  (`preventDefault()` on `onkeydown`, `onclick` or `onpointerdown` cancels it).
- `Progress`: a linear progress bar with a determinate fill, an indeterminate state (`value={null}`)
  and `min`/`max`, `format`, `getAriaValueText` and `locale`. It has a `label` and optional visible
  value text (`showValue`, `valueLabel`), plus `size`, `density` and semantic `color`, and exposes
  `data-indeterminate`, `data-progressing` and `data-complete`.
- `ProgressCircle`: `value={null}` is an indeterminate state that spins the arc and drops
  `aria-valuenow`. New `min`/`max`, `format`, `getAriaValueText` and `locale` props, and
  `data-indeterminate`, `data-progressing` and `data-complete`.
- `Meter`: `format`, `getAriaValueText` and `locale` props. Value text is formatted with Intl in the
  active I18n locale (French reads `50 %`).
- `Button` / `ToggleButton`: `focusableWhenDisabled` keeps a disabled button in the tab order. It
  renders `aria-disabled="true"` instead of the native `disabled` attribute and cancels clicks,
  Enter, Space and form submission, while pointer events (`onpointerenter`, `onpointerleave`) still
  reach it so a tooltip can explain why it is unavailable. A disabled anchor drops its `href` and
  takes `tabindex="0"`.
- `ToggleButtonGroup`: `orientation` (`'horizontal'` | `'vertical'`) stacks the buttons, moves with
  ArrowUp and ArrowDown, joins segments top to bottom and sets `data-orientation`. `loopFocus`
  (default true) lets the arrow keys stop at the ends. Exports the `ToggleButtonGroupOrientation`
  type.
- `ScrollArea`: `data-scrolling` on the root, viewport, scrollbars and thumbs, plus
  `data-has-overflow-x`/`-y`, `data-overflow-{x,y}-{start,end}` and
  `--scroll-area-overflow-{x,y}-{start,end}` (px hidden past each edge) on the root. The new
  `overflowEdgeThreshold` prop (default 1) sets how much hidden content counts. The names are
  exported as `scrollAreaDataAttributes` and `scrollAreaCssVariables`.
- `ScrollArea`: `viewportAttrs` spreads attributes, a class and handlers onto the scrolling viewport
  so a widget such as a listbox can own it. A `role` passed there drops the automatic 'Scrollable
  content' name and tab stop.
- `Dialog`: `modal={false}` renders a non-modal dialog or drawer that leaves the page interactive:
  no inert page, scroll lock, backdrop or Tab trap, and outside presses do not dismiss it unless
  `closeOnClickOutside` is set.
- `Dialog`: drawer snap points. `snapPoints` (fractions of the available height or CSS lengths),
  bindable `snapPoint`, `defaultSnapPoint` and `onSnapPointChange({ snapPoint, details })` let
  bottom and top drawers, and modals collapsed into mobile sheets, rest at several heights. Drags
  move between points, a flick goes to the next one, dragging below the lowest dismisses, and the
  body scrolls only at the largest point. `dialog.setSnapPoint()` and `dialog.currentSnapPoint`
  control it from code; new `DialogSnapPoint` type.
- `Dialog`: `<html>` carries `data-dialog-open` and `--dialog-depth` while a modal dialog is open,
  so a page can scale back behind a sheet with plain CSS.
- `Dialog`: a bottom sheet makes room for the on-screen keyboard while a text field inside has focus
  (bottom padding follows `--keyboard-inset`), and brings the field into view once the keyboard has
  stopped moving.
- `Dialog`: `closeButton={false}` suppresses the visible close button. A closable dialog whose
  visible close button is suppressed (or a custom one that renders nothing, as in the `Popover`
  mobile sheet) gets a visually hidden Close button for screen readers.
- `Popover`: `modal` makes a floating popover modal. Tab stays inside the panel, the page behind
  becomes inert, focus opens inside the panel, and a visually hidden Close button at the end of the
  panel lets screen reader users close it.
- `Popover`: `label` and `labelledBy` give the popup an accessible name (`aria-label` /
  `aria-labelledby` on the dialog, on the menu, listbox, tree or grid element inside a non-dialog
  popup, and on the mobile sheet's dialog), also while it is open. `DateSelector`, `ColorInput` and
  `MediaVolume` now name their popovers.
- `Popover`: `arrow` draws a pointer from the panel toward its trigger. It follows the trigger when
  the panel shifts to fit the viewport, reports `data-side` and `data-uncentered`, and is styled
  with the new `theme.arrow` part. `HoverCard` and `LinkPreview` forward it.
- `Popover`: one popup can serve many triggers. `{@attach popover.triggerFor(() => row)}` anchors
  the popup to the pressed trigger and `popover.payload` reads that trigger's data live. `Popover`
  and `PopoverState` are generic on the payload type (default `unknown`).
- `Popover`: `tabBridge` (default on) turns the Tab bridge between a trigger and its portaled panel
  off for panels that are not meant to be tabbed into. `closeOnFocusOut` closes the popover (reason
  `'focus-out'`) when focus that was in it or on its trigger moves to a control outside both.
- `HoverCard` / `LinkPreview`: `wrap`, `anchorTo` and `arrow`. `wrap` (default true on
  `LinkPreview`) lets the link flow with the surrounding text, and the card anchors to the line the
  pointer entered.
- `Menu`: checkbox, radio-group and group items. A checkbox is a `menuitemcheckbox` with `value`,
  `defaultValue` and `onValueChange`; a radio-group is a labelled group of `menuitemradio` rows
  sharing one value; a group is a labelled `role="group"`. Checkable rows keep the menu open unless
  `closeOnClick` is true, the check animates out when unchecked, and the labels are hidden from the
  accessibility tree. The new item types are exported from `entasis/menu`.
- `Menu`: `filter` adds a search field above the rows (`search`, `defaultSearch`, `onSearchChange`,
  an `empty` snippet and a custom `match`). Focus stays in the field while ArrowUp and ArrowDown
  highlight rows, the first match is highlighted as you type and Enter presses the highlighted row.
  Submenus take a filter of their own, in popups and in stacked mobile-sheet menus.
- `Menu`: `onHighlightChange` reports the value of the highlighted row (keyboard, pointer or
  filter), and every item takes a `key` and a `value`.
- `MenuOption`: `closeOnClick`, where false keeps the `PopupMenu`, `ContextMenu` or `MenuBar` menu
  open when the row is pressed. Menu buttons and options take it too.
- `Select`: `multiple` holds a list of values (field type `select-multiple`, and
  `type: 'select-multiple'` in `Form`). The list stays open while options are toggled with a click,
  Enter or Space, the listbox is `aria-multiselectable`, the trigger shows two labels and `+N` (or
  your `formatValue`), the value is an array in item order, and a native form submits one hidden
  input per value under the same `name`.
- `Select`: `readOnly` opens the list and lets it be browsed with the arrows, Home, End, typing and
  hover, while no option can be chosen and the value is still submitted. The trigger carries
  `aria-readonly` and `data-readonly`.
- `Select`: `autocomplete` renders a visually hidden input the browser can autofill. The filled text
  selects the option whose value matches, else whose label matches (ignoring case and accents),
  without opening the list. A `required` Select blocks a native form submit until it has a value.
- `Select`: `open`, `defaultOpen`, `onOpenChange(open, details)` (with `reason`, `event`,
  `interaction` and `cancel()`), `onAfterOpen` and `onAfterClose`. A press outside the list reports
  `reason: 'outside-press'` with the pointer's interaction (`mouse`, `touch` or `pen`); focus moving
  away by keyboard stays `'focus-out'`.
- `Select`: `clearable` adds a button that empties the selection and returns focus to the trigger,
  `id` sets the trigger's id so an external `<label for>` names it, and `items` accept readonly
  arrays (`as const` data). New `SelectValue` type.
- `Select`: theme slots `list` (the scrolling list, with a `dropdown` variant that carries the 240px
  cap) and `listbox`. A `max-height` set on `list` also caps an item-aligned list.
- `Combobox` / `TagsInput`: `open`, `defaultOpen`, `onOpenChange(open, details)` (reasons
  `input-change`, `escape-key`, `item-press`, `list-navigation`, `trigger-press`, `trigger-focus`,
  `focus-out`; `details.cancel()` keeps the list as it was), `onAfterOpen` and `onAfterClose`.
  `OpenChangeReason` gains `input-change`.
- `Combobox` / `TagsInput`: `openOnFocus` opens the list when the input gets focus (static arrays
  list every option, an `items` function is called with an empty search when the field is focused,
  not on mount). ArrowDown or ArrowUp opens a closed list, and a press on the already focused input
  toggles it.
- `Combobox` / `TagsInput`: `items` accept `{ label?, items }` groups mixed with flat options,
  `disabled` options (dimmed and skipped by the keyboard), a `separators` prop and an `item` snippet
  for custom rows. New types `ComboboxOptionGroup`, `ComboboxItems`, `ComboboxItemsSource`,
  `ComboboxItemsRequest`, `ComboboxFilter`, `ComboboxHighlightChangePayload` and
  `ComboboxHighlightReason`, and the `group`, `groupLabel` and `separator` theme parts.
- `Combobox` / `TagsInput`: `filter` replaces the match for static arrays and `limit` caps the
  matches (matching stops once reached). `autoHighlight` (`true`, `false` or `'always'`) and `loop`
  (`'wrap'`, `'input'` or `false`) control the highlight model, and
  `onHighlightChange({ value, reason, event })` reports why it moved.
- `Combobox` / `TagsInput`: `readOnly` lets the list open and be browsed while the value stays put:
  choosing, Enter, the clear button and tag removal do nothing, the tags render without remove
  buttons, and the values still submit.
- `Combobox` / `TagsInput`: an `items` function receives `{ signal }` as its second argument. A
  newer search aborts the older request and a response that is not the latest is ignored. The last
  results stay visible, with `aria-busy` and a loading row, while the next search loads, and an
  external `value` change re-resolves the label.
- `TagsInput`: `keepSearchOnSelect` keeps the typed text after an option is chosen, so several
  matches of one search can be added in a row.
- `Command`: `limit` shows at most that many items across groups, `autoHighlight` and `loop` control
  the highlight model, and the `open` and `close` slot functions accept the click event, which is
  reported as a `trigger-press` change.
- `Form`: `validationMode` (`'submit'`, `'blur'` or `'change'`, also per entry) and
  `validationDebounce` choose when fields validate by themselves. After a first submit attempt,
  edited fields re-validate, and a field showing an error re-validates as it is edited.
  `RichTextInput` honours both, inside a `Field` and standalone.
- `Form`: `onValidate` may return a promise. The field stays neutral while it runs (no
  `aria-invalid` or `data-invalid`, `data-validating` on the root), stale results are dropped, a
  pending result is dropped when the value changes, and submit waits for pending validators.
  `validateAsync()` is the awaiting counterpart of `validate()`.
- `Form`: an `errors` prop and `form.setErrors()` show server errors under their fields. They
  survive validation, do not block a re-submit, and clear when the field's value next changes. The
  first errored field in render order is revealed.
- `Form`: `form.reset(value?)` restores initial values (or the given ones) as the new baseline and
  clears errors, touched, dirty and the submit count without echoing value callbacks. Also
  `form.dirty`, `form.touched`, `form.validating`, `form.submitCount`, `form.validateField(name)`
  and `form.validate({ reveal: false })` for quiet validation.
- `Field`: validation errors fade and grow in under the Theme motion tokens (a `motion` slot in the
  field theme); reduced motion plays nothing. The root also exposes `data-validating`.
- `ask()` / `MultiStepForm`: accept `validationMode` and `validationDebounce`, and wait for async
  validators before submitting or advancing.
- `NumberInput`: `format` (`Intl.NumberFormatOptions` for currency, percent, unit, fraction digits)
  and `locale` props; Intl rounding applies to the committed value, and the value keeps full
  precision when no rounding option is set. Out-of-range messages are localized and show the bound
  formatted in the input's locale and format.
- `NumberInput`: `inputAttrs` for native input attributes (`autocomplete`, `aria-label`,
  `aria-roledescription`, handlers that run before the built-in ones).
- `NumberInput`: `largeStep` (Shift+Arrow, PageUp, PageDown; default ten times the step),
  `smallStep` (Alt+Arrow; default a tenth), Home and End jump to `min` and `max`, and `snapOnStep`
  snaps to the step grid before clamping.
- `NumberInput`: `wheelStep` steps a focused, hovered input on vertical wheel scrolls (or horizontal
  with Shift), and `onValueCommit({ value, reason })` reports `blur`, `keyboard`, `step` or `wheel`;
  a press-and-hold commits once, on release.
- `PinInput`: `normalizeValue` and `onRejectInput` for the shared normalization of typed, pasted,
  autofilled, composed and controlled codes, `submitOnComplete` submits the surrounding `Form` (or
  native form) when the user completes the code, `readOnly` support (typing, paste and autofill are
  ignored), `groups` for separators between cell groups (for example `[3, 3]`), and shadow DOM
  support.
- `CheckboxesInput`: `selectAll` and `selectAllLabel` add a select-all checkbox. It is mixed while
  some enabled options are selected; clicking selects all, then none, then restores the partial
  selection you started from. Disabled options keep their state.
- `Checkbox`: `inputValue` sets the value a native form submits while checked (default `'true'`).
- `Checkbox` / `CheckboxesInput` / `RadioInput` / `Switch`: `readOnly` keeps the control focusable
  and announced (`aria-readonly`, `data-readonly`) while the value cannot change; it still validates
  and submits. Radio groups expose `aria-required` and `aria-readonly`.
- `RadioInput` / `CheckboxesInput`: `value`, `defaultValue` and `onValueChange` are typed from the
  options' literal values.
- `useNavigation`: `enterActivates: false` leaves Enter to the focused item instead of clicking it.
- `Slider`: `onValueCommit` fires once when an interaction ends with a changed value (pointer
  release or cancel, each key press, finished screen-reader adjustment) and never for a no-op, so
  "save on release" no longer needs debouncing `onValueChange`.
- `Slider`: `largeStep` sets how far PageUp, PageDown and Shift+Arrow move a thumb (ten times `step`
  by default).
- `Slider`: `thumbCollisionBehavior` (`none`, `push`, `swap`) decides what a thumb does when it
  meets a neighbour; `thumbDisabled` disables individual thumbs, which keep their value in the
  submitted value and block their neighbours. New type `SliderThumbCollisionBehavior`.
- `Slider`: `readOnly` thumbs stay focusable and announced, refuse every edit and still submit; the
  track and thumbs carry `data-readonly` and a default cursor.
- `Toast`: `toast.update(id, patch or function)` changes a toast that is on screen and restarts its
  countdown, `toast.dismiss(id?)` closes one toast or all of them, and
  `toast.promise(promise, { loading, success, error })` turns a loading toast into its success or
  error toast and returns the promise. A toast the user dismissed is never brought back by a late
  update. The `Toast` handle gains `update()`, `updateKey` and `dismissed`, and each toast renders
  `data-update-key`. New types `ToastUpdate`, `ToastUpdater` and `ToastPromiseOptions`.
- `Tooltip`: `hoverable` (default true) keeps the tooltip open while the pointer is over its
  content, so text can be read and links used (WCAG 1.4.13); `hoverable={false}` lets the pointer
  through and closes the tooltip as soon as it leaves the trigger.
- `Tooltip`: `closeOnClick` (default true) closes the tooltip when its trigger is pressed and keeps
  it closed until the pointer leaves or focus moves away. `disabled` turns a tooltip off: hover and
  focus no longer open it, an open one closes, and the trigger loses `aria-describedby`.
  `closeDelay` holds the tooltip for a moment after the pointer leaves.
- `Tooltip`: moving between triggers keeps one surface. It stays in place, resizes to the new
  content and carries `data-instant`; the tooltip it leaves gets `onAfterClose` and the new one
  `onAfterOpen`.
- `Tabbar` / `Tabs`: `activateOnFocus` (default `true`). Set it to `false` for manual activation:
  the arrow keys, Home and End only move focus, and Enter, Space or a click selects the focused tab,
  so arrowing across the list no longer mounts every lazy panel. `Tabs` forwards it as
  `tabbar={{ activateOnFocus: false }}`.
- `Tabs`: `data-activation-direction` on the root and on the active panel (`left`, `right`, `up`,
  `down` or `none`) for direction-aware panel animations. It is mirrored in right-to-left documents,
  follows the tab list's axis, and is set by clicks, keys, `api` navigation and changes to a bound
  `value`. The `TabsActivationDirection` type is exported; `Stepper` gains the matching
  `panelActivationDirection` prop.
- `Accordion` / `Collapsible`: `hiddenUntilFound` keeps closed content in the DOM under
  `hidden=until-found`, so the browser's find-in-page, text fragments and `#id` links can find it
  and open the item, with no animation. Closed content stays out of the reading and tab order, and
  cancelling the open-change leaves it closed and findable. `keepMounted` keeps closed content
  mounted under `hidden`, preserving its state.
- `Accordion`: `disabled` prop and `disabledKey` (default `'disabled'`) disable items with the
  native `disabled` attribute on the trigger, and items gain `data-open`, `data-closed`,
  `data-disabled` and `data-index` styling hooks.
- `Collapsible`: `onAfterOpen` and `onAfterClose`. `Accordion`: `onItemAfterOpen` and
  `onItemAfterClose` with `{ item, index }`. Each fires exactly once per open or close, also when no
  animation runs (reduced motion, zero duration, find-in-page); none fires for the initial state.
  The `OpenChangeReason` list gains `'find-in-page'`.
- `Avatar`: the `image` prop forwards `srcset`, `sizes`, `crossorigin`, `referrerpolicy`, `loading`,
  `decoding` and `fetchpriority` to the `<img>`; `AvatarGroup` passes it to every avatar. With
  `loading: 'lazy'` the initials stay on screen until the browser has fetched the picture.
- `Avatar`: the root exposes `data-status` (`idle`, `loading`, `loaded` or `error`) and the default
  theme crossfades the image over the initials from it. `fallbackDelay` holds the initials back
  while the image loads, so a fast image never flashes the fallback; a failed image or a missing
  `src` still shows the initials at once.
- i18n: `resultsCount(count)` and `tags` (the result count announced by `Combobox`, `TagsInput`,
  `Command` and the `PhoneInput` country picker, and the `TagsInput` tag toolbar),
  `progressIndeterminate`, `selectAll`, `oneTimeCode` and the `Dialog` Close label, in all 8
  locales.
- `Popover`: `PopoverApi` (from `entasis/popover`) is the type the `trigger` and `children`
  snippets, `onAfterOpen` and `onAfterClose` receive: `id`, `isOpen`, `status`, `openReason`,
  `activeTrigger`, `placement`, `triggerProps`, `payload`, `open`, `close`, `toggle`, `setOpen`,
  `trigger`, `reference` and `triggerFor`. Type a snippet parameter `PopoverApi<Row>` to read
  `payload` as a `Row`. `PopoverOpenReason` is exported too.
- `Dialog`: `DialogApi` (from `entasis/dialog`) is the type the `trigger` and `children` snippets,
  `onAfterOpen` and `onAfterClose` receive: `id`, `isOpen`, `status`, `modal`, `computedType`,
  `currentSnapPoint`, `triggerProps`, `open`, `close`, `toggle`, `setOpen`, `setSnapPoint`,
  `trigger` and `reference`.
- `Popover` / `Dialog`: the snippet payload has `status` (`'closed'`, `'entering'`, `'open'` or
  `'exiting'`), which tells where the panel is in its open and close lifecycle.
- `Popover`, `Dialog`, `Tooltip`, `HoverCard`, `Menu`, `Select`, `Combobox`, `Collapsible`,
  `Accordion`, `Overlay` and `Sidebar` export typed styling-hook maps, each with its name type:
  `popoverDataAttributes`, `popoverCssVariables`, `dialogDataAttributes`, `dialogCssVariables`,
  `tooltipDataAttributes`, `tooltipCssVariables`, `hoverCardDataAttributes`,
  `menuDataAttributes`, `selectDataAttributes`, `comboboxDataAttributes`,
  `collapsibleDataAttributes`, `collapsibleCssVariables`, `accordionDataAttributes`,
  `accordionCssVariables`, `overlayDataAttributes`, `sidebarDataAttributes` and
  `sidebarCssVariables`. `hoverCardCssVariables`, `menuCssVariables`, `selectCssVariables` and
  `comboboxCssVariables` list the Popover placement variables those panels inherit
  (`--available-width`, `--available-height`, `--anchor-width`, `--anchor-height`,
  `--transform-origin`). Each component's documentation has a Styling hooks section listing every
  attribute and variable.
- `Popover`: the panel carries `data-open`, `data-closed`, `data-entering` and `data-exiting`. The
  element the panel is anchored to (the trigger that opened it, or the ref element) carries
  `data-popup-open` while the popover is open. `Select`, `Combobox`, `Menu`, `PopupMenu`,
  `ContextMenu` and `HoverCard` panels inherit these hooks, and so do their triggers and submenu
  rows.
- `Dialog`: the root, the panel and the shared backdrop carry `data-open` and `data-closed`; the
  root and panel also carry `data-entering` and `data-exiting`. The trigger (the built-in button,
  or an element with `dialog.trigger` or `dialog.reference`) carries `data-popup-open` while the
  dialog is open.
- `Tooltip`: the surface (`role="tooltip"`) carries `data-open`, `data-closed`, `data-entering`,
  `data-exiting`, `data-side` and `data-align`. The trigger carries `data-popup-open` while its
  tooltip shows.
- `Select` / `Combobox`: the trigger or input carries `data-popup-open` and `data-disabled`, and
  disabled options carry `data-disabled`. `HoverCard` triggers and disabled `Menu` and `MenuOption`
  rows carry `data-disabled`.
- `Sidebar`: collapsed to icons on desktop, a menu row that only expands a submenu (it has `items`
  and no `href`, `view` or `menu`) now opens its sub entries in a flyout of links, like tree
  folders. Before, the row did nothing. The flyout is a disclosure button with `aria-expanded` and
  `aria-controls` holding a named `<nav>`. Tab enters it from the open row, Tab past the last link
  moves on after the row and closes it, Shift+Tab returns to the row, and Escape or a press on any
  entry closes it.
- `Sidebar`: `menuSide` on rows, action descriptors and `headerButton` / `footerButton` accepts the
  logical sides `inline-start` and `inline-end`, which mirror in right-to-left documents.
- `AIThread` shows a pending assistant row ("Thinking…" or `liveText`, with the shimmer utility)
  while the reply to the last user turn has not started, also while a streamed message has nothing
  visible yet (AI SDK `step-start` or `data-*` parts only, or empty text). `AIMessage`'s new
  `streaming` prop shows a caret on the reply still being written.
- `AIThread` renders AI SDK `reasoning` parts with `AIReasoning`, maps tool approval states
  (`approval-requested`, `approval-responded`, `output-denied`) onto `AITool` statuses, shows
  `source-url` and `source-document` parts as a Sources row and `file` parts as previews, and
  replaces an answered ask-user-question with a compact answer summary.
- `AIThread` and `AIChat` show `suggestions` as follow-ups above the composer after a finished
  assistant turn, also when a system notice follows it (`showFollowUps` turns them off). The empty
  state is a vertically centred greeting with wrapping suggestion chips.
- `AIThread` accepts `error`, `showError` and `onErrorRetry`, and `contentWidth`. `AIChat` forwards
  `AIComposer`'s `submitShortcut` and `toolbar`. New exported types:
  `AIThreadMessageActionsVisibility`, `AIThreadSource` and `AIThreadToolApproval`.
- `AIComposer`: a solid stop button in the send position, and a Queue message action beside it while
  a response runs with a non-empty draft. Steered queue rows carry a localized Steering badge. New
  theme slots: `notice`, `queueBadge` and `queueFiles`. The handle's new `submit(text?)` sends the
  draft, or `text` in its place, the way Enter does (queued while busy), then focuses the editor.
- `Command`: items accept a `description`, rendered as a second line under the label and not
  searched.
- `AITool` supports AI SDK approval flows with the `approval-requested`, `approval-responded` and
  `output-denied` statuses. Calls awaiting approval and denied calls never spin, and
  `approval: { approved: false }` renders as denied. The new
  `getAIToolStatusFromState(part.state)` maps every AI SDK tool part state onto a status.
- `AITool` rows show a readable title (`searchDocs` becomes "Search docs" unless a distinct `title`
  is given), an optional per-call `icon`, a muted one-line input `summary`, a status word and a
  duration. The duration counts live while the call runs and stays after it settles (`duration`, or
  `startedAt` and `completedAt`), also when a lone call grows into a group. Groups read "Search docs
  · 2 calls", overridable with `labels.group(count, tools)`.
- `AITool` values render as highlighted left-to-right JSON with a copy button through Code, or as a
  key/value tree with `valueView="tree"`. One-line strings show quoted, so the output "3" no longer
  reads like the number 3. Long values collapse behind "Show all" past `maxLines` (12) instead of a
  hidden scroll cap. New `labels.showAll` and `labels.showLess`.
- `AIAskUserQuestion`: number keys 1–9 pick options, and Enter continues or submits (Ctrl/Cmd+Enter
  in a textarea), also on a step with no focusable control. Choice questions accept `allowOther`
  (with `otherLabel` and `otherPlaceholder`) for a free-text "Other…" answer, which never
  auto-advances and is kept when you leave the step. Optional unanswered steps show Skip
  (`skipLabel`), and the requester shows above a stronger title.
- `AIAskUserQuestionSummary` and `summarizeAIAskAnswers` render or return a compact question →
  chosen-labels record of a completed request, for the transcript.
- `AIReasoning` shows a live elapsed time while streaming ("Thinking… · 6s") that keeps a steady
  width, and the streaming body is a bounded window that follows the latest lines under a top fade.
  Completed durations read "less than a second" for 0 and "1m 12s" from a minute on.
- `AIThreadToc` has one tab stop, also when its pin stack overflows, with arrow, Home and End keys
  between pins; Tab into the rail lands on the active turn. On touch, the first tap on a pin opens
  its preview and a second tap navigates. The preview shows "Turn N of M", and the new
  `minContainerWidth` prop (default 480) hides the rail in narrow containers.

### Changed

- `NavigationMenu`: keyboard follows the WAI-ARIA disclosure navigation pattern. ArrowLeft and
  ArrowRight along the bar only move focus: an open panel stays open until Enter, Space or
  ArrowDown on another trigger switches to it, Escape closes it or focus leaves the menu. Before,
  arrowing onto another trigger switched panels and arrowing onto a link closed the panel. Inside
  an open panel, ArrowDown and ArrowUp (and the inline arrows, mirrored in right-to-left) now move
  between its links and buttons, wrapping, and Home and End jump to the first and last; disabled
  links, collapsed nested levels and text fields are skipped.

- `AIMessage` and `AIThread`: rich content reads on one scale. Tables, lists, quotes and alerts
  read at the message size and fenced code at 0.9× of it, like inline code (it was fixed at text-sm), and tool
  calls and reasoning in a thread read one step below the message text. `AIMessage` takes a
  `density` (passed by `AIThread` and `AIChat`) that sets table-cell and code-block padding and the
  space between paragraphs, lists and quotes.
- `PopupMenu` / `ContextMenu` / `MenuBar`: radio and selected options inside floating submenus now
  close the whole menu tree when chosen, like every other item. Before, they left every menu open.
  To keep the menu open for multi-select, give the option `attrs: { 'data-menu-keep-open': 'true' }`
  or turn off the menu's `closeOnItemClick`.
- `Menu`: in an inline `Menu`, choosing an item in a submenu flyout now closes the flyout and
  returns focus to the row that opened it. Before, the flyout stayed open.
- `Dialog`: `type="alert"` renders `role="alertdialog"` and ignores outside presses by default. Set
  `closeOnClickOutside` to let a backdrop press dismiss it; Escape still closes it. `confirmation()`
  dialogs are announced as alert dialogs too.
- `Switch`: a `required` switch must now be on, as `Checkbox` already required. An off required
  switch fails Form validation and blocks every native form submit, including double clicks and
  back-to-back `requestSubmit()` calls, where it used to be accepted. When it is the first invalid
  control, the switch takes focus and shows its own error, with no browser validation bubble on top.
  A silent `checkValidity()` moves no focus and shows no error.
- `Button`: a `loading` button stays focusable and renders `aria-busy="true"` and
  `aria-disabled="true"` instead of only ignoring the pointer. Clicks, Enter, Space and the form
  submission of a `type="submit"` button are cancelled until loading ends.
- `Form`: actions are marked `loading` while the form submits instead of being natively disabled, so
  the pressed action keeps keyboard focus rather than dropping it to the page body. An action's own
  `disabled` still renders the native attribute.
- `TextInput`, `PasswordInput` and `PhoneInput` no longer hard-code `data-1p-ignore`, so password
  managers and browser autofill work on them. Pass `inputAttrs={{ 'data-1p-ignore': true }}` to opt
  a `TextInput` or `PasswordInput` out. The library's own search, filter and cell-editor fields keep
  it.
- `PasswordInput`: the 6-character minimum is now the field's own `minLength` rule and is skipped
  for `autocomplete="current-password"`. An empty required password reports one message instead of
  two, and a too-short value shows the localized `passwordTooShort` message instead of the
  validation library's text. `fieldSchemas.password` keeps its 6-character minimum.
- `PinInput`: `onComplete` also runs for every paste or autofill that leaves the code complete,
  even when the code was already complete or unchanged, so pasting a code again retries
  verification. Typing over one cell of a complete code still does not call it.
- `ScrollArea`: `viewportRole` no longer defaults to `'group'`. `viewportRole="presentation"` (or
  `none`) keeps the viewport unnamed and out of the tab order even while it overflows, for scroll
  areas inside a listbox.
- `Tabs` / `Tabbar`: the default selection is the first enabled tab, not the first tab. They move
  the selection by themselves only for their own state. On mount, a `defaultValue` that names a
  disabled or unknown tab selects the first enabled tab. A selected tab that becomes disabled hands
  the selection to the first enabled tab, and removing the selected tab selects its nearest enabled
  neighbour. The new tab is rendered on the server, written back to `bind:value` and reported
  through `onValueChange`. A `value` set by the parent or by another control is never rewritten. If
  it names a disabled tab, that tab is shown. If it names no tab, no tab is selected and `Tabs`
  shows no panel until a tab with that value appears. With no `value` and no `defaultValue`, tabs
  that load after mount select the first enabled tab without calling `onValueChange`.
- `Tabs`: `api.next()` and `api.previous()` skip disabled tabs, as the arrow keys do. `api.goTo()`
  on a disabled tab does nothing.
- `Command`: the default filter ignores accents as well as case ("eclair" finds "Éclair", "deplôy"
  finds the `deploy` keyword) and compares text with `Intl.Collator` in the active I18n locale, so
  each language keeps its own letters (in Spanish, "n" does not find "ñ"). A custom `filter` still
  replaces it.
- `Popover` / `Dialog` / `Overlay` / `FloatingWindow` / `ImageZoom`: because `onOpenChange` runs
  before the state changes, reading the open state inside the callback returns the previous value.
  Use the first argument.
- `Select` / `Combobox` / `TagsInput`: the dropdown list scrolls beyond 240px (`Select`) or 200px
  (`Combobox`, `TagsInput`), or beyond the room left beside the field, whichever is smaller. On a
  short viewport or above an on-screen keyboard the list shrinks instead of running under the
  keyboard or covering its input.
- `Popover`: panel coordinates are rounded to the device pixel grid. Placement uses the visual
  viewport as its boundary and places the panel again once the viewport settles after an on-screen
  keyboard opens, so dropdowns no longer stay under the iOS keyboard. Initial focus (`focusOnOpen`)
  waits until the panel has been placed, so `focusOnOpen="first"` can no longer miss its target
  while the panel is still hidden.
- `Popover`: the Placement (including `inline-start` and `inline-end`), Styling by side and Wrapped
  link examples now appear on the Examples tab of the docs page. The unused `PopoverExamples.svelte`
  was removed.
- `Tooltip` / `HoverCard` / `LinkPreview` / `Popover` (`openOnHover`): hovering is read from a mouse
  or pen only. A touch tap's compatibility mouse events no longer open a tooltip, hover card or
  hover popover, and a disabled trigger (`disabled`, `aria-disabled="true"` or `data-disabled`) no
  longer hover-opens a popover or hover card. A pending hover open checks the pointer is still on
  the trigger when its delay ends, so a dropped `mouseleave` cannot leave a stale open.
- `Tooltip` / `HoverCard` / `LinkPreview` / `Popover` (`openOnHover`): they share one hover warm-up.
  While one is open and for 400 ms after the last one closed, the next opens without its delay (root
  popovers only; submenus keep their delay, and a tooltip inside an open hover card keeps its own).
- `Dialog` drawers: release speed is measured over an 80 ms window and ignores a trailing stationary
  move, so flicks on Android Chrome and 120 Hz screens dismiss again. Sidebar view swipes and
  `Toast` use the same measure. A drag that travels more across the dismiss axis than along it is
  spent before the drawer takes it, so a sideways swipe on a carousel inside a bottom drawer no
  longer starts dismissing it.
- `Toast`: dragging uses the shared pointer drag. Only the primary button drags, a cancelled touch
  or a mouse released outside the window snaps the toast back instead of leaving it stuck, a flick
  toward the edge dismisses it, mostly sideways presses never move it, and the click that ends a
  drag no longer counts as a `closeOnClick` press.
- `useNavigation` (`Tabbar`, `SegmentedControl`, `ToggleButtonGroup`, `ToggleMenu`, `Menu`,
  `MenuBar`, `Breadcrumbs`, the `Calendar` month and year picker, `Sidebar` activity bar): the
  roving tab stop follows the focused element, so inserting, removing or reordering items no longer
  moves it to a different item. Removing the focused item moves focus to the item that took its
  place, including in Safari.
- `useNavigation`: items hidden with CSS (`display: none`, `hidden`, `inert`, such as
  `hidden md:flex` breadcrumbs) are skipped by arrow keys, Home, End and type-ahead, and
  `aria-disabled` items are skipped by default. The container is no longer a Tab stop
  (`tabindex="-1"`), so Tab and Shift+Tab pass through a tab list in one step.
- `useNavigation`: Home, End, Space and Enter stay inside text fields placed in a navigation list
  (such as a `ToggleMenu` toolbar). Left and Right leave the field only when the caret is at that
  edge of the text. Type-ahead continues past disabled matches, the typed text starts over when
  focus leaves the list, and its timer is cleared on destroy. Scrolling to the focused item respects
  reduced motion.
- `useNavigation`: a highlight move among hundreds of items makes at most four attribute writes, and
  mounting checks document order with one linear pass instead of sorting.
- `useListNavigation`: highlighting a row scrolls only the list's own scroll container instead of
  calling `scrollIntoView`, so an inline `Command` or list no longer scrolls the page or a parent
  around it. ArrowUp with nothing highlighted moves to the last option.
- `Field`: `focused` reports focus anywhere inside the field, for every control, including popups
  the field opened, and clears when the focused control is disabled or removed. Leaving the field
  sets `touched`.
- `Field`: description and helper text are linked to the control through `aria-describedby`, ahead
  of the errors. Errors render in one `role="alert"` container. Role-based controls (checkbox,
  switch, radiogroup, slider, combobox) get `aria-required` from Field.
- `Field` / `Select` / `Switch` / `RatingInput`: clicking a non-native label (`labelFor={false}`)
  focuses its control without toggling or opening it. `Select` uses this, so clicking its label no
  longer opens the list. A press on the padding, icon or chips around a text control focuses the
  control, while buttons inside the container keep their own behaviour.
- `Form`: disabled fields, directly or through a disabled group or `Form`, are barred from
  validation.
- `NumberInput` / `PinInput` / `PasswordInput`: range, incomplete-code and minimum-length errors use
  the localized catalog messages. `PasswordInput` applies its `minLength` through the field.
- Inputs: a native form reset (a `type="reset"` button or `form.reset()`) returns every control to
  the value it mounted with, clears its errors and touched state, and calls `onValueChange` once.
  Controls show the restored value one task after the reset, and a reset cancelled by another
  listener leaves them unchanged.
- `Dialog` / `Popover` / `FloatingWindow`: page scroll is locked with a `data-entasis-scroll-lock`
  attribute on `html` and one rule in the Tailwind plugin CSS instead of inline body styles, so a
  lock held by another library is no longer overwritten or released early. The default scroller is
  `html` instead of `body`. A popover opened by touch no longer locks page scroll unless its panel
  is within 20px of the viewport width.
- Tailwind plugin: drag-and-drop base styles (dragging dim, empty-list tint) are rules in the plugin
  CSS rather than a style element injected into the document head, so they sit in the base layer and
  any utility class overrides them.
- Package: the `svelte` peer dependency is now `^5.32.0` (was `^5.0.0`), because attachments and
  `fromAction` need it. CI also runs the packed-library check against Svelte 5.32.0.
- Docs: the Content Security Policy setup for SvelteKit no longer asks you to share a nonce with
  `kit.csp`, which cannot accept one. Create the nonce in `hooks.server`, add it to SvelteKit's
  inline tags in `transformPageChunk`, and send the `Content-Security-Policy` header yourself.
- Id lookups for rendered elements (`Select`, `Command`, `MenuBar`, list navigation,
  `TableOfContents`) resolve through `getRootNode`, so they work inside shadow roots. Prehydration
  inline scripts and the document-level CDN loaders (Map, PhoneInput, Mermaid) keep
  `document.getElementById` on purpose.
- `Button` / `ToggleButton`: a disabled button that is `focusableWhenDisabled` keeps its pointer
  events, so a tooltip can explain why it is unavailable; a natively disabled button still ignores
  them.
- `ToggleButtonGroup`: with `type="single"` (radiogroup) `aria-orientation` follows `orientation`; a
  `type="multiple"` group does not emit it.
- `ScrollArea`: in `hover` mode the scrollbars also show while the area is scrolling, so touch
  scrolling reveals them. In `scroll` mode a bar no longer renders when the content does not
  overflow.
- `ScrollArea`: wheeling over a scrollbar no longer blocks the page at the edge; the wheel is only
  consumed while the viewport can still move that way. Pressing a scrollbar or thumb with the
  primary button no longer moves focus away from the focused control, and scroll snapping on the
  viewport is paused while a thumb is dragged.
- `Confirmation`: Escape and the Android Back gesture cancel the question (`{ confirmed: false }`)
  unless the confirmed action is running. Outside presses still leave it open.
- `Dialog`: with a mouse or pen, a drawer is dragged only from its thumb and header, so dragging
  over the body selects text instead of dismissing the drawer. A finger still drags from anywhere,
  except when text is selected in the panel.
- `Dialog`: a dialog above another one keeps the one beneath moving with its swipe: the parent's
  scale and fade follow the child's drag progress. Non-modal dialogs do not push dialogs beneath
  them back.
- `Popover`: a popover that closes on outside presses now also closes when focus that was inside it
  or on its trigger moves to a control outside it, including when Tab leaves a trigger that the Tab
  bridge does not cover. Set `closeOnFocusOut={false}` to keep the old behaviour. Menus, listboxes,
  modal popovers and hover-opened popovers are unaffected.
- `Popover`: an open tooltip no longer counts as a layer above the popover, so the Tab bridge and
  the modal inert page keep working while a tooltip shows over a control in the panel.
- `HoverCard`: pointing at the trigger again while the card is closing reopens it at once instead of
  waiting out `delay`. A card opened from inside another card keeps the outer card open while the
  pointer is on either, and the outer card closes after the last inner one when the pointer is
  outside every card.
- `LinkPreview`: the trigger link is now `display: inline` with `box-decoration-clone` (it was
  `inline-flex`), so it wraps across lines like text. Pass `wrap={false}` to keep the previous
  single-box layout.
- `Menu`: header, footer and the search field sit outside the `role="menu"` element, so links in
  them are not menu items. The outermost element is a wrapper that holds the class and data
  attributes.
- `Menu`: rows are keyed by identity (an explicit `key`, else their plain text, `href` or
  `textValue`) instead of by position, so focus and the tab stop stay on the same row while items
  before it are inserted or removed.
- `PopupMenu`: initial focus follows how the menu opened. Enter, Space and ArrowDown highlight the
  first row, ArrowUp the last, a pointer press focuses the menu itself, and hovering it open leaves
  focus where it was. ArrowDown and ArrowUp on the button open the menu, including for snippet
  triggers and `ToggleMenu` buttons. `MenuBar` opens a menu on its last row with ArrowUp.
- `PopupMenu` / `ContextMenu` / `MenuBar`: Tab closes the whole menu tree and moves on to the
  control after the trigger, and Shift+Tab closes it and stays on the trigger (`onOpenChange` reason
  `'focus-out'`). Focus returning to a row of a parent menu closes the submenus beside it, and a
  menu that closes no longer takes focus back from a control Tab reached.
- `Menu`: a submenu the pointer opens no longer takes focus from an outside text field. Pressing an
  open submenu row again with the keyboard, or with a second click after a click open, closes it; a
  mouse click after a hover open keeps it open. Filterable menus and submenus do not take focus on a
  hover open, and ArrowLeft out of a submenu returns focus to the parent's search field.
- `Menu` / `PopupMenu` / `MenuBar`: right-to-left menus open submenus on the left, mirror the
  submenu caret and the stacked back arrow, and swap ArrowLeft and ArrowRight, including when the
  direction comes from a `dir` prop on the bar or a subtree, because the portaled panel carries its
  trigger's direction. On Apple platforms an open submenu row omits `aria-expanded` so VoiceOver
  does not announce it twice.
- `ContextMenu`: a long press tolerates 8 px of finger drift, the native `contextmenu` Android sends
  after a long press opens the menu once, a second right-click within 8 px of the anchor closes it,
  the browser's own menu no longer opens over the open panel, and the wrapper disables the iOS touch
  callout.
- `ToggleMenu`: disabled items stay in the arrow-key order and keep the roving tab stop, announcing
  `aria-disabled` instead of leaving the tab order, so a fully disabled toolbar keeps one tab stop.
  The More menu is built from the new checkbox and radio-group items, with labelled groups.
- `Select`: the scrolling viewport is now the listbox itself, and flat options are no longer wrapped
  in an unlabelled `role="group"` (only labelled sets are groups). An open long list no longer needs
  an accessibility allowlist entry.
- `Select`: a list opened by touch is a dropdown below the trigger and leaves page scrolling alone;
  the item-aligned layout is for mouse and keyboard opens. Aligned measurements are rounded to whole
  pixels so browser zoom no longer leaves sub-pixel gaps.
- `Select`: focus moving into the open panel (a touch screen reader's cursor) keeps the list open,
  it closes when focus leaves both the trigger and the panel, Escape on a focused option closes it
  and returns focus to the trigger, and a visually hidden Close button ends the panel.
- `Select`: clicking its label focuses the trigger without opening the list, also for an external
  `<label for>` pointing at the trigger's `id`.
- `Select`: opening a list of a thousand options is about twice as fast: option ids come from a map
  instead of a search per row, rows are a lean markup that reuses `MenuOption`'s theme, and ids no
  longer collide for values such as `a.b` and `a_b`.
- `Combobox` / `TagsInput`: Escape closes the list and keeps focus in the input, and a second Escape
  clears the typed text (it used to blur the input). Choosing an option, Clear and Escape no longer
  drop focus to the page.
- `Combobox` / `TagsInput`: the search box no longer carries the field `name`. A hidden input beside
  it submits the selected value (one per tag for `TagsInput`), so a native `<form>` posts the value
  instead of the typed search text. A field without a `name`, or a disabled one, submits nothing.
- `Combobox` / `TagsInput`: the options list scrolls in a viewport that is itself the listbox, so it
  owns only options and groups with no extra 'Scrollable content' tab stop. The loading, error and
  no-options messages sit beside the listbox, and one persistent live region next to the input
  announces result counts and status after typing settles.
- `Combobox` / `TagsInput`: the default match is case- and accent-insensitive in the active I18n
  locale ("eclair" finds "Éclair"), static lists filter synchronously instead of after a 100 ms
  pause, and options whose values differ only by punctuation keep distinct ids.
- `TagsInput`: removable tags form a toolbar labelled 'Tags' with one tab stop. ArrowLeft at the
  start of the text steps into the tags, the arrows move between them (mirrored in right-to-left
  text), and Backspace or Delete removes the focused tag. With `customTags`, Enter adds the typed
  text instead of the first matching option, and a disabled or read-only field has no remove
  buttons.
- `Command`: `aria-expanded` on the search input follows the results, the empty message is plain
  text announced through a persistent live region that also announces result counts, and
  `onOpenChange` is called as `onOpenChange(open, details)` before the change and can cancel it
  (dialog mode).
- `PhoneInput`: country names, their sort order and the search follow the active I18n locale, and
  match by name, ISO code or dial code ignoring case and accents. The selected country is
  highlighted when the picker opens and again when the search clears, and the empty state is
  announced with result counts through a persistent live region.
- `Form`: disabled fields (directly, or through a disabled `FormGroup` or `Form`) are left out of
  the submitted value, `onSubmit`, `ask()` results and `MultiStepForm` payloads, as in a native
  form. In `InferFormValue`, entries and groups that declare `disabled` become optional keys.
  `validateField(name)` returns false while the field's async validator is pending; use
  `validateAsync` to wait for the result.
- `NumberInput`: now a text input with role `spinbutton` instead of a native number input, so
  separators follow the `locale` prop (default: the i18n locale) rather than the browser. Typed text
  is parsed by locale (`1 234,5` in French, Arabic-Indic, Persian and full-width digits in any
  locale), refused when it cannot be part of a number, and formatted and rounded to `format` on blur
  and Enter. Only complete numbers are published, so intermediate text such as `-` no longer
  publishes null.
- `NumberInput`: `name` moved from the visible input to a hidden input that posts the plain number
  (`1234.5`) to native forms, with `required`, `disabled` and `form` carried over; an empty or
  disabled input posts nothing.
- `NumberInput`: the +/- buttons are out of the tab order (`tabindex="-1"`), point at the input with
  `aria-controls`, repeat while held, keep focus in the input and step by the same amount as the
  arrow keys. The mouse wheel never changes the value unless `wheelStep` is set.
- `PinInput`: spaces, dashes and other separators in typed, pasted and autofilled codes are removed,
  and digits of other numeral systems become ASCII, without a `pasteTransformer`. Controlled values
  go through the same cleanup once.
- `PinInput`: the cells and the input are always left to right, so a code no longer reads reversed
  in right-to-left documents, and the unlabeled input is named by the localized `oneTimeCode`
  message.
- `RadioInput`: the group is one Tab stop (the checked option, else the first enabled one). Arrow
  keys move to the next enabled option and select it, wrapping, with Left and Right swapped in
  right-to-left layouts; Home and End jump to the ends. Tabbing in or focusing never changes the
  selection, arrows with Alt, Ctrl or Meta are left to the browser, and Escape still reaches an
  enclosing `Dialog`, `Popover` or `ask()`. `onValueChange` is typed `(value: Value | null) => void`
  and is called with null when the group is cleared; a `bind:` to a variable typed with values no
  option offers is a type error.
- `Checkbox` / `CheckboxesInput` / `RadioInput`: Enter no longer toggles or selects, including Enter
  with a modifier key and a held Enter. Like a native checkbox it continues the form: inside an
  entasis `Form` it moves to the next field (the last field submits), and inside a plain `<form>` it
  requests the native submission.
- `Checkbox` / `CheckboxesInput` / `RadioInput`: the hidden native inputs sit beside the controls
  instead of inside their buttons, and a required group blocks a native submit while empty. A
  `Checkbox` or `RadioInput` without a `name` no longer submits a generated name.
- `RadioInput` / `CheckboxesInput` / `Checkbox`: options are named by their label text and described
  by their description (`aria-labelledby` and `aria-describedby`) instead of an `aria-label` that
  repeated the text. A description no longer becomes part of the accessible name; it is exposed
  through `aria-describedby`, alongside any `aria-describedby` from `inputAttrs` and the `Field`
  helper and error ids. `aria-required` and `aria-readonly` sit on the radiogroup, and the group
  only references its label when one is rendered.
- `Switch`: now a native button, so Space acts once on release without repeating, a disabled switch
  takes no focus, clicking its label toggles it, and `inputAttrs` is supported. It no longer carries
  `aria-labelledby`.
- `RadioInput` / `CheckboxesInput` / `Checkbox` / `Switch`: option rows use logical start/end
  spacing, so marks sit at the inline start in right-to-left layouts; the `Switch` thumb slides
  toward the inline end.
- `Slider`: each thumb is now a visually hidden native `<input type="range">` inside a styled thumb
  instead of a `button role="slider"`, so VoiceOver and TalkBack adjust gestures work. It also
  replaces the separate hidden inputs: a named slider submits one value per thumb, an unnamed one
  submits nothing. The thumb wrapper is a `span` (theme part `thumb`) and the focus ring follows
  `group-has-[:focus-visible]`.
- `Toast`: timers pause for several independent reasons at once: the pointer over a stack, keyboard
  focus (`:focus-visible`) in it, a press or swipe on a toast, and an inactive window. They resume
  only when none applies. A touch tap is no longer treated as a hover, so it can't leave the stack
  expanded and paused.
- `Toast`: the notification region is always rendered and hosts persistent polite and assertive live
  regions, so announcements work from the first toast. Toasts are announced with their rendered
  title and description, again when updated, and important toasts are assertive. Toasts created in
  the same tick are announced together. Each toast is a labelled `role="group"` (named by its title,
  described by its description) instead of its own `role="status"` or `role="alert"` live region.
- `Toast`: swiping no longer starts from action buttons, the close button, links or
  `data-swipe-ignore` elements. Swipeable toasts use `touch-action: pan-y` (sideways swipes) or
  `pan-x` (vertical swipes) instead of `none`, so the page keeps scrolling across them, and the
  stack stays expanded and paused while a toast is dragged.
- `Tooltip`: opens on focus only when the focus ring shows. Focus from a mouse press or a tap, focus
  returned by a closing dialog or popover, and focus coming back with the window no longer open it.
- `Tooltip`: `onOpenChange` receives `(open, details)` and runs before the tooltip shows or hides,
  with a reason (`trigger-hover`, `trigger-focus`, `trigger-press`, `outside-press`, `escape-key`)
  and `details.cancel()`. It is also an option of the `tooltip()` attachment. A tooltip pushed off
  the surface by another one is told with a close that cannot be cancelled.
- `Accordion`: each trigger button sits inside a real heading element (h2 to h6, from
  `headingLevel`) instead of containing a `role="heading"` div. Panels are `role="region"` labelled
  by their trigger, and triggers carry `id`, `aria-expanded`, `aria-controls` (while the panel
  exists) and `data-index`. A new `heading` theme slot styles the wrapper.
- `Accordion`: arrow-key, Home and End roving between triggers is removed, following the current
  WAI-ARIA guidance. Tab moves between triggers, and arrow keys no longer block page scrolling or
  jump into nested accordions.
- `Accordion`: `onItemOpenChange` runs before the change and receives open-change details in its
  payload (`{ item, index, open, details }`). `details.reason` is `'trigger-press'` or
  `'find-in-page'`, and `details.cancel()` keeps the item as it was, in which case `onValueChange`
  is not called.
- `Collapsible`: `onOpenChange` receives `(open, details)` and runs before the state changes.
  Calling `details.cancel()` keeps it as it was. The reason is `'trigger-press'` or
  `'find-in-page'`. Panel content is wrapped in a bare panel element, and the content slot classes
  and `data-state` sit on the element inside it.
- `Collapsible` / `Accordion`: panels animate their height through the shared disclosure panel,
  which exposes `--disclosure-panel-height`. Duration, delay and easing from the motion slot still
  apply; the preset's slide offsets and opacity no longer do. The closed panel's `aria-controls`
  only points at the panel while it exists in the DOM.
- `Collapsible` / `Accordion`: a disabled item or collapsible is not findable with
  `hiddenUntilFound`. Its closed content stays under plain `hidden`, so the browser's find-in-page
  never opens a panel the user cannot close. The closed `peek` variant keeps its clipped text in the
  accessibility tree (the clip is visual only), while controls below the preview stay inert.
- `Avatar`: the avatar is one image with one name. The root is `role="img"` named by `alt` (default
  `name`), the inner `<img>` has an empty `alt` and the initials are `aria-hidden`, so a loading,
  loaded or failed image reads once. `alt=""` makes the avatar decorative. Prefix and suffix content
  is presentational to assistive technology, so keep interactive controls outside the avatar. The
  delay before a loaded image is revealed is now `revealDelay` (the old behaviour).
- `Meter`: `min` and `max` now set the scale. A segment fills `(value - min) / (max - min)` of the
  track and values are clamped into the scale, so a bar never passes 100% and the indicator text,
  legend percentage, `aria-valuenow` and `aria-valuetext` always agree. Before, the bar filled from
  0 and `aria-valuetext` could contradict `aria-valuenow`.
- `ProgressCircle`: accepts `min` and `max` instead of a fixed 0-100 range. A progressbar has
  `aria-valuetext` and a visually hidden text node with the value text, so NVDA reads its name.
- `Sidebar`: with the sidebar collapsed to icons, a folder's flyout is a disclosure of links rather
  than a menu. The trigger reports `aria-expanded` and `aria-controls` instead of
  `aria-haspopup="menu"`, the panel is a named `<nav>` list of links, nested folders become named
  sub-lists instead of submenu popovers, and no `role="menu"` or `role="menuitem"` is rendered. A
  row's own `onclick` still runs first and `preventDefault()` keeps the flyout open. Action
  dropdowns keep real menu semantics.
- Blocks: the Mega menu and Floating navbar blocks use `NavigationMenu` instead of hand-built
  popovers, gaining hover switching, an animated shared panel and link presses that close the panel.
- `Tabbar`: `onValueChange` now receives one payload, `{ value, reason }`, instead of the tab value.
  `reason` is `user`, or `initial`, `disabled` or `missing` when the tab list selected an enabled
  tab by itself, matching `Tabs`. Read `value` from the payload. The `TabbarValueChangeReason` and
  `TabbarValueChangePayload` types are exported.
- `Popover` / `Dialog`: the `trigger` and `children` snippets, `onAfterOpen` and `onAfterClose`
  receive the narrow `PopoverApi<Payload>` / `DialogApi` instead of the internal state classes, and
  `usePopoverContext()` returns `PopoverApi | null`. Layers, focus scope, safe area, hover tracking
  and swipe machinery are no longer in the public types, so they can change without breaking
  consumers. Code that read those internals no longer type-checks.
- `Popover`: a closed popover no longer builds its layer, focus scope, hover safe area, Tab bridge
  or scroll lock. They are created when it opens and released once its closing transition ends.
  Pages with many closed Selects, date inputs, comboboxes or row menus mount faster: in the
  Chromium benchmark, 300 closed popovers went from about 70 ms to 31 ms, and 200 `DataTable` rows
  with a row menu each from about 180 ms to 90 ms. Opening, closing, nesting and dismissal behave
  as before.
- `Overlay`: `data-open` is now a presence attribute. A closed overlay carries `data-closed` and no
  `data-open`, where it used to carry `data-open="false"`. Selectors like `[data-open='true']`
  become `[data-open]` (or Tailwind's `data-open:` variant). The overlay also carries
  `data-entering` and `data-exiting` while it animates.
- `Sidebar`: collapsible groups, inline submenus and tree branches use the shared disclosure panel
  of `Collapsible` and `Accordion`. Their toggles set `aria-controls` while the panel is rendered
  and carry presence `data-open` and `data-closed`; a submenu toggle used to carry
  `data-open="true"`, so `data-[open=true]:` overrides become `data-open:`. Panels carry
  `data-open` / `data-closed` and `data-entering` / `data-exiting`, expose
  `--disclosure-panel-height` while they animate, and reverse an interrupted open or close from
  where they are. The `motion` slot's duration, delay and easing time the height animation; the old
  slide's opacity fade is gone.
- `Sidebar`: row menus, collapsed flyouts and tooltips open toward the page from either edge. A
  desktop menu with no `menuSide` opens at the `inline-end` of a left sidebar and the
  `inline-start` of a right one; before, it always asked for `right` and only flipped when it ran
  out of room. Its panel and trigger report `data-side` / `data-popup-side` as `inline-end` or
  `inline-start`, not `right`. Tooltips of a right sidebar, or of any sidebar in right-to-left, no
  longer point at the screen edge.
- `Sidebar`: a menu row with `items` and no `href` runs its `onclick` before its submenu toggles,
  both inline and in the icon-collapsed flyout; `event.preventDefault()` in that handler keeps the
  submenu as it was. Before, expanded rows ignored `onclick`.
- `Sidebar`: the docs say that a row has `data-popup-open` while any of its popups is open,
  including its tooltip (every row on the collapsed rail, and every row with `tooltips="always"`).
  Match `[aria-expanded="true"]` to style an open menu or flyout only.
- Skill: the entasis skill documents `onOpenChange(open, details)`, `readOnly`, disabled fields
  being left out of submitted values, `PopoverApi` / `DialogApi` and the styling-hook data
  attributes. Its `Tabbar`, `NavigationMenu`, `Tooltip`, `Select`, `Combobox` and `TagsInput`
  sections match the 0.12 API (one-payload `onValueChange`, `openOnFocus`, Escape keeping focus,
  the new `Tooltip` props).
- `AIThread` spaces a transcript in one rhythm: the rows of a turn (reasoning, tools, text, sources)
  are one fixed gap apart and turns a larger gap apart. Messages rendered by the thread add no
  vertical padding of their own (new `message` theme part; the `item` part gains a `boundary`
  variant).
- `AIThread` gives each turn one action bar, right under the row it closes: reasoning, tools and
  text up to the next user message share it. Its copy takes the whole turn and its retry targets the
  turn's last assistant message. Hovering any row of the turn reveals it, and the bar's reserved
  space stands in for the gap before the next turn. Action rows take layout space instead of
  floating over the next row, and their icons line up with the text edge.
- `AIMessage` user bubbles are neutral grey; the new `color` prop (`messageColor` on `AIThread` and
  `AIChat`) paints a solid bubble in any other role. Prose reads at 14px with a 1.625 line height at
  `normal` size (16px at `large`, 12px at `small`), with headings close to the body.
- `AIThread` and `AIChat`: the new `latest` actions visibility mode keeps the final assistant turn's
  actions visible, also when a system notice follows it, and shows the others on hover or focus;
  touch screens always show them.
- `AIChat` centres the transcript and composer in a reading column set with the new `contentWidth`
  prop and exposed as `--ai-chat-content-width`. `AIThread`'s scroll-to-latest button is a centred
  round button just above whatever sits below the thread.
- `AIChat` shows a conversation error as a row at the failed turn with a Retry button wired to the
  conversation's `retry`, instead of a banner above an empty state. A custom `errorRegion` keeps the
  old placement.
- `AIChatSkeleton` mirrors the real chat (user bubbles, flat assistant lines, a bordered composer
  card, the centred column) and accepts `contentWidth`. The `AIChat` composer band no longer draws a
  rule above the composer card.
- `Markdown`: lists hang-indent, inline code is a readable muted chip at 0.9em with no doubled
  padding, and table cells read at the surrounding text size without forced 200px columns, with an
  edge fade when the table scrolls.
- `AIComposer` is a raised card (raised surface, hairline border, soft lift) that caps its width at
  `--ai-chat-content-width` when an ancestor sets it, and rings only while the editor has focus. On
  a narrow (under 28rem) or touch composer, editor text is 16px, so iOS Safari no longer zooms on
  focus, and footer controls, including the voice mic, grow to 36px.
- `AIComposer`: rejected files show a short localized note that names the file and what to attach
  instead ("notes.txt isn't supported — use images or PDF") and dismisses itself, instead of a
  danger Alert. It sits in an always-mounted `role="status"` region, so each rejection is announced,
  and a repeated rejection restarts its timer. With `fileMultiple={false}`, the limit note reads one
  file.
- `AIComposer` / `RichTextInput`: the / @ $ menus show each item's description as a second line, and
  a file or reference its path, with a leading icon per kind. Inline tokens are tinted by kind:
  commands, mentions and skills each get their own colour.
- `AIModelSelector`: the default trigger is a ghost text button sized to its label that shrinks and
  truncates in a crowded footer, instead of a 176px soft box. A menu whose models share one provider
  shows no provider heading, rows no longer repeat a provider their heading names, and the selected
  row keeps its context-window badge next to the check.
- `AIAskUserQuestion`: required questions show a marker, and a validation error is one
  danger-coloured message under the question instead of red-tinted options. A single question shows
  no step pager, and the default footer has no previous/next arrow buttons.
- `AITool`: rows use `text-sm`, and a single call and a group share the same variant surface. Status
  reads by glyph and word as well as colour, and the spinner takes the info colour. Errors that are
  a string, an Error or MCP text render as one plain sentence, sections are labelled Input, Output
  and Error in words, and the soft variant's tint doubles in dark mode.
- `AIReasoning`: the body is compact, muted small Markdown (12px, tight paragraph spacing, a small
  gap under the trigger) that reads quieter than the answer. Cycled thinking labels keep a steady
  width and only the current one is named.
- `AIThreadToc` paints its rail and visible-range bar, and the active pin is longer and more opaque
  than pins merely in view.

### Deprecated

- `Popover` / `Dialog`: `hasTransitioned` on `PopoverApi` and `DialogApi` is deprecated; read
  `status === 'open'`. The snippet members that echo props are deprecated too: `size`, `position`
  and `offset` on `PopoverApi` (read the props you passed, or `placement` for where the panel
  landed), and `type` and `size` on `DialogApi` (read `computedType` or the props you passed). All
  are kept for one minor.
- `Popover`: the `PopoverState` type is a deprecated alias of `PopoverApi`, kept for one minor.
- `RatingInput`: `readonly` is deprecated in favour of `readOnly` and stays as an alias for one
  minor.
- `Theme`: `lastTooltipClosed` on the theme state is deprecated in favour of `hoverIntent` (the
  shared hover warm-up). It still reads and writes the same close time for one minor.
- `SelectState`: `selectValue(value)` is replaced by `activate(value, event?)`, which also toggles
  in a multiple `Select`; `selectValue` stays one minor.
- `Combobox` / `TagsInput`: `showAllOnFocus` is replaced by `openOnFocus` and kept as an alias for
  one minor.
- `Avatar` / `AvatarGroup`: `delay` is a deprecated alias of `revealDelay`.
- `AIAskUserQuestion`: `previousLabel` is deprecated, because the default footer no longer renders
  previous/next arrow buttons. The step dots and the primary action navigate, and custom footers can
  still call `previous()`.

### Removed

- `Button`: the undocumented `as` prop on `ButtonPrimitiveProps`, which could render an anchor
  without `href`. Pass `href` to render a link.
- Internal `useDrag` utility. `Toast` and `ScrollArea` use `createPointerDrag`.
- `Accordion`: the `accessible` prop. Use `hiddenUntilFound` for find-in-page or `keepMounted` to
  keep state.
- `Collapsible`: the `accessible` and `srOnlyContent` props. Use `hiddenUntilFound` or `keepMounted`
  instead.
- `Meter`: the `steps` prop, which was accepted but never rendered, along with the `Step` type and
  the second `S` generic of `MeterProps`. `MultiStepForm` no longer passes it.
- `AITool`: the `scrollArea`, `scrollViewport`, `scrollContent`, `scrollScrollbar`,
  `scrollScrollbarX` and `scrollThumb` theme slots, because values no longer render in a ScrollArea.
  New slots: `summary`, `meta`, `statusWord`, `errorMessage`, `code`, `codeContainer`, `clamp` and
  `showAll`.

### Fixed

- Drag auto-scroll works again: `Kanban` boards and card lists, `SortableList` and `GanttChart`
  dependency drags scroll their container near its edges in every browser, inside `Tabs` too. The
  auto-scroll listened to a second copy of the drag engine, so only Chromium's narrow native edge
  scrolling ran, and WebKit did not scroll at all.
- `NavigationMenu`: a pointer press focuses the trigger, so in Safari Tab after a click enters the
  panel and ArrowDown moves into it instead of skipping it. Enter or Space on the trigger of a
  hover-opened panel closes it instead of doing nothing. A hover that began just before a press
  no longer reopens the panel a quick second press (or Escape) closed. Tab from a bar entry after
  the open trigger skips that trigger's panel instead of wandering through it and back to the bar,
  and Tab past the last link with nothing after the menu closes the panel.

- `ToggleButtonGroup` / `ToggleButton`: a pressed neutral `outline` toggle keeps the group's
  hairline border and shows its selection with the soft fill, instead of boxing itself off with a
  dark border in a joined group; pressed segments sit above their neighbours so a coloured pressed
  border is never cut.
- `spinnerOverlay` (and so a `loading` `Button`): the overlay takes the host's inner corner radius
  (outer radius minus border width), so the host's background no longer shows at its corners.
- `NavigationMenu`, `Pagination` and the `Tooltip` handoff: while their size animates, content keeps
  the width it settles at instead of re-wrapping at every intermediate width; the animating frame
  clips it. `transitionSize` does this for the `width` and `both` axes (`fixContentWidth: false`
  opts out).
- Child menus and controls follow their owner's `size` and `density`: `ToggleMenu`'s overflow and
  item menus, `Tabbar`'s tab menus and `VideoPlayer`'s settings menu take its `size`; `DataTable`'s
  rows-per-page and cell-editor `Select` take its `density`; `AITool`'s grouped calls and the
  `AIMessageActions` copy-failure alert take their `size`. A `small` `ToggleMenu` opens compact
  menus, and its overflow menu only separates multi-option units (button and radio groups) instead
  of putting a separator between every overflowed item.
- `Tooltip`: a tooltip opened by hover also closes when the pointer moves away from its trigger and
  content without a `mouseleave` reaching the trigger (a trigger re-rendered, moved or removed under
  the pointer, as when a navigation updates the active item of a Sidebar activity bar), so it can no
  longer stay on screen after the pointer has left.
- `Popover`, `Dialog`, `FloatingWindow`: closing again after a reopen that interrupted the closing
  transition now waits for that transition. Before, `status` turned `closed` and `onAfterClose`
  fired while the panel was still fading out, and a `Popover` reopened in that window kept a panel
  without its layer, focus scope and safe area (Svelte logged `derived_inert` in development).
- `Tooltip`: a closing tooltip no longer logs a Svelte `state_proxy_equality_mismatch` warning in
  development, and the removed surface stops receiving state attributes.
- `MenuBar`, `Menu`: switching menus with ArrowRight/ArrowLeft no longer logs a Svelte `derived_inert`
  warning in development. Navigation reads its focused indexes without a derived that outlives the
  menu being closed.
- `PopupMenu`: choosing an item inside a submenu closes every open submenu and the menu together,
  and a floating menu returns focus straight to its trigger. Before, the whole menu tree stayed
  open. Each level closes once, deepest first, so `onOpenChange(false)` fires once per level.
  Submenus follow the menu's `closeOnItemClick`, and an item with `data-menu-keep-open="true"` (or
  inside an element that has it) keeps every level open. A `PopupMenu` placed in another menu's
  header, footer or trigger stays a menu of its own and keeps its own `closeOnItemClick`.
  `ContextMenu`, `MenuBar` and `Tree`'s context-menu surface close the same way: a `MenuBar` menu
  returns focus to its bar trigger, and a `ContextMenu` to the element that had focus before it
  opened.
- `ContextMenu`: `popup.position` now places the menu relative to the pointer, for example
  `popup={{ position: 'top-end' }}` opens it above and before the cursor. The default is still
  `'bottom-start'`, and a responsive record keeps that default below its first breakpoint. Before,
  the component always forced `'bottom-start'` and ignored the documented option.
- `Toast`: calling a `toast` creator with the `id` of a toast that is still on screen no longer
  crashes the Toaster with a duplicate-key error. That toast updates in place and the same handle
  is returned: the new options merge over the old ones (keys you leave out keep their value) and
  its auto-dismiss timer restarts from the full `duration`. A toast re-added while it is still
  animating out, or removed and re-added in the same tick, is replaced: it returns to its slot
  without any swipe offset, enters again and fires its own `onAfterOpen`. A same-tick replacement
  joins a microtask later, once the removal has reached the DOM. Toasts queued before a
  `<Toaster />` mounts merge by id the same way.
- `Toast`: calling a `toast` creator or a toast's `remove()` inside a `$effect` no longer
  subscribes the effect to the Toaster. Showing a toast from an effect used to loop until Svelte
  threw `effect_update_depth_exceeded`.
- `Toast`: auto-dismiss timers now pause while the browser window is blurred or the tab is hidden,
  and resume with the time they had left. Coming back to a background tab no longer dismisses
  every pending toast at once. A toast shown while the window is inactive starts paused, and
  changing a toast's duration while it is hovered no longer starts its countdown under the
  pointer.
- `Toast`: showing a new toast while the pointer is over the toast stack no longer freezes the
  page. The new toast's timer starts paused, like the rest of the hovered stack. The underlying
  safe-area fix also covers `Popover` and `Sidebar` references attached while their safe area is
  active.
- `Menu`: pointing at an inline menu no longer takes keys typed elsewhere. Space or Enter in
  another field no longer clicks the hovered row, and arrow keys no longer pull focus out of a text
  field. While nothing on the page has focus, the arrow keys and Home/End still move focus into the
  hovered menu, and ArrowLeft on a top-level menu is no longer blocked, so the page can still
  scroll horizontally.
- `Menu`: Enter, Space, the arrow keys and type-ahead act on the row that has keyboard focus, even
  when the pointer highlights another row. Before, Enter clicked the hovered row instead of the
  focused one. A popup menu whose panel has focus still activates the highlighted row, which
  `aria-activedescendant` names.
- `Menu`: right-to-left menus mirror the submenu arrows: ArrowLeft opens a submenu and ArrowRight
  closes it. In a right-to-left `MenuBar`, ArrowLeft on a submenu row now opens it; before, those
  submenus could not be opened from the keyboard.
- `SegmentedControl`, `Tabbar`, `ToggleButtonGroup`, `ToggleMenu`, `Breadcrumbs`, `Menu`, `MenuBar`
  and the other roving-focus groups ignore Arrow, Home, End, Enter and Space pressed with Alt, Ctrl
  or Meta. Browser shortcuts such as Alt+ArrowLeft (Back) work again, and `SegmentedControl` no
  longer changes value on Alt+Arrow. Shift+Arrow still navigates. In `MenuBar`, modified arrows no
  longer switch or open menus, inside an open menu or on the bar's triggers (Enter and Space on a
  trigger still open its menu). In the `Calendar` month and year chooser, modified
  ArrowLeft/ArrowRight no longer move between the month and year lists.
- `Popover`: the hover `delay` now applies. Popovers with `openOnHover` used to open instantly and
  ignore the 100 ms default. A popover that starts open (`defaultOpen`) now opens on hover again
  after it closes. Closing a popover by click, tap or Escape while a hover open is still waiting on
  `delay` no longer lets that hover reopen it, and a pointer that re-enters an already open trigger
  starts no hover delay.
- `Popover`: removing the trigger, or a `ref` element leaving the document (including a `bind:this`
  `ref` that unmounts), closes an open popover and calls `onOpenChange(false)`, also under reduced
  motion or zero-duration transitions. Before, the panel stayed open against a detached element. The
  popover stays closed when the element returns. A trigger re-rendered as a new element keeps the
  popover open, and unmounting the whole Popover reports nothing.
- `Confirmation`: if `onConfirm` throws or rejects, the loading state ends and the dialog stays open
  with Cancel enabled. Before, the user was trapped behind a disabled Cancel. The error still
  propagates like any event handler error.
- `Confirmation`: unmounting `<Confirmation />` resolves the requests it is still showing as
  `{ confirmed: false }`. Before, `await confirmation()` hung forever after a layout remount. A
  confirmed request whose `onConfirm` is still running when the host unmounts resolves with
  `{ confirmed: true, result }` once the action finishes, or `{ confirmed: false }` if it fails.
- `Dialog`: `data-type` on the root and the panel reports the resolved type. Modals collapsed into
  mobile sheets and responsive `type` records now get their rounded edge corners from
  `--drawer-edge-radius`.
- `Switch`: inside a plain `<form>` (for example a SvelteKit form action) the switch was never
  submitted, because its hidden checkbox had no `checked` state and its value was the stringified
  boolean. It now submits `name=inputValue` while on and carries `required`.
- `Switch`: an untouched required switch and one turned off report the same error instead of
  validation-library text. `fieldSchemas.required.switch` now accepts `null`.
- `Slider`: an array value keeps its array shape with a single thumb. `[25]` becomes `[26]` on
  ArrowRight or a track press instead of `26`, a Form holds and submits `[25]`, and `slider-range`
  entries accept one or more values.
- `Slider`: a range or multi-thumb value in a `Form` bound with `bind:value` to `$state` no longer
  loops with 'Maximum update depth exceeded'.
- `Slider`: in right-to-left layouts the horizontal track now mirrors like the arrow keys. The
  minimum sits at the right edge. Thumbs, the filled range, marks, contained ticks, and the
  contained label and value are placed from the inline start, and pointer presses and drags read
  their value from the right edge. Centring follows the slider's own direction, so an ltr slider
  inside a right-to-left page (for example an English `I18n` region in an Arabic app) keeps its
  thumbs, marks and ticks on their values. An `I18n` direction that the document does not carry (for
  example `manageDocument={false}`) is applied to the whole slider field through its `dir`
  attribute, so the label, description and errors mirror with the track.
- `CheckboxesInput`, `RadioInput`: option ids were built from `name` and value, so two fields
  sharing a `name` duplicated them and values with spaces made them invalid. Each option button now
  gets `<field id>-option-<index>`, and its hidden input gets `<option id>-input`.
- Tooling: every end-to-end suite now follows `E2E_PORT`; five of them dialled port 4173 regardless.
  Two tests that pressed a control before hydration now wait for the page to settle.
- `Button`: a `loading` button now cancels Enter and Space clicks on the element itself, before any
  other listener runs. A loading button used as a `Popover` or menu trigger
  (`{@attach popover.trigger}`) no longer opens its panel. A loading link inside portaled content
  (`Popover`, `Dialog`, `Drawer`) no longer navigates through the SvelteKit router.
- `PinInput`: pasting a full code after a partial entry, or onto a complete code, now replaces the
  whole value instead of splicing the paste in at the caret. Typing 12 and then pasting 123456 used
  to give 121234. The check runs after `pasteTransformer`, so a cleaned `123-456` also replaces the
  code.
- `PinInput`: Japanese and Chinese input methods now work. The field waits for the composition to
  end before checking and committing the text, shows the in-progress text in the cells, and commits
  full-width digits and letters (１２３) as ASCII. Rejected or cancelled compositions restore the
  previous code and selection. While a composition is in progress the hidden native input turns
  fully transparent, so the input method's underline or highlight is not drawn over the first cell.
  Theme authors can restyle this with the new `composing` variant of the `input` theme slot.
- `ScrollArea`: a viewport whose content fits is no longer announced as a "Scrollable content" group
  or kept focusable with `tabindex="-1"`. It takes the group role, its name and a tab stop only
  while it overflows, or keeps the `label` and `viewportRole` you pass. A focused viewport whose
  content stops overflowing keeps its role, name and `tabindex="-1"` until it loses focus, so
  keyboard focus no longer drops to the page.
- `ScrollArea`: the custom scrollbars and the edge-scroll arrows are hidden from assistive
  technology (`aria-hidden="true"`) instead of exposing an unreachable `role="scrollbar"`.
- `Select`: the listbox now owns only groups and options. Group separators are
  `role="presentation"`, and the scroll viewport adds no group, tab stop or scrollbar inside it.
- `Select`: a disabled Select no longer submits its value in native form posts; its hidden input is
  disabled with the control.
- `PhoneInput`: "No countries found" is announced as a polite `role="status"` outside the country
  listbox instead of sitting inside it. The status stays mounted while countries match, so screen
  readers announce the message when it appears. The country search reports `aria-expanded="false"`
  while no country matches.
- `Meter`: exposes `role="meter"` with `aria-valuemin`, `aria-valuemax`, a clamped `aria-valuenow`
  and the indicator text as `aria-valuetext`. It is named by `label` and described by `helper` and
  `description`. Stacked segments become a group named by `label` and described by `helper` and
  `description`, with one meter per segment, named by the segment's `label`. The rendered label is
  `role="presentation"`, which completes the NVDA naming workaround for labels inside a meter.
- `Tabs`: no panel is shown next to a tab list with nothing selected. Before, it showed panel 0 for
  an unknown value, or the last shown panel when the selected tab was removed and no enabled tab
  remained.
- `Tabbar`: the sliding indicator is hidden (`hidden`, `data-ready="false"`, no inline style) when
  no tab is selected, instead of staying on the last selected tab. `SegmentedControl`'s indicator,
  which uses the same helper, now snaps back into place before it animates again.
- `Tabbar`: a key pressed while a disabled tab has focus, for example a disabled link tab that was
  clicked, no longer selects that tab.
- `Stepper`: when `value` moves outside its items, every panel is hidden and the last measured
  height is dropped. The next step then appears in place instead of sliding in.
- `Command`: the default search now finds Arabic and Hebrew labels written with vowel marks
  (tashkeel, shadda, niqqud) when the query is typed without them, and the other way round.
- `Dialog` / `Popover` / `FloatingWindow` / `Overlay`: `onAfterOpen` and `onAfterClose` fire exactly
  once per open and close even when no transition plays (`defaultOpen`, open on mount, hydration,
  reduced motion), and outside presses dismiss such overlays. `Confirmation` no longer needs its
  mount-then-open delay.
- `Popover`: a click on a popover opened by hover keeps it open instead of closing it. The
  leave-to-close safe area applies only to hover-opened popovers, and a hover-opened popover no
  longer locks page scroll. Pressing the trigger of a hover-opened popover through `popover.open()`
  (such as a menu submenu trigger) pins it open, as `toggle()` already did.
- `Popover`: with several triggers, the panel anchors to the one that was pressed and returns focus
  to it. Removing the trigger that opened a popover closes it, reported as `trigger-unmount`. A
  programmatic open returns focus to the element that had it, which also fixes focus dropping to the
  body when the `PhoneInput` country picker closes with Escape.
- `Popover` / `Dialog` / `Toast` / `Confirmation` / `Sidebar` activity bar / tree nodes: a consumer
  `onclick` that calls `event.preventDefault()` skips the built-in behaviour, so a loading `Button`
  used as a snippet trigger no longer opens its popover.
- `Popover`: a finger that starts scrolling the page outside a non-modal popover no longer dismisses
  it (a tap does), and a deliberate outside click during the opening animation counts.
- `Popover` / `Select` / `Combobox` / `TagsInput`: menus, listboxes, trees and grids render a plain
  wrapper instead of an unnamed dialog element. The trigger's `aria-controls` points at the
  `role="menu"` (or listbox) element, which is labelled by its trigger, and the `Select`, `Combobox`
  and `TagsInput` triggers use `aria-haspopup="listbox"`.
- `Popover`: Escape after a click on the trigger returns focus to the trigger in Safari, where
  clicking a button does not focus it.
- `PopupMenu`: cancelling the item-press close from `onOpenChange` keeps the whole menu tree as it
  was. Open submenus stay open and focus stays inside the menu. The root is asked first, then
  submenus close deepest first.
- `Dialog`: focus goes back to the element that opened it after Escape, backdrop or close-button
  closes. The page behind the dialog is released from `inert` before focus returns, so this also
  holds for dialogs with a closing animation.
- `Dialog` / `Confirmation`: closing a `Confirmation` that was opened from inside a `Dialog` returns
  focus to the button that asked for it. The `Dialog` beneath no longer moves focus to its first
  field when it becomes the top layer again, so focus no longer ends up on the page body.
- `Dialog` / `Popover`: when the control that opened an overlay is gone or disabled (a menu item
  that opened a dialog), focus returns to the last element that had it inside the dialog beneath,
  else to the most recent element still on the page, instead of falling to the page body. A focused
  SVG element outside a closing overlay keeps its focus.
- `Dialog` / `Popover`: closing with Escape or from the keyboard returns focus to the trigger with a
  visible focus ring, in Safari and Firefox as well. In Safari a focused text field is blurred
  before the overlay unmounts so the page no longer jumps.
- `Dialog` / `Confirmation`: Tab and Shift+Tab inside a modal move focus through every tabbable
  control and wrap at both ends in every browser. In Safari without Full Keyboard Access, Tab used
  to skip buttons and leave an open alert dialog for the page body. A popover panel opened from
  inside a dialog keeps its own Tab order, and when the popover trigger is the last control of the
  dialog, Tab past the end of the open panel wraps to the dialog's first control.
- `Popover`: a popover opened from a trigger is reachable from the keyboard. Tab on the open trigger
  enters the panel, Tab past its last control continues with the next control after the trigger and
  closes the popover (reported as reason `focus-out`), and Shift+Tab on its first control returns to
  the trigger. When nothing follows the trigger, Tab is left to the browser so it cannot loop.
  Menus, listboxes, trees, grids, hover-opened popovers and popovers anchored to a `ref` keep their
  own focus handling. Tab from the text field of a date, time, color or phone input moves on to the
  next field instead of entering the open picker.
- `Dialog` / `Popover`: closing through the bound or controlled `open` prop no longer reuses the
  details of the change that opened them (a spurious keyboard focus ring on the trigger, a stale
  `focusOnClose` argument, or a skipped focus restore).
- `Popover`: in right-to-left documents, floating panels (`Select`, `PopupMenu`, `Popover`) no
  longer render at the viewport's right edge instead of beside their trigger. Their `start`
  alignment sits on the right and the scale animation grows from the corner nearest the trigger.
- `Popover`: content that resizes while the opening animation plays no longer leaves the panel
  misplaced; the panel is placed again once the animation ends. A panel whose trigger has scrolled
  out of its container is hidden and marked `data-anchor-hidden` instead of floating over unrelated
  content.
- `Popover`: the entrance animation no longer slides in diagonally after the panel previously opened
  on the other axis, and the exit and scale origin follow a flip that happens while the panel is
  open. A trigger shared by several popovers (a menu and its tooltip) keeps `data-popup-side` while
  any of them is placed.
- `Popover` with `anchorTo="line"`: the panel anchors to the wrapped line nearest the pointer even
  when the link's lines overlap horizontally (it always used the last line unless the lines were
  disjoint). The anchored line follows the reference when the page or a scroll ancestor scrolls
  while the popover is open, a tap anchors to the tapped line, and a keyboard open after a hover or
  tap takes the first or last line instead of a stale pointer point.
- `PopupMenu`: submenus (`fallbackAxisSide`) with no room beside their menu fall back to the cross
  axis below their row and slide into the viewport. They no longer flip above the row and cover the
  parent menu. Reopening a menu from the keyboard while the pointer rests where a submenu row
  appears no longer opens that submenu and moves focus into it.
- `ScrollArea`: dragging a scrollbar thumb ends when the pointer is cancelled or lost, and a mouse
  released outside the window no longer leaves the drag stuck.
- Press-and-hold stepper buttons: keyboard and screen-reader activations always step, including
  after a touch hold on the same button. A mouse or pen press whose release was lost outside the
  window stops when the pointer re-enters the button instead of repeating until the next
  `pointerup`.
- `Breadcrumbs` / `Tabbar` / `Sidebar` / `Menu` / `MenuBar` and similar roving-tab-stop lists: the
  single Tab stop moves to the next visible item when the item holding it is hidden with a class, an
  inline style or a media query after mount, so Tab no longer skips the whole list.
- `useListNavigation`: options with values such as `a.b` and `a_b` get distinct ids through
  `nav.optionId`, so `aria-activedescendant` no longer points at the wrong option. `Select`'s id
  lookup is constant-time instead of scanning the list.
- `useListNavigation`: `pointerHighlight` ignores `pointermove` events whose coordinates have not
  changed, so Safari no longer snaps the keyboard highlight to the option that scrolls under a
  resting cursor.
- `useListNavigation`: when the query changes, the list scrolls back to the top and the first match
  is highlighted and in view, even after the user had scrolled, with nothing highlighted, or when
  the previously highlighted option was filtered out. The selected value (`anchor`) is highlighted
  even when the options load after the list has opened. Scrolling works in layout space, so the
  highlighted option is fully visible while a popover is still animating open (`PhoneInput` country
  picker, `Select`, `Combobox`).
- `Field`: a required `Switch` or `Checkbox` that is off, a required email left empty, and other
  empty required fields show a localized message instead of 'Invalid value' or raw validation text
  such as 'Invalid type: Expected string but received null'. A validation error shown in a field is
  written again in the new language when the locale changes; errors set by the app are left
  untouched.
- `Field`: `bind:focused` no longer stays true when a focused control becomes disabled or is removed
  (Chromium sends no blur in those cases). Pressing text inside a field, such as its description,
  clears `focused` and `data-focused` and sets `touched`, while buttons and controls inside the
  field keep the focus. Moving focus between parts of a field, for example from the input to a
  suffix button, no longer clears them.
- `RichTextInput`: a read-only editor is no longer editable: it is not content-editable, stays
  focusable and hides its fixed toolbar. A read-only `CalendarInput`, `DateSelectorInput`,
  `ColorPickerInput` and `FileInput` no longer change what they display or open the file chooser
  while the field value stays unchanged.
- `Rating` / `Switch` / `Select`: turning `readOnly` or `required` off no longer leaves
  `aria-readonly` or `aria-required` stuck.
- `Switch`: clicking the inline label text focuses the switch without toggling it, like the other
  non-native labels. `Slider`: every thumb of a range exposes `aria-readonly` while the field is
  read-only, not only the first.
- `Switch` / `Checkbox` and the other choice controls no longer go out of sync with their hidden
  inputs after a native form reset. A switch used to stay on while its form value had been cleared.
  A native form reset also clears uncommitted search text in `Combobox` and `TagsInput`.
- Inputs: controls that take a `form` prop no longer turn buttons without a type into submit buttons
  of the named form. Only inputs, selects, textareas and buttons that explicitly submit or reset get
  the attribute.
- `Dialog` / `Popover`: Escape and outside presses are heard on the document the panel lives in, so
  panels rendered into an iframe dismiss correctly. A third-party scroll lock on `html` or `body` no
  longer leaves the page locked after close, and clearing it while a dialog is open no longer
  unlocks the page. The lock keeps the page width when `scrollbar-gutter` does not reserve the
  hidden scrollbar's room: it measures after applying and pads the scrollbar's width instead.
- `ListNavigation`: scrolling the highlighted option into view finds options inside a shadow root.
  In a shadow root, `Select` scroll-wheel and touch scrolling inside an open list now work, and
  `Select`, `MenuBar` and `Command` look up their portaled options and menus there.
  `TableOfContents` resolves heading ids in the tree it renders in, so generated ids no longer
  collide.
- `Theme`: turning `transitionOnChange` off after mount no longer leaves a
  `* { transition: none !important }` style in the document head.
- `Button`: a second click on a loading button no longer falls through to the page beneath. The
  loading variant no longer sets `pointer-events: none`, so the click lands on the button, is
  cancelled, and keyboard focus stays on it. The `link` variant no longer underlines on hover while
  the button is loading or disabled with `focusableWhenDisabled`.
- `ToggleButtonGroup`: the group element is no longer a Tab stop. Tab lands on the first pressed
  button (the first enabled one when nothing is pressed), Shift+Tab leaves the group in one step,
  and a disabled group has no tabbable element. Buttons that are `focusableWhenDisabled` stay in the
  arrow-key order.
- `SegmentedControl`: only an arrow, Home or End key press selects. Tabbing in no longer changes the
  value when the selected item is disabled or no item matches. Alt, Ctrl or Meta with an arrow is
  left to the browser.
- `SegmentedControl`: a control with one disabled item no longer hangs the page. `useNavigation`'s
  mutation observer ignores writes that leave an attribute unchanged, which also protects other
  navigation lists.
- `ScrollArea`: horizontal scrolling works in right-to-left layouts, including after a runtime
  writing-direction change (a `dir` flip on the page or a wrapper, or a locale switch). The thumb
  starts at the inline start, dragging and track clicks write a negative `scrollLeft`, the
  scrollbars use logical placement (`end-0`/`start-0`), and each bar is inset by the other's
  thickness at the corner.
- `ScrollArea`: the thumb size updates when content grows or shrinks while the area already
  overflows, and one scroll session causes two state writes instead of one per event. While WebKit
  rubber-bands past either end, the thumb shrinks (minimum 18px) and stays pinned to that edge
  instead of leaving its track.
- `Dialog`: the default close button has an accessible name (Close, translated), and a dialog with
  no title or description no longer shows a close button when `closable` is false.
- `Dialog`: horizontal scrollers inside left and right drawers claim the swipe correctly in
  right-to-left layouts. The drag thumb's touch target no longer overflows the panel edge, which
  gave side drawers phantom horizontal scroll in right-to-left layouts (and top drawers vertical
  scroll) and made inner-scroll detection claim body swipes.
- `Dialog`: a drag no longer dismisses a drawer with `swipeToDismiss={false}` (or
  `closable={false}`) when its `snapPoints` resolve to no usable point. A snap-point sheet keeps its
  body scroll lock below the largest point after the opening transition.
- `Popover`: a modal `Dialog` or confirmation opened from the panel (rendered outside it) no longer
  closes the popover, which stays open underneath and gets focus back when the dialog closes. A
  tooltip shown over a control inside a modal popover is no longer made inert, so it can be hovered
  and read by assistive technology.
- `Popover`: `closeOnFocusOut={false}` also keeps the popover open when Tab leaves its last control,
  which previously closed it through the Tab bridge.
- `Menu`: ArrowLeft (ArrowRight in right-to-left text) closes a first-level submenu of an inline
  `Menu` and returns focus to its row. A row whose text changes when pressed (Mute becoming Unmute)
  keeps its element and focus. A stacked (mobile sheet) menu opened from a right-to-left subtree
  carries that direction, so carets, the back arrow and the arrow keys mirror.
- `MenuBar`: closing a menu after Tab or a click in another field no longer pulls focus back to the
  menu's trigger, and arrow-key direction follows a page direction changed at runtime instead of
  staying cached from first use.
- `ContextMenu`: a second right-click on the spot a menu is anchored to closes it in real browsers,
  where the press used to dismiss the menu and the same click reopened it. Opening with Shift+F10 or
  the ContextMenu key highlights the first row instead of focusing the menu container.
- `PopupMenu`: an earlier keyboard open that was closed from code or cancelled no longer changes
  where the next pointer open puts focus.
- `Tree`: the context menu stays open when a checkbox, radio or `closeOnClick: false` row is
  pressed.
- `Select`: Space continues a type-ahead search instead of selecting the highlighted option (typing
  `united s` reaches United States and the list stays open); typing on a closed trigger picks the
  matching option like a native select, without opening; the typed text is forgotten when the list
  closes.
- `Select`: a list opened from outside (`open` or `defaultOpen`) measures its own item-aligned
  position each time instead of reusing the previous open's size and scroll, moves focus to the
  trigger so Escape, arrow keys and clicking away dismiss and drive it, and a touch open no longer
  leaves the next external open as a dropdown.
- `TagsInput`: removing a tag with Enter or Space on its remove button keeps keyboard focus in the
  field instead of dropping it to the page.
- `Combobox` / `TagsInput`: `aria-invalid` clears when an async error disappears and the list
  closes.
- `Form`: `FormFieldRenderer` entries follow later changes of their `errors` property instead of
  reading it once.
- `Form`: with an async validator, a form that disables itself while submitting (`disabled` bound to
  `form.loading`) stops the submit when the validator fails, instead of submitting the rejected
  value. The first invalid field is focused once loading ends. When a radio group is invalid after a
  submit, focus goes to its checked option instead of the first one.
- `MultiStepForm` / `ask()`: the pressed Next, Submit or Confirm button no longer becomes natively
  disabled while the form submits, so keyboard focus stays on it instead of dropping to the page
  body.
- `NumberInput`: the increase and decrease buttons no longer submit a surrounding native form, so
  pressing Enter in the input submits without changing the value. `inputAttrs.inputmode` overrides
  the derived keyboard hint.
- `PinInput`: the cells follow the caret when the input lives inside a shadow root. `onRejectInput`
  fires when a typed key is refused by the pattern, and formatted autofill such as 123-456 is no
  longer truncated by the browser before separators are stripped.
- `Checkbox`: a mixed (indeterminate) checkbox that already holds true turns off when clicked
  instead of doing nothing.
- `Slider`: the track group is named by the rendered label whenever there is one, including snippet
  labels and the contained layout, instead of only for plain-text labels.
- `Slider`: the thumb focus ring no longer lights every thumb when the slider sits inside an element
  with the Tailwind class `group`; the thumb is a named group (`group/slider-thumb`). With the first
  thumb disabled through `thumbDisabled`, the label, the field's focus target and error focus use
  the first enabled thumb. A read-only range slider with `dragRange` no longer shows the grab cursor
  or captures presses on the selected range.
- `Toast`: dismissing the focused toast, or having it pushed past `visibleToasts`, no longer drops
  focus to the page. Focus moves to the nearest visible toast, else back to the element focused
  before F6, else to the notification region. Pressing F6 with no toast on screen no longer moves
  focus into the empty region, and the element F6 left is forgotten once focus moves elsewhere on
  its own.
- `Toast`: the `Toaster` `direction` prop was declared but did nothing. It sets `dir` on the
  notification region.
- `Toast`: focus on the notification region (where F6 lands) holds every stack's timers until focus
  moves on. Dismissing a toast with the mouse or touch no longer leaves keyboard-style focus on the
  region, which kept every later toast from timing out; only keyboard focus holds the region's
  timers.
- `Tooltip`: after a real mouse click or tap on a trigger, the shared tooltip surface stopped
  showing any tooltip until reload. Tapping a trigger on a touch device showed the tooltip through
  focus and left it open.
- `Tooltip`: the shared surface reopens for later hovers after it was dismissed with Escape or an
  outside press, where it used to stay blank for the rest of the page. A pointer left resting on
  tooltip content no longer keeps the next tooltip open after the first one closed another way, and
  a click from code on an unfocused trigger no longer blocks the tooltip on later keyboard focus.
- `Tooltip`: moving between triggers while the previous tooltip is still opening calls `onAfterOpen`
  once for the new tooltip.
- `Tabbar` / `Tabs`: with `activateOnFocus={false}`, tabs that have an `href` select on click and on
  Space (Enter already worked through the anchor click), reporting `onValueChange` with reason
  `'user'`. Navigation is not prevented.
- `Collapsible`: the `accessible` and `srOnlyContent` props no longer render closed content visibly.
  The `peek` variant makes links and controls below its visible preview inert while closed, so Tab
  never lands on clipped content.
- `Accordion`: collapsed panels are no longer copied into screen-reader-only text that was read
  aloud and tabbable. `disabledKey` accepts optional boolean properties and any key of loosely typed
  items.
- `Avatar`: a failed image no longer announces both the broken image's alt text and the initials,
  and an avatar without `src` is announced by its name rather than as its initials. The bindable
  `loading` flag is no longer read inside the image attachment effect, which could re-run the effect
  in a loop.
- `NavigationMenu`: Escape returns focus to the trigger after a pointer-opened panel in browsers
  that do not focus buttons on click (Safari), and the item list wraps instead of clipping its last
  items in a narrow container.
- `Popover`: attaching another trigger to a closed popover shared by many triggers (`triggerFor`
  rows) no longer rewrites the ARIA attributes of every other trigger.
- `Popover` / `Dialog` / `Tooltip`: a closing panel reports `data-closed` and `data-exiting` while
  its exit transition plays. Before, the attributes stayed as they were when the panel was open,
  because Svelte pauses an outroing block's template effects.
- `Tooltip`: when a tooltip shares a trigger with a `Dialog`, `Select` or `Combobox`, the tooltip
  closing no longer removes `data-popup-open` from that trigger while the dialog or list is still
  open.
- `Sidebar`: tooltips on collapsed rows, sub-rows, tree nodes and the activity bar pick their side
  when they open, so they still face the page after a runtime `dir` change.
- `TimeInput` / `DateInput`: the MCP documentation covers `readOnly` and `disabled`, and
  `TimeInput`'s page has an import, a usage example and a props list.
- `AIThread`: the scroll-to-latest button appears as soon as you scroll away from the end by wheel,
  trackpad, keyboard or scrollbar. Before, only a programmatic scroll showed it.
- `AIThread` no longer triggers "ResizeObserver loop completed with undelivered notifications" when
  rows mount or unmount while the virtualizer re-measures a pinned, streaming transcript.
- `AIThread`: a files-only user message no longer moves the previous assistant turn's tool calls
  below the upload.
- `AIMessage`: bubble tails point the right way in right-to-left layouts, and on narrow threads
  bubbles and the table of contents gutter no longer squeeze messages to half the width.
- `AIMessageActions` never wraps: the row is as wide as its buttons, so Copy and Edit stay on one
  line under a one-word message. A failed action's error shows after the button row and stays
  visible while the row is hover-hidden. Icon buttons show their name as a tooltip, error messages
  are localized, and `setAIMessageActionsTheme` / `<Theme components>` overrides apply.
- `Markdown`: table cells with no explicit column alignment follow the logical start in
  right-to-left layouts; centre and right columns keep their alignment.
- Docs: the /components/ai-shimmer URL redirects to /utilities/shimmer instead of returning a 404.
- `AIComposer`: the editor keeps focus after a send that started in the composer (Enter, the send
  button including in Safari, the Queue button, or committing a queued edit), so the next message no
  longer lands on `<body>` or appends to the previous draft. `focus()` called right after a parent
  fills the input (an `AISuggestion` pick in fill mode, or an `AIChat` suggestion) places the caret
  after the new text.
- `AIComposer`: at phone width the footer no longer overlaps; the attach button, a truncated model
  name and the send or stop button fit inside the composer, and the voice button no longer renders a
  visible label above the mic. Long queued messages truncate instead of pushing their actions past
  the edge, Escape cancels editing a queued message, and the queued-file count and failure fallbacks
  are translated.
- `AIFilePreview`, `AIModelSelector`, `AISuggestion`: `set*Theme` and `<Theme components>` overrides
  apply again; each component reads the same kebab-case key it registers.
- `Command`: a highlighted row keeps its own text colour on a `bg-selected-muted` fill, instead of a
  dimmer ink that looked disabled in dark mode. This covers the `AIComposer` / @ $ menus.
- `setAIReasoningTheme`, `setAIThreadTocTheme` and `setAIAskUserQuestionTheme` overrides apply; the
  set and use calls registered under different context keys.
- `AITool`, `AIReasoning`, `AIAskUserQuestion` and `AIThreadToc` no longer show hard-coded English.
  Placeholders, file rejection and submit errors, value-tree words, "+N more" and the TOC pin names
  ("Scroll to …" and the file count) come from the i18n catalog in all 8 locales.
- `AIAskUserQuestion`: when Enter or auto-advance moves to the next step, focus moves to that step's
  first control, so number keys and Enter keep working through the flow. A file question's error is
  linked to a group named by the question (`aria-describedby`), which gets `data-invalid` while the
  error shows, and the dev-mode `binding_property_non_reactive` warning no longer appears for each
  step.
- `AIComposer`: cancelling a queued-message edit, with Escape or its cancel button, keeps focus in the
  editor instead of dropping it to `<body>`.
- `AIAskUserQuestion`: a number key that picks an option while focus is on the options moves focus
  and the Tab stop to the picked option, so Space and Tab act on it next. The step dots, the way
  back to an earlier question, are 24px pointer targets around the same 8px dot.
- `AIReasoning`: the default trigger is about 28px tall instead of 36px.
- `AIThread` / `AIChat`: follow-up suggestions are one row that scrolls sideways with an edge fade
  instead of wrapping onto several rows on a phone.

## 0.11.0 — 2026-10-10

### Added

- `Form` / `ask()`: app-defined input types. An app augments `FormInputRegistry` in
  `entasis/form` with each type's value and entry props, and registers its component with
  `registerFormInputs({ money: { component, isEmpty?, validate? } })`. Entries then name the type
  like a built-in one, `{ type: 'money', label: 'Price', required: true }`, as plain data that
  serializes, in every Form, group and ask() dialog. Form wraps the component in Field and hands
  it the field it registered, typed from the registry (`FormInputComponentProps<'money'>`); the
  value takes part in binding, visibility, validation, submission and `InferFormValue`, and
  `required` uses the type's `isEmpty`.

## 0.10.2 — 2026-10-07

### Added

- `Sidebar`: submenu entries (`SidebarMenuSubEntry`) carry the row features top-level entries
  have. `action` pins a `SidebarMenuActionDescriptor` or snippet to the sub row's end
  (`data-sidebar="menu-sub-action"`), with the top-level visibility rule: shown on row hover or
  focus from `md` up, kept while its menu is open, always below `md`, and `inert` when the panel
  is collapsed to icons. A new `subAction` theme part draws it. `iconColor`, `iconVariant`,
  `badge`, `tooltip` and `class` work as on top-level entries. Every field is optional: a sub
  entry without them renders exactly as before, so nested navigation keeps its menus, pins and
  tints without flattening the tree.

### Fixed

- `Marquee`: at `small` and `large`, and at any theme spacing other than the default, the loop
  jumped once per cycle. Each copy redeclared `--gap` as 1rem, so the loop stepped 16px while the
  copies were drawn with the size's spacing token. `--gap` is now set once on the root from the
  spacing scale and read by the copies, their items and the loop; respace a marquee with
  `class="[--gap:…]"` on the root. Under reduced motion the still row fades only its trailing
  edge, so the first item is no longer half hidden.
- `AvatarGroup`: at `small`, each avatar covered the end of the previous one's two-letter
  initials. Small stacks now overlap by the same fifth of an avatar as normal and large, and small
  initials tighten their tracking.

## 0.10.1 — 2026-10-05

### Fixed

- `Select`: with the last options of a short list selected and the trigger near the top of the
  viewport, the item-aligned panel opened at the bottom of the screen. Pinning it to the top edge
  left fewer than four rows, and the fallback that makes room always grew the panel upward from
  the bottom edge. A panel pinned at the top now grows down from there. A list less than a row
  taller than four rows also opens whole instead of scrolling a few pixels.

## 0.10.0 — 2026-10-03

### Added

- `entasis/color-palette`: `generateColorPalette`, the palette the theme plugin writes, computed
  at runtime with its `ColorPaletteOptions` and `ColorPalette` types. It does not import Tailwind,
  so runtime theming no longer means importing `dist/tailwind/colors.js` by path.
- `entasis/theme` exports `useTheme`, the nearest `Theme`'s state, for components below it.
- `Popover`: `popover.trigger` turns any element in a snippet trigger into a complete trigger. It
  anchors the panel, toggles it on click, keeps the ARIA state in sync, and gives a non-control
  `role="button"`, `tabindex="0"` and Enter/Space activation. The element's own handler wins: if
  it opens, closes or toggles the popover during the click, the default toggle stands down, so a
  kept `onclick={popover.toggle}` does not toggle twice. `PopoverState` is exported to type the
  snippet's parameter.
- `DataTable`: `onRowActivate` receives the row payload and the native event when a row is
  clicked (outside its controls) or given Enter in grid mode; rows show a pointer while it is set.
  `rowActionsWidth` sizes the row actions column, which was fixed at 36px and cut text buttons.
- `Chart` series: `areaFill: 'solid'` paints an area with one flat fill instead of the gradient.
- `ButtonGroup` takes `children` as well as `items`, so Tooltip and Popover triggers and custom
  Buttons join the group, plus a `label` for its new `role="group"`.

### Fixed

- Overlays in apps using Svelte's async mode: after a route or tab change, a dialog could open
  with no backdrop and ignore Escape, and popovers and menus could lose dismissal the same way. The
  layer stack dropped every overlay registered while the previous page was torn down: that
  teardown read the registry as it was before and wrote it back. The registry, dialog and popover
  children and `PageShell` overrides now use one store that cannot lose entries that way.
  `PageShell` overrides are also removed reliably on navigation: they were stored through a deep
  proxy, so the identity check that removed them could miss.
- `Dialog`: hovering the close button showed a dot at the panel's corner. The default button was
  wrapped in an empty element with the same close-button classes, whose state layer painted it.
  The object `trigger` also forwarded `content` to the DOM as an attribute; it renders `children`
  (a string or a snippet) or `content` now, like Popover and Tooltip.
- `Sidebar`: clicking an activity bar button while the collapsed panel was peeking kept the panel
  open after the pointer left, because the click's focus pinned it (so did focus a navigation put
  back on the clicked link). Only keyboard focus pins a peek now, as with `:focus-visible`; a
  focused text field still does.
- `DataTable` pagination footer: the range read "1–25 of 100" in every language; it uses the
  catalog's `paginationSummary` now. "Rows per page" was printed twice, as text and as the size
  select's field label; the text now names the select. A `pageSize` missing from `pageSizes` left
  the select on its placeholder; the current size is always offered.
- `paginationSummary` separates the range with an en dash in every locale.
- `Popover` and `Tooltip` object triggers rendered only their `content` string; `children` (a
  string or a snippet) now replaces it, as on Button.
- `Tooltip` snippet triggers on an element the browser cannot focus (a span, an icon) never
  showed from the keyboard; the element joins the tab order.
- `ButtonGroup`: an item's `disabled: false` re-enabled it inside a disabled group.

- `Chart`: every chart type fills its plot.
  - `height` and `aspectRatio` size the plot, as documented, rather than the whole chart. A
    legend row used to take its height out of the sized box, so the engine laid out a scene
    taller than the plot and the browser shrank it to fit: a chart with a legend drew at about
    93% scale, text included, with empty bands on both sides. A legend now adds to the chart's
    height.
  - Pie and donut drop the 16px inset and 92% radius meant for polar axis labels; a 2px inset
    keeps the slice separator stroke inside.
  - Polar charts size the circle to their angle labels instead of a fixed 24px or 16px inset
    (with 92% of the radius for circular, radial bar and rose). A label at twelve o'clock gets
    exactly its height, and band labels that fall short of the top get nothing. Side labels now
    stay inside a plot taller than it is wide, where they used to be cut off.
  - Waffle uses the whole plot instead of 86% of its shorter side.
  - Tree, network and sankey replace margins guessed from the plot size (up to 120px a side)
    with the room their labels need. The tree also drops d3's half-row gaps at the edges, and a
    network's settled layout is scaled to the plot instead of clamped inside it.
- `Chart`: switching one chart's x scale between categories and a continuous range, with
  `viewport` on, threw "A continuous brush requires number or Date bounds". The zoom window now
  restarts from the new domain.
- `Dialog`, `FloatingWindow`, the `Popover` mobile sheet and the mobile `Sidebar` drawer: the page
  dim was `neutral` at 40%, and `neutral` turns light in dark mode, so the backdrop brightened the
  page instead of dimming it. It is black now: 40% in light mode, 60% in dark mode.

## 0.9.3 — 2026-10-02

### Changed

- `Sidebar` / `AppShell`: every gutter between the activity bar, the panel and the page, and
  between them and the frame edge, is the `--space-md` token, so it scales with the theme's
  `spacing` and a custom `md` step. Some were `--spacing` × 2, some fixed `0.5rem` / `1rem`: at
  any spacing but the default the page cards fell out of line with the panel, and an
  icon-collapsed floating or split panel lost width. Default themes render the same.
- Docs: `resizable`'s `minWidth` / `maxWidth` (defaults `12rem` / `32rem`) are documented with the
  Sidebar prop.

## 0.9.2 — 2026-10-02

### Fixed

- `Sidebar` with an activity bar: a hidden panel revealed from the screen edge closed as soon as
  the pointer moved onto the activity bar. The rail is part of the sidebar now: hovering it
  opens the collapsed panel like the edge strip (or `expandOnHover` in icon mode), and hovering
  or focusing it keeps the panel open, so switching sections from it never closes the panel.
  Keyboard focus alone does not open it.

## 0.9.1 — 2026-10-02

### Changed

- `Code` highlights with `@tanstack/highlight` 1.0.0 (from 0.1.0). Same API and markup; the
  JavaScript and TypeScript tokenizers now mark object-literal keys as properties and no longer
  mistake a spread (`...rest`) for a property access.
- `svelte-streamdown` 4.2.1, which moves to the same `@tanstack/highlight` 1.0.0, so an app ships
  one copy of the highlighter instead of two.

### Fixed

- `AppShell`, `floating`: the gap between the sidebar panel and the page's header and footer cards
  was 16px, twice the 8px between the activity bar and the panel and at the screen edge: the panel
  column's gutter and the page's own inset stacked. The page drops its inset on the sidebar side
  while the panel column is there, so every gap is 8px; a hidden panel brings it back. PageShell's
  header and footer read `--page-shell-chrome-left-gap` / `--page-shell-chrome-right-gap`, each
  falling back to `--page-shell-chrome-inline-gap`.

## 0.9.0 — 2026-10-02

### Added

- `Popover` `positionPanel`: place the panel yourself, `({ panel, reference }) => { x, y,
minWidth? } | null`, instead of floating-ui; `null` falls back to `position`.

### Changed

- `Select` opens over its trigger with the selected option on the value, its text lined up with
  the value's, like a native select (Radix's item-aligned position, Base UI's
  `alignItemWithTrigger`), overhanging the trigger by the same margin on both sides. With nothing
  selected the first option takes that place. A list taller
  than the viewport is capped 8px from the edges and pre-scrolled so the option stays on the
  trigger, and wheel and touch scrolling outside the panel are blocked while it is open. The new
  `alignItemWithTrigger` prop (default `true`) set to `false` keeps the dropdown below the trigger.
- Docs: the Select page has a long country list example and an Align item switch.

### Fixed

- `Sidebar` / `AppShell`, `inset` and `split` with an activity bar: hiding the panel no longer
  makes the page drop its frame and grow to the full height. The rail is still beside the page,
  so it keeps its padding, rounding, border and shadow, and a `split` page keeps a gutter from
  the rail's card. The page fills the edge only when nothing of the sidebar is left beside it,
  which the wrapper now reports as `data-page-flush` and the `main` part as a `flush` variant.
- Docs: the AppShell example has Collapse and Activity bar controls to check this on every variant.

- Docs: the Getting started page and the README show how to connect the docs site's MCP server
  (`https://entasis.beynar.workers.dev/mcp`) to a project, and the MCP `components` tool
  describes the real color roles (`neutral`, no `background` / `foreground`), `density`, and the
  state prop conventions.

## 0.8.0 — 2026-09-28

### Added

- `px-<step>-concentric` / `py-<step>-concentric`: padding that clears the container's corner, the
  step or half the parent's `--radius-parent` when that is larger (capped at three steps). The
  padding half of the concentric radius engine, for very round themes over compact bars; default
  themes are unchanged.
- `FloatingWindow` `backdrop`: dims the page behind the expanded window and makes it modal like a
  `Dialog` (Tab stays inside, the rest of the page is inert, page scroll is locked). Minimizing into
  the dock lifts it and restoring brings it back. The backdrop is a new `backdrop` theme part, the
  same wash as Dialog's, fading on the window's `enter` / `exit` motion, and it always sits one layer
  below its window: the shared window counter reserves that index, so no other window can land in
  between.
- `Sidebar` views: `views` holds named panel contents and `view` / `defaultView` / `onViewChange`
  pick the one on screen. A row with `view` opens a view; a view with `parent` is nested and opens
  on a back row named after its parent, and on mobile a swipe toward the inline end goes back.
  Changing the view slides the two views side by side like pages (deeper comes in from the inline
  end, shallower slides back, sections go by their order in `views`) on the Sidebar motion slot's
  new `view` variant. Header and footer props a view leaves out come from its parent, then from
  the Sidebar; views that share them keep a still header and footer and only the menu slides, and
  a view that changes them slides the whole panel as one page. `api.view` and `api.setView` reach
  it from snippets. New theme parts `viewStage` and `viewLayer`.

### Changed

- Docs: the site sidebar is built from views, one per header section (Docs, Components, Blocks,
  Templates), and slides between them as you move through the header.

- Radius: the surface steps (`rounded-lg` and up: cards, popovers, dialogs, windows) follow the
  `radius` multiplier only up to `large` (1.5×). Controls still take the full multiplier, so a
  round theme keeps pill buttons, but its panels no longer balloon: at `round` or `radius: 2.25`
  `rounded-xl` is 24px instead of 40px / 36px. Themes at `large` or below are unchanged.

### Fixed

- `FloatingWindow`: with a very round theme the header title sat inside the window's corner. It now
  uses concentric padding (12px at `radius: 2.25`, unchanged 8px at the default radius).
- `FloatingWindow` dock: the minimized tab caps its corner at a third of its height (12px), so a
  round theme no longer turns it into a pill; at the default radius it goes from 16px to 12px.
  Hovering or pressing its title tints the whole tab, not just the title's box.
- Pointer drags that capture on activation (`capture: 'on-activate'`: the Dialog drawer's
  swipe-to-close, the FloatingWindow dock) no longer cancel on touch screens. The browser captures
  a touch to the element under it, and when the drag took the capture over, that element's
  `lostpointercapture` bubbled up and was read as the drag's own.
- `FloatingWindow` dock: clicking the minimized tab's title restores the window. The dock captured
  the pointer on press, so the click landed on the tab instead of the title; the drag now starts
  after 4px of travel (or a 300ms touch hold).
- `FileInput`: the placeholder, remove and add-more icons are Phosphor snippets like the rest of the
  kit instead of inline Lucide SVGs.

## 0.7.1 — 2026-09-24

### Changed

- The Sidebar activity bar follows the variant's panel instead of always being a flush hairline
  column: a card of its own with the panel's radius, edge and gutter for `floating` and `split`, the
  recessed well for `framed`, borderless on the canvas with the panel's vertical gutter for `inset`;
  `admin` is unchanged. For `floating` and `split` the reserved column adds the outer gutter, and a
  hidden panel is parked fully past the edge so it cannot show through that gutter.
- Sidebar docs: the activity bar example switches the panel's menu with the rail, and the main
  example has an Activity bar switch to see it against every variant.

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
