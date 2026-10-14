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

- **items**: \`ComboboxItems | ((searchValue: string | undefined, request: { signal: AbortSignal }) => MaybePromise<ComboboxItems>)\` (optional)
  - When omitted, the input accepts free text (any typed value becomes a tag).
  - When provided, behaves like a Combobox dropdown: static arrays are filtered client-side (case- and accent-insensitive, in the active I18n locale), functions are called after a 100ms pause with the search text and \`{ signal }\` and may return a Promise. An older request is aborted and its response ignored when a newer search replaces it; the last results stay visible while the next load.
  - Flat options and \`{ label?, items }\` groups can be mixed; an option can be \`disabled\`.

- **open** / **defaultOpen** / **onOpenChange**: The dropdown's open state, as in Combobox. \`onOpenChange(open, details)\` runs before the change; \`details.cancel()\` keeps the list as it was.

### Behavior Props

- **customTags**: \`boolean\` (default: \`false\`)
  - When \`items\` is provided, also allow Enter to add free text that is not in the option list.

- **maxTags**: \`number\` (optional)
  - Maximum number of tags. Once reached, further adds (free entry and dropdown selection) are ignored.

- **openOnFocus**: \`boolean\` (default: \`false\`)
  - Open the dropdown when the input is focused, even without typing (static arrays list every option, \`items\` functions are called with an empty search).
- **showAllOnFocus**: \`boolean\` (deprecated alias of \`openOnFocus\`, kept for one minor)

- **keepSearchOnSelect**: \`boolean\` (default: \`false\`)
  - Keep the typed text after an option is chosen, so several matches of one search can be added in a row. Free text added with Enter always clears it.

- **filter**: \`(option, searchValue) => boolean\` and **limit**: \`number\` - Custom match and a cap on the matches shown (static arrays).
- **autoHighlight**: \`boolean | 'always'\` (default: \`false\` with \`customTags\`, else \`'always'\`) - With \`customTags\`, nothing is highlighted on its own, so Enter adds what was typed ("Java") instead of the first match ("JavaScript").
- **loop**, **separators**, **item**, **onHighlightChange**: As in Combobox. \`onHighlightChange({ value, reason, event })\` reports why the highlight moved.
- **readOnly**: \`boolean\` - The dropdown opens and can be browsed, but tags cannot be added or removed. The tags render as a plain list with no remove buttons. They still submit.

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
- **onAfterOpen** / **onAfterClose**: \`() => void\` - After the dropdown's open or close transition.

- **onValidate**: \`(value: string[]) => string[] | boolean\`
  - Custom validation function.

### Theme Props

- **theme**: \`TagsInputThemeProps\`
  - Customize styling for: input, inputContainer, tag, loading, error, noOptions, group, groupLabel, separator.

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

<TagsInput items={items} openOnFocus bind:value={value} />
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
- **ArrowLeft** (**ArrowRight** in right-to-left text) at the start of the text: Moves focus to the last tag.
- **ArrowLeft / ArrowRight** on a tag: Move between tags (mirrored in right-to-left text); the arrow past the last tag returns to the input. **Home / End** jump to the first / last tag.
- **Backspace / Delete** on a focused tag: Removes it and moves focus to its neighbour (the next tag, else the previous one), or to the input when no tag remains. **Enter / Space** on its remove button removes it too.
- **ArrowDown / ArrowUp**: Open a closed dropdown (restricted mode), then move the highlight (wraps around; see \`loop\`).
- **Home / End** (dropdown open): Highlight the first / last option. Restricted mode only.
- **Escape**: Closes the dropdown and keeps focus in the input; a second Escape clears the typed text (also in free mode).

## Accessibility

- Removable tags form a \`role="toolbar"\` labelled "Tags" with a single tab stop (a roving tabindex over the remove buttons); the arrow keys move between them. Each tag chip is non-interactive; removal is a dedicated \`<button type="button">\` with an \`aria-label\` of "Remove <label>".
- When the field is disabled or read-only there are no remove buttons (no dead tab stops): the tags are a plain \`role="list"\` of \`role="listitem"\`.
- The listbox owns only options and groups; the loading, error and "no options" messages sit beside it. A persistent visually hidden live region announces result counts, the empty state, loading and errors.
- **With items** the input follows the ARIA combobox pattern: \`role="combobox"\`, \`aria-expanded\`, \`aria-controls\`, \`aria-autocomplete="list"\`, \`aria-activedescendant\`, \`aria-haspopup="listbox"\`, and the dropdown is a \`role="listbox"\` with \`role="option"\` items.
- **Without items** the input is a plain text input.
- \`autocomplete="off"\` and \`data-1p-ignore\` on the input.

## Notes

- **Deduplication invariant**: A tag can never appear twice. Duplicate adds (exact string match) simply clear the search. This is a hard requirement — duplicate keys in the keyed list crash the renderer.
- **Fresh arrays**: The value array is never mutated in place. Every add/remove assigns a new array so binding, reactivity, and form updates fire correctly.
- **Dropdown height**: The option list scrolls beyond 200px, or beyond the room left between the field and the viewport edge (the Popover's \`--available-height\`), so it shrinks above an on-screen keyboard instead of running under it
- **Animations**: Tags animate on reorder (\`animate:flip\`) and on enter/leave (\`transition:scale\`).
- **Free vs restricted mode**: Omitting \`items\` gives free-text entry. Providing \`items\` restricts entry to the option list; add \`customTags\` to permit free text alongside options.
- **Label resolution**: A tag's chip label comes from static \`items\`, then a session cache of options picked from the dropdown, then \`getValueOption\` (resolved on mount for initial values), falling back to the raw value string.
- **Dropdown filtering**: Options whose value is already selected are hidden from the dropdown.
- **Native forms**: The search box carries no \`name\`. One hidden input per tag (all under \`name\`) submits the tags: read them with \`FormData.getAll(name)\`. Nothing is submitted without a name or when the field is disabled.

## Theme Customization

The TagsInput uses a theme object customizable via the \`theme\` prop or a global theme.

### Theme Structure

- **input**: Input element styles (flex-1 with a min-width so it wraps to its own line).
- **inputContainer**: The flex-wrap container holding the tags and input.
- **tag**: The animated wrapper element around each tag chip.
- **loading**: Loading indicator styles.
- **error**: Error message styles.
- **noOptions**: No-options message styles.
- **group**, **groupLabel**, **separator**: Group container, group label and the divider between groups.

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
