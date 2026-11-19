export const thinkingOrbDescription = `
# ThinkingOrb Component

Import from \`entasis/thinking-orb\`. Shows what an agent is doing as a small animated figure made of dots, drawn on a canvas: nine states, each with its own drawing, at any size from a line of text to an avatar.

Use it where a Spinner would say only "busy": beside a streaming answer, in a tool call row, in place of the assistant's avatar while it works.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { ThinkingOrb, type ThinkingOrbState } from 'entasis/thinking-orb';

	// From your agent: 'working' | 'searching' | 'solving' | 'listening' | 'connecting'
	// | 'weaving' | 'composing' | 'breathing' | 'shaping'
	let state = $state<ThinkingOrbState>('searching');
</script>

<ThinkingOrb {state} />
\`\`\`

## Props

### Look
- **state**: (default: 'working'). What the agent is doing. A change of state crosses from one drawing to the next in about a quarter of a second.
  - \`working\`: particles on tilted orbits.
  - \`searching\`: a scan meridian sweeps a dotted globe.
  - \`solving\`: bands of a sphere scramble in quarter turns, then click back into place.
  - \`listening\`: a waveform rolls through the rings of a sphere.
  - \`connecting\`: a constellation wires itself, packets running along its edges.
  - \`weaving\`: three strands plait around a sphere.
  - \`composing\`: an undulating sash of parallel strands.
  - \`breathing\`: a ring seen from the front, slowly changing shape. Its default name is "Thinking…".
  - \`shaping\`: a dotted outline turns from a circle to a triangle to a square.
- **color**: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral'. The colour role of the ink. Defaults to the Theme's default colour (\`neutral\`). Depth is shown on the ink itself: far dots fade toward the surface.
- **size**: 'small' | 'normal' | 'large' (default: 'normal'): 20, 32 or 64 pixels. \`small\` sits in a line of text, \`normal\` beside a control, \`large\` in place of an avatar. Each size has its own dot count, dot size and pace: they are separate designs, not one design scaled.
- **diameter**: number. Explicit size in pixels, overriding \`size\`. The drawing is tuned at 20 and at 64 and read between the two for any other size; above 64 it keeps the tuning of 64, so raise \`dots\` or \`dotSize\` there if it reads too fine. A class that sizes the root works too; the drawing follows the root's box.
- **colorScheme**: 'auto' | 'light' | 'dark' (default: 'auto'). Whether the orb is drawn for a dark or a light surface: far dots fade toward black on a dark one, toward white on a light one. \`auto\` reads the text colour around the orb: light text means a dark surface.

### Motion
- **speed**: number (default: 1). Multiplier on the state's own pace.
- **paused**: boolean (default: false). Holds the orb on its current frame.
- **dots**: number (default: 1). Multiplier on how many dots are drawn: 0.5 halves them, 2 doubles them. At least 0.1.
- **dotSize**: number (default: 1). Multiplier on the radius of every dot: 0.7 reads finer, 1.5 bolder.
- **tuning**: object. Fine tuning of a state's drawing; each part is read by the states named and defaults to that state's own value at the orb's size.
  - \`trailOpacity\` (working): opacity of the orbit paths. Default 0.5.
  - \`particles\` (working): particles on each orbit. Default 3.
  - \`scanSpeed\` (searching): how fast the scan sweeps, relative to the globe's spin. Default about 4.1.
  - \`dim\` (searching): opacity of the dots the scan is not on. Default 0.45.
  - \`reach\` (connecting): how far apart two nodes may be and still be joined, on a sphere of radius 1. Default 0.72.
  - \`signals\` (connecting): packets running between nodes. Default 7 at 64px, 1 at 20px.
  - \`lineWidth\` (connecting): width of the edges, in pixels at a 300px size. Default 0.8.
  - \`spread\` (connecting, shaping): size of the figure inside the orb. Default 1 for connecting, 1.45 for shaping.
  - \`turns\` (weaving): how many times each strand winds from pole to pole. Default 3.
  - \`wobble\` (composing, breathing): depth of the undulation; 0 is a clean band. Default 1 for composing, about 0.4 for breathing.
  - \`bands\` (composing, breathing): width of the band. Default about 4.
  - \`spin\` (composing, breathing): how much the band tumbles in space. Default 0.
  - \`shape\` (shaping): 'circle' | 'triangle' | 'square'. Holds one outline and stops the cycle.
- **frame**: (size: number, time: number, options: ThinkingOrbOptions) => ThinkingOrbFrame. Replaces the state's drawing with your own. Return \`{ dots, lines }\` for that instant, in pixels inside a square of \`size\`: a dot is \`{ x, y, z, r, white, a? }\` (\`z\` is depth, larger is nearer; \`white\` is the ink weight, 0 for full ink and 1 for none; \`a\` is opacity), a line is \`{ x1, y1, x2, y2, white, a?, w }\`. The orb sorts the dots by depth and paints them in its ink; \`time\` is in seconds, multiplied by the state's pace and by \`speed\`. Keep the function's identity stable (declare it outside the markup): a new function is a new drawing, and crosses in.

### Other
- **label**: string. Accessible name. Defaults to the state in the locale ("Searching…").
- **ref** (bindable, the root), **class**, **theme** (parts: \`root\`, \`canvas\`).

## Styling hooks

The root is a \`<span role="img">\` carrying \`data-slot="thinking-orb"\`, \`data-state\`, \`data-color\` and, while held, \`data-paused\`.

The ink is the root's text colour. \`color\` sets it to a role; a text colour class on the root (\`class="text-primary-contrast"\`) sets it to anything else.

## Behaviour

- Every orb reads one clock, so two orbs in the same state move together, and one animation loop drives every orb on the page.
- An orb stops drawing while it is off screen, while the page is hidden and while \`paused\`.
- Under reduced motion it shows one still frame of the state, and a change of state swaps the frame without a crossing.
- The canvas keeps a pixel per device pixel, up to three.
- Not announced: it has no live region. Show the state as text beside it when it must be read as it changes (SpinnerText does that).
- Nothing is drawn on the server; the root reserves the orb's size, so nothing shifts when the page hydrates.

## Examples

\`\`\`svelte
<!-- In a line of text -->
<p><ThinkingOrb state="searching" size="small" /> Searching the web</p>

<!-- In place of the assistant's avatar while it works -->
<ThinkingOrb state={agent.activity} size="large" color="primary" />

<!-- Larger than an avatar: more and bolder dots -->
<ThinkingOrb state="connecting" diameter={160} dots={1.6} dotSize={1.3} />

<!-- Hold the square of the shaping state -->
<ThinkingOrb state="shaping" tuning={{ shape: 'square' }} />

<!-- On a coloured surface: the surface's contrast colour as ink, fading toward the dark -->
<div class="bg-primary">
	<ThinkingOrb state="working" class="text-primary-contrast" colorScheme="dark" />
</div>
\`\`\`

## Credits

The drawings are adapted from thinking-orbs by Jakub Antalik (MIT), whose demo credits Jakub Antalik and Alex Brinza.
`;
