export const switchDescription = `
# Switch Component

The Switch component is a toggle control for boolean settings, providing a visual on/off state with smooth animations.

## Basic Usage

\`\`\`svelte
<script>
	let enabled = $state(false);
</script>

<Switch label="Enable notifications" bind:value={enabled} />
\`\`\`

## Props

Extends all Field component props plus:

### Core Props
- **value**: boolean | null (bindable) - Toggle state (bind with \`bind:value\`)
- **defaultValue**: boolean | null (default: null) - Initial value when value is omitted
- **inputValue**: string (default: 'true') - Value a native \`<form>\` submits under \`name\` while the switch is on; an off switch, or one without a \`name\`, submits nothing
- **inputAttrs**: FieldButtonAttributes - Native attributes for the switch control, such as \`aria-label\`, \`title\`, \`data-*\` and event handlers. An \`aria-label\` names the switch instead of its label; a handler that calls \`preventDefault()\` cancels the toggle

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **error**: string - Error message
- **required**: boolean - The switch must be on to be valid (like Checkbox); off, it shows the catalog message asking to turn it on (override with \`messages.required\`)
- **disabled**: boolean - Disable toggle
- **readOnly**: boolean - Keeps the switch focusable with \`aria-readonly\` while clicks and keys change nothing; the value still validates and submits
- **size**: 'small' | 'normal' | 'large' - Switch size

### Event Props
- **onValueChange**: (value: boolean) => void - Called when toggled

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

\`\`\`
<Field>
	<InputContainer>
		<SwitchToggle>
			<SwitchThumb />
		</SwitchToggle>
		<Label />
	</InputContainer>
	<Description />
	<Error />
</Field>
\`\`\`

## Examples

### Basic Switch
\`\`\`svelte
<script>
	let notifications = $state(false);
</script>

<Switch 
	label="Enable Notifications"
	bind:value={notifications}
/>
\`\`\`

### With Description
\`\`\`svelte
<Switch 
	label="Auto-save"
	description="Automatically save your work every 5 minutes"
	bind:value={autoSave}
/>
\`\`\`

### Required Switch
A required switch is valid only while it is on, so it fits consent and terms acceptance.
\`\`\`svelte
<Switch 
	label="I agree to the terms and conditions"
	bind:value={agreedToTerms}
	required
/>
\`\`\`

### Native Form Submission
Inside a plain \`<form>\` (for example a SvelteKit form action), the switch submits its \`name\` with
\`inputValue\` while it is on and nothing while it is off, like a native checkbox. A switch without a
\`name\` submits nothing. A required switch that is off blocks the submit; when it is the first invalid
control, the browser's report lands on the switch, which takes focus and shows its error. A silent
\`checkValidity()\` changes nothing.
\`\`\`svelte
<form method="POST">
	<Switch name="marketing" inputValue="yes" label="Marketing emails" />
	<Switch name="terms" label="Accept the terms" required />
	<button type="submit">Save</button>
</form>
\`\`\`

### Disabled Switch
\`\`\`svelte
<Switch 
	label="Premium Feature"
	value={false}
	disabled
	description="Upgrade to unlock this feature"
/>
\`\`\`

### Different Sizes
\`\`\`svelte
<Switch size="small" label="Small Switch" bind:value={val1} />
<Switch size="normal" label="Normal Switch" bind:value={val2} />
<Switch size="large" label="Large Switch" bind:value={val3} />
\`\`\`

### With Change Handler
\`\`\`svelte
<script>
	function handleToggle(checked) {
		console.log('Switch toggled:', checked);
		// Save to API, etc.
	}
</script>

<Switch 
	label="Dark Mode"
	bind:value={darkMode}
	onValueChange={handleToggle}
/>
\`\`\`

### Settings Panel
\`\`\`svelte
<script>
	let settings = $state({
		notifications: true,
		emailUpdates: false,
		autoPlay: false,
		showPreview: true
	});
</script>

<div class="space-y-4">
	<Switch 
		label="Push Notifications"
		description="Receive notifications on your device"
		bind:value={settings.notifications}
	/>
	
	<Switch 
		label="Email Updates"
		description="Get weekly email summaries"
		bind:value={settings.emailUpdates}
	/>
	
	<Switch 
		label="Auto-play Videos"
		description="Videos start playing automatically"
		bind:value={settings.autoPlay}
	/>
	
	<Switch 
		label="Show Preview"
		description="Display content previews"
		bind:value={settings.showPreview}
	/>
</div>
\`\`\`

### Privacy Settings
\`\`\`svelte
<form>
	<Heading size="h3">Privacy Settings</Heading>
	
	<Switch 
		label="Profile Visibility"
		description="Make your profile visible to other users"
		bind:value={privacy.profileVisible}
	/>
	
	<Switch 
		label="Show Email"
		description="Display your email on your profile"
		bind:value={privacy.showEmail}
		disabled={!privacy.profileVisible}
	/>
	
	<Switch 
		label="Activity Status"
		description="Show when you're online"
		bind:value={privacy.showActivity}
	/>
	
	<Button type="submit">Save Settings</Button>
</form>
\`\`\`

### Feature Toggles
\`\`\`svelte
<script>
	let features = $state({
		experimental: false,
		beta: false,
		analytics: true
	});
	
	$effect(() => {
		if (features.experimental) {
			console.log('Experimental features enabled');
		}
	});
</script>

<div class="panel">
	<Heading size="h4">Feature Flags</Heading>
	
	<Switch 
		label="Experimental Features"
		description="⚠️ Use at your own risk"
		bind:value={features.experimental}
	/>
	
	<Switch 
		label="Beta Features"
		description="Try new features before they're released"
		bind:value={features.beta}
	/>
	
	<Switch 
		label="Analytics"
		description="Help us improve by sharing usage data"
		bind:value={features.analytics}
	/>
</div>
\`\`\`

### Conditional Content
\`\`\`svelte
<script>
	let advancedMode = $state(false);
</script>

<Switch 
	label="Advanced Mode"
	description="Show advanced options"
	bind:value={advancedMode}
/>

{#if advancedMode}
	<div class="advanced-options">
		<!-- Advanced settings here -->
	</div>
{/if}
\`\`\`

### Form Integration
\`\`\`svelte
<Form 
	inputs={{
		name: { type: 'text', label: 'Name', required: true },
		notifications: { 
			type: 'switch', 
			label: 'Enable Notifications',
			description: 'Receive important updates'
		},
		marketing: { 
			type: 'switch', 
			label: 'Marketing Emails'
		}
	}}
	onSubmit={handleSubmit}
/>
\`\`\`

## Validation

Switch validates:
- **required**: Must be on (useful for terms acceptance); an off switch fails Form validation and native form submission

## Accessibility

- Proper ARIA roles and attributes; a required switch carries \`aria-required\` and a required marker on its label
- Keyboard accessible (Space/Enter to toggle)
- Focus states clearly visible
- Label clickable to toggle
- State changes announced to screen readers
- Disabled state communicated properly

## Notes

- Smooth animated transitions between states
- Visual feedback on hover and focus
- Works standalone or within forms
- Thumb slides with smooth animation
- Toggle background changes color based on state
- Supports all Field component features

## Theme Customization

The Switch component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **toggle**: Switch toggle track styles
- **thumb**: Switch thumb/knob styles
- **inputContainer**: Container wrapper styles

### Available Variants

**toggle**:
- base: Base classes for the toggle track
- Variants:
  - checked: boolean - Background and border color based on checked state
  - size: 'small' | 'normal' | 'large' - Toggle dimensions (height and width)
  - disabled: boolean - Disabled state styling

**thumb**:
- base: Base classes for the thumb/knob
- Variants:
  - checked: boolean - Thumb position and styling based on checked state
  - size: 'small' | 'normal' | 'large' - Thumb dimensions

**inputContainer**:
- base: Base classes for the container wrapper
- Variants:
  - size: 'small' | 'normal' | 'large' - Gap spacing between label and toggle
  - disabled: boolean - Disabled state styling

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Switch 
  label="Enable Feature"
  bind:value={enabled}
  theme={{
    toggle: {
      base: 'rounded-full transition-all',
      checked: {
        true: 'bg-green-500 border-green-600'
      },
      size: {
        normal: 'h-6 w-11'
      }
    },
    thumb: {
      size: {
        normal: 'h-5 w-5'
      }
    }
  }}
/>
\`\`\`

**Custom Colors**:
\`\`\`svelte
<Switch 
  label="Custom Switch"
  bind:value={checked}
  theme={{
    toggle: {
      checked: {
        true: 'bg-purple-500 border-purple-600',
        false: 'bg-gray-300 border-gray-400'
      }
    },
    thumb: {
      checked: {
        true: 'bg-white border-purple-500',
        false: 'bg-white border-gray-400'
      }
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setSwitchTheme } from 'entasis/switch';
  
  setSwitchTheme({
    toggle: {
      base: 'transition-all duration-300',
      checked: {
        true: 'bg-primary border-primary lift-3'
      },
      size: {
        normal: 'h-6 w-12'
      }
    },
    thumb: {
      base: 'lift-4',
      size: {
        normal: 'h-5 w-5'
      }
    }
  });
</script>
\`\`\`
`;
