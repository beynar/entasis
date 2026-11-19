export const animatedNumberDescription = `
# AnimatedNumber Component

Import from \`entasis/animated-number\`. A number that animates from the one it showed to the one it shows. It is formatted with \`Intl.NumberFormat\` and cut into digits and symbols that are followed from one value to the next: the units stay the units when the number gains a digit, what joins the number fades in, what leaves it fades out, and the rest slides to its new place.

Two variants set how a digit changes:

- \`flow\` (default): each digit turns like a wheel, through the digits in between, behind a window with soft edges.
- \`blur\`: the new digit slides in and the old one slides out, both through a blur. Digits that did not change stay still.

Use it for a figure that changes while a person looks at it: a counter, a price that follows an option, a live metric, a total. For a figure that never changes on screen, write the number. For time left until a moment, use Countdown.

## Basic Usage

\`\`\`svelte
<script>
	import { AnimatedNumber } from 'entasis/animated-number';
	import { Button } from 'entasis/button';

	let visitors = $state(1284);
</script>

<AnimatedNumber value={visitors} class="text-4xl font-semibold" />
<Button onclick={() => (visitors += 37)}>Add visitors</Button>
\`\`\`

It is one box on its line, in the font, the size and the colour of the text round it: size and weight it with text classes on the root.

## Props

- **value** (required): number | bigint. The number shown. A change is animated from the number shown before; the first one is drawn as it is.
- **variant**: 'flow' | 'blur' (default: 'flow'). How a digit changes.
- **format**: Intl.NumberFormatOptions. Currency, percent, units, compact notation, fraction digits, sign display.
- **locale**: Intl.LocalesArgument. Defaults to the I18n locale. Digits are drawn in the locale's numbering system.
- **prefix**, **suffix**: string. Text before and after the number, animated as the number's own symbols are, and part of what is read.
- **trend**: 'auto' | 'up' | 'down' | 'nearest' (default: 'auto'). The way digits travel. \`auto\` follows the number: upwards when it grows, downwards when it shrinks, so 9 to 0 in a growing number is one step up and not nine steps down. \`up\` and \`down\` hold one way whatever the values, for a clock or a countdown. \`nearest\` lets each digit take its own shortest way.
- **continuous**: boolean (default: false). With \`flow\`: the change reads as passing through every number in between, so each digit under the highest one that changed makes at least one whole turn (120 to 220 turns the tens and the units too). It needs a direction, so it does nothing with \`trend="nearest"\`.
- **duration**: number, in milliseconds. How long a change takes. Defaults to 900 for \`flow\` and 450 for \`blur\`.
- **blur**: number, in pixels. With \`variant="blur"\`: the blur a changing digit passes through. \`0\` slides it with no blur. Defaults to 0.45 of the font size.
- **animated**: boolean (default: true). Set it to false to change the number at once.
- **ref** (bindable, the root), **class**, **theme** (parts: \`root\`, \`pre\`, \`integer\`, \`fraction\`, \`post\`, \`digit\`, \`symbol\`). Other attributes go to the root \`<span>\`.

## Behaviour

- A change that comes while another is playing starts from where the number is, at the speed it has.
- Nothing is animated under reduced motion (the Theme's \`reduceMotion\`, or the system's setting), while the number is hidden or in a tab in the background, or in a browser without CSS \`mod()\`: the number then changes at once.
- The server renders the plain number, one element per character. Wheels carry their other nine digits only while they turn.
- Digits are tabular by default, so a number keeps its width while its digits change. Add \`proportional-nums\` to the root to give them their own widths: the characters then slide to make room.
- The number's width changes at once in the page, and what follows it on the line moves at once; only the number itself is animated. Give it a fixed or minimum width, or put it at the end of its line, when that matters.
- With \`flow\`, the window the wheels turn behind reaches past the number: 0.5em at either end and 0.25em over and under it. It takes no room in the line, and the digits waiting outside it never count as overflowing content. The window itself does: a number set flush against the edge of a scroll container adds that much to what the container scrolls. Give the container a padding, or set \`--animated-number-mask-width\` to \`0px\`.
- What stands round the number (currency, percent, sign) follows the reading direction of the locale; the digits themselves are always laid out from left to right.

## Fine tuning

Set these on the root with a class (\`class="[--animated-number-distance:1em]"\`):

| Variable | Default | What it sets |
| --- | --- | --- |
| \`--animated-number-mask-height\` | 0.25em | \`flow\`: the soft edge over and under the wheels |
| \`--animated-number-mask-width\` | 0.5em | \`flow\`: the soft edge at either end of the number |
| \`--animated-number-blur\` | 0.45em | \`blur\`: the blur a changing digit passes through (the \`blur\` prop sets it in pixels) |
| \`--animated-number-distance\` | 0.55em | \`blur\`: how far a changing digit travels |

## Styling hooks

The root is a \`<span data-slot="animated-number">\` with \`data-variant\` and, from a change to the moment it has played, \`data-animating\`. Each run of the number is a \`data-slot="animated-number-section"\` with \`data-section\` (\`pre\`, \`integer\`, \`fraction\`, \`post\`). Each character is a \`data-slot="animated-number-digit"\` or \`data-slot="animated-number-symbol"\` with \`data-part\`, the kind of piece it is: \`integer\`, \`fraction\`, \`group\`, \`decimal\`, \`currency\`, \`percentSign\`, \`sign\`, \`compact\`, \`unit\`, \`literal\`, \`prefix\`, \`suffix\`. A character that is leaving carries \`data-exiting\`.

\`\`\`svelte
<script>
	import { AnimatedNumber } from 'entasis/animated-number';

	let price = $state(49.5);
</script>

<!-- Smaller cents and a quieter currency -->
<AnimatedNumber
	value={price}
	format={{ style: 'currency', currency: 'USD' }}
	class="text-5xl font-semibold"
	theme={{ fraction: { base: 'text-2xl' }, pre: { base: 'text-neutral/70' } }}
/>
\`\`\`

## Accessibility

- Assistive technology reads the number as plain text, formatted, with its prefix and suffix; the animated characters are hidden from it. It reads the number being shown, never a digit half way.
- A change is not announced on its own. Put the number in a live region when it must be (\`<p aria-live="polite">\`), and only for a number that changes now and then: a counter that ticks every second should stay silent.
- Reduced motion turns every animation off.

## Examples

\`\`\`svelte
<script>
	import { AnimatedNumber } from 'entasis/animated-number';

	let amount = $state(12480);
	let rate = $state(0.084);
	let followers = $state(18200);
	let seconds = $state(42);
	let score = $state(1204837);
</script>

<!-- Currency, percent with a sign, compact notation -->
<AnimatedNumber value={amount} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }} />
<AnimatedNumber value={rate} format={{ style: 'percent', maximumFractionDigits: 1, signDisplay: 'always' }} />
<AnimatedNumber value={followers} format={{ notation: 'compact' }} suffix=" followers" />

<!-- A countdown: always downwards, two digits -->
<AnimatedNumber value={seconds} trend="down" format={{ minimumIntegerDigits: 2 }} />

<!-- Every digit turns, as on a counter -->
<AnimatedNumber value={score} continuous />

<!-- Swapped through a blur, slower and softer -->
<AnimatedNumber value={score} variant="blur" duration={560} blur={21} />

<!-- Changed at once -->
<AnimatedNumber value={score} animated={false} />
\`\`\`

In a Stat, pass it as the value:

\`\`\`svelte
<script>
	import { AnimatedNumber } from 'entasis/animated-number';
	import { Stat } from 'entasis/stat';

	let revenue = $state(48250);
</script>

<Stat label="Revenue">
	{#snippet value()}
		<AnimatedNumber value={revenue} format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }} />
	{/snippet}
</Stat>
\`\`\`

## Credits

The \`flow\` variant is adapted from NumberFlow by Maxwell Barvian (MIT), the \`blur\` variant from animated-blur-number by serafim (MIT).
`;
