export const popoverDescription = `
# Popover Component

The Popover component displays floating content positioned relative to a trigger element. It's ideal for tooltips, dropdown menus, and contextual information.

## Basic Usage

\`\`\`svelte
<script>
	import { Popover } from 'svelai/popover';
		
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
- **position**: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end' (default: 'bottom')
  - Determines where popover appears relative to trigger
- **offset**: number - Distance in pixels from the reference element
- **fitTrigger**: boolean (default: false) - Whether popover should match the width of the trigger element
- **mobileSheet**: boolean (default: false) - On mobile viewports (<768px), render as a bottom sheet instead of an anchored floating panel
- **inline**: boolean (default: false) - Render the panel in normal document flow where the component sits instead of portaling to the viewport-fixed layer: no floating-ui positioning, no scroll lock, no outside-press dismissal (Escape still closes it). Same panel classes and motion, and the trigger still toggles it. Wins over \`mobileSheet\`
- **mobileSheetSizeTransition**: boolean (default: true) - Whether mobile-sheet panels animate intrinsic size changes

### Event Props
- **onOpenChange**: (open: boolean) => void - Called once for each library-requested state change
- **onAfterOpen**: (payload: PopoverState) => void - Called after the open transition finishes
- **onAfterClose**: (payload: PopoverState) => void - Called after the close transition finishes

### Slot Props
- **children**: Snippet<[PopoverState]> - Popover content
- **trigger**: Snippet<[PopoverState]> | (ButtonProps & { content?: string }) | false - Trigger element
  - Pass a snippet function for custom trigger: \`{#snippet trigger(popover)}...</snippet>\`
  - Pass button props object for default button: \`trigger={{ content: "Click Me", color: "primary" }}\`
  - Pass \`false\` to disable trigger (use with external ref)

### Interaction Props
- **openOnHover**: boolean (default: false) - Open on mouse hover
- **openOnClick**: boolean (default: true) - Open on click
- **delay**: number (default: 100) - Delay in ms before opening on hover
- **closeOnEscape**: boolean (default: true) - Close on Escape. Only the topmost open layer closes, so Escape inside a nested popover leaves its parent open
- **closeOnClickOutside**: boolean (default: true) - Close on an outside press. A press dismisses this popover and every layer stacked above it, but never the layer that was pressed
- **closeOnMouseLeave**: boolean (default: false) - Close when the pointer leaves the hover safe area. The safe area is the trigger, the panel, and a prediction cone toward the panel, so a diagonal move to the panel keeps it open.
- **debugSafeArea**: boolean (default: false) - Show hover safe-area overlays. Trigger/panel rectangles render in blue; the prediction cone toward the panel renders in orange.

### Focus & ARIA Props
- **focusOnOpen**: 'first' | 'container' | false (default: false) - Where focus goes when the panel opens: \`'first'\` moves it to an \`[autofocus]\` / \`[data-autofocus]\` target or the first tabbable control, \`'container'\` focuses the panel itself, \`false\` keeps it on the trigger. Focus always returns to the trigger when the popover closes (Escape or outside press)
- **haspopup**: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | true (default: 'dialog') - Value of \`aria-haspopup\` on the trigger, describing what the panel contains. \`aria-expanded\` and \`aria-controls\` are managed automatically alongside it, for the built-in Button trigger and for a snippet trigger using \`{@attach popover.reference}\`

\`\`\`svelte
<script>
	import { Popover } from 'svelai/popover';
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
- **transition**: TransitionConfig - Custom transition animation
- **directedTransition**: boolean (default: true) - Transition direction follows position

### Behavior Props
- **lockScroll**: boolean (default: true) - Lock body scroll when open

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

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
	import { Popover } from 'svelai/popover';
	import { Button } from 'svelai/button';
</script>

<!-- {@attach popover.reference} anchors the panel to the element and keeps
     aria-haspopup / aria-expanded / aria-controls in sync on it -->
<Popover>
	{#snippet trigger(popover)}
		<Button onclick={() => popover.toggle()} {@attach popover.reference}>Open</Button>
	{/snippet}
	
	<p>This is a popover!</p>
</Popover>
\`\`\`

### With button props
\`\`\`svelte
<script>
	import { Popover } from 'svelai/popover';
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
	import { Popover } from 'svelai/popover';
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
	import { Popover } from 'svelai/popover';
	import { Button } from 'svelai/button';
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
	import { Popover } from 'svelai/popover';
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
	import { Popover } from 'svelai/popover';
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
	import { Popover } from 'svelai/popover';
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
	import { Popover } from 'svelai/popover';
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
	import { Popover } from 'svelai/popover';
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
	import { Popover } from 'svelai/popover';
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
	import { Popover } from 'svelai/popover';
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
	import { Popover } from 'svelai/popover';
</script>

<Popover 
	trigger={{ content: "Trigger" }}
	onAfterOpen={(payload) => console.log('Popover opened', payload)}
	onAfterClose={(payload) => console.log('Popover closed', payload)}
>
	Watch the console
</Popover>
\`\`\`

### User Card Popover with External Ref

\`\`\`svelte
<script lang="ts">
	import { Popover } from 'svelai/popover';
	import { Button } from 'svelai/button';
	import { Avatar } from 'svelai/avatar';

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

The Popover component uses a \`PopoverState\` instance that is passed to all slot snippets. This state object provides:

- **id**: string - Popover identifier
- **size**: Size - Current popover size
- **position**: Placement - Current popover position
- **offset**: number - Current offset value
- **open()**: () => void - Method to open the popover
- **close()**: () => void - Method to close the popover
- **toggle()**: () => void - Method to toggle the popover
- **reference**: attachment for a custom trigger element (\`{@attach popover.reference}\`); anchors the panel to it and keeps its \`aria-haspopup\`, \`aria-expanded\`, and \`aria-controls\` in sync

## Accessibility

- The trigger carries \`aria-haspopup\` (from \`haspopup\`), \`aria-expanded\`, and \`aria-controls\` — automatically for the built-in Button and for a snippet trigger using \`{@attach popover.reference}\`
- \`focusOnOpen\` decides where focus lands on open; focus returns to the trigger on close, whether by Escape or an outside press
- Non-modal: Tab is not contained and the page is not made inert (use Dialog for that)
- Escape closes only the topmost open layer; an outside press dismisses every layer stacked above the one pressed. Popovers, menus, and dialogs share one layer stack
- Keyboard navigation support

## Notes

- Popover is positioned using floating-ui, except with \`inline\`, where the document lays the panel out
- Automatically adjusts position to stay in viewport
- Multiple popovers can be stacked
- Scroll locking prevents background scroll (when enabled)
- Transitions animate based on position direction

## Theme Customization

The Popover component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **motion**: Open/close transition preset, keyed by \`mode\` (a floating panel scales, the mobile
  sheet slides up). Takes \`in\` / \`out\` FSO params plus a \`duration\` / \`easing\` motion token;
  the \`transition\` prop wins over it
- **popover**: Main popover container styles

### Theme Type Definition

\`\`\`typescript
import type { PopoverThemeProps } from 'svelai/popover';

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
  import { setPopoverTheme } from 'svelai/popover';
  
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
