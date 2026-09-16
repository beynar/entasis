<script lang="ts">
	import Map, { type MapMarker } from '$lib/components/Map/Map.svelte';

	type PlaceData = {
		kind: 'museum';
	};

	const markers: MapMarker<PlaceData>[] = [
		{
			id: 'copenhagen',
			lng: 12.5683,
			lat: 55.6761,
			label: 'Copenhagen',
			data: { kind: 'museum' }
		}
	];
</script>

<div class="w-full max-w-3xl">
	<Map
		{markers}
		center={[12.5683, 55.6761]}
		zoom={11}
		controls={['zoom-in', 'zoom-out']}
		showAttribution={false}
		class="h-[22rem]"
	/>
</div>
