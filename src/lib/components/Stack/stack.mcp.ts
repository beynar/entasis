export const stackDescription = `
# Stack

Stack arranges arbitrary content along one flex axis. Use the \`orientation\` prop to switch
between horizontal and vertical layout, and \`align\` / \`justify\` for cross-axis and main-axis
alignment.

## Import

\`\`\`svelte
<script lang="ts">
  import { Stack } from 'svelai/stack';
</script>
\`\`\`

## Usage

\`\`\`svelte
<Stack gap="xl" padding="xl">
  <h2>Account</h2>
  <Stack orientation="horizontal" align="center" gap="md" wrap="wrap">
    <span>Profile</span>
    <span>Security</span>
  </Stack>
</Stack>
\`\`\`

## Responsive props

\`orientation\`, \`gap\`, \`align\`, \`justify\` and \`wrap\` each take a plain value or a
per-breakpoint record:

\`\`\`svelte
<Stack orientation={{ md: 'horizontal' }} gap={{ xs: 'sm', lg: 'xl' }} align="center">
  <span>Filters</span>
  <span>Results</span>
</Stack>
\`\`\`

The breakpoints measure the stack's OWN width — \`xs\` base, \`sm\` 36rem, \`md\` 42rem,
\`lg\` 56rem, \`xl\` 72rem — not the viewport's, so the same stack is \`xs\` in a narrow sidebar
and \`lg\` full-bleed on the same page. The nearest defined key at or below the stack's width
wins, and below the narrowest key the prop's default applies: \`{ md: 'horizontal' }\` is
vertical at \`xs\` and \`sm\`. A prop falls back to its default only when it is \`undefined\`
or \`null\`. A function form must be deterministic in its argument — it is called once per
breakpoint. There is no measurement and no JS: the five values ship as custom
properties and container queries pick one, so server-rendered markup is already laid out.

## Props

- \`orientation\`: \`'horizontal' | 'vertical'\` — flex direction (default: \`'vertical'\`).
- \`align\`: cross-axis alignment — \`start | center | end | stretch\` (default: \`'stretch'\`).
- \`justify\`: main-axis alignment — \`start | center | end | between | around | evenly\` (default: \`'start'\`).
- \`gap\`, \`padding\`, \`paddingInline\`, and \`paddingBlock\` accept
  \`none | xs | sm | md | lg | xl\`.
- \`paddingInline\` and \`paddingBlock\` override \`padding\` on their axis.
- \`width\`, \`height\`, \`maxWidth\`, and \`minHeight\` accept CSS strings or pixel numbers.
- \`wrap\` accepts \`nowrap | wrap | wrap-reverse\`.
- \`scrollable\` enables native \`overflow: auto\`.
- \`as\` changes the semantic HTML element without changing layout behavior:
  \`div | span | section | article | aside | main | nav | header | footer | form | fieldset\`.
  Lists are not among them — the root always wraps its children in one layout \`<div>\`, which
  \`<ul>\` and \`<ol>\` do not admit. Write the list yourself and put a stack inside an \`<li>\`.

## Structure

Stack renders two elements: the root (\`data-slot="stack"\`) is the box the host sizes and the
container the breakpoints are measured against — it takes \`as\`, \`class\`, \`style\`, the size
props, the padding and \`scrollable\` — and a single layout child (\`data-slot="stack-layout"\`)
carries the flex line. The \`inner\` theme slot styles that child.

Stack forwards common semantic HTML attributes and Svelte attachments to the root element.
Prefer parent-owned \`gap\` over child margins. The internal \`micro\` and \`layout-*\` tokens are
reserved for component recipes and must not be used in generated interfaces.
`;
