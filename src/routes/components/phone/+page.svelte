<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { PhoneInput } from '$lib/components/Form/PhoneInput/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let phone = $state('');
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
	title="Phone"
	subtitle="International phone number entry with country selection."
	component="PhoneInput"
	features={[
		'intl-tel-input loaded from CDN at runtime',
		'Bindable value, errors & country',
		'Formats number as you type',
		'Validates with isValidNumber()',
		'Country list with aria label'
	]}
>
	<ComponentCard
		{controls}
		description="An international phone input with country selector"
		code={`<PhoneInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Phone"
	description="We'll send delivery updates to this number"
	placeholder="Phone number"
	bind:value={phone}
/>`}
	>
		<div class="w-full max-w-md">
			<PhoneInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Phone"
				description="We'll send delivery updates to this number"
				placeholder="Phone number"
				bind:value={phone}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="An international phone input with country selector">
			<div class="w-full max-w-md">
				<PhoneInput label="Phone" placeholder="Phone number" bind:value={phone} />
			</div>
		</ComponentCard>

		<ComponentCard description="Preset the country with the country prop">
			<div class="w-full max-w-md">
				<PhoneInput label="Phone" placeholder="Phone number" country="fr" />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large phone input sizes."
			code={`<PhoneInput label="Small" placeholder="Phone number" size="small" />
<PhoneInput label="Normal" placeholder="Phone number" size="normal" />
<PhoneInput label="Large" placeholder="Phone number" size="large" />`}
		>
			<div class="grid w-full max-w-md gap-6">
				<PhoneInput label="Small" placeholder="Phone number" size="small" />
				<PhoneInput label="Normal" placeholder="Phone number" size="normal" />
				<PhoneInput label="Large" placeholder="Phone number" size="large" />
			</div>
		</ComponentCard>

		<ComponentCard description="Using type: 'phone' inside a Form">
			<div class="w-full max-w-md">
				<Form
					inputs={{
						phone: {
							type: 'phone',
							label: 'Phone',
							placeholder: 'Phone number',
							required: true
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
