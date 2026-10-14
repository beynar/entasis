# Entasis Overlays & Feedback Reference

## Table of Contents

- [Focus and dismissal](#focus-and-dismissal)
- [Dialog](#dialog)
- [Popover](#popover)
- [Tooltip](#tooltip)
- [Toast](#toast)
- [Confirmation](#confirmation)
- [Alert](#alert)
- [NetworkIndicator](#networkindicator)

---

## Focus and dismissal

Every overlay shares one layer stack and the same focus laws. On open, focus goes to an
`[autofocus]` / `[data-autofocus]` target, else the first tabbable control (a close button is
skipped), else the panel; Dialog always does this, Popover only with `focusOnOpen`. On close, focus
is restored to the trigger that opened it (after a programmatic open, to the element focused then);
when that element is gone or disabled it goes to the last element that had focus in the dialog
beneath, else to the most recent element still on the page, and a close by Escape or from the
keyboard shows the focus ring. `focusOnClose` on Dialog and Popover overrides it: `false` leaves
focus alone, an element receives it, a function gets the change details and returns either. A
Popover's panel is portaled to the end of the page, so Tab on its open trigger enters the panel,
Tab past the last control continues after the trigger and closes it, and Shift+Tab returns.
Escape closes only the topmost open layer; an outside press dismisses every layer stacked above the
one pressed (a press that began before the layer opened never does, and on touch only a tap does);
on Android the Back gesture closes the topmost modal layer like Escape. Modal layers (Dialog)
contain Tab and make the rest of the page `inert`; Popover is non-modal. See [Dialog](#dialog) and
[Popover](#popover).

`onOpenChange(open, details)` runs before the state changes. `details` carries `reason`
(`'trigger-press'`, `'trigger-hover'`, `'outside-press'`, `'escape-key'`, `'close-watcher'`,
`'close-press'`, `'item-press'`, `'swipe'`, `'trigger-unmount'`, `'imperative-action'`…), `event`,
`trigger`, `interaction` and `cancel()`; cancelling keeps the overlay as it was and leaves the event
untouched. Import `OpenChangeDetails` from `entasis/types`. `onAfterOpen` and `onAfterClose` fire
exactly once per open and close, also when no transition plays. A consumer `onclick` on a built-in
trigger runs first, and `event.preventDefault()` there cancels the built-in toggle.

---

## Dialog

`import { Dialog } from 'entasis/dialog'`

Modal/drawer overlay that blocks page interaction.

### Unique Props

| Prop                  | Type                                                                                                   | Default                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `type`                | `'modal' \| 'alert' \| 'fullScreen' \| 'drawerRight' \| 'drawerLeft' \| 'drawerBottom' \| 'drawerTop'` | `'modal'`                                                |
| `open`                | `boolean` (bindable)                                                                                   | `false`                                                  |
| `closable`            | `boolean`                                                                                              | `true`                                                   |
| `focusOnClose`        | `boolean \| HTMLElement \| ((details) => HTMLElement \| boolean \| void)`                              | `true`                                                   |
| `closeOnEscape`       | `boolean`                                                                                              | `true`                                                   |
| `closeOnClickOutside` | `boolean`                                                                                              | `true` (`false` for `type: 'alert'` and `modal={false}`) |
| `modal`               | `boolean`                                                                                              | `true`                                                   |
| `closeButton`         | `Snippet \| false`                                                                                     | the default button                                       |
| `snapPoints`          | `(number \| string)[]` (bottom and top drawers)                                                        | -                                                        |
| `snapPoint`           | `number \| string` (bindable), `defaultSnapPoint` sets where it opens                                  | the largest point                                        |
| `onSnapPointChange`   | `(snapPoint, details) => void`; `details.cancel()` keeps the current point                             | -                                                        |
| `transition`          | `TransitionConfig`                                                                                     | -                                                        |

`type` accepts a responsive record such as `{ xs: 'drawerBottom', md: 'modal' }` (nearest defined key at or below the active breakpoint wins); a `modal` collapses into a bottom sheet on mobile by default, and drawers can be dragged toward their edge to dismiss. `aria-labelledby` / `aria-describedby` link `title` and `description`; focus is restored to the opener before `onAfterClose`.

`type="alert"` is for an interruption that needs an answer: it renders `role="alertdialog"` and
ignores outside presses unless `closeOnClickOutside` is set explicitly; Escape still closes it
(turn that off with `closeOnEscape={false}`).

`modal={false}` leaves the page usable: no `inert` page, scroll lock, backdrop or Tab containment,
and outside presses do not dismiss it; Escape and the close button still do. Every way out (Escape,
an outside press, the close button, a swipe, Android Back) goes through `onOpenChange` first, so
`details.cancel()` can hold any of them back (ask before discarding a draft); a cancelled swipe
snaps back. The close button is named `Close`; with `closeButton={false}` (or a snippet that renders
nothing, as the Popover mobile sheet passes) a closable dialog keeps a visually hidden `Close`
button for screen readers (never for an `alert`). A mouse or pen drags a drawer only from its
thumb and header, a finger from anywhere unless text is selected, and a dialog above another keeps
the one beneath moving with its swipe.

`snapPoints` (fractions of the available height such as `[0.3, 0.6, 1]`, or CSS lengths like
`'148px'`, `'20rem'`, `'40%'`, `'50vh'`) let a bottom or top drawer, or a modal collapsed into a
mobile sheet, rest at several heights: drag it between them, a flick moves it to the next, dragging
below the lowest dismisses it, and its body scrolls only at the largest. While a modal dialog is
open `<html>` carries `data-dialog-open` and `--dialog-depth` so a page can scale back behind a
sheet; in a bottom sheet a focused text field makes room for the on-screen keyboard
(`--keyboard-inset`).

### Slots

- `title`: string or `Snippet<[DialogState]>`
- `description`: string or `Snippet<[DialogState]>`
- `children`: `Snippet<[DialogState]>`
- `header`, `footer`, `closeButton`: `Snippet`
- `trigger`: `Snippet<[DialogState]>` or `ButtonProps & { content?: string }`; in a snippet,
  `{@attach dialog.trigger}` gives any element `aria-haspopup`, `aria-expanded`, `aria-controls`
  and click / Enter / Space opening

### Events

- `onOpenChange(open, details)`, `onAfterOpen(payload: DialogState)`, `onAfterClose(payload: DialogState)`

### DialogState (passed to snippets)

- `isOpen`, `id`, `type`, `size`, `modal`, `open(details?)`, `close(details?)`,
  `setOpen(open, details?)`, `setSnapPoint(point, details?)`, `currentSnapPoint`,
  `trigger` and `reference` (attachments), `lifecycle.status`

### Theme Parts

`root` (base, size, type) | `align` | `backdrop` | `content` (size, type) | `thumb` | `header` | `footer` | `closeButton` | `title` | `description`

### Example

```svelte
<script>
	import { Dialog } from 'entasis/dialog';
	import { Button } from 'entasis/button';

	let open = $state(false);
</script>

<Dialog
	type="drawerRight"
	title="Side Panel"
	bind:open
	trigger={{ content: 'Open', color: 'primary' }}
>
	Drawer content
	{#snippet footer()}
		<Button onclick={() => (open = false)}>Close</Button>
	{/snippet}
</Dialog>
```

---

## Popover

`import { Popover } from 'entasis/popover'`

Floating content positioned relative to a trigger element.

### Unique Props

| Prop                  | Type                                                                      | Default    |
| --------------------- | ------------------------------------------------------------------------- | ---------- |
| `open`                | `boolean` (bindable)                                                      | `false`    |
| `ref`                 | `HTMLElement \| VirtualElement \| null`                                   | -          |
| `position`            | `Placement` (12 options)                                                  | `'bottom'` |
| `offset`              | `number`                                                                  | -          |
| `fitTrigger`          | `boolean`                                                                 | `false`    |
| `positionPanel`       | `({ panel, reference }) => { x, y, minWidth? } \| null`                   | -          |
| `inline`              | `boolean`                                                                 | `false`    |
| `openOnHover`         | `boolean`                                                                 | `false`    |
| `openOnClick`         | `boolean`                                                                 | `true`     |
| `delay`               | `number`                                                                  | `100`      |
| `closeOnEscape`       | `boolean`                                                                 | `true`     |
| `closeOnClickOutside` | `boolean`                                                                 | `true`     |
| `closeOnMouseLeave`   | `boolean`                                                                 | `false`    |
| `focusOnOpen`         | `'first' \| 'container' \| false`                                         | `false`    |
| `focusOnClose`        | `boolean \| HTMLElement \| ((details) => HTMLElement \| boolean \| void)` | `true`     |
| `haspopup`            | `'dialog' \| 'menu' \| 'listbox' \| 'tree' \| 'grid' \| true`             | `'dialog'` |
| `lockScroll`          | `boolean`                                                                 | `true`     |
| `directedTransition`  | `boolean`                                                                 | `true`     |

The trigger automatically gets `aria-haspopup` (from `haspopup`), `aria-expanded`, and `aria-controls`; a snippet trigger opts in with `{@attach popover.reference}`.

`openOnHover` opens after `delay`; leaving the trigger first cancels it, and so does closing the
popover another way (a click, Escape) while the delay runs. A hover-opened popover does not lock
page scroll, `closeOnMouseLeave` closes only a hover-opened popover, and pressing its trigger pins it
open. Removing the trigger that opened it, or the `ref` element, closes an open popover and reports
`onOpenChange(false, { reason: 'trigger-unmount' })`; a trigger re-rendered as a new element keeps it
open. With several `{@attach popover.trigger}` elements, the one pressed anchors the panel.

A `haspopup` other than `'dialog'` renders a plain wrapper instead of a `<dialog>`, points the
trigger's `aria-controls` at the element with that role (`role="menu"` for `menu`) and labels it by
the trigger.

`inline` renders the panel in normal document flow where the component sits instead of portaling to
the viewport-fixed layer: no floating-ui positioning, no scroll lock, no outside-press dismissal
(Escape still closes it). Panel classes and motion are unchanged, and the trigger still toggles it —
use it to show an open panel statically (docs, visual tests) or for an in-flow disclosure panel. It
wins over `mobileSheet`.

### Slots

- `children`: `Snippet<[PopoverState]>`
- `trigger`: `Snippet<[PopoverState]>` | `ButtonProps & { content?: string }` | `false`

### Events

- `onOpenChange(open, details)`, `onAfterOpen(payload: PopoverState)`, `onAfterClose(payload: PopoverState)`

### PopoverState (passed to snippets)

- `isOpen`, `id`, `size`, `position`, `offset`, `open(details?)`, `close(details?)`,
  `toggle(details?)`, `setOpen(open, details?)`, `openReason` (`'hover' | 'press' | 'keyboard' |
'programmatic'`), `activeTrigger`, `lifecycle.status`, `trigger` and `reference` (attachments for
  a custom trigger)

### Theme Parts

`root` (mode: floating | inline | mobileSheet) | `popover` (base, size, mode)

### Example

```svelte
<script lang="ts">
	import { Popover } from 'entasis/popover';

	let anchor = $state<HTMLButtonElement | null>(null);
	let open = $state(false);
</script>

<!-- External ref usage -->
<button bind:this={anchor} onclick={() => (open = !open)}>Profile</button>
<Popover bind:open ref={anchor} position="bottom-end" trigger={false}>
	<p>Signed in as Jane</p>
</Popover>

<!-- Hover popover -->
<Popover openOnHover openOnClick={false} closeOnMouseLeave trigger={{ content: 'Hover me' }}>
	Tooltip-like content
</Popover>

<!-- Inline: open in place, no portal -->
<Popover inline open trigger={false}>
	<p>Rendered where the component sits.</p>
</Popover>
```

---

## Tooltip

`import { Tooltip, tooltip } from 'entasis/tooltip'`

Two forms over one shared surface: the `<Tooltip>` component (a `trigger` prop, like every other
overlay) and the `tooltip()` attachment for elements you already render. Both are painted by the
single `TooltipHost` instance that `<Theme>` mounts.

### Props

| Prop           | Type                                                           | Default     |
| -------------- | -------------------------------------------------------------- | ----------- |
| `content`      | `string \| Snippet` (required)                                 | -           |
| `trigger`      | `Snippet<[Attachment<HTMLElement>]> \| ButtonProps` (required) | -           |
| `open`         | `boolean` (bindable)                                           | `false`     |
| `defaultOpen`  | `boolean`                                                      | `false`     |
| `onOpenChange` | `(open: boolean) => void`                                      | -           |
| `position`     | `Placement` (12 options)                                       | `'top'`     |
| `size`         | `Sizes`                                                        | `'normal'`  |
| `color`        | `Colors`                                                       | `'neutral'` |
| `variant`      | `'solid' \| 'outline' \| 'soft'`                               | `'solid'`   |
| `delay`        | `number`                                                       | `400`       |
| `offset`       | `number`                                                       | -           |
| `transition`   | `FSOProps`                                                     | -           |
| `class`        | `string`                                                       | -           |

`trigger` takes Button props (rendered as a `Button`, `content` is its label) or a snippet handed
the tooltip attachment to spread on its own element. Every prop except `trigger`, `open`,
`defaultOpen` and `onOpenChange` is also an option of `tooltip()`.

### Theme Parts

`root` (base, size, color, variant)

### Examples

```svelte
<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { Tooltip, tooltip } from 'entasis/tooltip';
</script>

<!-- Button trigger -->
<Tooltip content="Submit form" trigger={{ content: 'Submit', variant: 'outline' }} />

<!-- Snippet trigger: spread the attachment on your own element -->
{#snippet help(attach: Attachment<HTMLElement>)}
	<span class="underline" {@attach attach}>Help</span>
{/snippet}
<Tooltip content="Anchored to any element" position="right" color="info" trigger={help} />

<!-- Forced open, for docs and visual tests -->
<Tooltip open content="Always visible" trigger={{ content: 'Anchor' }} />

<!-- Attachment form, for elements you already render -->
<button {@attach tooltip({ content: 'Submit form' })}>Submit</button>

<!-- Disabled elements need a wrapper -->
<span {@attach tooltip({ content: 'Coming soon' })}>
	<button disabled>Feature</button>
</span>
```

**Note:** Only one tooltip shows at a time; an `open` one hands the surface over when another tooltip
is hovered and reports that through `onOpenChange`. Subsequent tooltips show instantly within 400ms of
previous. Opens on hover and on keyboard focus, and sets `aria-describedby` on the trigger while
visible.

---

## Toast

`import { toast } from 'entasis/toast'`

Programmatic function (not a component). Call color methods directly.

### API

```typescript
import { toast } from 'entasis/toast';

const t = toast.success({ title: 'Saved', description: 'Your changes are live.' });
t.remove(); // dismiss programmatically
```

### Color Methods

`toast.primary()` | `toast.secondary()` | `toast.success()` | `toast.warning()` | `toast.danger()` | `toast.info()` | `toast.neutral()`

### Options

| Option          | Type                                                                                              | Default          |
| --------------- | ------------------------------------------------------------------------------------------------- | ---------------- |
| `title`         | `string \| Slot`                                                                                  | -                |
| `description`   | `string \| Slot`                                                                                  | -                |
| `position`      | `'top-left' \| 'top-right' \| 'top-center' \| 'bottom-left' \| 'bottom-right' \| 'bottom-center'` | `'bottom-right'` |
| `duration`      | `number \| false`                                                                                 | `4000`           |
| `loading`       | `boolean`                                                                                         | `false`          |
| `closeOnClick`  | `boolean`                                                                                         | inherited        |
| `showCloseIcon` | `boolean`                                                                                         | inherited        |
| `dismissible`   | `boolean`                                                                                         | inherited        |
| `richColors`    | `boolean`                                                                                         | inherited        |
| `icon`          | `string`                                                                                          | -                |
| `important`     | `boolean`                                                                                         | -                |
| `prefix`        | `Slot \| false`                                                                                   | -                |
| `suffix`        | `Slot`                                                                                            | -                |
| `theme`         | `ToastThemeProps`                                                                                 | -                |

`theme` overrides the parts of this toast alone, layered over the `<Toaster theme>` and the
registry default.

### Events

`onAfterOpen(payload)` | `onAfterClose(payload)` | `onAutoClose(payload)`

### Theme Parts

`toaster` | `root` (base, richColors, color, size) | `prefix` | `suffix` | `content` | `actions` | `progress` | `closeIcon` | `title` | `description`

### Example

```typescript
import { toast } from 'entasis/toast';

declare function upload(): Promise<void>;

// Loading toast that stays until manually removed
const t = toast.info({ title: 'Uploading...', loading: true, duration: false });
await upload();
t.remove();
toast.success({ title: 'Uploaded!' });
```

**Note:** Toasts pause auto-close on hover. Multiple toasts stack by position.

A `toast.*()` call that runs before any `<Toaster />` has mounted -- module initialisation, a
store subscription, a navigation during hydration -- does not throw: the toast is parked in
order, the caller still gets its handle, and the first Toaster to mount adopts the queue. A
warning is logged only if no Toaster ever appears.

---

## Confirmation

`import { confirmation } from 'entasis/confirmation'`

Async function returning a Promise. Blocks interaction until user responds. Mount `<Confirmation />` once (inside `<Theme>`) for the host dialog.

### API

```typescript
import { confirmation } from 'entasis/confirmation';

declare function deleteItem(): Promise<void>;

const { confirmed, result } = await confirmation({
	title: 'Delete Item',
	description: 'This cannot be undone.',
	confirm: 'Delete',
	cancel: 'Cancel',
	onConfirm: async () => {
		await deleteItem();
		return 'deleted';
	}
});
// confirmed: boolean, result: return value of onConfirm or undefined
```

### Parameters

| Param         | Type                                 | Required |
| ------------- | ------------------------------------ | -------- |
| `title`       | `string`                             | yes      |
| `description` | `string`                             | yes      |
| `confirm`     | `string \| { text, ...ButtonProps }` | yes      |
| `cancel`      | `string \| { text, ...ButtonProps }` | yes      |
| `onConfirm`   | `() => Promise<R>`                   | no       |

**Note:** A press outside does nothing; Escape answers it as Cancel (`{ confirmed: false }`) unless `onConfirm` is running. Confirm button shows loading during `onConfirm` execution. If `onConfirm` throws or rejects, loading ends and the dialog stays open so the user can retry or cancel.

`<Confirmation />` registers itself as the host on the surrounding `<Theme>`. A `confirmation()`
call made before that host mounts is queued rather than thrown away, and resolves as soon as the
host appears. When the host unmounts, requests the user has not answered resolve as
`{ confirmed: false }`; a request whose `onConfirm` is already running resolves with its result.

### Theme Parts

`root` (extra classes on the alert-dialog surface, which Dialog otherwise owns) | `footer`
(variants: layout -- `inline` trails the buttons, `stacked` fills the width on narrow viewports)

Override globally with `<Theme components={{ confirmation: { footer: { base: '...' } } }}>`.

---

## Alert

`import { Alert } from 'entasis/alert'`

Static message banner. Uses CSS Grid layout adapting to icon presence.

### Unique Props

| Prop       | Type                             | Default   |
| ---------- | -------------------------------- | --------- |
| `variant`  | `'solid' \| 'outline' \| 'soft'` | `'solid'` |
| `disabled` | `boolean`                        | `false`   |

`soft` is the tinted "toast" look: a muted surface with a colored border and readable on-tint text.

### Slots

- `prefix`: Icon snippet (adjusts grid layout when present)
- `title`: Bold heading
- `description`: Muted body text
- `children`: Fallback for description

### Theme Parts

`root` (base, hasIcon, color, variant, size, disabled, hasDescription, hasTitle) | `prefix` (size) | `content` | `title` (size) | `description` (size) | `close`

### Example

```svelte
<script>
	import { Alert } from 'entasis/alert';
	import { warningCircleIcon } from 'entasis/icons/warningCircle';
</script>

<Alert color="danger" variant="soft">
	{#snippet prefix()}
		{@render warningCircleIcon()}
	{/snippet}
	{#snippet title()}Error{/snippet}
	{#snippet description()}Something went wrong.{/snippet}
</Alert>
```

---

## NetworkIndicator

`import { NetworkIndicator, toggleNetworkIndicator } from 'entasis/network-indicator'`

Top-of-page loading bar. Auto-shows during SvelteKit navigations.

### Unique Props

| Prop       | Type                                  | Default     |
| ---------- | ------------------------------------- | ----------- |
| `color`    | `Colors`                              | `'neutral'` |
| `height`   | `number` (px)                         | `3`         |
| `variant`  | `'bar' \| 'trail' \| 'trail-bounce'`  | `'bar'`     |
| `trailGap` | `number` (ms)                         | `0`         |
| `theme`    | `{ motion: { duration, easing }, … }` | —           |

### Programmatic Control

```typescript
import { toggleNetworkIndicator } from 'entasis/network-indicator';

toggleNetworkIndicator(); // show
await fetch('/api/data');
toggleNetworkIndicator(); // hide
```

### Theme Parts

`root` (base, color) | `segment`

### Example

```svelte
<!-- In +layout.svelte -->
<script>
	import { NetworkIndicator } from 'entasis/network-indicator';

	let { children } = $props();
</script>

<NetworkIndicator color="primary" height={4} theme={{ motion: { duration: 'fast' } }} />
{@render children()}
```

**Note:** Place in root `+layout.svelte`. Uses Web Animations API. Fixed position at viewport top.
Pacing comes from the `motion` theme slot (duration tokens), not a `delay` prop — retune it
per app with `<Theme components={{ 'network-indicator': { motion } }}>` or per instance with
`theme={{ motion }}`.
