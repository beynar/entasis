export const mermaidDescription = `
# Mermaid Component

Renders a [Mermaid](https://mermaid.js.org/) diagram (flowchart, sequence, gantt, pie, class, state, ER, etc.) from a code string, with pan, zoom, fullscreen and download controls. The diagram is themed with our design tokens so it adapts to light and dark automatically. Ported from svelte-streamdown's Mermaid element, rebuilt on the entasis state/theme system.

## Basic Usage

\`\`\`svelte
<Mermaid chart={\`graph TD; A[Start] --> B{Choice}; B -->|Yes| C[OK]; B -->|No| D[Stop];\`} />
<Mermaid chart={sequenceCode} size="large" />
\`\`\`

## Props

### Core Props
- **chart**: string (required) - The mermaid diagram source. Sanitized before rendering (BOM, zero-width/control chars, smart quotes, CRLF, HTML entities, flowchart arrow spacing, trailing semicolons). Re-renders reactively when it changes.
- **config**: MermaidConfig - Extra mermaid config merged over the defaults (\`theme: 'base'\`, \`securityLevel: 'strict'\`, brand \`themeVariables\`, flowchart \`curve: 'basis'\`). Pass \`themeVariables\` to override individual mapped colors, or \`fontFamily\` to change the diagram font.
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - The height of the diagram viewport.

### Interaction Props
- **controls**: boolean | { fit?, zoomIn?, zoomOut?, expand?, download? } (default: true) - The floating controls to show. \`true\` shows all, \`false\` hides the bar, an object toggles individual controls.
- **mouseWheelZoom**: boolean (default: true) - Enable mouse-wheel zoom over the diagram (activated after a short hover so page scroll isn't hijacked). Pan-drag and the zoom buttons work regardless.
- **touchPan**: boolean (default: false) - Capture single-finger touch as a pan. Off inline so the diagram never traps page scroll; the fullscreen dialog turns it on. Pinch-zoom always works.
- **errorForgiving**: boolean (default: false) - Swallow transient parse/render errors and keep the last valid diagram on screen instead of showing the error overlay. For token-streaming (LLM output), where the source is incomplete/invalid between chunks. Errors are still reported via \`onError\`.

### Event Props
- **onRender**: (state: MermaidState) => void - Called after each successful render.
- **onError**: (error: Error) => void - Called when loading mermaid, parsing, or rendering fails.

### Advanced Props
- **class**: string - Additional CSS classes on the root element (the panzoom viewport).
- **theme**: MermaidTheme - Theme overrides (root, container, svg, buttons, error, skeleton).

## Interactions

- **Pan**: drag the diagram.
- **Zoom**: the +/− buttons, mouse-wheel (after a short hover), pinch, or double-click.
- **Fit**: the fit-to-view button re-centers and scales the diagram to the viewport.
- **Fullscreen**: the expand button opens the same diagram in a \`fullScreen\` Dialog (focus trap, Escape and the close button exit, single-finger touch pans inside it).
- **Download**: serializes the rendered diagram to a standalone .svg file.

## Brand theming

Mermaid is initialized with \`theme: 'base'\` and a \`themeVariables\` object whose values are read from our \`--color-*\` design tokens at render time (mermaid reads them as concrete colors, not live CSS vars). The diagram re-renders when the active theme changes, so it stays in sync with light/dark. Mapping: \`primaryColor -> --color-primary-muted\`, \`primaryTextColor/textColor -> --color-neutral\`, \`primaryBorderColor/nodeBorder -> --color-primary\`, \`lineColor -> --color-neutral-muted\`, \`background -> --color-surface\`, \`mainBkg -> --color-surface-raised\`, \`secondaryColor -> --color-secondary\`, \`tertiaryColor -> --color-neutral-muted\`, plus note/cluster/title colors and \`fontFamily\`.

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

- **mermaid is not bundled**: it is loaded from cdnjs at runtime, on the client only (mermaid **${'11.12.0'}**, the self-contained UMD build). The component is SSR-safe and shows a skeleton while loading. A strict Content-Security-Policy must allow \`cdnjs.cloudflare.com\` in \`script-src\`.
- On a load failure or a mermaid parse/render error, an error surface is shown (danger tokens) with the message — \`securityLevel: 'strict'\` + \`suppressErrorRendering\` keep mermaid from injecting its own error DOM.
- mermaid leaves temporary measuring containers in the body; they are removed after each render and on destroy.
`;
