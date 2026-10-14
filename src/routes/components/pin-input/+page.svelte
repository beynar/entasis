<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { PIN_INPUT_ALPHANUMERIC_PATTERN, PinInput } from '$lib/components/Form/PinInput/index.js';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let code = $state('');
	let maskedCode = $state('');
	let inviteCode = $state('');
	let standaloneCode = $state('');
	let formValue = $state('');
	let pasteCode = $state('');
	let groupedCode = $state('');
	let recoveryCode = $state('');
	let rejectedText = $state('');
	let submittedForm = $state('');
	let completions = $state(0);
	let lastCompleted = $state('');

	const setFormValue = (value: { otp: string | null }) => {
		formValue = JSON.stringify(value);
	};
	const recordCompletion = (value: string) => {
		completions += 1;
		lastCompleted = value;
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
			options: densities
		},
		{
			name: 'labelPosition',
			type: 'segmented',
			label: 'Label',
			value: 'top',
			options: ['top', 'left']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false },
		{ name: 'readOnly', type: 'switch', label: 'Read only', value: false }
	]);
</script>

<DocPage
	title="Pin input"
	subtitle="One-time-code input with visible cells and one real form input."
	component="PinInput"
	features={[
		{ label: 'Native input owns focus and paste', test: 'a11y:pin-input.native-input' },
		{ label: 'Full-length paste replaces the code', test: 'pin-input:full-paste' },
		{ label: 'IME composition commits once', test: 'pin-input:ime-composition' },
		{ label: 'Separators and other digits are normalized', test: 'pin-input:normalize' },
		{ label: 'Submits the form when complete', test: 'pin-input:submit-on-complete' },
		{ label: 'Grouped cells', test: 'pin-input:groups' },
		{ label: 'Works inside shadow roots', test: 'pin-input:shadow-dom' },
		'OTP autocomplete',
		'Bindable string value',
		'Form integration'
	]}
>
	<ComponentCard
		{controls}
		description="Digits-only one-time code. Typed, pasted and autofilled text loses spaces and hyphens, and other digits become ASCII."
		code={`<PinInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	readOnly={${controls.value.readOnly}}
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
				readOnly={controls.value.readOnly}
				label="Verification code"
				description="Enter the 6-digit code we sent you"
				bind:value={code}
			/>
		</div>
	</ComponentCard>

	<ComponentCard
		description="Standalone input centered in its preview."
		code={`<div class="flex min-h-40 w-full items-center justify-center">
	<PinInput bind:value={code} class="w-fit" />
</div>`}
		class="!min-h-fit"
	>
		<div class="flex min-h-40 w-full items-center justify-center">
			<PinInput bind:value={standaloneCode} class="w-fit" />
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Sizes"
			description="Small, normal, and large sizes."
			code={`<div class="grid w-full max-w-xl gap-6">
	<PinInput label="Small" size="small" value="123" />
	<PinInput label="Normal" size="normal" value="1234" />
	<PinInput label="Large" size="large" value="12345" />
</div>`}
			class="!min-h-fit"
		>
			<div class="grid w-full max-w-xl gap-6">
				<PinInput label="Small" size="small" value="123" />
				<PinInput label="Normal" size="normal" value="1234" />
				<PinInput label="Large" size="large" value="12345" />
			</div>
		</ComponentCard>

		<ComponentCard description="Masked and alphanumeric variants." class="!min-h-fit">
			<div class="grid w-full max-w-xl gap-6">
				<PinInput label="Masked code" bind:value={maskedCode} mask />
				<PinInput
					label="Invite code"
					length={8}
					inputMode="text"
					pattern={PIN_INPUT_ALPHANUMERIC_PATTERN}
					bind:value={inviteCode}
					helper={`Value: ${inviteCode || 'empty'}`}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Paste and completion"
			description="A full-length paste replaces the code wherever the caret is. onComplete runs whenever the code becomes complete, and again for every paste or autofill that leaves it complete, so re-pasting a code retries verification. Japanese or Chinese input commits once when the composition ends, with full-width digits converted."
			code={`<script lang="ts">
	import { PinInput } from 'entasis/pin-input';

	let code = $state('');
	let completions = $state(0);
${'</' + 'script>'}

<PinInput
	label="Sign-in code"
	bind:value={code}
	onComplete={() => (completions += 1)}
	helper={\`Completed \${completions} times\`}
/>`}
			class="!min-h-fit"
		>
			<div class="w-full max-w-md">
				<PinInput
					label="Sign-in code"
					bind:value={pasteCode}
					onComplete={recordCompletion}
					helper={`Completed ${completions} ${completions === 1 ? 'time' : 'times'}${lastCompleted ? ` · last code ${lastCompleted}` : ''}`}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Grouped cells"
			description="Two groups of three put a separator between the halves of a code."
			code={`<PinInput label="Confirmation code" groups={[3, 3]} bind:value={groupedCode} />`}
			class="!min-h-fit"
		>
			<div class="w-full max-w-md">
				<PinInput label="Confirmation code" groups={[3, 3]} bind:value={groupedCode} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Normalization"
			description="normalizeValue is the last step of the pipeline every typed, pasted and autofilled code goes through: here lowercase typing becomes uppercase, and a pasted ab-cd-12-34 fills the code. onRejectInput reports text the pattern refuses."
			code={`<PinInput
	label="Recovery code"
	length={8}
	inputMode="text"
	pattern={PIN_INPUT_ALPHANUMERIC_PATTERN}
	normalizeValue={(text) => text.toUpperCase()}
	onRejectInput={({ text }) => (rejected = text)}
	bind:value={recoveryCode}
/>`}
			class="!min-h-fit"
		>
			<div class="w-full max-w-md">
				<PinInput
					label="Recovery code"
					length={8}
					inputMode="text"
					pattern={PIN_INPUT_ALPHANUMERIC_PATTERN}
					normalizeValue={(text) => text.toUpperCase()}
					onRejectInput={({ text }) => (rejectedText = text)}
					bind:value={recoveryCode}
					helper={rejectedText ? `Refused: ${rejectedText}` : 'Try ab-cd-12-34, or paste $$$'}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Submit on complete"
			description="submitOnComplete submits the surrounding Form when the last character is typed, pasted or autofilled. An earlier invalid field keeps focus."
			class="!min-h-fit"
		>
			<div class="grid w-full max-w-md gap-4">
				<Form
					inputs={{
						email: { type: 'email', label: 'Email', required: true },
						pin: { type: 'pin', label: 'Code', length: 4, submitOnComplete: true }
					}}
					onSubmit={(value) => (submittedForm = JSON.stringify(value))}
				/>
				{#if submittedForm}
					<p class="text-neutral/70 text-sm">{submittedForm}</p>
				{/if}
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
							length: 6
						}
					}}
					onSubmit={setFormValue}
				>
					{#snippet children(form)}
						<Button onclick={() => form.submit()}>Verify code</Button>
					{/snippet}
				</Form>
				{#if formValue}
					<p class="text-neutral/70 text-sm">{formValue}</p>
				{/if}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
