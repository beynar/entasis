export const aiSuggestionDescription = `
# AISuggestion and AISuggestions

Prompt suggestions rendered as a horizontal, scroll-faded button row.

- \`AISuggestion\` is the theme-aware button primitive, defaults to the soft variant, accepts regular Button size, color, and variant props, and reports semantic selection through \`onSelect\`.
- \`AISuggestions\` owns horizontal scrolling, optional \`scrollFade\`, bindable \`value\`, \`defaultValue\`, disabled state, shared built-in item \`variant\`, and \`onSelect\`.
- \`defaultValue\` initializes the selected suggestion when \`value\` is omitted. \`onValueChange(value)\` fires once when a user changes that selection; parent updates and selecting the same value stay silent. \`onSelect(value)\` reports every suggestion activation, including repeated selection.
- Callback-naming decision: the selected suggestion is a value state, so it keeps the \`value\`/\`defaultValue\`/\`onValueChange\` trio, and \`onSelect\` stays the pick event on both components. \`AIThread\` and \`AIChat\` forward the same \`onSelect\` name for their empty-state suggestions.
- Its \`suggestion\` snippet receives \`{ suggestion, selected, disabled, select }\` for composed item rendering.

\`\`\`svelte
<script>import { AISuggestions } from 'entasis/ai-suggestion';</script>
<AISuggestions suggestions={['Summarize', 'Explain', 'Compare']} bind:value />
\`\`\`

Use conversation-owned suggestions through \`AIThread\` or \`AIChat\` when they are the empty transcript state. An explicit selection callback takes precedence over the default conversation input update.
`;
