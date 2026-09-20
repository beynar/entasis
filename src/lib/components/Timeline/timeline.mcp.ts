export const timelineDescription = `
# Timeline

Render an ordered sequence of dated or descriptive events on a vertical or horizontal axis. Timeline owns the semantic list, item surfaces, axis anchors, markers, connectors, responsive alternate collapse, and horizontal overflow behavior. Input order is always render order.

## Basic usage

\`\`\`svelte
<script lang="ts">
  import { Timeline, type TimelineItem } from 'entasis/timeline';

  const items: TimelineItem[] = [
    {
      id: 'placed',
      date: 'Mar 15, 2024',
      datetime: '2024-03-15',
      title: 'Order placed',
      description: 'Your order has been received.'
    },
    {
      id: 'payment',
      date: 'Mar 16, 2024',
      datetime: '2024-03-16',
      title: 'Payment confirmed',
      color: 'success'
    }
  ];
</script>

<Timeline {items} />
\`\`\`

The default configuration is a vertical timeline with all content on the logical end side of the axis.

## Props

### Data and layout

- **items**: \`readonly Item[]\` (required) — entries in display order. \`Item\` must extend \`TimelineItem\`.
- **orientation**: \`'vertical' | 'horizontal'\` (default: \`'vertical'\`) — direction of the sequence axis.
- **placement**: \`'start' | 'end' | 'alternate'\` (default: \`'end'\`) — logical side used for item surfaces. Alternate placement starts on \`end\`, then alternates by array index.
- **variant**: \`'ghost' | 'card' | 'outline' | 'soft'\` (default: \`'ghost'\`) — global surface treatment for all entries.
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`) — title and description typography, marker and icon scale, and loading Spinner scale.
- **density**: \`'compact' | 'normal' | 'comfortable'\` (default: \`'normal'\`) — item gaps, surface padding, connector spacing, and horizontal item minimum width.
- **color**: Entasis semantic color (default: \`'neutral'\`) — default marker and outline or soft surface accent.
- **connectorColor**: Entasis semantic color (default: \`'neutral'\`) — default outgoing connector color.
- **showConnectors**: \`boolean\` (default: \`true\`) — shows connector segments between markers.
- **scrollFade**: \`boolean\` (default: \`true\`) — applies the shared logical horizontal scroll fade only while a horizontal timeline actually overflows.
- **i18n**: \`Partial<Messages>\` — per-instance translations merged over the global i18n catalog.

### Custom rendering

- **item**: \`Snippet<[TimelineItemPayload<Item>]>\` — replaces the content inside each Timeline-owned variant surface.
- **marker**: \`Snippet<[TimelineItemPayload<Item>]>\` — replaces the marker visual inside the Timeline-owned axis anchor.
- **opposite**: \`Snippet<[TimelineItemPayload<Item>]>\` — replaces the opposite track in alternate placement. Its default renderer is the item date. TypeScript rejects this prop with fixed \`start\` or \`end\` placement.

### Root element

- **ref**: \`HTMLOListElement | null\` (bindable) — reference to the root \`<ol>\`.
- **class**: \`string\` — additional root classes.
- **theme**: \`TimelineThemeProps\` — per-instance overrides for Timeline theme parts.
- Native ordered-list attributes and Svelte attachments are forwarded to the root.

## Item shape

\`\`\`ts
type TimelineItem = {
  id?: string | number;
  title: Slot;
  date?: Slot;
  datetime?: string;
  description?: Slot;
  icon?: Slot;
  loading?: boolean;
  color?: Colors;
  connectorColor?: Colors;
  side?: 'start' | 'end';
};
\`\`\`

- \`title\` is required. \`title\`, \`date\`, \`description\`, and \`icon\` accept a string or snippet.
- \`id\` is optional. Use a stable explicit ID when entries can reorder; otherwise Timeline uses the array index as identity.
- \`datetime\` adds the machine-readable value to a default \`<time>\` element when \`date\` is present.
- \`icon\` replaces the default dot inside the default marker.
- \`loading\` replaces the default marker visual with a color- and size-aware Spinner.
- \`color\` overrides the root color for this marker and its outline or soft surface.
- \`connectorColor\` overrides the root color for this item's outgoing connector. It has no effect on the final item.
- \`side\` overrides alternate parity for one item. It is not valid with fixed placement.

## Placement and dates

Fixed \`start\` and \`end\` placement keeps every surface on one logical side. The default content renders the date before the title inside each surface.

\`placement="alternate"\` creates an opposite track and starts the first item on \`end\`. Its default opposite renderer displays the date. Set \`item.side\` to place a specific alternate item on \`start\` or \`end\` without changing the array order.

\`\`\`svelte
<Timeline items={milestones} placement="alternate" variant="card" />
\`\`\`

Timeline treats dates as display content. It does not parse, format, compare, or sort them. It also has no completed, current, or pending status model. Put status meaning in the title or description and use semantic color or a custom marker only as supporting presentation.

## Generic snippets and defaults

Application item types can extend \`TimelineItem\`. The extended type remains available as \`payload.item\` in all three renderer snippets.

\`\`\`svelte
<script lang="ts">
  import { Timeline, type TimelineItem } from 'entasis/timeline';

  type Release = TimelineItem & {
    version: string;
    href: string;
  };

  const releases: Release[] = [
    { id: 'v2', title: 'Version 2 released', version: '2.0.0', href: '/releases/v2' }
  ];
</script>

<Timeline items={releases}>
  {#snippet item({ item, defaultContent })}
    <a href={item.href} class="block">
      {@render defaultContent()}
      <span class="text-neutral/70 text-xs">{item.version}</span>
    </a>
  {/snippet}
</Timeline>
\`\`\`

Every snippet receives:

\`\`\`ts
type TimelineItemPayload<Item extends TimelineItem> = Readonly<{
  item: Item;
  index: number;
  side: 'start' | 'end';
  orientation: 'vertical' | 'horizontal';
  color: Colors;
  connectorColor: Colors;
  isFirst: boolean;
  isLast: boolean;
  defaultContent: Snippet;
  defaultMarker: Snippet;
  defaultOpposite: Snippet;
}>;
\`\`\`

Call \`defaultContent()\`, \`defaultMarker()\`, or \`defaultOpposite()\` to wrap or extend the matching default renderer. A custom \`marker\` snippet that does not call \`defaultMarker()\` owns its complete marker visual, including loading presentation. Timeline still owns the \`<ol>\`, each \`<li>\`, axis and connector geometry, marker anchor, opposite track, and variant surface.

## Responsive alternate layout

A vertical alternate timeline uses its own inline-size container. Below \`40rem\`, it moves the axis to the logical start edge, places every main surface on the end side, and places opposite content before the main surface. DOM and input order do not change. Per-item \`side\` values remain in the payload, but their visual side effect is suspended while the layout is collapsed.

## Horizontal overflow

Horizontal entries stay on one axis and use density-controlled minimum widths. They do not wrap or compress; the root uses native horizontal scrolling. Timeline measures real overflow with \`ResizeObserver\`, applies \`scroll-fade-x\` only when needed, and makes the ordered list keyboard-focusable only while it overflows. The fade and native scrolling use logical inline direction and work in LTR and RTL layouts.

## Variants

- \`ghost\`: no surface chrome.
- \`card\`: neutral raised surface with a quiet ring and shadow.
- \`outline\`: transparent surface with a ring in the resolved item color.
- \`soft\`: muted surface in the resolved item color.

The variant is global. Timeline does not support per-item variant overrides.

## Runtime validation

Timeline throws a descriptive \`TypeError\` when:

- two items have the same explicit \`id\`;
- an item supplies \`side\` while placement is fixed to \`start\` or \`end\`.

The ID check preserves number and string identity, so \`1\` and \`'1'\` are different IDs. TypeScript separately rejects \`opposite\` with fixed placement.

## Accessibility

- The root is an ordered list and every event is a list item.
- Axis anchors, markers, and connectors are decorative and hidden from assistive technology. Do not use marker color or shape as the only status signal.
- A default loading marker has a localized polite status announcement outside the decorative axis.
- A default date with \`datetime\` renders as a semantic \`<time>\` element.
- An overflowing horizontal timeline becomes a native keyboard scroll region; a non-overflowing timeline adds no tab stop.

## Theme parts

\`root\`, \`item\`, \`opposite\`, \`axis\`, \`connector\`, \`marker\`, \`content\`, \`date\`, \`titleRow\`, \`title\`, \`description\`, and \`loading\`.

Timeline is display-only. It has no selection, navigation, event callbacks, animation state, bindable controller, date processing, or built-in progress status.
`;
