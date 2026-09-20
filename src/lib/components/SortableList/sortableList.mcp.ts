export const sortableListDescription = `
# SortableList Component

A vertical list whose items are reordered by drag and drop. Its default live preview places the dragged row at the prospective slot while neighboring rows move with FLIP; \`indicator\` keeps rows fixed and draws an insertion line instead. Built on the \`useDndList\` attachment utility (Pragmatic drag and drop), the same engine as Kanban. Generic over the item type \`T\`.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { SortableList } from 'entasis/sortable-list';
	let items = $state([
		{ id: '1', label: 'Write the brief' },
		{ id: '2', label: 'Design the mockups' },
		{ id: '3', label: 'Ship it' }
	]);
</script>

<SortableList bind:items />
\`\`\`

Items need a stable, unique \`id\` property (primitive items are matched by value).

## Props

### Core Props
- **items**: \`T[]\` (required, bindable)
  - The list items in display order. The bound array is reassigned once, at drop — the mid-drag motion is a render-only preview.
- **handle**: \`boolean | Snippet<[{ item, index, isDragging }]>\` (default: \`false\`)
  - Drag mode and handle content in one prop.
  - \`false\`: the whole row initiates the drag (grab cursor).
  - \`true\`: only a grip handle drags. A default grip icon renders.
  - snippet/string: turns on handle mode and customizes what renders inside the handle.

### Style Props
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`)
  - Row padding, gaps and typography.
- **disabled**: \`boolean\` (default: \`false\`)
  - Disables all dragging. Rows still render but cannot be reordered.
- **indicator**: \`boolean\` (default: \`false\`)
  - Keeps rows in place while dragging and draws the shared insertion line. When false, the dragged row renders as a dimmed live placeholder and neighboring rows part around it.
- **orientation**: \`'vertical' | 'horizontal' | 'grid'\` (default: \`'vertical'\`)
  - Layout and drag axis. \`horizontal\` lays rows in a line, \`grid\` wraps them; both resolve before/after on the horizontal axis (RTL-aware), and dragging across wrapped grid lines follows the logical order. For a real CSS grid, override the root theme part — the drag math is identical.

### Cross-list Props
- **group**: \`string\` (optional) - Lists sharing the same group accept each other's rows: dragging into another list of the group inserts the row there, with the live preview showing the exact slot. Both bound \`items\` arrays update automatically at drop. Lists in a group should share the item shape. Captured at mount.
- **name**: \`string\` (optional) - Identifies this list within its group; reported as \`from\`/\`to\` in the cross-list callbacks. Defaults to an internal unique id.
- **accepts**: \`({ item, from }) => boolean\` (optional) - Cross-list accept policy on top of the group match; return false to reject (no preview, drop ignored). \`from\` is the source list's name. Enables receive-only or type-gated lists.

\`\`\`svelte
<SortableList bind:items={today} group="planner" name="today" />
<SortableList bind:items={tomorrow} group="planner" name="tomorrow" />
\`\`\`

### Event Props
- **onReorder**: \`({ items, from, to, item }: SortableListReorderPayload<T>) => void\`
  - Fired once when a drag ends and the order actually changed, with the reordered array and the move details. A cancelled drag or a no-op drop does not fire this.
- **onReceive**: \`(payload: { item: T; index: number; from: { list: string; index: number } }) => void\` - A row arrived from another list of the group (\`items\` already updated). \`from.index\` is the row's index in the source list at drag start — enough to persist the full move.
- **onRemove**: \`(payload: { item: T; index: number; to: { list: string } }) => void\` - One of this list's rows left for another list of the group (\`items\` already updated); \`index\` is its index here at the moment of drop.
- **onDragStart**: \`(payload: { item: T; index: number }) => void\` - A drag of one of this list's rows started.
- **onDragEnd**: \`(payload: { item: T; dropped: boolean }) => void\` - The drag ended (drop or cancel), after state updates; \`dropped\` is true when it landed on an accepting list.

### Localization
- **i18n**: \`Partial<Messages>\` - Per-instance i18n overrides merged over the global catalog. Supplies the default handle's aria-label (\`dragToReorder\`).

### Content Props (Slots)
- **item**: \`Snippet<[{ item: T, index: number, isDragging: boolean }]>\` (optional)
  - Row content. When omitted, each row renders a plain label: \`String(item)\` for primitives, otherwise \`item.label ?? item.title ?? item.id\`. \`index\` is the rendered position; \`isDragging\` identifies the dragged row (the dimmed placeholder in the default preview mode).

\`\`\`svelte
<SortableList bind:items>
	{#snippet item({ item, isDragging })}
		<div class="flex flex-col">
			<span class="font-medium">{item.title}</span>
			<span class="text-neutral/70 text-sm">{item.description}</span>
		</div>
	{/snippet}
</SortableList>
\`\`\`

- **empty**: \`Slot\` (snippet or string, optional) - Rendered inside the list when it has no rows. Grouped lists should provide it: it gives an empty list a visible, hittable drop area (dashed min-h row via the \`empty\` theme part). Nothing renders by default.

- **handle** (via the \`handle\` prop as a snippet): \`Snippet<[{ item, index, isDragging }]>\`
  - Customizes what renders inside the grip handle. The component owns the handle wrapper (with the \`data-dnd-handle\` marker, aria-label and grab cursor); the snippet only fills its contents.

\`\`\`svelte
<script lang="ts">
	import { dotsSixVerticalIcon } from 'entasis/icons/dotsSixVertical';
</script>

<SortableList bind:items>
	{#snippet handle()}
		{@render dotsSixVerticalIcon()}
	{/snippet}
</SortableList>
\`\`\`

### Advanced Props
- **ref**: \`HTMLElement | null\` (bindable) - Reference to the root \`<ul>\` element.
- **class**: \`string\` - Class for the root \`<ul>\`.
- **theme**: \`SortableListThemeProps\` - Theme overrides.

## Structure

A \`<ul>\` (\`root\`) holding one \`<li>\` (\`item\`) per entry. In full-row mode the \`<li>\` is the drag activator. In handle mode the \`<li>\` also contains a grip \`<button>\` (\`handle\`, marked \`data-dnd-handle\`) that is the only drag activator, followed by the \`content\` region. By default the dragged row renders dimmed at its prospective slot (the \`dragging\` theme variant) and the others flip around it; \`indicator\` keeps the DOM order stable until drop.

## Accessibility

- Renders a real \`<ul>\` / \`<li>\` list; the default grip handle is a real \`<button>\` with a localized \`aria-label\`.
- Drag and drop is pointer-driven (native HTML5 drag); there is no keyboard sorting. Offer explicit move buttons or an alternate flow where keyboard reordering is a requirement.

## Notes
- State changes and \`onReorder\` fire once, at drop. Both feedback modes resolve from the same hover state as the final drop.
- If the list sits in a scroll container (or is one), dragging near its edges auto-scrolls it.
- Animations respect \`prefers-reduced-motion\`.
- Ids must be stable and unique; using an array index as the id breaks reordering.
- Theme parts: \`root\` (variants: \`size\`, \`orientation\`), \`item\` (variants: \`size\`, \`handle\`, \`dragging\`, \`disabled\`), \`content\`, \`handle\` (variant: \`size\`), \`empty\`.
`;
