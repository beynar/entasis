<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { NumberInput } from '$lib/components/Form/NumberInput/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let quantity = $state<number | null>(1);
	let price = $state<number | null>(1234.5);
	let discount = $state<number | null>(0.15);
	let lastCommit = $state('none yet');
	let seats = $state<number | null>(12);
	let submitted = $state('');
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
	title="Number input"
	subtitle="Locale-aware numeric entry with stepping and min/max constraints."
	component="NumberInput"
	features={[
		{ label: 'Parses and formats by locale', test: 'number-input:locale-parse' },
		{ label: 'Posts the raw number to native forms', test: 'number-input:native-form' },
		{ label: 'Shift, Page, Alt, Home and End stepping', test: 'number-input:large-step' },
		{ label: 'Press-and-hold steppers keep focus in the input', test: 'number-input:hold-step' },
		{ label: 'Localized out-of-range messages', test: 'number-input:localized-range' },
		{ label: 'Wheel only steps with wheelStep', test: 'number-input:wheel' },
		'onValueCommit with a reason',
		'Bindable value, errors & focused state'
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
	readOnly={${controls.value.readOnly}}
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
				readOnly={controls.value.readOnly}
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
					<p class="text-neutral/70 mt-2 text-xs">Value: {quantity}</p>
				{/if}
			</div>
		</ComponentCard>

		<ComponentCard
			description="Constrain the range and the step. Arrow keys step by 5, Shift and Page keys by 50, Alt by 0.5, and Home and End jump to the bounds."
			code={`<NumberInput label="Age" placeholder="18" min={18} max={120} step={5} />`}
		>
			<div class="w-full max-w-md">
				<NumberInput label="Age" placeholder="18" min={18} max={120} step={5} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Locale and format"
			description="The text follows the locale and Intl format options: type 1 234,5 or ١٢٣٫٤ and the value is the plain number. Rounding options round the committed value on blur."
			code={`<NumberInput label="Prix" locale="fr" format={{ style: 'currency', currency: 'EUR' }} bind:value={price} />
<NumberInput
	label="Discount"
	format={{ style: 'percent', maximumFractionDigits: 0 }}
	step={0.01}
	bind:value={discount}
/>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<NumberInput
					label="Prix"
					locale="fr"
					format={{ style: 'currency', currency: 'EUR' }}
					bind:value={price}
					helper={`Value: ${price ?? 'empty'}`}
				/>
				<NumberInput
					label="Discount"
					format={{ style: 'percent', maximumFractionDigits: 0 }}
					step={0.01}
					bind:value={discount}
					helper={`Value: ${discount ?? 'empty'}`}
				/>
				<NumberInput label="الكمية" locale="ar" value={123} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Snapping and commit"
			description="snapOnStep moves to the next point of the step grid. onValueCommit reports each blur, keyboard step, wheel step and stepper release, with the reason."
			code={`<NumberInput
	label="Seats"
	bind:value={seats}
	step={5}
	min={0}
	snapOnStep
	wheelStep
	onValueCommit={({ value, reason }) => (lastCommit = \`\${reason}: \${value}\`)}
	helper={\`Last commit: \${lastCommit}\`}
/>`}
		>
			<div class="w-full max-w-md">
				<NumberInput
					label="Seats"
					bind:value={seats}
					step={5}
					min={0}
					snapOnStep
					wheelStep
					onValueCommit={({ value, reason }) => (lastCommit = `${reason}: ${value}`)}
					helper={`Last commit: ${lastCommit}`}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Native form"
			description="A hidden input posts the plain number to a native form, such as a SvelteKit action; the visible text is only for reading."
			code={`<form method="POST">
	<NumberInput name="amount" locale="de" value={1234.5} />
	<button type="submit">Send</button>
</form>`}
		>
			<form
				class="grid w-full max-w-md gap-3"
				onsubmit={(event) => {
					event.preventDefault();
					submitted = String(new FormData(event.currentTarget).get('amount'));
				}}
			>
				<NumberInput name="amount" label="Betrag" locale="de" value={1234.5} />
				<button type="submit" class="text-primary justify-self-start text-sm underline">Send</button
				>
				{#if submitted}
					<p class="text-neutral/70 text-xs">Posted amount={submitted}</p>
				{/if}
			</form>
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
