export const metadataListDescription = `
# MetadataList Component

A read-only key/value metadata list, like Notion's page-properties panel. Each row shows a muted key label (with an optional icon) on the left and a typed value on the right: plain text, localized numbers and dates, links, boolean chips, a single chip, or a chip list. Values are formatted and their type auto-detected, so a plain array of items renders with no per-item wiring.

## Basic Usage

\`\`\`svelte
<script>
	import { MetadataList } from 'svelai/metadata-list';
</script>

<MetadataList
	items={[
		{ key: 'Name', value: 'Design System v2' },
		{ key: 'Status', value: 'Active', type: 'chip', color: 'success' },
		{ key: 'Created', value: new Date('2025-01-15') },
		{ key: 'Repository', value: 'https://github.com/org/design-system' }
	]}
/>
\`\`\`

## Props

### Core Props
- **items**: \`MetadataListItem[]\` (default: \`[]\`)
  - The rows to display. Each item: \`{ id?, key?, title?, value?, type?, icon?, color?, href? }\` — read-only display data; MetadataList never writes item values. The label resolves \`key ?? title ?? id\`. \`type\` is auto-detected from \`value\` when omitted.
- **maxItems**: \`number\` (optional)
  - When set and \`items.length\` exceeds it, the extra items collapse behind an animated "Show N more" toggle.
- **expanded**: \`boolean\` (bindable, default: \`false\`)
  - Open state of the "Show more" toggle.
- **defaultExpanded**: \`boolean\` (default: \`false\`)
  - Initial open state of the "Show more" toggle when \`expanded\` is omitted.

### Style Props
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`)
  - Typography only: key/value/toggle text, key icons, and chip sizing.
- **density**: \`'compact' | 'normal' | 'comfortable'\` (default: \`'normal'\`)
  - Spacing only: section, row, label/value, and chip-list gaps. Combine freely with \`size\`.
- **columns**: \`number\` (default: \`1\`)
  - Items flow into this many grid columns.

### Content Slots
- **title**: \`Slot\` (optional) - Header title (string or snippet).
- **description**: \`Slot\` (optional) - Header description (string or snippet).
- **key**: \`Slot<MetadataListItemPayload>\` (optional) - Replaces the default key-label cell for every item. The payload is \`{ item, index, type, label, formatted }\`.
- **value**: \`Slot<MetadataListItemPayload>\` (optional) - Replaces the default value cell for every item (same payload). Use it to special-case rendering.

### Advanced Props
- **ref**: \`HTMLElement | null\` (bindable) - Reference to the root element.
- **i18n**: \`Partial<Messages>\` - Per-instance i18n overrides (\`showMoreItems\`, \`showLess\`, \`trueLabel\`, \`falseLabel\`).
- **theme**: \`MetadataListThemeProps\` - Theme overrides.

## Value Types & Auto-detection

| type      | Auto-detected from                         | Rendered as                                            |
| --------- | ------------------------------------------ | ------------------------------------------------------ |
| \`text\`    | anything else (and \`null\`/\`undefined\`)     | span; nullish shows a muted em dash "—"                 |
| \`number\`  | \`typeof value === 'number'\`                | span with \`tabular-nums\`, localized via \`Intl\`         |
| \`date\`    | \`value instanceof Date\`                    | span, localized \`dateStyle: 'medium'\`                  |
| \`boolean\` | \`typeof value === 'boolean'\`               | one soft Chip (\`trueLabel\`/\`falseLabel\`)               |
| \`url\`     | string matching \`/^https?:\\/\\//i\`          | anchor (\`target="_blank"\`), display strips protocol   |
| \`email\`   | string matching a simple email regex       | \`mailto:\` anchor                                        |
| \`phone\`   | never auto-detected (set \`type: 'phone'\`)  | \`tel:\` anchor                                           |
| \`chip\`    | (explicit only)                            | one soft Chip                                          |
| \`chips\`   | \`Array.isArray(value)\`                     | flex-wrap row of soft Chips                            |

Boolean chips default to \`success\` (true) / \`neutral\` (false); other chips default to \`neutral\`. Set \`item.color\` to override. Dates and numbers use the active locale (\`i18n.locale\`). Set \`item.href\` to override the derived link target.

## Examples

### Explicit types
\`\`\`svelte
<MetadataList
	items={[
		{ key: 'Budget', value: 48000, type: 'number' },
		{ key: 'Contact', value: 'team@acme.com', type: 'email' },
		{ key: 'Hotline', value: '+1 555 0100', type: 'phone' }
	]}
/>
\`\`\`

### Chips and a chip list
\`\`\`svelte
<MetadataList
	items={[
		{ key: 'Priority', value: 'High', type: 'chip', color: 'danger' },
		{ key: 'Tags', value: ['design', 'frontend', 'a11y'] }
	]}
/>
\`\`\`

### Boolean
\`\`\`svelte
<MetadataList items={[{ key: 'Published', value: true }, { key: 'Archived', value: false }]} />
\`\`\`

### Columns
\`\`\`svelte
<MetadataList columns={2} items={items} />
\`\`\`

### maxItems with show-more
\`\`\`svelte
<MetadataList maxItems={4} items={items} />
\`\`\`

### Custom key / value snippets
\`\`\`svelte
<MetadataList items={items}>
	{#snippet value({ item, formatted })}
		{#if item.key === 'Owner'}
			<span class="inline-flex items-center gap-2">
				<span class="size-2 rounded-full bg-primary"></span>
				{formatted}
			</span>
		{:else}
			{formatted}
		{/if}
	{/snippet}
</MetadataList>
\`\`\`

### Header
\`\`\`svelte
<MetadataList title="Project Details" description="Read-only properties" items={items} />
\`\`\`

## Accessibility

- Uses \`dl\`/\`dt\`/\`dd\` semantics for the key/value pairs.
- The "Show more" control is a real \`<button type="button">\` with \`aria-expanded\`.
- Links are real anchors; \`url\` links get \`target="_blank" rel="noopener noreferrer"\`.

## Notes

- Display only: it never mutates \`items\`.
- \`phone\` is never auto-detected (avoids false positives on ids/zips) — set \`type: 'phone'\` explicitly.
- Formatters are derived once from the active locale, not per item.
- Theme parts: \`root\`, \`header\`, \`title\`, \`description\`, \`list\`, \`item\`, \`key\`, \`keyIcon\`, \`value\`, \`link\`, \`chips\`, \`toggle\`, \`toggleIcon\`.
`;
