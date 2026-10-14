<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import {
		ask,
		Form,
		type AskResult,
		type FormInputAction,
		type FormInputState,
		type FormState,
		type FormInputs,
		type InferFormValue,
		type LiveFormValue
	} from '$lib/components/Form/Form/index.js';
	import {
		MultiStepForm,
		type FormStep,
		type MergedMultiStepFormInputs
	} from '$lib/components/Form/MultiStepForm/index.js';
	import CheckboxesInput from '$lib/components/Form/CheckboxesInput/CheckboxesInput.svelte';
	import Select from '$lib/components/Form/Select/Select.svelte';
	import Switch from '$lib/components/Form/Switch/Switch.svelte';
	import TextInput from '$lib/components/Form/TextInput/TextInput.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	// Registers the docs' app-defined `money` input type, as an app's root layout would.
	import './demos/moneyInput.js';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { I18n, type LocaleCode } from '$lib/i18n/index.js';

	const profileInputs = {
		identity: {
			type: 'group',
			label: 'Identity',
			description: 'Core account details are grouped visually without nesting their values.',
			columns: 2,
			inputs: {
				name: {
					type: 'text',
					label: 'Name',
					placeholder: 'Ada Lovelace',
					required: true,
					class: 'col-span-1',
					onValidate: (name) => (name.length < 2 ? 'Enter at least two characters' : false)
				},
				email: {
					type: 'email',
					label: 'Email',
					placeholder: 'ada@example.com',
					required: true,
					class: 'col-span-1'
				}
			}
		},
		role: {
			type: 'select',
			label: 'Role',
			items: [
				{ label: 'Engineer', value: 'engineer' },
				{ label: 'Designer', value: 'designer' }
			],
			value: 'engineer'
		}
	} satisfies FormInputs;

	const contactInputs = {
		contactMethod: {
			type: 'select',
			label: 'Preferred contact method',
			items: [
				{ label: 'Email', value: 'email' },
				{ label: 'Phone', value: 'phone' }
			],
			value: 'email'
		},
		phone: {
			type: 'phone',
			label: 'Phone number',
			placeholder: '+33 6 00 00 00 00',
			required: true,
			visible: (value) => value.contactMethod === 'phone'
		},
		notes: {
			type: 'textarea',
			label: 'Notes',
			placeholder: 'Optional context',
			labelPosition: 'top'
		}
	} satisfies FormInputs;

	const askInputs = {
		displayName: {
			type: 'text',
			label: 'Display name',
			placeholder: 'Ada Lovelace',
			required: true
		},
		email: {
			type: 'email',
			label: 'Email',
			placeholder: 'ada@example.com',
			required: true
		},
		biography: {
			type: 'textarea',
			label: 'Biography',
			placeholder: 'A short introduction'
		}
	} satisfies FormInputs;

	const multiStepAccountInputs = {
		name: {
			type: 'text',
			label: 'Name',
			placeholder: 'Ada Lovelace',
			required: true
		},
		email: {
			type: 'email',
			label: 'Email',
			placeholder: 'ada@example.com',
			required: true
		}
	} satisfies FormInputs;

	const multiStepPreferenceInputs = {
		plan: {
			type: 'select',
			label: 'Plan',
			required: true,
			items: [
				{ label: 'Personal', value: 'personal' },
				{ label: 'Team', value: 'team' }
			]
		},
		productUpdates: {
			type: 'switch',
			label: 'Receive product updates'
		}
	} satisfies FormInputs;

	const multiStepItems: [
		FormStep<typeof multiStepAccountInputs>,
		FormStep<typeof multiStepPreferenceInputs>
	] = [
		{
			title: 'Account',
			description: 'Enter the details used to create the account.',
			inputs: multiStepAccountInputs
		},
		{
			title: 'Preferences',
			description: 'Choose the initial account preferences.',
			inputs: multiStepPreferenceInputs
		}
	];

	type MultiStepInputs = MergedMultiStepFormInputs<typeof multiStepItems>;

	const controls = createComponentControls([
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'plain',
			options: ['plain', 'sectioned', 'card']
		},
		{
			name: 'layout',
			type: 'segmented',
			label: 'Layout',
			value: 'vertical',
			options: ['vertical', 'horizontal']
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: ['compact', 'normal', 'comfortable']
		},
		{ name: 'showHeader', type: 'switch', label: 'Header', value: true },
		{ name: 'showActions', type: 'switch', label: 'Actions', value: true }
	]);
	const multiStepControls = createComponentControls([
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'plain',
			options: ['plain', 'sectioned', 'card']
		}
	]);

	const fieldStateControls = createComponentControls([
		{
			name: 'locale',
			type: 'segmented',
			label: 'Locale',
			value: 'en',
			options: ['en', 'fr', 'ja', 'ar']
		},
		{ name: 'disabled', type: 'switch', label: 'Form disabled', value: false },
		{ name: 'readOnly', type: 'switch', label: 'Form read-only', value: false },
		{ name: 'groupDisabled', type: 'switch', label: 'Group disabled', value: false },
		{ name: 'groupReadOnly', type: 'switch', label: 'Group read-only', value: false }
	]);
	const fieldStateInputs = $derived({
		account: {
			type: 'group',
			label: 'Account',
			description: 'A disabled or read-only group affects only its own fields.',
			disabled: fieldStateControls.value.groupDisabled,
			readOnly: fieldStateControls.value.groupReadOnly,
			inputs: {
				nickname: {
					type: 'text',
					label: 'Nickname',
					required: true,
					messages: { required: 'Pick a nickname' },
					class: 'col-span-1'
				},
				email: { type: 'email', label: 'Email', required: true, class: 'col-span-1' }
			}
		},
		terms: { type: 'switch', label: 'Accept the terms', labelPosition: 'top', required: true },
		score: {
			type: 'rating',
			label: 'Rating',
			description: 'Read-only: focusable and announced, still submitted.',
			defaultValue: 4,
			readOnly: true
		}
	} satisfies FormInputs);
	let fieldStateSubmission = $state<InferFormValue<typeof fieldStateInputs> | null>(null);
	const describeFieldState = (form: Pick<FormInputState, 'fields'>) =>
		Object.fromEntries(
			[...form.fields].map(([name, field]) => [
				name,
				[
					field.focused && 'focused',
					field.touched && 'touched',
					field.dirty && 'dirty',
					field.filled && 'filled',
					field.hasError && 'invalid',
					field.disabled && 'disabled',
					field.readOnly && 'read-only'
				]
					.filter(Boolean)
					.join(' ')
			])
		);

	const validationControls = createComponentControls([
		{
			name: 'validationMode',
			type: 'segmented',
			label: 'Validation mode',
			value: 'submit',
			options: ['submit', 'blur', 'change']
		},
		{ name: 'debounce', type: 'switch', label: 'Debounce 400 ms', value: false }
	]);
	const takenUsernames = ['ada', 'admin', 'grace'];
	const validationInputs = {
		username: {
			type: 'text',
			label: 'Username',
			description: 'Asynchronous check: "ada", "admin" and "grace" are taken.',
			required: true,
			// A stand-in for a server call; the field is neutral while it runs and submit waits.
			onValidate: (name: string) =>
				new Promise<string | null>((resolve) =>
					setTimeout(
						() =>
							resolve(
								takenUsernames.includes(name.toLowerCase()) ? 'That username is taken' : null
							),
						600
					)
				)
		},
		email: { type: 'email', label: 'Email', required: true },
		code: {
			type: 'text',
			label: 'Invite code',
			description: 'Disabled: skipped by validation and left out of the submitted value.',
			defaultValue: 'BETA',
			required: true,
			disabled: true
		}
	} satisfies FormInputs;
	let validationSubmitted = $state<InferFormValue<typeof validationInputs> | null>(null);
	const describeValidation = (form: FormState<typeof validationInputs>) => ({
		dirty: form.dirty,
		touched: form.touched,
		validating: form.validating,
		submitCount: form.submitCount,
		submitted: validationSubmitted
	});

	let profileValue = $state<LiveFormValue<typeof profileInputs>>({ name: 'Ada' });
	let profileSubmission = $state<InferFormValue<typeof profileInputs> | null>(null);
	let contactValue = $state<LiveFormValue<typeof contactInputs>>({});
	let contactSubmission = $state<InferFormValue<typeof contactInputs> | null>(null);
	let askOutcome = $state<AskResult<typeof askInputs> | null>(null);
	let askError = $state<string | null>(null);
	let multiStepValue = $state<LiveFormValue<MultiStepInputs>>({ name: 'Ada Lovelace' });
	let multiStepSubmission = $state<InferFormValue<MultiStepInputs> | null>(null);

	const profileActions: FormInputAction[] = [
		{
			children: 'Use Grace Hopper',
			variant: 'soft',
			onAction: () => {
				profileValue = { ...profileValue, name: 'Grace Hopper' };
			}
		},
		{
			children: 'Save profile',
			onAction: (form) => form.submit()
		}
	];

	// App-defined input types are plain data: this object could arrive as JSON.
	const pricingInputs = {
		price: {
			type: 'money',
			label: 'Price',
			description: 'An app-defined input type, named like a built-in one.',
			required: true
		},
		deposit: { type: 'money', label: 'Deposit', currencies: ['EUR'] }
	} as const satisfies FormInputs;
	let pricingValue = $state<LiveFormValue<typeof pricingInputs>>({});
	let pricingSubmitted = $state<InferFormValue<typeof pricingInputs> | null>(null);
	let nativeSubmission = $state<string | null>(null);
	const askedPriceInputs = {
		price: { type: 'money', label: 'Price', required: true }
	} as const satisfies FormInputs;
	let askedPrice = $state<AskResult<typeof askedPriceInputs> | null>(null);

	async function askForPrice(): Promise<void> {
		askedPrice = await ask({
			title: 'Set a price',
			inputs: askedPriceInputs,
			confirm: 'Save price',
			cancel: 'Cancel'
		});
	}

	async function openProfileAsk(): Promise<void> {
		askError = null;
		try {
			askOutcome = await ask({
				title: 'Edit profile',
				description: 'Review the account details before you save them.',
				inputs: askInputs,
				value: {
					displayName: 'Ada Lovelace',
					email: 'ada@example.com'
				},
				confirm: 'Save profile',
				cancel: 'Cancel',
				density: 'compact'
			});
		} catch (error) {
			askError = error instanceof Error ? error.message : String(error);
		}
	}
