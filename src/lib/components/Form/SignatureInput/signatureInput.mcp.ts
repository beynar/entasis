export const signatureInputDescription = `
# SignatureInput Component

SignatureInput is a form field where a person signs with a mouse, a finger or a pen. Its value is the signature as an image: a data URL cropped to the ink (PNG by default, or SVG), ready to store, submit or place in a document.

## Basic usage

\`\`\`svelte
<script lang="ts">
  import { SignatureInput } from 'entasis/signature-input';

  let signature = $state<string | null>(null);
</script>

<SignatureInput label="Signature" required bind:value={signature} />
\`\`\`

In a Form or \`ask()\`, use \`type: 'signature'\`:

\`\`\`ts
import { ask } from 'entasis/ask';

const result = await ask({
  title: 'Sign the mandate',
  inputs: { signature: { type: 'signature', label: 'Signature', required: true } },
  confirm: 'Sign',
  cancel: 'Cancel'
});
\`\`\`

## Props

Extends the shared Field props (\`label\`, \`description\`, \`helper\`, \`required\`, \`disabled\`, \`readOnly\`, \`name\`, \`size\`, \`density\`, \`labelPosition\`, \`messages\`, \`onValidate\`, \`errors\`, \`focused\`, \`visible\`) plus:

- **value**: \`string | null\` (bindable) — the signature as a data URL, or \`null\` while the pad is empty.
- **defaultValue**: \`string | null\` — initial value when \`value\` is omitted. Any image data URL works: a saved signature shows in the pad, scaled to fit.
- **onValueChange**: \`(value: string | null) => void\` — called once per finished stroke, undo and clear.
- **format**: \`'png' | 'svg'\` (default \`'png'\`) — the image the value holds. A PNG is drawn at twice the pad's resolution; an SVG keeps every stroke as a vector path.
- **inkColor**: \`string\` (default \`'#000000'\`) — CSS color of the ink in the exported image, so a signature reads on a white document whatever the app's theme. The pad itself draws in the theme's text color.
- **strokeWidth**: \`number\` (default \`2.5\`) — line width in CSS pixels at a medium pen pressure. A pen's pressure makes the line thinner or thicker (half to one and a half times); a mouse or a finger draws at this width.
- **placeholder**: \`string\` — hint on the signing line while the pad is empty. Defaults to the i18n \`signatureInputPlaceholder\` ("Sign here").
- **clearLabel**, **undoLabel**: \`string\` — accessible labels and tooltips of the two buttons.
- **i18n**: \`Partial<Messages>\` — per-instance translations.
- **size**: \`'small' | 'normal' | 'large'\` — pad height (112, 144 or 176 px) and placeholder text size. Override the height with the \`pad\` theme part.
- **theme**: \`SignatureInputThemeProps\` and Field theme parts.

## Behaviour

- Each stroke runs from pointer down to pointer up and is smoothed through its samples. The value updates when a stroke ends, not while it is drawn.
- The undo button (or Ctrl/Cmd+Z on the pad) removes the last stroke; the clear button (or Delete/Backspace on the pad) empties the pad and sets the value to \`null\`. Both show only while the pad is editable and has a signature.
- A value set from outside (a saved signature, a Form reset) replaces the strokes and shows as an image. Drawing over it starts a new signature: the image is replaced, not added to. Undo only steps back through strokes drawn since.
- \`disabled\` and \`readOnly\` stop drawing and hide the buttons; a read-only pad still shows, focuses, validates and submits its value. A stroke in progress is dropped when the pad becomes disabled or read-only.
- Required: an empty pad (\`null\` or \`''\`) fails \`required\`.
- Native forms: a hidden input (\`FieldHiddenInputs\`) submits the data URL under \`name\`.

## Accessibility

- The pad is the field's control: it is focusable, labelled by the field label (or "Signature" without one), and has \`role="img"\` with a description of its state ("No signature yet…" or "Signed."). Errors and descriptions are linked by Field.
- Drawing is a path-based gesture with no keyboard equivalent: signing by hand is the purpose of the field. Keyboard users can clear and undo with the buttons and keys above. When a keyboard-only path to consent is needed, pair the pad with another field (a typed full name, a consent checkbox).
- The ink, placeholder and image are decorative (\`aria-hidden\`, empty \`alt\`).

## Styling hooks

- \`data-slot\`: \`signature-frame\`, \`signature-pad\`, \`signature-ink\`, \`signature-image\`, \`signature-placeholder\`, \`signature-actions\`.
- On the pad: \`data-filled="true"\` while it holds a signature, \`data-drawing="true"\` during a stroke.

## Theme parts

\`frame\` (the pad and its buttons), \`pad\` (variants \`size\`, \`interactive\`, \`disabled\`, \`hasError\`), \`ink\` (the SVG of strokes), \`image\` (a value set from outside), \`placeholder\` (the signing line and hint), \`actions\` (the undo and clear buttons).

## Exports

\`SignatureInput\`, \`SignatureInputProps\`, \`SignatureFormat\`, \`SignaturePoint\`, \`SignatureStroke\`, \`signatureInputTheme\`, \`setSignatureInputTheme\`, \`useSignatureInputTheme\`, \`SignatureInputTheme\`, \`SignatureInputThemeProps\`.
`;
