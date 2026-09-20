export const keyValueInputDescription = `
# KeyValueInput Component

An editable list of key/value string pairs. Each row renders a key text input, a value text input, and a remove button; a full-width Add button below the rows appends a new empty pair. There is no dropdown, no async, and no option list — just plain text entry.

## Basic Usage

\`\`\`svelte
<script>
	import { KeyValueInput } from 'entasis/key-value-input';
	let value = $state(null);
</script>

<KeyValueInput bind:value={value} />
\`\`\`

## Props

### Core Props

- **value**: \`KeyValuePair[] | null\` (default: \`null\`, bindable)
  - The current list of \`{ key, value }\` pairs. \`null\` is treated as an empty list.
  - The array is never mutated in place — every add/remove assigns a fresh array.
  - Replacing \`value\` updates the editor rows without emitting \`onValueChange\`. Use \`defaultValue\` to initialize an uncontrolled editor once.

### Content Props

- **keyPlaceholder**: \`string\` (optional)
  - Placeholder for the key input. Defaults to the localized "Key" label.

- **valuePlaceholder**: \`string\` (optional)
  - Placeholder for the value input. Defaults to the localized "Value" label.

- **addLabel**: \`string\` (optional)
  - Label for the Add button. Defaults to the localized "Add" label.

### Behavior Props

- **maxRows**: \`number\` (optional)
  - Maximum number of rows. Once reached, the Add button is disabled. There is no minimum.

### Field Props

- **required**: \`boolean\` (default: \`false\`)
- **disabled**: \`boolean\`
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`)
- **name**: \`string\`
- **errors**: \`string[] | boolean\` (bindable)
- **focused**: \`boolean\` (bindable)
- **description**: \`string\`

### Event Props

- **onValueChange**: \`(value: KeyValuePair[]) => void\`
  - Called when the pairs change.

- **onValidate**: \`(value: KeyValuePair[]) => string[] | boolean\`
  - Custom validation function.

### i18n / Theme Props

- **i18n**: \`Partial<Messages>\`
  - Per-instance message overrides merged over the global catalog (\`add\`, \`keyLabel\`, \`valueLabel\`, \`remove\`).

- **theme**: \`KeyValueInputThemeProps\`
  - Customize styling for: inputContainer, row, input, removeButton, addButton.

## Examples

### Empty (Start With Add)

\`\`\`svelte
<script>
	let value = $state(null);
</script>

<KeyValueInput bind:value={value} />
\`\`\`

### Pre-filled Value

\`\`\`svelte
<script>
	let value = $state([
		{ key: 'Content-Type', value: 'application/json' },
		{ key: 'Accept', value: '*/*' }
	]);
</script>

<KeyValueInput bind:value={value} />
\`\`\`

### Limited Number of Rows

\`\`\`svelte
<KeyValueInput maxRows={3} bind:value={value} />
\`\`\`

### Custom Placeholders

\`\`\`svelte
<KeyValueInput keyPlaceholder="Header" valuePlaceholder="Value" addLabel="Add header" bind:value={value} />
\`\`\`

### Object Output

The value is an array of pairs; convert it to a plain object with \`Object.fromEntries\`:

\`\`\`svelte
<script>
	let value = $state([{ key: 'a', value: '1' }]);
	const object = $derived(Object.fromEntries((value ?? []).map((p) => [p.key, p.value])));
</script>

<KeyValueInput bind:value={value} />
<pre>{JSON.stringify(object)}</pre>
\`\`\`

## Keyboard Interactions

- **Enter** (in a non-empty value input): Prevents the enclosing form from submitting, appends a new empty row, and focuses its key input.
- **Enter** (in a key or empty value input): Prevents the enclosing form from submitting without adding a row.
- **Arrow Right** (at the end of an input): Moves to the next input and places the caret at its start.
- **Arrow Left** (at the start of an input): Moves to the previous input and places the caret at its end.
- **Arrow Up / Arrow Down**: Moves to the same field in the previous or next row while preserving the caret offset when possible.
- **Backspace** (in an empty input): Moves to the previous input. When the entire row is empty, removes the row and focuses the previous row's value input when available.

## Accessibility

- The rows collection is a real list (\`role="list"\` / \`role="listitem"\`), not a listbox.
- Each row's remove control is a real \`<button type="button">\` with an \`aria-label\` of "Remove <key>" (falling back to the "Key" label when the key is empty).
- The Add button is a real \`<button type="button">\`.
- Inputs use \`autocomplete="off"\` and \`data-1p-ignore\`.

## Notes

- **Stable-id keying**: Rows are keyed by a stable per-instance uid, not by the key string. Keys can be empty or duplicated while typing, and duplicate/empty keys in a keyed \`{#each}\` would crash the renderer.
- **Controlled values**: Parent value replacements update the editor. User edits publish one change callback; unchanged pairs do not publish another callback.
- **Fresh arrays**: Add and remove always assign a new array so binding, reactivity, and form updates fire correctly.
- **Animations**: Rows animate on reorder (\`animate:flip\`) and on enter/leave (\`transition:scale\`).
- **maxRows**: Disables the Add button once the row count reaches \`maxRows\`.
- **Object output**: Use \`Object.fromEntries((value ?? []).map((p) => [p.key, p.value]))\` to get a plain object.

## Theme Customization

The KeyValueInput uses a theme object customizable via the \`theme\` prop or a global theme.

### Theme Structure

- **inputContainer**: The vertical stack holding the rows and Add button (no border/background of its own).
- **row**: The animated flex wrapper around each key/value/remove trio.
- **input**: The bordered key and value text inputs.
- **removeButton**: The square remove (X) button.
- **addButton**: The full-width Add button.

### Global Theme Setting

\`\`\`svelte
<script>
	import { setKeyValueInputTheme } from 'entasis/key-value-input';

	setKeyValueInputTheme({
		addButton: {
			base: 'rounded-lg border-2'
		}
	});
</script>
\`\`\`

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
