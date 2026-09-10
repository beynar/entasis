# Svelai Overlays & Feedback Reference

## Table of Contents
- [Dialog](#dialog)
- [Popover](#popover)
- [Tooltip](#tooltip)
- [Toast](#toast)
- [Confirmation](#confirmation)
- [Alert](#alert)
- [NetworkIndicator](#networkindicator)

---

## Dialog

`import { Dialog } from 'svelai/dialog'`

Modal/drawer overlay that blocks page interaction.

### Unique Props
| Prop | Type | Default |
|---|---|---|
| `type` | `'fullScreen' \| 'drawerRight' \| 'drawerLeft' \| 'drawerBottom' \| 'alert' \| 'modal'` | `'modal'` |
| `isOpen` | `boolean` (bindable) | `false` |
| `closable` | `boolean` | `true` |
| `closeOnEscape` | `boolean` | `true` |
| `closeOnClickOutside` | `boolean` | `true` |
| `transition` | `TransitionConfig` | - |

### Slots
- `title`: string or `Snippet<[DialogState]>`
- `description`: string or `Snippet<[DialogState]>`
- `children`: `Snippet<[DialogState]>`
- `header`, `footer`, `closeButton`: `Snippet`
- `trigger`: `Snippet<[DialogState]>` or `ButtonProps & { content?: string }`

### Events
- `onAfterOpen(dialog: DialogState)`, `onAfterClose(dialog: DialogState)`

### DialogState (passed to snippets)
- `isOpen`, `id`, `type`, `size`, `open()`, `close()`

### Theme Parts
`dialog` (base, size, type) | `content` (size, type) | `header` | `footer` | `closeButton` | `title` | `description`

### Example
```svelte
<Dialog type="drawerRight" title="Side Panel"
  trigger={{ content: "Open", color: "primary" }}>
  Drawer content
  {#snippet footer()}
    <Button onclick={() => isOpen = false}>Close</Button>
  {/snippet}
</Dialog>
```

---

## Popover

`import { Popover } from 'svelai/popover'`

Floating content positioned relative to a trigger element.

### Unique Props
| Prop | Type | Default |
|---|---|---|
| `isOpen` | `boolean` (bindable) | `false` |
| `ref` | `HTMLElement \| null` | - |
| `position` | `Placement` (12 options) | `'bottom'` |
| `offset` | `number` | - |
| `fitTrigger` | `boolean` | `false` |
| `openOnHover` | `boolean` | `false` |
| `openOnClick` | `boolean` | `true` |
| `hoverDelay` | `number` | `100` |
| `closeOnEscape` | `boolean` | `true` |
| `closeOnClickOutside` | `boolean` | `true` |
| `closeOnMouseLeave` | `boolean` | `false` |
| `lockScroll` | `boolean` | `true` |
| `directedTransition` | `boolean` | `true` |

### Slots
- `children`: `Snippet<[PopoverState]>`
- `trigger`: `Snippet<[PopoverState]>` | `ButtonProps & { content?: string }` | `false`

### Events
- `onAfterOpen(popover: PopoverState)`, `onAfterClose(popover: PopoverState)`

### PopoverState (passed to snippets)
- `isOpen`, `id`, `size`, `position`, `offset`, `open()`, `close()`

### Theme Parts
`popover` (base, size)

### Example
```svelte
<!-- External ref usage -->
<Avatar bind:ref={avatarRef} onclick={() => isOpen = !isOpen} />
<Popover bind:isOpen ref={avatarRef} position="bottom-end" trigger={false}>
  <ProfileCard />
</Popover>

<!-- Hover popover -->
<Popover openOnHover openOnClick={false} closeOnMouseLeave
  trigger={{ content: "Hover me" }}>
  Tooltip-like content
</Popover>
```

---

## Tooltip

`import { tooltip } from 'svelai/tooltip'`

Attachment directive (not a component). Uses `{@attach}` on any element.

### Props (passed to `tooltip()`)
| Prop | Type | Default |
|---|---|---|
| `content` | `string \| Snippet` (required) | - |
| `position` | `Placement` (12 options) | `'top'` |
| `size` | `Sizes` | `'normal'` |
| `color` | `Colors` | `'neutral'` |
| `variant` | `'solid' \| 'outline' \| 'soft'` | `'solid'` |
| `delay` | `number` | `400` |
| `offset` | `number` | - |
| `onAfterOpen` | `() => void` | - |
| `onAfterClose` | `() => void` | - |

### Theme Parts
`tooltip` (base, size, color, variant)

### Examples
```svelte
<!-- Basic -->
<button {@attach tooltip({ content: 'Submit form' })}>Submit</button>

<!-- Rich snippet content -->
{#snippet tip()}
  <strong>Pro Tip:</strong> Use Ctrl+S
{/snippet}
<button {@attach tooltip({ content: tip, position: 'right', color: 'info' })}>
  Help
</button>

<!-- Same visual variants and sizes as Chip -->
<button {@attach tooltip({ content: 'More context', variant: 'soft', size: 'large' })}>
  Help
</button>

<!-- Disabled elements need a wrapper -->
<span {@attach tooltip({ content: 'Coming soon' })}>
  <button disabled>Feature</button>
</span>
```

**Note:** Only one tooltip shows at a time. Subsequent tooltips show instantly within 400ms of previous.

---

## Toast

`import { toast } from 'svelai/toast'`

Programmatic function (not a component). Call color methods directly.

### API
```typescript
const t = toast.success({ title, description?, ...options });
t.remove(); // dismiss programmatically
```

### Color Methods
`toast.primary()` | `toast.secondary()` | `toast.success()` | `toast.warning()` | `toast.danger()` | `toast.info()` | `toast.neutral()`

### Options
| Option | Type | Default |
|---|---|---|
| `title` | `string \| Slot` | - |
| `description` | `string \| Slot` | - |
| `position` | `'top-left' \| 'top-right' \| 'top-center' \| 'bottom-left' \| 'bottom-right' \| 'bottom-center'` | `'bottom-right'` |
| `duration` | `number \| false` | `4000` |
| `loading` | `boolean` | `false` |
| `closeOnClick` | `boolean` | inherited |
| `showCloseIcon` | `boolean` | inherited |
| `dismissible` | `boolean` | inherited |
| `richColors` | `boolean` | inherited |
| `icon` | `string` | - |
| `important` | `boolean` | - |
| `prefix` | `Slot \| false` | - |
| `suffix` | `Slot` | - |

### Events
`onAfterOpen(toast)` | `onAfterClose(toast)` | `onAutoClose(toast)`

### Theme Parts
`toast` (base, richColors, color, size) | `prefix` | `suffix` | `content` | `closeIcon` | `title` | `description`

### Example
```typescript
// Loading toast that stays until manually removed
const t = toast.info({ title: 'Uploading...', loading: true, duration: false });
await upload();
t.remove();
toast.success({ title: 'Uploaded!' });
```

**Note:** Toasts pause auto-close on hover. Multiple toasts stack by position.

---

## Confirmation

`import { confirmation } from 'svelai/confirmation'`

Async function returning a Promise. Blocks interaction until user responds.

### API
```typescript
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
| Param | Type | Required |
|---|---|---|
| `title` | `string` | yes |
| `description` | `string` | yes |
| `confirm` | `string \| { text, ...ButtonProps }` | yes |
| `cancel` | `string \| { text, ...ButtonProps }` | yes |
| `onConfirm` | `() => Promise<R>` | no |

**Note:** Cannot be dismissed via Escape or click-outside. Confirm button shows loading during `onConfirm` execution.

---

## Alert

`import { Alert } from 'svelai/alert'`

Static message banner. Uses CSS Grid layout adapting to icon presence.

### Unique Props
| Prop | Type | Default |
|---|---|---|
| `variant` | `'solid' \| 'outline' \| 'soft'` | `'solid'` |
| `disabled` | `boolean` | `false` |

### Slots
- `prefix`: Icon snippet (adjusts grid layout when present)
- `title`: Bold heading
- `description`: Muted body text
- `children`: Fallback for description

### Theme Parts
`alert` (base, hasIcon, color, variant, size, disabled, hasDescription, hasTitle) | `prefix` (size) | `content` | `title` (size) | `description` (size)

### Example
```svelte
<script>
  import { Alert } from 'svelai/alert';
  import { warningCircleIcon } from 'svelai/icons/warningCircle';
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

`import { NetworkIndicator, toggleNetworkIndicator } from 'svelai/network-indicator'`

Top-of-page loading bar. Auto-shows during SvelteKit navigations.

### Unique Props
| Prop | Type | Default |
|---|---|---|
| `height` | `number` (px) | `3` |
| `delay` | `number` (ms) | `300` |
| `easing` | `Easing` (30+ options) | `'cubicInOut'` |

### Programmatic Control
```typescript
import { toggleNetworkIndicator } from 'svelai/network-indicator';

toggleNetworkIndicator(); // show
await fetch('/api/data');
toggleNetworkIndicator(); // hide
```

### Theme Parts
`networkIndicator` (base, color)

### Example
```svelte
<!-- In +layout.svelte -->
<NetworkIndicator color="primary" height={4} delay={200} />
<slot />
```

**Note:** Place in root `+layout.svelte`. Uses Web Animations API. Fixed position at viewport top.
