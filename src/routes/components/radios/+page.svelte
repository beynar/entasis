<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import RadioInput from '$lib/components/Form/RadioInput/RadioInput.svelte';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let selectedOptions = $state(['option1']);
	let usageValue = $state<string | null>('option1');
	let cardSelectedOptions = $state(['card1']);

	const normalOptions = [
		{ value: 'option1', label: 'Option 1', description: 'This is the first option' },
		{ value: 'option2', label: 'Option 2', description: 'This is the second option' },
		{ value: 'option3', label: 'Option 3', description: 'This is the third option' }
	];

	const cardOptions = [
		{ value: 'card1', label: 'Card Option 1', description: 'This is a card style option' },
		{ value: 'card2', label: 'Card Option 2', description: 'Another card style option' },
		{ value: 'card3', label: 'Card Option 3', description: 'Yet another card style option' }
	];
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'mode',
			type: 'segmented',
			label: 'Mode',
			value: 'normal',
			options: ['normal', 'card']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

<DocPage
	title="Radios"
	subtitle="Lets users choose a single option from a set."
	component="RadioInput"
	features={[
		'Fieldset groups mutually exclusive options',
		{ label: 'aria-label on each option button', test: 'a11y:radios.option-labels' },
		'Bindable single value selection',
		'Normal and card display modes',
		'Hidden native radio inputs'
	]}
>
	<ComponentCard
		{controls}
		description="Choose a single option from a group"
		code={`<RadioInput
	size="${controls.value.size}"
	mode="${controls.value.mode}"
	disabled={${controls.value.disabled}}
	label="Choose your option"
	description="You can change this later in settings"
	items={[
		{ value: 'option1', label: 'Option 1', description: 'This is the first option' },
		{ value: 'option2', label: 'Option 2', description: 'This is the second option' },
		{ value: 'option3', label: 'Option 3', description: 'This is the third option' }
	]}
	name="usage-radios"
	bind:value
/>`}
	>
		<div class="w-full max-w-md">
			<RadioInput
				size={controls.value.size}
				mode={controls.value.mode}
				disabled={controls.value.disabled}
				label="Choose your option"
				description="You can change this later in settings"
				items={normalOptions}
				name="usage-radios"
				bind:value={usageValue}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Radio group with normal layout.">
			<div class="w-full max-w-md">
				<RadioInput
					onValueChange={(value) => {
						console.log('clicked', value);
					}}
					items={normalOptions}
					mode="normal"
					name="normal-radios"
					label="Choose your option"
					required
				/>
				<div class="text-neutral/70 mt-4 text-sm">
					Selected: {selectedOptions.join(', ')}
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large radio groups."
			code={`<div class="grid w-full max-w-md gap-6">
	<RadioInput label="Small" mode="normal" name="small-radios" size="small" items={normalOptions} />
	<RadioInput label="Normal" mode="normal" name="normal-size-radios" size="normal" items={normalOptions} />
	<RadioInput label="Large" mode="normal" name="large-radios" size="large" items={normalOptions} />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<RadioInput
					label="Small"
					mode="normal"
					name="small-radios"
					size="small"
					items={normalOptions}
				/>
				<RadioInput
					label="Normal"
					mode="normal"
					name="normal-size-radios"
					size="normal"
					items={normalOptions}
				/>
				<RadioInput
					label="Large"
					mode="normal"
					name="large-radios"
					size="large"
					items={normalOptions}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Options rendered as selectable cards.">
			<div class="w-full max-w-md">
				<RadioInput
					items={cardOptions}
					mode="card"
					name="card-radios"
					label="Choose your card option"
					required
				/>
				<div class="text-neutral/70 mt-4 text-sm">
					Selected: {cardSelectedOptions.join(', ')}
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="Using type: 'radio' inside a Form.">
			<div class="w-full max-w-md">
				<Form
					inputs={{
						preference: {
							type: 'radio',
							label: 'Your preference',
							required: true,
							mode: 'normal',
							items: [
								{
									value: 'email',
									label: 'Email notifications',
									description: 'Receive updates via email'
								},
								{
									value: 'sms',
									label: 'SMS notifications',
									description: 'Receive updates via SMS'
								},
								{
									value: 'none',
									label: 'No notifications',
									description: "Don't receive any updates"
								}
							]
						},
						style: {
							type: 'radio',
							label: 'Interface style',
							required: true,
							mode: 'card',
							items: [
								{ value: 'light', label: 'Light theme', description: 'Clean and bright interface' },
								{ value: 'dark', label: 'Dark theme', description: 'Easy on the eyes' },
								{ value: 'auto', label: 'Auto theme', description: 'Follows system preference' }
							]
						}
					}}
					onSubmit={(data) => {
						console.log('Form submitted:', data);
					}}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
