<script lang="ts">
	import Map, { type MapMarker } from '$lib/components/Map/Map.svelte';

	type StopData = {
		line: 'A' | 'B' | 'C';
		passengers: number;
	};

	const markers: MapMarker<StopData>[] = [
		{
			id: 'opera',
			lng: 2.3316,
			lat: 48.8701,
			label: 'Opera',
			data: { line: 'A', passengers: 126 }
		},
		{
			id: 'madeleine',
			lng: 2.3266,
			lat: 48.8698,
			label: 'Madeleine',
			data: { line: 'A', passengers: 94 }
		},
		{
			id: 'vendome',
			lng: 2.3296,
			lat: 48.8675,
			label: 'Vendome',
			data: { line: 'A', passengers: 72 }
		},
		{
			id: 'louvre',
			lng: 2.3376,
			lat: 48.8606,
			label: 'Louvre',
			data: { line: 'B', passengers: 138 }
		},
		{
			id: 'palais-royal',
			lng: 2.3364,
			lat: 48.8626,
			label: 'Palais Royal',
			data: { line: 'B', passengers: 85 }
		},
		{
			id: 'chatelet',
			lng: 2.347,
			lat: 48.8583,
			label: 'Chatelet',
			data: { line: 'B', passengers: 163 }
		},
		{
			id: 'republique',
			lng: 2.3631,
			lat: 48.8675,
			label: 'Republique',
			data: { line: 'C', passengers: 117 }
		},
		{
			id: 'temple',
			lng: 2.3609,
			lat: 48.8665,
			label: 'Temple',
			data: { line: 'C', passengers: 44 }
		},
		{
			id: 'bastille',
			lng: 2.369,
			lat: 48.853,
			label: 'Bastille',
			data: { line: 'C', passengers: 101 }
		},
		{
			id: 'arsenal',
			lng: 2.3669,
			lat: 48.8492,
			label: 'Arsenal',
			data: { line: 'C', passengers: 31 }
		},
		{
			id: 'montparnasse',
			lng: 2.3212,
			lat: 48.8421,
			label: 'Montparnasse',
			data: { line: 'A', passengers: 152 }
		},
		{
			id: 'raspail',
			lng: 2.3305,
			lat: 48.8391,
			label: 'Raspail',
			data: { line: 'A', passengers: 66 }
		}
	];
</script>

<div class="w-full max-w-3xl">
	<Map
		{markers}
		center={[2.346, 48.858]}
		zoom={11}
		cluster={{ enabled: true, radius: 72, maxZoom: 14, zoomOnClick: true }}
		controls={['zoom-in', 'zoom-out', 'fit-markers']}
		fitMarkersPadding={56}
		class="h-[28rem]"
	/>
</div>
