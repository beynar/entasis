<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { Slider } from '$lib/components/Form/Slider/index.js';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let volume = $state<number | null>(40);
	let storage = $state<number | null>(120);
	let priority = $state<number | null>(3);
	let opacity = $state<number | null>(0.65);
	let backgroundGlow = $state<number | null>(0.5);
	let cursorRadius = $state<number | null>(1.15);
	let bloomIntensity = $state<number | null>(0.75);
	let temperature = $state<number | null>(22);
	let priceRange = $state<number[] | null>([25, 75]);
	let comfortRange = $state<number[] | null>([18, 24]);
	let distribution = $state<number[] | null>([20, 50, 80]);
	let verticalValue = $state<number | null>(60);

	const semanticColors = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'] as const;
	const sizeLabels = {
		small: 'Small',
		normal: 'Normal',
		large: 'Large'
	} as const;
	const formatColorLabel = (color: (typeof semanticColors)[number]) =>
		`${color[0].toUpperCase()}${color.slice(1)} intensity`;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'default',
			options: ['default', 'thick', 'contained']
		},
		{
			name: 'orientation',
			type: 'segmented',
			label: 'Orientation',
			value: 'horizontal',
			options: ['horizontal', 'vertical']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

<DocPage
	title="Slider"
	subtitle="Numeric selection with single-thumb, range, multi-thumb, vertical, and draggable range modes."
	component="Slider"
	features={[
		'ARIA slider thumbs',
		'Scalar or range values',
		'Default, thick, and contained variants',
		'Vertical orientation',
		'Draggable selected range'
	]}
>
	<ComponentCard
		{controls}
		description="A bounded numeric field with an inline value chip and helper text"
		code={`<Slider
	size="${controls.value.size}"
	variant="${controls.value.variant}"
	orientation="${controls.value.orientation}"
	disabled={${controls.value.disabled}}
	label="Volume"
	description="Set the default output level."
	bind:value={volume}
	min={0}
	max={100}
	step={5}
	showValue
/>`}
	>
		<div class="w-full max-w-md">
			<Slider
				size={controls.value.size}
				variant={controls.value.variant}
				orientation={controls.value.orientation}
				disabled={controls.value.disabled}
				label="Volume"
				description="Set the default output level."
				bind:value={volume}
				min={0}
				max={100}
				step={5}
				showValue
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Format the displayed value and aria-valuetext"
			code={`<Slider
	label="Storage"
	bind:value={storage}
	min={10}
	max={500}
	step={10}
	showValue
	formatValue={(value) => \`\${value} GB\`}
/>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<Slider
					label="Storage"
					bind:value={storage}
					min={10}
					max={500}
					step={10}
					showValue
					formatValue={(value) => `${value} GB`}
				/>
				<Slider
					label="Opacity"
					bind:value={opacity}
					min={0}
					max={1}
					step={0.05}
					showValue
					formatValue={(value) => `${Math.round(value * 100)}%`}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Range values render two thumbs; dragRange lets the selected segment move as a unit"
			code={`<Slider
	mode="range"
	label="Budget"
	bind:value={priceRange}
	min={0}
	max={100}
	step={5}
	minStepsBetweenThumbs={2}
	dragRange
	showValue
	formatValue={(value) => \`$\${value}k\`}
/>`}
		>
			<div class="w-full max-w-md">
				<Slider
					mode="range"
					label="Budget"
					bind:value={priceRange}
					min={0}
					max={100}
					step={5}
					minStepsBetweenThumbs={2}
					dragRange
					showValue
					formatValue={(value) => `$${value}k`}
					thumbLabels={['Minimum budget', 'Maximum budget']}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Vertical orientation keeps the same value model and keyboard behavior"
			code={`<Slider
	orientation="vertical"
	label="Output"
	bind:value={verticalValue}
	min={0}
	max={100}
	step={10}
	marks={[
		{ value: 0, label: '0' },
		{ value: 50, label: '50' },
		{ value: 100, label: '100' }
	]}
	showValue
/>`}
		>
			<div class="flex min-h-80 w-full items-center justify-center">
				<Slider
					orientation="vertical"
					label="Output"
					bind:value={verticalValue}
					min={0}
					max={100}
					step={10}
					marks={[
						{ value: 0, label: '0' },
						{ value: 50, label: '50' },
						{ value: 100, label: '100' }
					]}
					showValue
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Three or more thumbs are supported when the value is an array"
			code={`<Slider
	label="Distribution"
	bind:value={distribution}
	min={0}
	max={100}
	step={5}
	thumbs={3}
	showValue
/>`}
		>
			<div class="w-full max-w-md">
				<Slider
					label="Distribution"
					bind:value={distribution}
					min={0}
					max={100}
					step={5}
					thumbs={3}
					showValue
					thumbLabels={['Lower split', 'Middle split', 'Upper split']}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Render semantic marks below the track"
			code={`<Slider
	label="Priority"
	bind:value={priority}
	min={1}
	max={5}
	step={1}
	marks={[
		{ value: 1, label: 'Low' },
		{ value: 3, label: 'Medium' },
		{ value: 5, label: 'High' }
	]}
	showValue
/>`}
		>
			<div class="w-full max-w-md">
				<Slider
					label="Priority"
					bind:value={priority}
					min={1}
					max={5}
					step={1}
					marks={[
						{ value: 1, label: 'Low' },
						{ value: 3, label: 'Medium' },
						{ value: 5, label: 'High' }
					]}
					showValue
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large sliders."
			code={`{#each ['small', 'normal', 'large'] as size}
	<Slider
		{size}
		label={sizeLabels[size]}
		value={temperature}
		min={16}
		max={30}
		step={1}
		showValue
		formatValue={(value) => \`\${value} deg C\`}
	/>
{/each}`}
		>
			<div class="grid w-full max-w-md gap-6">
				{#each sizes as size (size)}
					<Slider
						{size}
						label={sizeLabels[size]}
						value={temperature}
						min={16}
						max={30}
						step={1}
						showValue
						formatValue={(value) => `${value} deg C`}
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Contained"
			description="An input-like rail keeps the label, scale, current value, and pointer target in one compact control."
			code={`<div class="grid gap-2">
	<Slider
		variant="contained"
		size="small"
		label="Background glow"
		bind:value={backgroundGlow}
		min={0}
		max={3}
		step={0.1}
		showValue
		formatValue={(value) => value.toFixed(1)}
	/>
	<Slider
		variant="contained"
		size="normal"
		label="Cursor radius"
		bind:value={cursorRadius}
		min={0}
		max={2}
		step={0.05}
		showValue
		formatValue={(value) => Number(value.toFixed(2)).toString()}
	/>
	<Slider
		variant="contained"
		size="large"
		label="Bloom intensity"
		bind:value={bloomIntensity}
		min={0}
		max={1}
		step={0.05}
		showValue
		formatValue={(value) => Number(value.toFixed(2)).toString()}
	/>
</div>`}
		>
			<div class="grid w-full max-w-xl gap-2">
				<Slider
					variant="contained"
					size="small"
					label="Background glow"
					bind:value={backgroundGlow}
					min={0}
					max={3}
					step={0.1}
					showValue
					formatValue={(value) => value.toFixed(1)}
				/>
				<Slider
					variant="contained"
					size="normal"
					label="Cursor radius"
					bind:value={cursorRadius}
					min={0}
					max={2}
					step={0.05}
					showValue
					formatValue={(value) => Number(value.toFixed(2)).toString()}
				/>
				<Slider
					variant="contained"
					size="large"
					label="Bloom intensity"
					bind:value={bloomIntensity}
					min={0}
					max={1}
					step={0.05}
					showValue
					formatValue={(value) => Number(value.toFixed(2)).toString()}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Thick variant: small, normal, large"
			code={`<div class="grid gap-6">
	{#each ['small', 'normal', 'large'] as size}
		<Slider variant="thick" {size} label={sizeLabels[size]} />
	{/each}
</div>

<div class="flex min-h-80 w-full items-center justify-center">
	<Slider
		variant="thick"
		orientation="vertical"
		label="Temperature (vertical)"
		value={temperature}
		min={16}
		max={30}
		step={1}
		showValue
		formatValue={(value) => \`\${value} deg C\`}
	/>
</div>`}
		>
			<div class="grid w-full max-w-md gap-8">
				<div class="grid gap-6">
					{#each sizes as size (size)}
						<Slider
							variant="thick"
							{size}
							label={sizeLabels[size]}
							value={temperature}
							min={16}
							max={30}
							step={1}
							showValue
							formatValue={(value) => `${value} deg C`}
						/>
					{/each}
				</div>
				<div class="flex min-h-80 w-full items-center justify-center">
					<Slider
						variant="thick"
						orientation="vertical"
						label="Temperature (vertical)"
						value={temperature}
						min={16}
						max={30}
						step={1}
						showValue
						formatValue={(value) => `${value} deg C`}
					/>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="Semantic colors">
			<div class="grid w-full max-w-md gap-6">
				{#each semanticColors as color (color)}
					<Slider {color} label={formatColorLabel(color)} value={60} min={0} max={100} showValue />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Disabled state">
			<div class="w-full max-w-md">
				<Slider
					label="Locked threshold"
					description="Disabled sliders keep their submitted value but block interaction."
					value={72}
					min={0}
					max={100}
					showValue
					disabled
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Use type: 'slider-range' inside a Form when the submitted value must be an array"
			code={`<Form
	inputs={{
		compressedRange: {
			type: 'slider-range',
			label: 'Comfort band',
			description: 'Submitted as number[].',
			value: [18, 24],
			min: 12,
			max: 32,
			step: 1,
			dragRange: true,
			showValue: true,
			formatValue: (value) => \`\${value} deg C\`
		}
	}}
/>`}
		>
			<div class="w-full max-w-md">
				<Form
					inputs={{
						comfortRange: {
							type: 'slider-range',
							label: 'Comfort band',
							value: comfortRange,
							min: 12,
							max: 32,
							step: 1,
							dragRange: true,
							showValue: true,
							description: 'Submitted as number[].',
							formatValue: (value) => `${value} deg C`
						}
					}}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
