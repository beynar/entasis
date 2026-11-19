export const glimmDescription = `
# Glimm

Import from \`entasis/glimm\`. Built on the \`glimm\` package (MIT, a dependency of entasis), loaded on the first sweep.

\`glimm(element, options?)\` plays a glimm sweep over one element: an iridescent WebGL band crosses it. Pass the update as \`change\` (sync or async): it runs as the sweep starts, its result shows behind the band and the old content stays ahead of it (a view transition scoped to the element in Chromium; elsewhere a curtain in the element's background covers it, the change runs, and a second pass reveals it). A change slower than 200 ms is not held back: the element updates when it is done and the band then sweeps over the result. Without \`change\`, the band is a passing highlight.

The sweep spans the element's content, not its padding: the box its children occupy less their own padding (a Card's slots), so the band's timeline, the cut of the change, the sparks and the blur follow the content, and the padding is never blurred. The band is drawn in the top layer above the element, clipped to its rounded corners and to the scroll containers around it, so it shows inside dialogs too. Reduced motion, a missing WebGL context or a server render apply the change at once without a band.

Colours: \`color\` (a semantic role, default 'primary') makes the band from that theme colour between its two OKLCH hue neighbours. \`palette\` replaces it: a glimm palette name (spectrum, prism, berry, lagoon, citrus, azure, ember), or semantic roles to blend along the band (\`['primary', 'info']\`). Over a dark surface the band is dimmed (\`brightness\` 0.8) unless set.

Presets (\`preset\`, also exported as \`glimmPresets\`), each a shape and a timing, the change cut along the same shape: 'reveal' (default with \`change\`; one wide band, 1000 ms), 'glint' (default without; a soft streak from a corner that fades towards its ends, 900 ms), 'ripple' (a ring growing from the centre, or from \`origin\`: a point or the pointer event, so it spreads from a click), 'double' (two soft bands, one from each side, meeting in the middle: left and right for ltr/rtl, top and bottom otherwise), 'split' (the reverse: two bands opening from the middle towards both sides), 'wave' (a bent band whose edge ripples), 'surge' (default with \`source\`; the band draws its breath at the control, leaves it as an arc that swells over the element, sparks riding it, and leaves its colour on the edges, 1300 ms). \`shape\` ('line' | 'double' | 'split' | 'glint' | 'ring' | 'arc') can also be set alone. Options passed with a preset win over its values.

\`source\` (an element, inside the element or beside it) is the control the sweep starts from: an 'arc' leaves it flattened along its long side (a wide button sends up a dome, a tall tab a sideways one) and the control's own area shows the change at once; a 'ring' grows from its centre and leaves it clear. Without a source an arc leaves \`origin\`, or the middle of the side \`direction\` starts from.

What goes with the band, on any shape: \`anticipation\` (ms the band takes to draw its breath before it leaves: it shows a little inside and is drawn back to its start; 240 in surge), \`sparks\` (up to 32 that ride the band and burn out; 12 in glint, 20 in ripple, 32 in surge), \`edges\` (0 to 1, how much the band lights the element's rounded edges where it meets them, in its own colour, with a white hairline; it comes and goes with the band; 0.5 to 0.9 in reveal, ripple, double, split, wave and surge), \`blur\` (CSS px the content blurs where the band crosses it, a backdrop-filter layer under the band; 4 in reveal and ripple, 6 in wave, 8 in surge; 0 turns it off), \`distort\` (CSS px the content swells by where the band crosses it, its colours parting slightly: an SVG displacement lens over the old and new pictures of the element's scoped view transition, so only with \`change\` and only in Chromium; elsewhere the content stays still; 6 in ripple and wave, 12 in surge). The colours are dithered so soft gradients do not band.

Other options: \`direction\` ('ltr' | 'rtl' | 'ttb' | 'btt', default 'ltr', 'rtl' in a right-to-left element), \`sweepMs\`, \`outroMs\`, \`easing\`, \`bandTight\`, \`peakAlpha\`, \`brightness\`, \`waveAmount\`, \`rippleAmount\`, \`waveSpeed\`, \`swellAmount\`, \`curve\`, \`span\`, \`feather\` (default 0: the band runs to the element's edges, clipped to its rounded shape; a number or 'auto' fades it before them), \`signal\` (an AbortSignal that cancels).

Returns \`{ changed, done, cancel }\`: \`changed\` resolves once the change is in the DOM, \`done\` when the band and its sparks have faded, and \`cancel()\` removes the band at once. The change always runs, also when the sweep is cancelled. A new sweep on the same element cancels the running one.

\`\`\`ts
import { glimm } from 'entasis/glimm';

glimm(card, {
	color: 'success',
	change: () => (plan = 'pro')
});

glimm(card, { preset: 'ripple', origin: event, change: () => (count += 1) });

glimm(card, { source: confirmButton, change: () => (sent = true) });
\`\`\`
`;
