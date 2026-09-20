export const markdownDescription = `
# Markdown Component

Renders Markdown as themed HTML, built for streaming LLM output. Wraps the user's own [svelte-streamdown](https://github.com/) renderer, restyled with entasis design tokens so it matches the rest of the app and adapts to light and dark automatically. Incomplete/streaming Markdown (an unterminated code fence, a half-written table) is handled gracefully — nothing crashes or flashes as chunks arrive.

Fenced code blocks render through entasis's own Code component (syntax highlighting + copy button), and \\\`mermaid\\\` fences render through entasis's Mermaid component (pan/zoom, brand theming, and errorForgiving so a diagram being streamed in doesn't flash errors between chunks).

Card, Stat, Stack, Grid, and GridSpan are also available as built-in MDX components. They can be used directly inside the Markdown source without passing an MDX component map.

## Basic Usage

\\\`\\\`\\\`svelte
<Markdown content={"# Hello\\n\\nSome **bold** and _italic_ text."} />
<Markdown content={message} size="small" />
<Markdown content={doc} size="large" />
\\\`\\\`\\\`

## Props

### Core Props
- **content**: string (required) - The Markdown source. Re-renders reactively as it changes; incomplete/streaming Markdown is handled gracefully (safe to bind to a growing string from a token stream).
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Type and spacing scale.
  - **small**: compact — smaller headings, tighter block margins, \\\`text-sm\\\` body. Best for chat messages and dense UI.
  - **normal**: the default reading scale (\\\`text-base\\\` body, shadcn-equivalent heading sizes).
  - **large**: long-form — larger headings, roomier margins, \\\`text-lg\\\` body. Best for documents and articles.

### Advanced Props
- **class**: string - Additional CSS classes on the root wrapper.
- **theme**: MarkdownThemeProps - Overrides for the root wrapper part (size variants live here).
- **mdxComponents**: StreamdownProps['mdxComponents'] - Custom MDX components. Matching names override the built-in entasis components.
- **...streamdown passthroughs**: every other svelte-streamdown prop is forwarded except the ones entasis controls (\\\`content\\\`, \\\`theme\\\`, \\\`baseTheme\\\`, \\\`mergeTheme\\\`, \\\`class\\\`, \\\`code\\\`, \\\`mermaid\\\`, \\\`children\\\`, \\\`streamdown\\\`, \\\`element\\\`). Use these for streamdown features such as controlling which block types are parsed, link/image handling, and other renderer options — see the svelte-streamdown docs.

## Rendering

- **Block elements**: headings (h1–h6), paragraphs, lists (ordered, unordered, task lists), blockquotes, horizontal rules, tables, images and links are all styled from entasis tokens.
- **GitHub alerts**: \\\`> [!NOTE]\\\`, \\\`> [!TIP]\\\`, \\\`> [!IMPORTANT]\\\`, \\\`> [!WARNING]\\\` and \\\`> [!CAUTION]\\\` render as colored callouts mapped to entasis info/success/primary/warning/danger muted pairings.
- **Inline code** (\\\`codespan\\\`): styled as a subtle chip; its text size scales with \\\`size\\\`.
- **Code fences**: rendered by entasis's Code component — syntax highlighting and a copy button. The code block sizing follows \\\`size\\\`.
- **Mermaid fences**: a fence tagged \\\`mermaid\\\` renders through entasis's Mermaid component with \\\`errorForgiving\\\` enabled, so a diagram that is still streaming in holds its last valid frame instead of flashing parse errors. Diagram size maps from the Markdown \\\`size\\\`.

## Built-in MDX components

The built-in tags are **Card**, **Stat**, **Stack**, **Grid**, and **GridSpan**:

~~~svelte
const content = [
  '<Grid columns={2} gap="lg">',
  '<GridSpan columns="full">',
  '<Card title="Release readiness" variant="outline">',
  '<Stack gap="md">Everything is **ready**.</Stack>',
  '</Card>',
  '</GridSpan>',
  '<Stat label="Coverage" value="94%" trend="+3.2%" trendDirection="up" />',
  '<Stat label="Issues" value="3" trend="-8" trendDirection="down" />',
  '</Grid>'
].join('\\n');

<Markdown {content} />
~~~

MDX attributes support string, number, and boolean values. Imperative event handlers and root styling or link props are not forwarded from Markdown content. Caller-provided mdxComponents take priority, and the custom mdx snippet remains the fallback for unknown tags.

## Theming

The full theme is derived from entasis design tokens (translated from the shadcn preset): borders use \\\`border-neutral-muted\\\`, muted surfaces use \\\`bg-neutral-muted\\\`, secondary text uses \\\`text-neutral/70\\\`, and so on. Because it is token-based, the rendered Markdown adapts to light and dark automatically and stays visually consistent with the rest of the app. Per-instance tweaks to the root wrapper go through the \\\`theme\\\` prop; deeper element overrides fall back safely to the built-in theme.

## Examples

### Chat message (small)
\\\`\\\`\\\`svelte
<Markdown content={assistantMessage} size="small" />
\\\`\\\`\\\`

### Long-form document (large)
\\\`\\\`\\\`svelte
<Markdown content={articleBody} size="large" />
\\\`\\\`\\\`

### Streaming from an LLM
\\\`\\\`\\\`svelte
<script>
	let content = $state('');
	// append tokens as they arrive
	for await (const chunk of stream) content += chunk;
</script>
<Markdown {content} size="small" />
\\\`\\\`\\\`

## Accessibility

- Output is semantic HTML (real headings, lists, tables, \\\`<a>\\\`, \\\`<code>\\\`), so the document outline and screen-reader navigation work as expected.
- Code blocks inherit the Code component's accessible copy button (aria-labelled, keyboard operable) and Mermaid inherits its \\\`role="img"\\\` + aria-label and keyboard-accessible controls.
- Color is never the only signal for GitHub alerts — each keeps its label/heading text.
- Task-list checkboxes are disabled and have no text of their own, so each carries an accessible name from the catalog (\`taskComplete\` / \`taskIncomplete\`).

## Notes

- Renders reactively: it is safe to bind \\\`content\\\` to a string that grows over time (token streaming). Partial Markdown between chunks won't throw.
- The theme deep-merges over svelte-streamdown's built-in base theme, so any element entasis doesn't explicitly restyle still renders sensibly.
- Code and Mermaid rendering delegate to entasis's own components rather than streamdown's, keeping copy/pan/zoom behavior consistent across the app.
`;
