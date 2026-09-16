export const numberInputDescription = `
# NumberInput Component

The NumberInput component is a numeric input field with +/- controls, min/max validation, and formatting options.

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
- **value**: number (bindable) - Input value
- **min**: number - Minimum allowed value
- **max**: number - Maximum allowed value
- **step**: number - Native number input step for keyboard and browser interactions
- **increment**: number (default: step ?? 1) - Amount changed by the +/- buttons
- **showControls**: boolean (default: true) - Whether to render the +/- buttons

### Display Props
- **placeholder**: string - Placeholder text

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **error**: string - Error message
- **required**: boolean - Mark as required
- **disabled**: boolean - Disable input
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
		<Input type="number" />
		<Controls>
			<Button label="Decrease value" />
			<Button label="Increase value" />
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

### With Step and Button Increment
\`\`\`svelte
<NumberInput 
	label="Price"
	bind:value={price}
	step={0.01}
	increment={1}
	min={0}
/>
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
- **step**: Value must align with step increments
- **required**: Non-null value

## Keyboard Controls

- **Arrow Up**: Increment by step
- **Arrow Down**: Decrement by step
- **Page Up**: Increment by step * 10
- **Page Down**: Decrement by step * 10

## Accessibility

- Proper label association
- ARIA attributes for min, max, and current value
- Keyboard navigation support
- Screen reader announcements for value changes
- Control buttons are focusable and keyboard accessible

## Notes

- Native HTML number input for best compatibility
- +/- controls provide visual increment/decrement
- Automatically respects min/max bounds
- Supports decimal values with step
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
  import { setNumberInputTheme } from 'svelai/number-input';
  
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
