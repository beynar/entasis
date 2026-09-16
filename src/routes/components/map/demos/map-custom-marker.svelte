<script lang="ts">
	import Map, { type MapMarker, type MapMarkerSnippetArg } from '$lib/components/Map/Map.svelte';

	type OfficeData = {
		team: 'Design' | 'Engineering' | 'Support';
		headcount: number;
	};

	const markers: MapMarker<OfficeData>[] = [
		{
			id: 'london',
			lng: -0.1276,
			lat: 51.5072,
			label: 'London',
			data: { team: 'Design', headcount: 18 }
		},
		{
			id: 'paris',
			lng: 2.3522,
			lat: 48.8566,
			label: 'Paris',
			data: { team: 'Engineering', headcount: 42 }
		},
		{
			id: 'berlin',
			lng: 13.405,
			lat: 52.52,
			label: 'Berlin',
			data: { team: 'Support', headcount: 24 }
		}
	];

	let selectedMarker = $state(markers[1]);

	function getTeamClass(team: OfficeData['team'] | undefined): string {
		switch (team) {
			case 'Design':
				return 'bg-pink-600 text-white ring-pink-600/25';
			case 'Support':
				return 'bg-emerald-600 text-white ring-emerald-600/25';
			default:
				return 'bg-sky-600 text-white ring-sky-600/25';
		}
	}
</script>

<div class="grid w-full max-w-3xl gap-3">
	<Map
		{markers}
		controls={['zoom-in', 'zoom-out', 'fit-markers']}
		center={[6.2, 50.5]}
		zoom={4}
		fitMarkersPadding={64}
		onMarkerClick={(marker) => (selectedMarker = marker)}
		class="h-[28rem]"
	>
		{#snippet marker(arg: MapMarkerSnippetArg<OfficeData>)}
			<button
				type="button"
				class={[
					'focus-visible:ring-primary flex min-w-28 flex-col items-center rounded-lg px-3 py-2 text-xs shadow-lg ring-4 transition-transform outline-none hover:-translate-y-0.5',
					getTeamClass(arg.data?.team)
				]}
				aria-label={`Open ${arg.marker.label}`}
			>
				<span class="font-semibold">{arg.marker.label}</span>
				<span class="opacity-80">{arg.data?.team}</span>
				<span class="font-mono tabular-nums">{arg.data?.headcount}</span>
			</button>
		{/snippet}
	</Map>

	<div class="flex flex-wrap items-center gap-2 text-sm">
		<span class="font-medium">{selectedMarker.label}</span>
		<span class="text-neutral/70">{selectedMarker.data?.team}</span>
		<span class="rounded-md border px-2 py-0.5 text-xs tabular-nums">
			{selectedMarker.data?.headcount} people
		</span>
	</div>
</div>
