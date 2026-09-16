<script lang="ts">
	import Map, { type MapMarker } from '$lib/components/Map/Map.svelte';

	type StationData = {
		line: 'North' | 'South';
	};

	const markers: MapMarker<StationData>[] = [
		{ id: 'oslo', lng: 10.7522, lat: 59.9139, label: 'Oslo', data: { line: 'North' } },
		{ id: 'stockholm', lng: 18.0686, lat: 59.3293, label: 'Stockholm', data: { line: 'North' } },
		{ id: 'copenhagen', lng: 12.5683, lat: 55.6761, label: 'Copenhagen', data: { line: 'South' } }
	];

	const styles = {
		positron: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
	};
</script>

<div class="w-full max-w-3xl">
	<Map
		{markers}
		{styles}
		center={[13.7, 58]}
		zoom={4}
		controls={['zoom-in', 'zoom-out', 'fit-markers']}
		fitMarkersOnMount
		fitMarkersPadding={64}
		class="h-[28rem]"
	/>
</div>
