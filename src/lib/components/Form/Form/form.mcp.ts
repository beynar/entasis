export const formDescription = `
# Form

Form renders configured entasis fields inside a div, owns their state and validation, and submits programmatically. It provides managed Enter-key navigation and submission, but not native form events, browser constraint validation, or FormData behavior. For a plain <form> (a SvelteKit form action), use the controls directly: each submits its name and value through hidden inputs, follows the form's reset, and accepts a form prop when it sits outside the form.

## Basic usage

\`\`\`svelte
<script lang="ts">
	import {
		Form,
		type FormState,
		type InferFormValue,
		type LiveFormValue
	} from 'entasis/form';

	const inputs = {
		identity: {
			type: 'group',
			label: 'Identity',
			description: 'Core account details',
			columns: 2,
			inputs: {
				name: { type: 'text', label: 'Name', required: true },
				email: { type: 'email', label: 'Email', required: true }
			}
		}
	} as const;

	let value = $state<LiveFormValue<typeof inputs>>({ name: 'Ada' });
	let form = $state<FormState<typeof inputs>>();
	let submitted = $state<InferFormValue<typeof inputs> | null>(null);
</script>

<Form
	{inputs}
	bind:value
	bind:form
	variant="card"
	layout="horizontal"
	size="small"
	density="normal"
	actions={[
		{
			children: 'Save',
			onAction: (payload) => payload.submit()
		}
	]}
	onSubmit={(validatedValue) => {
		submitted = validatedValue;
	}}
/>
\`\`\`

## Props

- **inputs** (required): ordered object keyed by entry name. Entries may be value-bearing fields, visual groups, action-button rows, or custom snippets. Only fields contribute keys to the live and validated values.
- **value** (bindable): controlled partial live value. Visible mounted fields are published; hidden fields are omitted. A supplied top-level value takes precedence over an input's configured value.
- **defaultValue**: initial partial live value when value is omitted.
- **onValueChange**: called once when a user changes the visible live value. Parent value updates do not emit it.
- **form** (bindable): the FormState instance.
- **onSubmit**: called with the validated visible payload. Its return value is ignored; rejected promises propagate.
- **size**: small, normal (default), or large. Controls Form typography and becomes the fallback size for fields and actions. An explicit field or action size takes precedence.
- **density**: compact, normal (default), or comfortable. Controls gaps between the Form header, fields, footer, and actions independently from size.
- **variant**: plain (default), sectioned, or card. All variants consume the shared Card typography. Plain remains transparent without separators. Sectioned stays transparent and adds edge-to-edge separators between the header, visible top-level fields or groups, and footer. Card adds the same separators inside the Card surface and inset; Card header/footer padding applies only to that variant. Separators do not appear between fields inside a group.
- **layout**: vertical (default) or horizontal. Horizontal keeps one field per row and places labels to the left once each field is at least 32rem wide; fields remain stacked in narrower forms.
- **actions**: optional array of Button props. Each action's onAction receives the live FormState, so a submit action calls form.submit(). Actions are disabled while the form is submitting; their own loading and disabled props are composed with that protection.
- **validationMode**: submit (default), blur, or change. When a field validates by itself besides a submit: submit waits for the first submit attempt and then re-validates each edited field, blur validates when focus leaves the field, change validates on every accepted change. A field that shows an error always re-validates as it is edited. A field's own validationMode takes precedence, and mounting never validates.
- **validationDebounce**: milliseconds an edit waits before the validation it triggers, so an async onValidate is not called on every keystroke. Submit and blur validate at once. A field's own validationDebounce takes precedence.
- **errors**: errors from outside the form, for example a SvelteKit ActionData, keyed by field name with one message or a list of them. They show under their fields, survive validation, do not block a submit (the server re-checks), and clear when that field's value next changes. Changing the prop replaces the errors; the first errored field in render order is revealed.
- **disabled**: disables every field, for example disabled={form.loading} while a submission runs. Disabled fields skip validation and, as in a native form, are left out of the submitted value. The root carries data-disabled.
- **readOnly**: makes every field read-only. Values stay focusable, validated and submitted, but users cannot change them. The root carries data-readonly.
- **class**: additional classes on the root div.
- **theme**: Form theme overrides for root, header, title, description, group, group label/description/fields, top-level items, custom entries, footer, and actions. Global Card typography and section-rhythm changes flow into all Form variants before Form-specific overrides are composed; Card surface changes apply only to the card variant.

The **header**, **title**, **description**, **children**, and **footer** snippets each receive the FormState instance directly. No-argument snippets remain valid.

Field wrapper attributes and native control attributes have separate owners. Use fieldAttrs for the shared Field wrapper. Controls expose a typed bag for their actual native element, such as inputAttrs on TextInput, textareaAttrs on TextArea, and triggerAttrs on the custom Select's combobox button.

## FormState

- **value**: current visible partial value.
- **loading**: true while a submission is pending: async validators first, then the handler.
- **hasError**: true after validation fails or errors are set from outside; reset after successful validation.
- **dirty**: true when any field differs from its initial value (null, an empty string and an empty list count as equal).
- **touched**: true once focus has entered and left any field.
- **validating**: true while an async onValidate of any field is pending.
- **submitCount**: how many times the form was validated to submit.
- **validate(options?)**: validates every visible, enabled field synchronously and returns the validated visible payload, or false after revealing the first invalid field. Disabled fields are skipped and left out of the payload. Pass { reveal: false } to check quietly: no scrolling, no focus, and the call does not count as a submit attempt. It does not wait for async validators.
- **validateAsync(options?)**: like validate, and waits for async validators; returns a promise.
- **validateField(name)**: validates one field now and returns whether it is valid. It neither scrolls nor focuses. A name that is not a visible field returns false; a disabled field skips validation and returns true; a field whose async validator is still running returns false, so use validateAsync to wait.
- **submit()**: returns a promise of the validated visible payload, or false. It waits for pending async validators. Concurrent calls share the active promise.
- **setErrors(errors)**: shows errors from outside the form under their fields, replacing those set before; setErrors({}) clears them. Call it from onSubmit with the server response. The first errored field in render order is revealed once the submission ends.
- **reset(value?)**: restores every field to its initial value, or to value where it gives one, and makes that the new baseline. Errors, touched, dirty and the submit count clear, fields do not echo onValueChange, and the form's onValueChange runs once if the visible value changed. Conditional visibility is evaluated again.
- **advanceFrom(field)**: moves on from a registered field as Enter does in a text field: the last navigable field submits, any other validates and focuses the next field when valid. Returns false when the field is hidden, disabled or not part of this form. Controls that own Enter themselves, such as checkboxes and radios, call it from their key handler and fall back to the native form otherwise.

## Enter-key behavior

On an enabled, editable single-line input, Enter validates the current field. A valid field moves focus to the next visible enabled field, while an invalid field remains focused and displays its errors. Enter on a valid final navigable field calls form.submit(). Multiline editors and controls that already own Enter, such as selects and combobox menus, keep their native component behavior. A control that owns Enter can continue the flow with form.advanceFrom(field). Modified, repeated, and IME-composition Enter events are ignored.

## Programmatic Dialog forms

Mount one Ask host near the application root, then call ask() from any client-side event. Both exports come from entasis/form:

\`\`\`svelte
<script lang="ts">
	import { Ask, ask } from 'entasis/form';

	const inputs = {
		name: { type: 'text', label: 'Name', required: true },
		email: { type: 'email', label: 'Email', required: true }
	} as const;

	async function editProfile() {
		const outcome = await ask({
			title: 'Edit profile',
			description: 'Review the account details.',
			inputs,
			value: { name: 'Ada' },
			confirm: 'Save',
			cancel: 'Cancel'
		});

		if (outcome.submitted) {
			// outcome.value is InferFormValue<typeof inputs>
		} else {
			// outcome.value is the partial, visible live value at cancellation
		}
	}
</script>

<Ask />
\`\`\`

AskOptions accepts inputs, value, onSubmit, class, size, density, variant, layout, theme, validationMode, and validationDebounce with the same contracts as Form. Disabled fields are left out of the result. title is required for the Dialog's accessible name. confirm and cancel accept a string or Button presentation props plus text. Their click, loading, link, and native type behavior is owned by Ask. Set type on the mounted Ask host for its default Dialog type; a request's optional dialog object may override type and also accepts responsive, size, and scroll.

Validation failures keep the Dialog open and focus the first invalid field. A successful submission resolves with the validated visible payload. Cancel, the close button, and Escape resolve with submitted: false and the current partial visible value. Outside-click and swipe dismissal are disabled. While submission is active, all close paths and actions are protected. Rejected onSubmit promises reject ask() after the Dialog closes. Concurrent ask() calls render as independent stacked Dialogs. Calling ask() during SSR or without one mounted host rejects clearly.

## Visibility and values

The visible prop may be a boolean or a predicate receiving the complete private value cache:

\`\`\`svelte
<Form
	inputs={{
		contactMethod: {
			type: 'select',
			label: 'Contact method',
			items: [
				{ label: 'Email', value: 'email' },
				{ label: 'Phone', value: 'phone' }
			]
		},
		phone: {
			type: 'phone',
			label: 'Phone',
			visible: (value) => value.contactMethod === 'phone'
		}
	}}
/>
\`\`\`

Hidden field values are preserved privately and restored when shown again. Hidden fields are excluded from value, validation, and submission. Removing an input definition removes its cached value.

## Field label position

All configured inputs inherit the Form layout through the shared Field wrapper. Set labelPosition: 'top' or 'left' on an individual input to override the Form layout without affecting value inference:

\`\`\`ts
export const inputs = {
	name: { type: 'text', label: 'Name' },
	notes: { type: 'textarea', label: 'Notes', labelPosition: 'top' }
} as const;
\`\`\`

The left position becomes a two-column label/control layout once the field is at least 32rem wide and remains stacked in narrower forms. The breakpoint is a container query against the field, so a form in a narrow drawer stacks on any screen. Form uses layout rather than orientation so controls such as Slider retain their own orientation prop.

## Visual groups

A group renders a transparent semantic fieldset with a required legend label and an optional description. Its label and description use the same size scale as ordinary fields; grouping does not add another card or padded container:

\`\`\`ts
import type { InferFormValue } from 'entasis/form';

export const inputs = {
	contact: {
		type: 'group',
		label: 'Contact details',
		description: 'How we can reach you',
		columns: 1,
		inputs: {
			email: { type: 'email', label: 'Email', required: true },
			phone: { type: 'phone', label: 'Phone' }
		}
	}
} as const;

type Value = InferFormValue<typeof inputs>;
// { email: string; phone: string | null }
\`\`\`

Set disabled on a group to disable every field inside it, as a native disabled fieldset does (the fieldset renders disabled and data-disabled), or readOnly to make them read-only (data-readonly). A field is disabled or read-only when it, its group, or the Form is.

The group key is visual only and never appears in value or submission output. Descendant field names remain top-level, so duplicate names across groups are rejected. Group visibility hides all descendants, preserves field values in the private cache, and makes inferred field keys optional. In a vertical form layout, set columns to 1, 2, 3, or 4 to control the equal-width grid; the count is a container query against the form width (2 columns from 42rem, 3 from 56rem, 4 from 72rem), and groups collapse to one column in narrower forms. Horizontal form layouts ignore columns and always render group entries in one column. A child class may span tracks when an entry needs more room. Groups may contain fields, action rows, and custom snippets; nested groups are intentionally unsupported.

## Custom value fields

Use type: 'field' when Form must own a value but a custom control must render it. fieldType selects the existing FieldState schema and inferred value type. The snippet receives that registered FieldState controller:

\`\`\`svelte
{#snippet handleControl(field)}
	<input
		{...field.controlAttrs}
		{@attach field.control}
		bind:value={field.value}
	/>
{/snippet}

<Form
	inputs={{
		handle: {
			type: 'field',
			fieldType: 'text',
			label: 'Handle',
			required: true,
			snippet: handleControl
		}
	}}
/>
\`\`\`

The controller exposes value, disabled, required, validation state, accessible ids, controlAttrs, and the control attachment. The entry participates in bind:value, visibility, validation, submission, and InferFormValue through the same FieldState owner as built-in controls.

## App-defined input types

An app can add its own input types to every Form and ask() dialog, by name, so entries stay plain data that serializes (JSON from a server, a tool call, a database). Two steps, once per app.

Type it: augment \`FormInputRegistry\` with the value the input holds and the props its entries take.

\`\`\`ts
// doc-fence: skip (imports a sibling component; tooling/component-contract/consumer-form-input.ts checks this exact setup against the package)
import { registerFormInputs } from 'entasis/form';
import MoneyInput from './MoneyInput.svelte';

export type Money = { amount: number; currency: string };

declare module 'entasis/form' {
	interface FormInputRegistry {
		money: { value: Money; props: { currencies?: string[] } };
	}
}

registerFormInputs({
	money: {
		component: MoneyInput,
		isEmpty: (value) => value?.amount === undefined,
		validate: (value) => (value.amount < 0 ? 'Must not be negative' : null)
	}
});
\`\`\`

Register it: call registerFormInputs at the top level of a module the server and the browser both load before a form renders, such as one the root layout imports. Its keys are checked against the registry; built-in type names are refused, and registering a type again replaces it.

The component renders the control alone. Form wraps it in Field (label, description, errors) and hands it the field it registered, typed from the registry, plus the entry's own props:

\`\`\`svelte
<!-- doc-fence: skip -->
<!-- Needs the money registration above; tooling/component-contract/consumer-money-input.svelte is the checked copy. -->
<script lang="ts">
	import type { FormInputComponentProps } from 'entasis/form';

	let { field, currencies = ['EUR'] }: FormInputComponentProps<'money'> = $props();
	const currency = $derived(field.value?.currency ?? currencies[0] ?? 'EUR');
</script>

<input
	type="number"
	{...field.controlAttrs}
	{@attach field.control}
	value={field.value?.amount ?? ''}
	oninput={(event) => field.setValue({ amount: Number(event.currentTarget.value), currency })}
/>
\`\`\`

Entries then use the type like a built-in one, in Form inputs, groups, and ask():

\`\`\`ts
// doc-fence: skip (needs the money registration above)
const result = await ask({
	title: 'Set a price',
	confirm: 'Save',
	cancel: 'Cancel',
	inputs: { price: { type: 'money', label: 'Price', required: true, currencies: ['EUR', 'USD'] } }
});
if (result.submitted) result.value.price; // Money
\`\`\`

Every Field entry option applies (label, description, required, disabled, readOnly, messages, size, density, visible, defaultValue, onValidate, onValueChange, slots); any other key goes to the component. required rejects what isEmpty reports empty (by default null, undefined, an empty string, or an array with no values) with the catalog required message, and isEmpty also decides whether the field reads as filled; validate runs for every entry of the type, before the entry's own onValidate. The value takes part in bind:value, visibility, validation, submission, and InferFormValue like a built-in input's. An entry whose type is neither built-in nor registered throws when the form reads it.

## Non-value entries

Use type: 'action' to place a labelled row of buttons in the ordered inputs flow. It accepts optional label and description content plus the same Form-aware action objects as the top-level actions prop. Its label position follows the Form layout unless labelPosition overrides it. Form size is the default button size, action density follows the Form, and loading or disabled protection cannot be overridden while the Form is submitting.

Use type: 'custom' to place a snippet in the flow. The snippet receives the live public FormState and owns its own surface and padding; Form adds neither. Both entry types support class and visible, may appear at the top level or inside a group, and are omitted from bind:value, validation, and inferred submission output:

\`\`\`svelte
{#snippet accountStatus(form)}
	<p>{Object.keys(form.value).length} visible values</p>
{/snippet}

<Form
	inputs={{
		name: { type: 'text', label: 'Name', required: true },
		status: { type: 'custom', snippet: accountStatus },
		controls: {
			type: 'action',
			label: 'Account actions',
			description: 'Validate or save this account.',
			actions: [
				{ children: 'Validate', variant: 'soft', onAction: (payload) => payload.validate() },
				{ children: 'Save', onAction: (payload) => payload.submit() }
			]
		}
	}}
/>
\`\`\`

For this configuration, InferFormValue contains name only; status and controls are presentation keys.

## Validation

Built-in validation uses the field schema. Every message a user sees comes from the i18n catalog in the active locale, never from the validation library: an empty required field shows one required message (for a checkbox or switch, that it must be on), and email, URL, length, range and incomplete-code failures each have their own message. Override them per entry with messages:

\`\`\`ts
import type { FormInputs } from 'entasis/form';

export const inputs = {
	name: { type: 'text', label: 'Name', required: true, messages: { required: 'Enter your name' } },
	code: {
		type: 'pin',
		label: 'Code',
		length: 6,
		required: true,
		messages: { incomplete: (length) => 'Enter the ' + length + '-digit code' }
	}
} satisfies FormInputs;
\`\`\`

onValidate may return:

- false, null, undefined, an empty string, or an empty array for valid input;
- true for the catalog's generic invalid message;
- a string for one error, shown verbatim;
- a string array for multiple errors.

Validation runs on submission. Failed submission scrolls to and focuses the first invalid control in render order. Disabled fields, directly or through a disabled group or Form, skip validation and are left out of the submitted value, as in a native form; entries that declare disabled become optional keys in InferFormValue. Read-only fields still validate and submit.

### When fields validate

validationMode on the Form, or on one entry, picks when a field validates by itself:

\`\`\`ts
import type { FormInputs } from 'entasis/form';

export const inputs = {
	username: { type: 'text', label: 'Username', required: true, validationMode: 'change' },
	email: { type: 'email', label: 'Email', required: true }
} satisfies FormInputs;
// <Form {inputs} validationMode="blur" />: email validates when focus leaves it,
// username validates on every change.
\`\`\`

submit (the default) validates on a submit attempt, and from then on re-validates each edited field. blur validates when focus leaves the field, including a popup the field opened. change validates on every accepted change, including values synced from a parent. Whatever the mode, a field that shows an error re-validates as it is edited, and a blur that settles the value (trimming, say) validates the settled value. validationDebounce delays the validation an edit triggers; submit and blur never wait.

### Async validators

onValidate may return a promise. While it is pending the field is neither valid nor invalid: no aria-invalid and no data-invalid, and its root carries data-validating. A result for an older value is dropped, a rejected promise marks the field invalid with the generic message, and unmounting cancels the work. submit() waits for pending validators before it calls onSubmit (loading is true meanwhile); validate() stays synchronous, so use validateAsync() to wait.

\`\`\`ts
import type { FormInputs } from 'entasis/form';

declare function isTaken(username: string): Promise<boolean>;

export const inputs = {
	username: {
		type: 'text',
		label: 'Username',
		required: true,
		onValidate: async (username) => ((await isTaken(username)) ? 'That username is taken' : null)
	}
} satisfies FormInputs;
\`\`\`

### Server errors

Pass the errors of a failed save as the errors prop or call form.setErrors(). They show under their fields, are not wiped by validation, do not block a re-submit, and clear on that field's next change:

\`\`\`svelte
<script lang="ts">
	import { Form, type FormState, type FormInputs } from 'entasis/form';

	const inputs = {
		email: { type: 'email', label: 'Email', required: true }
	} satisfies FormInputs;

	let form = $state<FormState<typeof inputs>>();
</script>

<Form
	{inputs}
	bind:form
	onSubmit={async (value) => {
		const response = await fetch('/api/signup', { method: 'POST', body: JSON.stringify(value) });
		if (!response.ok) form?.setErrors({ email: 'Already registered' });
	}}
/>
\`\`\`

### Dirty, touched and reset

Every field reports touched, dirty and filled (data-touched, data-dirty and data-filled on its root); form.dirty and form.touched are true when any field is. form.reset() returns every field to its initial value and clears errors, touched and dirty; form.reset(value) restores the given values instead and makes them the new baseline.

Errors fade and grow in; reduced motion and the Theme motion tokens apply (the field theme motion slot).

## Supported input types

text, email, url, password, number, rating, voice, slider, slider-range, textarea, rich-text, select, combobox, radio, checkboxes, checkbox, switch, phone, calendar, calendar-range, date, datetime, color, file, files, tag-group, tag, keyvalue, pin, and time.

Alternative displays are display: 'selector' for date and calendar-range, and display: 'picker' for color.

field is the custom value-bearing entry. group, action, and custom are structural visual nodes rather than value-bearing input types.
`;
