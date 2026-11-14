export const glimmDescription = `
# Glimm

Import from \`entasis/glimm\`. Built on the \`glimm\` package (MIT, a dependency of entasis), loaded on the first sweep.

\`glimm(element, options?)\` plays a glimm sweep over one element: an iridescent WebGL band crosses it. Pass the update as \`change\` (sync or async): it runs as the sweep starts, its result shows behind the band and the old content stays ahead of it (a view transition scoped to the element in Chromium; elsewhere a curtain in the element's background covers it, the change runs, and a second pass reveals it). A change slower than 200 ms is not held back: the element updates when it is done and the band then sweeps over the result. Without \`change\`, the band is a passing highlight.

The band is drawn in the top layer above the element, clipped to its rounded corners and to the scroll containers around it, so it shows inside dialogs too. Reduced motion, a missing WebGL context or a server render apply the change at once without a band.

Colours: \`color\` (a semantic role, default 'primary') makes the band from that theme colour between its two OKLCH hue neighbours. \`palette\` replaces it: a glimm palette name (spectrum, prism, berry, lagoon, citrus, azure, ember), or semantic roles to blend along the band (\`['primary', 'info']\`). Over a dark surface the band is dimmed (\`brightness\` 0.8) unless set.

Presets (\`preset\`, also exported as \`glimmPresets\`), each a shape and a timing, the change cut along the same shape: 'reveal' (default with \`change\`; one wide band, 1000 ms), 'glint' (default without; a soft streak from a corner that fades towards its ends, 900 ms), 'ripple' (a ring growing from the centre, or from \`origin\`: a point or the pointer event, so it spreads from a click), 'double' (two soft bands, one from each side, meeting in the middle: left and right for ltr/rtl, top and bottom otherwise), 'split' (the reverse: two bands opening from the middle towards both sides), 'wave' (a bent band whose edge ripples). \`shape\` ('line' | 'double' | 'split' | 'glint' | 'ring') can also be set alone. Options passed with a preset win over its values.

Other options: \`direction\` ('ltr' | 'rtl' | 'ttb' | 'btt', default 'ltr', 'rtl' in a right-to-left element), \`sweepMs\`, \`outroMs\`, \`easing\`, \`bandTight\`, \`peakAlpha\`, \`brightness\`, \`waveAmount\`, \`rippleAmount\`, \`waveSpeed\`, \`swellAmount\`, \`curve\`, \`span\`, \`feather\` ('auto'), \`signal\` (an AbortSignal that cancels).

Returns \`{ changed, done, cancel }\`: \`changed\` resolves once the change is in the DOM, \`done\` when the band has faded, and \`cancel()\` removes the band at once. The change always runs, also when the sweep is cancelled. A new sweep on the same element cancels the running one.

\`\`\`ts
import { glimm } from 'entasis/glimm';

glimm(card, {
	color: 'success',
	change: () => (plan = 'pro')
});

glimm(card, { preset: 'ripple', origin: event, change: () => (count += 1) });
\`\`\`
`;
