export const aiMessageActionsDescription = `
# AIMessageActions

Copy, edit, and retry actions for an AI message. Defaults integrate with the nearest AIConversation.

## Resolution and availability

\`message\` supplies role and content. Direct \`role\` and \`content\` win, while \`messageIndex\`
wins over the \`index\` alias. \`copyable\`, \`editable\`, and \`retryable\` win over the
compatibility \`copy\`, \`edit\`, and \`retry\` aliases.

Copy requires non-empty content. Edit additionally requires a user role and either \`onEdit\` or a
conversation. Retry requires an assistant role and either \`onRetry\` or a conversation plus a
message index. Direct callbacks take precedence. Otherwise edit writes the content into the
conversation input and retry targets the indexed message. Pass \`conversation={null}\` to disable
scoped conversation lookup.

\`visibility\` accepts \`always\`, \`hover\`, or \`none\`. \`actions={false}\` suppresses the
complete surface. A supplied \`actions\` slot wins over the equivalent \`children\` slot. Both
receive complete \`AIMessageActionState\`, including the resolved size, capability flags, and
awaitable copy, edit, and retry methods. \`size\` accepts \`small\`, \`normal\`, or \`large\` and
scales the default controls. The copy callback runs only after clipboard success. Failures raised by
the default buttons render through the semantic error region.

\`\`\`svelte
<script>
  import { AIMessageActions } from 'entasis/ai-message-actions';
</script>

{#snippet actions({ copied, copy })}
  <button type="button" onclick={() => void copy()}>
    {copied ? 'Copied' : 'Copy answer'}
  </button>
{/snippet}

<AIMessageActions content="Answer" {actions} />
\`\`\`

The root forwards native div attributes and attachments when actions are available, plus bindable
\`ref\`, \`class\`, and \`theme\`. Theme parts cover \`root\`, \`button\`, and \`error\`, with role,
visibility, and size variants on the root and size variants on the button.
`;
