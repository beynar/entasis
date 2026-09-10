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
- **showToggle**: boolean (default: true) - Show visibility toggle button

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **error**: string - Error message
- **required**: boolean - Mark as required
- **disabled**: boolean - Disable input
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

### Without Visibility Toggle
\`\`\`svelte
<PasswordInput 
	label="Password"
	bind:value={password}
	showToggle={false}
/>
\`\`\`

### With Prefix Icon
\`\`\`svelte
<PasswordInput label="Password" bind:value={password}>
	{#snippet prefix()}
		<Icon name="lock" />
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
		bind:value={email}
		required
	/>
	
	<PasswordInput 
		label="Password"
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
	value={{ value: strength.strength * 33.33 }}
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
		bind:value={currentPassword}
		required
	/>
	
	<PasswordInput 
		label="New Password"
		bind:value={newPassword}
		description="Must be at least 8 characters"
		required
	/>
	
	<PasswordInput 
		label="Confirm Password"
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
- Can be disabled with \`showToggle={false}\`

## Validation

PasswordInput supports:
- **required**: Non-empty password
- Custom validation via error prop
- Pattern matching for complexity requirements

## Security Best Practices

- Never show password in plain text by default
- Always use HTTPS in production
- Consider password strength requirements
- Don't limit password length unnecessarily
- Support password managers (autocomplete="current-password" or "new-password")

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
\`\`\`svelte
<PasswordInput 
  label="Secure Password"
  bind:value={password}
  theme={{
    inputContainer: {
      base: 'focus-within:ring-2 focus-within:ring-primary focus-within:border-primary'
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setPasswordInputTheme } from 'svelai/password-input';
  
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
