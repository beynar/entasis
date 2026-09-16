export const richTextInputDescription = `
# RichTextInput Component

RichTextInput is a markdown rich text editor for AI-style composition. It supports inline and block formatting, trigger-based suggestions, token insertion, and a bindable markdown value.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { RichTextInput, type RichTextInputTriggers } from 'svelai/rich-text-input';

	let value = $state('');

	const triggers: RichTextInputTriggers = {
		'/': {
			title: 'Commands',
			tokenKind: 'command',
			items: [{ id: 'summarize', label: '/summarize', kind: 'command' }]
		}
	};
</script>

<RichTextInput bind:value {triggers} toolbar="both" />
\`\`\`

## Standalone Usage

\`\`\`svelte
<RichTextInput standalone toolbar="hover" placeholder="Prompt..." />
\`\`\`

## Height

\`\`\`svelte
<RichTextInput placeholder="Grows with content by default..." />
<RichTextInput maxHeight={320} placeholder="Capped at 320px..." />
\`\`\`

## Form Usage

\`\`\`svelte
<Form
	inputs={{
		prompt: {
			type: 'rich-text',
			label: 'Prompt',
			placeholder: 'Write a prompt...',
			toolbar: 'fixed'
		}
	}}
/>
\`\`\`

## Props

### Value
- **value**: string - Bindable markdown value.
- **name**: string - Hidden input name for native form submission; Form supplies this from the field key.
- **id**: string - Applied to the editable root.
- **ref**: HTMLDivElement | null - Bindable editable root reference.
- **label**, **description**, **helper**, **errors**, **required**, **onValidate** - Standard Field props.
- **placeholder**: string (default: "Ask anything...") - Placeholder and textbox aria-label.
- **disabled**: boolean (default: false) - Disables editing and suggestions.
- **standalone**: boolean (default: false) - Renders only the rich text editor chrome without the Field wrapper or input surface.
- **maxHeight**: number | string | false (default: false) - False lets the editor grow with content; a number/string caps the editor height.

### Suggestions
- **triggers**: RichTextInputTriggers - Trigger configuration keyed by characters such as '/', '@', or '$'.
- **onSuggestionOpen**: (payload) => void - Called when a suggestion menu opens.
- **onSuggestionClose**: (payload) => void - Called when a suggestion menu closes.
- **onSuggestionQueryChange**: (payload) => void - Called when the active query changes.
- **onSuggestionHighlightChange**: (payload) => void - Called when highlighted suggestion changes.

### Formatting
- **toolbar**: 'hover' | 'fixed' | 'both' | 'none' (default: 'hover') - 'hover' shows controls for selected text, 'fixed' pins controls above the editor, 'both' enables both, and 'none' hides formatting controls.
- **formats**: RichTextInputFormat[] - Allowed formatting controls.
- **toolbarClass**: string - Extra classes on the fixed toolbar wrapper.

### Events and Methods
- **onValueChange**: (payload: RichTextInputChange) => void - Receives markdown, tokens, and empty state.
- **submitShortcut**: 'enter' | 'shift-enter' | 'command-enter' | 'none' - Shortcut that calls onSubmitShortcut.
- **onSubmitShortcut**: (event: KeyboardEvent) => void - Submit shortcut callback.
- **focus()**, **clear()**, **insertText(text)**, **insertItem(trigger, item)**, **insertToken(token)** are exported component methods.

## Accessibility

- The editable root uses role="textbox" and aria-multiline.
- Fixed and selected-text formatting controls use ToggleMenu toolbar semantics and roving focus.
- Block styles use radio semantics, list controls toggle on and off, and command buttons do not expose pressed state.
- The hover toolbar uses SelectionMenu's direct ToggleMenu pass-through for range containment, selection preservation, and Popover positioning.
- Suggestion menus use the existing Command and Popover primitives.
`;
