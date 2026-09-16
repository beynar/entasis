export const buttonGroupDescription = `
# ButtonGroup Component

The ButtonGroup component displays a collection of related buttons as a cohesive group with shared styling properties.

## Basic Usage

\`\`\`svelte
<ButtonGroup 
	items={[
		{ children: 'First' },
		{ children: 'Second' },
		{ children: 'Third' }
	]}
/>
\`\`\`

## Props

### Core Props
- **items**: Array<ButtonProps> (required) - Array of button configurations
  - Each button can have all standard Button component props

### Shared Button Props
- **size**: 'small' | 'normal' | 'large' - Applied to all buttons in the group
- **color**: 'primary' | 'secondary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info' - Shared color for all buttons
- **variant**: 'solid' | 'outline' | 'soft' | 'ghost' | 'link' - Shared variant for all buttons
- **disabled**: boolean - Disables all buttons in the group

### Styling Props
- **class**: string - Additional CSS classes for the group container
- **theme**: ComponentTheme - Custom theme overrides

## Structure

\`\`\`
<ButtonGroup>
	<Button />
	<Button />
	<Button />
</ButtonGroup>
\`\`\`

## Examples

### Basic Button Group
\`\`\`svelte
<ButtonGroup 
	items={[
		{ children: 'Left' },
		{ children: 'Center' },
		{ children: 'Right' }
	]}
/>
\`\`\`

### With Shared Styling
\`\`\`svelte
<ButtonGroup 
	size="large"
	color="primary"
	variant="outline"
	items={[
		{ children: 'Option 1' },
		{ children: 'Option 2' },
		{ children: 'Option 3' }
	]}
/>
\`\`\`

### With Icons
\`\`\`svelte
<script lang="ts">
	import { ButtonGroup } from 'svelai/button-group';
	import { textAlignLeftIcon } from 'svelai/icons/textAlignLeft';
	import { textAlignCenterIcon } from 'svelai/icons/textAlignCenter';
	import { textAlignRightIcon } from 'svelai/icons/textAlignRight';
</script>

<ButtonGroup 
	items={[
		{ 
			prefix: textAlignLeftIcon,
			children: 'Left' 
		},
		{ 
			prefix: textAlignCenterIcon,
			children: 'Center' 
		},
		{ 
			prefix: textAlignRightIcon,
			children: 'Right' 
		}
	]}
/>
\`\`\`

### With Individual Click Handlers
\`\`\`svelte
<script>
	function handleOption(option) {
		console.log(\`Selected: \${option}\`);
	}
</script>

<ButtonGroup 
	items={[
		{ 
			children: 'Save',
			onclick: () => handleOption('save')
		},
		{ 
			children: 'Cancel',
			onclick: () => handleOption('cancel')
		}
	]}
/>
\`\`\`

### Disabled Group
\`\`\`svelte
<ButtonGroup 
	disabled
	items={[
		{ children: 'Option 1' },
		{ children: 'Option 2' }
	]}
/>
\`\`\`

### Icon Only Buttons
\`\`\`svelte
<script lang="ts">
	import { ButtonGroup } from 'svelai/button-group';
	import { textBIcon } from 'svelai/icons/textB';
	import { textItalicIcon } from 'svelai/icons/textItalic';
	import { textUnderlineIcon } from 'svelai/icons/textUnderline';
</script>

<ButtonGroup 
	items={[
		{ 
			squared: true,
			prefix: textBIcon
		},
		{ 
			squared: true,
			prefix: textItalicIcon
		},
		{ 
			squared: true,
			prefix: textUnderlineIcon
		}
	]}
/>
\`\`\`

### Mixed Button States
\`\`\`svelte
<ButtonGroup 
	variant="outline"
	items={[
		{ children: 'Active', color: 'primary' },
		{ children: 'Default', color: 'neutral' },
		{ children: 'Disabled', disabled: true }
	]}
/>
\`\`\`

### Segmented Control
\`\`\`svelte
<script>
	let selected = $state('week');
</script>

<ButtonGroup 
	items={[
		{ 
			children: 'Day',
			variant: selected === 'day' ? 'solid' : 'ghost',
			onclick: () => selected = 'day'
		},
		{ 
			children: 'Week',
			variant: selected === 'week' ? 'solid' : 'ghost',
			onclick: () => selected = 'week'
		},
		{ 
			children: 'Month',
			variant: selected === 'month' ? 'solid' : 'ghost',
			onclick: () => selected = 'month'
		}
	]}
/>
\`\`\`

## Styling

ButtonGroup automatically:
- Removes border-radius from middle buttons
- Adjusts borders to prevent double borders
- Creates a cohesive, connected appearance
- Maintains consistent spacing

## Accessibility

- Each button maintains full keyboard accessibility
- Focus styles are preserved
- Disabled state cascades properly
- Screen readers announce each button individually

## Notes

- Individual button props override shared props
- Buttons are rendered in the order provided
- The group container can be styled with the \`class\` prop
- All Button component features are supported for individual buttons

## Theme Customization

The ButtonGroup component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main button group container styles

### Available Variants

**root**:
- base: Base classes for button group container (handles border radius and border connections between buttons)

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<ButtonGroup 
  items={buttons}
  theme={{
    root: {
      base: 'flex items-center rounded-lg overflow-hidden'
    }
  }}
/>
\`\`\`

**Custom Group Styling**:
\`\`\`svelte
<ButtonGroup 
  items={buttons}
  theme={{
    root: {
      base: 'flex items-center gap-0 border-2 border-primary rounded-lg overflow-hidden'
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setButtonGroupTheme } from 'svelai/button-group';
  
  setButtonGroupTheme({
    root: {
      base: 'flex items-center first-child:rounded-r-none last-child:rounded-l-none'
    }
  });
</script>
\`\`\`
`;
