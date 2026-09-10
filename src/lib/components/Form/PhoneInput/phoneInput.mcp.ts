export const phoneInputDescription = `
# PhoneInput Component

The PhoneInput component provides a formatted input field for phone numbers with country code selection and automatic formatting. [intl-tel-input](https://intl-tel-input.com/) is loaded from a CDN at runtime and never bundled. A strict Content-Security-Policy must allow \`cdn.jsdelivr.net\` in \`script-src\`.

## Basic Usage

\`\`\`svelte
<script>
	let phone = $state('');
</script>

<PhoneInput label="Phone Number" bind:value={phone} />
\`\`\`

## Props

Extends all Field component props plus:

### Core Props
- **value**: string (bindable) - Phone number value
- **defaultCountry**: string (default: 'US') - Default country code
- **placeholder**: string - Placeholder text

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **error**: string - Error message
- **required**: boolean - Mark as required
- **disabled**: boolean - Disable input
- **size**: 'small' | 'normal' | 'large'

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

\`\`\`
<Field>
	<Label />
	<Description />
	<InputContainer>
		<CountrySelector />
		<PhoneNumberInput />
	</InputContainer>
	<Error />
</Field>
\`\`\`

## Examples

### Basic Phone Input
\`\`\`svelte
<script>
	let phone = $state('');
</script>

<PhoneInput 
	label="Phone Number"
	bind:value={phone}
/>
\`\`\`

### With Default Country
\`\`\`svelte
<PhoneInput 
	label="Phone Number"
	bind:value={phone}
	defaultCountry="GB"
/>
\`\`\`

### Required Field
\`\`\`svelte
<PhoneInput 
	label="Contact Number"
	bind:value={phone}
	required
/>
\`\`\`

### With Description
\`\`\`svelte
<PhoneInput 
	label="Mobile Number"
	description="We'll send verification code to this number"
	bind:value={phone}
/>
\`\`\`

### Disabled State
\`\`\`svelte
<PhoneInput 
	label="Phone"
	value="+1 234 567 8900"
	disabled
/>
\`\`\`

### Contact Form
\`\`\`svelte
<script>
	let contact = $state({
		name: '',
		email: '',
		phone: ''
	});
</script>

<form>
	<TextInput 
		label="Name"
		bind:value={contact.name}
		required
	/>
	
	<TextInput 
		type="email"
		label="Email"
		bind:value={contact.email}
		required
	/>
	
	<PhoneInput 
		label="Phone"
		bind:value={contact.phone}
		required
	/>
	
	<Button type="submit">Submit</Button>
</form>
\`\`\`

### Multiple Phone Numbers
\`\`\`svelte
<script>
	let phones = $state({
		home: '',
		mobile: '',
		work: ''
	});
</script>

<PhoneInput 
	label="Home Phone"
	bind:value={phones.home}
/>

<PhoneInput 
	label="Mobile Phone"
	bind:value={phones.mobile}
	required
/>

<PhoneInput 
	label="Work Phone"
	bind:value={phones.work}
/>
\`\`\`

### With Validation
\`\`\`svelte
<script>
	let phone = $state('');
	let error = $state('');
	
	function validatePhone(value) {
		// Simple validation - in production use a proper library
		if (!value) return '';
		if (value.length < 10) return 'Phone number is too short';
		return '';
	}
	
	$effect(() => {
		error = validatePhone(phone);
	});
</script>

<PhoneInput 
	label="Phone Number"
	bind:value={phone}
	error={error}
	required
/>
\`\`\`

### International Support
\`\`\`svelte
<script>
	let phoneNumbers = $state({
		us: '',
		uk: '',
		fr: ''
	});
</script>

<PhoneInput 
	label="US Number"
	bind:value={phoneNumbers.us}
	defaultCountry="US"
/>

<PhoneInput 
	label="UK Number"
	bind:value={phoneNumbers.uk}
	defaultCountry="GB"
/>

<PhoneInput 
	label="France Number"
	bind:value={phoneNumbers.fr}
	defaultCountry="FR"
/>
\`\`\`

### Delivery Information
\`\`\`svelte
<script>
	let delivery = $state({
		address: '',
		phone: '',
		notes: ''
	});
</script>

<form>
	<TextArea 
		label="Delivery Address"
		bind:value={delivery.address}
		required
	/>
	
	<PhoneInput 
		label="Contact Phone"
		description="For delivery updates"
		bind:value={delivery.phone}
		required
	/>
	
	<TextArea 
		label="Delivery Notes"
		bind:value={delivery.notes}
	/>
	
	<Button type="submit">Confirm Order</Button>
</form>
\`\`\`

## Formatting

PhoneInput automatically formats numbers based on the selected country:
- US: (123) 456-7890
- UK: 07123 456789
- International: +XX XXX XXX XXXX

## Country Selection

- Searchable dropdown of countries
- Country flags displayed
- International dialing codes shown
- Detects country from phone number

## Validation

PhoneInput validates:
- **required**: Non-empty phone number
- **format**: Valid phone number format for selected country
- **length**: Appropriate length for country

## Accessibility

- Proper label association
- Country selector is keyboard accessible
- ARIA attributes for required state
- Error messages announced
- Focus management between country and number

## Notes

- intl-tel-input loads from a CDN on first mount; nothing is bundled. A network connection is required for formatting and validation.
- Automatically formats as user types
- Supports international phone numbers
- Country code is included in value
- Validation depends on country format
- Works with form libraries and validation schemas

## Theme Customization

The PhoneInput component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme. It shares the same theme structure as TextInput.

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
<PhoneInput 
  label="Phone Number"
  bind:value={phone}
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
<PhoneInput 
  label="Contact Phone"
  bind:value={phone}
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
  import { setPhoneInputTheme } from 'svelai/phone-input';
  
  setPhoneInputTheme({
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
