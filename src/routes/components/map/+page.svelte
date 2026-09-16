<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import MapDemo from './demos/map-demo.svelte';
	import MapClustersDemo from './demos/map-clusters.svelte';
	import MapPopupTooltipDemo from './demos/map-popup-tooltip.svelte';
	import MapCustomMarkerDemo from './demos/map-custom-marker.svelte';
	import MapCustomControlsDemo from './demos/map-custom-controls.svelte';
	import MapCustomStyleDemo from './demos/map-custom-style.svelte';
	import MapGeolocationDemo from './demos/map-geolocation.svelte';
	import MapShapesDemo from './demos/map-shapes.svelte';
	import MapViewportDemo from './demos/map-viewport.svelte';
	import MapAttributionDemo from './demos/map-attribution.svelte';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{ name: 'clustered', type: 'switch', label: 'Clusters', value: true },
		{ name: 'interactive', type: 'switch', label: 'Interactive', value: true }
	]);
</script>

<DocPage
	title="Map"
	subtitle="An interactive vector map built on MapLibre GL — markers, clustering, shapes, popups, tooltips, geolocation and controls. MapLibre loads from a CDN at runtime and is never bundled. The base style is generated from your design tokens, so the map adapts to light and dark automatically."
	component="Map"
>
	<ComponentCard
		{controls}
		title="Basic"
		description="Markers, popups, tooltips and the default control cluster. Drag to pan, scroll to zoom."
		class="!min-h-fit !items-stretch !justify-start"
		code={`<Map
	size="${controls.value.size}"
	interactive={${controls.value.interactive}}
	cluster={${controls.value.clustered}}
	markers={[
		{
			id: 'paris',
			lng: 2.3522,
			lat: 48.8566,
			label: 'Paris',
			description: 'European engineering hub',
			data: { team: 'Engineering', headcount: 42 }
		},
		{
			id: 'la-defense',
			lng: 2.238,
			lat: 48.892,
			label: 'La Defense',
			description: 'Product team',
			data: { team: 'Design', headcount: 16 }
		},
		{
			id: 'saint-denis',
			lng: 2.357,
			lat: 48.936,
			label: 'Saint-Denis',
			description: 'Operations team',
			data: { team: 'Support', headcount: 21 }
		},
		{
			id: 'london',
			lng: -0.1276,
			lat: 51.5072,
			label: 'London',
			description: 'Product design studio',
			data: { team: 'Design', headcount: 18 }
		},
		{
			id: 'berlin',
			lng: 13.405,
			lat: 52.52,
			label: 'Berlin',
			description: 'Customer support team',
			data: { team: 'Support', headcount: 24 }
		}
	]}
	center={[6.2, 50.5]}
	zoom={4}
	controls={['zoom-in', 'zoom-out', 'fit-markers']}
	fitMarkersOnMount
	fitMarkersPadding={64}
>
	{#snippet marker(arg)}
		<span class="grid size-10 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-contrast shadow-md ring-4 ring-primary/20">
			{arg.data?.team.slice(0, 1)}
		</span>
	{/snippet}

	{#snippet clusterMarker(cluster)}
		<button
			type="button"
			class="grid size-14 place-items-center rounded-full bg-surface text-xs font-medium shadow-md ring-4 ring-primary/25"
			aria-label={\`Cluster of \${cluster.count} offices\`}
		>
			<span class="text-base font-semibold tabular-nums">{cluster.count}</span>
		</button>
	{/snippet}

	{#snippet popup(arg)}
		<div class="space-y-1">
			<p class="font-medium leading-none">{arg.marker.label}</p>
			<p class="text-neutral/70">{arg.marker.description}</p>
			<p class="text-xs">{arg.data?.team} / {arg.data?.headcount} people</p>
		</div>
	{/snippet}

	{#snippet tooltip(arg)}
		<span>{arg.marker.label}: {arg.data?.team}</span>
	{/snippet}
</Map>`}
	>
		<MapDemo
			size={controls.value.size}
			interactive={controls.value.interactive}
			clustered={controls.value.clustered}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Clustering"
			description="Nearby markers collapse into count badges that expand on click; hovering a cluster outlines its hull."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<MapClustersDemo />
		</ComponentCard>

		<ComponentCard
			title="Popups & tooltips"
			description="Click a marker for a popover; hover for a tooltip. Content can be a string, HTML label, or a snippet."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<MapPopupTooltipDemo />
		</ComponentCard>

		<ComponentCard
			title="Custom markers"
			description="Replace the default pin with a marker snippet that receives the marker, its data and the map."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<MapCustomMarkerDemo />
		</ComponentCard>

		<ComponentCard
			title="Custom controls"
			description="Render your own control buttons via the controlButton snippet while the map wires the actions."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<MapCustomControlsDemo />
		</ComponentCard>

		<ComponentCard
			title="Custom style"
			description="Point the map at your own MapLibre style URLs per colour scheme with the styles prop."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<MapCustomStyleDemo />
		</ComponentCard>

		<ComponentCard
			title="Geolocation"
			description="Locate the user on demand (or watch continuously) and render a custom user-location marker."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<MapGeolocationDemo />
		</ComponentCard>

		<ComponentCard
			title="Shapes"
			description="Draw circles, polylines, polygons and rectangles alongside markers."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<MapShapesDemo />
		</ComponentCard>

		<ComponentCard
			title="Viewport"
			description="Fit the map to explicit bounds and react to view changes."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<MapViewportDemo />
		</ComponentCard>

		<ComponentCard
			title="Attribution"
			description="The attribution control can be toggled with showAttribution."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<MapAttributionDemo />
		</ComponentCard>
	{/snippet}
</DocPage>
