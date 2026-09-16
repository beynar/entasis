<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import RatingInput from '$lib/components/Form/RatingInput/RatingInput.svelte';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let rating = $state<number | null>(3);
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
	title="Rating input"
	subtitle="Star rating input with half-star support, configurable star count and RTL."
	component="RatingInput"
	features={[
		'Configurable star count via max',
		'Optional half-star precision',
		'RTL fills from the right',
		{ label: 'Slider role with keyboard support', test: 'a11y:rating.slider-keyboard' }
	]}
>
	<ComponentCard
		{controls}
		description="Collect a star rating with helper text"
		code={`<RatingInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Overall rating"
	description="How would you rate your experience?"
	bind:value={rating}
/>`}
	>
		<div class="w-full max-w-md">
			<RatingInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Overall rating"
				description="How would you rate your experience?"
				bind:value={rating}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Basic 5-star rating">
			<div class="w-full max-w-md">
				<RatingInput label="Rating" value={3} />
			</div>
		</ComponentCard>

		<ComponentCard description="Half steps (LTR)">
			<div class="w-full max-w-md">
				<RatingInput label="Rating" halfSteps value={2.5} />
			</div>
		</ComponentCard>

		<ComponentCard description="Half steps (RTL) — fills from the right">
			<div class="w-full max-w-md">
				<RatingInput label="Rating" halfSteps dir="rtl" value={2.5} />
			</div>
		</ComponentCard>

		<ComponentCard description="Ten stars">
			<div class="w-full max-w-md">
				<RatingInput label="Rating" max={10} value={7} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large rating inputs."
			code={`<div class="grid w-full max-w-md gap-6">
	<RatingInput label="Small" size="small" value={3} />
	<RatingInput label="Normal" size="normal" value={3} />
	<RatingInput label="Large" size="large" value={3} />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<RatingInput label="Small" size="small" value={3} />
				<RatingInput label="Normal" size="normal" value={3} />
				<RatingInput label="Large" size="large" value={3} />
			</div>
		</ComponentCard>

		<ComponentCard description="Read-only display">
			<div class="w-full max-w-md">
				<RatingInput label="Rating" readonly halfSteps value={4.5} />
			</div>
		</ComponentCard>

		<ComponentCard description="Disabled">
			<div class="w-full max-w-md">
				<RatingInput label="Rating" disabled value={3} />
			</div>
		</ComponentCard>

		<ComponentCard description="Using type: 'rating' inside a Form">
			<div class="w-full max-w-md">
				<Form
					inputs={{
						rating: {
							type: 'rating',
							label: 'Rating',
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
