export const passwordInputDescription = `
# PasswordInput Component

The PasswordInput component is a specialized text input for password entry with visibility toggle functionality.

## Basic Usage

\`\`\`svelte
<script>
	let password = $state('');
</script>

<PasswordInput label="Password" bind:value={password} />
\`\`\`

## Props

Extends all TextInput component props:

### Core Props
- **value**: string (bindable) - Password value
- **placeholder**: string - Placeholder text
- **autocomplete**: 'current-password' | 'new-password' | 'off' - Rendered as the input's \`autocomplete\` so browsers and password managers know what the field holds. Use \`current-password\` on sign-in forms and \`new-password\` on sign-up and change-password forms. Omitted, the attribute is left off
- **minLength**: number - Fewest characters a non-empty value accepts during validation. Defaults to 6, or to no minimum when \`autocomplete\` is \`current-password\`; an explicit value always applies and \`0\` drops the rule. The message comes from the i18n catalog (\`passwordTooShort\`)
- **inputAttrs**: native attributes for the underlying \`<input>\` (\`aria-*\`, \`data-*\`, \`maxlength\`, event handlers). \`autocomplete\`, \`type\`, \`value\`, \`id\`, \`name\`, \`placeholder\`, \`required\`, \`disabled\` and \`class\` stay owned by the component

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **error**: string - Error message
- **required**: boolean - Mark as required
- **disabled**: boolean - Disable input
- **readOnly**: boolean - Make the input read-only: stays focusable and announced as read-only, refuses edits, and still validates and submits. A read-only Form, FormGroup or fieldset Field makes it read-only too
- **size**: 'small' | 'normal' | 'large'

### Content Slots
- **prefix**: Snippet - Content before input (e.g., lock icon)

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
		<Input type="password" />
		<VisibilityToggle />
	</InputContainer>
	<Error />
</Field>
\`\`\`

## Examples

### Basic Password Input
\`\`\`svelte
<script>
	let password = $state('');
</script>

<PasswordInput label="Password" bind:value={password} />
\`\`\`

### Required Password
\`\`\`svelte
<PasswordInput 
	label="Password"
	bind:value={password}
	required
/>
\`\`\`

### With Placeholder
\`\`\`svelte
<PasswordInput 
	label="Password"
	placeholder="Enter your password"
	bind:value={password}
/>
\`\`\`

### With Description
\`\`\`svelte
<PasswordInput 
	label="New Password"
	description="Must be at least 8 characters"
	bind:value={password}
/>
\`\`\`

### With Prefix Icon
\`\`\`svelte
<script lang="ts">
	import { lockIcon } from 'entasis/icons/lock';

	let password = $state('');
</script>

<PasswordInput label="Password" bind:value={password}>
	{#snippet prefix()}
		{@render lockIcon()}
	{/snippet}
</PasswordInput>
\`\`\`

### With Validation
\`\`\`svelte
<script>
	let password = $state('');
	let error = $derived(
		password && password.length < 8 
			? 'Password must be at least 8 characters'
			: ''
	);
</script>

<PasswordInput 
	label="Password"
	bind:value={password}
	error={error}
/>
\`\`\`

### Login Form
\`\`\`svelte
<script>
	let email = $state('');
	let password = $state('');
	
	function handleLogin() {
		// Login logic
	}
</script>

<form onsubmit={handleLogin}>
	<TextInput 
		type="email"
		label="Email"
		inputAttrs={{ autocomplete: 'username' }}
		bind:value={email}
		required
	/>
	
	<PasswordInput 
		label="Password"
		autocomplete="current-password"
		bind:value={password}
		required
	/>
	
	<Button type="submit" fullWidth>Login</Button>
</form>
\`\`\`

### Password Strength Indicator
\`\`\`svelte
<script>
	let password = $state('');
	
	function getPasswordStrength(pwd) {
		if (!pwd) return { label: '', strength: 0 };
		if (pwd.length < 6) return { label: 'Weak', strength: 1 };
		if (pwd.length < 10) return { label: 'Medium', strength: 2 };
		return { label: 'Strong', strength: 3 };
	}
	
	let strength = $derived(getPasswordStrength(password));
</script>

<PasswordInput 
	label="Password"
	bind:value={password}
	description="Strength: {strength.label}"
/>

<Meter 
	value={strength.strength * 33.33}
	max={100}
/>
\`\`\`

### Change Password Form
\`\`\`svelte
<script>
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	
	let passwordMismatch = $derived(
		newPassword && confirmPassword && newPassword !== confirmPassword
	);
</script>

<form>
	<PasswordInput 
		label="Current Password"
		autocomplete="current-password"
		bind:value={currentPassword}
		required
	/>
	
	<PasswordInput 
		label="New Password"
		autocomplete="new-password"
		minLength={8}
		bind:value={newPassword}
		description="Must be at least 8 characters"
		required
	/>
	
	<PasswordInput 
		label="Confirm Password"
		autocomplete="new-password"
		bind:value={confirmPassword}
		error={passwordMismatch ? 'Passwords do not match' : ''}
		required
	/>
	
	<Button type="submit">Update Password</Button>
</form>
\`\`\`

### Sign Up Form
\`\`\`svelte
<script>
	let formData = $state({
		username: '',
		email: '',
		password: '',
		confirmPassword: ''
	});
	
	function validatePassword() {
		if (formData.password.length < 8) {
			return 'Password must be at least 8 characters';
		}
		if (!/[A-Z]/.test(formData.password)) {
			return 'Password must contain an uppercase letter';
		}
		if (!/[0-9]/.test(formData.password)) {
			return 'Password must contain a number';
		}
		return '';
	}
	
	let passwordError = $derived(validatePassword());
</script>

<form>
	<TextInput 
		label="Username"
		bind:value={formData.username}
		required
	/>
	
	<TextInput 
		type="email"
		label="Email"
		bind:value={formData.email}
		required
	/>
	
	<PasswordInput 
		label="Password"
		bind:value={formData.password}
		error={passwordError}
		required
	/>
	
	<PasswordInput 
		label="Confirm Password"
		bind:value={formData.confirmPassword}
		error={formData.password !== formData.confirmPassword ? 'Passwords must match' : ''}
		required
	/>
	
	<Button type="submit" disabled={!!passwordError}>
		Create Account
	</Button>
</form>
\`\`\`

## Visibility Toggle

The visibility toggle button:
- Shows an eye icon when password is hidden
- Shows an eye-off icon when password is visible
- Toggles between \`type="password"\` and \`type="text"\`
- Is always rendered; there is no prop to hide it

## Validation

PasswordInput supports:
- **required**: Non-empty password
- **minLength**: at least 6 characters by default, none for \`autocomplete="current-password"\`; a short value reports only the length message
- Custom validation via \`onValidate\`, which runs after the length rule passes
- Pattern matching for complexity requirements

## Password managers

PasswordInput does not opt out of password managers. Set \`autocomplete\` so they offer a saved
password (\`current-password\`) or suggest a new one (\`new-password\`). To keep a specific manager
away from a field that is not a real credential, pass its opt-out attribute through \`inputAttrs\`,
for example \`inputAttrs={{ 'data-1p-ignore': true }}\` for 1Password.

## Security Best Practices

- Never show password in plain text by default
- Always use HTTPS in production
- Consider password strength requirements
- Don't limit password length unnecessarily
- Support password managers with the \`autocomplete\` prop (\`current-password\` or \`new-password\`)

## Accessibility

- Proper label association
- ARIA attributes for show/hide button
- Password visibility state announced
- Keyboard accessible toggle
- Error messages announced to screen readers

## Notes

- Extends TextInput with password-specific features
- Visibility toggle is accessible via keyboard
- Type switches between "password" and "text"
- Works with browser password managers
- All TextInput features are available

## Theme Customization

The PasswordInput component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme. It shares the same theme structure as TextInput.

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
<PasswordInput 
  label="Password"
  bind:value={password}
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
<PasswordInput 
  label="Secure Password"
  bind:value={password}
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
  import { setPasswordInputTheme } from 'entasis/password-input';
  
  setPasswordInputTheme({
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
