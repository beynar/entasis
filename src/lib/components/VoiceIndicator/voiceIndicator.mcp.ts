export const voiceIndicatorDescription = `
# VoiceIndicator Component

Import from \`entasis/voice-indicator\`. Shows where a voice conversation is (idle, connecting, listening, thinking, speaking, error) and how loud the voice is, as an animated ring or orb drawn on a canvas.

It only shows the conversation: starting the microphone, detecting speech and playing the assistant's audio are the app's. \`VoiceMicrophone\`, exported beside it, holds a microphone stream as reactive state.

## Basic Usage

\`\`\`svelte
<script>
	import { VoiceIndicator, VoiceMicrophone } from 'entasis/voice-indicator';
	import { onDestroy } from 'svelte';

	const microphone = new VoiceMicrophone();
	onDestroy(() => microphone.stop());

	// 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error', from your session.
	let state = $state('idle');
</script>

<VoiceIndicator {state} input={microphone.stream} output={() => player.level} />
\`\`\`

## Props

### Look
- **variant**: 'ring' | 'orb' (default: 'ring'). The shape: rings of line round an open centre, or a filled sphere.
- **appearance**: 'light' | 'solid' (default: 'light'). What the shape is made of. \`light\`: a blooming ribbon of light (ring), a flowing cloud (orb). \`solid\`: lit tubes that a voice opens into a globe (ring), a matt ball with clouds on it, in full colours and with no glow or highlight of its own (orb).
- **color**: 'spectrum' | 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral' (default: 'spectrum'). The indicator's own colours, or a colour role. A change of colour crossfades. \`neutral\` gives a grey look. The \`error\` state shows the danger role whatever this is.
- **size**: 'small' | 'normal' | 'large' (default: 'normal'): 48, 128 or 224 pixels.
- **diameter**: number. Explicit size in pixels, overriding \`size\`. A class that sizes the root works too; the drawing follows the root's box.
- **colorScheme**: 'auto' | 'light' | 'dark' (default: 'auto'). Whether it is drawn for a dark or a light surface. \`auto\` reads the text colour around it: light text means a dark surface. Light is drawn additively on dark and as ink on a light surface.

### Conversation
- **state**: 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error' (default: 'idle'). A change of state eases; it never cuts.
  - \`idle\`: sources ignored, a slow drift.
  - \`connecting\`: the working motion, dimmed and pulsing.
  - \`listening\`: follows \`input\`. An orb shrinks as the person speaks.
  - \`thinking\`: sources ignored; the colours turn like a loader.
  - \`speaking\`: follows \`output\`. An orb swells and glows as the assistant speaks.
  - \`error\`: stills and takes the danger colour.
- **input**: MediaStream | AnalyserNode | number | (() => number) | null. The person's voice, followed while \`listening\`. A stream gets its own analyser (shared between indicators on the same stream, never played back). A number is a level from 0 to 1; a function is read every frame without re-rendering.
- **output**: the same. The assistant's voice, followed while \`speaking\`. Each stands in for the other when only one is given.
- **direction**: number | (() => number) | null. Where the voice comes from, -1 (left) to 1 (right). While a voice is heard the indicator leans that way and settles back in silence. A microphone is mono, so the side comes from the app. A leaning ring is drawn up to 45% of its size past its box on either side.

### Motion
- **motion**: 'calm' | 'balanced' | 'expressive' (default: 'balanced'). How fast it moves and how far a voice moves it. The shape follows the voice phrase by phrase, not syllable by syllable, and a bend has a ceiling in every preset: a ring in light bends by about 8%, 12% or 14% of its radius at the loudest and swells by 4%, 7% or 9%.
- **speed**: number (default: 1). Multiplier on the pace of every motion.
- **sensitivity**: number (default: 1). Input gain; raise it for a quiet source.
- **threshold**: number (default: 0.04). Noise gate, 0 to 1.
- **curve**: 'soft' | 'linear' | 'log' | 'exp' | ((level: number) => number) (default: 'soft'). The curve a loudness above the gate is shown through. \`soft\` rises fast then rounds off, so a shout does not clip; \`linear\` is the loudness as it is; \`log\` lifts quiet sounds the most; \`exp\` keeps quiet sounds low and opens up on loud ones. A function takes the gated loudness (0 to 1) and returns the level shown (0 to 1).
- **curveAmount**: number. How far a named curve bends away from the straight line; 0 is the straight line. Defaults to 3 for \`soft\` and \`exp\`, 9 for \`log\`.
- **hoverBend**: boolean | number (default: false). Ring only: as the pointer nears the rim, the rings are drawn toward it, while \`idle\` or \`thinking\`. \`true\` bends at 0.55.
- **paused**: boolean (default: false). Holds the indicator on its current frame.
- **tuning**: object. Fine tuning, each part defaulting to the look's own: \`radius\`, \`deform\`, \`rings\`, \`gap\`, \`lineWidth\`, \`spread\`, \`halo\` (ring in light), \`tilt\`, \`open\`, \`twist\`, \`wobble\` (solid ring), \`listeningScale\`, \`speakingScale\` (orb), and the envelope: \`attack\`, \`release\`, \`idle\`, \`calm\`.
- **onLevelChange**: (level: number) => void. The shaped level, 0 to 1, each frame it changes.

### As a button
- **onStart**: () => void. Makes the indicator a \`<button>\`; called when it is pressed while \`idle\` or in \`error\`.
- **onStop**: () => void. Called when it is pressed in any other state.
- **disabled**: boolean. The button cannot be pressed.

### Other
- **label**: string. Accessible name. Defaults to the state in the locale ("Voice assistant listening"); as a button, to what a press does ("Start voice session"), with the state as its description.
- **ref** (bindable, the root), **class**, **theme** (parts: \`root\`, \`canvas\`).

## VoiceMicrophone

\`\`\`ts
const microphone = new VoiceMicrophone();
await microphone.start(); // from a press: browsers start audio only inside a user gesture
microphone.stream; // MediaStream | null, reactive
microphone.status; // 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error'
microphone.active; // boolean
microphone.error; // what the browser rejected the request with
microphone.stop(); // releases the microphone; call it when the owner is destroyed
microphone.toggle();
\`\`\`

\`start(constraints?)\` takes MediaTrackConstraints; echo cancellation and noise suppression are on by default.

## Styling hooks

The root carries \`data-slot="voice-indicator"\`, \`data-variant\`, \`data-appearance\`, \`data-state\`, \`data-color\` (the role shown, or \`spectrum\`) and, as a button, \`data-disabled\`.

## Behaviour

- The indicator stops drawing while it is off screen, while the page is hidden and while \`paused\`.
- Under reduced motion its clocks hold: it still shows the level of a voice and the state's colour, without drifting, spinning or bending.
- Both orbs draw their clouds with a WebGL shader, in one context shared by every orb on the page; without WebGL an orb is a ball filled with a gradient of its colours.
- Not announced: it has no live region, since a state changes many times a minute during a conversation. Show the state as text beside it when it must be read.
- As a button it is not offered to browser agents through \`<Theme webmcp>\`; pair it with a Button when an agent must start the session.

## Examples

\`\`\`svelte
<!-- A level you compute yourself -->
<VoiceIndicator state="speaking" output={() => analyserLevel()} />

<!-- A quiet source, lifted by a logarithmic curve -->
<VoiceIndicator state="listening" input={stream} sensitivity={1.5} curve="log" curveAmount={20} />

<!-- An orb in the brand colour -->
<VoiceIndicator variant="orb" color="primary" state="listening" input={microphone.stream} />

<!-- The indicator starts and stops the session -->
<VoiceIndicator
	{state}
	size="large"
	input={microphone.stream}
	onStart={() => microphone.start()}
	onStop={() => microphone.stop()}
/>

<!-- Small, inline -->
<VoiceIndicator variant="orb" diameter={20} state="speaking" output={0.5} />
\`\`\`
`;
