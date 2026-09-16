<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { TimeInput } from '$lib/components/Form/TimeInput/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let openingTime = $state<number | null>(540);
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
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

<DocPage
	title="Time input"
	subtitle="Typed time entry with formatting and constraints."
	component="TimeInput"
	features={[
		'Maskito time masking (@maskito/kit)',
		'HH:MM or HH:MM:SS formats',
		'Value as minutes/seconds/ms since midnight',
		'Per-segment min/max constraints'
	]}
>
	<ComponentCard
		{controls}
		description="A masked time input, value as minutes since midnight"
		code={`<TimeInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Opening time"
	description="When the store opens on weekdays"
	bind:value={openingTime}
/>`}
	>
		<div class="w-full max-w-md">
			<TimeInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Opening time"
				description="When the store opens on weekdays"
				bind:value={openingTime}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="A masked time input, value as minutes since midnight">
			<div class="w-full max-w-md">
				<TimeInput
					as="minuteSinceMidnight"
					value={1439}
					label="Time"
					format="HH:MM"
					placeholder="HH:MM"
					onValueChange={(value) => {
						console.log('value', value);
					}}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Use the HH:MM:SS format">
			<div class="w-full max-w-md">
				<TimeInput as="secondSinceMidnight" label="Time" format="HH:MM:SS" placeholder="HH:MM:SS" />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large time inputs."
			code={`<div class="grid w-full max-w-md gap-6">
	<TimeInput label="Small" size="small" />
	<TimeInput label="Normal" size="normal" />
	<TimeInput label="Large" size="large" />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<TimeInput label="Small" size="small" />
				<TimeInput label="Normal" size="normal" />
				<TimeInput label="Large" size="large" />
			</div>
		</ComponentCard>

		<ComponentCard description="Using type: 'time' inside a Form">
			<div class="w-full max-w-md">
				<Form
					inputs={{
						time: {
							type: 'time',
							label: 'Time',
							format: 'HH:MM',
							placeholder: 'HH:MM',
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
