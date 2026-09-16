<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { Globe, type GlobeScrollTo } from '$lib/components/Globe/index.js';

	let goTo = $state<GlobeScrollTo>();
	const controls = createComponentControls([
		{
			name: 'baseColor',
			type: 'segmented',
			label: 'Land',
			value: 'primary',
			options: ['primary', 'success', 'info', 'neutral']
		},
		{
			name: 'autoRotate',
			type: 'slider',
			label: 'Speed',
			value: 0.3,
			min: 0,
			max: 1,
			step: 0.1,
			showValue: true,
			variant: 'contained',
			class: 'w-44'
		},
		{ name: 'draggable', type: 'switch', label: 'Drag', value: true }
	]);

	const cities: { label: string; coords: [number, number] }[] = [
		{ label: 'Paris', coords: [48.85, 2.35] },
		{ label: 'New York', coords: [40.71, -74.0] },
		{ label: 'Tokyo', coords: [35.68, 139.65] },
		{ label: 'Sydney', coords: [-33.87, 151.21] }
	];
</script>

<DocPage
	title="Globe"
	subtitle="An interactive, theme-aware WebGL globe."
	component="Globe"
	features={[
		'Auto-rotating and draggable',
		'Theme-token or RGB colors',
		'bind:scrollTo to fly to a coordinate',
		'Custom markers, offset, and size'
	]}
>
	<ComponentCard
		{controls}
		description="Drag to rotate. Auto-rotates when idle."
		code={`<Globe
	baseColor="${controls.value.baseColor}"
	autoRotate={${controls.value.autoRotate}}
	draggable={${controls.value.draggable}}
/>`}
	>
		<Globe
			baseColor={controls.value.baseColor}
			autoRotate={controls.value.autoRotate}
			draggable={controls.value.draggable}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Bind scrollTo and fly to a city.">
			<div class="flex flex-col items-center gap-4">
				<Globe bind:scrollTo={goTo} class="size-[320px]" />
				<div class="flex flex-wrap justify-center gap-2">
					{#each cities as city, index (index)}
						<Button
							size="small"
							variant="outline"
							color="neutral"
							onclick={() => goTo?.(...city.coords)}
						>
							{city.label}
						</Button>
					{/each}
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="Custom colors and a single marker.">
			<Globe
				class="size-[320px]"
				baseColor="success"
				glowColor="success"
				markerColor="neutral"
				markers={[{ location: [48.85, 2.35], size: 0.12 }]}
				autoRotate={0.6}
			/>
		</ComponentCard>
	{/snippet}
</DocPage>
