export const comboboxDescription = `
# Combobox Component

A searchable dropdown component that supports both static arrays and async option loading. Provides keyboard navigation, debounced search, and full ARIA accessibility. Use it when users need to search and select from a large list of options.

## Basic Usage

\`\`\`svelte
<script>
	import { Combobox } from 'svelai/combobox';
	let value = $state(null);
	const items = [
		{ value: 'us', label: 'United States', description: 'North America' },
		{ value: 'uk', label: 'United Kingdom', description: 'Europe' }
	];
</script>

<Combobox
	placeholder="Search countries..."
	items={items}
	bind:value={value}
/>
\`\`\`

## Props

### Core Props

- **items**: \`ComboboxOption[] | ((searchValue?: string) => MaybePromise<ComboboxOption[]>)\` (required)
  - Array of options or async function that returns options based on search value
  - For arrays: filtered client-side
  - For functions: called with search value, returns Promise or array

- **value**: \`string | null\` (bindable)
  - Selected option value
- **defaultValue**: \`string | null\` (default: \`null\`)
  - Initial selected value when \`value\` is omitted

- **searchValue**: \`string\` (default: \`''\`, bindable)
  - Current search input value

- **loading**: \`boolean\` (default: \`false\`, bindable)
  - Loading state (managed automatically for async options)

### Behavior Props

- **showAllOnFocus**: \`boolean\` (default: \`false\`)
  - Show all options when input is focused, even without typing

- **getValueOption**: \`(value: string) => MaybePromise<ComboboxOption | null | undefined>\`
  - Function to get option data for a value when not in loaded options
  - Useful for async options with pre-selected values

- **placeholder**: \`string\` (default: \`''\`)
  - Input placeholder text

- **loadingText**: \`string\` (default: \`'Loading...'\`)
  - Text displayed while loading options

- **noOptionsText**: \`string\` (default: \`'No options found'\`)
  - Text displayed when no options match

### Field Props

- **required**: \`boolean\` (default: \`false\`)
- **disabled**: \`boolean\`
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`)
- **density**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`) - Spacing density forwarded to the dropdown option rows (paddings, gaps, min-height)
- **name**: \`string\`
- **errors**: \`string[] | boolean\` (bindable)
- **focused**: \`boolean\` (bindable)
- **description**: \`string\`

### Event Props

- **onValueChange**: \`({ value, option }: { value: string | null; option: ComboboxOption | null }) => void\`
  - Called when selection changes
  - Receives a named payload with both the value and full option object

- **onValidate**: \`(value: string) => string[] | boolean\`
  - Custom validation function

### Slot Props

- **prefix**: \`Snippet | false\` (default: magnifying glass icon)
  - Prefix content. Set to \`false\` to hide default icon

- **suffix**: \`Snippet\`
  - Suffix content (clear button shown automatically when value exists)

### Theme Props

- **theme**: \`ComboboxThemeProps\`
  - Customize styling for: input, inputContainer, loading, error, noOptions, option, optionLabel, optionDescription

## Examples

### Array Options (Client-side Filtering)

\`\`\`svelte
<script>
	let value = $state(null);
	const countries = [
		{ value: 'us', label: 'United States' },
		{ value: 'uk', label: 'United Kingdom' }
	];
</script>

<Combobox
	items={countries}
	bind:value={value}
	placeholder="Search countries..."
/>
\`\`\`

### Async Options (API Call)

\`\`\`svelte
<script lang="ts">
	let value = $state(null);
	const getOptions = async (searchValue?: string) => {
		const response = await fetch(\`/api/search?q=\${searchValue}\`);
		return response.json();
	};
</script>

<Combobox
	items={getOptions}
	bind:value={value}
	placeholder="Search async..."
/>
\`\`\`

### Show All Options on Focus

\`\`\`svelte
<Combobox
	items={countries}
	showAllOnFocus={true}
	bind:value={value}
/>
\`\`\`

### Pre-selected Value with Async Options

\`\`\`svelte
<script lang="ts">
	let value = $state('us');
	const getValueOption = async (value: string) => {
		return { value, label: 'United States' };
	};
	const getOptions = async (searchValue?: string) => {
		// Fetch options...
	};
</script>

<Combobox
	items={getOptions}
	bind:value={value}
	getValueOption={getValueOption}
/>
\`\`\`

## State Management

- **value**: Bindable string (option value) or null
- **searchValue**: Bindable string for search input
- **loading**: Bindable boolean, automatically managed for async options
- **errors**: Bindable array or boolean for validation errors
- **focused**: Bindable boolean for focus state

## Accessibility

- Full ARIA combobox pattern implementation
- **role="combobox"** on input
- **role="listbox"** on options container
- **role="option"** on each option
- **aria-expanded**, **aria-controls**, **aria-activedescendant** for state
- **aria-autocomplete="list"** for search behavior
- Keyboard navigation: ArrowDown/Up (wraps around), Enter (select), Escape (close), Home/End (first/last)
- Screen reader announcements for loading and error states

## Notes

- **Debouncing**: Search is debounced by 100ms to reduce API calls
- **Race Conditions**: Handled automatically - only latest async request updates state
- **Option Format**: Options must have \`value\` (string) and \`label\` (string). Optional \`description\` displays below label
- **Keyboard Navigation**: Wraps around - ArrowDown at bottom goes to top, ArrowUp at top goes to bottom
- **Empty States**: Shows loading text, error message, or no options text appropriately
- **Clear Button**: Automatically shown when value exists, uses the shared field action button hitbox
- **Default Prefix**: Magnifying glass icon shown by default unless \`prefix={false}\` or custom snippet provided

## Theme Customization

The Combobox component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **input**: Input element styles
- **inputContainer**: Input container wrapper styles
- **loading**: Loading state indicator styles
- **error**: Error message styles
- **noOptions**: No options found message styles
- **option**: Individual option item styles
- **optionLabel**: Option label text styles
- **optionDescription**: Option description text styles

### Available Variants

**input**:
- base: Base classes applied to the input element
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size
  - disabled: boolean - Disabled state styling

**inputContainer**:
- base: Base classes for the input container
- Variants:
  - size: 'small' | 'normal' | 'large' - Size-based styling
  - disabled: boolean - Disabled state styling

**loading**:
- base: Base classes for loading indicator

**error**:
- base: Base classes for error message

**noOptions**:
- base: Base classes for no options message

**option**:
- base: Base classes for option items
- Variants:
  - highlighted: boolean - Highlighted/hovered option styling

**optionLabel**:
- base: Base classes for option label text

**optionDescription**:
- base: Base classes for option description text

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Combobox
  items={items}
  bind:value={value}
  theme={{
    inputContainer: {
      base: 'border-2 rounded-lg',
      size: {
        normal: 'px-4 py-2'
      }
    },
    option: {
      base: 'state-layer px-4 py-2',
      highlighted: {
        true: ''
      }
    }
  }}
/>
\`\`\`

**Custom Option Styling**:
\`\`\`svelte
<Combobox
  items={items}
  bind:value={value}
  theme={{
    option: {
      base: 'rounded-md transition-colors',
      highlighted: {
        true: 'bg-blue-500 text-white'
      }
    },
    optionLabel: {
      base: 'font-semibold'
    },
    optionDescription: {
      base: 'text-sm text-gray-600'
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setComboboxTheme } from 'svelai/combobox';
  
  setComboboxTheme({
    inputContainer: {
      base: 'rounded-lg border-2 transition-all',
      size: {
        normal: 'px-4 py-2'
      }
    },
    option: {
      base: 'px-4 py-2 rounded-md',
      highlighted: {
        true: 'bg-primary text-white'
      }
    }
  });
</script>
\`\`\`
`;
