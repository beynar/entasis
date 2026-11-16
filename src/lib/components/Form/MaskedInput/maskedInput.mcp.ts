export const maskedInputDescription = `
# MaskedInput

A text field that formats what is typed to a fixed pattern: plates, company numbers, IBANs, phone
numbers, postal codes. It composes Field like TextInput (label, description, prefix and suffix,
sizes, density, validation) and runs Maskito underneath, so the caret, paste, undo and redo,
autofill and Android keyboards behave natively.

## Import

\`\`\`svelte
<script lang="ts">
	import { MaskedInput } from 'entasis/masked-input';
</script>
\`\`\`

## Usage

\`\`\`svelte
<script lang="ts">
	import { MaskedInput } from 'entasis/masked-input';

	let plate = $state<string | null>(null);
</script>

<!-- value is the raw "AB123CD"; the input shows "AB-123-CD" -->
<MaskedInput label="Plate" mask="AA-###-AA" bind:value={plate} />
\`\`\`

## Mask syntax

A pattern string reads one character at a time:

- **#**: a digit.
- **A**: a letter, kept in the case typed. Use a token with \`transform: 'upper'\` to uppercase it.
- **\\***: a letter or a digit.
- **?** right after a token: the slot is optional. It is filled when the next character fits it,
  and skipped when the user types the separator that follows it.
- **+** right after a token: the slot repeats. It takes every character it accepts; typing the
  separator after it (or a character it refuses) moves on.
- **\\\\** before any character: that character is a literal, as in \`\\#\` for a hash sign
  (\`'\\\\#'\` in a JavaScript string).
- Any other character (and a \`?\` or \`+\` that follows no token) is a separator the mask writes
  itself. The user may type separators or leave them out.

\`mask\` also takes a list of patterns, and the first one the text fits is used (typing past the end
of one moves to the next), or a function that receives the characters typed so far, without
separators, and returns the pattern.

\`\`\`svelte
<script lang="ts">
	import { MaskedInput } from 'entasis/masked-input';
</script>

<MaskedInput label="SIRET" mask="### ### ### #####" />
<MaskedInput label="Phone" mask={['(###) ###-####', '+## # ## ## ## ##']} showMask="focus" />
<MaskedInput
	label="IBAN"
	mask="AA## XXXX XXXX XXXX XXXX XXXX XXX"
	tokens={{
		A: { pattern: /[A-Z]/, transform: 'upper' },
		X: { pattern: /[A-Z0-9]/, transform: 'upper' }
	}}
/>
<MaskedInput
	label="Card"
	mask={(raw) => (raw.startsWith('3') ? '#### ###### #####' : '#### #### #### ####')}
/>
\`\`\`

## Props

- **mask**: \`string | string[] | (raw: string) => string\` - the format, as above. Required.
- **tokens**: \`Record<string, { pattern: RegExp; transform?: 'upper' | 'lower' | (char) => string }>\` -
  one-character slot names added to, or replacing, \`#\`, \`A\` and \`*\`. A typed character goes
  through \`transform\` before \`pattern\` checks it.
- **placeholderChar**: \`string\` (default \`_\`) - shown in an empty slot when the mask shows.
- **showMask**: \`'always' | 'focus' | 'never'\` (default \`'never'\`) - when the empty slots show in the
  input. With \`'never'\`, and with \`'focus'\` while the input is blurred, the empty input shows the
  format (such as \`__-___-__\`) as its placeholder; \`placeholder\` replaces it.
- **valueFormat**: \`'raw' | 'masked'\` (default \`'raw'\`) - \`'raw'\` keeps only the typed characters
  (\`AB123CD\`), \`'masked'\` the text as shown (\`AB-123-CD\`). A value set from outside may be either
  form; it is read through the mask.
- **value**: \`string | null\` (bindable), **defaultValue**: initial value when \`value\` is omitted.
- **onValueChange**: \`(value) => void\` - called for each change the user makes, never for a value
  set from outside.
- **onMaskedChange**: \`({ masked, raw, complete }) => void\` - called with \`onValueChange\`, describing
  the same change.
- **inputMode**: virtual keyboard hint; defaults to \`numeric\` when every slot is \`#\`.
- **autocomplete**: autofill token passed to the input, such as \`tel-national\`.
- **placeholder**: hint shown in the empty input.
- **inputAttrs**: other native attributes for the input (\`aria-*\`, \`data-*\`, handlers).
- **disabled**: boolean - Disable the input; a disabled field skips validation and submits nothing.
- **readOnly**: boolean - The input stays focusable and is announced as read-only; typing, paste and
  agents are refused, and the value still validates and submits. A read-only Form, FormGroup or
  fieldset Field makes it read-only too.
- **required**, **name**, **form**, **messages**, **onValidate**, **size**, **density**,
  **labelPosition**, **label**, **description**, **prefix**, **suffix**: as on every Field control.

## Validation

A value that leaves a required slot empty is invalid, required or not, and shows "Enter the
complete value" from the i18n catalog in the active locale. Replace it per field with
\`messages.incomplete\`, a string or a function receiving the number of required slots. An empty,
non-required field is valid.

\`\`\`svelte
<script lang="ts">
	import { MaskedInput } from 'entasis/masked-input';
</script>

<MaskedInput
	label="Postal code"
	mask="#####"
	required
	messages={{ incomplete: (length) => 'Enter the ' + length + ' digits' }}
/>
\`\`\`

## Forms

Inside a native \`<form>\`, the value (in \`valueFormat\`) submits under \`name\` from a hidden input
beside the control, which carries \`disabled\`, \`required\` and \`form\`. In entasis Form, the entry
type is \`'masked'\`:

\`\`\`ts
import type { FormInputs } from 'entasis/form';

export const inputs = {
	siret: { type: 'masked', label: 'SIRET', mask: '### ### ### #####', required: true }
} satisfies FormInputs;
\`\`\`

With \`<Theme webmcp>\`, the Form's tool describes the format to agents, and an agent may send the
characters alone or the formatted text. A read-only or disabled field refuses it as it refuses a
person.

## State contract

- **value**: current bindable editable value, in \`valueFormat\`.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the user changes it; **onMaskedChange** describes the same change.
`;
