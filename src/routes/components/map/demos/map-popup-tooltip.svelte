<script lang="ts">
	import Map, { type MapMarker } from '$lib/components/Map/Map.svelte';

	type VenueData = {
		capacity: number;
		status: 'open' | 'renovating';
	};

	const markers: MapMarker<VenueData>[] = [
		{
			id: 'arena',
			lng: -73.9934,
			lat: 40.7505,
			label: '<strong>Arena</strong>',
			description: 'Main event floor',
			popup:
				'<p class="font-medium leading-none">Arena</p><p class="mt-1 text-neutral/70">Main event floor</p><p class="mt-2 text-xs">18,000 seats / open</p>',
			tooltip: '<span>Arena is open</span>',
			data: { capacity: 18000, status: 'open' }
		},
		{
			id: 'gallery',
			lng: -73.9776,
			lat: 40.7614,
			label: '<strong>Gallery</strong>',
			description: 'Private reception rooms',
			popup:
				'<p class="font-medium leading-none">Gallery</p><p class="mt-1 text-neutral/70">Private reception rooms</p><p class="mt-2 text-xs">420 guests / renovating</p>',
			tooltip: '<span>Gallery is renovating</span>',
			data: { capacity: 420, status: 'renovating' }
		}
	];
</script>

<div class="w-full max-w-3xl">
	<Map
		{markers}
		center={[-73.985, 40.756]}
		zoom={13}
		controls={['zoom-in', 'zoom-out', 'fit-markers']}
		fitMarkersPadding={64}
		class="h-[28rem]"
	/>
</div>
