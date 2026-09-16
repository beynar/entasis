export const aiContextDescription = `
# AIContext

Displays context-window usage with the existing \`ProgressCircle\` and a top-end \`HoverCard\` breakdown. It reads \`AIConversation.contextUsage\` when \`usage\` is omitted or undefined; a direct usage object or \`null\` wins over provider state. Direct \`usedTokens\` takes precedence over either usage source.

\`maxTokens\` defaults to 128,000. \`warningAt\` and \`dangerAt\` default to 70 and 90 percent. Use \`compact\` for an icon-only trigger and \`formatTokens\` to replace number formatting. \`dir\` is forwarded to both the trigger wrapper and portalled details. The compact \`labels\` object overrides the title, remaining-token formatter, breakdown row labels, Used/Maximum labels, and complete trigger \`label\`; formatter callbacks receive already formatted token strings.

The \`children\` trigger and \`content\` detail snippets receive the complete resolved state: totals, remaining tokens, percentage, tone, formatted values, and resolved labels. Theme slots cover the root, popover/card surfaces, trigger, progress circle, trigger value, summary, meter, and breakdown rows. Native div attributes and attachments are forwarded to the root; \`ref\` binds that element.

The default trigger is a keyboard-focusable button with a complete context-usage label. The decorative ProgressCircle does not duplicate progress semantics, and the hover content opens from pointer or keyboard focus.

\`\`\`svelte
<AIContext
  maxTokens={128000}
  usage={{ inputTokens: 12000, outputTokens: 3200, reasoningTokens: 800 }}
/>
\`\`\`
`;
