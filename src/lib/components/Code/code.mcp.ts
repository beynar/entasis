export const codeDescription = `
# Code Component

Displays a syntax-highlighted code block with an optional header (language label
+ copy button), line numbers, and header/footer slots. Highlighting is powered by
TanStack Highlight with every language bundled (synchronous, SSR-safe) and a CSS-variable token palette, so colors
adapt to light and dark automatically from the design tokens.

## Basic Usage

\`\`\`svelte
<Code language="typescript" code={\`const hello: string = 'world';\`} />
\`\`\`

## Props

### Core Props
- **code**: string (required) - Source code to highlight. Also what the copy button writes to the clipboard.
- **language**: string (default: 'text') - Language id (\`ts\`, \`svelte\`, \`css\`, \`shell\`, \`json\`, \`python\`, …). Aliases like \`typescript\`, \`js\`, \`bash\` resolve automatically; every language TanStack Highlight ships is bundled, and unknown ids fall back to plain text.
- **title**: string - Header label. Defaults to the language's display name (e.g. "TypeScript").

### Display Props
- **showLineNumbers**: boolean (default: false) - Renders a line-number gutter.
- **showHeader**: boolean (default: true) - Renders the default header row (title + copy button). Set to false to show only the code block. Ignored when a custom \`header\` snippet is provided.
- **copyable**: boolean (default: true) - Shows the copy-to-clipboard button. In the header when one is shown, otherwise a floating button in the top-right corner that appears on hover.
- **wrap**: boolean (default: false) - Soft-wraps long lines instead of scrolling horizontally.
- **maxHeight**: number | string (default: none) - Caps the block height and makes it vertically scrollable (via ScrollArea). A number is pixels; a string is used as-is (e.g. \`'20rem'\`).
- **tabSize**: number (default: 2) - Tab width in spaces.

### Styling Props
- **class**: string - Additional CSS classes on the root element.
- **theme**: CodeThemeProps - Theme overrides for the \`code\`, \`header\`, \`title\`, \`container\`, and \`footer\` parts.

### Slots
- **header**: Snippet<[CodeHeaderPayload]> - Replaces the default header row. Receives \`{ language, label, copied, copy }\`.
- **footer**: Snippet - Optional footer row (e.g. a token count or a run button).

## Examples

### With a title and line numbers
\`\`\`svelte
<Code
  language="svelte"
  title="Counter.svelte"
  showLineNumbers
  code={svelteSource}
/>
\`\`\`

### Custom header
\`\`\`svelte
<Code language="json" code={json}>
  {#snippet header({ label, copied, copy })}
    <div class="flex items-center justify-between px-3 py-1.5">
      <span>{label}</span>
      <button onclick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
    </div>
  {/snippet}
</Code>
\`\`\`

### With a footer
\`\`\`svelte
<Code language="bash" code={installCmd}>
  {#snippet footer()}
    <span>Run in your project root</span>
  {/snippet}
</Code>
\`\`\`

## Theming

The block chrome (border, header, footer, container) is styled with cva parts and
uses \`bg-neutral-muted\` / \`text-neutral/70\` for the header and footer.
The syntax colors are NOT part of cva — they come from the highlighter's \`th-*\` token classes plus the
colocated \`CodeTheme.svelte\`, which maps each \`--code-token-*\` variable onto our
\`--color-*\` design tokens (keyword → primary, string → success, number → warning,
function → info, tag → danger, …) and re-tunes a few roles under the dark selector.

### Theme Structure
- **root**: Root container (border, radius, background).
- **header**: Header row (language label + copy button).
- **title**: The language/title label text.
- **container**: The scrollable code area wrapping the highlighted \`<pre>\`.
- **footer**: Optional footer row.

### Theme Type Definition

\`\`\`typescript
import type { CodeThemeProps } from 'entasis/code';

const customTheme: CodeThemeProps = {
  root: { base: 'rounded-xl raised-4' },
  header: { base: 'bg-primary text-primary-contrast px-4 py-2' }
};
\`\`\`

## Accessibility
- The copy button carries an \`aria-label\` that reflects its state ("Copy" / "Copied").
- Clipboard access is guarded (\`navigator.clipboard\`) and only runs client-side.

## Notes
- The highlighter is a singleton constructed at module load — SSR-safe, no top-level await.
- Copied state resets automatically after 2 seconds and whenever \`code\` or \`language\` changes.
`;
