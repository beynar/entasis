export const annotationDescription = `
# Annotation Component

Import from \`entasis/annotation\`. Calls attention to a piece of content the way a pen would: a marker tint on the target, and a handwritten note beside it with a hand-drawn arrow back to it. Placed by CSS alone, and rendered whole by the server; the one thing that runs in the browser is, with \`draw\`, waiting for the annotation to come into view.

Use it in documentation, onboarding, marketing pages and annotated screenshots. For a note a person opens on demand, use Tooltip; for a guided sequence, use Tour.

## Basic Usage

\`\`\`svelte
<script>
	import { Annotation } from 'entasis/annotation';
</script>

<p>
	The dashboard updates
	<Annotation note="no refresh needed" color="warning">in real time</Annotation>.
</p>
\`\`\`

## Props

- **children**: string | Snippet. The target.
- **note**: string | Snippet. The handwritten note. Leave it out for a marker alone, with no arrow.
- **placement**: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'right' (default: 'bottom'). Where the note sits round the target; the arrow runs from the note to the target. \`start\` and \`end\` draw the arrow on a slant and follow the reading direction: from right to left they swap sides and the arrow mirrors.
- **color**: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral' | 'rainbow'. The one colour of the marker, the arrow and the note. Defaults to the Theme's default colour (\`neutral\`). \`rainbow\` is a hue that keeps turning; it holds still under reduced motion.
- **highlight**: boolean (default: true). Tints the target, as a marker pen would. Turn it off for a target that has its own fill (a button, a chip, an image).
- **draw**: boolean (default: false). Draws the annotation when it comes into view: the marker sweeps over the target, the note is written, then the arrow is traced from the note to the target. Until then only the target shows. It plays once (scrolled away and back, it is not drawn again), and not at all under reduced motion: the annotation is then there from the start. Remount the annotation to play it again (a \`{#key}\` block). Without scripts it plays as the page is painted.
- **drawOffset**: number | a percentage such as \`'25%'\`. With \`draw\`: how far above the bottom of the screen the target must be before it is drawn, in pixels or as a share of the screen's height (\`'25%'\`). A negative distance draws it that far before it comes into view. Without it, the annotation is drawn once half of its target shows (or, for a target taller than the screen, once it fills a quarter of the screen). An annotation that can never get that far up the screen, such as one at the very bottom of a page, is never drawn: keep the distance small.
- **decorative**: boolean (default: false). Hides the note from assistive technology. Only for a note that repeats what the page already says.
- **as**: 'span' | 'div' (default: 'span'). A \`span\` sits inside a line of text; a \`div\` goes round a block, such as a card or a paragraph.
- **ref** (bindable, the root), **class**, **theme** (parts: \`root\`, \`arrow\`, \`label\`).

## Layout

The note and the arrow are drawn outside the target and reserve no space: leave room round an annotated line (a margin, a taller line height), or they will cover what is next to it. A long note wraps at \`--annotation-label-max-width\`. An ancestor with \`overflow: hidden\` clips them.

Annotations nest: wrap one in another to point at the same target from two sides. Keep the tint on one of them, or the two add up.

## Fine tuning

Set these on the root with a class (\`class="[--annotation-rotate:0deg]"\`):

| Variable | Default | What it sets |
| --- | --- | --- |
| \`--annotation-color\` | the colour role | marker, arrow and note; any CSS colour |
| \`--annotation-font\` | 'Shantell Sans', then the system's handwriting fonts | the note's font |
| \`--annotation-font-size\` | 0.95rem | the note's size |
| \`--annotation-label-max-width\` | 150px | where the note wraps |
| \`--annotation-rotate\` | -4deg | the note's tilt |
| \`--annotation-target-gap\` | 5px | between the target and the arrow |
| \`--annotation-label-gap\` | 6px | between the arrow and a note beside or over the target |
| \`--annotation-lower-label-gap\` | -4px | the same, for a note under the target |
| \`--annotation-arrow-x\`, \`--annotation-arrow-y\` | 0px | moves the arrow |
| \`--annotation-label-x\`, \`--annotation-label-y\` | 0px, 5px | moves the note |
| \`--annotation-draw-duration\` | 900ms | with \`draw\`: how long the whole drawing takes |
| \`--annotation-draw-delay\` | 0s | with \`draw\`: what it waits first, to draw several one after the other |

The note is set in Shantell Sans when the page has loaded it (it is a Google font; the component does not load it), and otherwise in the system's handwriting font.

## Styling hooks

The root carries \`data-slot="annotation"\`, \`data-placement\` (with a note), \`data-highlight\`, \`data-rainbow\` and, with \`draw\`, \`data-draw\` (\`wait\` until it is in view, then \`play\`). The marker is the root's \`::before\`. The arrow is an \`<svg data-slot="annotation-arrow">\`, the note a \`<span data-slot="annotation-label">\`.

## Accessibility

- The note follows the target in the page, so it is read right after it, and the target is described by it (\`aria-describedby\`).
- \`decorative\` hides the note; the arrow is always hidden.
- A drawing is easy to miss: do not make the note the only place where an instruction, an error or a status is given.
- In forced colours the marker becomes an outline, and the arrow and the note take the text colour.

## Examples

\`\`\`svelte
<!-- A marker alone -->
<Annotation color="warning">important</Annotation>

<!-- Round a control: no tint, the note beside it -->
<Annotation note="start here" placement="right" highlight={false} color="primary">
	<Button>Create project</Button>
</Annotation>

<!-- Round a block -->
<Annotation as="div" note="updated every hour" placement="top-end" highlight={false}>
	<Card>...</Card>
</Annotation>

<!-- Drawn in when it comes into view, the second after the first -->
<Annotation draw note="first" placement="top">this</Annotation>
<Annotation draw note="then" class="[--annotation-draw-delay:900ms]">that</Annotation>

<!-- Drawn once it is a quarter of the way up the screen -->
<Annotation draw drawOffset="25%" note="look">here</Annotation>

<!-- Two notes on one target -->
<Annotation note="fast" placement="top" highlight={false}>
	<Annotation note="and cheap" placement="bottom" color="success">this plan</Annotation>
</Annotation>

<!-- Any colour, a straight note, a wider one -->
<Annotation
	note="a longer note that needs more room"
	class="[--annotation-color:#ff1493] [--annotation-rotate:0deg] [--annotation-label-max-width:220px]"
>
	target
</Annotation>
\`\`\`

## Credits

Adapted from neat-annotations by Maxim Syabro (MIT).
`;
