export const tagsInputDescription = `
# TagsInput Component

A multi-value tag input. Use it for entering a list of free-text tags, or restrict entry to a searchable option list (like the Combobox, but multi-select). Selected tags render as removable chips inside the field, followed by a text input that wraps to its own line when space runs out.

## Basic Usage

\`\`\`svelte
<script>
	import { TagsInput } from 'entasis/tags-input';
	let value = $state(null);
</script>

<TagsInput
	placeholder="Add a tag..."
	bind:value={value}
/>
\`\`\`

## Props

### Core Props

- **value**: \`string[] | null\` (default: \`null\`, bindable)
  - The current list of tags. \`null\` is treated as empty.
  - The array is never mutated in place — every add/remove assigns a fresh array.

- **searchValue**: \`string\` (default: \`''\`, bindable)
  - Current text typed in the input.

- **loading**: \`boolean\` (default: \`false\`, bindable)
  - Loading state (managed automatically for async options).

- **items**: \`ComboboxOption[] | ((searchValue?: string) => MaybePromise<ComboboxOption[]>)\` (optional)
  - When omitted, the input accepts free text (any typed value becomes a tag).
  - When provided, behaves like a Combobox dropdown: static arrays are filtered client-side, functions are called with the search value and may return a Promise.

### Behavior Props

- **customTags**: \`boolean\` (default: \`false\`)
  - When \`items\` is provided, also allow Enter to add free text that is not in the option list.

- **maxTags**: \`number\` (optional)
  - Maximum number of tags. Once reached, further adds (free entry and dropdown selection) are ignored.

- **showAllOnFocus**: \`boolean\` (default: \`false\`)
  - Show all options when the input is focused, even without typing (static arrays only).

- **getValueOption**: \`(value: string) => MaybePromise<ComboboxOption | null | undefined>\`
  - Resolves the option (and its label) for a value not yet loaded. Useful for pre-filled values with async options.

- **placeholder**: \`string\` (default: \`''\`)
  - Input placeholder text.

- **loadingText**: \`string\` (default: \`'Loading...'\`)
  - Text displayed while loading options.

- **noOptionsText**: \`string\` (default: \`'No options found'\`)
  - Text displayed when no options match.

### Field Props

- **required**: \`boolean\` (default: \`false\`)
- **disabled**: \`boolean\`
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`)
- **density**: \`'compact' | 'normal' | 'comfortable'\` (default: \`'normal'\`) - Spacing density forwarded to the dropdown option rows (paddings, gaps, min-height)
- **name**: \`string\`
- **errors**: \`string[] | boolean\` (bindable)
- **focused**: \`boolean\` (bindable)
- **description**: \`string\`

### Event Props

- **onValueChange**: \`(value: string[]) => void\`
  - Called when the list of tags changes.

- **onValidate**: \`(value: string[]) => string[] | boolean\`
  - Custom validation function.

### Theme Props

- **theme**: \`TagsInputThemeProps\`
  - Customize styling for: input, inputContainer, tag, loading, error, noOptions.

## Examples

### Free-text Tags

\`\`\`svelte
<script>
	let value = $state(['svelte', 'kit']);
</script>

<TagsInput bind:value={value} placeholder="Add a tag..." />
\`\`\`

### Restricted to a Static Option List

\`\`\`svelte
<script>
	let value = $state(null);
	const items = [
		{ value: 'red', label: 'Red' },
		{ value: 'green', label: 'Green' },
		{ value: 'blue', label: 'Blue' }
	];
</script>

<TagsInput items={items} showAllOnFocus bind:value={value} />
\`\`\`

### Async Options

\`\`\`svelte
<script lang="ts">
	let value = $state(null);
	const getItems = async (searchValue?: string) => {
		const response = await fetch(\`/api/search?q=\${searchValue}\`);
		return response.json();
	};
</script>

<TagsInput items={getItems} bind:value={value} />
\`\`\`

### Options Plus Free Text

\`\`\`svelte
<TagsInput items={items} customTags bind:value={value} />
\`\`\`

### Limited Number of Tags

\`\`\`svelte
<TagsInput maxTags={3} bind:value={value} />
\`\`\`

### Pre-filled Values with Async Labels

\`\`\`svelte
<script lang="ts">
	let value = $state(['us', 'uk']);
	const getValueOption = async (value: string) => {
		return { value, label: value.toUpperCase() };
	};
</script>

<TagsInput items={getItems} getValueOption={getValueOption} bind:value={value} />
\`\`\`

## Keyboard Interactions

- **Enter**: In free mode (or with \`customTags\`), adds the current trimmed text as a tag and clears the input. When the dropdown is open and an option is highlighted, adds that option instead.
- **Backspace** (input empty): Removes the last tag.
- **ArrowDown / ArrowUp**: Move the dropdown highlight (wraps around). Restricted mode only.
- **Home / End**: Highlight the first / last option. Restricted mode only.
- **Escape**: Blurs the input and closes the dropdown.

## Accessibility

- The tag collection is a real list (\`role="list"\` / \`role="listitem"\`), not a listbox.
- Each tag chip is non-interactive; removal is a dedicated \`<button type="button">\` with an \`aria-label\` of "Remove <label>".
- **With items** the input follows the ARIA combobox pattern: \`role="combobox"\`, \`aria-expanded\`, \`aria-controls\`, \`aria-autocomplete="list"\`, \`aria-activedescendant\`, \`aria-haspopup="listbox"\`, and the dropdown is a \`role="listbox"\` with \`role="option"\` items.
- **Without items** the input is a plain text input.
- \`autocomplete="off"\` and \`data-1p-ignore\` on the input.

## Notes

- **Deduplication invariant**: A tag can never appear twice. Duplicate adds (exact string match) simply clear the search. This is a hard requirement — duplicate keys in the keyed list crash the renderer.
- **Fresh arrays**: The value array is never mutated in place. Every add/remove assigns a new array so binding, reactivity, and form updates fire correctly.
- **Animations**: Tags animate on reorder (\`animate:flip\`) and on enter/leave (\`transition:scale\`).
- **Free vs restricted mode**: Omitting \`items\` gives free-text entry. Providing \`items\` restricts entry to the option list; add \`customTags\` to permit free text alongside options.
- **Label resolution**: A tag's chip label comes from static \`items\`, then a session cache of options picked from the dropdown, then \`getValueOption\` (resolved on mount for initial values), falling back to the raw value string.
- **Dropdown filtering**: Options whose value is already selected are hidden from the dropdown.

## Theme Customization

The TagsInput uses a theme object customizable via the \`theme\` prop or a global theme.

### Theme Structure

- **input**: Input element styles (flex-1 with a min-width so it wraps to its own line).
- **inputContainer**: The flex-wrap container holding the tags and input.
- **tag**: The animated wrapper element around each tag chip.
- **loading**: Loading indicator styles.
- **error**: Error message styles.
- **noOptions**: No-options message styles.

### Global Theme Setting

\`\`\`svelte
<script>
	import { setTagsInputTheme } from 'entasis/tags-input';

	setTagsInputTheme({
		inputContainer: {
			base: 'rounded-lg border-2 transition-all'
		}
	});
</script>
\`\`\`

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
