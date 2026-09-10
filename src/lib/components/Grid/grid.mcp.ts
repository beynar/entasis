export const gridDescription = `
# Grid and GridSpan

Grid creates fixed or intrinsically responsive CSS grid layouts. GridSpan is a direct-child
composition primitive for spanning columns and implicit rows.

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

## Spacing and alignment

- \`gap\`, \`rowGap\`, and \`columnGap\` accept \`none | xs | sm | md | lg | xl\`.
- Axis-specific gaps override \`gap\` on their axis.
- \`align\` controls \`align-items\`; \`justify\` controls \`justify-items\`.
- \`rowHeight\` sets implicit row height in pixels for masonry-like span layouts.

## GridSpan

\`\`\`svelte
<Grid columns={4} rowHeight={64} gap="lg">
  <GridSpan columns={2} rows={2}>Featured</GridSpan>
  <GridSpan columns="full">Full width</GridSpan>
</Grid>
\`\`\`

Use GridSpan as a direct child of Grid. \`columns="full"\` spans from the first to the last
grid line; numeric columns and rows use positive integer spans.

Both components forward common semantic HTML attributes and Svelte attachments to their root elements.
The internal \`micro\` and \`layout-*\` spacing tokens are reserved for component recipes and must
not be used in generated interfaces.
`;
