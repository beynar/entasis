export const fieldDescription = `
# Field

Import Field, FieldHiddenInputs, createFieldState, and the FieldState type from entasis/field. Field is the shared
validation and accessibility owner used by Entasis form controls. It renders field structure
around a custom control and does not create another form or validation system.

## Controller

createFieldState receives id, type, value, errors, and focused. Use getter/setter properties
for values bound to component props; plain initial values also work for standalone controls.
Optional name, required, disabled, readOnly, visible, size, density, messages, minLength,
maxLength, onValidate, validationMode, validationDebounce, and onValueChange configure the same
owner used by built-in controls.

The controller exposes value, setValue(value), validate(), checkSchema(value), isValid,
errors, errorMessages, hasError, hasValidationError, focused, touched, dirty, filled,
initialValue, reset(value?), focusControl(), validating, validateAsync(), settle(),
externalErrors, setExternalErrors(messages), clearExternalErrors(), disabled, readOnly,
required, messages, size, and density.
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

## Validation timing, async validators and external errors

validationMode picks when the field validates by itself: submit (the default, from the Form)
validates on a submit attempt and then re-validates each edit, blur when focus leaves the field,
change on every accepted change. A field showing an error always re-validates as it is edited,
and mounting never validates. validationDebounce (milliseconds) delays the validation an edit
triggers. Both can be set on the Form, on an entry, or as Field props that controls forward.

onValidate may return a promise. While it is pending the field is neither valid nor invalid
(no aria-invalid, no data-invalid, data-validating on the root) and validating is true; a
result for an older value is dropped, a rejection marks the field invalid with the generic
message, and unmounting cancels it. validate() stays synchronous; validateAsync() and settle()
wait for pending validators.

setExternalErrors(messages) shows errors an app got from outside, such as a server response.
errorMessages lists the validation errors first, then these. validate() leaves them alone and
they do not count as hasValidationError, so they never block a submit; they clear on the
field's next accepted value change, reset(), or clearExternalErrors().

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
value, or a new one, as the untouched baseline without a value callback, and clears errors and
any pending validation.

The Field root carries data-invalid, data-disabled, data-readonly, data-focused, data-filled,
data-dirty, data-touched, and data-validating as presence attributes for styling, next to
data-label-position. A new error fades and grows in under the Theme's motion tokens; reduced
motion plays nothing.

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

## Native forms

Every Field control also works inside a plain <form>, such as a SvelteKit form action.

- form: the id of the native form a field submits with when it is rendered outside that form,
  like the HTML form attribute. Every input prop type accepts it; Field gives it to the field's
  native controls and hidden inputs.
- Reset: a native reset of the field's form (a type="reset" button or form.reset()) returns the
  field to the value it mounted with, clears its errors, and publishes one onValueChange. A reset
  that another listener cancels changes nothing. Disabled and read-only fields keep their value.

FieldHiddenInputs renders the inputs a custom control submits through, beside the control and
never inside a button. Pass the field, plus value (a string or number for one input, an array for
one input per entry, null for none) or checked (one checkbox submitting value, default "on", only
while checked). name, required, disabled and form default to the field's; a generated field name
is never submitted. A required, empty field blocks the native submit: the browser's report moves
to the field's control, which shows the field's own error instead of the browser bubble.
autocomplete renders the single value as a text input the browser can autofill; the filled text
is matched against options (by value, then label, then label ignoring case and accents) and
committed with field.setValue, or handed to onAutofill. Read-only and disabled fields ignore
autofill.

\`\`\`svelte
<script lang="ts">
	import { Field, FieldHiddenInputs, createFieldState } from 'entasis/field';

	const plans = ['free', 'pro'];
	const field = createFieldState({
		id: 'plan',
		type: 'select',
		name: 'plan',
		value: 'free',
		errors: [],
		focused: false
	});
	const nextPlan = () => plans[(plans.indexOf(field.value ?? '') + 1) % plans.length];
</script>

<Field {field} label="Plan" labelFor={false}>
	<button type="button" {@attach field.control} onclick={() => field.setValue(nextPlan())}>
		{field.value}
	</button>
	<FieldHiddenInputs {field} value={field.value} />
</Field>
\`\`\`

## Form participation

A Form input with type: 'field' supplies fieldType and a snippet accepting FieldState<fieldType>.
The entry inherits InputProps, including defaultValue, required, disabled, readOnly, messages,
size, density, onValidate, and onValueChange. The controller receives the resolved Form size and
density. Its value participates in inferred values, validation, submission, and Form bind:value.
The existing type: 'custom' entry remains display-only and contributes no value key.
`;
