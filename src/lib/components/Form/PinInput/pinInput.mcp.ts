export const pinInputDescription = `
# PinInput Component

PinInput is a one-time-code input built from one real text input plus visible cells. The real input owns focus, paste, autocomplete, form submission, and keyboard behavior; the cells are a derived display.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	let code = $state('');
</script>

<PinInput label="Verification code" bind:value={code} />
\`\`\`

## Props

### Core Props
- **value**: string | null (bindable)
  - Current code value.
  - Clamped to the configured length.

- **length**: number (default: 6)
  - Number of visible cells and maximum input length.

- **pattern**: string | RegExp (default: PIN_INPUT_DIGITS_PATTERN)
  - Partial-value pattern used to accept typed and pasted values.
  - Defaults to digits only.
  - Exported constants: PIN_INPUT_DIGITS_PATTERN, PIN_INPUT_CHARS_PATTERN, PIN_INPUT_ALPHANUMERIC_PATTERN.

- **pasteTransformer**: (text: string) => string
  - Cleans pasted text before insertion.
  - Use for values like "123-456" or "123 456".
  - A cleaned paste at least \`length\` characters long replaces the whole value, wherever the caret is; a shorter one is inserted at the caret.

- **onComplete**: (value: string) => void
  - Called when the value becomes complete, whether typed, pasted, autofilled, composed, or set by the parent.
  - A paste or autofill that leaves the code complete calls it again, even when the code was already complete or unchanged, so re-pasting a code retries verification.
  - Typing over one cell of a complete code does not call it.

- **onValueChange**: (value: string) => void
  - Called when the value changes.

### Input Props
- **inputMode**: HTMLInputElement['inputMode'] (default: 'numeric')
  - Mobile keyboard hint.

- **autocomplete**: string (default: 'one-time-code')
  - Enables OTP autofill where supported.

- **mask**: boolean (default: false)
  - Renders filled cells as bullets while preserving the real input value.

### Field Props
PinInput extends the standard field props:
- **label**, **description**, **helper**, **error**, **errors**
- **name**, **required**, **disabled**, **visible**
- **size**: 'small' | 'normal' | 'large'
- **theme** for field and pin input parts

## Examples

### Digits Only
\`\`\`svelte
<PinInput
	label="Security code"
	length={6}
	bind:value={code}
	pasteTransformer={(text) => text.replace(/\\D/g, '')}
/>
\`\`\`

### Alphanumeric
\`\`\`svelte
<PinInput
	label="Invite code"
	length={8}
	inputMode="text"
	pattern={PIN_INPUT_ALPHANUMERIC_PATTERN}
/>
\`\`\`

### Masked
\`\`\`svelte
<PinInput label="Recovery code" bind:value={code} mask />
\`\`\`

## Structure

\`\`\`
<Field>
  <InputContainer>
    <div data-slot="pin-input">
      <input data-slot="pin-input-input" />
      <div data-slot="pin-input-cell">
        <span data-slot="pin-input-character" />
        <span data-slot="pin-input-caret" />
      </div>
    </div>
  </InputContainer>
</Field>
\`\`\`

## Accessibility

- The label from Field is associated with the real input through \`for/id\`.
- The visible cells are \`aria-hidden\`; assistive tech interacts with one text input.
- The real input uses \`autocomplete="one-time-code"\` by default.
- Keyboard navigation, deletion, selection, and paste operate through the native input.
- Input method (IME) composition, such as Japanese or Chinese input, is left to the input method: the cells show the in-progress text, and the text is checked and committed once when the composition ends. Full-width digits and letters (\`１２３\`) are committed as ASCII (\`123\`). While composing, the real input turns fully transparent (the \`input\` theme slot's \`composing\` variant, \`opacity-0\`), so the input method's underline or clause highlight does not cover the first cells.

## Notes

- The pattern should accept partial values, not only the final full code. Use \`^\\\\d+$\`, not \`^\\\\d{6}$\`.
- For pasted codes with spaces or hyphens, pass a \`pasteTransformer\`.
- Composed text that the pattern rejects (for example hiragana in a digits-only field) is discarded, and the previous code and selection are restored.

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
