export const aiToolDescription = `
# AITool

Render one AI tool call or one collapsible group of consecutive calls. Non-empty \`tools\` takes precedence over \`tool\`. Missing statuses are inferred from output and errors, while arbitrary values use circular-safe depth and entry limits.

Expanded call/group IDs use bindable \`value\`, initial \`defaultValue\`, and \`onValueChange(value)\`. The callback fires once for each user expansion change; parent prop updates stay silent. Nested rows inside a grouped call keep their own expansion state; a group's \`value\` entry is the first call's id.

\`\`\`svelte
<script lang="ts">
  import { AITool, type AIToolCall } from 'entasis/ai-tool';

  const tools: AIToolCall[] = [
    { id: 'search', name: 'searchDocs', input: { query: 'Svelte' }, output: { count: 4 }, duration: 1400 },
    { id: 'read', name: 'read_page', status: 'running', input: { path: '/docs' }, startedAt: Date.now() }
  ];
  let open = $state(['search']);
</script>

<AITool {tools} bind:value={open} multiple />
\`\`\`

## Statuses and the AI SDK

\`AIToolStatus\` covers \`pending\`, \`loading\`, \`running\`, \`streaming\`, \`success\`, \`error\`, \`cancelled\`, and the approval states \`approval-requested\`, \`approval-responded\` and \`output-denied\`; any other string renders as a neutral settled status with its readable name. Map AI SDK UI tool parts with \`getAIToolStatusFromState(part.state)\`:

| AI SDK \`part.state\` | AITool \`status\` | Shown as |
| --- | --- | --- |
| \`input-streaming\` | \`streaming\` | spinner, "Preparing" |
| \`input-available\` | \`running\` | spinner, "Running" |
| \`approval-requested\` | \`approval-requested\` | hand glyph, "Awaiting approval" (never spins) |
| \`approval-responded\` | \`approval-responded\` | spinner, "Approved", until an output state follows |
| \`output-available\` | \`success\` | check glyph |
| \`output-error\` | \`error\` | x glyph, "Failed" |
| \`output-denied\` | \`output-denied\` | slashed circle, "Denied" (never spins) |

Pass the part's \`approval\` object too: \`approval: { approved: false }\` renders as denied even while the state still reads \`approval-responded\`. Unknown states return \`undefined\`, so status falls back to inference: an error is \`error\`, any output is \`success\`, nothing yet is \`pending\`.

## Row anatomy

Each row reads: status mark (spinner, then a check, x, hand or slashed-circle glyph, so status never relies on colour alone), readable title, a muted one-line input summary, then the status word (omitted on success) and the duration.

- Title: \`title\` wins unless it only repeats \`name\`; raw names are humanized (\`searchDocs\` → "Search docs", \`analyze_release\` → "Analyze release", \`mcp__github__list_issues\` → "List issues").
- \`icon\`: an entasis icon snippet per call; it takes the leading place and the status glyph moves next to the status word.
- \`summary\`: overrides the input summary (first primitive input value, strings quoted); \`''\` hides it.
- Duration: \`duration\` (ms), or \`startedAt\` + \`completedAt\`. A running call counts its elapsed time live (from \`startedAt\`, or from when the AITool first saw it running) and keeps its final duration after it settles, also when a lone call grows into a group: "<1s", "6s", "1m 12s". A duration the AITool only observed lives as long as that AITool; a row that remounts (a virtualized transcript) keeps it only when the call carries \`duration\` or \`startedAt\` + \`completedAt\`.
- Group header: "Search docs · 2 calls" from the distinct tool titles and the call count; override with \`labels.group(count, tools)\`.

Use \`icon\`, \`title\`, \`status\`, \`input\`, \`output\`, \`error\`, or \`content\` snippets with a \`{ tool, index }\` payload. The \`icon\` snippet replaces the leading mark and \`status\` replaces the trailing word and duration. \`formatStatus\` changes the status word and the mark's accessible name (defaults are localized).

## Values

Input, output and error sections share one text label style ("Input", "Output", "Error"). \`valueView="json"\` (default) shows highlighted, wrapped JSON through the Code component with a copy button; \`valueView="tree"\` shows a key/value tree with quoted strings and no array index keys. String values that hold JSON are shown structured; other one-line strings are quoted like JSON (so the output \`"3"\` never reads as the number \`3\`), and multi-line strings stay plain wrapped text. A primitive error (a string, an Error, an MCP \`isError\` result with text content) renders as one plain sentence. Values longer than \`maxLines\` (12) lines or rows collapse behind "Show all".

## Variants

The default \`ghost\` variant renders unframed rows. \`card\` is an elevated surface, \`outline\` a transparent bounded surface, and \`soft\` a status-aware tint that doubles in dark mode. A lone call and a group share the same surface; group rows are divided inside it and align with the group header. The block is \`w-full max-w-[32rem]\` of its container, never sized from the viewport.

Use \`toggleIcon="none"\` for the default minimal trigger, \`chevron\` for a rotating disclosure icon, or \`plus-minus\` for plus/minus expansion controls. The choice applies to both group and child triggers.
`;
