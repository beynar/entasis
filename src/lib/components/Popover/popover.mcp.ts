export const popoverDescription = `
# Popover Component

The Popover component displays floating content positioned relative to a trigger element. It's ideal for tooltips, dropdown menus, and contextual information.

## Basic Usage

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
		
</script>
// By default Popover comes with a button that triggers them, no need to define a callback and a $state
<Popover trigger={{ content: "Toggle Popover" }}>
	Popover content here
</Popover>
\`\`\`

## Props

### Core Props
- **open**: boolean (bindable) - Controls popover visibility (optional when using trigger prop)
- **defaultOpen**: boolean (default: false) - Initial state when open is not provided
- **ref**: HTMLElement | null - Reference element to position popover against (optional when using trigger prop)
- **id**: string - Unique identifier

### Layout Props
- **position**: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end' | 'inline-start' | 'inline-end' | 'inline-start-start' | 'inline-start-end' | 'inline-end-start' | 'inline-end-end' (default: 'top'; responsive values allowed)
  - Determines where popover appears relative to trigger. The panel flips to the opposite side when the preferred one has no room, and shifts back inside the viewport (20px from its edges)
  - \`inline-start\` / \`inline-end\` are logical sides: left / right in a left-to-right document, right / left in a right-to-left one (the i18n direction context, else the trigger's computed \`direction\`). The \`start\` / \`end\` alignment of \`top\` and \`bottom\` already follows the reading direction
- **collisionBoundary**: 'visualViewport' | 'layoutViewport' (default: 'visualViewport') - The viewport the panel is shifted back into. The visual viewport is the visible area: it shrinks under an on-screen keyboard and follows pinch-zoom. \`'layoutViewport'\` ignores pinch-zoom so panning a zoomed page doesn't drag the panel along; flipping and \`--available-*\` still use the visual viewport. ContextMenu uses \`'layoutViewport'\`
- **fallbackAxisSide**: 'start' | 'end' | 'none' (default: 'none') - When the panel fits neither on its side nor the opposite one, also try the perpendicular sides: \`'end'\` tries bottom (or the inline end) first, \`'start'\` top (or the inline start). A panel placed beside its reference (left or right) tries only the side asked for, so it never jumps over the reference's own row and menu. Submenus use \`'end'\`, so a submenu with no room beside its menu opens below its row, sliding back into the viewport if that is still too tight
- **anchorTo**: 'box' | 'line' (default: 'box') - What the panel anchors to when its trigger wraps across lines (a link in prose): the whole bounding box, or the line the pointer was on when the panel opened, kept while it stays open. A keyboard open takes the first line above the trigger and the last one below it
- **offset**: number - Distance in pixels from the reference element
- **fitTrigger**: boolean (default: false) - Whether popover should match the width of the trigger element (the trigger width snapped to the device pixel grid, also published as \`--anchor-width\`)
- **positionPanel**: ({ panel, reference }) => { x: number; y: number; minWidth?: number } | null - Place the panel yourself instead of floating-ui: return its viewport coordinates (the panel is \`position: fixed\`) and optionally a \`minWidth\` in px that replaces \`fitTrigger\`'s, or \`null\` to fall back to \`position\`. Called when the panel mounts and whenever floating-ui would reposition it. Select uses it to open over its trigger
- **mobileSheet**: boolean (default: false) - On mobile viewports (<768px), render as a bottom sheet instead of an anchored floating panel
- **inline**: boolean (default: false) - Render the panel in normal document flow where the component sits instead of portaling to the viewport-fixed layer: no floating-ui positioning, no scroll lock, no outside-press dismissal (Escape still closes it). Same panel classes and motion, and the trigger still toggles it. Wins over \`mobileSheet\`
- **mobileSheetSizeTransition**: boolean (default: true) - Whether mobile-sheet panels animate intrinsic size changes

### Event Props
- **onOpenChange**: (open: boolean, details: OpenChangeDetails) => void - Called before each library-requested state change, with \`details.reason\` (\`'trigger-press'\`, \`'trigger-hover'\`, \`'outside-press'\`, \`'escape-key'\`, \`'item-press'\`, \`'trigger-unmount'\`, \`'imperative-action'\`…), \`details.event\`, \`details.trigger\`, \`details.interaction\` and \`details.cancel()\`. Cancelling keeps the popover as it is and leaves the event untouched (a cancelled Escape is not \`defaultPrevented\`). Inside the callback \`open\` still holds the previous state. Types from \`entasis/types\`
- **onAfterOpen**: (payload: PopoverApi<Payload>) => void - Called once per open after the open transition finishes, right away when none plays (\`defaultOpen\`, \`inline\`)
- **onAfterClose**: (payload: PopoverApi<Payload>) => void - Called once per close after the close transition finishes

### Slot Props
- **children**: Snippet<[PopoverApi<Payload>]> - Popover content. \`Payload\` is inferred from the type you give the snippet parameter (\`PopoverApi<Person>\`) and defaults to \`unknown\`
- **trigger**: Snippet<[PopoverApi<Payload>]> | (ButtonProps & { content?: string }) | false - Trigger element
  - Pass a snippet function for custom trigger: \`{#snippet trigger(popover)}...</snippet>\`. Put
    \`{@attach popover.trigger}\` on any element (a card, an avatar, a Button) and it opens the
    panel on click and from the keyboard, with the ARIA state kept in sync. Type the parameter
    with \`PopoverApi\` from \`entasis/popover\`.
  - Pass button props object for default button: \`trigger={{ content: "Click Me", color: "primary" }}\`.
    \`children\` (a string or a snippet) replaces \`content\` for a richer body; \`prefix\` and
    \`suffix\` work as on Button.
  - Pass \`false\` to disable trigger (use with external ref)

### Interaction Props
- **openOnHover**: boolean (default: false) - Open on mouse hover, after \`delay\`. Works whether the popover started closed or open (\`defaultOpen\`): once closed, hovering the trigger opens it again. A hover-opened popover does not lock page scroll, and pressing its trigger pins it open instead of closing it. Touch taps and disabled triggers (\`disabled\`, \`aria-disabled="true"\`, \`data-disabled\`) never hover-open it, a pending open needs the pointer still on the trigger when the delay ends, and a trigger that appears under a resting pointer (a menu reopened from the keyboard) waits for the pointer to move. Right after another hover popover, tooltip or hover card was open (within 400 ms), a root popover opens without the delay; submenus keep theirs
- **openOnClick**: boolean (default: true) - Open on click
- **delay**: number (default: 100) - Delay in ms before opening on hover; leaving the trigger before it elapses cancels the open, and so does any other open-state change meanwhile (a click that opens and closes it, Escape), so a pending hover never reopens a popover the user just closed
- **closeOnEscape**: boolean (default: true) - Close on Escape. Only the topmost open layer closes, so Escape inside a nested popover leaves its parent open
- **closeOnClickOutside**: boolean (default: true) - Close on an outside press. A press dismisses this popover and every layer stacked above it, but never the layer that was pressed. A press that began before the popover opened does not count, and on a touch screen only a tap does: a finger that starts scrolling the page leaves it open
- **closeOnMouseLeave**: boolean (default: false) - Close a popover that hovering opened when the pointer leaves the hover safe area (\`reason: 'trigger-hover'\`). The safe area is the trigger, the panel, and a prediction cone toward the panel, so a diagonal move to the panel keeps it open. A popover opened by a press, the keyboard or code stays open.
- **closeDelay**: number (default: 120) - Milliseconds the pointer may spend outside the hover safe area before \`closeOnMouseLeave\` closes the popover; a longer delay forgives a pointer that overshoots on its way to the panel
- **debugSafeArea**: boolean (default: false) - Show hover safe-area overlays. Trigger/panel rectangles render in blue; the prediction cone toward the panel renders in orange.

### Focus & ARIA Props
- **focusOnOpen**: 'first' | 'container' | false (default: false) - Where focus goes when the panel opens: \`'first'\` moves it to an \`[autofocus]\` / \`[data-autofocus]\` target or the first tabbable control, \`'container'\` focuses the panel itself, \`false\` keeps it on the trigger. When the popover closes with focus inside it, focus returns to the trigger that opened it (or the control pressed inside a wrapper trigger), and after a programmatic open to the element that had focus when it opened
- **focusOnClose**: boolean | HTMLElement | ((details) => HTMLElement | boolean | void) (default: true) - Where focus goes when the popover closes with focus inside it or after a trigger opened it. \`true\` returns it to the trigger (a visible focus ring after Escape or another keyboard close), else to the most recent element still on the page; \`false\` leaves focus alone; an element receives it; a function gets the change details and returns one of these, or nothing to restore as usual. A close because focus moved on (\`'focus-out'\`) never moves it
- **label**: string - The popup's accessible name, written as \`aria-label\` on the \`<dialog>\` (on the element with the menu, listbox, tree or grid role inside a non-dialog popup unless it has a name of its own, and on the mobile sheet's dialog). A popover that holds a form or a picker is announced as a dialog: name it
- **labelledBy**: string - The id of an element that names the popup, written as \`aria-labelledby\` where \`label\` goes
- **modal**: boolean (default: false) - Makes a floating popover modal: Tab stays inside the panel (wrapping from the last control to the first), the rest of the page becomes \`inert\`, the panel opens with focus inside it (\`focusOnOpen\` defaults to \`'first'\`), the layer counts as modal for Android Back and touch dismissal, and a visually hidden Close button at the end of the panel (out of the Tab order, \`reason: 'close-press'\`) gives screen reader users a control that closes it. A modal popover does not open on hover, and an \`inline\` panel ignores it. The mobile sheet is always modal
- **tabBridge**: boolean (default: true) - Tab on the open trigger enters the portaled panel, Tab past its last control continues after the trigger and closes the panel (\`reason: 'focus-out'\`), and Shift+Tab on its first control returns to the trigger; a screen reader finds the panel straight after the trigger through \`aria-owns\`. Applies to dialog popups opened from a trigger. Menus, listboxes and the like (\`haspopup\`), modal popovers, \`ref\`-anchored panels and panels a hover opened manage Tab themselves; set \`false\` for a panel that is not meant to be tabbed into (the tooltip surface does). A trigger that is a text field (a date, color or phone input) is never bridged: Tab there moves on to the next field
- **closeOnFocusOut**: boolean (default: the value of \`closeOnClickOutside\`) - Close (\`reason: 'focus-out'\`) when focus that was inside the popover or on its trigger moves to a control outside both and outside any popup opened from them. Focus that never entered is left to outside presses, and focus that moved on is not taken back. Does not apply to menus, lists, modal popovers or a popover the pointer opened by hovering
- **haspopup**: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | true (default: 'dialog') - Value of \`aria-haspopup\` on the trigger, describing what the panel contains. \`aria-expanded\` and \`aria-controls\` are managed automatically alongside it, for the built-in Button trigger and for a snippet trigger using \`{@attach popover.reference}\`. A \`'dialog'\` popup renders in a \`<dialog>\`; any other value renders a plain \`<div>\` wrapper, points \`aria-controls\` at the element inside with the matching role (\`role="menu"\` for \`menu\` and \`true\`) and labels that element by the trigger (\`aria-labelledby\`) unless it has an \`aria-label\`

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<Popover focusOnOpen="first" haspopup="listbox" trigger={{ content: 'Pick one' }}>
	<ul role="listbox"><li role="option" tabindex="0">First</li></ul>
</Popover>
\`\`\`

### Visual Props
- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - small: Compact popover size
  - normal: Standard popover size
  - large: Larger popover size
- **arrow**: boolean (default: false) - Draws an arrow from a floating panel toward its trigger, inside the panel behind its content. It is placed by floating-ui's \`arrow\` middleware after \`shift\`, so it keeps pointing at the trigger when the panel slides to fit the viewport, stays 10px from the panel's corners, and writes \`data-side\` (the physical side it sits on) and \`data-uncentered\` (the trigger is not under the middle of the panel). Style it with \`theme.arrow\`; it takes the panel colour (\`bg-surface-floating\`)
- **transition**: TransitionConfig - Custom transition animation
- **directedTransition**: boolean (default: true) - Transition direction follows position

### Behavior Props
- **lockScroll**: boolean (default: true) - Lock page scroll while a root-level popover is open, unless hovering opened it, or a finger did and the panel is more than 20px narrower than the viewport (a touch popover the page can still scroll under stays unlocked). The lock is the \`data-entasis-scroll-lock\` attribute on \`<html>\`; \`--entasis-scrollbar-width\` holds the hidden scrollbar's width for fixed bars

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Styling hooks

A floating panel is placed before it shows: it stays hidden until its first placement lands, and \`focusOnOpen\` waits for that placement too. Every placement (scroll, resize, a flip, the end of the opening transition, and the visual viewport settling after an on-screen keyboard) updates these hooks.

**Data attributes**
- \`data-side\` on the panel: the side of the trigger it sits on after flipping: \`top\`, \`right\`, \`bottom\`, \`left\`; \`inline-start\` / \`inline-end\` when a logical side was requested; \`none\` when \`positionPanel\` placed it
- \`data-align\` on the panel: \`start\`, \`center\` or \`end\` (absent with \`data-side="none"\`)
- \`data-anchor-hidden\` on the panel: present while the trigger is scrolled out of view; the panel is hidden meanwhile
- \`data-side\` / \`data-uncentered\` on the arrow (\`arrow\`): the physical side of the panel it sits on, and present while the trigger is not under the middle of the panel
- \`data-popup-side\` on the trigger (or the \`ref\` element): the panel's \`data-side\` while it is placed, so a theme can flatten the corner the panel attaches to

**CSS variables** (set on the positioned wrapper, inherited by the panel and its content)
- \`--available-height\` / \`--available-width\`: the room between the trigger and the viewport edge on the panel's side, minus 20px. Cap a scrolling list with \`max-height: min(240px, var(--available-height))\` so it shrinks instead of covering its trigger
- \`--anchor-width\` / \`--anchor-height\`: the trigger's size, snapped to the device pixel grid
- \`--transform-origin\`: the panel corner facing the trigger, mirrored in right-to-left documents

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<!-- Square the corner that touches the trigger, whichever side the panel lands on -->
<Popover
	position="bottom-start"
	class="data-[side=bottom]:rounded-t-none data-[side=top]:rounded-b-none"
	trigger={{ content: 'Open' }}
>
	Attached panel
</Popover>

<!-- Opens on the reading direction's end side: right in English, left in Arabic -->
<Popover position="inline-end" trigger={{ content: 'Details' }}>Details</Popover>
\`\`\`

## Structure

\`\`\`
<PopoverTrigger>
	<Trigger />
</PopoverTrigger>

<PopoverContent>
	<Children />
</PopoverContent>
\`\`\`

## Examples

### More Examples

### With a custom trigger snippet
\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
	import { Button } from 'entasis/button';
</script>

<!-- {@attach popover.trigger} anchors the panel to the element, toggles it on click and keeps
     aria-haspopup / aria-expanded / aria-controls in sync on it -->
<Popover>
	{#snippet trigger(popover)}
		<Button {@attach popover.trigger}>Open</Button>
	{/snippet}
	
	<p>This is a popover!</p>
</Popover>
\`\`\`

Any element works. One that is not a control gets \`role="button"\`, \`tabindex="0"\` and Enter/Space
activation:

\`\`\`svelte
<script lang="ts">
	import { Popover, type PopoverApi } from 'entasis/popover';
	import { Avatar } from 'entasis/avatar';
</script>

<Popover>
	{#snippet trigger(popover: PopoverApi)}
		<div class="flex items-center gap-sm" {@attach popover.trigger}>
			<Avatar name="Ada Lovelace" />
			<span>Ada Lovelace</span>
		</div>
	{/snippet}

	<p>Profile details</p>
</Popover>
\`\`\`

### One popup for many triggers

A list of rows needs one Popover, not one per row. \`popover.triggerFor(() => row)\` is \`popover.trigger\` plus a payload getter: the popup moves to the trigger that was pressed (pressing another trigger while it is open moves it there and keeps it open), and \`popover.payload\` is that trigger's data, read live. Pass a getter, not the value, so the payload follows its source without the trigger being removed and re-attached (which would close the popover).

\`\`\`svelte
<script lang="ts">
	import { Popover, type PopoverApi } from 'entasis/popover';
	import { Button } from 'entasis/button';

	type Person = { id: number; name: string; role: string };
	let { people }: { people: Person[] } = $props();
</script>

<Popover position="bottom" arrow>
	{#snippet trigger(popover: PopoverApi<Person>)}
		{#each people as person (person.id)}
			<Button {@attach popover.triggerFor(() => person)}>{person.name}</Button>
		{/each}
	{/snippet}
	{#snippet children(popover: PopoverApi<Person>)}
		<strong>{popover.payload?.name}</strong>
		<p>{popover.payload?.role}</p>
	{/snippet}
</Popover>
\`\`\`

### Modal and named

\`\`\`svelte
<Popover modal label="Delivery options" trigger={{ content: 'Delivery options' }}>
	<fieldset>...</fieldset>
	<Button>Save</Button>
</Popover>
\`\`\`

### With button props
\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<Popover 
	trigger={{
		content: "Click Me",
		color: "secondary",
		size: "small"
	}}
>
	<p>This is a popover!</p>
</Popover>
\`\`\`

### Different Positions

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<!-- Top -->
<Popover position="top" trigger={{ content: "Top" }}>
	Top popover
</Popover>

<!-- Bottom -->
<Popover position="bottom" trigger={{ content: "Bottom" }}>
	Bottom popover
</Popover>

<!-- Left -->
<Popover position="left" trigger={{ content: "Left" }}>
	Left popover
</Popover>

<!-- Right -->
<Popover position="right" trigger={{ content: "Right" }}>
	Right popover
</Popover>
\`\`\`

### Advanced Example

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
	import { Button } from 'entasis/button';
</script>

<Popover position="bottom-start" trigger={{ content: "Menu" }}>
	<div class="flex flex-col gap-1">
		<Button variant="ghost" fullWidth>Profile</Button>
		<Button variant="ghost" fullWidth>Settings</Button>
		<Button variant="ghost" fullWidth>Logout</Button>
	</div>
</Popover>
\`\`\`

### Open on Hover

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<Popover 
	trigger={{ content: "Hover Me" }}
	openOnHover
	openOnClick={false}
	delay={200}
>
	Hover content
</Popover>
\`\`\`

### With Custom Offset

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<Popover 
	trigger={{ content: "Trigger" }}
	position="bottom"
	offset={20}
>
	20px away from trigger
</Popover>
\`\`\`

### Fit Trigger Width

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<Popover 
	trigger={{ content: "Click Me" }}
	fitTrigger
>
	Popover matches trigger width
</Popover>
\`\`\`

### Inline (static, in flow)

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<!-- Open in place, no portal: useful for docs, visual tests, or an always-visible panel -->
<Popover inline open trigger={false}>
	<p>Rendered where the component sits.</p>
</Popover>

<!-- The trigger still toggles an inline panel -->
<Popover inline trigger={{ content: 'Toggle' }}>
	<p>Expands below the trigger, in the flow.</p>
</Popover>
\`\`\`

### Mobile Bottom Sheet

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<Popover
	trigger={{ content: "Open filters" }}
	position="bottom"
	mobileSheet
>
	Filters content
</Popover>
\`\`\`

### Different Sizes

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<!-- Small -->
<Popover size="small" trigger={{ content: "Small" }}>
	Small popover
</Popover>

<!-- Large -->
<Popover size="large" trigger={{ content: "Large" }}>
	Large popover with more content
</Popover>
\`\`\`

### Close on Mouse Leave

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<Popover 
	trigger={{ content: "Hover Me" }}
	openOnHover
	closeOnMouseLeave
>
	Closes when you move outside the rectangle tolerance
</Popover>
\`\`\`

### With Lifecycle Hooks

\`\`\`svelte
<script>
	import { Popover } from 'entasis/popover';
</script>

<Popover 
	trigger={{ content: "Trigger" }}
	onAfterOpen={(payload) => console.log('Popover opened', payload)}
	onAfterClose={(payload) => console.log('Popover closed', payload)}
>
	Watch the console
</Popover>
\`\`\`

### Keep it open with onOpenChange

\`\`\`svelte
<script lang="ts">
	import { Popover } from 'entasis/popover';
	import type { OpenChangeDetails } from 'entasis/types';

	let note = $state('');
	// Runs before the change: an outside press or Escape keeps a popover with an unsaved note.
	const keepNote = (open: boolean, details: OpenChangeDetails) => {
		const dismissal = details.reason === 'outside-press' || details.reason === 'escape-key';
		if (!open && dismissal && note) details.cancel();
	};
</script>

<Popover trigger={{ content: 'Add a note' }} focusOnOpen="first" onOpenChange={keepNote}>
	{#snippet children(popover)}
		<textarea aria-label="Note" bind:value={note}></textarea>
		<button
			type="button"
			onclick={() => {
				note = '';
				popover.close();
			}}>Discard</button
		>
	{/snippet}
</Popover>
\`\`\`

### User Card Popover with External Ref

\`\`\`svelte
<script lang="ts">
	import { Popover } from 'entasis/popover';
	import { Button } from 'entasis/button';
	import { Avatar } from 'entasis/avatar';

	let avatarRef = $state<HTMLElement | null>(null);
	let open = $state(false);
	const user = { name: 'John Doe', email: 'john@example.com' };
</script>

<button type="button" bind:this={avatarRef} onclick={() => (open = !open)}>
	<Avatar name={user.name} />
</button>

<Popover bind:open ref={avatarRef} position="bottom">
	<div class="p-4">
		<h3>{user.name}</h3>
		<p>{user.email}</p>
		<Button fullWidth>View Profile</Button>
	</div>
</Popover>
\`\`\`

## State Management

Every slot snippet (\`trigger\`, \`children\`), \`onAfterOpen\` and \`onAfterClose\` receive a \`PopoverApi\` (\`import type { PopoverApi } from 'entasis/popover'\`). It is a narrow handle: the class behind it stays internal, so its layers, focus scope and hover tracking can change without breaking you. \`PopoverState\` is a deprecated alias of \`PopoverApi\`, kept for one minor. It provides:

- **id**: string - Popover identifier, which the open trigger's \`aria-controls\` points at
- **isOpen**: boolean - Whether the popover is open
- **status**: 'closed' | 'entering' | 'open' | 'exiting' - Where the panel is in its open/close lifecycle
- **placement**: { side, align, anchorHidden } | null - Where the floating panel was last placed (the values of \`data-side\`, \`data-align\` and \`data-anchor-hidden\`); \`null\` until it is placed and once it unmounts
- **open(details?)**, **close(details?)**, **toggle(details?)** - Request a change through \`onOpenChange\`. Each accepts the DOM event (\`onclick={popover.toggle}\`) or partial details (\`{ reason, event, trigger }\`); called while a trigger press dispatches, the change reports \`reason: 'trigger-press'\` and that trigger, otherwise \`'imperative-action'\`. \`close\` returns \`false\` when the change was cancelled. \`toggle\` on the trigger of a hover-opened popover pins it open; on another trigger of an open popover it moves the panel there
- **setOpen(open, details?)**: boolean - The same request with an explicit state; returns \`false\` when \`onOpenChange\` cancelled it
- **openReason**: 'hover' | 'press' | 'keyboard' | 'programmatic' | null - How the open popover was opened (\`programmatic\` covers \`open()\` from code, the \`open\` prop and \`defaultOpen\`)
- **activeTrigger**: HTMLElement | null - The trigger that opened it: the panel anchors to it and focus returns to it
- **triggerProps**: { haspopup, expanded, controls } - The trigger state in the library's semantic vocabulary, to spread on a Button; \`trigger\` and \`reference\` already write it as ARIA attributes
- **payload**: Payload | undefined - The data of the trigger the panel is anchored to (see \`triggerFor\`)
- **trigger**: attachment that makes any element the trigger (\`{@attach popover.trigger}\`): \`reference\` plus a click toggle (when \`openOnClick\`), and on a non-control \`role="button"\`, \`tabindex="0"\` and Enter/Space activation. The element's own handler runs first: when it calls \`event.preventDefault()\`, or \`open\`, \`close\`, \`toggle\` or \`setOpen\` during the click, the default toggle stands down, so a kept \`onclick={popover.toggle}\` does not toggle twice. Several elements may carry it: the one pressed opens the popover and anchors it
- **triggerFor(() => payload)**: \`trigger\` plus a payload getter, read back as \`payload\` while that trigger anchors the panel
- **reference**: attachment for a custom trigger element (\`{@attach popover.reference}\`); anchors the panel to it and keeps its \`aria-haspopup\`, \`aria-expanded\`, and \`aria-controls\` in sync, leaving clicks and keyboard to the element

\`usePopoverContext()\` returns the enclosing popover's \`PopoverApi\`, or \`null\` outside one.

## Accessibility

- The trigger carries \`aria-haspopup\` (from \`haspopup\`), \`aria-expanded\`, and \`aria-controls\` — automatically for the built-in Button and for a snippet trigger using \`{@attach popover.trigger}\` or \`{@attach popover.reference}\`
- \`focusOnOpen\` decides where focus lands on open; when the popover closes with focus inside it, focus returns to the trigger that opened it (after a programmatic open, to the element that had focus then)
- Menus, listboxes, trees and grids (\`haspopup\` other than \`'dialog'\`) render a plain wrapper instead of an unnamed \`<dialog>\`; the trigger's \`aria-controls\` points at the role owner, which is labelled by the trigger
- Non-modal: Tab is not contained and the page is not made inert (use Dialog for that)
- Tab order for a dialog popup that a trigger opened (not a hover-opened one, a \`ref\` popover, a menu, listbox, tree or grid): the panel is portaled to the end of the page, so Tab on the open trigger moves into the panel's first control, Tab past its last control continues with the control after the trigger and closes the popover (\`reason: 'focus-out'\`), and Shift+Tab on its first control returns to the trigger. When nothing follows the trigger, Tab is left to the browser, so it cannot loop. A visually hidden \`aria-owns\` element after the trigger makes screen readers read the panel straight after it
- Escape closes only the topmost open layer; an outside press dismisses every layer stacked above the one pressed. Popovers, menus, and dialogs share one layer stack
- Keyboard navigation support

## Notes

- Popover is positioned using floating-ui, except with \`inline\`, where the document lays the panel out
- Removing the trigger that opened it closes an open popover (reported through \`onOpenChange(false, details)\` with \`reason: 'trigger-unmount'\`), even when another trigger remains, and so does a \`ref\` element leaving the document; a trigger re-rendered as a new element keeps it open and re-anchors it. Unmounting the whole Popover reports nothing
- \`onAfterOpen\` and \`onAfterClose\` fire exactly once per open and close, also when no transition plays (an \`inline\` or \`defaultOpen\` popover reports its open once mounted)
- Automatically adjusts position to stay in viewport: flips, then shifts 20px inside the visual viewport, and places again once the visual viewport settles after an on-screen keyboard opens
- Coordinates are rounded to the device pixel grid, and in right-to-left documents the panel stays beside its trigger with \`start\` alignment on the right
- Multiple popovers can be stacked
- Scroll locking prevents background scroll (when enabled), except for a popover hovering opened and a touch-opened popover narrower than the viewport
- Transitions animate based on position direction

## Theme Customization

The Popover component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **motion**: Open/close transition preset, keyed by \`mode\` (a floating panel scales, the mobile
  sheet slides up). Takes \`in\` / \`out\` FSO params plus a \`duration\` / \`easing\` motion token;
  the \`transition\` prop wins over it
- **popover**: Main popover container styles
- **arrow**: The arrow (\`arrow\` prop): a rotated square in the panel colour, absolutely positioned inside the panel behind its content (\`-z-10\`); its position is written inline by the placement

### Theme Type Definition

\`\`\`typescript
import type { PopoverThemeProps } from 'entasis/popover';

// Example theme customization
const customTheme: PopoverThemeProps = {
  popover: {
    base: 'z-[+50] fixed bg-surface-floating text-neutral w-fit rounded-xl raised isolate h-fit',
    size: {
      small: 'max-w-3xs w-full p-2',
      normal: 'max-w-xs w-full p-3',
      large: 'max-w-sm w-full p-4'
    }
  }
};
\`\`\`

### Available Variants

**popover**:
- base: Base classes applied to all popovers
- Variants:
  - size: 'small' | 'normal' | 'large' - Controls max-width, width, and padding
  - mode: 'floating' | 'inline' | 'mobileSheet' - Set from \`inline\` / \`mobileSheet\`; \`root\` positions the wrapper (fixed, in flow, or full-screen sheet)

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Popover 
  trigger={{ content: "Click Me" }}
  theme={{
    popover: {
      base: 'rounded-xl lift-5 border-2 border-primary',
      size: {
        normal: 'max-w-md p-4'
      }
    }
  }}
>
  Custom styled popover content
</Popover>
\`\`\`

**Size Customization**:
\`\`\`svelte
<Popover 
  size="large"
  trigger={{ content: "Large Popover" }}
  theme={{
    popover: {
      size: {
        large: 'max-w-lg p-6'
      }
    }
  }}
>
  Large popover with more padding
</Popover>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setPopoverTheme } from 'entasis/popover';
  
  setPopoverTheme({
    popover: {
      base: 'rounded-lg lift-5 backdrop-blur-sm bg-white/95',
      size: {
        normal: 'max-w-sm p-4'
      }
    }
  });
</script>
\`\`\`
`;
