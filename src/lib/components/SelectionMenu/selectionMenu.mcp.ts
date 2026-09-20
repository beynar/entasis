export const selectionMenuDescription = `
# SelectionMenu Component

SelectionMenu renders ToggleMenu controls anchored to a non-collapsed document selection. It accepts the same toolbar item props directly, filters the selection to a target container, preserves the range while controls are pressed, and positions the toolbar through Popover.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { SelectionMenu } from 'entasis/selection-menu';
	import type { ToggleMenuItem } from 'entasis/toggle-menu';

	let items = $state<ToggleMenuItem[]>([
		{ type: 'toggle', label: 'Bold', prefix: boldIcon },
		{ type: 'toggle', label: 'Comment', prefix: commentIcon }
	]);
</script>

<div>
	<article>Select text in this article.</article>
	<SelectionMenu bind:items label="Selection tools" />
</div>
\`\`\`

With no target prop, SelectionMenu watches its parent. Pass a selector or an HTMLElement when the selection container is elsewhere:

\`\`\`svelte
<SelectionMenu target="#editor" bind:items label="Editor tools" />
<SelectionMenu target={editorElement} bind:items label="Editor tools" />
\`\`\`

## Props

- **target**: HTMLElement | string | null - Parent by default; selectors resolve in the same Document or ShadowRoot. Null disables tracking.
- **items**: ToggleMenuItem[] (bindable) - Canonical toolbar item list passed directly to ToggleMenu. Pressed state lives on the items.
- **label**: string - Accessible name passed directly to ToggleMenu.
- **color / variant / disabled**: ToggleMenu defaults inherited by every item.
- **onItemsChange**: (items) => void - Called with the complete updated item list after any control changes.
- **class / theme**: ToggleMenu root class and theme overrides.
- **children**: Optional temporary replacement for the ToggleMenu body while retaining the same selection tracker. Toolbar props remain required.
- **enabled**: boolean = true - Temporarily suppresses the menu without changing the target.
- **position**: Popover placement = 'top' - Preferred placement around the selected range.
- **offset**: number = 8 - Gap from the selected range.
- **size**: size token = 'normal' - Shared ToggleMenu item and Popover size.
- **transition**: Popover transition options - Enter and exit transition overrides.
- **directedTransition**: boolean = true - Enters from the resolved placement.
- **closeOnEscape**: boolean = true - Escape dismisses the current selection.
- **closeOnClickOutside**: boolean = true - Outside clicks dismiss the current selection.
- **onSelect**: (payload: SelectionMenuSelection | null) => void - The pick event: receives cloned valid ranges and clear
  events. Callback-naming decision: the document owns the text selection, so SelectionMenu has no
  controlled \`selection\` prop to change and cannot use the \`onSelectionChange\` state family.
- **onAfterOpen / onAfterClose**: post-transition lifecycle callbacks receiving SelectionMenuPayload.
- **popover**: Props forwarded to the floating Popover panel as one object - \`{ class, theme }\`.
- **contentClass**: string - Additional classes for the advanced custom-content wrapper.
- **selectionTheme**: SelectionMenuThemeProps - Popover panel and custom-content theme overrides.

## Target Resolution

Both selection endpoints must be inside the resolved target. Whitespace-only, collapsed, or non-rendered ranges do not open the menu. String selectors use standard querySelector semantics, so use a selector that uniquely identifies the intended container.

## Accessibility

Direct mode inherits ToggleMenu's toolbar semantics, roving keyboard focus, disabled-item handling, tooltips, and responsive More menu. Escape and click-outside dismissal are provided by Popover. Custom-content mode is responsible for its own accessible role and keyboard model.
`;
