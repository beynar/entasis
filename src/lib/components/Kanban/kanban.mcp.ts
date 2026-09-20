export const kanbanDescription = `
# Kanban Component

A column board with drag-and-drop cards, built on the \`useDndList\` attachment
utility (Pragmatic drag and drop). Cards reorder within a column and move across
columns; columns themselves reorder by dragging their header. It supports a
live placeholder preview or an insertion-line indicator; accept/reject logic and
edge math come from the utility.

## Basic Usage

\`\`\`svelte
<script>
	import { Kanban } from 'entasis/kanban';

	let columns = $state([
		{ id: 'todo', title: 'Todo', cards: [{ id: 'a', title: 'Write specs' }] },
		{ id: 'doing', title: 'Doing', cards: [] },
		{ id: 'done', title: 'Done', cards: [] }
	]);
</script>

<Kanban bind:columns />
\`\`\`

## Props

### Core Props
- **columns**: KanbanColumnData[] (bindable, required) - The board data; reassigned on every card/column move
  - KanbanColumnData: { id, title, cards, color?, limit? }
  - KanbanCard: { id, title?, description? } — only \`id\` is required; \`title\`/\`description\` feed the default card (title falls back to id). Extend with your own fields and render them via the card snippet
- **accepts**: ({ card, from, to }) => boolean - Cross-column move policy; return false to reject (no preview, drop ignored). Column \`limit\` is enforced on top.
- **sortableColumns**: boolean (default: true) - Columns reorder by dragging their header
- **disabled**: boolean (default: false) - Read-only board: cards and columns render but cannot move
- **canDrag**: ({ card, column }) => boolean - Per-card drag gate; return false to keep a card in place
- **cardHandle**: boolean (default: false) - Cards drag only from an element marked \`data-dnd-handle\` — for cards with interactive content. The default card renders a grip; custom card snippets receive it as the \`handle\` param (\`{@render handle()}\`) or mark their own element
- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal') - Spacing token scaling header, list and card paddings/gaps; also stamped as data-density on the root
- **columnHeight**: string - Fixed column height (any CSS length, e.g. '28rem'). Card lists scroll inside it and auto-scroll while a drag hovers near their edges, so cards can be dropped anywhere in a long column. Omit for auto height.
- **indicator**: boolean (default: false) - Keeps cards and columns in place during drag and draws the shared insertion line. When false, the dragged card/column renders as a dimmed placeholder at its prospective slot.
- **animated**: boolean (default: true) - Enables FLIP movement for the live preview and final settling after drop. The bound columns state only changes at drop. Automatically disabled under prefers-reduced-motion.

### Event Props
- **onCardMove**: ({ card, from: { columnId, index }, to: { columnId, index }, columns }) => void - Fires once per completed move (same-column reorders included), AFTER the single \`columns\` reassignment; \`columns\` is the new board state (for cross-column moves, \`from.index\` is the card's index at drag start)
- **onColumnMove**: ({ column, from, to }) => void - Fires when a column is reordered
- **onCardDragStart**: ({ card, column, index }) => void - A card drag started
- **onCardDragEnd**: ({ card, dropped }) => void - A card drag ended (drop or cancel), after state updates

### Content Props (Slots)

Every content slot is a \`Slot\`: pass a plain string for static text, or a snippet for markup.

- **card**: Slot<KanbanCardPayload> — a string or a snippet taking { card, column, index, columnIndex, isDragging, handle } - Custom card renderer (default: title + muted description). \`index\` and \`columnIndex\` are the rendered positions (following the live preview unless \`indicator\` is enabled); \`isDragging\` identifies the dragged card; \`handle\` is the ready-made drag grip (data-dnd-handle) — render it wherever the grip belongs, it is empty unless \`cardHandle\` is on
- **columnHeader**: Slot<KanbanColumnPayload> — a string or a snippet taking { column, index } - Custom header (default: color dot + title + count, count shows "n / limit" when a limit is set)
- **columnFooter**: Slot<KanbanColumnPayload> — a string or a snippet taking { column, index } - Rendered below the card list (e.g. an "Add card" button), via the \`footer\` theme part
- **column**: Slot<KanbanColumnContentPayload> — a string or a snippet taking { column, index, header, items, footer } - Full column composition: \`header\`/\`items\`/\`footer\` are ready-made snippets (\`items\` is the dnd-wired card list — drop target, live preview, animations). Render them in any arrangement with your own chrome; replaces the default layout inside the column shell.

\`\`\`svelte
<Kanban bind:columns>
	{#snippet column({ column, header, items })}
		{@render header()}
		{@render items()}
		<button onclick={() => addCard(column.id)}>+ Add card</button>
	{/snippet}
</Kanban>
\`\`\`
- **empty**: Slot<KanbanEmptyPayload> — a string or a snippet taking { column } - Rendered inside an empty column's list (via the \`empty\` theme part). Nothing renders by default — the empty list keeps its min-height and data-dnd-over tint as the drop area

### Styling Props
- **class**: string - Classes for the board container
- **ref**: HTMLElement | null (bindable) - Reference to the board's root element; other HTML attributes spread onto it
- **theme**: KanbanThemeProps - Theme overrides

## Behavior notes

- A column with \`limit\` rejects incoming drops when full (its own reorders still work); the header count renders "n / limit".
- Cards from another Kanban instance on the same page are rejected automatically (list ids are namespaced per board).
- Drop position uses the live preview by default: the dragged card sits dimmed ([data-kanban-preview]) at the slot it would land in and cards part to make room. With \`indicator\`, cards remain fixed and the shared line marks the insertion edge. The hovered column list also tints (data-dnd-over).
- Drop targets are sticky: slightly overshooting a column's bounds keeps the preview at the last position and the drop still lands there (the preview always shows what a drop will do). A drag that never hovered another column drops as a no-op.
- With \`columnHeight\` set (or any scrollable ancestor), dragging near a scroll container's edge auto-scrolls it; the board itself also auto-scrolls horizontally when dragging near its sides.
- While the columns are wider than the board, the root becomes a named \`role="region"\` with \`tabindex="0"\` so the horizontal scroll is reachable from the keyboard; the tab stop disappears again once everything fits.

### Scrollable columns
\`\`\`svelte
<Kanban bind:columns columnHeight="28rem" />
\`\`\`

## Examples

### Move policy and limits
\`\`\`svelte
<Kanban
	bind:columns
	accepts={({ from, to }) => forwardOnly(from.id, to.id)}
	onCardMove={(move) => console.log(move)}
/>
\`\`\`

### Custom card
\`\`\`svelte
<script lang="ts">
	import { Kanban, type KanbanCard, type KanbanColumnData } from 'entasis/kanban';
	import { Chip } from 'entasis/chip';

	// Extend KanbanCard with your own fields; the card snippet receives them typed.
	type TaskCard = KanbanCard & { priority: 'high' | 'low' };

	let columns: KanbanColumnData<TaskCard>[] = $state([
		{ id: 'todo', title: 'Todo', cards: [{ id: 'a', title: 'Write specs', priority: 'high' }] },
		{ id: 'done', title: 'Done', cards: [] }
	]);
</script>

<Kanban bind:columns>
	{#snippet card({ card })}
		<div class="rounded-lg bg-surface-floating px-3 py-2 ring-1 ring-neutral/10">
			<span class="text-sm font-medium">{card.title}</span>
			<Chip size="small" color={card.priority === 'high' ? 'danger' : 'info'}>{card.priority}</Chip>
		</div>
	{/snippet}
</Kanban>
\`\`\`

## Theme Customization

Parts: root, column, columnWrapper (dragging variant), columnHeader (sortable,
density variants), columnDot, columnTitle, count, list (density), card (density,
handle variants), cardWrapper (dragging — the dimmed placeholder), cardHandle,
cardTitle, cardDescription, empty, footer (density).

\`\`\`svelte
<Kanban
	bind:columns
	theme={{
		column: { base: 'w-80' },
		list: { base: 'gap-2' }
	}}
/>
\`\`\`
`;
