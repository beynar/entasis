export const aiMessageDescription = `
# AIMessage

Role-aware chat message with Markdown, inline AI tokens, files, and copy/edit/retry actions.

## Content and precedence

\`message\` supplies role, name, content, and files. Direct \`from\`, \`name\`, \`content\`, and
\`files\` props take precedence. \`messageIndex\` is canonical and \`index\` is its Entasis alias.

\`markdown\` defaults to true. \`streamdown\` forwards shared Markdown options and wins over the
\`markdownProps\` alias. Raw HTML is always disabled. HTTPS images and HTTPS, email, and telephone
links are the safe defaults; callers may narrow or extend those prefix lists through Markdown
options. File, Reference, Mention, Skill, and Command tokens are parsed inside prose, and
caller-provided \`mdxComponents\` may replace their default renderers.

\`variant\` accepts \`minimal\` (the default) or \`bubble\`. Minimal renders assistant and tool
content as flat, full-width prose and keeps the user bubble; bubble frames assistant replies too.
\`color\` sets the user bubble: \`neutral\` (the theme's default colour) is a quiet grey bubble and
any other role paints a solid bubble in that role (\`primary\` gives the saturated look). Bubble
tails sit on logical corners, so they follow the writing direction. Bubbles keep a 38rem / 82% cap
only once the message is at least 24rem wide; a narrower message gives them its full width.

\`size\` accepts \`small\`, \`normal\`, or \`large\` and scales typography, content padding, file
previews, and the default action controls together. Normal prose reads at 14px (large 16px, small
12px) with a 1.625 line height; headings stay close to the body (h2 about 1.25x), lists hang-indent, inline code is a muted
chip at 0.9em, and tables read at body size and scroll with an edge fade when they overflow.
\`streaming\` shows a pulsing caret after the content while a reply is still being written. A
message that carries only files shows no empty bubble. Tables, lists, quotes and alerts read at the message size; fenced code at 0.9× of it, like inline code, so it grows with every size. \`density\` (\`compact\`, \`normal\`, \`comfortable\`) sets table-cell and code-block padding and the space between paragraphs, lists and quotes; AIThread and AIChat pass theirs.

\`\`\`svelte
<script>
  import { AIMessage } from 'entasis/ai-message';
</script>

<AIMessage
  from="assistant"
  content={'Review <File id="brief" label="launch-brief.md" /> before launch.'}
  files={[{ name: 'launch-brief.md', size: 18420, type: 'text/markdown' }]}
  variant="minimal"
  color="neutral"
  size="normal"
  actionsVisibility="always"
/>
\`\`\`

## Actions and composition

\`actionsVisibility\` wins over the \`actionVisibility\` alias. \`copyable\`, \`editable\`, and
\`retryable\` win over \`copyAction\`, \`editAction\`, and \`retryAction\`. User messages enable
edit by default; assistant messages enable retry by default. \`actions={false}\` removes the action
region, while a custom actions slot receives \`AIMessageActionState\`. The action row sits in the
layout flow under the content (it keeps its height while hover-hidden), and its first icon lines
up with the text or bubble edge.

Default edit and retry actions use the nearest \`AIConversation\`. A direct \`conversation\` wins,
and \`conversation={null}\` explicitly disables context lookup. Direct \`onCopy\`, \`onEdit\`, and
\`onRetry\` handlers take precedence over conversation behavior.

\`children\` replaces the body only and receives the resolved message, index, role, content, size,
and variant;
the role layout, files, and action region remain owned by AIMessage. Native article attributes,
attachments, bindable \`ref\`, \`class\`, and \`theme\` are forwarded. Theme parts are \`root\`,
\`body\`, \`header\`, \`files\`, \`bubble\` (with a \`color\` variant), \`markdown\`, \`caret\`, and \`actions\`.
The root carries \`data-from\`, \`data-variant\`, \`data-color\`, \`data-size\`, \`data-actions-visibility\`
and, while streaming, \`data-streaming\`.
`;
