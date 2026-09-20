export const fieldDescription = `
# Field

Import Field, createFieldState, and the FieldState type from entasis/field. Field is the shared
validation and accessibility owner used by Entasis form controls. It renders field structure
around a custom control and does not create another form or validation system.

## Controller

createFieldState receives id, type, value, errors, and focused. Use getter/setter properties
for values bound to component props; plain initial values also work for standalone controls.
Optional name, required, disabled, visible, size, density, onValidate, and onValueChange
configure the same owner used by built-in controls.

The controller exposes value, setValue(value), validate(), checkSchema(value), isValid,
errors, errorMessages, hasError, focused, disabled, required, size, and density.
Use bind:value on field.value or call field.setValue for user edits. Accepted changes publish
one onValueChange callback each. Unchanged values and parent state synchronization do not
publish callbacks. Disabled controllers reject user edits.

Spread field.controlAttrs on the native control and attach field.control to register its node.
The attributes provide id, name, disabled, required, aria-invalid, and aria-describedby.
The controller exposes id, labelId, and errorId for more specialized controls. Field connects
its label and error messages to this control, preserving unrelated accessible descriptions.

fieldSchemas exports the built-in optional and required schemas. onValidate supplements that
schema: a message, message array, or true means invalid; false, null, or undefined means valid.
Optional empty values skip custom validation. validate returns a tuple containing the error
flag and schema-normalized value.

## Wrapper props

- field: the shared FieldState controller.
- children: custom control content.
- as: native wrapper element; defaults to div. Use fieldset for grouped controls.
- labelFor: associated control ID, or false for aria-labelledby; defaults to field.id.
- size: small, normal, or large control geometry and label typography.
- density: compact, normal, or comfortable internal spacing, independent of size.
- labelPosition: top or left; left switches to side labels once the field itself is at least 32rem wide (a container query on the field, not the viewport).
- fieldAttrs: native attributes for the wrapper. Put native control attributes on the control.
- class and theme: wrapper classes and Field part overrides.

Slots include header, label, actions, prefix, suffix, footer, description, helper,
errorsContainer, and error. Field renders required indicators and validation errors.

## Form participation

A Form input with type: 'field' supplies fieldType and a snippet accepting FieldState<fieldType>.
The entry inherits InputProps, including defaultValue, required, disabled, size, density,
onValidate, and onValueChange. The controller receives the resolved Form size and density.
Its value participates in inferred values, validation, submission, and Form bind:value.
The existing type: 'custom' entry remains display-only and contributes no value key.
`;
