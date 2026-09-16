export const tableOfContentsDescription = `
# TableOfContents Component

TableOfContents discovers headings inside a content target or accepts an explicit item array, then renders native anchor links beside a measured, indented rail. Wrapped labels stay aligned because the rail is measured from the rendered links. Every matching heading currently visible in the viewport is highlighted, while the last visible heading receives \`aria-current="location"\`.

## Basic Usage

\`\`\`svelte
<script lang="ts">
  import { TableOfContents } from 'svelai/table-of-contents';
</script>

<aside>
  <TableOfContents target="#article" levels={[2, 3, 4]} />
</aside>

<article id="article">
  <h2>Foundations</h2>
  <h3>Tokens</h3>
  <h4>Color roles</h4>
</article>
\`\`\`

Headings without an \`id\` receive a stable slug id when discovered. Existing unique ids are preserved. Links remain ordinary \`href="#heading-id"\` anchors, so browser history works normally. Use author ids when headings must remain addressable without scripts.

## Props

- **target**: \`string | HTMLElement | null\` - CSS selector or element containing the headings to discover or use as the visibility boundary. Selector targets receive a pre-hydration fallback; element targets are discovered on the client.
- **items**: \`readonly TableOfContentsItem[]\` - Explicit ordered data with \`id\`, \`level\`, and \`title\`. When provided, it takes precedence over target discovery, including an empty array. Matching heading ids enable visibility highlighting; links still render when a heading is absent.
- **levels**: \`readonly (1 | 2 | 3 | 4 | 5 | 6)[]\` (default: \`[2, 3, 4]\`) - Semantic heading levels included in document order.
- **activationThresholds**: \`{ viewportInset?: number; scrollRootInset?: number; currentOffset?: number }\` - Controls the active region. Defaults are \`96\`, \`16\`, and \`48\` pixels respectively. Negative values clamp to zero; non-finite values use their default.
- **scrollOffset**: \`number\` - Optional anchor landing offset in pixels. Applies \`scroll-margin-block-start\` to matched headings, clamps negative values to zero, and leaves existing heading styles untouched when omitted.
- **density**: \`number | 'compact' | 'normal' | 'comfortable'\` (default: \`'normal'\`) - Row density preset or numeric density factor. Presets resolve to \`0.6\`, \`0.8\`, and \`1\` respectively. Negative factors clamp to \`0\`; non-finite factors resolve to the default.
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`) - Scales title typography, indentation, bends, connectors, strokes, and markers together. Rail geometry factors resolve to \`0.875\`, \`1\`, and \`1.125\` respectively.
- **showRail**: \`boolean\` (default: \`true\`) - Shows the continuous measured rail path. Connectors and markers remain independently controlled by their own props.
- **showMarkers**: \`boolean | 'active' | 'always'\` (default: \`true\`) - Controls marker visibility. \`true\` is an alias for active-only markers, \`'always'\` shows a marker for every item, and \`false\` hides them.
- **showConnectors**: \`boolean\` (default: \`true\`) - Shows the lateral lines between the rail and labels. Disabling them contracts the label gutter to a small gap after the marker or rail.
- **indentSize**: \`number\` (default: \`14\`) - Base horizontal pixels added for each deeper semantic heading level before the size factor is applied. Invalid or negative values resolve to \`0\`.
- **indentRadius**: \`number\` (default: \`6\`) - Base maximum pixel radius used when the rail bends between heading depths before the size factor is applied. The rendered radius is clamped to the available horizontal and vertical space. Use \`0\` for square corners.
- **color**: semantic color token (default: \`'primary'\`) - Highlight color for visible labels, rail segments, and markers.
- **label**: \`string\` (default: \`'Table of contents'\`) - Accessible navigation landmark label.
- **ref**: bindable \`HTMLElement | null\` - Root navigation reference.
- **class**: \`string\` - Classes merged onto the root navigation element.
- **theme**: \`TableOfContentsThemeProps\` - Per-instance theme overrides.

## Target Selectors

\`\`\`svelte
<TableOfContents target="#article" levels={[2, 3]} />

<article id="article">
  <h2 id="overview">Overview</h2>
  <h3 id="requirements">Requirements</h3>
</article>
\`\`\`

A selector target renders a pre-hydration list, neutral rail, and connectors into a stable server-rendered shell, preventing the navigation from appearing only after hydration. Active segments and markers begin with hydrated visibility tracking. Use a unique selector for each article. Element references remain available for dynamic targets, but they are discovered after hydration and therefore cannot provide this initial fallback.

## Explicit Items

\`items\` is useful when Markdown, a CMS, or another parser already produced the table-of-contents data.

\`\`\`svelte
<script lang="ts">
  import { TableOfContents, type TableOfContentsItem } from 'svelai/table-of-contents';

  const items: TableOfContentsItem[] = [
    { id: 'overview', level: 2, title: 'Overview' },
    { id: 'requirements', level: 3, title: 'Requirements' }
  ];
</script>

<TableOfContents {items} />

<article>
  <h2 id="overview">Overview</h2>
  <h3 id="requirements">Requirements</h3>
</article>
\`\`\`

Array order is preserved, duplicate or empty ids are omitted, and \`levels\` still filters the result. The list and neutral rail render before hydration. Add \`target\` as well when the headings live inside a specific clipping or dynamically changing content region.

## Rail Treatments

\`\`\`svelte
<TableOfContents
  target="#article"
  size="small"
  showRail={false}
  showMarkers="always"
  showConnectors
  indentSize={20}
  indentRadius={0}
  density="compact"
  color="secondary"
/>
\`\`\`

## Activation Thresholds

\`viewportInset\` defines the active band inside the browser viewport when the content has no clipping ancestor. \`scrollRootInset\` applies the same rule to nested scrolling and clipping containers. \`currentOffset\` chooses the current heading between visible heading boundaries.

\`\`\`svelte
<TableOfContents
  target="#article"
  activationThresholds={{
    viewportInset: 80,
    scrollRootInset: 12,
    currentOffset: 32
  }}
/>
\`\`\`

## Anchor Landing Offset

\`scrollOffset\` keeps linked headings clear of sticky headers without replacing native anchor behavior. It works for click navigation, browser history, deep links, and nested scroll containers because the offset is applied through logical CSS scroll margin.

\`\`\`svelte
<TableOfContents target="#article" scrollOffset={72} />
\`\`\`

## Behavior

- Heading text and ids are refreshed when the target content changes.
- Explicit items retain their supplied titles and order; target mutations only refresh their heading associations.
- Selector targets render matching heading links and measured neutral rail geometry into a stable shell before hydration. Always-visible markers render there too, then hand off to measured live state.
- Layout and active state are synchronized through resize, scroll, and hash changes.
- Activation thresholds update reactively and retain the existing \`96 / 16 / 48\` behavior when omitted.
- Scroll offset updates reactively. The component restores each heading's previous inline scroll margin when the prop is removed, the heading leaves the target, or the component is destroyed.
- Nested clipping and scroll containers are intersected automatically for visibility calculations.
- Long TOCs use ScrollArea inside their bounded navigation viewport; active-link tracking never moves an application ancestor.
- Density changes vertical spacing only; size scales typography and coordinated rail geometry.
- Rail, connectors, and markers are independent. The gutter remains while any decoration is enabled and collapses only when all three are false.
- Connector mode uses the extended lateral gutter; without connectors, labels move closer to the marker or rail edge.
- Marker visibility can follow active headings, remain visible for every item, or be disabled. Always-visible markers use the neutral rail color until their heading is active. Marker size follows both semantic heading depth and the component size.
- The SVG is decorative and pointer-inert. The ordered list retains valid navigation semantics.

## Accessibility

- Renders a labelled \`nav\` landmark containing an ordered list of native anchor links.
- The last visible heading uses \`aria-current="location"\`.
- Keyboard focus uses the selected semantic color and remains independent from pointer hover.
- Selector targets assign generated heading ids before hydration; element targets assign them during client discovery. Use author-supplied ids for no-script deep links.

## Theme Parts

- **root**: navigation landmark
- **content**: relative rail/list composition wrapper
- **list**: ordered list
- **item**: list item
- **link**: native anchor, with \`size\` and \`highlighted\` variants
- **rail**: decorative SVG
- **track**: inactive rail and connectors
- **active**: highlighted rail and connectors
- **marker**: active or always-visible discs
`;