</script>

{#snippet valueSummary(form: FormInputState)}
	<div class="text-neutral grid gap-1 text-sm">
		<span class="font-medium">Custom form content</span>
		<span class="text-neutral/70">{Object.keys(form.value).length} visible value keys</span>
	</div>
{/snippet}

<DocPage
	title="Form"
	subtitle="Configured fields with synchronized values, visible-only validation, and programmatic submission."
	component="Form"
	features={[
		'Typed input definitions and validated output',
		'Two-way value synchronization',
		'Conditional fields preserve hidden values',
		'Visual groups preserve flat inferred values',
		'Action and custom entries stay out of form values',
		'Disabled and read-only forms and groups',
		'Localized validation messages with per-entry overrides',
		'Touched, dirty and filled field state, with form.reset()',
		'Validation on submit, blur or change, with async validators',
		'Server errors that clear on the next edit',
		'Disabled fields left out of the submitted value',
		{ label: 'Accessible errors with first-invalid focus', test: 'a11y:form.first-invalid-focus' },
		'Programmatic submission through FormState',
		'Managed Enter navigation and submission',
		'Native <form> submission, reset and form attribute',
		'Programmatic Dialog forms through Ask',
		'Plain, sectioned, and card presentations share Card typography and section rhythm',
		'Responsive vertical and horizontal field layouts',
		'Independent size and density controls'
	]}
>
	<ComponentCard
		{controls}
		description="Compose plain, sectioned, or card presentation with vertical or responsive horizontal fields"
		class="!items-start"
		code={`{#snippet valueSummary(form)}
	<div>{Object.keys(form.value).length} visible value keys</div>
{/snippet}

<Form
	inputs={{
		...profileInputs,
		summary: { type: 'custom', snippet: valueSummary },
		controls: {
			type: 'action',
			label: 'Profile actions',
			description: 'These buttons do not add a key to the form value.',
			visible: ${controls.value.showActions},
			actions: profileActions
		}
	}}
	bind:value={profileValue}
	variant="${controls.value.variant}"
	layout="${controls.value.layout}"
	size="${controls.value.size}"
	density="${controls.value.density}"
${controls.value.showHeader ? '\ttitle="Profile"\n\tdescription="Update the profile details below."\n' : ''}	onSubmit={(value) => {
		profileSubmission = value;
	}}
/>`}
	>
		<div
			class={controls.value.layout === 'horizontal'
				? 'grid w-full max-w-3xl gap-4'
				: 'grid w-full max-w-xl gap-4'}
		>
			<Form
				inputs={{
					...profileInputs,
					summary: { type: 'custom', snippet: valueSummary },
					controls: {
						type: 'action',
						label: 'Profile actions',
						description: 'These buttons do not add a key to the form value.',
						visible: controls.value.showActions,
						actions: profileActions
					}
				} satisfies FormInputs}
				bind:value={profileValue}
				variant={controls.value.variant}
				layout={controls.value.layout}
				title={controls.value.showHeader ? 'Profile' : undefined}
				description={controls.value.showHeader
					? 'The top-level name overrides any input-level initial value.'
					: undefined}
				size={controls.value.size}
				density={controls.value.density}
				onSubmit={(value) => {
					profileSubmission = value;
				}}
			/>
			<pre
				class="bg-surface-recessed text-neutral overflow-auto rounded-lg p-3 text-xs">{JSON.stringify(
					{ value: profileValue, submitted: profileSubmission },
					null,
					2
				)}</pre>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			controls={multiStepControls}
			description="A two-step account flow with merged live values and complete final validation"
			class="!items-start"
			code={`import {
	MultiStepForm,
	type FormStep,
	type MergedMultiStepFormInputs
} from 'entasis/multi-step-form';
import type { FormInputs, InferFormValue, LiveFormValue } from 'entasis/form';

const accountInputs = {
	name: { type: 'text', label: 'Name', required: true },
	email: { type: 'email', label: 'Email', required: true }
} satisfies FormInputs;

const preferenceInputs = {
	plan: {
		type: 'select',
		label: 'Plan',
		required: true,
		items: [
			{ label: 'Personal', value: 'personal' },
			{ label: 'Team', value: 'team' }
		]
	},
	productUpdates: { type: 'switch', label: 'Receive product updates' }
} satisfies FormInputs;

const steps: [
	FormStep<typeof accountInputs>,
	FormStep<typeof preferenceInputs>
] = [
	{
		title: 'Account',
		description: 'Enter the details used to create the account.',
		inputs: accountInputs
	},
	{
		title: 'Preferences',
		description: 'Choose the initial account preferences.',
		inputs: preferenceInputs
	}
];

type Inputs = MergedMultiStepFormInputs<typeof steps>;
let value = $state<LiveFormValue<Inputs>>({});
let submission = $state<InferFormValue<Inputs> | null>(null);

<MultiStepForm
	items={steps}
	bind:value
	variant="${multiStepControls.value.variant}"
	onSubmitForm={(validatedValue) => {
		submission = validatedValue;
	}}
/>`}
		>
			<div class="grid w-full max-w-xl gap-4">
				<MultiStepForm
					items={multiStepItems}
					bind:value={multiStepValue}
					variant={multiStepControls.value.variant}
					onSubmitForm={(validatedValue) => {
						multiStepSubmission = validatedValue;
					}}
				/>
				<pre
					class="bg-surface-recessed text-neutral overflow-auto rounded-lg p-3 text-xs">{JSON.stringify(
						{ value: multiStepValue, submitted: multiStepSubmission },
						null,
						2
					)}</pre>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Mount one Ask host near the application root, then open a typed Form in a Dialog and await submission or cancellation. The host type sets the default Dialog presentation."
			class="!items-start"
			code={`import { Ask, ask } from 'entasis/form';

const inputs = {
	displayName: { type: 'text', label: 'Display name', required: true },
	email: { type: 'email', label: 'Email', required: true }
} as const;

async function editProfile() {
	const outcome = await ask({
		title: 'Edit profile',
		inputs,
		confirm: 'Save profile',
		cancel: 'Cancel'
	});
}

<button onclick={editProfile}>Edit profile</button>
<Ask type="modal" />
`}
		>
			<div class="grid w-full max-w-xl gap-4">
				<Button class="w-fit" onclick={() => void openProfileAsk()}>Edit profile</Button>
				{#if askError}
					<p role="alert" class="text-danger text-sm">{askError}</p>
				{/if}
				<pre
					class="bg-surface-recessed text-neutral min-h-20 overflow-auto rounded-lg p-3 text-xs">{JSON.stringify(
						askOutcome,
						null,
						2
					)}</pre>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Register an app-defined input type once, then name it in any Form or ask() entry. Entries stay plain data that serializes, and the value is typed from the registry."
			class="!items-start"
			code={`// inputs.ts, imported by the root layout
import { registerFormInputs } from 'entasis/form';
import MoneyInput from './MoneyInput.svelte';

declare module 'entasis/form' {
	interface FormInputRegistry {
		money: { value: { amount: number; currency: string }; props: { currencies?: string[] } };
	}
}

registerFormInputs({
	money: {
		component: MoneyInput,
		isEmpty: (value) => value?.amount === undefined,
		validate: (value) => (value.amount < 0 ? 'Enter an amount of zero or more.' : null)
	}
});

// MoneyInput.svelte renders the control alone; Form wraps it in Field.
// let { field, currencies }: FormInputComponentProps<'money'> = $props();

// Anywhere, as plain data:
<Form inputs={{ price: { type: 'money', label: 'Price', required: true } }} />
const outcome = await ask({ title: 'Set a price', inputs: { price: { type: 'money', label: 'Price', required: true } }, confirm: 'Save price', cancel: 'Cancel' });
`}
		>
			<div class="grid w-full max-w-xl gap-4">
				<Form
					inputs={pricingInputs}
					bind:value={pricingValue}
					onSubmit={(value) => {
						pricingSubmitted = value;
					}}
				>
					{#snippet children(form)}
						<div class="flex flex-wrap gap-2">
							<Button type="button" onclick={() => void form.submit()}>Submit</Button>
							<Button type="button" variant="outline" onclick={() => void askForPrice()}>
								Ask for a price
							</Button>
						</div>
					{/snippet}
				</Form>
				<pre
					class="bg-surface-recessed text-neutral min-h-20 overflow-auto rounded-lg p-3 text-xs">{JSON.stringify(
						{ value: pricingValue, submitted: pricingSubmitted, asked: askedPrice },
						null,
						2
					)}</pre>
			</div>
		</ComponentCard>

		<ComponentCard
			controls={fieldStateControls}
			description="Disable or lock a whole Form or one group. Validation messages come from the i18n catalog in the active locale, an entry can override them, and every field reports focused, touched, dirty and filled (also as data attributes on its root)."
			class="!items-start"
			code={`import { Form, type FormInputs } from 'entasis/form';
import { I18n } from 'entasis/i18n';

const inputs = {
	account: {
		type: 'group',
		label: 'Account',
		disabled: ${fieldStateControls.value.groupDisabled},
		readOnly: ${fieldStateControls.value.groupReadOnly},
		inputs: {
			nickname: {
				type: 'text',
				label: 'Nickname',
				required: true,
				messages: { required: 'Pick a nickname' }
			},
			email: { type: 'email', label: 'Email', required: true }
		}
	},
	terms: { type: 'switch', label: 'Accept the terms', labelPosition: 'top', required: true },
	score: { type: 'rating', label: 'Rating', defaultValue: 4, readOnly: true }
} satisfies FormInputs;

<I18n locale="${fieldStateControls.value.locale}" manageDocument={false}>
	<Form
		{inputs}
		disabled={${fieldStateControls.value.disabled}}
		readOnly={${fieldStateControls.value.readOnly}}
		onSubmit={(value) => save(value)}
	/>
</I18n>`}
		>
			<div class="grid w-full max-w-xl gap-4">
				<I18n locale={fieldStateControls.value.locale as LocaleCode} manageDocument={false}>
					<Form
						inputs={fieldStateInputs}
						disabled={fieldStateControls.value.disabled}
						readOnly={fieldStateControls.value.readOnly}
						onSubmit={(value) => {
							fieldStateSubmission = value;
						}}
					>
						{#snippet children(form)}
							<div class="flex flex-wrap gap-2">
								<Button type="button" onclick={() => void form.submit()}>Submit</Button>
								<Button type="button" variant="outline" onclick={() => form.reset()}>Reset</Button>
							</div>
							<pre
								data-testid="field-state"
								class="bg-surface-recessed text-neutral overflow-auto rounded-lg p-3 text-xs">{JSON.stringify(
									{ fields: describeFieldState(form), submitted: fieldStateSubmission },
									null,
									2
								)}</pre>
						{/snippet}
					</Form>
				</I18n>
			</div>
		</ComponentCard>

		<ComponentCard
			controls={validationControls}
			description="Fields validate on submit, on blur or on every change, and edited fields re-validate after a failed submit. A validator may return a promise: the field stays neutral while it runs and submit waits for it. Server errors show under their fields and clear on the next edit; reset restores the initial values and clears errors, touched and dirty."
			class="!items-start"
			code={`import { Form, type FormInputs } from 'entasis/form';

const inputs = {
	username: {
		type: 'text',
		label: 'Username',
		required: true,
		// May return a promise; stale results are dropped.
		onValidate: async (name) => ((await isTaken(name)) ? 'That username is taken' : null)
	},
	email: { type: 'email', label: 'Email', required: true },
	code: { type: 'text', label: 'Invite code', defaultValue: 'BETA', disabled: true }
} satisfies FormInputs;

let form = $state<FormState<typeof inputs>>();

<Form
	{inputs}
	bind:form
	validationMode="${validationControls.value.validationMode}"${validationControls.value.debounce ? '\n\tvalidationDebounce={400}' : ''}
	onSubmit={async (value) => {
		// value omits the disabled "code" field.
		const response = await save(value);
		if (response.errors) form.setErrors(response.errors); // { email: 'Already registered' }
	}}
/>
// form.reset() restores the initial values; form.validateField('email') checks one field;
// form.validate({ reveal: false }) checks without moving focus.`}
		>
			<div class="grid w-full max-w-xl gap-4">
				<Form
					inputs={validationInputs}
					validationMode={validationControls.value.validationMode as 'submit' | 'blur' | 'change'}
					validationDebounce={validationControls.value.debounce ? 400 : 0}
					onSubmit={(value) => {
						validationSubmitted = value;
					}}
				>
					{#snippet children(form)}
						<div class="flex flex-wrap gap-2">
							<Button type="button" loading={form.loading} onclick={() => void form.submit()}>
								Submit
							</Button>
							<Button
								type="button"
								variant="outline"
								onclick={() => form.setErrors({ email: 'Already registered' })}
							>
								Simulate a server error
							</Button>
							<Button
								type="button"
								variant="outline"
								onclick={() => {
									validationSubmitted = null;
									form.reset();
								}}
							>
								Reset
							</Button>
						</div>
						<pre
							data-testid="validation-state"
							class="bg-surface-recessed text-neutral overflow-auto rounded-lg p-3 text-xs">{JSON.stringify(
								describeValidation(form),
								null,
								2
							)}</pre>
					{/snippet}
				</Form>
			</div>
		</ComponentCard>

		<ComponentCard
			description="A horizontal card form; the notes field opts back into a top label"
			class="!items-start"
		>
			<div class="grid w-full max-w-3xl gap-4">
				<Form
					inputs={contactInputs}
					bind:value={contactValue}
					title="Contact preferences"
					variant="card"
					layout="horizontal"
					onSubmit={(value) => {
						contactSubmission = value;
					}}
				>
					{#snippet footer(form)}
						<Button
							fullWidth
							loading={form.loading}
							disabled={form.loading}
							onclick={() => void form.submit()}
						>
							Save preferences
						</Button>
					{/snippet}
				</Form>
				<pre
					class="bg-surface-recessed text-neutral overflow-auto rounded-lg p-3 text-xs">{JSON.stringify(
						{ value: contactValue, submitted: contactSubmission },
						null,
						2
					)}</pre>
			</div>
		</ComponentCard>
		<ComponentCard
			title="Native forms"
			description="Every control also works in a plain <form>, such as a SvelteKit form action: it submits its name and value, a required control blocks the submit and reports through its own error, Reset returns each control to its initial value, and the form prop joins a control placed outside the form."
			class="!items-start"
			code={`<form id="newsletter" method="POST">
	<TextInput name="email" type="email" label="Email" defaultValue="ada@example.com" required />
	<Select
		name="frequency"
		label="Frequency"
		defaultValue="weekly"
		items={[
			{ value: 'daily', label: 'Daily' },
			{ value: 'weekly', label: 'Weekly' }
		]}
	/>
	<CheckboxesInput
		name="topics"
		label="Topics"
		defaultValue={['product']}
		items={[
			{ value: 'product', label: 'Product news' },
			{ value: 'events', label: 'Events' }
		]}
	/>
	<Switch name="terms" label="Accept the terms" required />
	<Button type="submit">Subscribe</Button>
	<Button type="reset" variant="outline">Reset</Button>
</form>

<!-- Rendered elsewhere on the page, submitted and reset with the form above. -->
<Switch form="newsletter" name="digest" inputValue="yes" label="Weekly digest" />`}
		>
			<div class="grid w-full max-w-xl gap-4">
				<form
					id="native-newsletter"
					class="grid gap-4"
					data-testid="native-form"
					onsubmit={(event) => {
						event.preventDefault();
						const data = new FormData(event.currentTarget);
						nativeSubmission = JSON.stringify(
							[...data.keys()].reduce<Record<string, string | string[]>>((record, key) => {
								const values = data.getAll(key).map(String);
								record[key] = values.length > 1 ? values : values[0];
								return record;
							}, {})
						);
					}}
				>
					<TextInput
						name="email"
						type="email"
						label="Email"
						defaultValue="ada@example.com"
						required
					/>
					<Select
						name="frequency"
						label="Frequency"
						defaultValue="weekly"
						items={[
							{ value: 'daily', label: 'Daily' },
							{ value: 'weekly', label: 'Weekly' }
						]}
					/>
					<CheckboxesInput
						name="topics"
						label="Topics"
						defaultValue={['product']}
						items={[
							{ value: 'product', label: 'Product news' },
							{ value: 'events', label: 'Events' }
						]}
					/>
					<Switch name="terms" label="Accept the terms" required />
					<div class="flex flex-wrap gap-2">
						<Button type="submit">Subscribe</Button>
						<Button type="reset" variant="outline">Reset</Button>
					</div>
				</form>
				<div class="border-neutral-muted rounded-lg border border-dashed p-3">
					<Switch
						form="native-newsletter"
						name="digest"
						inputValue="yes"
						label="Weekly digest (outside the form)"
					/>
				</div>
				<pre
					class="bg-surface-recessed text-neutral overflow-auto rounded-lg p-3 text-xs"
					data-testid="native-form-submission">FormData: {nativeSubmission ??
						'nothing submitted yet'}</pre>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
