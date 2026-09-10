export const checkboxesInputDescription = `
# CheckboxesInput Component

The CheckboxesInput component is a multi-selection input that allows users to select multiple options from a list. It provides a visually appealing interface with two display modes and supports custom labels and descriptions.

## Basic Usage

\`\`\`svelte
<script>
	let selectedValues = $state([]);
</script>

<CheckboxesInput 
	label="Select your interests"
	items={[
		{ value: 'coding', label: 'Coding' },
		{ value: 'design', label: 'Design' },
		{ value: 'marketing', label: 'Marketing' }
	]}
	bind:value={selectedValues}
/>
\`\`\`

## Props

### Core Props
- **items**: CheckboxOption[] (required) - Array of checkbox options
  - Each option has:
    - value: string (required) - Unique identifier for the option
    - label?: Slot - Display label (can be text or Svelte snippet)
    - description?: Slot - Optional description text

- **value**: string[] (bindable) - Array of selected option values
- **mode**: 'normal' | 'card' (default: 'normal')
  - normal: Simple checkbox list
  - card: Each option displayed as a raised card with selection ring

### Field Props
- **label**: Slot - Field label
- **description**: Slot - Helper text below label
- **required**: boolean (default: false) - Makes field required
- **disabled**: boolean - Disables all checkboxes
- **visible**: boolean - Controls field visibility
- **name**: string - Form field name

### Validation Props
- **errors**: string[] | boolean (bindable) - Validation errors
- **focused**: boolean (bindable) - Focus state
- **onValidate**: (value: string[]) => string[] | boolean - Custom validation function

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides for all checkbox parts

### Slot Props
All Field slot props are available:
- **header**: Snippet - Custom header
- **suffix**: Snippet - Content after input
- **prefix**: Snippet - Content before input
- **actions**: Snippet - Action buttons area
- **helper**: Snippet - Helper text
- **footer**: Snippet - Footer content
- **error**: Snippet - Custom error display
- **errorsContainer**: Snippet - Custom errors container

## Structure

The component renders as a fieldset with the following DOM structure:
\`\`\`
<fieldset>
	<Field wrapper>
		<label> <!-- For each option -->
			<input type="checkbox" hidden />
			<div> <!-- Track (checkbox background) -->
			<div> <!-- Thumb (check mark) -->
			<Slot> <!-- Label -->
			<Slot> <!-- Description -->
		</label>
	</Field>
</fieldset>
\`\`\`

## Examples

### Basic Checkbox List
\`\`\`svelte
<script>
	let interests = $state([]);
</script>

<CheckboxesInput 
	label="Interests"
	items={[
		{ value: 'music', label: 'Music' },
		{ value: 'sports', label: 'Sports' },
		{ value: 'reading', label: 'Reading' },
		{ value: 'travel', label: 'Travel' }
	]}
	bind:value={interests}
/>
\`\`\`

### Card Mode
\`\`\`svelte
<CheckboxesInput 
	label="Select features"
	mode="card"
	items={[
		{ 
			value: 'analytics', 
			label: 'Analytics',
			description: 'Track user behavior and metrics'
		},
		{ 
			value: 'api', 
			label: 'API Access',
			description: 'RESTful API for integrations'
		},
		{ 
			value: 'support', 
			label: 'Priority Support',
			description: '24/7 dedicated support team'
		}
	]}
	bind:value={selectedFeatures}
/>
\`\`\`

### With Descriptions
\`\`\`svelte
<CheckboxesInput 
	label="Communication preferences"
	items={[
		{ 
			value: 'email', 
			label: 'Email notifications',
			description: 'Receive updates via email'
		},
		{ 
			value: 'sms', 
			label: 'SMS alerts',
			description: 'Text messages for urgent items'
		},
		{ 
			value: 'push', 
			label: 'Push notifications',
			description: 'Browser push notifications'
		}
	]}
	bind:value={preferences}
/>
\`\`\`

### With Validation
\`\`\`svelte
<script>
	let skills = $state([]);
	
	function validateSkills(value) {
		if (value.length < 2) {
			return ['Please select at least 2 skills'];
		}
		return false;
	}
</script>

<CheckboxesInput 
	label="Skills"
	required
	items={[
		{ value: 'js', label: 'JavaScript' },
		{ value: 'py', label: 'Python' },
		{ value: 'go', label: 'Go' },
		{ value: 'rust', label: 'Rust' }
	]}
	bind:value={skills}
	onValidate={validateSkills}
/>
\`\`\`

### In a Form
\`\`\`svelte
<script>
	import { Form } from 'svelai/form';
	
	function handleSubmit(data) {
		console.log('Selected interests:', data.interests);
	}
</script>

<Form 
	inputs={{
		interests: {
			type: 'checkboxes',
			label: 'Your interests',
			required: true,
			items: [
				{ value: 'tech', label: 'Technology' },
				{ value: 'science', label: 'Science' },
				{ value: 'art', label: 'Art' },
				{ value: 'business', label: 'Business' }
			]
		}
	}}
	onSubmit={handleSubmit}
/>
\`\`\`

### With Custom Snippets
\`\`\`svelte
<CheckboxesInput 
	label="Select options"
	items={[
		{ value: 'opt1', label: 'Option 1' },
		{ value: 'opt2', label: 'Option 2' }
	]}
	bind:value={selected}
>
	{#snippet description()}
		<p class="text-sm text-muted">Choose all that apply</p>
	{/snippet}
	
	{#snippet helper()}
		<p class="text-xs">Selected: {selected.length}</p>
	{/snippet}
</CheckboxesInput>
\`\`\`

### Pre-selected Values
\`\`\`svelte
<script>
	let selected = $state(['option1', 'option3']);
</script>

<CheckboxesInput 
	label="Preferences"
	items={[
		{ value: 'option1', label: 'Option 1' },
		{ value: 'option2', label: 'Option 2' },
		{ value: 'option3', label: 'Option 3' }
	]}
	bind:value={selected}
/>
\`\`\`

### Disabled State
\`\`\`svelte
<CheckboxesInput 
	label="Read-only selection"
	disabled
	items={items}
	value={['option1']}
/>
\`\`\`

### Complex Options with Rich Labels
\`\`\`svelte
<script>
	import { Chip } from 'svelai/chip';
	
	let plans = $state([]);
</script>

<CheckboxesInput 
	label="Select add-ons"
	mode="card"
	items={[
		{ 
			value: 'storage',
			label: (props) => {
				return \`Extra Storage <Chip color="primary">+$5/mo</Chip>\`;
			},
			description: '100GB additional cloud storage'
		},
		{ 
			value: 'users',
			label: (props) => {
				return \`Team Members <Chip color="success">+$10/mo</Chip>\`;
			},
			description: 'Add up to 10 team members'
		}
	]}
	bind:value={plans}
/>
\`\`\`

## Validation

- When **required** is true, at least one option must be selected
- Custom validation via **onValidate** prop
- Returns array of error messages or boolean
- Errors are displayed inline below the field
- Validation runs on change and blur

## Modes

### Normal Mode
- Simple checkbox list layout
- Compact design
- Best for shorter lists or secondary choices

### Card Mode
- Each option displayed as a card with elevation
- Selected cards show a primary selection ring
- Better visual feedback
- Ideal for feature selection or important choices

## Accessibility

- Uses semantic \`<fieldset>\` and \`<legend>\` elements
- Each checkbox properly associated with its label
- Hidden native checkbox inputs for keyboard navigation
- Supports keyboard interaction (Space/Enter to toggle)
- ARIA attributes for validation states
- Error announcements for screen readers
- Focus management within the group

## Theme Customization

The CheckboxesInput component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main container styles
- **checkboxesInputContainer**: Options grid container styles
- **checkboxesInputItem**: Individual checkbox wrapper styles
- **checkboxesInputItemTrack**: Checkbox background/track styles
- **checkboxesInputItemThumb**: Check mark indicator styles
- **checkboxesInputItemLabel**: Label text styles
- **checkboxesInputItemDescription**: Description text styles
- **checkboxesInputItemIcon**: Icon styling

### Available Variants

**root**:
- base: Base classes for main container
- Variants:
  - mode: 'card' | 'normal' - Layout mode

**checkboxesInputContainer**:
- base: Base classes for options grid container
- Variants:
  - mode: 'card' | 'normal' - Grid layout based on mode
  - disabled: boolean - Disabled state styling

**checkboxesInputItem**:
- base: Base classes for individual checkbox wrapper
- Variants:
  - mode: 'card' | 'normal' - Item styling based on mode
  - checked: boolean - Selected state styling
  - disabled: boolean - Disabled state styling

**checkboxesInputItemTrack**:
- base: Base classes for checkbox track/background
- Variants:
  - checked: boolean - Track styling when checked
  - mode: 'card' | 'normal' - Mode-based styling
  - disabled: boolean - Disabled state styling

**checkboxesInputItemThumb**:
- base: Base classes for check mark indicator
- Variants:
  - checked: boolean - Visibility and styling when checked
  - mode: 'card' | 'normal' - Mode-based styling
  - disabled: boolean - Disabled state styling

**checkboxesInputItemLabel**:
- base: Base classes for label text

**checkboxesInputItemDescription**:
- base: Base classes for description text

**checkboxesInputItemIcon**:
- base: Base classes for icon styling

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<CheckboxesInput 
  label="Options"
  bind:value={selected}
  items={items}
  theme={{
    checkboxesInputContainer: {
      base: 'grid-cols-1 md:grid-cols-3 gap-4'
    },
    checkboxesInputItem: {
      mode: {
        card: 'rounded-lg border-2'
      }
    }
  }}
/>
\`\`\`

**Card Mode Customization**:
\`\`\`svelte
<CheckboxesInput 
  mode="card"
  label="Features"
  bind:value={features}
  items={items}
  theme={{
    checkboxesInputItem: {
      checked: {
        true: 'ring-2 ring-primary bg-primary/10'
      },
      mode: {
        card: 'rounded-xl shadow-md hover:shadow-lg'
      }
    },
    checkboxesInputItemThumb: {
      checked: {
        true: 'bg-primary scale-100'
      }
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setCheckboxesInputTheme } from 'svelai/checkboxes-input';
  
  setCheckboxesInputTheme({
    checkboxesInputContainer: {
      base: 'gap-4',
      mode: {
        card: 'grid-cols-1 md:grid-cols-2'
      }
    },
    checkboxesInputItem: {
      mode: {
        card: 'rounded-lg transition-all'
      }
    }
  });
</script>
\`\`\`

## Notes

- Value is always an array of strings (selected option values)
- Empty array means no selections
- Options are rendered in a responsive grid (1 column mobile, 2 columns desktop)
- Check icon automatically appears when option is selected
- Native checkbox is hidden but maintained for accessibility
- Works seamlessly with Form component
- Supports Svelte 5 snippets for labels and descriptions
- Each option requires a unique \`value\` property

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
