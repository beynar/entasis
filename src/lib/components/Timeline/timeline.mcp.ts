export const timelineDescription = `
# Timeline

Render an ordered sequence of dated or descriptive events on a vertical or horizontal axis. Timeline owns the semantic list, item surfaces, axis anchors, markers, connectors, responsive alternate collapse, horizontal overflow behavior, and opt-in item selection. Input order is always render order.

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
- **connectorColor**: Entasis semantic color — default outgoing connector color. When omitted, an item with \`progress\` uses its own resolved color for its connector, and every other item uses \`'neutral'\`.
- **showConnectors**: \`boolean\` (default: \`true\`) — shows connector segments between markers.
- **scrollFade**: \`boolean\` (default: \`true\`) — applies the shared logical horizontal scroll fade only while a horizontal timeline actually overflows.
- **i18n**: \`Partial<Messages>\` — per-instance translations merged over the global i18n catalog.

### Selection

- **selectable**: \`boolean\` (default: \`false\`) — makes every item a toggle button that selects it. See Selection below. Without it Timeline renders no buttons and ignores \`value\`, \`defaultValue\`, and \`item.disabled\`.
- **value**: \`TimelineValue\` (\`string | number\`, bindable) — the selected item's value: its \`id\`, or its index when it has no \`id\`. A value naming no item selects nothing.
- **defaultValue**: \`TimelineValue\` — initial selection when \`value\` is omitted.
- **onValueChange**: \`(payload: TimelineValueChangePayload<Item>) => void\` — called once per selection change made by a click, Enter, Space, or a payload's \`select()\`, with \`{ value, item, index }\`. Not called when the selected item is selected again or when \`value\` changes from outside.

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
  progress?: 'done' | 'current' | 'upcoming';
  side?: 'start' | 'end';
  disabled?: boolean;
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
- \`progress\` marks a step of a process (\`TimelineProgress\`). See Step progress below.
- \`disabled\` keeps the item from being selected in a \`selectable\` timeline; the arrow keys skip it. It changes nothing else.

## Placement and dates

Fixed \`start\` and \`end\` placement keeps every surface on one logical side. The default content renders the date before the title inside each surface.

\`placement="alternate"\` creates an opposite track and starts the first item on \`end\`. Its default opposite renderer displays the date. Set \`item.side\` to place a specific alternate item on \`start\` or \`end\` without changing the array order.

\`\`\`svelte
<Timeline items={milestones} placement="alternate" variant="card" />
\`\`\`

Timeline treats dates as display content. It does not parse, format, compare, or sort them.

## Step progress

Give each item a \`progress\` to draw a process's progress band, such as a file's six stages, so a reader sees at a glance what is done, what is under way, and what is to come:

\`\`\`svelte
<script lang="ts">
  import { Timeline, type TimelineItem } from 'entasis/timeline';

  const steps: TimelineItem[] = [
    { id: 'opened', title: 'Opened', progress: 'done' },
    { id: 'documents', title: 'Documents', progress: 'done' },
    { id: 'appraisal', title: 'Appraisal', progress: 'current' },
    { id: 'report', title: 'Report', progress: 'upcoming' }
  ];
</script>

<Timeline items={steps} orientation="horizontal" color="primary" />
\`\`\`

- \`done\`: the marker is filled with the item color and carries a check. Its outgoing connector is solid.
- \`current\`: the marker is a ring in the item color around a point. The \`<li>\` gets \`aria-current="step"\`. Its outgoing connector is faint.
- \`upcoming\`: the marker is a quiet neutral ring carrying the step number (the item's position, from 1). Its outgoing connector is faint.
- Markers keep the size's marker scale. Progress connectors are 2px thick instead of the hairline, so the done part of the band stands out.
- An item \`icon\` replaces the check, the point, or the number, and keeps the progress ring and fill. \`loading\` replaces the whole marker with the Spinner.
- \`progress\` is per item: Timeline does not derive it from an index, so a host may mark any combination.
- The step's state is not announced by the markers, which stay decorative. Put it in the item's own text (for example "Step 3 of 6, done") or an \`item\` snippet. \`aria-current="step"\` on the current item is the only state Timeline adds.
- The \`marker\` snippet still replaces every marker: read \`payload.item.progress\` and call \`defaultMarker()\` for the steps it leaves alone. Theme overrides reach the \`progress\` variant of the \`marker\` and \`connector\` parts, for example \`theme={{ connector: { progress: { done: 'bg-success' } } }}\`.
- Styling hooks: \`data-progress\` on the item, its marker and its outgoing connector.

## Selection

Set \`selectable\` to let a click on a step open its panel. Each item gets a real \`<button type="button">\` stretched over the whole \`<li>\` (title, description, marker, and the space around them), with \`aria-pressed\` for the selected item. Selection follows the editable-state contract: bind \`value\`, or pass \`defaultValue\` and \`onValueChange\`.

\`\`\`svelte
<script lang="ts">
  import { Timeline, type TimelineItem, type TimelineValue } from 'entasis/timeline';

  type RunStep = TimelineItem & { id: string; summary: string };

  const steps: RunStep[] = [
    { id: 'fetch', title: 'Fetch sources', progress: 'done', summary: 'Pulled 418 files.' },
    { id: 'analyze', title: 'Analyze', progress: 'current', summary: '61 of 140 modules done.' },
    { id: 'report', title: 'Report', progress: 'upcoming', summary: 'Not started.' },
    { id: 'publish', title: 'Publish', progress: 'upcoming', disabled: true, summary: 'Needs a report.' }
  ];

  let selected = $state<TimelineValue | undefined>('analyze');
  const step = $derived(steps.find((candidate) => candidate.id === selected));
</script>

<Timeline
  items={steps}
  orientation="horizontal"
  color="primary"
  selectable
  bind:value={selected}
  onValueChange={({ item }) => console.log(item.summary)}
  aria-label="Run steps"
/>

{#if step}
  <section aria-label={step.id}>{step.summary}</section>
{/if}
\`\`\`

- **Value.** An item's value is its \`id\`; an item without one is selected by its array index, which shifts when the array reorders, so give items an \`id\` when they can move. Timeline throws a \`TypeError\` when an index fallback equals another item's numeric \`id\`.
- **Re-selecting** the selected item changes nothing: there is no deselect gesture. Clear the selection by setting \`value\` to \`undefined\`. Removing the selected item leaves \`value\` as it was, naming no item.
- **Keyboard.** The buttons share one tab stop: the selected item, else the \`progress: 'current'\` step, else the first enabled item. In a horizontal timeline ArrowLeft and ArrowRight move it (mirrored in right-to-left layouts); in a vertical one ArrowUp and ArrowDown. Home and End jump to the ends, and the arrows wrap. Moving focus never selects; Enter and Space select. Escape is left to the surrounding UI. Disabled items are disabled buttons, never focused. The tab stop follows its item through inserts, removals, and reorders. A selectable horizontal timeline that overflows adds no scroll stop of its own: moving focus scrolls the item into view.
- **Name.** The button is named by the item's title through \`aria-labelledby={payload.titleId}\`; the default title carries that id. An \`item\` snippet that does not render \`defaultContent()\` puts \`id={titleId}\` on its own title (a string \`title\` also names the button through \`aria-label\` as a fallback). The current step's button repeats \`aria-current="step"\`; selection never uses \`aria-current\`.
- **Custom content.** The button is empty and sits under the item's parts, which let the pointer through to it, so nothing interactive is nested in it. Links, buttons, and form fields inside an \`item\` or \`opposite\` snippet stay clickable above it and do not select. A snippet can also call \`payload.select()\`, and read \`payload.selected\`, \`payload.disabled\`, and \`payload.value\`.
- **Styling.** The item surface (\`content\` part) paints the selected recipe (\`bg-selected-muted text-selected-muted-readable\`) in every variant; \`card\`, \`outline\`, and \`soft\` also ring it in the selected role. A ghost item gets a rounded surface that reaches past its text toward the axis. Hover and press tint the surface through the shared state layer, keyboard focus rings it (\`ring-focus/50\`), and the cursor is a pointer. The \`itemButton\` theme part styles the invisible button; the \`content\`, \`title\`, \`description\`, and \`date\` parts take \`selected\` variants, and \`content\` takes \`selectable\` and \`interactive\` (selectable and not disabled).
- **Styling hooks.** In a selectable timeline each \`<li>\` carries \`data-selected\` while selected and \`data-disabled\` while disabled (presence attributes); the button is \`data-slot="timeline-item-button"\`.

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
  value: string | number;
  selectable: boolean;
  selected: boolean;
  disabled: boolean;
  select: () => void;
  titleId: string;
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
- an item supplies \`side\` while placement is fixed to \`start\` or \`end\`;
- in a \`selectable\` timeline, an item without an \`id\` falls back to an index that is another item's numeric \`id\`.

The ID check preserves number and string identity, so \`1\` and \`'1'\` are different IDs. TypeScript separately rejects \`opposite\` with fixed placement.

## Accessibility

- The root is an ordered list and every event is a list item.
- Axis anchors, markers, and connectors are decorative and hidden from assistive technology. Do not use marker color or shape as the only status signal.
- An item with \`progress: 'current'\` carries \`aria-current="step"\`.
- A default loading marker has a localized polite status announcement outside the decorative axis.
- A default date with \`datetime\` renders as a semantic \`<time>\` element.
- An overflowing horizontal timeline becomes a native keyboard scroll region; a non-overflowing timeline adds no tab stop. A \`selectable\` timeline is reached through its one item tab stop instead.
- A \`selectable\` timeline renders one toggle button per item (\`aria-pressed\`), named by the item title. See Selection.

## Theme parts

\`root\`, \`item\`, \`opposite\`, \`axis\`, \`itemButton\`, \`connector\`, \`marker\`, \`content\`, \`date\`, \`titleRow\`, \`title\`, \`description\`, and \`loading\`.

Timeline is display-only unless \`selectable\`: then selection is its only state. It has no navigation, animation state, bindable controller, or date processing. Step \`progress\` is presentation the host sets per item, not a state Timeline advances, and selecting an item does not change its progress.
`;
