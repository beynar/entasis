export const fieldDescription = `
# Field

Import Field, createFieldState, and the FieldState type from entasis/field. Field is the shared
validation and accessibility owner used by Entasis form controls. It renders field structure
around a custom control and does not create another form or validation system.

## Controller

createFieldState receives id, type, value, errors, and focused. Use getter/setter properties
for values bound to component props; plain initial values also work for standalone controls.
Optional name, required, disabled, readOnly, visible, size, density, messages, minLength,
maxLength, onValidate, and onValueChange configure the same owner used by built-in controls.

The controller exposes value, setValue(value), validate(), checkSchema(value), isValid,
errors, errorMessages, hasError, focused, touched, dirty, filled, initialValue, reset(value?),
focusControl(), disabled, readOnly, required, messages, size, and density.
Use bind:value on field.value or call field.setValue for user edits. Accepted changes publish
one onValueChange callback each. Unchanged values and parent state synchronization do not
publish callbacks. Disabled and read-only controllers reject user edits.

Spread field.controlAttrs on the native control and attach field.control to register its node.
The attributes provide id, name, disabled, required, readonly, aria-invalid, and
aria-describedby. The controller exposes id, labelId, descriptionId, helperId, errorId, and
describedBy for more specialized controls. Field connects its label, description, helper text
and error messages to this control, preserving the app's own accessible descriptions: the
control's aria-describedby lists the app's ids, then the description, the helper, and the
errors last. Errors render in one role="alert" container.

## Disabled and read-only

disabled and readOnly are effective states: a field is disabled when it is, or when a disabled
Form, a disabled FormGroup, or a Field rendered as="fieldset" around it is; read-only works the
same way. A disabled field rejects edits and skips validation (errors an app set on it stay
visible). A read-only field stays focusable, rejects user edits, and still validates and
submits. Field marks a read-only native text input or textarea with the readonly attribute, and
a role-based control (checkbox, switch, slider, combobox, radiogroup, listbox, spinbutton,
textbox) with aria-readonly. RatingInput's readonly prop is a deprecated alias of readOnly.

## Validation messages

Every validation message a user sees comes from the i18n catalog in the active locale, never
from the validation library. An empty required field shows one required message; a required
checkbox or switch says it must be on. Email and URL failures, text shorter than minLength or
longer than maxLength, values below or above a range, and incomplete codes each have their own
message. true from onValidate shows the catalog's invalid message; strings from onValidate are
shown verbatim.

messages overrides any of them per field: required, invalid, email, url, tooShort(min),
tooLong(max), rangeUnderflow(min), rangeOverflow(max), and incomplete(length). Each is a
string, or a function receiving the limit for the parameterized ones. field.messages holds the
resolved messages, for custom rules that report a range or length:

\`\`\`svelte
<script lang="ts">
	import { createFieldState } from 'entasis/field';

	const field = createFieldState({
		id: 'nickname',
		type: 'text',
		required: true,
		minLength: 3,
		messages: { required: 'Pick a nickname', tooShort: (min) => 'Use ' + min + ' letters or more' },
		value: '',
		errors: [],
		focused: false
	});
</script>
\`\`\`

## Interaction state

Focus is tracked on the Field root, so every control reports it, including those with several
focusable parts: focused is true while focus is anywhere in the field or in a popup the field
opened (a listbox, a date picker), and becomes false when focus leaves both. Leaving sets
touched. focused also clears when the focused control becomes disabled or leaves the document,
where Chromium sends no blur.

dirty is true while the value differs from initialValue, the first settled value; null, an
empty string and an empty array count as equal, Dates compare by time, arrays and plain objects
by content. filled is true while the field holds a value (a checked checkbox or switch; a
registered type's isEmpty decides for app-defined types). reset(value?) restores the initial
value, or a new one, as the untouched baseline without a value callback, and clears errors.

The Field root carries data-invalid, data-disabled, data-readonly, data-focused, data-filled,
data-dirty, and data-touched as presence attributes for styling, next to data-label-position.

## Wrapper props

- field: the shared FieldState controller.
- children: custom control content.
- as: native wrapper element; defaults to div. Use fieldset for grouped controls; a fieldset
  Field renders disabled when the field is and shares its disabled and read-only state with
  fields inside it.
- labelFor: associated control ID, or false for aria-labelledby; defaults to field.id. A
  labelFor={false} label focuses the control when clicked, without toggling or opening it. An
  aria-label on the control names it instead, so the label is not linked.
- size: small, normal, or large control geometry and label typography.
- density: compact, normal, or comfortable internal spacing, independent of size.
- labelPosition: top or left; left switches to side labels once the field itself is at least 32rem wide (a container query on the field, not the viewport).
- fieldAttrs: native attributes for the wrapper. Put native control attributes on the control.
- class and theme: wrapper classes and Field part overrides.

Slots include header, label, actions, prefix, suffix, footer, description, helper,
errorsContainer, and error. Field renders required indicators and validation errors. A press on
the input container around a text control (its padding, an icon, a chip) focuses the control;
buttons and other controls inside keep their own behaviour.

Required role-based controls (checkbox, switch, radiogroup, slider, combobox) receive
aria-required from Field; native inputs keep their required attribute. Button-rooted controls
(Checkbox, Switch) accept inputAttrs typed as FieldButtonAttributes.

## Form participation

A Form input with type: 'field' supplies fieldType and a snippet accepting FieldState<fieldType>.
The entry inherits InputProps, including defaultValue, required, disabled, readOnly, messages,
size, density, onValidate, and onValueChange. The controller receives the resolved Form size and
density. Its value participates in inferred values, validation, submission, and Form bind:value.
The existing type: 'custom' entry remains display-only and contributes no value key.
`;
