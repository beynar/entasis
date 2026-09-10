<script lang="ts">
	import {
		MultiStepForm,
		type FormStep,
		type MergedMultiStepFormInputs
	} from '$lib/components/Form/MultiStepForm/index.js';
	import type {
		FormInputs,
		InferFormValue,
		LiveFormValue
	} from '$lib/components/Form/Form/index.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const accountInputs = {
		name: { type: 'text', label: 'Name', placeholder: 'Your name', required: true },
		email: {
			type: 'email',
			label: 'Email',
			placeholder: 'you@example.com',
			required: true
		}
	} satisfies FormInputs;

	const securityInputs = {
		password: {
			type: 'password',
			label: 'Password',
			placeholder: 'Choose a password',
			required: true
		},
		twoFactor: {
			type: 'switch',
			label: 'Enable two-factor authentication'
		}
	} satisfies FormInputs;

	const preferenceInputs = {
		plan: {
			type: 'select',
			label: 'Plan',
			placeholder: 'Choose a plan',
			required: true,
			items: [
				{ value: 'free', label: 'Free' },
				{ value: 'pro', label: 'Pro' },
				{ value: 'team', label: 'Team' }
			]
		},
		newsletter: { type: 'switch', label: 'Subscribe to newsletter' }
	} satisfies FormInputs;

	const steps: [
		FormStep<typeof accountInputs>,
		FormStep<typeof securityInputs>,
		FormStep<typeof preferenceInputs>
	] = [
		{
			title: 'Account',
			description: 'Tell us who you are',
			inputs: accountInputs,
			onBeforeChange: async ({ next }) => {
				await Promise.resolve();
				next();
			}
		},
		{
			title: 'Security',
			description: 'Secure your account',
			inputs: securityInputs
		},
		{
			title: 'Preferences',
			description: 'Customize your experience',
			inputs: preferenceInputs
		}
	];

	type Inputs = MergedMultiStepFormInputs<typeof steps>;
	let value = $state<LiveFormValue<Inputs>>({ name: 'Ada' });
	let submission = $state<InferFormValue<Inputs> | null>(null);
	const controls = createComponentControls([
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'plain',
			options: ['plain', 'sectioned', 'card']
		},
		{ name: 'showMeter', type: 'switch', label: 'Meter', value: true }
	]);
</script>

<DocPage
	title="Multi-step form"
	subtitle="Sequential forms with visited-step validation and complete final submission."
	component="MultiStepForm"
	features={[
		'Explicit state ownership per step',
		'Validated navigation hooks',
		'Complete final-form validation',
		'Two-way merged value synchronization',
		'Deduplicated async submission'
	]}
>
	<ComponentCard
		{controls}
		description="Every required step must be valid before final submission"
		class="!items-start"
		code={`<MultiStepForm
	variant="${controls.value.variant}"
	showMeter={${controls.value.showMeter}}
	items={steps}
	bind:value
	onSubmitForm={(validatedValue) => {
		submission = validatedValue;
	}}
/>`}
	>
		<div class="grid w-full max-w-xl gap-4">
			<MultiStepForm
				variant={controls.value.variant}
				showMeter={controls.value.showMeter}
				items={steps}
				bind:value
				onSubmitForm={(validatedValue) => {
					submission = validatedValue;
				}}
			/>
			<pre
				class="bg-surface-recessed text-neutral overflow-auto rounded-lg p-3 text-xs">{JSON.stringify(
					{ value, submitted: submission },
					null,
					2
				)}</pre>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="The same flow without the default progress meter"
			class="!items-start"
		>
			<div class="w-full max-w-xl">
				<MultiStepForm
					items={steps}
					showMeter={false}
					onSubmitForm={(validatedValue) => {
						submission = validatedValue;
					}}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
