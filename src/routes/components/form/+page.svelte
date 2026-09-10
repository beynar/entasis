<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import {
		ask,
		Form,
		type AskResult,
		type FormInputAction,
		type FormInputState,
		type FormInputs,
		type InferFormValue,
		type LiveFormValue
	} from '$lib/components/Form/Form/index.js';
	import {
		MultiStepForm,
		type FormStep,
		type MergedMultiStepFormInputs
	} from '$lib/components/Form/MultiStepForm/index.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

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
			options: ['small', 'normal', 'large']
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
				density: 'small'
			});
		} catch (error) {
			askError = error instanceof Error ? error.message : String(error);
		}
	}
</script>

{#snippet valueSummary(form: FormInputState)}
	<div class="text-neutral grid gap-1 text-sm">
		<span class="font-medium">Custom form content</span>
		<span class="text-neutral/60">{Object.keys(form.value).length} visible value keys</span>
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
		'Accessible errors with first-invalid focus',
		'Programmatic submission through FormState',
		'Managed Enter navigation and submission',
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
} from 'svelai/multi-step-form';
import type { FormInputs, InferFormValue, LiveFormValue } from 'svelai/form';

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
			code={`import { Ask, ask } from 'svelai/form';

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
	{/snippet}
</DocPage>
