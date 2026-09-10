<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { DateInput } from '$lib/components/Form/DateInput/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let date = $state<Date | null>(null);
	const presets = [
		{ label: 'Tomorrow', value: new Date(2026, 6, 16, 12) },
		{ label: 'Next week', value: new Date(2026, 6, 22, 12) }
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
	title="Date input"
	subtitle="Typed date entry with formatting and validation."
	component="DateInput"
	features={[
		'Maskito date masking (@maskito/kit)',
		'Configurable format masks',
		'Bindable Date value',
		'Reusable DateSelector popover',
		'Optional presets and mobile sheet',
		'Configurable close on selection',
		'Label linked via Field wrapper'
	]}
>
	<ComponentCard
		{controls}
		description="A masked date input (dd/mm/yyyy)"
		code={`<DateInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Appointment date"
	description="Type the date or pick one from the calendar"
	bind:value={date}
/>`}
	>
		<div class="w-full max-w-md">
			<DateInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Appointment date"
				description="Type the date or pick one from the calendar"
				bind:value={date}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="A masked date input (dd/mm/yyyy)">
			<div class="w-full max-w-md">
				<DateInput label="Date" bind:value={date} />
				{#if date}
					<p class="text-neutral/60 mt-2 text-xs">Value: {date.toLocaleDateString()}</p>
				{/if}
			</div>
		</ComponentCard>

		<ComponentCard description="Change the mask with the format prop">
			<div class="grid w-full max-w-md gap-6">
				<DateInput label="US format" format="mm/dd/yyyy" />
				<DateInput label="Month & year" format="mm/yyyy" />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Selector presets"
			description="DateInput forwards shortcuts and calendar bounds to its DateSelector primitive and stays open after selection by default."
			code={`<DateInput label="Delivery date" bind:value={date} {presets} minDate={new Date()} />`}
		>
			<div class="w-full max-w-md">
				<DateInput
					label="Delivery date"
					bind:value={date}
					{presets}
					minDate={new Date(2026, 6, 15)}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large date inputs."
			code={`<div class="grid w-full max-w-md gap-6">
	<DateInput label="Small" size="small" />
	<DateInput label="Normal" size="normal" />
	<DateInput label="Large" size="large" />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<DateInput label="Small" size="small" />
				<DateInput label="Normal" size="normal" />
				<DateInput label="Large" size="large" />
			</div>
		</ComponentCard>

		<ComponentCard description="Using type: 'date' inside a Form">
			<div class="w-full max-w-md">
				<Form
					inputs={{
						birthdate: {
							type: 'date',
							label: 'Birth date',
							format: 'dd/mm/yyyy',
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
