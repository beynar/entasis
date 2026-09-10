export const aiSuggestionDescription = `
# Suggestion and Suggestions

Prompt suggestions rendered as a horizontal, scroll-faded button row.

- \`Suggestion\` is the theme-aware button primitive, defaults to the soft variant, accepts regular Button size, color, and variant props, and reports semantic selection through \`onSelect\`.
- \`Suggestions\` owns horizontal scrolling, optional \`scrollFade\`, bindable \`value\`, \`defaultValue\`, disabled state, shared built-in item \`variant\`, and \`onSuggestionSelect\`.
- \`defaultValue\` initializes the selected suggestion when \`value\` is omitted. \`onValueChange(value)\` fires once when a user changes that selection; parent updates and selecting the same value stay silent. \`onSuggestionSelect(value)\` reports every suggestion activation, including repeated selection.
- Its \`suggestion\` snippet receives \`{ suggestion, selected, disabled, select }\` for composed item rendering.

\`\`\`svelte
<script>import { Suggestions } from 'svelai/ai-suggestion';</script>
<Suggestions suggestions={['Summarize', 'Explain', 'Compare']} bind:value />
\`\`\`

Use conversation-owned suggestions through \`AIThread\` or \`AIChat\` when they are the empty transcript state. An explicit selection callback takes precedence over the default conversation input update.
`;
