export const checkboxDescription = `
# Checkbox

Import from \`entasis/checkbox\`.

Checkbox is a boolean Form control. value is bindable, defaultValue initializes an uncontrolled value, and onValueChange reports changes. required, disabled, readOnly, errors, messages, label, and fieldAttrs use the shared Field contract. indeterminate controls the mixed presentation. Checkbox shares the CheckboxesInput theme owner.

A required checkbox must be checked; left unchecked it shows the catalog message asking to check it, which messages.required overrides. The checkbox control carries aria-required. A read-only checkbox stays focusable, carries aria-readonly, and ignores clicks and keys.

inputValue is the value a native \`<form>\` submits under name while the checkbox is checked (default 'true'); an unchecked checkbox, or one without a name, submits nothing. The hidden input sits beside the button, never inside it, and carries required so a native submit is blocked until the box is checked.

Enter does not toggle the checkbox. Like a native checkbox it continues the form: inside an entasis Form it validates the field and moves focus to the next one (the last field submits), and inside a plain \`<form>\` it clicks the form's default submit button. Space toggles. A mixed (indeterminate) checkbox toggles to the opposite of the boolean it holds.

The label names the checkbox (aria-labelledby) and the description describes it (aria-describedby), so the description is not part of the accessible name.

inputAttrs takes native attributes for the checkbox button (FieldButtonAttributes), such as aria-label, title, data-* and event handlers; an aria-label there names the checkbox instead of its label, and a handler that calls preventDefault() cancels the toggle.
`;
