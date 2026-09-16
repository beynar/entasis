<script lang="ts">
	import Map, { type MapMarker } from '$lib/components/Map/Map.svelte';

	type CampusData = {
		zone: 'north' | 'south';
	};

	const markers: MapMarker<CampusData>[] = [
		{ id: 'gate', lng: 2.295, lat: 48.8738, label: 'North gate', data: { zone: 'north' } },
		{ id: 'studio', lng: 2.301, lat: 48.8672, label: 'Studio', data: { zone: 'south' } },
		{ id: 'warehouse', lng: 2.287, lat: 48.8647, label: 'Warehouse', data: { zone: 'south' } }
	];

	const campusBounds: [[number, number], [number, number]] = [
		[2.276, 48.858],
		[2.313, 48.879]
	];
</script>

<div class="grid w-full max-w-3xl gap-4 md:grid-cols-2">
	<Map
		{markers}
		bounds={campusBounds}
		controls={['zoom-in', 'zoom-out', 'reset']}
		fitMarkersPadding={48}
		class="h-80"
	/>

	<Map
		{markers}
		center={[2.3522, 48.8566]}
		zoom={10}
		fitMarkersOnMount
		fitMarkersPadding={48}
		controls={['zoom-in', 'zoom-out', 'fit-markers']}
		class="h-80"
	/>
</div>
