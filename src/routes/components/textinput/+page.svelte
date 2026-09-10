<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import TextInput from '$lib/components/Form/TextInput/TextInput.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let email = $state('');
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
	title="Text input"
	subtitle="Single-line text entry with labels and validation."
	component="TextInput"
	features={[
		'Label linked via htmlFor/id',
		'Bindable value, errors & focus',
		'Custom onValidate hook',
		'Helper text & error display'
	]}
>
	<ComponentCard
		{controls}
		description="Single-line text entry with a label"
		code={`<TextInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Email"
	description="We'll only use this for receipts"
	placeholder="you@example.com"
	bind:value={email}
/>`}
	>
		<div class="w-full max-w-md">
			<TextInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Email"
				description="We'll only use this for receipts"
				placeholder="you@example.com"
				bind:value={email}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Sizes"
			description="Small, normal, and large text inputs."
			code={`<div class="grid w-full max-w-md gap-6">
	<TextInput size="small" label="Small" placeholder="Small input" />
	<TextInput size="normal" label="Normal" placeholder="Normal input" />
	<TextInput size="large" label="Large" placeholder="Large input" />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<TextInput size="small" label="Small" placeholder="Small input" />
				<TextInput size="normal" label="Normal" placeholder="Normal input" />
				<TextInput size="large" label="Large" placeholder="Large input" />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Form integration plus helper and error states."
			class="flex !items-start"
		>
			<div class="flex items-center justify-center gap-4">
				<Form
					inputs={{
						name: {
							type: 'text',
							label: 'name',
							required: true,
							class: 'col-span-1'
						},
						email: {
							type: 'email',
							label: 'email',
							required: true,
							class: 'col-span-1'
						},
						password: {
							type: 'password',
							label: 'password',
							required: true
						},
						textarea: {
							type: 'textarea',
							label: 'textarea',
							required: true
						},
						select: {
							type: 'select',
							label: 'select',
							required: true,
							options: [
								{ value: '1', label: '1' },
								{ value: '2', label: '2' }
							]
						}
					}}
					onSubmit={() => {
						console.log('submit');
					}}
				/>
				<TextInput label="Text Input" helper="Helper" errors={['Error']} />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
