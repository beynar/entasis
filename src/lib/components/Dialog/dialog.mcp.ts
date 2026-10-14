export const dialogDescription = `
# Dialog Component

The Dialog component (also known as Modal) displays content in a layer above the page, blocking interaction with the rest of the application until dismissed.

## Basic Usage

\`\`\`svelte
<script>
	import { Dialog } from 'entasis/dialog';
	import { Button } from 'entasis/button';
		
</script>
// By default Dialog comes with a button that trigger them, no need to define a callback and a $state
<Dialog title="Dialog Title">
	Dialog content goes here
</Dialog>
\`\`\`

## Props

### Core Props
- **open**: boolean (bindable) - Controls dialog visibility
- **modal**: boolean (default: true) - A modal makes the page behind \`inert\`, locks page scroll, contains Tab, dims the page with the shared backdrop and dismisses on an outside press. \`modal={false}\` leaves the page interactive: no \`inert\`, no scroll lock, no backdrop, no Tab containment, and an outside press does not dismiss it unless \`closeOnClickOutside\` is set. Escape, the close button and swipes still close it (the Android Back gesture does not: it closes modal dialogs only). It renders no \`aria-modal\` (and \`data-modal="false"\`), always scrolls inside its card, and does not push dialogs beneath it back
- **defaultOpen**: boolean (default: false) - Initial state when open is not provided
- **id**: string - Unique identifier for the dialog
- **type**: 'fullScreen' | 'drawerRight' | 'drawerLeft' | 'drawerBottom' | 'drawerTop' | 'alert' | 'modal' (default: 'modal')
  - fullScreen: Full screen dialog overlay
  - drawerRight: Drawer sliding in from the right
  - drawerLeft: Drawer sliding in from the left
  - drawerBottom: Drawer sliding in from the bottom
  - drawerTop: Drawer sliding in from the top
  - alert: Alert dialog for an interruption that needs an answer: renders \`role="alertdialog"\` and ignores outside presses unless \`closeOnClickOutside\` is set (Escape still closes it)
  - modal: Standard modal dialog
  - Supports responsive values: pass a \`Partial<Record<Breakpoint, DialogType>>\` record such as \`{ xs: 'drawerBottom', md: 'modal' }\` to vary the type per breakpoint (breakpoint is one of 'xs' | 'sm' | 'md' | 'lg' | 'xl', tracked live from the viewport; the nearest defined key at or below the active one wins)
- **responsive**: boolean (default: true) - When the resolved type is \`modal\`, collapse it into a \`drawerBottom\` bottom sheet on mobile (viewport < 768px). The sheet inherits swipe-to-dismiss and the drag thumb. Set false to keep a centered modal on every screen size

### Layout Props
- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - small: Compact dialog size
  - normal: Standard dialog size
  - large: Larger dialog size

### Event Props
- **onOpenChange**: (open: boolean, details: OpenChangeDetails) => void - Called before each library-requested state change, with \`details.reason\` (\`'trigger-press'\`, \`'escape-key'\`, \`'outside-press'\`, \`'close-press'\`, \`'swipe'\`, \`'close-watcher'\` for the Android Back gesture, \`'imperative-action'\`…), \`details.event\`, \`details.trigger\`, \`details.interaction\` and \`details.cancel()\`. Cancelling keeps the dialog as it is (a cancelled swipe snaps back) and leaves the event untouched. Inside the callback \`open\` still holds the previous state. Types from \`entasis/types\`
- **onAfterOpen**: (payload: DialogApi) => void - Called once per open after the open transition finishes; a dialog created open (\`defaultOpen\`) renders once mounted, animates in and reports it too
- **onAfterClose**: (payload: DialogApi) => void - Called once per close after the close transition finishes

### Slot Props
- **title**: string | Snippet - Dialog title
- **description**: string | Snippet - Dialog description
- **children**: Snippet<[DialogApi]> - Main dialog content
- **header**: Snippet - Custom header content
- **footer**: Snippet - Custom footer content
- **trigger**: Snippet<[DialogApi]> | (ButtonProps & { content?: string }) - Custom trigger button. The built-in button carries \`aria-haspopup="dialog"\`, \`aria-expanded\` and \`aria-controls\`; its \`onclick\` runs first, and \`event.preventDefault()\` there keeps the dialog closed. In a snippet, \`{@attach dialog.trigger}\` gives any element the same contract
- **closeButton**: Snippet | false - Custom close button, or \`false\` to suppress the visible one. A closable dialog whose visible button is suppressed (\`false\`, or a snippet that renders nothing, as the Popover mobile sheet passes) still renders a visually hidden \`Close\` button at the end of the panel, out of the Tab order but in the accessibility tree, so screen reader users have a control that closes it. An \`alert\` never gets one: its own buttons answer it. The default close button is named \`Close\` (translated by the i18n catalog)

### Behavior Props
- **closeOnEscape**: boolean (default: true) - Close when Escape key is pressed (and, for a modal dialog on Android, on the Back gesture)
- **closeOnClickOutside**: boolean (default: true, false for \`type="alert"\` and for \`modal={false}\`) - Close when pressing outside dialog. A press that began before the dialog opened does not count
- **closable**: boolean (default: true) - Whether dialog can be closed
- **focusOnClose**: boolean | HTMLElement | ((details) => HTMLElement | boolean | void) (default: true) - Where focus goes when the dialog closes. \`true\` returns it to the control that opened the dialog, else to the most recent element still on the page; \`false\` leaves focus alone; an element receives it; a function gets the change details (\`reason\`, \`interaction\`…) and returns one of these, or nothing to restore as usual
- **swipeToDismiss**: boolean (default: true for drawer types) - Drag the drawer toward its edge to dismiss. Direction-aware (drawerRight drags right, drawerBottom drags down, etc.) and never hijacks inner scrolling (including a horizontal scroller in a right-to-left layout) or a mostly sideways drag (a press that travels more across the dismiss axis than along it is spent); a quick flick dismisses even when the last move before release is nearly stationary; opt elements out with \`data-no-swipe\`. A mouse or pen drags a drawer only from its handles (thumb and header), so dragging over the body selects text; a finger drags from anywhere unless text is selected in the panel. A dialog above another one keeps the one beneath moving with it: its scale and fade follow the swipe's progress
- **thumb**: boolean (default: true) - Drag thumb bar shown on swipe-dismissable drawers (inner edge, orientation follows the drawer side, oversized hitbox); set false to hide. Themeable via the \`thumb\` theme part
- **inset**: a spacing step or \`'none'\` — how far a drawer stands off the screen edge for this dialog. Defaults to the theme's \`designTokens.drawerInset\` (\`'layout-md'\`). At \`'none'\` the drawer is edge to edge, its edge corners square off and only the corners facing the page stay rounded
- **swipeFrom**: 'panel' | 'handle' (default: 'panel') - Where a finger swipe can start: anywhere on the panel, or only the drag handles (thumb and header). Mouse and pen always start from a handle
- **snapPoints**: (number | string)[] - Where a \`drawerBottom\` or \`drawerTop\` (or a modal collapsed into a mobile sheet) can rest. A number is a fraction of the available height (above 0, at most 1), a string a CSS length (\`'148px'\`, \`'20rem'\`, \`'40%'\`, \`'50vh'\`). The panel is as tall as the largest point and shows only the active one; a drag moves it between the points, a flick (0.4 px/ms or more) carries it to the next one in the direction it was thrown, and dragging below the lowest dismisses it when swipe-to-dismiss is on (otherwise the lowest is as far as it goes). The body scrolls only at the largest point; below it, a drag anywhere moves the panel. Ignored by the other types
- **snapPoint**: number | string (bindable) - The point the drawer rests at, one of \`snapPoints\`
- **defaultSnapPoint**: number | string - The point it opens at when \`snapPoint\` is not bound (default: the largest)
- **onSnapPointChange**: ({ snapPoint, details }: { snapPoint; details: OpenChangeDetails }) => void - Called before the resting point changes. \`details.reason\` is \`'swipe'\` or \`'imperative-action'\` (\`dialog.setSnapPoint\`); \`details.cancel()\` keeps the current point and a cancelled drag snaps back

### Visual Props
- **transition**: TransitionConfig - Custom transition animation

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

\`\`\`
<DialogOverlay>
	<DialogContent>
		<DialogHeader>
			<Title />
			<Description />
			<CloseButton />
		</DialogHeader>
		<DialogBody>
			<Children />
		</DialogBody>
		<DialogFooter />
	</DialogContent>
</DialogOverlay>
\`\`\`

## Examples

### More Examples

### A with a custom trigger 
\`\`\`svelte

<script>
	import { Dialog } from 'entasis/dialog';
	import { Button } from 'entasis/button';
	
	let open = $state(false);
</script>


<Dialog bind:open title="Welcome">
	<p>This is a basic dialog.</p>
	
	<!-- {@attach dialog.trigger} opens the dialog on click (Enter/Space on a non-control) and
	     keeps aria-haspopup / aria-expanded / aria-controls in sync; focus returns to it -->
	{#snippet trigger(dialog)}
		<Button {@attach dialog.trigger}>Open</Button>
	{/snippet}
</Dialog>
\`\`\`

### Choose where focus goes on close

\`\`\`svelte
<script lang="ts">
	import { Dialog } from 'entasis/dialog';

	let search = $state<HTMLInputElement | null>(null);
</script>

<input bind:this={search} aria-label="Search" />
<!-- After a save, focus the search field instead of the button that opened the dialog. -->
<Dialog
	title="Rename"
	trigger={{ content: 'Rename' }}
	focusOnClose={(details) => (details?.reason === 'close-press' ? search : undefined)}
>
	<p>New name</p>
</Dialog>
\`\`\`

### Cancel a close

\`\`\`svelte
<script lang="ts">
	import { Dialog } from 'entasis/dialog';
	import type { OpenChangeDetails } from 'entasis/types';

	let draft = $state('');
	// Runs before the change: with a draft, only the close button closes the dialog.
	const keepDraft = (open: boolean, details: OpenChangeDetails) => {
		if (!open && draft && details.reason !== 'close-press') details.cancel();
	};
</script>

<Dialog title="New message" trigger={{ content: 'Write' }} onOpenChange={keepDraft}>
	<textarea aria-label="Message" bind:value={draft}></textarea>
</Dialog>
\`\`\`

### Ask before closing

\`\`\`svelte
<script lang="ts">
	import { Dialog } from 'entasis/dialog';
	import { confirmation } from 'entasis/confirmation';
	import type { OpenChangeDetails } from 'entasis/types';

	let open = $state(false);
	let draft = $state('');

	// Escape, an outside press, the close button, a swipe and Android Back all arrive here.
	const askBeforeClosing = (nextOpen: boolean, details: OpenChangeDetails) => {
		if (nextOpen || !draft) return;
		details.cancel();
		confirmation({
			title: 'Discard this draft?',
			description: 'Your changes will be lost.',
			confirm: { text: 'Discard', color: 'danger' },
			cancel: 'Keep editing'
		}).then(({ confirmed }) => {
			if (!confirmed) return;
			draft = '';
			open = false;
		});
	};
</script>

<Dialog type="drawerRight" title="New message" bind:open onOpenChange={askBeforeClosing}>
	<textarea aria-label="Message" bind:value={draft}></textarea>
</Dialog>
\`\`\`

### Non-modal

\`\`\`svelte
<Dialog modal={false} type="drawerRight" title="Inspector" trigger={{ content: 'Open inspector' }}>
	<p>The page behind stays interactive.</p>
</Dialog>
\`\`\`

### Snap points

\`\`\`svelte
<script lang="ts">
	import { Dialog } from 'entasis/dialog';

	let snapPoint = $state<number | string>(0.3);
</script>

<Dialog
	type="drawerBottom"
	title="Snap points"
	snapPoints={[0.3, 0.6, 1]}
	bind:snapPoint
	onSnapPointChange={({ snapPoint, details }) => console.log(snapPoint, details.reason)}
	trigger={{ content: 'Open sheet' }}
>
	{#snippet children(dialog)}
		<button onclick={() => dialog.setSnapPoint(1)}>Expand</button>
	{/snippet}
</Dialog>
\`\`\`

### A with a custom as button props 
\`\`\`svelte

<script>
	import { Dialog } from 'entasis/dialog';
	import { Button } from 'entasis/button';
	
	let open = $state(false);
</script>


<Dialog bind:open title="Welcome"
trigger={{
content:"Click me",
color:"secondary",
size:"small"
}}
>
	<p>This is a basic dialog.</p>	
</Dialog>
\`\`\`

### With Description

\`\`\`svelte
<script>
	import { Dialog } from 'entasis/dialog';
	
</script>

<Dialog 	
	title="Confirm Action"
	description="Are you sure you want to continue?"
>
	<p>This action cannot be undone.</p>
</Dialog>
\`\`\`

### Different Sizes

\`\`\`svelte
<script>
	import { Dialog } from 'entasis/dialog';
	
	let open = $state(false);
</script>

\`\`\`

### Advanced Example

\`\`\`svelte
<script>
	import { Dialog } from 'entasis/dialog';
	import { Button } from 'entasis/button';
	
	let open = $state(false);
	
	function handleConfirm() {
		console.log('Confirmed!');
		open = false;
	}
</script>

<Dialog bind:open title="Confirm">
	Are you sure?
	
	{#snippet footer()}
		<div class="flex gap-2 justify-end">
			<Button variant="ghost" onclick={() => open = false}>
				Cancel
			</Button>
			<Button color="danger" onclick={handleConfirm}>
				Confirm
			</Button>
		</div>
	{/snippet}
</Dialog>
\`\`\`

### Drawer Types

\`\`\`svelte
<script>
	import { Dialog } from 'entasis/dialog';
	
	
</script>

<!-- Right drawer -->
<Dialog type="drawerRight" title="Side Drawer">
	This slides in from the right
</Dialog>

<!-- Left drawer -->
<Dialog type="drawerLeft" title="Left Drawer">
	This slides in from the left
</Dialog>

<!-- Bottom drawer -->
<Dialog type="drawerBottom" title="Bottom Drawer">
	This slides in from the bottom
</Dialog>

<!-- Full screen -->
<Dialog type="fullScreen" title="Full Screen">
	Full screen dialog content
</Dialog>
\`\`\`

### Custom Header

\`\`\`svelte
<script>
	import { Dialog } from 'entasis/dialog';
	import { warningIcon } from 'entasis/icons/warning';
</script>

<Dialog bind:open>
	{#snippet header()}
		<div class="flex items-center gap-2">
			{@render warningIcon()}
			<h2>Warning</h2>
		</div>
	{/snippet}
	
	This is important!
</Dialog>
\`\`\`


### With Lifecycle Hooks

\`\`\`svelte
<script>
	import { Dialog } from 'entasis/dialog';
	
	let open = $state(false);
</script>

<Dialog 
	bind:open
	title="Lifecycle"
	onAfterOpen={(payload) => console.log('Dialog opened', payload)}
	onAfterClose={(payload) => console.log('Dialog closed', payload)}
>
	Watch the console
</Dialog>
\`\`\`

## State Management

The \`trigger\` and \`children\` snippets, \`onAfterOpen\` and \`onAfterClose\` receive a \`DialogApi\` (\`import type { DialogApi } from 'entasis/dialog'\`). It is a narrow handle: the class behind it stays internal, so its layer, focus scope and swipe machinery can change without breaking you. It provides:

- **id**: string - Dialog identifier, which the open trigger's \`aria-controls\` points at
- **isOpen**: boolean - Whether the dialog is open
- **status**: 'closed' | 'entering' | 'open' | 'exiting' - Where the dialog is in its open/close lifecycle
- **modal**: boolean - Whether the dialog is modal
- **computedType**: DialogType - The type resolved for the current viewport, after the mobile sheet collapse
- **open(details?)**, **close(details?)**, **toggle(details?)** - Request a change through \`onOpenChange\`; each accepts the DOM event or partial details (\`{ reason, event }\`), and reports \`'imperative-action'\` unless a trigger press is dispatching
- **setOpen(open, details?)**: boolean - The same request with an explicit state; returns \`false\` when \`onOpenChange\` cancelled it
- **setSnapPoint(point, details?)**: boolean - Moves a snap-point drawer to one of its \`snapPoints\` (or the nearest to \`point\`) through \`onSnapPointChange\`; returns \`false\` when it did not move
- **currentSnapPoint**: number | string | undefined - The point the drawer rests at, as written in \`snapPoints\`
- **triggerProps**: { haspopup, expanded, controls } - The trigger state in the library's semantic vocabulary, to spread on a Button; \`trigger\` and \`reference\` already write it as ARIA attributes
- **trigger**: attachment that makes any element the dialog's trigger (\`{@attach dialog.trigger}\`): \`reference\`, plus a click that opens the dialog and, on a non-control, \`role="button"\`, \`tabindex="0"\` and Enter/Space activation. The element's own handler runs first; \`event.preventDefault()\` there stops it
- **reference**: attachment that keeps a custom trigger's \`aria-haspopup\`, \`aria-expanded\` and \`aria-controls\` in sync and makes it the element focus returns to, leaving clicks to the element

## Accessibility

- Initial focus goes to an \`[autofocus]\` / \`[data-autofocus]\` element inside the dialog, else the first tabbable control (the close button is skipped), else the panel itself
- Tab and Shift+Tab are contained inside the dialog, and the rest of the page is \`inert\` while a modal is open
- Focus is restored to the opener after the close transition finishes, just before \`onAfterClose\`: the trigger that opened it, else the element focused when it opened. When that element is gone or disabled (a menu item that opened the dialog), focus goes to the last element that had it inside the dialog beneath this one, else to the most recent element still on the page. A close by Escape or from the keyboard returns focus with a visible focus ring, and in Safari a focused text field is blurred before it unmounts so the page does not jump. \`focusOnClose\` overrides all of this
- When a dialog (a Confirmation, say) closes over another dialog, the one beneath keeps focus where it was and receives it back from the closing one; it does not move focus to its first field again
- Tab moves focus inside the dialog itself instead of leaving it to the browser, so it wraps in Safari too, where Tab skips buttons by default
- The trigger (built-in, or a snippet element with \`{@attach dialog.trigger}\`) carries \`aria-haspopup="dialog"\`, \`aria-expanded\` and \`aria-controls\` pointing at the open dialog
- On Android, the Back gesture closes the topmost modal dialog (not a \`modal={false}\` one) through a \`CloseWatcher\` (\`reason: 'close-watcher'\`), under the same rules as Escape
- \`aria-labelledby\` links the \`title\` and \`aria-describedby\` links the \`description\`
- The root is \`role="dialog"\`, or \`role="alertdialog"\` for \`type="alert"\`, always with \`aria-modal="true"\`
- The root and the panel carry \`data-type\` with the resolved type (a responsive record or a modal collapsed into a mobile sheet reports the type actually shown), which drawer edge rounding keys on
- A closable dialog whose visible close button is suppressed has a visually hidden \`Close\` button (\`tabindex="-1"\`) at the end of the panel for a screen reader's virtual cursor; the default close button is named \`Close\`
- Every way out of a dialog (Escape, an outside press, the close button, a swipe, Android Back) goes through \`onOpenChange\` with its \`reason\` before anything changes, so \`details.cancel()\` can hold any of them back; a cancelled swipe snaps back with no exit animation
- Escape closes only the topmost open layer and an outside press dismisses the layers above the one pressed; both honour \`closeOnEscape\` / \`closable\` / \`closeOnClickOutside\` through the shared layer stack
- Page scroll is locked while a dialog is open: \`data-entasis-scroll-lock\` on \`<html>\` (the Tailwind plugin turns it into \`overflow: hidden\`, so a lock another library holds is never overwritten) and \`--entasis-scrollbar-width\` with the hidden scrollbar's width, for \`position: fixed\` headers that must not jump. A page with \`scrollbar-gutter: stable\` gets no second gutter

## Indent effect

While at least one modal dialog is open, \`<html>\` carries the \`data-dialog-open\` attribute and the \`--dialog-depth\` custom property (the number of open modal dialogs, \`1\` for a single sheet). A page can scale back behind a sheet with plain CSS:

\`\`\`css
.app-shell { transition: transform 300ms ease; transform-origin: 50% 0; }
html[data-dialog-open] .app-shell { transform: scale(calc(1 - var(--dialog-depth) * 0.04)); }
\`\`\`

Non-modal dialogs do not set them.

## On-screen keyboard

In a \`drawerBottom\` (or a modal collapsed into a mobile sheet), while a text field inside the panel has focus the sheet's bottom padding grows by \`--keyboard-inset\` (the height the keyboard covers, published on \`<html>\` by the Theme), the panel shrinks to the room above the keyboard, and the field is centered once the visual viewport has stopped moving. Focus moving from one field to the next never lets the sheet drop in between. Browsers that resize the layout viewport for the keyboard (Chrome on Android only with \`interactive-widget=resizes-content\` in the viewport meta tag) report no inset and need no help; by default Chrome on Android reports the inset and the sheet uses it, like iOS.

## Notes

- Multiple dialogs can be stacked
- Last opened dialog receives focus
- Background overlay prevents interaction with page
- Scroll locking prevents background scroll
- Transitions are customizable

## Theme Customization

The Dialog component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **motion**: Open/close transition preset, keyed by \`type\` (drawers fly from their edge). Takes
  \`in\` / \`out\` FSO params plus a \`duration\` / \`easing\` motion token; the \`transition\` prop wins
  over it
- **root**: Dialog overlay/backdrop styles
- **content**: Dialog content container styles
- **thumb**: Drag thumb bar styles (type variant controls per-side placement)
- **header**: Dialog header section styles
- **footer**: Dialog footer section styles
- **closeButton**: Close button styles
- **title**: Dialog title text styles
- **description**: Dialog description text styles

### Theme Type Definition

\`\`\`typescript
import type { DialogThemeProps } from 'entasis/dialog';

// Example theme customization
const customTheme: DialogThemeProps = {
  root: {
    base: 'z-[+50] fixed inset-0 flex',
    scroll: {
      inner: 'overflow-hidden',
      outer: 'overflow-auto'
    }
  },
  align: {
    type: {
      fullScreen: 'justify-center items-center',
      drawerRight: 'justify-end',
      drawerLeft: 'justify-start',
      drawerBottom: 'justify-center items-end',
      drawerTop: 'justify-center items-start',
      modal: 'justify-center',
      alert: 'justify-center'
    }
  },
  content: {
    size: {
      small: 'max-w-md w-full',
      normal: 'max-w-xl w-full',
      large: 'max-w-3xl w-full'
    },
    type: {
      fullScreen: 'h-full w-full max-w-full',
      drawerRight: 'rounded-r-[var(--drawer-edge-radius)] h-full',
      modal: ''
    }
  },
  header: {
    size: {
      small: '',
      normal: '',
      large: ''
    }
  },
  title: {
    size: {
      small: '',
      normal: '',
      large: ''
    }
  },
  description: {
    size: {
      small: '',
      normal: '',
      large: ''
    }
  }
};
\`\`\`

### Available Variants

**root**:
- base: Base classes for dialog overlay/backdrop
- Variants:
  - size: 'small' | 'normal' | 'large' - Size constraints
  - type: 'fullScreen' | 'drawerRight' | 'drawerLeft' | 'drawerBottom' | 'drawerTop' | 'modal' | 'alert' - Dialog type/layout

**content**:
- base: Base classes for dialog content container
- Variants:
  - size: 'small' | 'normal' | 'large' - Content max-width
  - type: 'fullScreen' | 'drawerRight' | 'drawerLeft' | 'drawerBottom' | 'drawerTop' | 'modal' | 'alert' - Content styling based on type

**header**:
- base: Base classes for header section
- Variants:
  - size: 'small' | 'normal' | 'large' - Size-based styling

**footer**:
- base: Base classes for footer section
- Variants:
  - size: 'small' | 'normal' | 'large' - Size-based styling

**closeButton**:
- base: Base classes for close button
- Variants:
  - size: 'small' | 'normal' | 'large' - Size-based styling

**title**:
- base: Base classes for title text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size

**description**:
- base: Base classes for description text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Dialog 
  title="Custom Dialog"
  theme={{
    content: {
      base: 'rounded-2xl raised-5',
      size: {
        normal: 'max-w-2xl'
      }
    },
    header: {
      base: 'border-b-2 border-primary'
    }
  }}
>
  Custom styled dialog content
</Dialog>
\`\`\`

**Drawer Type Customization**:
\`\`\`svelte
<Dialog 
  type="drawerRight"
  theme={{
    align: {
      type: {
        drawerRight: 'justify-end'
      }
    },
    backdrop: {
      base: 'bg-black/50'
    },
    content: {
      type: {
        drawerRight: 'rounded-l-xl raised-5'
      }
    }
  }}
>
  Custom drawer styling
</Dialog>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setDialogTheme } from 'entasis/dialog';
  
  setDialogTheme({
    root: {
      base: 'backdrop-blur-sm'
    },
    content: {
      base: 'lift-5 border-2',
      size: {
        normal: 'max-w-2xl'
      }
    },
    title: {
      base: 'text-2xl font-bold'
    }
  });
</script>
\`\`\`
`;
