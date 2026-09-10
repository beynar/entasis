<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { NumberInput } from '$lib/components/Form/NumberInput/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let quantity = $state<number | null>(1);
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
	title="Number input"
	subtitle="Numeric entry with stepping and min/max constraints."
	component="NumberInput"
	features={[
		'Native min, max & step plus +/- controls',
		'Bindable value, errors & focus',
		'Min/max checked in onValidate',
		'Label linked via Field wrapper'
	]}
>
	<ComponentCard
		{controls}
		description="A numeric input"
		code={`<NumberInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Quantity"
	description="How many items to order"
	placeholder="0"
	bind:value={quantity}
/>`}
	>
		<div class="w-full max-w-md">
			<NumberInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Quantity"
				description="How many items to order"
				placeholder="0"
				bind:value={quantity}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="A numeric input">
			<div class="w-full max-w-md">
				<NumberInput label="Quantity" placeholder="0" bind:value={quantity} />
				{#if quantity !== null}
					<p class="text-neutral/60 mt-2 text-xs">Value: {quantity}</p>
				{/if}
			</div>
		</ComponentCard>

		<ComponentCard description="Constrain the range and increment">
			<div class="w-full max-w-md">
				<NumberInput label="Age" placeholder="18" min={18} max={120} step={1} increment={5} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large number inputs."
			code={`<div class="grid w-full max-w-md gap-6">
	<NumberInput size="small" label="Small" placeholder="0" />
	<NumberInput size="normal" label="Normal" placeholder="0" />
	<NumberInput size="large" label="Large" placeholder="0" />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<NumberInput size="small" label="Small" placeholder="0" />
				<NumberInput size="normal" label="Normal" placeholder="0" />
				<NumberInput size="large" label="Large" placeholder="0" />
			</div>
		</ComponentCard>

		<ComponentCard description="Using type: 'number' inside a Form">
			<div class="w-full max-w-md">
				<Form
					inputs={{
						age: {
							type: 'number',
							label: 'Age',
							placeholder: 'Enter your age',
							min: 18,
							max: 120,
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
