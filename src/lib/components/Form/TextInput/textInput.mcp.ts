export const textInputDescription = `
# TextInput Component

The TextInput component is a versatile text input field with support for different input types (text, email, URL), validation, and consistent styling.

## Basic Usage

\`\`\`svelte
<TextInput label="Name" bind:value={name} />
\`\`\`

## Props

Extends all Field component props plus:

### Core Props
- **type**: 'text' | 'email' | 'url' (default: 'text')
- **value**: string (bindable) - Input value
- **placeholder**: string - Placeholder text

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text below input
- **error**: string - Error message
- **required**: boolean - Mark field as required
- **disabled**: boolean - Disable input
- **size**: 'small' | 'normal' | 'large' - Input size

### Content Slots
- **prefix**: Snippet - Content before input (icons, text)
- **suffix**: Snippet - Content after input (icons, buttons)

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
		<Input />
		<Suffix />
	</InputContainer>
	<Error />
</Field>
\`\`\`

## Examples

### Basic Text Input
\`\`\`svelte
<script>
	let name = $state('');
</script>

<TextInput label="Name" bind:value={name} />
\`\`\`

### Email Input
\`\`\`svelte
<TextInput 
	type="email"
	label="Email"
	placeholder="you@example.com"
	bind:value={email}
	required
/>
\`\`\`

### URL Input
\`\`\`svelte
<TextInput 
	type="url"
	label="Website"
	placeholder="https://example.com"
	bind:value={website}
/>
\`\`\`

### With Placeholder
\`\`\`svelte
<TextInput 
	label="Username"
	placeholder="Enter your username"
	bind:value={username}
/>
\`\`\`

### With Description
\`\`\`svelte
<TextInput 
	label="Display Name"
	description="This is how others will see you"
	bind:value={displayName}
/>
\`\`\`

### Required Field
\`\`\`svelte
<TextInput 
	label="Full Name"
	required
	bind:value={fullName}
/>
\`\`\`

### With Prefix Icon
\`\`\`svelte
<script lang="ts">
	import { magnifyingGlassIcon } from 'entasis/icons/magnifyingGlass';

	let search = $state('');
</script>

<TextInput label="Search" bind:value={search}>
	{#snippet prefix()}
		{@render magnifyingGlassIcon()}
	{/snippet}
</TextInput>
\`\`\`

### With Suffix Button
\`\`\`svelte
<script lang="ts">
	import { copyIcon } from 'entasis/icons/copy';

	let apiKey = $state('');
	const copyToClipboard = () => navigator.clipboard.writeText(apiKey);
</script>

<TextInput label="API Key" bind:value={apiKey}>
	{#snippet suffix()}
		<Button size="small" squared onclick={copyToClipboard}>
			{@render copyIcon()}
		</Button>
	{/snippet}
</TextInput>
\`\`\`

### With Both Prefix and Suffix
\`\`\`svelte
<script lang="ts">
	import { arrowSquareOutIcon } from 'entasis/icons/arrowSquareOut';

	let url = $state('');
</script>

<TextInput label="Website" bind:value={url}>
	{#snippet prefix()}
		<span class="text-muted">https://</span>
	{/snippet}
	{#snippet suffix()}
		{@render arrowSquareOutIcon()}
	{/snippet}
</TextInput>
\`\`\`

### Disabled State
\`\`\`svelte
<TextInput 
	label="Disabled"
	value="Cannot edit"
	disabled
/>
\`\`\`

### With Error
\`\`\`svelte
<TextInput 
	label="Username"
	bind:value={username}
	error={usernameError}
/>
\`\`\`

### Different Sizes
\`\`\`svelte
<TextInput size="small" label="Small" bind:value={val1} />
<TextInput size="normal" label="Normal" bind:value={val2} />
<TextInput size="large" label="Large" bind:value={val3} />
\`\`\`

### Login Form
\`\`\`svelte
<script lang="ts">
	import { envelopeIcon } from 'entasis/icons/envelope';
	import { lockIcon } from 'entasis/icons/lock';

	let email = $state('');
	let password = $state('');
</script>

<form>
	<TextInput 
		type="email"
		label="Email"
		placeholder="your@email.com"
		bind:value={email}
		required
	>
		{#snippet prefix()}
			{@render envelopeIcon()}
		{/snippet}
	</TextInput>
	
	<PasswordInput 
		label="Password"
		bind:value={password}
		required
	>
		{#snippet prefix()}
			{@render lockIcon()}
		{/snippet}
	</PasswordInput>
	
	<Button type="submit" fullWidth>Login</Button>
</form>
\`\`\`

## Validation

TextInput automatically validates:
- **email**: Valid email format
- **url**: Valid URL format
- **required**: Non-empty value

Custom validation can be added through the Field component.

## Accessibility

- Proper label association with input
- ARIA attributes for required fields
- Error messages announced to screen readers
- Focus states clearly visible
- Keyboard accessible

## Notes

- Extends the Field component for consistent behavior
- Prefix/suffix slots are ideal for icons and actions
- Input container handles focus states
- Validation runs on blur and submit
- Type determines browser validation behavior

## Theme Customization

The TextInput component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

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
  - size: 'small' | 'normal' | 'large' - Size-based styling
  - disabled: boolean - Disabled state styling

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<TextInput 
  label="Custom Input"
  bind:value={value}
  theme={{
    inputContainer: {
      base: 'border-2 rounded-lg',
      size: {
        normal: 'px-4 py-2'
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
<TextInput 
  label="Styled Input"
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
  import { setTextInputTheme } from 'entasis/text-input';
  
  setTextInputTheme({
    inputContainer: {
      base: 'rounded-lg border-2 transition-all',
      size: {
        normal: 'px-4 py-2'
      }
    },
    input: {
      base: 'placeholder:text-gray-400'
    }
  });
</script>
\`\`\`

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
