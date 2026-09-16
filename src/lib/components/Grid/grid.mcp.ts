export const gridDescription = `
# Grid and GridSpan

Grid creates fixed, intrinsically responsive, or per-breakpoint CSS grid layouts. GridSpan is a
direct-child composition primitive for spanning columns and implicit rows.

## Import

\`\`\`svelte
<script lang="ts">
  import { Grid, GridSpan } from 'svelai/grid';
</script>
\`\`\`

## Responsive grid

\`\`\`svelte
<Grid columns={{ minWidth: 240, max: 3 }} gap="xl">
  {#each items as item}
    <article>{item.title}</article>
  {/each}
</Grid>
\`\`\`

## Columns

- A number creates that many equal-width tracks.
- \`{ minWidth }\` creates responsive \`auto-fill\` tracks.
- \`repeat: 'fit'\` switches to \`auto-fit\`, collapsing empty tracks.
- \`max\` caps the count while allowing the tracks that are present to fill the row.
- Invalid or non-positive fixed counts resolve to one column.

## Container breakpoints

\`columns\`, \`gap\`, \`rowGap\` and \`columnGap\` also accept a per-breakpoint record or a function
of the breakpoint. The steps measure the width the GRID was handed, not the device, so the same
grid is one column in a sidebar and four across a page.

\`\`\`svelte
<Grid columns={{ xs: 1, sm: 2, lg: 4 }} gap={{ xs: 'sm', lg: 'xl' }}>
  {#each items as item}
    <article>{item.title}</article>
  {/each}
</Grid>
\`\`\`

- Steps: \`xs\` base, \`sm\` 36rem, \`md\` 42rem, \`lg\` 56rem, \`xl\` 72rem of grid width.
- The nearest defined key at or below the current width wins, so \`{ sm: 2, lg: 4 }\` is 2 columns
  at \`md\` as well; below \`sm\` the component default (one column) applies.
- An object is a breakpoint record only when every key is a breakpoint name, so
  \`{ minWidth: 240, max: 3 }\` stays a single auto-fill configuration.
- \`rowGap\` and \`columnGap\` fall back to whatever \`gap\` resolves to at that same breakpoint.
- Resolution happens while rendering, so the first paint and the server render are already correct;
  nothing is measured in the browser.

## Spacing and alignment

- \`gap\`, \`rowGap\`, and \`columnGap\` accept \`none | xs | sm | md | lg | xl\`.
- Axis-specific gaps override \`gap\` on their axis.
- \`align\` controls \`align-items\`; \`justify\` controls \`justify-items\`.
- \`rowHeight\` sets implicit row height in pixels for masonry-like span layouts.

## GridSpan

\`\`\`svelte
<Grid columns={4} rowHeight={64} gap="lg">
  <GridSpan columns={{ xs: 'full', md: 2 }} rows={2}>Featured</GridSpan>
  <GridSpan columns="full">Full width</GridSpan>
</Grid>
\`\`\`

Use GridSpan as a direct child of Grid. \`columns="full"\` spans from the first to the last
grid line; numeric columns and rows use positive integer spans. A responsive span steps with the
width of the Grid it sits in, on the same breakpoints as that grid's columns.

## Structure

Grid renders two elements: a root that is the size and the container being measured, and the grid
itself inside it. \`class\`, \`style\` and forwarded attributes land on the root; theme overrides
reach the inner element through the \`tracks\` part.

Both components forward common semantic HTML attributes and Svelte attachments to their root elements.
The internal \`micro\` and \`layout-*\` spacing tokens are reserved for component recipes and must
not be used in generated interfaces.
`;
