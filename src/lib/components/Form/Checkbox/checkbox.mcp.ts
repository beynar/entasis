export const checkboxDescription = `
# Checkbox

Import from \`entasis/checkbox\`.

Checkbox is a boolean Form control. value is bindable, defaultValue initializes an uncontrolled value, and onValueChange reports changes. required, disabled, readOnly, errors, messages, label, and fieldAttrs use the shared Field contract. indeterminate controls the mixed presentation. Checkbox shares the CheckboxesInput theme owner.

A required checkbox must be checked; left unchecked it shows the catalog message asking to check it, which messages.required overrides. The checkbox control carries aria-required. A read-only checkbox stays focusable, carries aria-readonly, and ignores clicks and keys.

inputAttrs takes native attributes for the checkbox button (FieldButtonAttributes), such as aria-label, title, data-* and event handlers; an aria-label there names the checkbox instead of its label, and a handler that calls preventDefault() cancels the toggle.
`;
