export const tourDescription = `
# Tour Component

A guided walkthrough anchored to elements of the page. Each step dims the page around its target with a spotlight (one viewport-sized SVG path with a rounded hole, so the target stays visible and pressable without being lifted above anything) and shows a popup beside it: title, description, progress, Back / Next (Done on the last step), Skip and a close button.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { Tour, tourTarget, type TourStep } from 'entasis/tour';
	import { Button } from 'entasis/button';

	let open = $state(false);
	const steps: TourStep[] = [
		{ target: null, title: 'Welcome', description: 'A quick look around.' },
		{ target: 'search', title: 'Search', description: 'Find anything from here.' },
		{ target: '#settings', title: 'Settings', description: 'Tune the app.', position: 'left' }
	];
</script>

<input aria-label="Search" {@attach tourTarget('search')} />
<button id="settings">Settings</button>
<Button onclick={() => (open = true)}>Start the tour</Button>

<Tour {steps} bind:open />
\`\`\`

## Steps

\`steps: TourStep[]\`, each with:
- **target**: \`string | HTMLElement | (() => HTMLElement | null) | null\` - A name registered with \`{@attach tourTarget('name')}\` (wins), else a CSS selector; an element; a function read when the step starts; \`null\` or omitted for a step centred on the page with no spotlight
- **title**: string - The popup heading; it names the popup dialog and is announced
- **description**: string - Text under the title; it describes the popup and, while the step shows, the target (added to the target's \`aria-describedby\`, removed after)
- **content**: Snippet<[TourApi]> - Custom body in place of \`description\` (also describes the popup and the target)
- **position**: Popover placement (\`'bottom'\`, \`'top-start'\`, \`'inline-end'\`…) - Overrides the tour's \`position\`
- **padding**, **radius** - Override the tour's spotlight geometry for this step
- **before**: \`({ signal, step, direction }) => void | Promise<void>\` - Awaited before the step shows: navigate, open a menu or a dialog, load data. \`signal\` aborts when the person moves on first. A rejection counts as a missing target. Meanwhile the backdrop and the previous popup carry \`data-resolving\` (the popup panel is \`aria-busy\`)
- **advanceOn**: string | string[] - DOM event(s) on the target that advance the tour (\`'click'\` for "now click this" steps); on the last step it completes the tour
- **interactiveTarget**, **missingTarget** - Per-step overrides
- **id**: string - A stable key for the step

## Props
- **steps**: TourStep[] - The steps, in order
- **open**: boolean (bindable) / **defaultOpen**: boolean (default: false) - Whether the tour runs; opening starts at \`step\`
- **step**: number (bindable) / **defaultStep**: number (default: 0) - The current step index. A parent change to \`step\` shows that step without calling \`onStepChange\`
- **modal**: boolean (default: false) - Makes the rest of the page \`inert\` (an \`inert\` the page set itself is kept) and Tab cycles between the popup and the target. Without it the page stays reachable by keyboard, and Tab past the popup's last control reaches the target
- **overlay**: boolean (default: true) - Dims the page around the target; \`false\` keeps only the popup
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Popup and button size
- **position**: Popover placement (default: 'bottom') - Where the popup goes against the target; it flips and shifts to fit like any Popover
- **padding**: number (default: 8) - Space in px between the target and the spotlight edge
- **radius**: number | 'auto' (default: 'auto') - Spotlight corner radius; \`'auto'\` follows the target's own radius grown by \`padding\`, 8px for a square target
- **missingTarget**: 'skip' | 'center' | 'stop' (default: 'skip') - When a target is still missing after \`before\` and \`targetTimeout\`: skip it in the direction of travel (\`onStepChange\` reason \`'target-missing'\`), show the step centred, or close the tour (\`onOpenChange\` reason \`'target-missing'\`). Skipping past either end closes the tour the same way
- **targetTimeout**: number (default: 3000) - Milliseconds to wait for a target to appear (DOM changes, \`tourTarget\` registrations and each frame are checked)
- **interactiveTarget**: boolean (default: true) - \`false\` covers the hole with an invisible blocker so the target cannot be pressed
- **closeOnBackdropPress**: boolean (default: false) - A press on the dimmed page closes the tour (\`'outside-press'\`); by default it does nothing
- **closeOnEscape**: boolean (default: true)
- **keyboardNavigation**: boolean (default: true) - ArrowRight / ArrowLeft go to the next / previous step (swapped in right-to-left), only while focus is in the popup or on the target itself and not in a text field
- **progress**: 'count' | 'dots' | false (default: 'count') - "2 of 5", dots, or nothing
- **skippable**: boolean (default: true) - A Skip button on every step but the last
- **closeButton**: boolean (default: true) - A close button in the popup header
- **arrow**: boolean (default: true) - An arrow from the popup to the target
- **scrollIntoView**: boolean (default: true) - A target that is not fully visible is scrolled into view (\`block: 'nearest'\`, smooth unless motion is reduced) and the step waits for the scroll to end
- **labels**: { next?, previous?, done?, skip?, close?, progress?: (current, total) => string } - Replace the I18n catalog's labels (\`tourNext\`, \`tourPrevious\`, \`tourDone\`, \`tourSkip\`, \`tourClose\`, \`tourProgress\`) for this tour
- **children**: Snippet<[TourApi]> - Replaces the whole popup body; render the title with \`id={tour.titleId}\` so it still names the dialog
- **class**: string - Classes on the popup panel
- **theme**: TourThemeProps - Slots \`root\`, \`svg\`, \`backdrop\`, \`blocker\`, \`panel\`, \`header\`, \`title\`, \`description\`, \`footer\`, \`progress\`, \`dots\`, \`dot\`, \`actions\`, and \`motion\` (variant \`part\`: \`backdrop\` fades, \`spotlight\` glides over the \`moderate\` duration with the \`standard\` easing)

## Events
- **onOpenChange**: (open, details: OpenChangeDetails) => void - Before the tour opens or closes. \`details.reason\`: \`'close-press'\`, \`'skip-press'\`, \`'complete'\` (Done on the last step, or its \`advanceOn\`), \`'escape-key'\`, \`'close-watcher'\`, \`'outside-press'\`, \`'target-missing'\` or \`'imperative-action'\`. \`details.cancel()\` keeps the tour open; a cancelled Escape is not \`defaultPrevented\`
- **onStepChange**: (details: TourStepChangeDetails) => void - Before the step changes, with one payload: \`details.step\` (the index it is going to), \`details.reason\` (\`'next-press'\`, \`'previous-press'\`, \`'arrow-key'\`, \`'advance-on'\`, \`'target-missing'\`, \`'imperative-action'\`), \`details.from\`, \`details.event\`, \`details.interaction\` and \`details.cancel()\`, which keeps the current step
- **onAfterOpen** / **onAfterClose**: (tour: TourApi) => void - Once per open and close, after the backdrop fade

## TourApi
Handed to \`children\`, a step's \`content\`, \`onAfterOpen\` and \`onAfterClose\`: \`isOpen\`, \`status\` (\`'idle' | 'resolving' | 'ready'\`), \`step\`, \`total\`, \`current\`, \`target\`, \`isFirst\`, \`isLast\`, \`titleId\`, \`descriptionId\`, \`next(event?)\`, \`previous(event?)\`, \`goTo(index, event?)\` and \`close(details?)\`.

## Layering and accessibility
- The popup is a Popover anchored to the target (\`role="dialog"\` through \`<dialog>\`, named by the step title, described by its description) and takes focus on each step (its Next button). When the tour closes, focus returns to where it was when it opened, or to the most recent element still on the page
- Each step change is announced in a polite live region ("Step 2 of 5: Search")
- The backdrop opens above the layers already open, a Dialog included, and the popup above the backdrop. A target inside an open Dialog stays pressable through the hole, and pressing the popup never dismisses that Dialog. When a step's \`before\` opens a new layer, the tour is raised above it before the step shows
- The spotlight follows its target (scrolling, resizing, layout shifts) and is clipped by the boxes that scroll it; page scroll is never locked

## Styling hooks
- \`data-entasis-tour\`: On the backdrop root: always present
- \`data-open\`, \`data-closed\`, \`data-entering\`, \`data-exiting\`: On the backdrop root: its open state and fade
- \`data-resolving\`: On the backdrop root and the popup panel while a step's \`before\` runs or its target is awaited
- \`data-instant\`: On the backdrop root while the spotlight follows a scroll or resize (absent while it glides to a new step), so a CSS transition on the variables can be skipped then
- \`data-centered\`: On the backdrop root while the step has no spotlight
- \`data-modal\`: On the backdrop root in modal mode
- \`data-step\`: On the backdrop root and the popup panel: the current step index
- \`data-tour-target\`: On the highlighted target (it also gets the Popover's \`data-popup-open\`)
- The popup panel carries the Popover hooks (\`data-side\`, \`data-align\`, \`data-open\`, \`data-entering\`…)
- CSS variables on the backdrop root, in px: \`--spotlight-x\`, \`--spotlight-y\`, \`--spotlight-width\`, \`--spotlight-height\`, \`--spotlight-radius\`

The typed maps \`tourDataAttributes\` and \`tourCssVariables\` (from \`entasis/tour\`) list each name with its meaning.
`;
