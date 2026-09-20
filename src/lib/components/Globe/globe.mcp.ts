export const globeDescription = `
# Globe Component

An interactive, auto-rotating WebGL globe (powered by cobe). Draggable, theme-aware, and animated
in via a fade. Colors accept theme tokens and recolor automatically when the app theme changes.

## Requires

Globe renders through cobe (WebGL). It is an optional peer dependency of entasis, so install it alongside entasis:

\`pnpm add cobe\`

## Basic Usage

\`\`\`svelte
<script>
  import { Globe } from 'entasis/globe';
</script>

<Globe />
<Globe baseColor="neutral" glowColor="primary" markerColor="primary" />
\`\`\`

## Props

### Appearance
- **baseColor**: Colors | [number, number, number] (default: soft white) - Landmass dot color. Token or normalized RGB (0–1). A light base gives bright continents that pop on the shaded sphere.
- **markerColor**: Colors | [number, number, number] (default: 'primary') - Marker dot color.
- **glowColor**: Colors | [number, number, number] (default: soft white) - Atmospheric glow color.
- **dark**: number (default: 1) - Shading darkness 0–1. Pass a negative value to follow the app theme (dark -> 1, light -> 0).
- **opacity**: number (default: 1) - Globe texture opacity.
- **scale**: number (default: 1) - Globe scale within the canvas.
- **diffuse**: number (default: 1.2) - Diffuse lighting intensity.
- **mapSamples**: number (default: 16000) - Number of map dots (0–100000).
- **mapBrightness**: number (default: 6) - Brightness of the map dots.
- **offset**: [number, number] | ['x%', 'y%'] - Globe offset in pixels or viewport-relative percentages.

### Rotation & interaction
- **autoRotate**: number (default: 0.3) - Idle rotation speed. 0 disables; negative reverses.
- **draggable**: boolean (default: true) - Drag to rotate.
- **dragAxis**: 'x' | 'y' | 'xy' (default: 'xy') - Axis dragging affects.
- **dragSpeed**: number (default: 2) - Drag rotation speed.
- **dragStiffness / dragDamping**: number - Spring momentum tuning.
- **phi / theta**: number - Initial angles.

### Bindable / callbacks
- **scrollTo**: bind:scrollTo -> (lat, lng) => void - Imperatively rotate to a coordinate. Pins there until the next drag.
- **onReady**: () => void - Fires once the first frame renders.

### Styling
- **class**: string - Applied to the <canvas>. Default theme sizes it 400px square; override for other sizes.
- **theme**: GlobeThemeProps - Theme overrides (globe part).

## Examples

### Rotate to a city on demand
\`\`\`svelte
<script>
  let goTo;
</script>

<Globe bind:scrollTo={goTo} />
<button onclick={() => goTo(48.85, 2.35)}>Paris</button>
\`\`\`

### Custom markers and size
\`\`\`svelte
<Globe
  class="size-[600px]"
  markers={[{ location: [48.85, 2.35], size: 0.1 }]}
/>
\`\`\`

## Accessibility

The globe is a decorative <canvas> with no text content. When it conveys meaning, provide an
accessible label on a wrapping element or nearby text; keyboard users cannot rotate it.

## Notes

- Renders nothing meaningful without WebGL support.
- Colors resolve at runtime from CSS variables, so theme tokens recolor the globe on theme toggle.
- The render loop runs while mounted and stops (and disposes the WebGL context) on unmount.
`;
