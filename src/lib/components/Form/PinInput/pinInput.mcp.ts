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
  - Partial-value pattern the code must match after normalization.
  - Defaults to digits only.
  - Text that fails it is refused whole (nothing changes) and reported to onRejectInput.
  - Exported constants: PIN_INPUT_DIGITS_PATTERN, PIN_INPUT_CHARS_PATTERN, PIN_INPUT_ALPHANUMERIC_PATTERN.

- **normalizeValue**: (text: string) => string
  - Last step of the one normalization every typed, pasted, autofilled, composed and controlled code goes through. Before it: format controls and whitespace are removed, full-width characters and digits of other numeral systems (Arabic-Indic, Persian, Devanagari, Bengali, Thai, Han) become ASCII, and separators (dashes, dots, slashes, commas, colons) are removed unless the pattern accepts them. After it: the pattern check and the clamp to length.
  - So "123-456", "123 456" and "٤٥٦" fill the default digits code with no setup, and \`normalizeValue={(text) => text.toUpperCase()}\` accepts lowercase typing in an alphanumeric code.
  - Keep it idempotent: running it on its own output should change nothing.

- **onRejectInput**: ({ text, source }) => void
  - Called when the pattern refuses text; text is as it arrived and source is 'paste' or 'input' (typed or autofilled).

- **pasteTransformer**: (text: string) => string
  - A paste-only first step that runs before the shared normalization, for site-specific cleanup such as removing a prefix.
  - A cleaned paste at least \`length\` characters long replaces the whole value, wherever the caret is; a shorter one is inserted at the caret.

- **onComplete**: (value: string) => void
  - Called when the value becomes complete, whether typed, pasted, autofilled, composed, or set by the parent.
  - A paste or autofill that leaves the code complete calls it again, even when the code was already complete or unchanged, so re-pasting a code retries verification.
  - Typing over one cell of a complete code does not call it.

- **onValueChange**: (value: string) => void
  - Called when the value changes.

- **submitOnComplete**: boolean (default: false)
  - Submits the owning form when the user types, pastes or autofills a complete code: through the surrounding Form (which validates first and focuses an earlier invalid field, so the code input does not take focus back), else the native form with requestSubmit(). A code set by the parent, a read-only input and a disabled input never submit.

- **groups**: number[]
  - Splits the cells into groups with a decorative separator between them: [3, 3] shows 123-456. Sizes that overshoot the length are ignored. The separator is aria-hidden and styled with the \`separator\` theme part.

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
- **readOnly**: the code is focusable and announced as read-only; typing, paste, autofill and submitOnComplete are ignored, and the value still validates and submits
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
      <div data-slot="pin-input-separator" aria-hidden="true" /> <!-- with groups -->
    </div>
  </InputContainer>
</Field>
\`\`\`

## Accessibility

- The label from Field is associated with the real input through \`for/id\`.
- The visible cells are \`aria-hidden\`; assistive tech interacts with one text input.
- The real input uses \`autocomplete="one-time-code"\` by default.
- Without a label the input is named by the localized "One-time code" catalog message (\`oneTimeCode\`).
- The cells and the input are \`dir="ltr"\` in every document direction, so a code reads 123456 in right-to-left pages too and the caret agrees with the cells.
- The component works inside a shadow root: focus and selection are read from the input's own root node.
- Keyboard navigation, deletion, selection, and paste operate through the native input.
- Input method (IME) composition, such as Japanese or Chinese input, is left to the input method: the cells show the in-progress text, and the text is checked and committed once when the composition ends. Full-width digits and letters (\`１２３\`) are committed as ASCII (\`123\`). While composing, the real input turns fully transparent (the \`input\` theme slot's \`composing\` variant, \`opacity-0\`), so the input method's underline or clause highlight does not cover the first cells.

## Notes

- The pattern should accept partial values, not only the final full code. Use \`^\\\\d+$\`, not \`^\\\\d{6}$\`.
- Spaces, hyphens and other grouping separators in typed, pasted or autofilled codes are removed by the built-in normalization. Pass a \`pasteTransformer\` only for cleanup specific to your codes.
- Composed text that the pattern rejects (for example hiragana in a digits-only field) is discarded, and the previous code and selection are restored.

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
