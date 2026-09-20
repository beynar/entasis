export const aiToolDescription = `
# AITool

Render one AI tool call or one collapsible group of consecutive calls. Non-empty \`tools\` takes precedence over \`tool\`. Missing statuses are inferred from output and errors, while arbitrary values use circular-safe depth and entry limits.

Expanded call/group IDs use bindable \`value\`, initial \`defaultValue\`, and \`onValueChange(value)\`. The callback fires once for each user expansion change; parent prop updates stay silent. Nested rows inside a grouped call keep their own expansion state.

\`\`\`svelte
<script lang="ts">
  import { AITool, type AIToolCall } from 'entasis/ai-tool';

  const tools: AIToolCall[] = [
    { id: 'search', name: 'search_docs', input: { query: 'Svelte' }, output: { count: 4 } },
    { id: 'read', name: 'read_page', status: 'running', input: { path: '/docs' } }
  ];
  let open = $state(['search']);
</script>

<AITool {tools} bind:value={open} multiple />
\`\`\`

Use \`icon\`, \`title\`, \`status\`, \`input\`, \`output\`, \`error\`, or \`content\` snippets with a \`{ tool, index }\` payload. Default value panels use the existing Entasis ScrollArea and are capped vertically while supporting both scroll axes.

Default status is represented by the semantic left indicator: a spinner for active calls and a dot for settled calls. Use the \`status\` snippet only when a visible custom status treatment is required.

Default input and output sections use compact sign-in and sign-out icons. Their configured labels remain available to assistive technology and on hover.

Use \`toggleIcon="none"\` for the default minimal trigger, \`chevron\` for a rotating disclosure icon, or \`plus-minus\` for plus/minus expansion controls. The choice applies to both group and child triggers.

The default \`ghost\` variant renders an unframed tool call. Use \`card\` for an elevated surface, \`outline\` for a transparent bounded surface, or \`soft\` for a subtle status-aware tint. Group triggers keep intrinsic width independently from their expanded call content, while each child call receives the same variant around its complete row and panel.
`;
