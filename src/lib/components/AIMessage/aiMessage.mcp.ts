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

\`variant\` accepts \`bubble\` or \`minimal\`. Bubble preserves the framed role surfaces. Minimal
keeps user and system semantics visible with a neutral user surface while rendering assistant and
tool content without a background container. \`size\` accepts \`small\`, \`normal\`, or \`large\`
and scales typography, content padding, file previews, and the default action controls together.

\`\`\`svelte
<script>
  import { AIMessage } from 'entasis/ai-message';
</script>

<AIMessage
  from="assistant"
  content={'Review <File id="brief" label="launch-brief.md" /> before launch.'}
  files={[{ name: 'launch-brief.md', size: 18420, type: 'text/markdown' }]}
  variant="minimal"
  size="normal"
  actionsVisibility="always"
/>
\`\`\`

## Actions and composition

\`actionsVisibility\` wins over the \`actionVisibility\` alias. \`copyable\`, \`editable\`, and
\`retryable\` win over \`copyAction\`, \`editAction\`, and \`retryAction\`. User messages enable
edit by default; assistant messages enable retry by default. \`actions={false}\` removes the action
region, while a custom actions slot receives \`AIMessageActionState\`.

Default edit and retry actions use the nearest \`AIConversation\`. A direct \`conversation\` wins,
and \`conversation={null}\` explicitly disables context lookup. Direct \`onCopy\`, \`onEdit\`, and
\`onRetry\` handlers take precedence over conversation behavior.

\`children\` replaces the body only and receives the resolved message, index, role, content, size,
and variant;
the role layout, files, and action region remain owned by AIMessage. Native article attributes,
attachments, bindable \`ref\`, \`class\`, and \`theme\` are forwarded. Theme parts are \`root\`,
\`body\`, \`header\`, \`files\`, \`bubble\`, \`markdown\`, and \`actions\`.
`;
