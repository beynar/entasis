<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { PIN_INPUT_ALPHANUMERIC_PATTERN, PinInput } from '$lib/components/Form/PinInput/index.js';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let code = $state('');
	let maskedCode = $state('');
	let inviteCode = $state('');
	let standaloneCode = $state('');
	let formValue = $state('');

	const digitsOnly = (text: string) => text.replace(/\D/g, '');
	const alphanumericOnly = (text: string) => text.replace(/[^a-zA-Z0-9]/g, '');
	const setFormValue = (value: { otp: string | null }) => {
		formValue = JSON.stringify(value);
	};
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: sizes
		},
		{
			name: 'labelPosition',
			type: 'segmented',
			label: 'Label',
			value: 'top',
			options: ['top', 'left']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

<DocPage
	title="Pin input"
	subtitle="One-time-code input with visible cells and one real form input."
	component="PinInput"
	features={[
		'Native input owns focus and paste',
		'OTP autocomplete',
		'Bindable string value',
		'Form integration'
	]}
>
	<ComponentCard
		{controls}
		description="Digits-only one-time code with paste cleanup."
		code={`<PinInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Verification code"
	description="Enter the 6-digit code we sent you"
	bind:value={code}
/>`}
		class="!min-h-fit"
	>
		<div class="w-full max-w-md">
			<PinInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Verification code"
				description="Enter the 6-digit code we sent you"
				bind:value={code}
			/>
		</div>
	</ComponentCard>

	<ComponentCard
		description="Standalone input centered in its preview."
		code={`<div class="flex min-h-40 w-full items-center justify-center">
	<PinInput bind:value={code} pasteTransformer={digitsOnly} class="w-fit" />
</div>`}
		class="!min-h-fit"
	>
		<div class="flex min-h-40 w-full items-center justify-center">
			<PinInput bind:value={standaloneCode} pasteTransformer={digitsOnly} class="w-fit" />
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Sizes"
			description="Small, normal, and large sizes."
			code={`<div class="grid w-full max-w-xl gap-6">
	<PinInput label="Small" size="small" value="123" pasteTransformer={digitsOnly} />
	<PinInput label="Normal" size="normal" value="1234" pasteTransformer={digitsOnly} />
	<PinInput label="Large" size="large" value="12345" pasteTransformer={digitsOnly} />
</div>`}
			class="!min-h-fit"
		>
			<div class="grid w-full max-w-xl gap-6">
				<PinInput label="Small" size="small" value="123" pasteTransformer={digitsOnly} />
				<PinInput label="Normal" size="normal" value="1234" pasteTransformer={digitsOnly} />
				<PinInput label="Large" size="large" value="12345" pasteTransformer={digitsOnly} />
			</div>
		</ComponentCard>

		<ComponentCard description="Masked and alphanumeric variants." class="!min-h-fit">
			<div class="grid w-full max-w-xl gap-6">
				<PinInput label="Masked code" bind:value={maskedCode} mask pasteTransformer={digitsOnly} />
				<PinInput
					label="Invite code"
					length={8}
					inputMode="text"
					pattern={PIN_INPUT_ALPHANUMERIC_PATTERN}
					bind:value={inviteCode}
					pasteTransformer={alphanumericOnly}
					helper={`Value: ${inviteCode || 'empty'}`}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Pin input in the generic Form renderer." class="!min-h-fit">
			<div class="grid w-full max-w-md gap-4">
				<Form
					inputs={{
						otp: {
							type: 'pin',
							label: 'Login code',
							required: true,
							length: 6,
							pasteTransformer: digitsOnly
						}
					}}
					onSubmit={setFormValue}
				>
					{#snippet children(form)}
						<Button onclick={() => form.submit()}>Verify code</Button>
					{/snippet}
				</Form>
				{#if formValue}
					<p class="text-neutral/60 text-sm">{formValue}</p>
				{/if}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
