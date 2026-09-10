<script lang="ts">
	import { Card } from '$lib/components/Card/index.js';
	import { Map, type MapMarker } from '$lib/components/Map/index.js';

	const offices: MapMarker[] = [
		{
			id: 'paris',
			lng: 2.3522,
			lat: 48.8566,
			label: 'Paris',
			description: 'Engineering hub'
		},
		{
			id: 'london',
			lng: -0.1276,
			lat: 51.5072,
			label: 'London',
			description: 'Design studio'
		},
		{
			id: 'berlin',
			lng: 13.405,
			lat: 52.52,
			label: 'Berlin',
			description: 'Support team'
		}
	];
</script>

<div class="grid gap-lg">
	<h2 class="text-xl font-semibold">Map card</h2>
	<Card variant="solid" showBorders>
		{#snippet title()}European offices{/snippet}
		{#snippet description()}Three active product and operations hubs.{/snippet}
		<Map
			markers={offices}
			size="small"
			center={[6.2, 50.5]}
			zoom={4}
			controls={['zoom-in', 'zoom-out', 'fit-markers']}
			fitMarkersOnMount
			fitMarkersPadding={48}
			showAttribution={false}
		/>
	</Card>
</div>
