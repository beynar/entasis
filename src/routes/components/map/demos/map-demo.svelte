<script lang="ts">
	import Map, {
		type MapClusterSnippetArg,
		type MapMarker,
		type MapMarkerPopupContentArg,
		type MapMarkerSnippetArg,
		type MapMarkerTooltipContentArg
	} from '$lib/components/Map/Map.svelte';

	type OfficeData = {
		team: 'Design' | 'Engineering' | 'Support';
		headcount: number;
	};

	let {
		size = 'normal',
		interactive = true,
		clustered = true
	}: {
		size?: 'small' | 'normal' | 'large';
		interactive?: boolean;
		clustered?: boolean;
	} = $props();

	const markers: MapMarker<OfficeData>[] = [
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
	];

	function getHeadcount(data: OfficeData[]): number {
		return data.reduce((total, office) => total + office.headcount, 0);
	}
</script>

<div class="w-full max-w-3xl">
	<Map
		{markers}
		{size}
		{interactive}
		center={[6.2, 50.5]}
		zoom={4}
		cluster={clustered}
		controls={['zoom-in', 'zoom-out', 'fit-markers']}
		fitMarkersOnMount
		fitMarkersPadding={64}
	>
		{#snippet marker(arg: MapMarkerSnippetArg<OfficeData>)}
			<span
				class="bg-primary text-primary-contrast ring-primary/20 grid size-10 place-items-center rounded-full text-xs font-semibold shadow-md ring-4"
			>
				{arg.data?.team.slice(0, 1)}
			</span>
		{/snippet}

		{#snippet clusterMarker(cluster: MapClusterSnippetArg<OfficeData>)}
			<button
				type="button"
				class="bg-surface ring-primary/25 grid size-14 place-items-center rounded-full text-xs font-medium shadow-md ring-4"
				aria-label={`Cluster of ${cluster.count} offices`}
			>
				<span class="text-base font-semibold tabular-nums">{cluster.count}</span>
				<span class="text-neutral/70 -mt-2 text-[10px]">{getHeadcount(cluster.data)}</span>
			</button>
		{/snippet}

		{#snippet popup(arg: MapMarkerPopupContentArg<OfficeData>)}
			<div class="space-y-1">
				<p class="leading-none font-medium">{arg.marker.label}</p>
				<p class="text-neutral/70">{arg.marker.description}</p>
				<p class="text-xs">{arg.data?.team} / {arg.data?.headcount} people</p>
			</div>
		{/snippet}

		{#snippet tooltip(arg: MapMarkerTooltipContentArg<OfficeData>)}
			<span>{arg.marker.label}: {arg.data?.team}</span>
		{/snippet}
	</Map>
</div>
