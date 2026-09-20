export const textAreaDescription = `
# TextArea Component

The TextArea component provides a multi-line text input field with a configurable row count, a maximum length, and validation.

## Basic Usage

\`\`\`svelte
<script>
	let message = $state('');
</script>

<TextArea label="Message" bind:value={message} />
\`\`\`

## Props

Extends all Field component props plus:

### Core Props
- **value**: string (bindable) - Textarea value
- **placeholder**: string - Placeholder text
- **rows**: number (default: 3) - Number of visible text rows

### Behavior Props
- **maxLength**: number - Maximum character count
- **textareaAttrs**: native attributes applied to the underlying textarea
- **onPressEnter**: (payload) => void - Called when Enter is pressed without Shift

The textarea is not resizable by default (\`resize-none\`); enable a resize handle through the \`input\` theme slot, e.g. \`theme={{ input: { base: 'resize-y' } }}\`.

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **error**: string - Error message
- **required**: boolean - Mark as required
- **disabled**: boolean - Disable input
- **size**: 'small' | 'normal' | 'large' - Input size

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

\`\`\`
<Field>
	<Label />
	<Description />
	<InputContainer>
		<TextArea />
	</InputContainer>
	<CharacterCount />
	<Error />
</Field>
\`\`\`

## Examples

### Basic TextArea
\`\`\`svelte
<script>
	let bio = $state('');
</script>

<TextArea 
	label="Biography"
	bind:value={bio}
	rows={4}
/>
\`\`\`

### With Placeholder
\`\`\`svelte
<TextArea 
	label="Comments"
	placeholder="Enter your comments here..."
	bind:value={comments}
/>
\`\`\`

### With Max Length
\`\`\`svelte
<TextArea 
	label="Tweet"
	bind:value={tweet}
	maxLength={280}
	description="Maximum 280 characters"
/>
\`\`\`

### Required Field
\`\`\`svelte
<TextArea 
	label="Feedback"
	bind:value={feedback}
	required
	rows={5}
/>
\`\`\`

### Disabled State
\`\`\`svelte
<TextArea 
	label="Read Only"
	value="This content cannot be edited"
	disabled
/>
\`\`\`

### Vertical Resize Handle
\`\`\`svelte
<TextArea 
	label="Notes"
	bind:value={content}
	theme={{ input: { base: 'resize-y' } }}
	rows={6}
/>
\`\`\`

### Contact Form
\`\`\`svelte
<script>
	let formData = $state({
		name: '',
		email: '',
		message: ''
	});
	
	function handleSubmit() {
		console.log('Submitted:', formData);
	}
</script>

<form onsubmit={handleSubmit}>
	<TextInput 
		label="Name"
		bind:value={formData.name}
		required
	/>
	
	<TextInput 
		type="email"
		label="Email"
		bind:value={formData.email}
		required
	/>
	
	<TextArea 
		label="Message"
		bind:value={formData.message}
		rows={6}
		required
		placeholder="How can we help you?"
	/>
	
	<Button type="submit">Send Message</Button>
</form>
\`\`\`

### Product Description
\`\`\`svelte
<TextArea 
	label="Product Description"
	bind:value={description}
	rows={8}
	maxLength={500}
	description="Provide a detailed description of your product"
/>
\`\`\`

### Code Input
\`\`\`svelte
<TextArea 
	label="CSS Styles"
	bind:value={css}
	rows={10}
	class="font-mono"
	theme={{ input: { base: 'resize' } }}
	placeholder={'.button { ... }'}
/>
\`\`\`

### Review Form
\`\`\`svelte
<script>
	let review = $state('');
	let rating = $state(5);
</script>

<div>
	<NumberInput 
		label="Rating"
		bind:value={rating}
		min={1}
		max={5}
	/>
	
	<TextArea 
		label="Review"
		bind:value={review}
		rows={6}
		maxLength={1000}
		required
		placeholder="Share your experience..."
	/>
</div>
\`\`\`

### Support Ticket
\`\`\`svelte
<TextArea 
	label="Issue Description"
	bind:value={issue}
	rows={8}
	required
	description="Please provide as much detail as possible"
	placeholder="Describe the issue you're experiencing..."
/>
\`\`\`

## Character Count

When \`maxLength\` is set, a character counter is automatically displayed:
- Shows current/max characters
- Updates in real-time
- Visual warning when approaching limit

## Validation

TextArea automatically validates:
- **required**: Non-empty value
- **maxLength**: Value doesn't exceed maximum

## Accessibility

- Proper label association
- ARIA attributes for max length
- Character count announced to screen readers
- Resize controls are keyboard accessible
- Error states properly communicated

## Notes

- Supports multi-line text input
- Character counting for length limits
- Resize handle can be enabled through the input theme slot
- Works in forms with validation
- Maintains scroll position during typing

## Theme Customization

The TextArea component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **input**: Textarea element styles
- **inputContainer**: Textarea container wrapper styles

### Available Variants

**input**:
- base: Base classes applied to the textarea element
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size
  - disabled: boolean - Disabled state styling

**inputContainer**:
- base: Base classes for the textarea container (handles focus states, borders, padding)
- Variants:
  - size: 'small' | 'normal' | 'large' - Container height and size-based styling
  - disabled: boolean - Disabled state styling

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<TextArea 
  label="Message"
  bind:value={message}
  theme={{
    inputContainer: {
      base: 'border-2 rounded-lg',
      size: {
        normal: 'h-24 px-4 py-2'
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
<TextArea 
  label="Custom TextArea"
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
  import { setTextAreaTheme } from 'entasis/text-area';
  
  setTextAreaTheme({
    inputContainer: {
      base: 'rounded-lg border-2 transition-all',
      size: {
        normal: 'h-24 px-4 py-2'
      }
    },
    input: {
      base: 'resize-y min-h-[100px]'
    }
  });
</script>
\`\`\`

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
