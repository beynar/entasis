export const numberInputDescription = `
# NumberInput Component

The NumberInput component is a locale-aware numeric input: a text input that reads and shows numbers the way the user writes them (\`1 234,5\`, \`١٢٣٫٤\`, \`R$ 12,50\`), with +/- steppers, keyboard stepping, min/max validation, and a hidden input that posts the plain number to a native form.

## Basic Usage

\`\`\`svelte
<script>
	let quantity = $state(1);
</script>

<NumberInput label="Quantity" bind:value={quantity} />
\`\`\`

## Props

Extends all Field component props plus:

### Core Props
- **value**: number | null (bindable) - Input value. Only text that is a complete number is published: \`-\` or \`.\` while typing leave the value as it was, an emptied input is \`null\`.
- **min**: number - Minimum allowed value. Stepping stops there; a typed lower value is kept and reports a range error. A non-negative minimum refuses the minus sign.
- **max**: number - Maximum allowed value. Stepping stops there; a typed higher value is kept and reports a range error.
- **step**: number (default: 1) - Size of one step by the arrow keys, the +/- buttons and the wheel
- **increment**: number - Alias of step that wins when both are set
- **largeStep**: number (default: 10 x step) - Step of Shift+Arrow, PageUp and PageDown
- **smallStep**: number (default: step / 10) - Step of Alt+Arrow
- **snapOnStep**: boolean (default: false) - Snap the value to the step grid (counted from min, else 0) when stepping, before clamping: 7 with a step of 5 moves to 10. Without it a step adds or subtracts the step.
- **wheelStep**: boolean (default: false) - Step with the mouse wheel while the input is focused and hovered (vertical scroll, or horizontal with Shift). The wheel never changes the value otherwise.
- **showControls**: boolean (default: true) - Whether to render the +/- buttons
- **format**: Intl.NumberFormatOptions - Currency, percent and unit styles, fraction digits, grouping. The value is shown formatted on blur. Without a rounding option the value keeps its full precision; with one (maximumFractionDigits, maximumSignificantDigits...) the committed value is rounded the way the text is. Compact notation is not supported for entry.
- **locale**: string (default: the i18n catalog locale) - BCP 47 locale of the shown and parsed text. Digits of other numeral systems (Arabic-Indic, Persian, Devanagari, Bengali, Thai, full-width, Han) are read in any locale.
- **onValueCommit**: ({ value, reason }) => void - Called when an edit ends. reason is 'blur' (typed text committed on blur), 'keyboard' (Enter on typed text, and each arrow, Page or Home/End step), 'wheel' (each wheel step) or 'step' (release of a stepper button: one call for a whole press-and-hold). A blur without typing reports nothing.
- **inputAttrs**: native attributes of the text input (autocomplete, aria-label, aria-roledescription, inputmode, data-*, event handlers). Consumer handlers run before the built-in ones, and preventDefault cancels the built-in behaviour. The component keeps the role, value, type and form attributes.

### Display Props
- **placeholder**: string - Placeholder text

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **error**: string - Error message
- **required**: boolean - Mark as required
- **disabled**: boolean - Disable input
- **readOnly**: boolean - Focusable and announced as read-only; typing, pasting, stepping and the wheel are refused, and the value still validates and submits
- **name**: string - Posted by a hidden input as the plain number (\`1234.5\`), not the formatted text; an empty or disabled input posts nothing
- **size**: 'small' | 'normal' | 'large' - Input size

### Content Slots
- **prefix**: Snippet - Content before input (e.g., currency symbol)
- **suffix**: Snippet - Content after input (e.g., unit)

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

\`\`\`
<Field>
	<Label />
	<Description />
	<InputContainer>
		<Prefix />
		<Input type="text" role="spinbutton" inputmode="decimal" />
		<HiddenInput type="hidden" name />
		<Controls>
			<Button label="Decrease value" tabindex="-1" />
			<Button label="Increase value" tabindex="-1" />
		</Controls>
		<Suffix />
	</InputContainer>
	<Error />
</Field>
\`\`\`

## Examples

### Basic Number Input
\`\`\`svelte
<script>
	let age = $state(25);
</script>

<NumberInput label="Age" bind:value={age} />
\`\`\`

### With Min and Max
\`\`\`svelte
<NumberInput 
	label="Quantity"
	bind:value={quantity}
	min={1}
	max={100}
/>
\`\`\`

### Locale, currency and percent
\`\`\`svelte
<NumberInput label="Prix" locale="fr" format={{ style: 'currency', currency: 'EUR' }} bind:value={price} />
<NumberInput label="Discount" format={{ style: 'percent', maximumFractionDigits: 0 }} step={0.01} bind:value={discount} />
\`\`\`

\`1 234,5\` typed in a French input publishes 1234.5; a percent of \`12.7\` rounds to 13% (the value 0.13) on blur.

### Large steps and snapping
\`\`\`svelte
<NumberInput label="Seats" bind:value={seats} step={5} largeStep={50} snapOnStep min={0} />
\`\`\`

### Native form
\`\`\`svelte
<form method="POST">
	<NumberInput name="amount" locale="de" value={1234.5} />
</form>
<!-- posts amount=1234.5 -->
\`\`\`

### Custom Button Increment
\`\`\`svelte
<NumberInput 
	label="Quantity"
	bind:value={quantity}
	increment={5}
/>
\`\`\`

### With Prefix (Currency)
\`\`\`svelte
<NumberInput 
	label="Amount"
	bind:value={amount}
	min={0}
	step={0.01}
>
	{#snippet prefix()}
		<span>$</span>
	{/snippet}
</NumberInput>
\`\`\`

### With Suffix (Unit)
\`\`\`svelte
<NumberInput 
	label="Weight"
	bind:value={weight}
	min={0}
>
	{#snippet suffix()}
		<span>kg</span>
	{/snippet}
</NumberInput>
\`\`\`

### Required Field
\`\`\`svelte
<NumberInput 
	label="Number of Guests"
	bind:value={guests}
	min={1}
	required
/>
\`\`\`

### Disabled State
\`\`\`svelte
<NumberInput 
	label="Score"
	value={100}
	disabled
/>
\`\`\`

### Product Quantity Selector
\`\`\`svelte
<script>
	let quantity = $state(1);
	let price = 29.99;
	
	const total = $derived(quantity * price);
</script>

<div>
	<NumberInput 
		label="Quantity"
		bind:value={quantity}
		min={1}
		max={10}
		description={\`Total: $\${total.toFixed(2)}\`}
	/>
</div>
\`\`\`

### Age Input
\`\`\`svelte
<NumberInput 
	label="Age"
	bind:value={age}
	min={18}
	max={120}
	description="You must be 18 or older"
	required
/>
\`\`\`

### Temperature Control
\`\`\`svelte
<NumberInput 
	label="Temperature"
	bind:value={temperature}
	min={-10}
	max={40}
	step={0.5}
>
	{#snippet suffix()}
		<span>°C</span>
	{/snippet}
</NumberInput>
\`\`\`

### Percentage Input
\`\`\`svelte
<NumberInput 
	label="Discount"
	bind:value={discount}
	min={0}
	max={100}
	step={5}
>
	{#snippet suffix()}
		<span>%</span>
	{/snippet}
</NumberInput>
\`\`\`

### Rating Input
\`\`\`svelte
<NumberInput 
	label="Rating"
	bind:value={rating}
	min={1}
	max={5}
	step={0.5}
	description="Rate from 1 to 5 stars"
/>
\`\`\`

## Validation

NumberInput automatically validates:
- **min**: Value must be >= min
- **max**: Value must be <= max
- **required**: Non-null value

The range messages come from the i18n catalog with the bound formatted in the input's locale and format (\`Enter a value of 1.000 or less\`); override them with \`messages={{ rangeOverflow: (max) => ... }}\`.

## Keyboard Controls

- **Arrow Up / Arrow Down**: step by step
- **Shift + Arrow, Page Up / Page Down**: step by largeStep (default 10 x step)
- **Alt + Arrow**: step by smallStep (default step / 10)
- **Home / End**: jump to min / max when set (otherwise they move the caret)
- **Enter**: formats and commits the typed text; a surrounding Form still moves on or submits

The +/- buttons step by the same step, repeat while pressed (after 400 ms, every 60 ms), stop at the bounds and when the input becomes disabled or read-only, and keep focus in the input. They are out of the tab order (tabindex -1) and point at the input with \`aria-controls\`.

## Accessibility

- Proper label association
- The input has role spinbutton with aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext (the shown text)
- Read-only is announced with the readonly attribute and aria-readonly
- Keyboard stepping with large, small and bound keys
- The +/- buttons are labelled and activate with a keyboard click, but add no tab stops

## Notes

- The input is type text with inputmode decimal (numeric for non-negative integers), so the browser's locale never decides the separators. Characters that cannot belong to a number in the locale and format are refused, a paste is inserted at the caret, and text that is not a number yet (\`-\`) is not published.
- Intermediate text is kept as typed while focused; on blur or Enter it is rounded to the format, formatted for the locale and reported.
- Out-of-range typed values are kept and flagged, not clamped; stepping and Home/End clamp.
- The mouse wheel does nothing unless wheelStep is set.
- Can be styled with prefix/suffix for units

## Theme Customization

The NumberInput component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **input**: Input element styles
- **inputContainer**: Input container wrapper styles

### Available Variants

**input**:
- base: Base classes applied to the input element
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size
  - disabled: boolean - Disabled state styling

**inputContainer**:
- base: Base classes for the input container (handles focus states, borders, padding)
- Variants:
  - size: 'small' | 'normal' | 'large' - Container height and size-based styling
  - disabled: boolean - Disabled state styling

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<NumberInput 
  label="Quantity"
  bind:value={quantity}
  theme={{
    inputContainer: {
      base: 'border-2 rounded-lg',
      size: {
        normal: 'h-8 px-4'
      }
    },
    input: {
      size: {
        normal: 'text-base'
      }
    }
  }}
/>
\`\`\`

**Focus State Customization**:

To recolor every focus ring in the app at once, set \`designTokens.focusColor\` on \`Theme\`
instead of overriding per component. \`ring-focus\` is the focus state role and falls back to the
current role, so it never hard-pins a color.

\`\`\`svelte
<NumberInput 
  label="Custom Number"
  bind:value={value}
  theme={{
    inputContainer: {
      base: 'focus-within:ring-2 focus-within:ring-focus/50 focus-within:border-focus'
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setNumberInputTheme } from 'entasis/number-input';
  
  setNumberInputTheme({
    inputContainer: {
      base: 'rounded-lg border-2 transition-all',
      size: {
        normal: 'h-8 px-4'
      }
    },
    input: {
      base: 'text-right'
    }
  });
</script>
\`\`\`

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
