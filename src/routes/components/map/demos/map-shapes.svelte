<script lang="ts">
	import Map, { type MapMarker, type MapShape } from '$lib/components/Map/Map.svelte';

	type SiteData = {
		role: 'hub' | 'field';
	};

	const markers: MapMarker<SiteData>[] = [
		{ id: 'hub', lng: 2.3522, lat: 48.8566, label: 'Hub', data: { role: 'hub' } },
		{ id: 'field', lng: 2.393, lat: 48.842, label: 'Field team', data: { role: 'field' } }
	];

	const shapes: MapShape[] = [
		{
			id: 'service-radius',
			type: 'circle',
			center: [2.3522, 48.8566],
			radiusMeters: 1800,
			color: '#2563eb',
			opacity: 0.18
		},
		{
			id: 'delivery-route',
			type: 'polyline',
			coordinates: [
				[2.325, 48.86],
				[2.3522, 48.8566],
				[2.393, 48.842]
			],
			color: '#dc2626',
			width: 3
		},
		{
			id: 'operating-zone',
			type: 'rectangle',
			bounds: [2.31, 48.835, 2.405, 48.875],
			fill: '#16a34a',
			stroke: '#15803d',
			opacity: 0.1
		}
	];
</script>

<div class="w-full max-w-3xl">
	<Map
		{markers}
		{shapes}
		center={[2.36, 48.855]}
		zoom={12}
		controls={['zoom-in', 'zoom-out', 'fit-markers']}
		fitMarkersPadding={56}
		class="h-[28rem]"
	/>
</div>
