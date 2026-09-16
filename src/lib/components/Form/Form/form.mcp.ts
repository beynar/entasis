export const formDescription = `
# Form

Form renders configured svelai fields inside a div, owns their state and validation, and submits programmatically. It provides managed Enter-key navigation and submission, but not native form events, browser constraint validation, or FormData behavior.

## Basic usage

\`\`\`svelte
<script lang="ts">
	import {
		Form,
		type FormState,
		type InferFormValue,
		type LiveFormValue
	} from 'svelai/form';

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
- **class**: additional classes on the root div.
- **theme**: Form theme overrides for root, header, title, description, group, group label/description/fields, top-level items, custom entries, footer, and actions. Global Card typography and section-rhythm changes flow into all Form variants before Form-specific overrides are composed; Card surface changes apply only to the card variant.

The **header**, **title**, **description**, **children**, and **footer** snippets each receive the FormState instance directly. No-argument snippets remain valid.

Field wrapper attributes and native control attributes have separate owners. Use fieldAttrs for the shared Field wrapper. Controls expose a typed bag for their actual native element, such as inputAttrs on TextInput, textareaAttrs on TextArea, and triggerAttrs on the custom Select's combobox button.

## FormState

- **value**: current visible partial value.
- **loading**: true while the active submission handler is pending.
- **hasError**: true after validation fails; reset after successful validation.
- **validate()**: returns the validated visible payload, or false.
- **submit()**: returns a promise of the validated visible payload, or false. Concurrent calls share the active promise.

## Enter-key behavior

On an enabled, editable single-line input, Enter validates the current field. A valid field moves focus to the next visible enabled field, while an invalid field remains focused and displays its errors. Enter on a valid final navigable field calls form.submit(). Multiline editors and controls that already own Enter, such as selects and combobox menus, keep their native component behavior. Modified, repeated, and IME-composition Enter events are ignored.

## Programmatic Dialog forms

Mount one Ask host near the application root, then call ask() from any client-side event. Both exports come from svelai/form:

\`\`\`svelte
<script lang="ts">
	import { Ask, ask } from 'svelai/form';

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

AskOptions accepts inputs, value, onSubmit, class, size, density, variant, layout, and theme with the same contracts as Form. title is required for the Dialog's accessible name. confirm and cancel accept a string or Button presentation props plus text. Their click, loading, link, and native type behavior is owned by Ask. Set type on the mounted Ask host for its default Dialog type; a request's optional dialog object may override type and also accepts responsive, size, and scroll.

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
import type { InferFormValue } from 'svelai/form';

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

Built-in validation uses the field schema and preserves its issue messages. onValidate may return:

- false, null, undefined, an empty string, or an empty array for valid input;
- true for a generic error;
- a string for one error;
- a string array for multiple errors.

Validation runs on submission. After a field has an error, it revalidates while edited. Failed submission scrolls to and focuses the first invalid control.

## Supported input types

text, email, url, password, number, rating, voice, slider, slider-range, textarea, rich-text, select, combobox, radio, checkboxes, checkbox, switch, phone, calendar, calendar-range, date, datetime, color, file, files, tag-group, tag, keyvalue, pin, and time.

Alternative displays are display: 'selector' for date and calendar-range, and display: 'picker' for color.

field is the custom value-bearing entry. group, action, and custom are structural visual nodes rather than value-bearing input types.
`;
