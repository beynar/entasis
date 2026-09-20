# Data & Utility Components

## Table of Contents

- [Table](#table)
- [DataTable](#datatable)
- [Chart](#chart)
- [SortableList](#sortablelist)
- [Card](#card)
- [Skeleton](#skeleton)
- [Slot](#slot)

---

## Table

`import { Table } from 'entasis/table'`

Data table with config-over-markup approach. Define structure via props, not markup.

### Props

| Prop      | Type                             | Description                              |
| --------- | -------------------------------- | ---------------------------------------- |
| `items`   | `TableRow[]`                     | **Required.** Array of row objects       |
| `header`  | `Record<string, TableCellValue>` | Column headers keyed by column name      |
| `footer`  | `Record<string, TableCellValue>` | Footer cells keyed by column name        |
| `prefix`  | `Slot`                           | Content above table (e.g. search/filter) |
| `suffix`  | `Slot`                           | Content below table (e.g. pagination)    |
| `caption` | `Slot`                           | `<caption>` element content              |

### Cell Types

`TableCellValue = TableCell | Slot` -- three ways to define a cell:

- **String**: `'Name'`
- **Snippet**: `mySnippet`
- **Full object**: `{ content: 'Name', class: 'w-32', rowSpan: 2, colSpan: 3 }`

### Row Types

`TableRow = { cells?: Record<string, TableCellValue>, content?: Slot, class?: string, selected?: boolean }`

- `content` takes precedence over `cells` if both provided
- Cells render in header key order when header is provided
- `selected` drives the `row` theme's `selected` variant and `data-state="selected"`; restyle it
  through the theme (`row: { selected: { true: '...' } }`) rather than an attribute selector

### Example

```svelte
<script>
	import { Table } from 'entasis/table';

	const header = { name: 'Name', email: 'Email', role: 'Role' };
	const rows = [
		{ cells: { name: 'John', email: 'john@ex.com', role: 'Admin' } },
		{
			cells: {
				name: 'Jane',
				email: 'jane@ex.com',
				role: { content: 'User', class: 'text-success' }
			}
		}
	];
	const footer = { name: 'Total', email: '', role: '2 users' };
</script>

<Table {header} items={rows} {footer} />
```

### Custom Row Content

```svelte
<script>
	import { Table } from 'entasis/table';

	const header = { name: 'Name', actions: '' };
</script>

{#snippet customRow()}
	<td>John</td>
	<td><button>Edit</button></td>
{/snippet}
<Table {header} items={[{ content: customRow }]} />
```

### Theme Parts

`root`, `table`, `thead`, `tbody`, `tfoot`, `row` (variant: `selected`), `head`, `cell`, `caption`, `prefix`, `suffix`

Global: `setTableTheme({...})`

---

## DataTable

`import { DataTable } from 'entasis/data-table'`

The typed, interactive table for application data: sorting, typed filters, grouping, selection,
async cell editing, column sizing/ordering/pinning, and client or manual processing. Reach for
`Table` when the content is static. The full API lives in the DataTable MCP doc; the sizing
contract is the part that bites:

| Prop         | Type               | Default | Description                                                                         |
| ------------ | ------------------ | ------- | ----------------------------------------------------------------------------------- |
| `virtualize` | `boolean`          | `true`  | `false` renders every row in normal document flow at its natural height             |
| `height`     | `string \| number` | -       | Scroll viewport height while virtualizing; omit it to fill a definite-height parent |

While virtualizing, DataTable needs a bounded viewport: pass `height`, or give it a parent with a
definite height. Pass `virtualize={false}` for a small dataset that should sit in normal document
flow — no height, no definite-height parent, and the same selection, keyboard navigation, and
editing behavior. Column virtualization in grid mode is unaffected.

```svelte
<script lang="ts">
	import { DataTable, type DataTableColumn } from 'entasis/data-table';

	type Person = { id: string; name: string; role: string };

	const people: Person[] = [];
	const columns: DataTableColumn<Person>[] = [
		{ id: 'name', accessor: 'name', header: 'Name', sortable: true },
		{ id: 'role', accessor: 'role', header: 'Role' }
	];
</script>

<DataTable items={people} {columns} getRowId={(person) => person.id} virtualize={false} />
```

The DataTable root is an `@container`: the toolbar search field pins to 16rem from `@md` (28rem /
448px of table width) and spans its own row below that, so a table in a split pane or drawer gets
the compact toolbar regardless of window size. The column header menu panel is the one part that is
not container-queried — it is portaled to the floating layer and sizes to its content, so it takes
its width from `useTheme().isMobile` (the same value the Popover uses to pick sheet-versus-floating)
rather than from a CSS breakpoint.

---

## Chart

`import { Chart, type ChartProps, type ChartKey } from 'entasis/chart'`

Declarative plotting surface: `data` plus one or more `marks`. The full mark API lives in the Chart
MCP doc; the props below are the ones a dashboard reaches for:

| Prop          | Type                                                            | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `height`      | `number`                                                        | 320     | Plot height in px. Sizes the live plot and the server-rendered SVG together                                                                                                                                                                                                                                                                                                                                                                                               |
| `aspectRatio` | `number`                                                        | -       | Width / height instead of a fixed height. Passing both `height` and `aspectRatio` throws                                                                                                                                                                                                                                                                                                                                                                                  |
| `palette`     | `readonly ChartColor[] \| Readonly<Record<string, ChartColor>>` | -       | Array is consumed in series-discovery order; the record names a color per series key                                                                                                                                                                                                                                                                                                                                                                                      |
| `legend`      | `boolean \| ChartLegendDefinition`                              | -       | `format?: (key: ChartKey) => string` sets the display text for a series in the legend and tooltip. A categorical legend is a entasis control — `interactive: true` renders a `ToggleButtonGroup` of small ghost toggles (colour swatch + label, pressed = visible) in its own row above or below the plot; static renders the same swatch and label as plain items. Numeric scales stay a colour ramp inside the plot. Theme parts: `legend`, `legendItem`, `legendSwatch` |
| `tooltip`     | `boolean \| ChartTooltipDefinition`                             | -       | `value` / `defaultValue` / `onValueChange` pin a row: it shows without hover, hover moves the tooltip, pointer leave restores the pin                                                                                                                                                                                                                                                                                                                                     |

`ChartColor` accepts the seven semantic roles plus the surface family (`surface`,
`surface-recessed`, `surface-canvas`, `surface-raised`, `surface-floating`), so a point marker filled
with the card background is `fill: 'surface'` — not a raw `var(--color-surface)`.

A `variant: 'stack'` bar mark (and an area series with `layout: { type: 'stack' }`) reads **wide**
rows directly: pass a list of numeric field names as the value channel and the field names become the
series keys, in that order — which is also the stack order, the legend order and the palette keys. No
melting by hand. `gap` leaves surface between consecutive segments of one stack without moving the
baseline or the stack total.

```svelte
<script lang="ts">
	import { Chart, type ChartProps } from 'entasis/chart';

	type StatusRow = { month: string; completed: number; inProgress: number; pending: number };

	const rows: StatusRow[] = [];
	const marks: ChartProps<StatusRow>['marks'] = [
		{ type: 'bar', variant: 'stack', x: 'month', y: ['completed', 'inProgress', 'pending'], gap: 3 }
	];
	const labels: Record<string, string> = { completed: 'Completed', inProgress: 'In progress' };
</script>

<Chart
	data={rows}
	{marks}
	palette={{ completed: 'secondary', inProgress: 'primary', pending: 'info' }}
	legend={{
		placement: 'top',
		interactive: true,
		format: (key) => labels[String(key)] ?? String(key)
	}}
	tooltip={{ groupBy: 'x', defaultValue: 'Mar' }}
	height={320}
	label="Task status over the last six months"
/>
```

---

## SortableList

`import { SortableList } from 'entasis/sortable-list'`

Drag-and-drop reorderable list, animated by default (a placeholder holds the slot while displaced rows slide into place). Generic over the item type `T`; built on the pragmatic-drag-and-drop based `useDndList` primitive. Objects need a stable unique `id`; primitives are matched by value. Lists that share a `group` accept each other's rows.

### Props

| Prop                        | Type                                                        | Default      | Description                                                                                                  |
| --------------------------- | ----------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| `items`                     | `T[]`                                                       | -            | **Required, bindable.** Items in display order; reassigned once at drop                                      |
| `handle`                    | `boolean \| Snippet`                                        | `false`      | `false`: whole row drags. `true`: only a grip handle drags (row text stays selectable). Snippet: custom grip |
| `disabled`                  | `boolean`                                                   | `false`      | Renders rows but blocks reordering                                                                           |
| `indicator`                 | `boolean`                                                   | `false`      | Keep rows in place and show an insertion line instead of the live placeholder preview                        |
| `size`                      | `'small' \| 'normal' \| 'large'`                            | `'normal'`   | Row padding, gaps, typography                                                                                |
| `orientation`               | `'vertical' \| 'horizontal' \| 'grid'`                      | `'vertical'` | Layout and drag axis                                                                                         |
| `group`                     | `string`                                                    | -            | Cross-list group; lists sharing it accept each other's items (captured at mount)                             |
| `name`                      | `string`                                                    | auto         | Identifies this list within its group (`from`/`to` in cross-list callbacks)                                  |
| `accepts`                   | `({ item, from }) => boolean`                               | accept all   | Cross-list accept policy on top of the group match                                                           |
| `onReorder`                 | `({ items, from, to, item }) => void`                       | -            | Fired once on drop when the order changed (cancelled drags revert and do not fire)                           |
| `onReceive`                 | `({ item, index, from: { list, index } }) => void`          | -            | A row from another list of the group was dropped here (`items` already updated)                              |
| `onRemove`                  | `({ item, index, to: { list } }) => void`                   | -            | One of this list's rows was dropped into another list (`items` already updated)                              |
| `onDragStart` / `onDragEnd` | `({ item, index }) => void` / `({ item, dropped }) => void` | -            | Drag lifecycle                                                                                               |
| `empty`                     | `Slot`                                                      | -            | Rendered when the list has no rows; grouped lists should set it so an empty list stays a hittable drop area  |
| `i18n`                      | `Partial<Messages>`                                         | -            | Per-instance overrides (default handle aria-label `dragToReorder`)                                           |

### Slots

- `item` -- `Snippet<[{ item: T, index: number, isDragging: boolean }]>`. Row content. Fallback when omitted: `String(item)` for primitives, else `item.label ?? item.title ?? item.id`.
- `handle` (passed as the `handle` prop snippet) -- fills the grip button; the component owns the wrapper (drag ref, aria-label, grab cursor).

### Example

```svelte
<script lang="ts">
	import { SortableList } from 'entasis/sortable-list';

	let items = $state([
		{ id: '1', title: 'First', description: 'The first item' },
		{ id: '2', title: 'Second', description: 'The second item' }
	]);
</script>

<SortableList bind:items handle onReorder={({ items: next }) => console.log(next)}>
	{#snippet item({ item })}
		<div class="flex flex-col">
			<span class="font-medium">{item.title}</span>
			<span class="text-neutral/70 text-sm">{item.description}</span>
		</div>
	{/snippet}
</SortableList>
```

### Theme Parts

`root` (variants: `size`, `orientation`), `item` (variants: `size`, `handle`, `dragging`, `disabled`), `content`, `handle` (variant: `size`), `empty`

Global: `setSortableListTheme({...})`

---

## Card

`import { Card } from 'entasis/card'`

Flexible container with sections. Supports standard color/size/variant props.

### Unique Props

| Prop             | Type                     | Default | Description                                                                                   |
| ---------------- | ------------------------ | ------- | --------------------------------------------------------------------------------------------- |
| `elevation`      | `1 \| 2 \| 3 \| 4 \| 5`  | `1`     | `lift` step a `solid` card casts; clickable rises one step on hover; other variants cast none |
| `showBorders`    | `boolean`                | `false` | Borders between header/content/footer                                                         |
| `href`           | `string`                 | -       | Makes card an `<a>` link                                                                      |
| `target`         | `string`                 | -       | Link target                                                                                   |
| `rel`            | `string`                 | -       | Link rel attribute                                                                            |
| `onclick`        | `() => void`             | -       | Click handler (renders as `role="button"`)                                                    |
| `onpointerenter` | `() => void`             | -       | Pointer enter handler                                                                         |
| `onpointerleave` | `() => void`             | -       | Pointer leave handler                                                                         |
| `disabled`       | `boolean`                | `false` | Disables interaction + opacity                                                                |
| `action`         | `Snippet \| ButtonProps` | -       | Action element (top-right). Pass ButtonProps object for auto-rendered Button                  |

### Slots

`header`, `title`, `description`, `action`, `content`, `children`, `footer`

- `header` snippet overrides default header structure (title + description + action)
- `content` snippet overrides default content structure (children)

### Example

```svelte
<script>
	import { Card } from 'entasis/card';
	import { Button } from 'entasis/button';
</script>

<Card variant="outline" color="primary" showBorders>
	{#snippet title()}Settings{/snippet}
	{#snippet description()}Manage preferences{/snippet}
	{#snippet children()}<p>Content here</p>{/snippet}
	{#snippet footer()}<Button>Save</Button>{/snippet}
</Card>
```

### Action as ButtonProps

```svelte
<script>
	import { Card } from 'entasis/card';
</script>

<Card
	action={{
		variant: 'ghost',
		size: 'small',
		children: 'Delete',
		color: 'danger',
		onclick: () => {}
	}}
>
	{#snippet title()}Title{/snippet}
	{#snippet children()}Content{/snippet}
</Card>
```

### Theme Parts

`root` (variants: `size`, `color`, `variant`, `disabled`), `header` (variants: `size`, `hasAction`, `hasBorder`, `variant`), `title` (variants: `size`, `variant`), `description` (variants: `size`, `variant`), `action`, `content` (variants: `size`, `hasBorder`, `hasBorderTop`, `hasBorderBottom`), `footer` (variants: `size`, `hasBorder`)

Global: `setCardTheme({...})`

---

## Skeleton

`import { Skeleton } from 'entasis/skeleton'`

Loading placeholder with pulse animation. Shape/size controlled entirely via `class`.

### Props

| Prop       | Type      | Default     | Description            |
| ---------- | --------- | ----------- | ---------------------- |
| `color`    | `Colors`  | `'neutral'` | Background color       |
| `children` | `Snippet` | -           | Optional inner content |

### Common Patterns

```svelte
<script>
	import { Skeleton } from 'entasis/skeleton';

	let loading = $state(true);
</script>

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
	<p>Loaded content</p>
{/if}
```

### Theme Parts

`root` (variant: `color`)

Global: `setSkeletonTheme({...})`

---

## Slot

`import { Slot } from 'entasis/slot'`

Utility component for rendering dynamic content types uniformly.

### Props

| Prop     | Type     | Description                                         |
| -------- | -------- | --------------------------------------------------- |
| `render` | `Slot`   | Content: `string \| number \| Snippet \| Component` |
| `class`  | `string` | CSS class on wrapper                                |

### Behavior

- Strings/numbers render as text
- Snippets render with props
- Components render as Svelte components
- `null`/`undefined` render as empty

### Example

```svelte
<script>
	import { Slot } from 'entasis/slot';

	let isLoading = $state(false);
</script>

{#snippet greeting()}
	<h1>Hello!</h1>
{/snippet}

<Slot render={greeting} class="text-primary" />
<Slot render="Plain text" />
<Slot render={42} />
<Slot render={isLoading ? 'Loading...' : greeting} />
```

### Use Cases

- Building flexible component APIs that accept string or snippet props
- Conditional content rendering with mixed types
- List rendering with dynamic item labels
