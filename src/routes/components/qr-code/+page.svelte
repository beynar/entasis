<script lang="ts">
	import QRCode from '$lib/components/QRCode/QRCode.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const sizes = ['small', 'normal', 'large'] as const;
	const colors = ['primary', 'secondary', 'danger', 'success', 'neutral'] as const;
	const value = 'https://svelai.dev';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: [
				{ value: 'neutral', label: 'default' },
				{ value: 'primary', label: 'primary' },
				{ value: 'success', label: 'success' },
				{ value: 'danger', label: 'danger' }
			]
		},
		{
			name: 'moduleStyle',
			type: 'segmented',
			label: 'Modules',
			value: 'square',
			options: ['square', 'rounded', 'circle', 'heart']
		},
		{
			name: 'finderStyle',
			type: 'segmented',
			label: 'Finders',
			value: 'square',
			options: ['square', 'rounded', 'circle']
		}
	]);
	let qr: QRCode;
</script>

<DocPage
	title="QRCode"
	subtitle="Renders a customizable QR code with themed sizes, colors, shapes and downloads."
	component="QRCode"
	features={[
		'Encoded with vendored qrcodegen library',
		'role=img with configurable ariaLabel',
		'SVG, PNG, and JPEG download',
		'Custom module and finder styles',
		'Linear and radial gradient fills'
	]}
>
	<ComponentCard
		{controls}
		description="Default QR code for a URL."
		code={`<QRCode
	value="https://svelai.dev"
	size="${controls.value.size}"
	color="${controls.value.color}"
	dataModulesSettings={{ style: '${controls.value.moduleStyle}' }}
	finderPatternOuterSettings={{ style: '${controls.value.finderStyle}' }}
	finderPatternInnerSettings={{ style: '${controls.value.finderStyle}' }}
/>`}
	>
		<QRCode
			{value}
			size={controls.value.size}
			color={controls.value.color}
			dataModulesSettings={{ style: controls.value.moduleStyle }}
			finderPatternOuterSettings={{ style: controls.value.finderStyle }}
			finderPatternInnerSettings={{ style: controls.value.finderStyle }}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Three size variants: small, normal, and large.">
			{#each sizes as size (size)}
				<QRCode {value} {size} />
			{/each}
		</ComponentCard>

		<ComponentCard description="Themed foreground colors from the design system.">
			{#each colors as color (color)}
				<QRCode {value} {color} size="small" />
			{/each}
		</ComponentCard>

		<ComponentCard description="Custom module styles, finder patterns, and gradient fills.">
			<QRCode
				{value}
				dataModulesSettings={{ style: 'circle', scale: 0.85 }}
				finderPatternOuterSettings={{ style: 'rounded' }}
				finderPatternInnerSettings={{ style: 'circle' }}
			/>
			<QRCode
				{value}
				dataModulesSettings={{ style: 'circuit-board' }}
				finderPatternOuterSettings={{ style: 'circle' }}
				finderPatternInnerSettings={{ style: 'microchip' }}
			/>
			<QRCode
				{value}
				gradient={{
					type: 'linear',
					rotation: 45,
					stops: [
						{ offset: '0%', color: '#6d78d5' },
						{ offset: '100%', color: '#d56d6d' }
					]
				}}
				dataModulesSettings={{ style: 'rounded' }}
				finderPatternOuterSettings={{ style: 'leaf' }}
				finderPatternInnerSettings={{ style: 'leaf' }}
			/>
			<QRCode
				{value}
				color="primary"
				level="H"
				background="white"
				dataModulesSettings={{ style: 'vertical-line' }}
			/>
		</ComponentCard>

		<ComponentCard description="Download the rendered QR as SVG, PNG, or JPEG." class="flex-col">
			<QRCode bind:this={qr} {value} size="large" />
			<div class="flex gap-2">
				<Button size="small" onclick={() => qr.download()}>SVG</Button>
				<Button size="small" onclick={() => qr.download({ format: 'png', dimension: 800 })}>
					PNG
				</Button>
				<Button size="small" onclick={() => qr.download({ format: 'jpeg' })}>JPEG</Button>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
