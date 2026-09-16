<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { ColorPicker, ColorPickerInput } from '$lib/components/Form/ColorPicker/index.js';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let color = $state('#6366f1');
	let alphaColor = $state('#22c55e80');
	let lastChange = $state('');
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
	title="Color picker"
	subtitle="A standalone color picker panel: a saturation/brightness square, hue and alpha sliders, an eyedropper, and a format-aware text input."
	component="ColorPicker"
	features={[
		'Canonical hex output (#rrggbb / #rrggbbaa)',
		'Hue and saturation preserved while dragging to black or white',
		'Native eyedropper where supported (SSR-safe)',
		{ label: 'Keyboard-driven role="slider" thumbs', test: 'a11y:color-picker.slider-thumbs' },
		'hex / rgb / hsl text representations'
	]}
>
	<ComponentCard
		{controls}
		description="A color picker field with a label and description"
		code={`<ColorPickerInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Brand color"
	description="Used for buttons and links across the app"
	bind:value={color}
/>`}
	>
		<div class="w-full max-w-md">
			<ColorPickerInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Brand color"
				description="Used for buttons and links across the app"
				bind:value={color}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<!-- Example 1: Bound value shown live -->
		<ComponentCard
			description="Bind the value and read the canonical hex back live"
			code={`<ColorPicker bind:value={color} />
<p>Value: {color}</p>`}
		>
			<div class="flex flex-col items-center gap-3">
				<ColorPicker bind:value={color} />
				<div class="flex items-center gap-2 text-sm">
					<span class="border-neutral-muted size-5 rounded border" style="background-color: {color}"
					></span>
					<code class="font-mono">{color}</code>
				</div>
			</div>
		</ComponentCard>

		<!-- Example 2: Alpha -->
		<ComponentCard
			description="Colors with alpha below 1 are emitted as #rrggbbaa"
			code="<ColorPicker value=&quot;#22c55e80&quot; />"
		>
			<div class="flex flex-col items-center gap-3">
				<ColorPicker bind:value={alphaColor} />
				<code class="font-mono text-sm">{alphaColor}</code>
			</div>
		</ComponentCard>

		<!-- Example 3: Format variants -->
		<ComponentCard
			description="The format prop changes only the text representation — the bound value stays hex"
			code={`<ColorPicker value="#6366f1" format="hex" />
<ColorPicker value="#6366f1" format="rgb" />
<ColorPicker value="#6366f1" format="hsl" />`}
		>
			<div class="flex flex-wrap items-start justify-center gap-6">
				<ColorPicker value="#6366f1" format="hex" />
				<ColorPicker value="#6366f1" format="rgb" />
				<ColorPicker value="#6366f1" format="hsl" />
			</div>
		</ComponentCard>

		<!-- Example 4: Sizes -->
		<ComponentCard
			description="Small, normal and large sizes scale the panel, sliders and text"
			code={`<ColorPicker value="#f59e0b" size="small" />
<ColorPicker value="#f59e0b" size="normal" />
<ColorPicker value="#f59e0b" size="large" />`}
		>
			<div class="flex flex-wrap items-start justify-center gap-6">
				<ColorPicker value="#f59e0b" size="small" />
				<ColorPicker value="#f59e0b" size="normal" />
				<ColorPicker value="#f59e0b" size="large" />
			</div>
		</ComponentCard>

		<!-- Example 5: Disabled -->
		<ComponentCard
			description="Disabled dims the panel and blocks every control"
			code="<ColorPicker value=&quot;#ef4444&quot; disabled />"
		>
			<ColorPicker value="#ef4444" disabled />
		</ComponentCard>

		<!-- Example 6: onValueChange logging -->
		<ComponentCard
			description="onValueChange fires on every committed change, including continuously while dragging"
			code={`<ColorPicker value="#3b82f6" onValueChange={(hex) => console.log(hex)} />`}
		>
			<div class="flex flex-col items-center gap-3">
				<ColorPicker value="#3b82f6" onValueChange={(hex) => (lastChange = hex)} />
				<p class="text-neutral/70 text-xs">
					Last change: <code class="font-mono">{lastChange || '—'}</code>
				</p>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
