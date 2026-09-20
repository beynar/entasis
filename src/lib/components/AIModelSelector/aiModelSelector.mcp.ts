export const aiModelSelectorDescription = `
# AIModelSelector

Model selection built on Entasis \`PopupMenu\` and \`Menu\`. It accepts flat \`models\`, recursive \`groups\`, disabled entries, provider labels, optional keyword search, context-window metadata, and supplemental standard Menu items.

Bind \`value\`, \`open\`, and \`query\` for direct control. \`defaultValue\` and \`defaultOpen\` apply once when their live props are omitted; \`onValueChange\` receives \`{ value, model }\`, and \`onOpenChange\` reports component-owned disclosure changes. Set \`searchable={false}\` to remove the search header and ignore, without erasing, a bound query. When \`value\` is omitted or undefined inside \`AIConversation\`, selection reads and updates \`conversation.selectedModel\`. A direct string or \`null\` wins over provider state; \`null\` is the bindable controlled-empty value because Svelte substitutes prop fallbacks for \`undefined\`. \`placeholder\` follows the same omission rule before the compact \`labels\` object and conversation placeholder, with \`null\` suppressing visible placeholder text.

The \`children\` trigger, \`search\` header, and \`empty\` snippets receive \`{ model, value, open, query, searchable, disabled, labels, select, setQuery, setOpen, toggle }\`. The resolved \`labels\` cover the empty trigger, its accessible fallback name, search field, empty result, and providerless-group heading. The trigger remains owned by PopupMenu, so keyboard navigation and focus return continue to work with custom content. Theme slots cover the root, trigger, trigger content/icon/label, popover, search header, menu, provider headings, model options, nested groups, and empty state.

Search is case-insensitive across model id, label, provider, description, and \`keywords\`. A matching group label preserves that group; otherwise recursive groups retain only matching descendants. \`menuItems\` uses the public \`MenuItem\` union and is appended after the models, so recursive checked submenus can own reasoning effort, speed, verbosity, or provider-specific controls. Models without a provider use the configurable \`providerFallback\` heading, while option descriptions fall back to the provider name. Disabled selectors recursively disable supplemental menu items as well as groups and models.

\`\`\`svelte
<AIModelSelector
	  models={[{ id: 'fast', label: 'Fast', provider: 'Acme', contextWindow: 128000 }]}
	  groups={[{ label: 'Research', models: researchModels }]}
	  searchable={false}
	  menuItems={[{ type: 'submenu', title: 'Reasoning effort', menu: reasoningItems }]}
	  bind:value
  onValueChange={({ value, model }) => selectModel(value, model)}
/>
\`\`\`
`;
