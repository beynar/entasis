export const mermaidDescription = `
# Mermaid Component

Renders a [Mermaid](https://mermaid.js.org/) diagram (flowchart, sequence, gantt, pie, class, state, ER, mindmap, timeline, kanban, git graph and more) from a code string, with pan, zoom, fullscreen and download controls. The source is Mermaid syntax; the renderer is [Pele](https://pele.run), a lightweight Mermaid renderer that outputs themeable SVG. The diagram is coloured with our design tokens through CSS variables, so it adapts to light and dark without re-rendering.

## Basic Usage

\`\`\`svelte
<Mermaid chart={\`graph TD; A[Start] --> B{Choice}; B -->|Yes| C[OK]; B -->|No| D[Stop];\`} />
<Mermaid chart={sequenceCode} size="large" />
\`\`\`

## Props

### Core Props
- **chart**: string (required) - The mermaid diagram source. Sanitized before rendering (BOM, zero-width/control chars, smart quotes, CRLF, HTML entities, flowchart arrow spacing, trailing semicolons). Re-renders reactively when it changes.
- **config**: MermaidConfig - Mermaid settings passed to the renderer (frontmatter and \`%%{init}%%\` directives in the source override them; support varies by diagram type), plus \`fontFamily\` to change the diagram font (default: the page font). Colours do not come from here: see Theming.
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - The height of the diagram viewport.

### Interaction Props
- **controls**: boolean | { fit?, zoomIn?, zoomOut?, expand?, download? } (default: true) - The floating controls to show. \`true\` shows all, \`false\` hides the bar, an object toggles individual controls.
- **mouseWheelZoom**: boolean (default: true) - Enable mouse-wheel zoom over the diagram (activated after a short hover so page scroll isn't hijacked). Pan-drag and the zoom buttons work regardless.
- **touchPan**: boolean (default: false) - Capture single-finger touch as a pan. Off inline so the diagram never traps page scroll; the fullscreen dialog turns it on. Pinch-zoom always works.
- **errorForgiving**: boolean (default: false) - Swallow transient parse/render errors and keep the last valid diagram on screen instead of showing the error overlay. For token-streaming (LLM output), where the source is incomplete/invalid between chunks. Errors are still reported via \`onError\`.

### Event Props
- **onRender**: (state: MermaidState) => void - Called after each successful render.
- **onError**: (error: Error) => void - Called when loading the renderer, parsing, or rendering fails. Parse errors carry the line in their message.

### Advanced Props
- **class**: string - Additional CSS classes on the root element (the panzoom viewport).
- **theme**: MermaidTheme - Theme overrides (root, container, svg, buttons, error, skeleton).

## Interactions

- **Pan**: drag the diagram.
- **Zoom**: the +/− buttons, mouse-wheel (after a short hover), pinch, or double-click.
- **Fit**: the fit-to-view button re-centers and scales the diagram to the viewport.
- **Fullscreen**: the expand button opens the same diagram in a \`fullScreen\` Dialog (focus trap, Escape and the close button exit, single-finger touch pans inside it).
- **Download**: serializes the rendered diagram to a standalone .svg file.

## Theming

The renderer draws with \`--pele-*\` CSS variables, and the component's root maps them onto our design tokens: \`--pele-bg\` (surface-raised), \`--pele-fg\` (neutral), \`--pele-muted\`, \`--pele-line\`, \`--pele-surface\`, \`--pele-surface-alt\` and \`--pele-border\` (soft mixes of primary over the surface), \`--pele-accent\` (primary), \`--pele-critical\` and \`--pele-error\` (danger), \`--pele-radius\`, and \`--pele-series-1\`…\`-8\` for charts. Because they are live CSS variables, light/dark and palette changes restyle the diagram in place. Override any of them through the \`root\` theme part or a class, e.g. \`class="[--pele-accent:var(--color-success)]"\`. Inline \`style\`, \`classDef\` and \`linkStyle\` in the source still win, with fixed colours.

## Examples

### Live editable diagram
\`\`\`svelte
<script>
	let chart = $state('graph LR; A-->B; B-->C;');
</script>
<textarea bind:value={chart}></textarea>
<Mermaid {chart} />
\`\`\`

### Only some controls
\`\`\`svelte
<Mermaid {chart} controls={{ zoomIn: true, zoomOut: true, fit: true, download: false, expand: false }} />
\`\`\`

## Accessibility

- The controls are Buttons with aria-labels and are keyboard accessible; the download uses safe blob/data URLs.
- The render host has \`role="img"\` with an aria-label; the error surface uses \`role="alert"\`.

## Notes

- **The renderer is not bundled**: Pele **1.6.0** is loaded from jsDelivr at runtime, on the client only (its self-contained global build, about 250 KB gzipped, every diagram type). The script carries the Theme's CSP nonce; a strict Content-Security-Policy must also allow \`cdn.jsdelivr.net\` in \`script-src\`. The component is SSR-safe and shows a skeleton while loading.
- The rendered SVG has no \`<style>\` element or script, only presentation attributes and CSS variables, so it needs no style nonce.
- On a load failure or a parse/render error, an error surface is shown (danger tokens) with the message.
`;
