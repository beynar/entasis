<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { ColorInput } from '$lib/components/Form/ColorInput/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let color = $state<string | null>('#6366f1');
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
	title="Color input"
	subtitle="A form field for picking a color: a swatch and text input that open a full ColorPicker in a popover."
	component="ColorInput"
	features={[
		'Canonical hex value (#rrggbb / #rrggbbaa)',
		'Masked text entry per format (hex auto-#)',
		'hex / rgb / hsl text representations',
		'Full ColorPicker in a popover',
		'Label, validation and errors via the Field wrapper'
	]}
>
	<ComponentCard
		{controls}
		description="A color field with a swatch and picker popover"
		code={`<ColorInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Brand color"
	description="Used for buttons and links across the app."
	bind:value={color}
/>`}
	>
		<div class="w-full max-w-md">
			<ColorInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Brand color"
				description="Used for buttons and links across the app."
				bind:value={color}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<!-- Example 1: Bound value shown live -->
		<ComponentCard
			description="Bind the value and read the canonical hex back live"
			code={`<ColorInput label="Brand color" bind:value={color} />`}
		>
			<div class="w-full max-w-md">
				<ColorInput label="Brand color" bind:value={color} />
				{#if color}
					<p class="text-neutral/70 mt-2 text-xs">Value: {color}</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 2: Format representations -->
		<ComponentCard
			description="The format prop changes the input's text representation — the value stays hex"
			code={`<ColorInput label="Hex" value="#6366f1" format="hex" />
<ColorInput label="RGB" value="#6366f1" format="rgb" />
<ColorInput label="HSL" value="#6366f1" format="hsl" />`}
		>
			<div class="grid w-full max-w-md gap-6">
				<ColorInput label="Hex" value="#6366f1" format="hex" />
				<ColorInput label="RGB" value="#6366f1" format="rgb" />
				<ColorInput label="HSL" value="#6366f1" format="hsl" />
			</div>
		</ComponentCard>

		<!-- Example 3: Sizes -->
		<ComponentCard
			title="Sizes"
			description="Small, normal, and large color inputs."
			code={`<div class="grid w-full max-w-md gap-6">
	<ColorInput label="Small" value="#22c55e" size="small" />
	<ColorInput label="Normal" value="#22c55e" size="normal" />
	<ColorInput label="Large" value="#22c55e" size="large" />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<ColorInput label="Small" value="#22c55e" size="small" />
				<ColorInput label="Normal" value="#22c55e" size="normal" />
				<ColorInput label="Large" value="#22c55e" size="large" />
			</div>
		</ComponentCard>

		<!-- Example 4: Required / validation -->
		<ComponentCard
			description="Required marks the field and validates against a non-empty color"
			code="<ColorInput label=&quot;Accent color&quot; required />"
		>
			<div class="w-full max-w-md">
				<ColorInput label="Accent color" required />
			</div>
		</ComponentCard>

		<!-- Example 5: Disabled -->
		<ComponentCard
			description="Disabled locks the swatch, input and picker"
			code="<ColorInput label=&quot;Locked&quot; value=&quot;#ef4444&quot; disabled />"
		>
			<div class="w-full max-w-md">
				<ColorInput label="Locked" value="#ef4444" disabled />
			</div>
		</ComponentCard>

		<!-- Example 6: Inside a Form -->
		<ComponentCard
			description="Using type: 'color' inside a Form"
			code={`<Form
	inputs={{
		brandColor: { type: 'color', label: 'Theme color', required: true }
	}}
	onSubmit={(data) => console.log(data)}
/>`}
		>
			<div class="w-full max-w-md">
				<Form
					inputs={{
						brandColor: {
							type: 'color',
							label: 'Theme color',
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
