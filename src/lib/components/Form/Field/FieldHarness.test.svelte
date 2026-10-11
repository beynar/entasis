<script lang="ts">
	// Harness for field.svelte.test.ts and field.browser.test.ts: a standalone FieldState with the
	// options under test, plus Form and fieldset groups, locales and a popup the field owns. Tests
	// mount it inside a <Theme> (ThemeProviderHarness), as an app renders its fields.
	import { untrack } from 'svelte';
	import Popover from '../../Popover/Popover.svelte';
	import { setI18n } from '$lib/i18n/context.svelte.js';
	import { locales, type LocaleCode } from '$lib/i18n/locales.js';
	import Form from '../Form/Form.svelte';
	import type { FormInputs } from '../Form/form.js';
	import TextInput from '../TextInput/TextInput.svelte';
	import { Field, createFieldState, type FieldState } from './index.js';
	import type { FieldMessageOverrides } from './field.messages.js';
	import type { FieldType, FieldValue } from './field.js';
	import type { FieldValidationResult } from './field.state.svelte.js';

	type Scenario = 'standalone' | 'form' | 'fieldset' | 'popup';

	let {
		scenario = 'standalone',
		locale = 'en',
		type = 'text',
		required = false,
		disabled = false,
		readOnly = false,
		messages,
		minLength,
		onValidate,
		value = $bindable(null),
		errors = $bindable([]),
		focused = $bindable(false),
		description,
		helper,
		labelFor,
		showControl = true,
		controlRole,
		controlLabel,
		requiredEmpty = false,
		formDisabled = false,
		formReadOnly = false,
		groupDisabled = false,
		groupReadOnly = false,
		onSubmit,
		onField
	}: {
		scenario?: Scenario;
		locale?: LocaleCode;
		type?: FieldType;
		required?: boolean;
		disabled?: boolean;
		readOnly?: boolean;
		messages?: FieldMessageOverrides;
		minLength?: number;
		onValidate?: (value: FieldValue<FieldType>) => FieldValidationResult;
		value?: unknown;
		errors?: string[] | boolean;
		focused?: boolean;
		description?: string;
		helper?: string;
		labelFor?: string | false;
		showControl?: boolean;
		controlRole?: string;
		controlLabel?: string;
		requiredEmpty?: boolean;
		formDisabled?: boolean;
		formReadOnly?: boolean;
		groupDisabled?: boolean;
		groupReadOnly?: boolean;
		onSubmit?: (value: Record<string, unknown>) => void;
		onField?: (field: FieldState<FieldType>) => void;
	} = $props();

	setI18n(() => locales[locale].messages);

	const field = createFieldState<FieldType>({
		id: 'harness',
		get type() {
			return type;
		},
		get required() {
			return required;
		},
		get disabled() {
			return disabled;
		},
		get readOnly() {
			return readOnly;
		},
		get messages() {
			return messages;
		},
		get minLength() {
			return minLength;
		},
		get onValidate() {
			return onValidate;
		},
		get value() {
			return value as never;
		},
		set value(next) {
			value = next;
		},
		get errors() {
			return errors;
		},
		set errors(next) {
			errors = next;
		},
		get focused() {
			return focused;
		},
		set focused(next) {
			focused = next;
		}
	});
	untrack(() => onField)?.(field);

	const formInputs = $derived({
		outside: { type: 'text', label: 'Outside', defaultValue: 'Ada' },
		...(requiredEmpty ? { nickname: { type: 'text', label: 'Nickname', required: true } } : {}),
		account: {
			type: 'group',
			label: 'Account',
			get disabled() {
				return groupDisabled;
			},
			get readOnly() {
				return groupReadOnly;
			},
			inputs: {
				email: { type: 'email', label: 'Email', required: true, defaultValue: 'ada@example.com' }
			}
		}
	} satisfies FormInputs);
</script>

<button type="button">Before</button>
{#if scenario === 'standalone'}
	<Field
		{field}
		label="Name"
		{description}
		{helper}
		labelFor={labelFor ?? field.id}
		fieldAttrs={{ 'data-testid': 'field-root' }}
	>
		{#if showControl}
			<input
				{...field.controlAttrs}
				role={controlRole}
				aria-label={controlLabel}
				{@attach field.control}
				value={(field.value as string | null) ?? ''}
				oninput={(event) => field.setValue(event.currentTarget.value as never)}
				data-testid="control"
			/>
		{/if}
		{#snippet suffix()}
			<button type="button">Action</button>
		{/snippet}
	</Field>
	<button type="button" onclick={() => field.validate()}>Validate</button>
{:else if scenario === 'form'}
	<Form
		inputs={formInputs}
		disabled={formDisabled}
		readOnly={formReadOnly}
		onSubmit={(next) => onSubmit?.(next)}
	>
		{#snippet children(form)}
			<button type="button" onclick={() => form.submit()}>Submit</button>
		{/snippet}
	</Form>
{:else if scenario === 'fieldset'}
	<Field {field} as="fieldset" label="Group" fieldAttrs={{ 'data-testid': 'field-root' }}>
		<TextInput label="Nested" name="nested" defaultValue="Inner" />
	</Field>
{:else if scenario === 'popup'}
	<Field {field} label="Name" fieldAttrs={{ 'data-testid': 'field-root' }}>
		<input
			{...field.controlAttrs}
			{@attach field.control}
			value={(field.value as string | null) ?? ''}
			data-testid="control"
		/>
		{#snippet suffix()}
			<Popover trigger={{ content: 'Suggestions' }} position="bottom-start">
				<button type="button">Inside popup</button>
			</Popover>
		{/snippet}
	</Field>
{/if}
<button type="button">After</button>
