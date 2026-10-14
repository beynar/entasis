export const autocompleteDescription = `
# Autocomplete Component

A text input with suggestions. The value is the text in the input, and the input submits it in a native form, so a suggestion is a shortcut for typing and never a requirement. Use it for search boxes, city or email-domain entry and anywhere people may type something that is not in the list. To make people pick from the list, use Combobox instead (its value is the chosen option, not text).

## Basic Usage

\`\`\`svelte
<script>
	import { Autocomplete } from 'entasis/autocomplete';
	let value = $state('');
</script>

<Autocomplete
	label="Email domain"
	items={['gmail.com', 'outlook.com', 'proton.me']}
	bind:value
/>
\`\`\`

## Props

### Core Props

- **items**: \`AutocompleteItemsSource\` (required)
  - Suggestions: strings, \`{ value, label, description?, disabled?, data? }\` options, \`{ label?, items }\` groups of either (mixed freely), or a function \`(query: string, { signal }) => MaybePromise<AutocompleteItems>\`. A value listed more than once keeps its first entry. A function runs only while the list is open (typing opens it), never for a prefilled or just chosen text
  - A string suggestion is an option whose value and label are that text
  - For arrays: narrowed client-side with a case- and accent-insensitive match on the label, in the active I18n locale
  - For functions: called after a 100ms pause in typing with the text and \`{ signal }\`. The signal is aborted when a newer text replaces the request, and a response that is not the latest is ignored. Results are shown as returned (the function filters)
- **value**: \`string | null\` (bindable) / **defaultValue**: the text in the input
- **onValueChange**: \`(value: string | null) => void\` runs for each edit the user makes and when a suggestion fills in
- **onSelect**: \`({ item, value, event }) => void\` runs after a suggestion is chosen with a click or Enter. \`item\` is the chosen option (a string suggestion arrives as \`{ value, label }\`), \`value\` is its label, the text now in the input

### Mode

- **mode**: \`'list' | 'both' | 'inline' | 'none'\` (default \`'list'\`)
  - \`'list'\`: suggestions are filtered by the text; the text changes only when one is chosen
  - \`'both'\`: filtered, and the input previews the highlighted suggestion (inline completion)
  - \`'inline'\`: not filtered, and the input previews the highlighted suggestion
  - \`'none'\`: not filtered, and the text never changes until one is chosen
  - Also sets \`aria-autocomplete\`
- **autoHighlight**: \`boolean | 'always'\` (default \`false\`). \`true\` highlights the first match while text is typed, \`'always'\` also while the text is empty, \`false\` highlights nothing until an arrow key moves it, so Enter keeps the typed text. Use \`true\` with \`mode="both"\` or \`"inline"\` to complete as you type
- **shouldFilter**: \`boolean\` (default \`true\`), **filter**: \`(option, query) => boolean\`, **limit**: \`number\`. Narrowing of static suggestions, as in Command
- **loop**: \`'wrap' | 'input' | false\` (default \`'wrap'\`). With \`'input'\` the end of the list returns to no highlight, and the text to what was typed

### Inline completion

With \`mode="both"\` or \`"inline"\` the highlighted suggestion is previewed in the input while the value stays the typed text.

- A suggestion that continues the typed text completes it: the typed letters stay as typed and the added part is selected, so the next key replaces it, and Backspace removes it and leaves the typed text
- A suggestion that does not continue the text (it only contains it) is previewed only when an arrow key lands on it, replacing the text, with the caret at the end
- Hovering a suggestion never changes the text
- Escape puts the typed text back and closes the list. Focus leaving the field puts the typed text back too, so a native submit sends what was typed
- Enter chooses the previewed suggestion (value becomes its label). ArrowLeft, ArrowRight, Home, End and Tab accept the preview as the typed text
- Deleting the completion, or the letters before it, does not bring it back until you type again
- Not applied while \`readOnly\`, disabled or composing with an IME

### Open state

- **open**: \`boolean\` (bindable) / **defaultOpen**. The list only renders while there is something to show (suggestions, a loading or error message, or the "no options" message for the typed text)
- **onOpenChange**: \`(open, details) => void\` runs before the list opens or closes. \`details\` carries \`reason\`, \`event\`, \`interaction\` and \`cancel()\`
- **onAfterOpen** / **onAfterClose**: \`() => void\` fire once after the transition
- **openOnFocus**: \`boolean\` (default \`false\`). Opens the list on focus before anything is typed: static arrays list every suggestion, functions are called with an empty text

### Field Props

- **required**, **disabled**, **readOnly**, **name**, **size**, **density**, **errors**, **focused**, **description**, **onValidate**, **messages**, **form**, **prefix**, **suffix**, **label**
- **placeholder**: \`string\`
- **autocomplete**: browser autofill hint (default \`'off'\`: the component offers its own suggestions)
- **loadingText** / **emptyText**: replace the "Loading..." and "No options found" messages
- **item**: \`Snippet<[ComboboxOption]>\` custom row renderer; **separators**: \`boolean\` between groups
- **inputAttrs**: native attributes for the input (\`inputmode\`, \`maxlength\`, event handlers that run first, where \`preventDefault()\` cancels the built-in behaviour); the component keeps id, name, value and ARIA state
- **onHighlightChange**: \`({ value, reason, event }) => void\`

## Examples

### Async suggestions

\`\`\`svelte
<script lang="ts">
	const cities = async (query: string, { signal }: { signal: AbortSignal }) => {
		const response = await fetch(\`/api/cities?q=\${encodeURIComponent(query)}\`, { signal });
		return response.json(); // string[] or { value, label }[]
	};
</script>

<Autocomplete label="City" items={cities} bind:value />
\`\`\`

### Inline completion

\`\`\`svelte
<Autocomplete label="Fruit" mode="both" autoHighlight items={['Apple', 'Apricot', 'Banana']} bind:value />
\`\`\`

### Native form

\`\`\`svelte
<form onsubmit={(event) => { event.preventDefault(); console.log(new FormData(event.currentTarget).get('city')); }}>
	<Autocomplete name="city" label="City" items={cities} />
	<Button type="submit">Search</Button>
</form>
\`\`\`

## Accessibility

- **role="combobox"** on the input with **aria-autocomplete** set to the mode, **aria-expanded**, **aria-controls** and **aria-activedescendant**; the list is a **role="listbox"** of options and groups only
- ArrowDown/ArrowUp open a closed list (with every suggestion) and move the highlight; Enter chooses the highlighted suggestion and otherwise does nothing, so the form's Enter handling and submit still work; Escape closes the list and keeps focus (a second Escape clears the text); Home and End stay on the caret
- Clicking the already-focused input toggles the list. A press inside the list never moves focus off the input
- One persistent visually hidden live region next to the input announces result counts, the empty state, loading and errors after typing settles
- Read-only: the list opens and can be browsed, the text cannot change and still submits

## Notes

- **Native forms**: the input itself carries \`name\` and submits the text (nothing when there is no name or the field is disabled); \`required\` blocks a native submit while empty. Free text is kept when focus leaves
- **Reset**: a native form reset returns the text the field mounted with
- **Race conditions**: older requests are aborted and only the latest response updates the list
- **Styling hooks**: while the list is open, the field it is anchored to carries \`data-popup-side\` and the panel \`data-side\`; option rows are \`MenuOption\` rows themed with \`setMenuOptionTheme\`

## Theme Customization

Theme parts: **input**, **inputContainer**, **loading**, **error**, **noOptions**, **group**, **groupLabel**, **separator**. They start from Combobox's look and have their own registry key, \`autocomplete\`.

\`\`\`svelte
<script>
	import { setAutocompleteTheme } from 'entasis/autocomplete';

	setAutocompleteTheme({
		inputContainer: { base: 'rounded-lg border-2' },
		noOptions: { base: 'italic' }
	});
</script>
\`\`\`
`;
