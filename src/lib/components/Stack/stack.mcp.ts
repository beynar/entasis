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

## Props

- \`orientation\`: \`'horizontal' | 'vertical'\` — flex direction (default: \`'vertical'\`).
- \`align\`: cross-axis alignment — \`start | center | end | stretch\` (default: \`'stretch'\`).
- \`justify\`: main-axis alignment — \`start | center | end | between | around | evenly\` (default: \`'start'\`).
- \`gap\`, \`padding\`, \`paddingInline\`, and \`paddingBlock\` accept
  \`none | xs | sm | md | lg | xl\`.
- \`paddingInline\` and \`paddingBlock\` override \`padding\` on their axis.
- \`width\`, \`height\`, \`maxWidth\`, and \`minHeight\` accept CSS strings or pixel numbers.
- \`wrap\` accepts \`nowrap | wrap | wrap-reverse\`.
- \`isScrollable\` enables native \`overflow: auto\`.
- \`as\` changes the semantic HTML element without changing layout behavior.

Stack forwards common semantic HTML attributes and Svelte attachments to the root element.
Prefer parent-owned \`gap\` over child margins. The internal \`micro\` and \`layout-*\` tokens are
reserved for component recipes and must not be used in generated interfaces.
`;
