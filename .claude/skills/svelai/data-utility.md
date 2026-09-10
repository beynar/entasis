# Data & Utility Components

## Table of Contents
- [Table](#table)
- [SortableList](#sortablelist)
- [Card](#card)
- [Skeleton](#skeleton)
- [Slot](#slot)

---

## Table

`import { Table } from 'svelai/table'`

Data table with config-over-markup approach. Define structure via props, not markup.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `rows` | `TableRow[]` | **Required.** Array of row objects |
| `header` | `Record<string, TableCellValue>` | Column headers keyed by column name |
| `footer` | `Record<string, TableCellValue>` | Footer cells keyed by column name |
| `prefix` | `Slot` | Content above table (e.g. search/filter) |
| `suffix` | `Slot` | Content below table (e.g. pagination) |
| `caption` | `Slot` | `<caption>` element content |

### Cell Types
`TableCellValue = TableCell | Slot` -- three ways to define a cell:
- **String**: `'Name'`
- **Snippet**: `mySnippet`
- **Full object**: `{ content: 'Name', class: 'w-32', rowSpan: 2, colSpan: 3 }`

### Row Types
`TableRow = { cells?: Record<string, TableCellValue>, content?: Slot, class?: string }`
- `content` takes precedence over `cells` if both provided
- Cells render in header key order when header is provided

### Example
```svelte
<script>
  import { Table } from 'svelai/table';
  const header = { name: 'Name', email: 'Email', role: 'Role' };
  const rows = [
    { cells: { name: 'John', email: 'john@ex.com', role: 'Admin' } },
    { cells: { name: 'Jane', email: 'jane@ex.com', role: { content: 'User', class: 'text-success' } } }
  ];
  const footer = { name: 'Total', email: '', role: '2 users' };
</script>
<Table {header} {rows} {footer} />
```

### Custom Row Content
```svelte
{#snippet customRow()}
  <td>John</td>
  <td><button>Edit</button></td>
{/snippet}
<Table {header} rows={[{ content: customRow }]} />
```

### Theme Parts
`container`, `table`, `thead`, `tbody`, `tfoot`, `row` (variant: `selected`), `head`, `cell`, `caption`, `prefix`, `suffix`

Global: `setTableTheme({...})`

---

## SortableList

`import { SortableList } from 'svelai/sortable-list'`

Vertical drag-and-drop reorderable list, animated by default (placeholder holds the slot, displaced rows slide into place). Generic over the item type `T`, built on @dnd-kit-svelte with a keyboard sensor. Items must have stable, unique ids.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | - | **Required, bindable.** Items in display order; reordered in place as you drag |
| `handle` | `boolean \| Snippet` | `false` | `false`: whole row drags. `true`: only a grip handle drags (row text stays selectable). Snippet: handle mode + custom grip content |
| `disabled` | `boolean` | `false` | Renders rows but blocks reordering |
| `size` | `'small' \| 'normal' \| 'large'` | `'normal'` | Row padding, gaps, typography |
| `onReorder` | `({ items, from, to, item }) => void` | - | Fired once on drop when the order changed (cancelled drags revert and do not fire) |
| `i18n` | `Partial<Messages>` | - | Per-instance overrides (default handle aria-label `dragToReorder`) |

### Slots
- `item` -- `Snippet<[{ item: T, index: number, isDragging: boolean }]>`. Row content. Fallback when omitted: `String(item)` for primitives, else `item.label ?? item.title ?? item.id`.
- `handle` (passed as the `handle` prop snippet) -- fills the grip button; the component owns the wrapper (drag ref, aria-label, grab cursor).

### Example
```svelte
<script lang="ts">
  import { SortableList } from 'svelai/sortable-list';
  let items = $state([
    { id: '1', title: 'First', description: 'The first item' },
    { id: '2', title: 'Second', description: 'The second item' }
  ]);
</script>

<SortableList bind:items handle onReorder={({ items: next }) => console.log(next)}>
  {#snippet item({ item })}
    <div class="flex flex-col">
      <span class="font-medium">{item.title}</span>
      <span class="text-foreground-muted text-sm">{item.description}</span>
    </div>
  {/snippet}
</SortableList>
```

### Theme Parts
`root` (variant: `size`), `item` (variants: `size`, `handle`, `dragging`, `disabled`), `content`, `handle` (variant: `size`)

Global: `setSortableListTheme({...})`

---

## Card

`import { Card } from 'svelai/card'`

Flexible container with sections. Supports standard color/size/variant props.

### Unique Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showBorders` | `boolean` | `false` | Borders between header/content/footer |
| `href` | `string` | - | Makes card an `<a>` link |
| `target` | `string` | - | Link target |
| `rel` | `string` | - | Link rel attribute |
| `onclick` | `() => void` | - | Click handler (renders as `role="button"`) |
| `onpointerenter` | `() => void` | - | Pointer enter handler |
| `onpointerleave` | `() => void` | - | Pointer leave handler |
| `disabled` | `boolean` | `false` | Disables interaction + opacity |
| `action` | `Snippet \| ButtonProps` | - | Action element (top-right). Pass ButtonProps object for auto-rendered Button |

### Slots
`header`, `title`, `description`, `action`, `content`, `children`, `footer`

- `header` snippet overrides default header structure (title + description + action)
- `content` snippet overrides default content structure (children)

### Example
```svelte
<Card variant="outline" color="primary" showBorders>
  {#snippet title()}Settings{/snippet}
  {#snippet description()}Manage preferences{/snippet}
  {#snippet children()}<p>Content here</p>{/snippet}
  {#snippet footer()}<Button>Save</Button>{/snippet}
</Card>
```

### Action as ButtonProps
```svelte
<Card action={{ variant: 'ghost', size: 'small', children: 'Delete', color: 'danger', onclick: () => {} }}>
  {#snippet title()}Title{/snippet}
  {#snippet children()}Content{/snippet}
</Card>
```

### Theme Parts
`card` (variants: `size`, `color`, `variant`, `disabled`), `header` (variants: `size`, `hasAction`, `hasBorder`, `variant`), `title` (variants: `size`, `variant`), `description` (variants: `size`, `variant`), `action`, `content` (variants: `size`, `hasBorder`, `hasBorderTop`, `hasBorderBottom`), `footer` (variants: `size`, `hasBorder`)

Global: `setCardTheme({...})`

---

## Skeleton

`import { Skeleton } from 'svelai/skeleton'`

Loading placeholder with pulse animation. Shape/size controlled entirely via `class`.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | Color | `'foreground'` | Background color |
| `children` | `Snippet` | - | Optional inner content |

### Common Patterns
```svelte
<!-- Text lines -->
<div class="space-y-2">
  <Skeleton class="h-4 w-full" />
  <Skeleton class="h-4 w-5/6" />
  <Skeleton class="h-4 w-4/6" />
</div>

<!-- Avatar circle -->
<Skeleton class="h-12 w-12 rounded-full" />

<!-- Loading gate -->
{#if loading}
  <Skeleton class="h-64 w-full" />
{:else}
  <Content />
{/if}
```

### Theme Parts
`skeleton` (variant: `color`)

Global: `setSkeletonTheme({...})`

---

## Slot

`import { Slot } from 'svelai/slot'`

Utility component for rendering dynamic content types uniformly.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `render` | `Slot` | Content: `string \| number \| Snippet \| Component` |
| `class` | `string` | CSS class on wrapper |

### Behavior
- Strings/numbers render as text
- Snippets render with props
- Components render as Svelte components
- `null`/`undefined` render as empty

### Example
```svelte
{#snippet greeting()}
  <h1>Hello!</h1>
{/snippet}

<Slot render={greeting} class="text-primary" />
<Slot render="Plain text" />
<Slot render={42} />
<Slot render={isLoading ? 'Loading...' : dataSnippet} />
```

### Use Cases
- Building flexible component APIs that accept string or snippet props
- Conditional content rendering with mixed types
- List rendering with dynamic item labels
